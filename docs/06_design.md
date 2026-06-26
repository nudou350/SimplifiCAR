# SimplifiCAR — Direção de Design

> Identidade visual e prompt de geração das telas. Pende dos Docs 0–1 e 5.
> Nome: **SimplifiCAR** (simplificar + CAR). Demo = slides + vídeo pré-gravado.

## Tese visual — "Carta da Terra"

O mundo do CAR é **cartográfico e cadastral**: o imóvel visto de cima, o polígono, a
cobertura do solo, o "demonstrativo" oficial, o carimbo de cartório. A emoção do produto:
do **medo** (irregular, crédito travado) → **clareza** → **valor**.

Direção: um **dossiê cadastral vivo**. Interface calma de papel de levantamento topográfico
(calcário, linhas finas de grade cadastral, dados em mono) **emoldurando um mapa escuro e
vívido que acende**. A tensão papel-sóbrio × mapa-vivo resolve os dois públicos (produtor
rural legível + júri impressionado).

**Risco estético (manter):** o sistema de cor da UI **é a paleta real do MapBiomas** (cor
que significa, não decora), e o score de conformidade é um **Selo** oficial conquistado.

**Evitar:** eco-SaaS genérico (gradiente menta, ícone de folha, blobs arredondados) e os
defaults de IA (cream+serifa+terracota; preto+verde-ácido; broadsheet de fios).

## Wordmark
Logotipo "Simplifi" + "**CAR**" com o "CAR" destacado (peso / verde `--mata` / leve selo ao
redor), pra leitura instantânea do trocadilho. Deve parecer um carimbo num documento.

## Tokens de cor
| Token | Hex | Uso |
|---|---|---|
| `--papel` | `#EFF1EB` | fundo base (calcário, NÃO cream quente) |
| `--card` | `#FAFBF7` | cartões/painéis |
| `--tinta` | `#1B2018` | texto principal + fundo do mapa |
| `--tinta-muda` | `#4A4F44` | texto secundário (≥4.5:1 no papel) |
| `--linha` | `#D6DACE` | fios cadastrais, bordas, grade |
| `--mata` | `#1F8D49` | regular / excedente (texto: `#14532D`) |
| `--agua` | `#2D6FA6` | APP / hidrografia |
| `--deficit` | `#C8442B` | déficit / a recompor (texto: `#8F2D1B`) |
| `--valor` | `#C9A227` | marketplace / "vale R$" (texto: `#8A6D12`) |

Paleta das camadas do mapa (legenda MapBiomas): Form. Florestal `#1F8D49` · Savânica
`#7DC975` · Campo `#D6BC74` · Consolidada `#E0C97F` · Água/APP `#2D6FA6` · Déficit `#C8442B`
(hachura 45°). **Cor nunca sozinha** — sempre cor + ícone + rótulo.

## Tipografia
- **Display/marca:** Bricolage Grotesque (manchetes, score, wordmark — com restrição).
- **Corpo/UI:** Rawline (fonte do gov.br — confiança). Fallback: Public Sans.
- **Dados:** IBM Plex Mono (cod_imovel, hectares, módulos fiscais, coordenadas).
- Corpo ≥18px, entrelinha ≥1.5.

## Elemento-assinatura
1. Mapa que se desenha sozinho, acendendo camadas em sequência: perímetro → hidrografia →
   APP (azul) → Reserva Legal (verde) → déficit (vermelho hachurado).
2. **Selo de Conformidade**: score 0–100 como selo oficial conquistado + status em uma
   palavra ("Em dia" / "Com pendências" / "Irregular"). Não é gauge nem número com gradiente.

## Fluxo (decisão B)
DESCOBRIR (grátis, sem login) → DESEJO (você tem R$ / um problema) → AGIR (login pra
transacionar). A Consulta Rápida pública é o gancho; só as **ações** (anunciar, casar,
assinar, ver pendências oficiais, retificar) pedem "Entrar com gov.br". O diagnóstico nunca
fica atrás de login; nada de formulário de cadastro morto.

