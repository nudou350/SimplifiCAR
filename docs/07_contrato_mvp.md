# SimplifiCAR — Contrato Congelado do MVP (fonte única para os agentes)

> Este documento é o **contrato compartilhado** entre os times de DB/Dados, Backend e Frontend.
> Nomes de campos, shapes de JSON, DDL e portas aqui definidos são **autoritativos**.
> Se algo divergir dos Docs 0–6, este doc vence para fins de implementação do MVP.
> Pende dos Docs 00 (visão), 01 (técnico §5–6), 05 (plano/fases) e 06 (design / `SimplifiCAR.dc.html`).

---

## 0. Alvo e princípios

- **Alvo:** MVP rodando **localmente** (docker-compose) pronto para gravar o vídeo do demo. Sem deploy VPS nesta passada.
- **Geo pesado é offline** (pipeline Python) e popula o PostGIS; runtime só faz lookup.
- **IA é pré-gerada no banco** (`diagnostico.texto_ia`); o app só lê. Sem chamada de LLM em runtime.
- **Base-first:** Fases 1–5 (Doc 05) = BASE e precisam estar redondas antes das cerejas (6–8).
- Geometria armazenada em **EPSG:4674** (SIRGAS 2000); áreas calculadas reprojetando para **EPSG:5880**.

---

## 1. Layout do monorepo

```
HaCarthon/
  backend/        NestJS (TypeScript) — API REST na porta 3012
  frontend/       Angular (standalone + signals) + Leaflet — dev server 4200
  db/             docker-compose.yml (PostGIS), schema.sql, seed/
  pipeline/       Python (já existe): proof_chain.py, clip_mapbiomas.py (+ novos scripts)
  data/           dados colhidos (raw, shapefiles, mapbiomas) — gitignored
  docs/           docs 00–07
```

Sem root `package.json` / sem monorepo tooling (nx/turbo). Cada app é independente.

---

## 2. Convenções de infra (de VPS_GUIDE; usadas já no local p/ casar com deploy futuro)

| Item | Valor |
|---|---|
| Porta API (NestJS) | **3012** |
| Porta dev frontend (Angular) | 4200 (local); build servido em prod na 4012 |
| PostgreSQL | porta **55432** local (PG16+PostGIS via docker), db `hacarthon` — host 5433 é ocupado por um postgresql-x64-18 nativo do Windows; usamos 55432 p/ evitar o conflito |
| DB user / pass (local) | `hacarthon_user` / `hacarthon_pass` |
| DB name | `hacarthon` |
| CORS | backend libera `http://localhost:4200` |

`.env` do backend (não commitar valores reais em prod; no local pode ter defaults):
```
DATABASE_URL=postgresql://hacarthon_user:hacarthon_pass@localhost:55432/hacarthon
PORT=3012
CORS_ORIGIN=http://localhost:4200
```

---

## 3. Schema PostGIS (DDL autoritativo — `db/schema.sql`)

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE usuario (
  id           SERIAL PRIMARY KEY,
  cpf          VARCHAR(14),
  nome         VARCHAR(160),
  confiabilidade VARCHAR(20)            -- 'prata' | 'ouro'
);

CREATE TABLE propriedade (
  id           SERIAL PRIMARY KEY,
  cod_imovel   VARCHAR(120) UNIQUE NOT NULL,   -- número do CAR (chave de lookup)
  usuario_id   INTEGER REFERENCES usuario(id),
  nome         VARCHAR(200),
  municipio    VARCHAR(120),
  uf           CHAR(2),
  bioma        VARCHAR(40),                    -- 'Cerrado' | 'Amazônia' | 'Mata Atlântica' | 'Caatinga' | ...
  area_ha      NUMERIC(12,4),
  status       VARCHAR(20),                    -- 'Ativo' | 'Pendente' | 'Cancelado'
  origem       VARCHAR(20) NOT NULL,           -- 'consulta_rapida' | 'analise_completa'
  geom         geometry(MultiPolygon, 4674),   -- perímetro simplificado (p/ índice)
  geo_layers   JSONB                           -- FeatureCollection com todas as camadas (ver §5)
);
CREATE INDEX idx_propriedade_cod ON propriedade(cod_imovel);
CREATE INDEX idx_propriedade_geom ON propriedade USING GIST(geom);

