# SimplifiCAR — Ambiente de Teste, API da Central e Formato do `.RET`

> Achados verificados ao vivo no ambiente de teste do haCARthon em 26/06/2026 (expira **28/06**).
> Atualiza/destrava partes dos Docs 1–3. O principal: o `.CAR`/`.RET` **não** é caixa-preta, e a Central
> tem uma API REST que serve o diagnóstico de conformidade pronto.

## 1. Ambiente de teste (DataPrev)

- Base: `https://car-sus.dataprev.gov.br/`
  - `/#/central/acesso` — Central do Proprietário/Possuidor (login gov.br **staging**)
  - `/#/baixar` — módulos de cadastro (pré-preenchido e offline)
  - `/#/enviar` — envio (⚠️ só teste, nunca produção)
- Login gov.br staging (`sso.staging.acesso.gov.br`, client `car-hml.dataprev.gov.br`), credenciais fictícias dos organizadores — ver memória `hacarthon-test-environment`.
- 11 imóveis de teste cadastrados (MG, DF, PR, PE, CE), vários biomas/status.

## 2. Formato do arquivo `.RET` / `.CAR` (DESMISTIFICADO)

O `.RET` baixado na Central é um **ZIP** (magic `PK`) com 3 arquivos **JSON**:

| Arquivo no ZIP | Conteúdo |
|---|---|
| `<CODIGO_CAR>` (sem extensão) | JSON principal: `cadastrante`, `documentos`, `geo`, `imovel`, `informacoes`, `origem`, `proprietariosPosseirosConcessionarios`, `versao` |
| `BD.bak` | JSON do cadastro (`codigoCar`, `municipio`, `modulosFiscal`, `resposta`, `statusCadastro`, ...) |
| `info.info` | `{"data_primeiro_cadastro": "..."}` |

A geometria fica em `geo[]`. Cada item:
```json
{ "tipo": "VEGETACAO_NATIVA", "geoJson": { "type": "MultiPolygon", "coordinates": [...] }, "area": 13.1993 }
```
`geoJson` é **GeoJSON padrão** → parse trivial com qualquer lib (geopandas/shapely/turf).

**Camadas (`tipo`) no `.RET` completo:** `AREA_IMOVEL`, `AREA_IMOVEL_LIQUIDA`, `SEDE_IMOVEL` (Point), `RIO_ATE_10` (hidrografia), `APP_TOTAL`, `APP_RIO_ATE_10`, `APP_AREA_VN`, `APP_AREA_AC`, `AREA_CONSOLIDADA`, `VEGETACAO_NATIVA`, `ARL_PROPOSTA`, `ARL_TOTAL`.

**`.RET` simplificado:** `geo: []` (zero geometria). Confirma o Doc 3: o simplificado NÃO serve para cálculo/retificação geométrica. Para a Análise Completa, exigir o completo.

Amostras commitadas localmente em `data/raw/` (gitignored): `MG-3127008_completo.ret`, `MG-3127008_simplificado.ret`.

## 3. API REST da Central (o que nosso backend deveria espelhar)

Base: `https://car-sus.dataprev.gov.br/central/api/` (autenticada por sessão/JWT da Central).

| Endpoint | Retorna |
|---|---|
| `imovel/imoveisUsuarioLogadoPaginado?pagina=1` | lista de imóveis do usuário (`{possuiApenasImoveisRurais, totalImoveis, imoveis[]}`) |
| `imovel/{CAR}/dadosDemonstrativo` | **diagnóstico de conformidade completo** (ver §4) |
| `imovel/{CAR}/dadosReservaLegal` | detalhe de RL |
| `imovel/{CAR}/dadosApp` | detalhe de APP |
| `imovel/download/ret/{idImovel}` | `.RET` completo (ZIP) |
| `imovel/download/ret/simplificado/{idImovel}` | `.RET` simplificado |
| `analise?codigoImovel={CAR}` | análise oficial |
| `solicitacoes/{CAR}`, `solicitacoes/regularizacoes/{CAR}`, `solicitacao?codigoImovel={CAR}` | solicitações/pendências |
| `imovelMensagem/{CAR}/quantidadeNaoLidas` | mensagens |
| `fluxo/imovel/{CAR}` | (retornou 500 no ambiente de teste) |

Cada item da lista de imóveis traz: `id` (numérico, usado nos downloads), `codigo` (o número do CAR), `codigoConsulta`, `nome`, `statusImovel`, `nomeMunicipio`, `siglaEstado`, `tipoImovel`, `retificavel`, `idCondicaoInscricaoAnalise`.

Implicação: **o SICAR já calcula o diagnóstico** que planejávamos calcular. Estratégia:
- *Consulta Rápida*: replicar o cálculo a partir dos shapefiles públicos por município (offline) — nosso cérebro próprio, validável contra estes números.
- *Análise Completa*: parse do `.RET` do usuário (ZIP→JSON→GeoJSON) e/ou consumo deste demonstrativo.

## 4. Dicionário do `dadosDemonstrativo` (campos `areas`)

Tudo em hectares. Valida nossa fórmula de RL (ver exemplo abaixo).

| Campo | Significado |
|---|---|
| `areaLiquida` | área líquida do imóvel |
| `areaRVN` | remanescente de vegetação nativa |
| `areaUsoConsolidado` | área rural consolidada |
| `situacaoRL` | ex.: "Não Analisada" |
| `areaRLP` | RL proposta · `areaRLA` averbada · `areaRLANA` aprovada não averbada · `areaRLDeclarada` |
| `areaRLVetorizadaSobrepostaRVN` | RL que de fato tem vegetação nativa (RL ∩ RVN) — **a "RL real"** |
| `areaRLMinimaExigidaLei` | RL mínima exigida (art. 12) |
| `areaRLExcedentePassivo` | **> 0 = excedente, < 0 = passivo/déficit** |
| `areaRLRecompor` (+ `...AC`/`...AA`) | RL a recompor |
| `areaAPP`, `areaAPPSobrepostaRVN`, `areaAPPEmAC`, `areaAPPRecompor` | APP total / com veg / em consolidado / a recompor |
| `areaUsoRestrito*` | uso restrito |
| `areaSobreposicaoOutrosImoveis`, `...UC`, `...TI`, `...Assentamento` | sobreposições |

### Validação da nossa fórmula (imóvel MG-3127008, Fronteira/MG, Cerrado fora da Amazônia Legal → RL 20%)
- `areaRLMinimaExigidaLei` = 12,5187 ≈ 62,5934 × 20% ✅
- `areaRLExcedentePassivo` = 0,6806 ≈ 13,1997 (RL real) − 12,5187 (exigida) ✅

Nossa fórmula bate com o cálculo oficial do SICAR.

## 5. Casos de teste para o demo

Dataset completo dos 10 imóveis em `data/raw/demonstrativos_11_imoveis.json` (a lista paginada trouxe 10 de 11; falta 1 da página 2).

- 🟢 **Verde (regular/excedente):** `MG-3127008-...` *Teste sobreposto imóvel analisado RD* — excedente RL 0,68 ha.
- 🔴 **Vermelho (recompor):** `CE-2313302-1BC346842FE34636916F950EC6B63AC9` *beco da catinga* — RL a recompor 1,80 ha + APP a recompor 2,15 ha.
- ⚫ **Déficit gritante (RL real = 0):** `CE-2300705-...` *Teste pedro 1* (−21,3 ha); `PR-4110201-...` *pj_sem_representante* (−53,6 ha).
