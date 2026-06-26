# SimplifiCAR — Documentação Técnica (Raphael)

> Manual de execução do núcleo técnico. Pende da Doc 1 (Visão Geral).
> Foco: arquitetura, dados, API, frontend, IA, e a ordem de construção do fim de semana.

---

## 1. Arquitetura geral

```
[Angular SPA]  --->  [NestJS API]  --->  [PostgreSQL + PostGIS]
   mapa, telas         REST, regras         polígonos + diagnósticos
   login gov.br         de negócio           ofertas do marketplace
   (mockup)
                          |
                          v
                   [Camada de IA]
              diagnóstico em linguagem simples
                 rascunho de retificação

[Pré-processamento offline em Python]  --->  popula o PostGIS antes do evento
  geopandas + rasterstats: cruza SICAR x MapBiomas e calcula déficit/excedente
```

Princípio central: o trabalho geoespacial pesado acontece **antes** do evento, num pipeline Python que carrega um município inteiro no PostGIS. Em runtime, a API só consulta dados já calculados. Isso deixa o demo instantâneo e à prova de wifi ruim.

---

## 2. Stack

- **Backend:** NestJS (TypeScript), arquitetura modular, DTOs com validação.
- **Banco:** PostgreSQL 16 + extensão PostGIS (geometria, cálculo de área e interseção).
- **Frontend:** Angular (standalone components, signals), mapa com Leaflet ou MapLibre GL (leves e rápidos).
- **IA:** chamada a um modelo de linguagem para gerar o texto do diagnóstico e o rascunho de retificação a partir dos números já calculados.
- **Pré-processamento:** Python (geopandas, shapely, rasterstats) rodando offline.

---

## 3. Fontes de dados e ingestão

### 3.1 SICAR (dados públicos)
Os dados públicos do SICAR vêm em shapefiles separados por camada (perímetro do imóvel, Reserva Legal, APP, vegetação nativa, área consolidada, hidrografia, etc.), georreferenciados em SIRGAS 2000. A chave de cada imóvel é o campo `COD_IMOVEL`, que é o número do CAR. Atributos úteis já preenchidos: `COD_IMOVEL`, `NUM_AREA` (hectares), `NUM_MODULO` (módulos fiscais), município, e `ind_status` (AT ativo / PE pendente / CA cancelado).

Limitação importante: dado público não traz informação confidencial (CPF, nome do dono). Para o diagnóstico isso não faz falta. Não existe WMS/WFS oficial nem download em massa fácil, então baixamos por município antes do evento.

### 3.2 MapBiomas (uso e cobertura do solo)
Usado para saber a mata que **existe de verdade**, e não só a declarada. É o que permite calcular déficit real (o produtor declarou X de Reserva Legal, mas o solo mostra só Y).

### 3.3 O que NÃO vem pronto
Nenhuma base entrega o cálculo de conformidade. O cruzamento entre o declarado, o exigido pelo Código Florestal e a cobertura real do MapBiomas é o que **nós** calculamos. Esse é o cérebro do produto.

---

## 4. Pipeline de pré-processamento (offline, Python)

Roda uma vez por município, antes do evento. Passos:

1. Baixar shapefiles públicos do município no SICAR (camadas: AREA_IMOVEL, RESERVA_LEGAL, APP, VEGETACAO_NATIVA, AREA_CONSOLIDADA, HIDROGRAFIA).
2. Baixar o recorte de uso/cobertura do MapBiomas para a mesma área.
3. Para cada imóvel (`COD_IMOVEL`):
   - calcular área total, área de RL declarada, área de APP, área consolidada;
   - cruzar a geometria da RL com a cobertura real (rasterstats) para medir quanta vegetação nativa de fato existe ali;
   - aplicar a regra do Código Florestal (percentual de RL exigido por bioma, vindo da Doc 3) para achar o **exigido**;
   - calcular **déficit** ou **excedente** = real menos exigido;
   - calcular um **score de conformidade** simples (0 a 100).
4. Gravar tudo no PostGIS, indexado por `COD_IMOVEL`.

Risco técnico principal: este passo é a única parte que pode dar nó (projeções, recorte raster, alinhamento de CRS). Validar cedo, com um município pequeno, antes de comprometer o time.

---

## 5. Modelo de dados (PostGIS)

Tabelas mínimas para o MVP:

- **usuario**: `id`, `cpf` (do gov.br, mockado no MVP), `nome`, `confiabilidade`.
- **propriedade**: `id`, `cod_imovel` (número do CAR), `usuario_id`, `municipio`, `bioma`, `area_ha`, `geom` (polígono), `status` (AT/PE/CA), `origem` (consulta_rapida | analise_completa).
- **diagnostico**: `id`, `propriedade_id`, `rl_exigida_ha`, `rl_real_ha`, `app_ha`, `area_consolidada_ha`, `deficit_ha`, `excedente_ha`, `score`, `texto_ia`, `criado_em`.
- **pendencia**: `id`, `propriedade_id`, `tipo`, `descricao`, `origem` (oficial, vinda do arquivo `.CAR`, só na Análise Completa).
- **oferta**: `id`, `propriedade_id`, `tipo_oferta` (venda | arrendamento), `area_ha`, `bioma`, `valor`, `prazo_meses` (só arrendamento), `status` (ativa | casada).
- **match**: `id`, `oferta_id`, `propriedade_demandante_id`, `status`.