CREATE TABLE diagnostico (
  id                   SERIAL PRIMARY KEY,
  propriedade_id       INTEGER NOT NULL REFERENCES propriedade(id) ON DELETE CASCADE,
  rl_exigida_ha        NUMERIC(12,4),
  rl_real_ha           NUMERIC(12,4),
  app_ha               NUMERIC(12,4),
  app_recompor_ha      NUMERIC(12,4),
  area_consolidada_ha  NUMERIC(12,4),
  deficit_ha           NUMERIC(12,4),          -- >0 quando falta RL
  excedente_ha         NUMERIC(12,4),          -- >0 quando sobra RL
  situacao             VARCHAR(20),            -- 'deficit' | 'excedente' | 'em_dia'
  score                INTEGER,                -- 0..100 (ver §6)
  coberturas           JSONB,                  -- [{classe,label,area_ha,fonte}] p/ a legenda
  texto_ia             TEXT,                   -- diagnóstico em linguagem simples (pré-gerado)
  criado_em            TIMESTAMP DEFAULT now()
);
CREATE INDEX idx_diagnostico_prop ON diagnostico(propriedade_id);

CREATE TABLE pendencia (
  id             SERIAL PRIMARY KEY,
  propriedade_id INTEGER NOT NULL REFERENCES propriedade(id) ON DELETE CASCADE,
  tipo           VARCHAR(60),                  -- 'reserva_legal' | 'app' | 'embargo' | ...
  gravidade      VARCHAR(20),                  -- 'alerta' | 'ok'
  descricao      TEXT,
  origem         VARCHAR(20)                   -- 'oficial' (do .RET) | 'calculado'
);

CREATE TABLE oferta (
  id             SERIAL PRIMARY KEY,
  propriedade_id INTEGER REFERENCES propriedade(id),
  tipo_oferta    VARCHAR(20) NOT NULL,         -- 'venda' | 'arrendamento'
  area_ha        NUMERIC(12,4),
  bioma          VARCHAR(40),
  valor          NUMERIC(14,2),                -- valor total (venda) ou periódico (arrendamento)
  unidade        VARCHAR(20),                  -- '' (venda) | '/ano' | '/mes'
  prazo_meses    INTEGER,                      -- só arrendamento
  municipio      VARCHAR(120),
  uf             CHAR(2),
  distancia_km   INTEGER,                      -- distância ao imóvel demandante (demo: fixo)
  status         VARCHAR(20) DEFAULT 'ativa'   -- 'ativa' | 'casada'
);

CREATE TABLE match (
  id                        SERIAL PRIMARY KEY,
  oferta_id                 INTEGER NOT NULL REFERENCES oferta(id),
  propriedade_demandante_id INTEGER REFERENCES propriedade(id),
  status                    VARCHAR(20) DEFAULT 'proposto',  -- 'proposto' | 'fechado'
  criado_em                 TIMESTAMP DEFAULT now()
);
```

---

## 4. API REST (contrato autoritativo)

Base URL local: `http://localhost:3012`. Todas as respostas em **camelCase**. Erros: `{ "statusCode", "message" }`.

### 4.1 `GET /propriedades/:codImovel` — Consulta Rápida `[BASE]`
Lookup direto; 404 se não existir. Resposta:
```json
{
  "codImovel": "MG-3127008-6CAD429ED6934E68818CD3FC21D797A6",
  "nome": "Sítio ...",
  "municipio": "Fronteira",
  "uf": "MG",
  "bioma": "Cerrado",
  "areaHa": 62.59,
  "status": "Pendente",
  "geo": { "type": "FeatureCollection", "features": [ /* §5 */ ] },
  "diagnostico": {
    "propriedadeId": 1,
    "rlExigidaHa": 12.52,
    "rlRealHa": 13.20,
    "appHa": 2.4,
    "appRecomporHa": 0.0,
    "areaConsolidadaHa": 48.1,
    "deficitHa": 0,
    "excedenteHa": 0.68,
    "situacao": "excedente",
    "score": 88,
    "coberturas": [
      {"classe":"consolidada","label":"Área consolidada","areaHa":48.1,"fonte":"declarado"},
      {"classe":"floresta","label":"Formação florestal","areaHa":6.2,"fonte":"satelite"},
      {"classe":"savanica","label":"Formação savânica","areaHa":3.8,"fonte":"satelite"},
      {"classe":"campo","label":"Campo","areaHa":2.1,"fonte":"satelite"},
      {"classe":"agua","label":"Água / APP","areaHa":2.4,"fonte":"satelite"}
    ],
    "textoIa": "..."
  }
}
```

### 4.2 `GET /diagnosticos/:propriedadeId` `[BASE]`
Devolve só o bloco `diagnostico` acima (mesma shape).

### 4.3 `POST /auth/govbr/mock` `[BASE]`
Body: `{}` (ou `{ "codImovel": "..." }`). Resposta:
```json
{ "token": "mock-jwt", "usuario": { "id": 1, "nome": "João C.", "cpf": "***.***.***-**", "confiabilidade": "ouro" } }
```
Isolado atrás de `IdentityProvider` (interface) num `AuthModule`, p/ trocar por OIDC real depois.

