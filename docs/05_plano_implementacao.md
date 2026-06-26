# SimplifiCAR — Plano de Implementação

> Plano de execução do MVP do haCARthon (Desafio 2 / CAR). Pende dos Docs 0–4.
> Marque `[x]` ao concluir. Princípio de corte: **base sólida** primeiro, **cereja** só depois;
> se faltar tempo, corta a cereja de cima para baixo (sempre há demo funcional).

## Estado atual (já concluído antes do código)

- [x] Repo inicializado (git, estrutura `backend/ frontend/ pipeline/ data/`), `CLAUDE.md`, `.gitignore`.
- [x] Dados de teste colhidos e organizados localmente (ver Doc 4 e READMEs em `data/`):
  - `data/raw/` — 11 imóveis do ambiente DataPrev: diagnóstico oficial (JSON), geometria (GeoJSON), `.RET` (completo+simplificado), fichas. Casos de demo 🟢`MG-3127008` / 🔴`CE-2313302` / ⚫ déficit `CE-2300705`,`PR-4110201`.
  - `data/shapefiles/DF/` — DF completo, 6 camadas (SIRGAS 2000) + dicionário.
  - `data/mapbiomas/DF_mapbiomas_col10_2024.tif` — cobertura do solo (vegetação real).
- [x] Pipeline Python bootstrapado: `pipeline/.venv` (rasterio, geopandas, shapely, rasterstats).
- [x] **Cadeia de cálculo comprovada** (`pipeline/proof_chain.py`): RL declarada × MapBiomas → déficit/excedente, validada contra o número oficial do SICAR.
- [x] Mapa da API da Central e formato `.RET` (ZIP de JSON + GeoJSON) documentados (Doc 4).

## Status da implementação (MVP scaffoldado e verificado end-to-end)

Contrato congelado das 3 camadas: `docs/07_contrato_mvp.md`. Stack local: PostGIS (docker, **host 55432**) + NestJS (3012) + Angular (4200). Fluxo do vídeo provado com dados reais via Playwright (Abertura → consulta excedente/déficit → Painel mapa+selo+texto_ia → login mock → marketplace → match). Comandos no `CLAUDE.md`.

- **FASE 1** `[PARCIAL]` — schema PostGIS + seed direto dos **4 imóveis-demo** de `data/raw` (✅ tira o demo do caminho crítico). `pipeline/calc_diagnostico.py` feito; **ingest do DF inteiro (`ingest_sicar.py`) NÃO feito** (Consulta Rápida em escala fica pra depois; o demo não depende).
- **FASE 2** `[x]` Backend NestJS — `GET /propriedades/:cod`, `GET /diagnosticos/:id`, DTOs, CORS. Verificado contra DB vivo (200 + 404).
- **FASE 3** `[x]` Frontend Angular — Leaflet acendendo camadas + score grande. Painel data-driven (adapta excedente×déficit).
- **FASE 4** `[x]` `texto_ia` pré-gerado no banco p/ os 4 imóveis (heróis MG + CE-2300705 caprichados); painel lê do banco.
- **FASE 5** `[x]` Login gov.br mock atrás de `IdentityProvider`; cai no painel/rota.
- **FASE 6** `[x]` Marketplace — ofertas venda/arrendamento + filtro bioma + `POST /match`. Verificado (6 ofertas, match 201).
- **FASE 7** `[PARCIAL]` Análise Completa — parser `.RET` do backend validado contra `CE-2313302` real (RL 1,81 ha bate); tela de upload no front; **falta** o teste de upload pela UI ponta-a-ponta.
- **FASE 8** `[PARCIAL]` Retificação — endpoint `POST /diagnosticos/:id/retificacao` (minuta templada dos números); sem montagem do arquivo final.

## Decisões técnicas firmadas