Observação: `tipo_oferta` é o que habilita venda e aluguel com a mesma estrutura. Para arrendamento, `prazo_meses` e o `valor` viram valor periódico.

---

## 6. API NestJS (endpoints principais)

- `POST /auth/govbr/mock` — simula o login, devolve um usuário pré-preenchido (no MVP).
- `GET /propriedades/:codImovel` — **Consulta Rápida**. Busca no PostGIS pelo número do CAR e devolve geometria + diagnóstico já calculado.
- `POST /propriedades/upload` — **Análise Completa**. Recebe o arquivo `.CAR` completo, faz o parse, extrai polígonos e pendências oficiais, calcula e persiste.
- `GET /diagnosticos/:propriedadeId` — devolve score, números e o texto da IA.
- `POST /diagnosticos/:id/retificacao` — gera o rascunho de retificação (cereja).
- `GET /marketplace/ofertas?tipo=&bioma=` — lista ofertas (venda e aluguel) com filtro por bioma.
- `POST /marketplace/ofertas` — cria oferta a partir de um excedente.
- `POST /marketplace/match` — casa uma demanda (déficit) com uma oferta compatível.

---

## 7. Os dois caminhos, no técnico

### Consulta Rápida (`GET /propriedades/:codImovel`)
Lookup direto no PostGIS pelo `cod_imovel`. Rápido, porque o diagnóstico já foi calculado no pré-processamento. É a base sólida.

### Análise Completa (`POST /propriedades/upload`)
Recebe o `.CAR` completo (não o `.RET` simplificado, que não traz a etapa Geo). Faz parse das camadas e das pendências oficiais da análise. Diferencial: dado atual e oficial, e permite gerar o arquivo de retificação de volta. É a cereja, e o que ataca o coração do desafio (retificação real).

As instruções de como o produtor obtém o arquivo completo na Central estão na Doc 3 e devem aparecer na UI da tela de upload.

---

## 8. Camada de IA

Entrada: os números já calculados (déficit, excedente, RL exigida vs real, pendências). Saída:

1. **Diagnóstico em linguagem simples:** transforma "déficit de 8 ha de RL" em "falta mato equivalente a X campos de futebol na sua reserva; para regularizar você pode recuperar, comprar cota ou alugar área de um vizinho".
2. **Rascunho de retificação:** texto e checklist do que ajustar, e (cereja) a montagem do arquivo para envio.

Regra: a IA explica e redige sobre números que já existem. Ela não inventa o cálculo. Isso mantém o resultado confiável e auditável.

---

## 9. Frontend Angular

Telas mínimas:

- **Entrada / login gov.br (mockup):** um botão que cai direto no painel preenchido.
- **Painel da propriedade:** mapa com camadas animadas (perímetro, APP, RL, déficit), score grande, e o texto da IA.
- **Tela de captura:** alternância entre Consulta Rápida (campo de número do CAR) e Análise Completa (upload com instruções claras).
- **Marketplace:** lista de ofertas com filtro venda/aluguel e por bioma, criação de oferta, e match.

Mapa: Leaflet ou MapLibre. Animar a subida das camadas é o que cria o momento uau. Manter leve para não travar no demo.

---

## 10. Autenticação gov.br: mockup agora, OIDC depois

No MVP, `POST /auth/govbr/mock` devolve um usuário fixo e o front pula direto para o painel. O código fica estruturado para, em produção, trocar o mock por um fluxo OpenID Connect real (Authorization Code + PKCE) contra o provedor gov.br, lendo do `userinfo` os claims de identidade (sub = CPF, name, confiabilidade). O token fica no backend. Nada além de identidade vem daí; o CAR continua vindo do número ou do upload.

Deixar isso isolado num `AuthModule` com uma interface (`IdentityProvider`) facilita a troca mock por real sem mexer no resto.

---

## 11. Ordem de construção (fim de semana)

1. **Antes do evento:** rodar e validar o pipeline Python num município pequeno; popular o PostGIS.
2. Subir NestJS + PostGIS, com `GET /propriedades/:codImovel` devolvendo dado real.
3. Mapa Angular acendendo as camadas + score. (Aqui a base sólida já demoa.)
4. Texto da IA no painel.
5. Login gov.br mockado caindo no painel.
6. **Cereja:** marketplace (ofertas venda/aluguel + match).
7. **Cereja:** Análise Completa (upload + pendências + rascunho de retificação).

Corte de cima para baixo se faltar tempo: do passo 7 para o 6, e assim por diante. O passo 3 sozinho já é um demo apresentável.

---

## 12. Riscos técnicos e mitigação

- **Pré-processamento geoespacial:** maior risco. Mitigar validando cedo, município pequeno, CRS conferido.
- **Parse do `.CAR`:** formato pode dar trabalho. Mitigar tratando a Análise Completa como cereja, não base.
- **Performance do mapa:** muitos polígonos travam. Mitigar simplificando geometria no pré-processamento e carregando só o imóvel consultado.
- **Tempo:** a arquitetura em camadas (base vs cereja) é a própria mitigação. Sempre haverá um demo funcional.