### 4.4 `GET /marketplace/ofertas?tipo=&bioma=` `[CEREJA]`
`tipo` ∈ {`venda`,`arrendamento`} (opcional); `bioma` opcional. Resposta:
```json
[
  {
    "id": 2, "tipoOferta": "arrendamento", "areaHa": 8.0, "bioma": "Cerrado",
    "valor": 5800, "unidade": "/ano", "prazoMeses": 240,
    "municipio": "Barreiras", "uf": "BA", "distanciaKm": 31,
    "status": "ativa", "compativel": true
  }
]
```
`compativel` = mesmo bioma do imóvel demandante (no demo, Cerrado).

### 4.5 `POST /marketplace/ofertas` `[CEREJA]`
Body: `{ propriedadeId, tipoOferta, areaHa, bioma, valor, unidade?, prazoMeses? }` → oferta criada.

### 4.6 `POST /marketplace/match` `[CEREJA]`
Body: `{ ofertaId, propriedadeDemandanteId }` → `{ matchId, status: "proposto" }`; marca oferta `casada`.

### 4.7 `POST /propriedades/upload` `[CEREJA]`
Multipart `file` = `.RET` (ZIP de JSON + GeoJSON). Faz unzip + parse, extrai camadas `geo[]` e pendências oficiais, persiste `propriedade(origem='analise_completa')` + `pendencia(origem='oficial')` + `diagnostico`. Resposta = mesma shape de §4.1 + `"pendencias": [{tipo,gravidade,descricao}]`.

### 4.8 `POST /diagnosticos/:id/retificacao` `[CEREJA]`
Gera rascunho (texto/checklist). Resposta: `{ "minuta": "texto...", "itens": ["..."] }`.

---

## 5. Formato GeoJSON das camadas (`geo` / `geo_layers`)

`FeatureCollection`, CRS **EPSG:4674**. Cada feature tem `properties.tipo` e `properties.areaHa`. Tipos vindos do raw (`data/raw/geojson/`), normalizados para o front mapear cor:

| `tipo` (canônico) | vem do raw | cor no mapa |
|---|---|---|
| `perimetro` | AREA_IMOVEL / AREA_IMOVEL_LIQUIDA | linha branca |
| `consolidada` | AREA_CONSOLIDADA | bege `#E0C97F` |
| `reserva_legal` | RL_DECLARADA / RESERVA_LEGAL | verde `#1F8D49` |
| `app` | APP | azul `#2D6FA6` |
| `vegetacao` | VEGETACAO_NATIVA | verde claro `#7DC975` |
| `deficit_rl` | ARL_A_RECUPERAR (ou calculado) | vermelho hachurado `#C8442B` |
| `sede` | SEDE_IMOVEL | ponto |

O backend deve mapear o `tipo` cru do raw para o canônico acima e devolver no `geo`.

---

## 6. Fórmula do score (autoritativa — usar igual no seed e no pipeline)

```
rl_ratio   = (rl_exigida_ha <= 0) ? 1 : min(1, rl_real_ha / rl_exigida_ha)
app_pen    = (app_recompor_ha <= 0) ? 0 : min(0.30, app_recompor_ha / max(0.5, area_ha * 0.10))
score      = round( clamp(100 * (0.75 * rl_ratio + 0.25) - 100 * app_pen, 0, 100) )

situacao   = deficit_ha > 0.05 ? 'deficit'
           : excedente_ha > 0.05 ? 'excedente'
           : 'em_dia'
faixa (UI) = score >= 80 ? 'Em dia' : score >= 50 ? 'Com pendências' : 'Irregular'
```
`deficit_ha = max(0, rl_exigida_ha - rl_real_ha)`; `excedente_ha = max(0, rl_real_ha - rl_exigida_ha)`.

---

## 7. Seed dos 4 imóveis-demo (de `data/raw/`)

Fonte: `data/raw/demonstrativos/<COD>.json` (números oficiais = gabarito) + `data/raw/geojson/<COD>.geojson` (geometria). Mapear:

| diagnostico | campo no demonstrativo (`demonstrativo.areas.*`) |
|---|---|
| `rl_exigida_ha` | `areaRLMinimaExigidaLei` |
| `rl_real_ha` | `areaRLVetorizadaSobrepostaRVN` (RL ∩ veg nativa) |
| `app_ha` | `areaAPP` |
| `app_recompor_ha` | `areaAPPRecompor` |
| `area_consolidada_ha` | área consolidada (campo correspondente) |
| `excedente_ha` | `areaRLExcedentePassivo` |
| `deficit_ha` | `areaRLRecompor` (ou `rl_exigida - rl_real` se >0) |