- **Demo = slides + vídeo pré-gravado.** Nada roda ao vivo no palco. O MVP só precisa funcionar durante a gravação; objetivo do plano = MVP funcional pronto pra gravar.
- **IA é pré-gerada no banco, não em runtime.** O texto de diagnóstico é escrito por Claude offline e gravado em `diagnostico.texto_ia`; o app só lê do banco. Sem chave de API, sem chamada ao vivo, sem tmux/sessão. (Se um dia quiser ao vivo: `claude -p --resume --output-format json` ou a API, atrás de uma interface trocável.)
- **Geo pesado roda offline** (pipeline Python) e popula o PostGIS; runtime só faz lookup.
- **`.CAR`/`.RET` = ZIP de JSON com geometria GeoJSON** → parse trivial (Análise Completa viável).
- **RL real** = vegetação nativa (MapBiomas, classes 3,4,5,6,49,11,12,32,29,13,50) ∩ polígono de RL.
- **RL exigida** = % do bioma × área (DF/demais = 20%; Amazônia Legal 80% floresta / 35% cerrado).
- Áreas calculadas reprojetando para **EPSG:5880** (equal-area); dados em **EPSG:4674** (SIRGAS 2000).
- Antes de qualquer escolha de deploy/porta/nginx/PM2/banco: ler `../VPS_GUIDE.md`.

---

## FASE 1 — Pipeline → PostGIS (base do "cérebro") `[BASE]`

Objetivo: um município/UF (DF) inteiro no PostGIS com diagnóstico já calculado por imóvel.

- [ ] Subir PostgreSQL 16 + PostGIS (docker-compose; seguir VPS_GUIDE para portas/credenciais).
- [ ] Criar schema (Doc 2 §5): `usuario`, `propriedade`, `diagnostico`, `pendencia`, `oferta`, `match`. Geometria `geometry(MultiPolygon, 4674)`, índice GIST + índice em `cod_imovel`.
- [ ] `pipeline/ingest_sicar.py`: ler shapefiles do DF (`AREA_IMOVEL`, `RESERVA_LEGAL`, `APP`, `VEGETACAO_NATIVA`, `AREA_CONSOLIDADA`, `HIDROGRAFIA`), gravar `propriedade` (geom, area_ha, status, municipio, bioma).
- [ ] `pipeline/calc_diagnostico.py`: por `cod_imovel`, calcular `rl_exigida`, `rl_real` (∩ MapBiomas), `app_ha`, `area_consolidada_ha`, `deficit_ha`/`excedente_ha`, `score` (0–100). Gravar `diagnostico`. Reusar lógica de `proof_chain.py`.
- [ ] Simplificar geometria (`ST_SimplifyPreserveTopology`) para o mapa não travar.
- **Aceite:** `SELECT` por `cod_imovel` devolve geometria + diagnóstico; números conferem com o demonstrativo oficial (gabarito em `data/raw/demonstrativos/`).

## FASE 2 — Backend NestJS / Consulta Rápida `[BASE]`

- [ ] Scaffold NestJS modular + conexão PostGIS (TypeORM/Prisma com suporte a geometria, ou query SQL crua).
- [ ] `GET /propriedades/:codImovel` → geometria (GeoJSON) + diagnóstico calculado.
- [ ] `GET /diagnosticos/:propriedadeId` → score, números, (placeholder do texto IA).
- [ ] DTOs com validação; CORS p/ o front.
- **Aceite:** `curl` por um `cod_imovel` do DF devolve JSON com polígonos e score, instantâneo.

## FASE 3 — Frontend Angular / mapa + score `[BASE]` ← já é demo apresentável

- [ ] Scaffold Angular (standalone, signals) + Leaflet ou MapLibre.
- [ ] Tela de captura: campo "número do CAR" (Consulta Rápida).
- [ ] Painel da propriedade: mapa acendendo camadas (perímetro, APP, RL, déficit em vermelho), **score grande**.
- [ ] Consumir a API da Fase 2.
- **Aceite:** digitar um `cod_imovel` → mapa acende + score aparece. **Este é o piso do demo.**

## FASE 4 — Diagnóstico em linguagem simples (texto pré-gerado offline) `[BASE]`

Objetivo: cada imóvel do demo tem um texto de diagnóstico em português simples, escrito por Claude **offline** e guardado no banco. Nenhuma chamada de IA em runtime.

