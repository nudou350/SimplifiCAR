# Roteiro do Vídeo-Demo — SimplifiCAR (≤ 2 min)

> Entrega 1 do haCARthon: vídeo de **no máximo 2 min** (acima disso = desclassificação).
> Foco pedido pela equipe: **demonstração "por cima", não técnica** — explicar como funciona e como o usuário interage.
> A única coisa que **não pode faltar**: a **viabilidade** (a solução é possível e já está praticamente pronta).
>
> Formato: gravação de tela do protótipo clicável + narração. Como o app já roda ponta a ponta, a própria navegação é a prova de viabilidade — use isso.

---

## Princípios do roteiro (por que ele é assim)

1. **Abre pelo mapa / dado, não pelo marketplace.** O coração do Desafio 2 é "dado geoespacial atualizado em escala". O marketplace é o diferencial, mas entra como o que o dado *habilita* — senão parece fuga de escopo.
2. **Um arco só, bem contado.** Jornada do **déficit → compensar → corredor ecológico**. É a que mais surpreende: vira o jogo de "você está irregular" para "compense e ajude a formar floresta".
3. **Linguagem de gente.** Nada de "raster", "PostGIS", "zonal stats". Fale "imagem de satélite mais recente cruzada com o cadastro".
4. **Fecha na viabilidade.** Última coisa que o jurado ouve: *já funciona, validado com dado oficial, falta integração — não pesquisa.*

---

## O ROTEIRO (teleprompter)

> Cronometre. Meta: ~1min50 de narração para sobrar folga. Marcações `[TELA]` e `[AÇÃO]` são o que aparece na gravação; o texto entre aspas é o que você fala.

### 0:00 – 0:15 · Gancho
`[TELA: Abertura — "Sua terra está em dia com a lei ambiental?"]`

> "Pergunta simples: a sua terra está em dia com a lei ambiental? Hoje, a maioria dos produtores rurais não sabe responder. E quem até descobre que está irregular, não faz ideia do que fazer. É esse problema que o **SimplifiCAR** resolve."

### 0:15 – 0:45 · O mapa que se atualiza sozinho (coração do desafio)
`[AÇÃO: clicar em "Ver com um imóvel de exemplo" — ou digitar o número do CAR]`
`[TELA: Painel — o mapa ACENDE camada por camada]`

> "A pessoa informa o número do cadastro e, em segundos, a gente entrega o mapa da propriedade dela já atualizado. A gente pega a imagem de satélite mais recente — que é renovada todo ano — e cruza com o cadastro. O mapa acende camada por camada: o limite da fazenda, a vegetação, a reserva legal, as áreas de preservação e, em vermelho, o que falta de mata."

> "Esse é o coração do desafio: manter esse mapeamento atualizado, com precisão e **em escala** — a gente calcula um município inteiro de uma vez, antes mesmo de alguém pedir."

### 0:45 – 1:05 · O diagnóstico em linguagem de gente
`[AÇÃO: apontar para o score grande e o selo "Irregular"]`

> "E a gente não para no mapa bonito. O sistema é direto e diz uma de duas coisas: você está em dia, ou não está. Esse imóvel aqui tem **déficit de mata** — está irregular. Em vez de termo técnico, a plataforma explica em linguagem simples o que isso significa e o que dá pra fazer."

### 1:05 – 1:35 · O pulo do gato: regularizar deixa de ser custo
`[AÇÃO: clicar no botão de ação → passa pelo login gov.br → Marketplace]`
`[TELA: Marketplace de reserva, ofertas do mesmo bioma]`

> "Aqui é onde a maioria das soluções para: 'você está irregular, se vira'. A gente vira o jogo. Esse produtor **não precisa replantar tudo do zero** — ele pode compensar. Como? Num marketplace onde quem tem mata sobrando vende ou aluga esse excedente para quem tem mata faltando — sempre dentro do mesmo bioma, como a lei exige."

`[AÇÃO: clicar em "Casar" numa oferta compatível]`

> "Com um toque, o produtor casa o déficit dele com a reserva de um vizinho. De um lado vira regularização barata; do outro, vira renda pra quem tem floresta em pé."

### 1:35 – 1:55 · O impacto que arrepia (coletivo)
`[TELA: Corredores]`