Imóveis e narrativa:

| Caso | cod_imovel | Papel no demo |
|---|---|---|
| 🟢 Verde/excedente | `MG-3127008-6CAD429ED6934E68818CD3FC21D797A6` | herói "em dia / excedente → anuncie" (texto_ia caprichado) |
| 🔴 Déficit forte | `CE-2300705-2D3561F0129447BA9CB92D62D2E6FFB8` | herói "déficit → compensar" (texto_ia caprichado) |
| 🟠 Recompor APP | `CE-2313302-1BC346842FE34636916F950EC6B63AC9` | Análise Completa (pendências RL+APP) |
| ⚫ Déficit grande | `PR-4110201-4BF5A9647E0F455AAEA1C8F0A0889199` | déficit extremo (marketplace) |

`usuario` mock: `João C.`, confiabilidade `ouro`, vinculado às propriedades.

**Ofertas de marketplace (seed, do mockup `baseOffers`)** — todas Cerrado salvo nota:
```
venda        9,2 ha  R$ 38.000           Riachão das Neves/BA  42 km
arrendamento 8,0 ha  R$ 5.800 /ano  240m Barreiras/BA          31 km
arrendamento 6,5 ha  R$ 4.900 /ano  180m São Desidério/BA      55 km
venda        15,4 ha R$ 61.000           Formosa do Rio Preto/BA 78 km
venda (Amazônia)      40,0 ha R$ 120.000           Novo Progresso/PA 1900 km
arrendamento (Mata Atlântica) 12,0 ha R$ 9.000 /ano 120m Sorocaba/SP 2100 km
```

---

## 8. Telas do frontend (do design `SimplifiCAR.dc.html`)

Estado `screen` ∈ {`hero`,`painel`,`marketplace`,`analise`,`corridor`}. Header com login gov.br (mock). Nav (Painel/Marketplace/Análise/Corredores) aparece quando logado/no app.

1. **Abertura (`hero`)** `[BASE]` — input nº CAR + "Consultar" + "ver exemplo" (chama `MG-3127008`); selos de fonte.
2. **Painel (`painel`)** `[BASE]` — mapa SVG/Leaflet acendendo camadas (perímetro, consolidada, RL, APP, déficit vermelho), **Selo de Conformidade** (score grande + faixa), **Diagnóstico** (texto_ia, "≈ N campos de futebol"), hook compensar/anunciar (comparação recompor × CRA × aluguel), legenda com proveniência (declarado/satélite/calculado), ações gated (ver pendências, gerar retificação, enviar `.CAR`).
3. **Marketplace (`marketplace`)** `[CEREJA]` — filtro venda(CRA)/aluguel + bioma, cards de oferta, "Casar com meu déficit" (modal match), anunciar excedente, estado vazio.
4. **Análise Completa (`analise`)** `[CEREJA]` — upload `.RET`/`.CAR`, instruções da Central, leitura da geometria, pendências oficiais, minuta de retificação.
5. **Corredores (`corridor`)** `[CEREJA/pitch]` — impacto coletivo, pareamentos formando corredor (dados ilustrativos fixos).

Modais: login gov.br (mock, azul `#1351B4`), tooltips (CRA, módulo fiscal, arrendamento), match. Paleta e tipografia: ver `<style>` do `.dc.html` (Bricolage Grotesque / Public Sans / IBM Plex Mono; papel `#EFF1EB`, mata `#1F8D49`, água `#2D6FA6`, déficit `#C8442B`, valor `#C9A227`).

**Gating:** o diagnóstico é livre (sem login); só **ações** (compensar, casar, ver pendências, retificar, anunciar) exigem login mock → abrem o modal e roteiam após "entrar".

---

## 9. Comandos de run (a serem registrados no CLAUDE.md ao final)

```
# DB
docker compose -f db/docker-compose.yml up -d
psql ... -f db/schema.sql && node db/seed/seed.(js|ts)   # ou script equivalente

# Backend
cd backend && npm install && npm run start:dev           # :3012

# Frontend
cd frontend && npm install && npm start                  # :4200
```

---

## 10. Critério de aceite do MVP (fluxo do vídeo)

1. Abrir front → "Entrar com gov.br" (mock) → cai no Painel **OU** digitar/“ver exemplo” `MG-3127008` na Abertura.
2. Painel acende o mapa por camadas + mostra **score grande** + diagnóstico em português + hook.
3. Consultar `CE-2300705` → narrativa de **déficit → compensar** leva ao Marketplace; "casar" com oferta Cerrado compatível.
4. (Cereja) Análise Completa: subir `.RET` de `CE-2313302` → pendências oficiais + minuta.
5. Tudo instantâneo, sem rede externa, sempre igual.
