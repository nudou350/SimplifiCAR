# db/ — PostGIS do SimplifiCAR

Banco PostgreSQL 16 + PostGIS que serve a Consulta Rápida e o Marketplace do MVP.
Tudo é **pré-calculado** (geo pesado roda offline no `pipeline/`); o runtime só faz lookup.

## Subir (fresh)

```bash
docker compose -f db/docker-compose.yml up -d
```

Na **primeira** subida (volume vazio) o Postgres roda automaticamente, em ordem:
1. `schema.sql`  → `/docker-entrypoint-initdb.d/01_schema.sql`
2. `seed/seed.sql` → `/docker-entrypoint-initdb.d/02_seed.sql`

Conexão (contrato §2):
```
postgresql://hacarthon_user:hacarthon_pass@localhost:5433/hacarthon
```

Conferir:
```bash
docker exec hacarthon_db psql -U hacarthon_user -d hacarthon \
  -c "SELECT cod_imovel, situacao, score FROM propriedade p JOIN diagnostico d ON d.propriedade_id=p.id ORDER BY p.id;"
```

Para recarregar do zero (apaga dados): `docker compose -f db/docker-compose.yml down -v && ... up -d`.
(Os scripts de init **só** rodam em volume vazio.)

## Regenerar o seed

`seed/seed.sql` é **gerado** — não editar à mão. Fonte: `data/raw/`.

```bash
pipeline/.venv/Scripts/python.exe db/seed/build_seed_sql.py
```

O script lê os 4 demonstrativos (gabarito oficial) + geojsons, calcula o diagnóstico
pela fórmula do contrato §6 e imprime os números para conferência.

## Mapeamento RAW → CANÔNICO das camadas (`geo_layers`, contrato §5)

O `properties.tipo` cru do SICAR é normalizado para o canônico que o front usa para
colorir. Mapa aplicado pelo `build_seed_sql.py` (`tipoRaw` é preservado em cada feature
para auditoria):

| `tipo` cru (SICAR) | canônico | cor |
|---|---|---|
| `AREA_IMOVEL`, `AREA_IMOVEL_LIQUIDA` | `perimetro` | linha branca |
| `AREA_CONSOLIDADA` | `consolidada` | bege `#E0C97F` |
| `ARL_PROPOSTA`, `ARL_TOTAL`, `RL_DECLARADA`, `RESERVA_LEGAL` | `reserva_legal` | verde `#1F8D49` |
| `ARL_A_RECUPERAR` | `deficit_rl` | vermelho hachurado `#C8442B` |
| `VEGETACAO_NATIVA` | `vegetacao` | verde claro `#7DC975` |
| `APP*` (`APP_TOTAL`, `APP_AREA_AC`, `APP_AREA_VN`, `APP_RIO_*`, `APP_ESCADINHA_*`, `APP_VAZIO`, …) | `app` | azul `#2D6FA6` |
| `RIO_*` (`RIO_ATE_10`, `RIO_10_A_50`) | `app` (curso d'água) | azul `#2D6FA6` |
| `SEDE_IMOVEL` | `sede` | ponto |

Regra: qualquer `APP*` ou `RIO*` → `app`; tipos verdes não previstos caem em `vegetacao`.

`tipos` crus observados nos 4 geojsons-demo: `AREA_IMOVEL`, `AREA_IMOVEL_LIQUIDA`,
`SEDE_IMOVEL`, `AREA_CONSOLIDADA`, `VEGETACAO_NATIVA`, `ARL_PROPOSTA`, `ARL_TOTAL`,
`ARL_A_RECUPERAR`, `APP_TOTAL`, `APP_AREA_AC`, `APP_AREA_VN`, `APP_RIO_ATE_10`,
`APP_RIO_10_A_50`, `APP_ESCADINHA_RIO_10_A_50`, `APP_VAZIO`, `RIO_ATE_10`, `RIO_10_A_50`.

A coluna `geom` (MultiPolygon 4674, indexada por GIST) recebe o perímetro
(`AREA_IMOVEL`, ou `AREA_IMOVEL_LIQUIDA` como fallback), via
`ST_Multi(ST_SetSRID(ST_GeomFromGeoJSON(...), 4674))`.

## Os 4 imóveis-demo (números calculados pela fórmula §6)

| cod_imovel | bioma | área (ha) | RL exig | RL real | déficit | excedente | situação | score |
|---|---|---:|---:|---:|---:|---:|---|---:|
| MG-3127008 (🟢) | Cerrado | 62,59 | 12,52 | 13,20 | 0,00 | 0,68 | excedente | 100 |
| CE-2300705 (🔴) | Cerrado¹ | 106,36 | 21,27 | 0,00 | 21,27 | 0,00 | deficit | 25 |
| CE-2313302 (🟠) | Caatinga | 7,55 | 1,51 | 0,00 | 1,51 | 0,00 | deficit | 0 |
| PR-4110201 (⚫) | Mata Atlântica | 268,21 | 53,64 | 0,00 | 53,64 | 0,00 | deficit | 25 |

`rl_real_ha = areaRLVetorizadaSobrepostaRVN` (RL ∩ vegetação nativa). Déficit/excedente
e score seguem **exatamente** o contrato §6.

### Ressalvas a reconciliar com o time
1. **CE-2300705 está marcado como `Cerrado`** (geograficamente é Caatinga). O demo (§10
   passo 3) casa esse déficit com uma oferta **Cerrado**, e o seed de marketplace não tem
   oferta Caatinga. Se o backend comparar bioma do imóvel × oferta, manter Cerrado faz o
   "casar" funcionar. Trocar para Caatinga exigiria adicionar uma oferta Caatinga.
2. **CE-2313302 — `deficit_ha`:** §6 dá `rl_exigida − rl_real = 1,51 ha`; o campo oficial
   `areaRLRecompor` é `1,79 ha` e a pendência oficial usa esse 1,79. Mantido 1,51 no
   `diagnostico` (fórmula §6); a pendência (`origem='oficial'`) cita 1,79. Além disso o
   demonstrativo traz `areaRLExcedentePassivo = +0,285` com `rl_real = 0` (inconsistência
   da própria base oficial) — ignorado em favor da fórmula §6.
3. **`coberturas`** — o demonstrativo não quebra a vegetação nativa (`areaRVN`) em
   floresta/savânica/campo. O seed faz um split documentado **0,45/0,35/0,20** (fonte
   `satelite`) só para a legenda; `consolidada` = `areaUsoConsolidado + areaAA` (fonte
   `declarado`); `agua` = `areaAPP`. Números de RL/déficit/score **não** dependem disso.
```
