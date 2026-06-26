# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é este projeto

**SimplifiCAR** (simplificar + CAR) — projeto de hackathon (Desafio 2: CAR / Cadastro Ambiental Rural). Plataforma que diagnostica a conformidade ambiental de imóveis rurais contra o Código Florestal, ajuda a retificar o cadastro, e conecta excedente e déficit de mata num marketplace (venda de CRA / aluguel de servidão).

A fonte da verdade do produto e da arquitetura está em `docs/`:
- `docs/00_visao_geral_simplificar.md` — visão, escopo, fluxo do demo. **Leia primeiro.**
- `docs/01_documentacao_tecnica_raphael.md` — arquitetura, stack, modelo de dados, API, ordem de build.
- `docs/02_documentacao_dominio_pitch_bianca.md` — regras do Código Florestal que viram cálculo, pitch.

Estes docs estão em português e descrevem o sistema-alvo; o código ainda não foi escrito. Ao implementar, siga-os e mantenha-os atualizados se a realidade divergir.

## Princípio arquitetural central (não viole)

**O trabalho geoespacial pesado roda OFFLINE, antes do evento**, num pipeline Python que popula o PostGIS com um município inteiro já calculado (déficit/excedente/score por imóvel). Em runtime a API só faz lookup de dado pré-calculado. Isso é o que torna o demo instantâneo e à prova de wifi ruim.

Consequência prática: a **Consulta Rápida** (`GET /propriedades/:codImovel`) nunca calcula nada na hora — só lê. Não introduza cálculo geoespacial síncrono no caminho de request.

## Stack alvo

- **Backend:** NestJS (TypeScript), modular, DTOs com validação.
- **Banco:** PostgreSQL 16 + PostGIS.
- **Frontend:** Angular (standalone components, signals) + mapa Leaflet ou MapLibre GL.
- **IA:** chamada a um LLM para gerar o texto do diagnóstico e o rascunho de retificação **a partir de números já calculados** — a IA explica/redige, nunca inventa o cálculo (mantém auditável).
- **Pré-processamento:** Python offline (geopandas, shapely, rasterstats) cruzando SICAR × MapBiomas.

Ao construir aplicações de IA, use os modelos Claude mais recentes (ver skill `claude-api`).

## Escopo: base sólida vs cereja (regra de corte)

Sempre exista um demo funcional. Construa e proteja a **base** antes de tocar na **cereja**; se faltar tempo, corte a cereja de cima para baixo.

- **Base sólida:** login gov.br mockado, Consulta Rápida com mapa + score, diagnóstico em linguagem simples sobre um município pré-carregado.
- **Cereja:** Análise Completa (upload `.CAR` → pendências oficiais → rascunho de retificação), marketplace (venda/aluguel + match), registro rastreável.

## Ordem de construção (do doc técnico, seção 11)

1. Pipeline Python validado num município pequeno → popula PostGIS (maior risco técnico, validar cedo: CRS/projeções/recorte raster).
2. NestJS + PostGIS com `GET /propriedades/:codImovel` devolvendo dado real.
3. Mapa Angular acendendo camadas (perímetro, APP, RL, déficit) + score grande. **← já é um demo apresentável.**
4. Texto da IA no painel.
5. Login gov.br mockado caindo direto no painel.
6. (Cereja) Marketplace.
7. (Cereja) Análise Completa.

## Convenções de domínio que afetam o código

- A chave de cada imóvel é `cod_imovel` (= número do CAR, campo `COD_IMOVEL` do SICAR). Toda indexação e lookup gira em torno disso.
- **Déficit/excedente** = vegetação nativa real (MapBiomas) − RL exigida (% por bioma aplicado à área). Real < exigido → déficit (vira demanda no marketplace); real > exigido → excedente (vira oferta).
- **Marketplace usa um único campo `tipo_oferta`** (`venda` | `arrendamento`) sobre a mesma estrutura. Arrendamento adiciona `prazo_meses` + valor periódico. Não duplique modelos para venda vs aluguel.
- **Autenticação gov.br é mockup no MVP** mas deve ficar isolada num `AuthModule` atrás de uma interface `IdentityProvider`, para trocar mock por OIDC real (Authorization Code + PKCE) sem mexer no resto. O login confirma identidade (CPF/nome); **não** baixa o CAR — o vínculo com a propriedade vem do número ou do upload.
- **Análise Completa exige o arquivo `.CAR` completo** (com etapa Geo / polígonos internos de RL e APP), não o `.RET` simplificado.

Tabelas mínimas do PostGIS: `usuario`, `propriedade`, `diagnostico`, `pendencia`, `oferta`, `match` (detalhe na seção 5 do doc técnico).

## Dados de teste locais (já colhidos)