- [ ] `pipeline/gerar_texto_ia.py`: para cada imóvel do demo, montar prompt com os números do diagnóstico (RL exigida/real, déficit/excedente, APP a recompor, pendências) e pedir ao Claude que você já tem (`claude -p --output-format json`, ou manual) o texto: "o que falta, o que fazer, o gancho" (excedente que vale X / déficit de Y ha → recuperar, comprar cota ou alugar). Regra: a IA explica/redige, **não recalcula nem inventa números**.
- [ ] Gravar o resultado em `diagnostico.texto_ia` (caprichar nos 2–3 imóveis que entram no vídeo: 🟢 verde e 🔴 vermelho).
- [ ] Backend `GET /diagnosticos/:propriedadeId` devolve `texto_ia` direto do banco; painel exibe.
- [ ] Isolar atrás de uma interface trocável (`DiagnosticoTextProvider`) para plugar geração ao vivo depois sem refazer nada.
- **Aceite:** painel mostra diagnóstico em português de gente, lido do banco — instantâneo, sempre igual, pronto pra gravar.

## FASE 5 — Login gov.br (mock) `[BASE]`

- [ ] `AuthModule` com interface `IdentityProvider`; `POST /auth/govbr/mock` devolve usuário fixo.
- [ ] Botão "Entrar com gov.br" cai direto no painel pré-carregado (sem formulário).
- [ ] Estruturar para troca futura por OIDC real (Authorization Code + PKCE) sem mexer no resto.
- **Aceite:** clicar no botão → painel aceso, fluxo de demo redondo.

> ⛳ Fim da BASE SÓLIDA. A partir daqui é cereja — cortar de baixo para cima se faltar tempo.

## FASE 6 — Marketplace de ativos ambientais `[CEREJA]`

- [ ] `oferta` (tipo_oferta venda|arrendamento, area_ha, bioma, valor, prazo_meses) e `match`.
- [ ] `GET /marketplace/ofertas?tipo=&bioma=`, `POST /marketplace/ofertas`, `POST /marketplace/match`.
- [ ] UI: criar oferta a partir de excedente; listar/filtrar; casar déficit↔oferta (mesmo bioma).
- **Aceite:** imóvel com excedente vira oferta; imóvel com déficit encontra e casa uma oferta compatível.

## FASE 7 — Análise Completa (upload `.RET`) `[CEREJA]`

- [ ] `POST /propriedades/upload`: receber `.RET`, unzip, parse do JSON, extrair `geo[]` (GeoJSON) + pendências.
- [ ] Persistir como `propriedade` (origem=analise_completa) + `pendencia` (origem oficial).
- [ ] Tela de upload com instruções de obtenção do arquivo completo (Doc 3 §4).
- **Aceite:** subir um `.RET` de `data/raw/ret/` → diagnóstico + pendências aparecem.

## FASE 8 — Rascunho de retificação `[CEREJA]`

- [ ] `POST /diagnosticos/:id/retificacao`: IA gera texto/checklist do que ajustar.
- [ ] (Stretch) montar arquivo de retificação para envio.
- **Aceite:** gerar um rascunho de retificação legível a partir de um diagnóstico.

---

## Esquema do banco (resumo, Doc 2 §5)

`propriedade(id, cod_imovel, usuario_id, municipio, bioma, area_ha, geom[4674], status, origem)` ·
`diagnostico(id, propriedade_id, rl_exigida_ha, rl_real_ha, app_ha, area_consolidada_ha, deficit_ha, excedente_ha, score, texto_ia, criado_em)` ·
`pendencia(id, propriedade_id, tipo, descricao, origem)` ·
`oferta(id, propriedade_id, tipo_oferta, area_ha, bioma, valor, prazo_meses, status)` ·
`match(id, oferta_id, propriedade_demandante_id, status)` ·
`usuario(id, cpf, nome, confiabilidade)`.

## Ordem de corte se faltar tempo
8 → 7 → 6 (cereja), depois 5 → 4 (mantendo 1–3, que já são demo). A Fase 3 sozinha apresenta.

## Riscos restantes / notas
- Geometrias do CAR têm winding order inválido (geopandas autocorrige; usar `buffer(0)` ou `ST_MakeValid` na ingestão).
- Performance do mapa: simplificar geometria no pipeline; carregar só o imóvel consultado.
- Bioma por imóvel: derivar por município/UF (DF = Cerrado → 20%); para Amazônia Legal aplicar 80/35/20.
- Deploy: revisar `VPS_GUIDE.md` antes de portas/nginx/PM2/banco.