> "E tem um efeito maior. Quando muitos vizinhos casam déficit com excedente, a recuperação é direcionada para onde **conecta os pedaços de floresta** — formando corredores ecológicos por onde a fauna volta a circular. Regularizar deixa de ser um remendo isolado e vira floresta contínua."

### 1:55 – 2:00 · Fecho na VIABILIDADE
`[TELA: voltar ao Painel ou logo do SimplifiCAR]`

> "E isso não é maquete: é um protótipo que **já funciona de ponta a ponta**, com dado público e real — nossa conta de conformidade bateu com o relatório oficial do governo. A gente apoia em instrumentos que já existem na lei e no gov.br. Falta integração, não pesquisa. **SimplifiCAR**: do 'não sei minha situação' para 'sei o que tenho, e sei o que fazer'."

---

## Se estourar o tempo (cortes, nesta ordem)

1. Corta a frase de "escala / município inteiro" em 0:45.
2. Enxuga o bloco dos Corredores (1:35) para uma frase só.
3. Corta o login gov.br da gravação (vá direto pro Marketplace) — você menciona "gov.br" na fala da viabilidade.

## Se SOBRAR tempo (≤ 2 min ainda)

- Mostre rapidíssimo a **Análise Completa**: "e se o produtor quiser corrigir o cadastro de verdade, ele sobe o arquivo dele e a plataforma já gera o rascunho da retificação." (10s, sem entrar em detalhe).

---

## Dicas de gravação (não fala isso, só executa)

- **Dispare o "Casar" a partir de um imóvel COM déficit** (o de exemplo do roteiro). Se vier de um imóvel sem déficit, o texto do modal fica sem sentido ("cobre o déficit de 0,0 ha").
- Deixe o **mapa terminar de acender** antes de falar do diagnóstico — o "acender" é o momento uau visual, dá ~1,5s pra ele respirar.
- Se a internet estiver instável na hora de gravar, use **"Ver com um imóvel de exemplo"**: tem fallback embutido, a tela não cai.
- Grave em tela cheia, cursor visível, e sem mostrar terminal/código — é demo de produto, não de engenharia.
- Narração calma: 2 min parece muito e some rápido. Ensaie 1x com cronômetro.

---

## Brindes para os outros campos da entrega

### 3. Nome da solução (≤ 4 palavras)
**SimplifiCAR** — junção de *simplificar* + *CAR*.

### 5. Resumo da solução (≤ 300 caracteres)
> O SimplifiCAR é uma plataforma que mostra ao produtor rural, em segundos, se sua terra está em dia com a lei ambiental e o que fazer para regularizar — cruzando dados públicos de satélite com o cadastro — e conecta quem tem mata sobrando com quem precisa compensar.

*(273 caracteres. Variante mais curta, se quiser folga: "O SimplifiCAR mostra ao produtor rural, em segundos, se sua terra está regular com a lei ambiental e como regularizar, cruzando dados públicos de satélite com o cadastro, e conecta quem tem mata sobrando com quem precisa compensar.")*

### 6. Próximos passos
O sistema já funciona de ponta a ponta; o que falta não é pesquisa, é integração e parceria. Em ordem:

1. **Credenciamento gov.br** — emitir o `client_id` oficial para ligar o login e a assinatura eletrônica reais (a arquitetura já está pronta para plugar).
2. **Validação em escala com o órgão ambiental** — rodar o motor para um estado inteiro e conferir os números com quem é dono do dado oficial. Precisamos das variáveis de acesso oficiais (DataPrev/SICAR).
3. **Camada de contrato e pagamento no marketplace** — fechar o ciclo da compensação com contrato, assinatura gov.br e registro no órgão / cartório.
4. **Piloto com produtores reais** — testes de usabilidade com pequenos e médios produtores e com grandes reservas (lado da oferta).
5. **Parceiros e especialistas** — órgão ambiental estadual/federal, responsável técnico (ART) para os laudos, e jurídico ambiental para os instrumentos de CRA e servidão.

Estimativa: poucas semanas para a validação, ~6 a 8 semanas para um piloto rodando. Cada etapa entrega valor sozinha — não é preciso esperar tudo ficar pronto para começar.
</content>
</invoke>