Há dados reais de teste do CAR colhidos do ambiente DataPrev (que expira 28/06/2026) em `data/raw/` (gitignored). Use-os para desenvolver/testar sem depender do ambiente online. Detalhes de formato e API em `docs/04_ambiente_teste_api_e_formato.md`; manifesto em `data/raw/README.md`.

- `data/raw/imoveis_index.json` — comece por aqui: 11 imóveis com diagnóstico resumido.
- `data/raw/demonstrativos/<CAR>.json` — diagnóstico oficial completo por imóvel (gabarito p/ validar nosso cálculo).
- `data/raw/geojson/<CAR>.geojson` — geometria por camada (SIRGAS 2000), pronta p/ Leaflet/PostGIS.
- `data/raw/ret/<CAR>_{completo,simplificado}.ret` — arquivos `.RET` (ZIP de JSON) p/ testar o parser da Análise Completa.
- `data/shapefiles/DF/` — shapefiles públicos do CAR (Distrito Federal completo, 6 camadas, SIRGAS 2000) = base da Consulta Rápida; ver `data/shapefiles/README.md` + dicionário oficial em PDF.
- `data/mapbiomas/DF_mapbiomas_col10_2024.tif` — recorte MapBiomas (cobertura do solo, 30 m) do DF = vegetação real p/ déficit vs declarado; ver `data/mapbiomas/README.md`.

**Pipeline já bootstrapado:** venv em `pipeline/.venv` (rasterio, geopandas, shapely, rasterstats — `pipeline/requirements.txt`). Scripts: `pipeline/clip_mapbiomas.py` (recorta MapBiomas via `/vsicurl/`, sem GEE) e `pipeline/proof_chain.py` (prova de ponta a ponta: RL × MapBiomas → déficit/excedente — já validada). A cadeia de cálculo do Doc 2 §4 está comprovada com dados reais do DF.

Casos de demo definidos: 🟢 `MG-3127008-...` (excedente, geometria rica), 🔴 `CE-2313302-...` (recompor RL+APP), ⚫ déficit forte `CE-2300705-...` e `PR-4110201-...`.

Insight que isso valida: o `.RET`/`.CAR` é ZIP de JSON com geometria em GeoJSON padrão (parse trivial), e o SICAR já calcula o diagnóstico — nossa fórmula de RL bate com o número oficial. Não tratar o `.CAR` como formato proprietário fechado.

## Comandos

MVP scaffoldado (NestJS + Angular + PostGIS). Contrato congelado entre as três camadas: **`docs/07_contrato_mvp.md`** (modelo de dados, shapes de API, portas, seed). Leia-o antes de mexer em qualquer camada.

```bash
# 1) Banco (PostGIS via docker) — sobe schema + seed dos 4 imóveis-demo automaticamente
docker compose -f db/docker-compose.yml up -d            # porta 55432 no host (ver nota abaixo)
docker compose -f db/docker-compose.yml down -v          # reset total + re-seed na próxima subida
pipeline/.venv/Scripts/python.exe db/seed/build_seed_sql.py   # regenera db/seed/seed.sql a partir de data/raw

# 2) Backend NestJS (porta 3012) — lê DATABASE_URL de backend/.env
cd backend && npm install && npm run start:dev           # dev (watch)
cd backend && npm run build && node dist/main.js         # prod local

# 3) Frontend Angular (porta 4200) — apiBase em src/environments/environment.ts
cd frontend && npm install && npm start                  # ng serve
cd frontend && npm run build                             # build de produção
```

**Gotcha de porta (Windows):** a 5433 é ocupada por um serviço nativo `postgresql-x64-18`, e o Docker Desktop falha **silenciosamente** ao publicar nela (o backend acaba batendo no PG nativo → `password authentication failed for user "hacarthon_user"`). Por isso o PostGIS do projeto usa **55432** no host (em `db/docker-compose.yml`, `backend/.env` e `docs/07 §2`). Se a auth falhar, confira que o container mostra `0.0.0.0:55432->5432` em `docker ps`.

**Fluxo de demo verificado (end-to-end, dados reais):** Abertura → "ver exemplo" (`MG-3127008`, excedente, score 100, "anunciar") ou consultar `CE-2300705` (déficit 21,3 ha, score 25, "compensar") → Painel com mapa Leaflet acendendo camadas + selo + `texto_ia` do banco → ação gated → login gov.br mock → Marketplace (6 ofertas) → "casar" (`POST /marketplace/match`). Upload `.RET` (Análise Completa) validado contra `CE-2313302`.

## Infra / deploy

Antes de qualquer escolha de deploy, porta, nginx, banco ou PM2, leia e siga `C:\Users\Raphael\Documents\Projetos\VPS_GUIDE.md`.