## Telas (4)
1. **Abertura (hero) + Consulta Rápida** — gancho público.
2. **Painel da propriedade** ⭐ — mapa + Selo + diagnóstico IA + gancho; ações gated por login.
3. **Marketplace** — ofertas venda/aluguel, filtro por bioma, casar déficit↔oferta.
4. **Análise Completa (upload)** `[cereja]`.
+ login gov.br como modal/transição leve (1 toque no MVP).

## Acessibilidade WCAG AA+
Cor nunca sozinha (cor+ícone+rótulo); corpo mira AAA (7:1); fonte ≥18px; alvos ≥44px; foco
de teclado visível; navegação por teclado; landmarks; `prefers-reduced-motion` (mapa mostra
estado final sem animar); alt do mapa = texto do diagnóstico; pt-BR claro, voz ativa, jargão
sob demanda.

## Cerejas
Certificado "ativo verde"; assinatura eletrônica gov.br (mock); visão de corredores
ecológicos (impacto coletivo); "campos de futebol" pra hectares; proveniência por camada
(declarado × satélite); textura de curva de nível; tema escuro.

---

## Prompt de geração (colar no Claude design)

> Mantido em inglês de propósito (instrução do tool); a copy gerada deve ser pt-BR.

```
# DESIGN BRIEF — "SimplifiCAR" web app (high-fidelity UI)

## PRODUCT
SimplifiCAR helps Brazilian rural landowners understand and fix their CAR (Cadastro
Ambiental Rural — the mandatory environmental registry of a rural property) and turn
that regularization into opportunity: whoever has surplus native vegetation can sell
or rent it to whoever has a deficit. Built on open public data + satellite land cover
(MapBiomas) + AI that explains the numbers in plain language.

The name is a pun: "simplificar" (to simplify) + "CAR". The promise is in the name —
make a confusing bureaucratic thing simple.

UI language: Brazilian Portuguese (all copy in pt-BR). Provide real copy, not lorem.

## BRAND / WORDMARK
Set the logotype as "Simplifi" + "CAR" with the "CAR" visually emphasized (weight, the
--mata green, or a subtle box/seal around it) so the pun reads instantly. The wordmark
should feel like an official stamp on a document, tying into the "Selo" motif below.
Keep it clean — one emphasis, not many.

## AUDIENCE (design for both)
1) A rural producer — possibly low digital literacy, reading on a phone in sunlight.
   Needs large type, very high contrast, plain words, big tap targets.
2) Hackathon judges — need to be visually impressed in 5 seconds.
Resolve the tension: a calm, legible foreground around ONE vivid, alive centerpiece.

## CORE FLOW (this is the spine — design exactly this funnel)
DISCOVER (free, no login) → DESIRE (you have R$ value / a problem) → ACT (login to transact).
- Anyone can run a free "Consulta Rápida" by typing a CAR number — instant diagnosis from
  open public data, NO login.
- The full diagnosis is shown for free. Only ACTIONS (list an offer, match a deal, sign,
  see official pendencies, generate a rectification) prompt "Entrar com gov.br".
- gov.br login is sold as zero-friction ("the same account you already use for SICAR").
Do NOT gate the diagnosis behind login. Do NOT use a dead multi-field signup form anywhere.

## ART DIRECTION — "Carta da Terra" (the land charter)
The subject's world is cartographic and cadastral: a property seen from above, its
polygon, satellite land cover, the official "demonstrativo", the dreaded notary stamp.
Direction: a living cadastral dossier. A calm "survey-paper" interface (limestone,
hairline cadastral grid lines, monospaced data readouts) FRAMING a dark, vivid MAP that
lights up. That contrast — quiet paper around a living map — is the whole identity.

DO NOT produce generic environmental-SaaS: no mint/emerald gradients, no leaf icons, no
big-radius friendly-blob shapes, no "hero = big number + small label + gradient accent".
Avoid the AI defaults: warm-cream + high-contrast-serif + terracotta; near-black + acid
accent; broadsheet hairline columns. This brief wants its own voice.

THE ONE AESTHETIC RISK (keep it, justify it): the interface accent system IS the real
MapBiomas land-cover palette (forest green, savanna, water blue, deficit red) — color that
MEANS something, not decoration — and the conformity score is presented as an earned
official SEAL ("Selo de Conformidade"), turning the feared bureaucratic stamp into a prize.

## COLOR TOKENS (use exactly)
Surface / structure:
- --papel        #EFF1EB  (base background — limestone, cool green undertone; NOT warm cream)
- --card         #FAFBF7  (raised cards/panels)
- --tinta        #1B2018  (primary text; also the MAP canvas background)
- --tinta-muda   #4A4F44  (secondary text; must keep >=4.5:1 on --papel)
- --linha        #D6DACE  (hairline cadastral rules, borders, the survey grid)
Semantic (data-driven):
- --mata         #1F8D49  (regular / surplus / native forest)   text-safe variant #14532D
- --agua         #2D6FA6  (APP / hydrography / water)
- --deficit      #C8442B  (deficit / must restore)              text-safe variant #8F2D1B
- --valor        #C9A227  (marketplace value / "vale R$")       text-safe variant #8A6D12
MAP LAYER PALETTE (authentic MapBiomas legend, for the map only):
- Formação Florestal #1F8D49 · Formação Savânica #7DC975 · Campo #D6BC74 ·
  Área Consolidada/uso #E0C97F · Água/APP #2D6FA6 · Déficit overlay #C8442B (hatched 45°).
Every layer must also carry a text label + icon in the legend (color is never alone).

## TYPOGRAPHY (3 roles, intentional)
- Display / brand: "Bricolage Grotesque" — headlines + the score numeral + the wordmark,
  used with restraint.
- Body / UI: "Rawline" (the gov.br typeface — authenticity/trust). Fallback: "Public Sans".
- Data / mono: "IBM Plex Mono" — cod_imovel, hectares, módulos fiscais, coordinates.
Type scale (suggested, fluid): Display XL 56–72px / Display 36–44 / H2 24–28 / body 18–20
(18 is the minimum body size) / caption 14 mono. Generous line-height on body (1.5+).

## SIGNATURE ELEMENT (the thing it's remembered by)
1) The property MAP that draws itself on, igniting layers in sequence:
   perímetro → hidrografia → APP (azul) → Reserva Legal (verde) → déficit (vermelho hachurado).
2) Beside it, the "Selo de Conformidade": the 0–100 score rendered as an earned official
   seal/stamp (think cartório stamp made positive), with a one-word status
   ("Em dia" / "Com pendências" / "Irregular"). Not a gauge, not a gradient number ring.

## SCREENS (deliver all 4 in high fidelity, desktop + mobile)

### 1) Abertura (hero) + Consulta Rápida — THE HOOK
- A hero that states the thesis in one Portuguese sentence, e.g.:
  H1: "Sua terra está em dia com a lei ambiental?"
  Sub: "Descubra em segundos. De graça, sem cadastro, com dado público."
- PRIMARY action: a single prominent field "Informe o número do CAR" + button "Consultar".
  Treat it as an instant-result search (the wow), NOT a form. One field only.
- SECONDARY action: a quiet link/button "Entrar com gov.br" (top-right) for returning users.
- Visual: hint of the living map / cadastral grid in the background; restrained.
- Trust strip: small badges "Dados públicos do SICAR" · "Cobertura real via MapBiomas"
  · "Código Florestal (Lei 12.651/2012)" — encodes the open-data credibility.

### 2) Painel da propriedade — THE STAR (works without login)
Layout: map-dominant. Left/main = the living MAP (dark --tinta canvas, layers in MapBiomas
colors, ignite animation). Right/aside = the readout column.
- Header: property name + cod_imovel (mono) + município/UF + "Área: 62,59 ha" (mono).
- Selo de Conformidade (big), e.g. score 62 + "Com pendências".
- Plain-language AI diagnosis card (this text is pre-written), e.g.:
  "Falta mato equivalente a ~8 campos de futebol na sua Reserva Legal. Para regularizar
   você pode recuperar a área, comprar uma cota (CRA) ou alugar de um vizinho."
- The HOOK card (this drives the funnel), two variants:
  • Surplus: "Você tem 8 ha de excedente que valem ~R$ X." → CTA "Anunciar no marketplace".
  • Deficit: "Déficit de 8 ha. Veja como compensar mais barato que recompor." → CTA "Compensar".
- A compact legend (layer color + icon + label + área in ha, mono).
- GATING: the hero diagnosis is fully visible. Action CTAs (Anunciar / Compensar /
  "Ver pendências oficiais" / "Gerar retificação") show a soft inline prompt
  "Entre com gov.br para [ação]" — never a hard blocking wall over the diagnosis.
- Secondary, inside the panel: "Consultar outro imóvel" (CAR field) and
  "Análise Completa" (upload). Both live inside the app.

### 3) Marketplace
- Filter bar: toggle Venda (CRA) / Aluguel (arrendamento) + filter by bioma.
- Offer cards: bioma, área (ha, mono), tipo (venda/aluguel), valor (--valor),
  prazo (only for aluguel), short location. Clear sell vs rent distinction by
  label+icon, not color alone.
- A "casar" (match) action that pairs a deficit with a compatible offer (same bioma),
  with a confirmation that frames the win for both sides.
- Empty state is an invitation, not a void: "Nenhuma oferta no seu bioma ainda — anuncie
  seu excedente e seja o primeiro."

### 4) Análise Completa (upload) — [cereja]
- Upload zone for the ".CAR" file with clear instructions on how to obtain it from the
  Central do Proprietário (numbered steps). Explain why the COMPLETE file is needed
  (it carries the Geo step / internal RL and APP polygons); the simplified one won't work.
- After upload: same panel, now WITH official pendencies and a "Gerar retificação" action.

## gov.br LOGIN (lightweight, not a dead form)
A small modal / quick transition styled after gov.br (recognizable), one tap in the MVP,
landing directly on the authenticated panel. Frame it as claiming value, e.g. button
"Entrar com gov.br" → lands on the already-loaded panel. No new-account form.

## ACCESSIBILITY — WCAG AA+ (non-negotiable)
- Meaning never by color alone: surplus/deficit and sell/rent always = color + icon + text.
- Contrast: body text targets AAA (7:1); all UI text >=4.5:1, large text/UI >=3:1.
- Body font >=18px; tap/click targets >=44x44px; visible keyboard focus ring on everything.
- Full keyboard navigation; semantic landmarks (header/nav/main/aside); proper headings.
- Respect prefers-reduced-motion: the map shows its FINAL lit state instantly, no ignite anim.
- The map has a text alternative = the AI diagnosis (so screen readers "see" the result).
- Plain pt-BR, active voice, sentence case, short sentences. Jargon (módulo fiscal, CRA,
  arrendamento) explained on demand via a small "?" tooltip, never required to understand
  the primary message.

## MOTION (deliberate, one orchestrated moment)
- Map ignite sequence on panel load: layers fade/draw in order (perímetro → hidrografia →
  APP → RL → déficit), ~1.2s total, eased. The Selo "stamps" in at the end (a quick press).
- Hover micro-interactions on offer/legend rows only. Nothing else animates. Reduced-motion
  disables all of it and shows final states.

## TONE OF VOICE
Trustworthy, clear, a little warm — like a competent agronomist who respects the producer.
Never corporate-cold, never childish. Buttons say exactly what happens ("Anunciar excedente",
"Compensar déficit", "Entrar com gov.br"), and the action keeps its name through the flow.

## CHERRIES ON TOP (design if time allows, clearly secondary)
- "Ativo verde" certificate: a printable/officializable seal for a surplus listing.
- gov.br electronic-signature mock to "sign" a sell/rent contract inside the platform.
- Collective-impact view: a regional map showing how matches form ecological corridors
  (the coletivo story) — restoration pushed where it matters ecologically.
- "Campos de futebol" visualization that converts hectares into an intuitive area.
- Data-source transparency: per-layer provenance ("declarado" vs "satélite/MapBiomas")
  so the open-data credibility is visible.
- A subtle contour-line / cadastral-grid texture as the recurring background motif.
- Dark variant of the whole app (the paper goes deep --tinta) as an alt theme.

## DELIVERABLES
The 4 screens in high fidelity, desktop and mobile, with the panel's map-ignite +
seal-stamp motion specified, the gov.br login transition, the SimplifiCAR wordmark, and
at least one cherry (suggest the collective-impact corridor view) mocked. Derive every
color and type decision from the tokens above.
```
