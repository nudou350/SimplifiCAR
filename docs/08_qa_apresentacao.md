# Q&A da Apresentação — SimplifiCAR

Banco de perguntas prováveis da banca e a resposta ideal. Cada pergunta tem:
- **Resposta-relâmpago** — a versão de 1 frase pra decorar e soltar de bate-pronto.
- **Se aprofundarem** — os pontos extras caso queiram detalhe.
- **Não diga** — armadilhas a evitar.

Mantenha este doc alinhado com `docs/07_contrato_mvp.md` (o que está realmente implementado).

---

## 🎯 Aderência ao Desafio 2

### P: "Esse projeto responde mesmo ao Desafio 2? Não fugiram do escopo?"

**Resposta-relâmpago:**
> "O coração do Desafio 2 é atualizar com rapidez e acurácia o mapeamento de uso e cobertura do solo do CAR, em escala, aumentando a quantidade e a qualidade das análises. É exatamente o que nosso motor faz: cruza o MapBiomas anual contra a geometria do CAR e recalcula o diagnóstico de todos os imóveis numa passada. Diagnóstico, retificação e marketplace são o que esse dado atualizado habilita."

**O texto oficial (decore os verbos):**
> "Melhorar o acesso a dados geoespaciais do CAR — atualizar anualmente, com rapidez e acurácia, o mapeamento de uso e cobertura do solo de todos os estados, melhorando a atualização dos cadastros e o aumento na quantidade e qualidade das análises do CAR."

**Mapa item-a-item (o que o desafio pede × o que temos):**
- *Uso e cobertura atualizado anualmente* → pipeline cruza **MapBiomas** (coleção anual, satélite 30 m) × SICAR.
- *Acurácia* → vegetação real (satélite) vs. declarado, validado contra o **demonstrativo oficial** do SICAR.
- *Todos os estados / escala* → o pipeline pré-calcula um município/UF inteiro numa varredura; demo é o DF, a arquitetura escala.
- *Acesso a dados geoespaciais* → Consulta Rápida + mapa traduzem a geometria técnica em linguagem simples.
- *Quantidade de análises* → cálculo em lote: analisa o município todo de uma vez, não 1 a 1.
- *Qualidade das análises* → score auditável + IA que explica + proveniência (declarado/satélite/calculado).
- *Atualização dos cadastros* → Análise Completa → pendências → minuta de retificação.

**Não diga:**
- ❌ Abrir o pitch pelo marketplace. Ele é o diferencial e o "benefício individual e coletivo", mas **não** é o que o texto do desafio pede — se virar o herói, parece fuga de escopo. Abra pelo **motor de dados**; posicione o marketplace como o que o dado atualizado habilita.
- ❌ Confundir o desafio com "fazer uma UI bonita pro produtor". A UI é meio; o pedido é o **dado geoespacial atualizado em escala**.

---

## 🔐 Login / gov.br

### P: "Tem integração real com o gov.br? O login funciona de verdade?"

**Resposta-relâmpago:**
> "A base da integração já está feita e isolada na arquitetura — o login está mockado só porque o gov.br exige credenciar um `client_id` oficial, que não dá pra emitir dentro do fim de semana. Trocar o mock pelo gov.br real é plugar um provedor, sem mexer no resto do sistema."

**Se aprofundarem:**
- **O que já está pronto:** todo o login passa por uma interface única (`IdentityProvider`). O mock é uma implementação dela; o gov.br real (OIDC, Authorization Code + PKCE) é outra. Trocar não toca em painel, marketplace nem em nada — é uma linha de configuração.
- **Por que não ficou real agora:** o gov.br só autentica apps com `client_id` credenciado e URLs de retorno registradas. Esse credenciamento é um processo oficial que não cabe na janela do hackathon. Não é limitação técnica nossa — é burocracia de homologação.
- **O que a versão final traria:**
  1. **Login sem senha nova** — o produtor entra com a **mesma conta gov.br que o SICAR já usa desde 2024**. Não é mais um cadastro, é o que ele já tem.
  2. **Identidade verificada** — CPF, nome e selo de confiabilidade (prata/ouro) confirmados pelo governo.
  3. **Assinatura eletrônica gov.br** — formaliza os contratos de venda e aluguel do marketplace dentro da própria plataforma.

**Não diga:**
- ❌ "Não deu tempo de fazer." (passa amadorismo) → diga "a base está feita, faltou só a credencial oficial".
- ❌ Que o login baixa o CAR. **Não baixa.** O gov.br confirma *quem* é a pessoa; o vínculo com a propriedade vem do **número do CAR** ou do **upload do arquivo**.

---

### P: "Quais dados o login traz? Ele puxa a propriedade do produtor automaticamente?"

**Resposta-relâmpago:**
> "O gov.br confirma identidade — CPF, nome e selo de confiabilidade —, não baixa o CAR. A propriedade entra pelo número do CAR ou pelo upload do arquivo."

**Se aprofundarem:**
- O núcleo de valor do produto (o **diagnóstico**: déficit, excedente, score) é calculado offline cruzando SICAR × MapBiomas — **nenhum dado do gov.br entra nesse cálculo**. Por isso o login não precisa ser real pra o diagnóstico funcionar.
- Os dados de identidade ganham peso na etapa de marketplace, onde o selo gov.br habilita a **assinatura eletrônica** dos contratos.

---

## 🗺️ Consulta Rápida + Mapa

### P: "De onde vem esse mapa? Como ele é gerado?"

**Resposta-relâmpago:**
> "A pessoa digita o número do CAR, a API devolve o imóvel já calculado e o mapa acende as camadas — perímetro, vegetação, Reserva Legal, APP e déficit — cada uma com sua cor. O mapa é a geometria real do imóvel (mesma do SICAR), desenhada no Leaflet."

**Se aprofundarem — a cadeia completa:**
1. **Entrada:** o usuário digita o `cod_imovel` (número do CAR) na tela inicial.
2. **API:** o frontend chama `GET /propriedades/:codImovel`. O backend (NestJS) faz **só um lookup** no PostGIS — devolve dados do imóvel, o `geo` (coleção de polígonos por camada) e o diagnóstico já pronto.
3. **Mapa:** o componente Angular `parcel-map` recebe esse `geo` e, pra cada camada, desenha um polígono no **Leaflet** com a cor definida no contrato (§5): perímetro branco tracejado, APP azul, vegetação verde-claro, Reserva Legal verde-escuro, déficit vermelho.
4. **"Acender":** as camadas aparecem em sequência (efeito `ignite`, ~1,5 s) pra dar o "momento uau" — não é cálculo, é só animação de opacidade.

**O ponto técnico forte (princípio central):** o trabalho geoespacial pesado roda **offline, antes do evento**, num pipeline Python que popula o banco com o município inteiro já calculado. Em runtime a API **nunca calcula nada** — só lê dado pronto. É isso que deixa a consulta instantânea e **à prova de wifi ruim**.

### P: "Esses dados são reais ou inventados?"

**Resposta-relâmpago:**
> "Reais. A geometria é o polígono oficial do imóvel no SICAR, e o diagnóstico é calculado pela fórmula do Código Florestal cruzando a Reserva Legal exigida com a vegetação nativa real do MapBiomas. Conferimos contra o demonstrativo oficial do próprio SICAR e bate."

**Se aprofundarem:**
- A geometria vem dos **GeoJSON oficiais do CAR** (SIRGAS 2000 / EPSG:4674), as mesmas camadas do SICAR.
- A vegetação real vem do **MapBiomas** (satélite, 30 m).
- **Déficit/excedente** = vegetação nativa real − Reserva Legal exigida (% do bioma × área). Real < exigido → déficit; real > exigido → excedente.
- Validamos a fórmula contra o **demonstrativo oficial** do SICAR (gabarito) nos imóveis-demo — os números batem.

### P: "O que significa cada cor no mapa?"

**Resposta-relâmpago:**
> "Branco tracejado é o limite do imóvel; azul é APP (beira de rio); verde-escuro é a Reserva Legal; verde-claro é vegetação nativa; amarelo é área já em uso; vermelho é o déficit — o que falta de mata. Agora dá pra passar o mouse em qualquer área que aparece a legenda."

> 💡 **Implementado:** cada camada do mapa tem **tooltip no hover** com nome, área em hectares e uma explicação de uma linha. Bom pra você (saber o que está vendo no palco) e pro avaliador (entende sozinho).

### P: "Funciona se a internet cair na hora da demo?"

**Resposta-relâmpago:**
> "Funciona. A consulta é só leitura de dado pré-calculado, e o frontend ainda tem um fallback com um imóvel de demonstração embutido — se o servidor não responder, a tela continua de pé."

---

## 🔄 Atualização Anual e Pipeline de Dados

### P: "Vocês falam em 'atualizar automaticamente'. Como isso funciona de verdade?"

**Resposta-relâmpago:**
> "Tem duas atualizações diferentes. A da **análise** é automática: todo ano o MapBiomas publica uma cobertura nova, a gente re-roda o pipeline e o diagnóstico do estado inteiro fica atualizado, sem trabalho manual. A da **declaração oficial** do produtor não é automática — e nem deveria ser: a gente gera a retificação pronta, mas quem protocola é o dono, com gov.br, porque é um ato legal dele."

**Se aprofundarem — separe SEMPRE as duas:**
1. *Atualizar a análise / mapeamento de uso e cobertura* → é o que o desafio pede. A geometria declarada não muda; o que muda ano a ano é a **leitura de satélite**. Re-rodar o pipeline recalcula vegetação real, déficit/excedente e score de todos os imóveis.
2. *Atualizar a declaração oficial no SICAR (retificação)* → **ato jurídico do dono**. A API da Central é só leitura (não existe escrita por terceiro); o envio é no módulo da própria Central, com gov.br, em geral com responsável técnico (ART). Nós geramos a **minuta**; o produtor protocola.

**Não diga:**
- ❌ "A plataforma atualiza o CAR oficial sozinha." → Ela atualiza a **análise**; a **declaração** é o dono que protocola. Reescrever silenciosamente uma declaração legal seria errado — manter humano nesse ponto é uma **força**, não uma limitação.

### P: "'Re-rodar o pipeline' é o quê? Você baixa tudo de novo manualmente?"

**Resposta-relâmpago:**
> "São três passos: pegar a cobertura do ano novo do MapBiomas, cruzar com a geometria do CAR e recalcular todos os imóveis, e carregar no banco. O MapBiomas a gente lê direto da nuvem — não baixa nada. Uma passada atualiza o município inteiro. Hoje disparo à mão pro DF; em produção é o mesmo script num cron anual."

**Se aprofundarem — os 3 passos (scripts que já existem):**
1. `pipeline/clip_mapbiomas.py` — pega a cobertura do solo do ano. Lê o arquivo nacional **direto do bucket público do MapBiomas via `/vsicurl/`** (HTTP range), pegando só a janela do bounding box — **nunca baixa** o `.tif` nacional de ~800 MB. Trocar de ano é um argumento (`--year`); um ano novo entra adicionando a URL pública dele (uma linha).
2. `pipeline/proof_chain.py` — **cruza o raster do MapBiomas com a geometria do CAR** (`zonal_stats`): conta a vegetação nativa dentro do polígono de Reserva Legal, devolve a RL real e, pela fórmula §6, o déficit/excedente/score. É a etapa que extrai o número do satélite.
3. Carrega o resultado no PostGIS → banco atualizado, runtime só lê.

**Honestidade sobre a fonte dos imóveis-demo (importante saber):** os 4 imóveis da demo são semeados (`build_seed_sql.py`) a partir do **demonstrativo oficial do SICAR** (o gabarito) — por isso os números são exatos e auditáveis contra o oficial. O cruzamento com satélite (`proof_chain.py`) está **provado com dado real do DF**, e é ele que, em produção, substitui o gabarito para cobrir **todos** os imóveis (inclusive os que não têm demonstrativo). A fórmula é a mesma nos dois caminhos; o que evolui é a fonte do "RL real": gabarito → satélite.

**As duas fontes de dado têm histórias diferentes:**
- *MapBiomas (cobertura do solo):* **não baixa nada manualmente** — streama da nuvem, troca o ano num argumento.
- *Shapefile do CAR (geometria):* hoje é download manual do portal SICAR (1 ZIP por UF), mas é **scriptável** e muda pouco (só muda quando o dono retifica).

**O ponto forte (princípio central):** o "automático anual" do desafio **não é uma feature a construir do zero** — a fórmula (§6) é a mesma em todo lugar, e o cruzamento raster × geometria **já está provado com dado real do DF** (`proof_chain.py`). O que falta é trabalho de produção: trocar a fonte do seed (gabarito → cruzamento) e rodar para todos os imóveis num agendador anual.

**Não diga:**
- ❌ "Baixamos o Brasil inteiro e processamos na hora." → O raster é lido **por janela** (range request), e o cálculo é **offline/em lote**, nunca em runtime.
- ❌ Que o déficit dos imóveis-demo "veio do satélite". Veio do **demonstrativo oficial** (gabarito); o satélite está **provado em separado** (`proof_chain.py`) e é o caminho de escala. Misturar os dois é o erro que um avaliador técnico pega.

---

## 🛰️ Acurácia, Escala e Fonte dos Dados

### P: "MapBiomas tem 30 m de resolução e margem de erro. Dá pra confiar nisso pra decidir conformidade legal?"

**Resposta-relâmpago:**
> "O MapBiomas tem acurácia geral em torno de 90% e é a base que órgãos públicos brasileiros já usam — a 30 m ela é excelente pra **triagem em escala**: dizer quem está claramente em dia, em débito ou com excedente. Pro laudo legal definitivo entra o `.CAR` completo do próprio dono e o responsável técnico. A gente não substitui o laudo; a gente prioriza quem precisa olhar."

**Se aprofundarem:**
- MapBiomas é **peer-reviewed**, série anual desde 1985, acurácia global ~**89–90%** (varia por classe e bioma — formação florestal altíssima; classes de transição, menor).
- 30 m ≈ 0,09 ha por pixel — ótimo pra imóvel rural (escala de hectares). Pode borrar **APP estreita** (faixa de poucos metros); por isso a APP fina entra com mais peso na **Análise Completa**, que usa a geometria **vetorial** do `.CAR`, não o raster.
- **Prova prática (dois testes distintos, não confundir):** (1) o cruzamento MapBiomas × geometria roda sobre dado real do DF (`proof_chain.py`) e classifica déficit/excedente por imóvel — prova o **satélite**; (2) a fórmula §6 aplicada aos números oficiais **bate com o demonstrativo do SICAR** nos imóveis-demo — prova a **fórmula contra o gabarito**. São validações separadas; juntas cobrem dado e cálculo.
- **Altitude honesta — dois níveis propositais:** Consulta Rápida = *triagem* com dado público (30 m); Análise Completa = *precisão* com o arquivo oficial vetorial.

**Não diga:**
- ❌ "MapBiomas é 100% preciso." → tem margem por classe/bioma. A força é ser triagem em escala **+ validável contra o oficial**.
- ❌ Apresentar a Consulta Rápida como laudo jurídico. É **triagem**; o laudo exige `.CAR` completo + responsável técnico.

### P: "Vocês mostram só o DF. Quanto custa/demora rodar isso pro Brasil inteiro?"

**Resposta-relâmpago:**
> "O custo é linear e barato porque o pesado roda **offline, uma vez por ano**, e o resultado é dado leve no banco — alguns números e polígonos por imóvel. Escalar do DF pro Brasil é mais máquina rodando em lote por algumas horas, não uma arquitetura nova."

**Se aprofundarem:**
- O que pesa é cruzar raster × geometria — e isso é **offline e paralelizável por município/UF** (cada um é independente, dá pra distribuir).
- O que fica no banco por imóvel é minúsculo: déficit, excedente, score, texto e os polígonos por camada. O CAR nacional tem ~**6,9 milhões** de imóveis → é volume de banco geoespacial **comum**, não exótico.
- **Em runtime não muda nada:** continua sendo um lookup por `cod_imovel`, instantâneo, seja 1 município ou o país inteiro.
- A fonte não vira gargalo: o MapBiomas já é nacional e a gente lê **por janela**.

**Não diga:**
- ❌ Cravar um número de horas/custo que você não mediu. Fale da **forma** (offline, em lote, linear, paralelizável), não de um valor inventado.

### P: "Por que MapBiomas, e não a análise do próprio SICAR, ou PRODES/DETER, ou imagem de satélite crua?"

**Resposta-relâmpago:**
> "Porque o MapBiomas é aberto, anual, nacional e padronizado — exatamente o que o desafio pede pra 'atualizar anualmente o uso e cobertura de todos os estados'. É a mesma base que órgãos públicos já usam: a gente fala a língua do governo, sem custo de licença e sem depender de imagem proprietária."

**Se aprofundarem:**
- MapBiomas entrega **uso e cobertura já classificado** (mata, agricultura, pasto…), não imagem crua que teríamos que classificar — é o que permite calcular vegetação nativa direto.
- Série temporal **consistente** (mesma metodologia ano a ano) → comparabilidade anual, que é o verbo do desafio.
- **Alternativas:** PRODES/DETER focam **desmatamento na Amazônia**, não cobertura completa de todos os biomas; Sentinel/Landsat **cru** exigiria classificar por conta (caro e menos auditável). MapBiomas entrega o produto pronto e peer-reviewed.
- É **complementar** à análise do SICAR, não concorrente: usamos a mesma lógica do Código Florestal e conferimos contra o demonstrativo oficial.

**Não diga:**
- ❌ "MapBiomas substitui o SICAR." → **complementa**. O SICAR é o cadastro oficial; o MapBiomas é a leitura de satélite que mantém a análise atualizada.

---

## 📊 Diagnóstico, Score e Texto da IA

### P: "Como esse score de conformidade é calculado? É um número mágico?"

**Resposta-relâmpago:**
> "Não tem nada de mágico — é uma fórmula auditável. O score mede quanto da Reserva Legal exigida pela lei o imóvel realmente cumpre, com um desconto se houver APP a recuperar. Cem por cento = mata em dia; quanto mais déficit, menor o número."

**Se aprofundarem — a fórmula (contrato §6):**
- **Base — Reserva Legal:** `rlRatio = vegetação real em RL ÷ RL exigida pela lei` (no máximo 1). A lei exige 20% do imóvel no Cerrado/Caatinga/Mata Atlântica e 80% na Amazônia.
- **Desconto — APP:** se há Área de Preservação Permanente a recompor, tira até 30 pontos.
- **Fórmula:** `score = 100 × (0,75 × rlRatio + 0,25) − penalidade de APP`, limitado entre 0 e 100.
- **Faixas do selo:** ≥ 80 = **Em dia** (verde) · 50–79 = **Com pendências** (amarelo) · < 50 = **Irregular** (vermelho).
- **Exemplos reais:** `MG-3127008` tem RL completa → score **100** (Em dia). `CE-2300705` praticamente não tem mata → `rlRatio ≈ 0` → score **25** (Irregular).

> Por que começa em 25 e não 0 quando não há RL? É uma escolha de design: o "0,25" é um piso que evita dramatizar demais (nenhum imóvel é "zero"), e mantém o número legível. O que importa é a **ordem**: déficit forte fica vermelho, excedente fica verde.

### P: "Esse texto do diagnóstico é gerado por IA? Como?"

**Resposta-relâmpago:**
> "O texto é redigido por IA a partir dos números que a fórmula já calculou — a IA traduz hectare e lei para linguagem de gente, mas **nunca inventa o cálculo**. No MVP ele já vem pronto no banco pra demo ser instantânea e offline; em produção, a mesma chamada roda ao vivo para cada imóvel."

**Se aprofundarem:**
- **O princípio que protege a gente:** a IA **explica, não calcula**. O déficit, o score, os hectares — tudo sai da fórmula auditável (§6). A IA só recebe esses números prontos e os redige em português claro ("faltam ~21 ha, uns 21 campos de futebol"). Isso elimina o risco de a IA "alucinar" um número errado — é auditável de ponta a ponta.
- **No MVP:** o texto está pré-gerado e gravado na coluna `texto_ia` do banco (não há LLM rodando ao vivo). Foi uma decisão consciente: deixa a demo instantânea e à prova de wifi ruim, igual ao resto do sistema.
- **Em produção:** a arquitetura prevê plugar a chamada ao LLM (Claude) gerando o texto sob demanda — recebendo os números calculados como entrada fixa. O design já separa "cálculo" de "redação".

**Não diga:**
- ❌ "A IA calcula o diagnóstico." → Ela **redige** o diagnóstico; o cálculo é uma fórmula determinística e auditável. Essa distinção é a força do pitch (sem alucinação).

### P: "De onde vêm os valores de R$ (recompor / CRA / aluguel) no painel?"

**Resposta-relâmpago:**
> "Esses valores são ilustrativos no MVP, pra mostrar a ordem de grandeza: recompor é caro, comprar cota é intermediário, alugar é o mais barato. Em produção viriam dos preços reais de CRA e das ofertas do próprio marketplace."

**Não diga:**
- ❌ Apresentar os R$ como preço de mercado exato. São **estimativas ilustrativas** (multiplicadores sobre o déficit) — a mensagem verdadeira é a **comparação relativa** entre as três saídas, não o valor absoluto.

### P: "Os números do diagnóstico são confiáveis? Como sei que a conta está certa?"

**Resposta-relâmpago:**
> "Validamos contra o demonstrativo oficial do próprio SICAR — nossa fórmula de Reserva Legal bate com o número que o governo calcula. E na tela cada linha mostra a fonte: declarado (CAR), satélite (MapBiomas) ou calculado (lei)."

**Se aprofundarem:**
- O painel tem uma legenda de **proveniência**: cada cobertura é marcada como `declarado` (veio do CAR), `satélite` (MapBiomas) ou `calculado` (Lei 12.651). Transparência total sobre a origem de cada número.

---

## 🤝 Marketplace (venda de CRA / aluguel de servidão)

### P: "O que é esse marketplace? Para que serve?"

**Resposta-relâmpago:**
> "É onde quem tem mata sobrando encontra quem tem mata faltando. Quem tem excedente de Reserva Legal anuncia — como venda de cota (CRA) ou aluguel da reserva — e quem tem déficit compensa comprando ou alugando, em vez de replantar tudo do zero. Vira renda de um lado e regularização barata do outro."

### P: "Como funciona o 'casamento' entre déficit e oferta?"

**Resposta-relâmpago:**
> "O sistema marca quais ofertas são compatíveis com o déficit do imóvel — pelo bioma — e mostra o botão 'Casar'. Ao casar, o pareamento fica registrado e a oferta sai como 'casada'. É o começo da trilha rastreável da compensação."

**Se aprofundarem:**
- **Compatibilidade = mesmo bioma.** Isso não é capricho: o Código Florestal (Lei 12.651, Art. 48) **exige que a compensação de Reserva Legal seja no mesmo bioma**. Então a regra do sistema reflete a lei.
- Fluxo: `GET /marketplace/ofertas` lista as ofertas (com flag `compativel`); o usuário clica em **Casar**; se não estiver logado, cai no login gov.br; depois `POST /marketplace/match` registra o pareamento (status `proposto`) e marca a oferta como `casada`.

### P: "Venda e aluguel são coisas diferentes no sistema? Como vocês modelam?"

**Resposta-relâmpago:**
> "É a mesma estrutura, com um campo `tipo_oferta` que diz se é venda ou arrendamento. Aluguel só acrescenta prazo e valor por período. Não duplicamos modelos — é uma oferta só, com dois sabores."

### P: "As ofertas são reais? E o que acontece depois que eu caso — tem contrato, pagamento?"

**Resposta-relâmpago:**
> "No MVP as ofertas são uma base de demonstração, e o casamento registra o pareamento — o pagamento e o contrato assinado são a camada seguinte, que usa a assinatura eletrônica do gov.br para fechar tudo dentro da plataforma. O endpoint de criar oferta já existe; um produtor com excedente consegue anunciar."

**Não diga:**
- ❌ "Já dá pra comprar e pagar agora." → O MVP **registra a intenção** (match `proposto`); a formalização (contrato + assinatura gov.br + pagamento) é a evolução planejada.

### P: "Quando eu confirmo o pareamento, é gerado um documento oficial? A compensação acontece de verdade?"

**Resposta-relâmpago:**
> "No MVP, o pareamento registra a intenção e simula o contrato assinado para mostrar a experiência. O documento oficial e a baixa do déficit dependem de registro no órgão ambiental (CRA) ou de averbação em cartório (servidão) — que a versão final integra. A plataforma conduz o negócio e a assinatura; a validade jurídica vem do registro."

**Se aprofundarem — o fluxo real de produção (4 etapas; a plataforma orquestra, não substitui):**
1. **Gera o contrato** (compra de CRA ou arrendamento de servidão) a partir do pareamento.
2. **Assinatura eletrônica gov.br** dos dois lados (é aqui que o login real importa).
3. **Registro oficial:** CRA emitida/transferida no sistema do órgão ambiental; servidão ambiental averbada no cartório de registro de imóveis.
4. **Vínculo no CAR/SICAR** ao imóvel deficitário — só então o déficit baixa oficialmente.

**O que o MVP faz hoje (honesto):** `POST /marketplace/match` grava o pareamento (status `proposto`) e marca a oferta como `casada`. A tela de "contrato assinado via gov.br" é **ilustrativa** (HTML fixo: CPF, data e assinatura são literais). Não gera PDF, não coleta assinatura real, não move dinheiro.

### P: "Como funciona a transferência? Venda e aluguel são a mesma coisa?"

**Resposta-relâmpago:**
> "São dois instrumentos jurídicos. Venda é CRA — um título que representa a mata excedente e transfere de forma definitiva. Aluguel é servidão ambiental — o dono mantém a terra e aluga o excedente por um prazo. Mesma estrutura no sistema, com um campo que diz qual é."

| | **Venda (CRA)** | **Aluguel (servidão)** |
|---|---|---|
| O que é | Título de 1 ha de mata excedente | Encargo de conservação por prazo |
| Posse | Transfere (definitivo) | Dono mantém; aluga o excedente |
| Formaliza | Sistema de CRA do órgão ambiental | Averbação em cartório |
| Geografia | "Identidade ecológica" (STF ADC 42) | Mesmo bioma |

**Não diga (a menos que perguntem):** a discussão jurídica da **ADC 42** sobre o critério geográfico da CRA. A regra simples e segura no palco é **mesmo bioma** (o que o sistema aplica). Só traga a ADC 42 se a banca for jurídica e cutucar.

> ⚠️ **Dispare o "casar" sempre de um imóvel COM déficit** (`CE-2300705`). O modal mostra "cobre o déficit de X ha" usando o déficit do imóvel atual — se você vier de um imóvel sem déficit (ex.: o imóvel da Análise Completa, déficit 0,0 ha), o texto fica sem sentido ("cobre o déficit de 0,0 ha").

> ✅ **Compatibilidade por bioma — corrigida.** A flag "compatível" agora deriva do bioma do **imóvel realmente consultado** (não de um valor fixo). Pode consultar qualquer déficit — Cerrado (`CE-2300705`) ou Mata Atlântica (`PR-4110201`) — que as ofertas compatíveis aparecem certas. Ainda assim, o caminho de demo mais rico continua sendo o **`CE-2300705` (déficit Cerrado)**, porque o seed tem mais ofertas Cerrado para casar.

---

## 📎 Análise Completa (upload .CAR → pendências → retificação)

### P: "O que a Análise Completa faz a mais que a Consulta Rápida?"

**Resposta-relâmpago:**
> "A Consulta Rápida usa só o que é público pelo número do CAR. A Análise Completa pede o arquivo .CAR completo do produtor — que traz a geometria da Reserva Legal e das APPs — e com isso mostra as pendências e gera o rascunho da retificação para corrigir o cadastro."

**Se aprofundarem:**
- Só o `.CAR` **completo** traz a **etapa Geo** (polígonos de RL e APP). O demonstrativo simplificado (PDF) não tem geometria — sem ela, não dá para calcular pendência nem retificar.
- A tela ainda ensina o passo a passo para baixar o arquivo na Central do Proprietário do SICAR.

### P: "Vocês conseguem mesmo ler esse arquivo .CAR? Não é um formato fechado?"

**Resposta-relâmpago:**
> "Conseguimos, e isso é um dos nossos achados: o .CAR não é formato proprietário fechado — é um ZIP de JSON com a geometria em GeoJSON padrão. A gente abre, lê os polígonos e roda a fórmula do Código Florestal. Testamos com um arquivo real e os números batem com o demonstrativo oficial."

**Se aprofundarem:**
- O parser (`ret-parser.ts`) é **real**: descompacta o ZIP, lê o JSON principal, extrai cada camada (`tipo`, `área`, `geoJson`) e calcula o diagnóstico pela **mesma fórmula §6** da Consulta Rápida. Validado contra `CE-2313302`.

### P: "Essas pendências são oficiais? E a minuta de retificação, é o documento que protocola?"

**Resposta-relâmpago:**
> "As pendências saem da geometria do próprio arquivo completo e batem com o demonstrativo oficial do SICAR. A minuta é um rascunho gerado a partir desses números — o documento que o produtor revisa e leva à Central para protocolar. Não é o protocolo em si; é o que tira o produtor do 'não sei o que fazer'."

**Não diga:**
- ❌ "A minuta já retifica o CAR sozinha." → É um **rascunho** (o próprio texto diz que deve ser revisado por responsável técnico). O protocolo oficial é feito na Central do CAR.

> ⚠️ **Caminho de demo:** suba o arquivo `data/raw/ret/CE-2313302_completo.ret`. É o que está validado ponta a ponta. O botão "Baixar minuta (.txt)" baixa a minuta real (texto completo devolvido pela API; offline, monta um fallback dos números) — funciona de verdade.

---

## 🌳 Corredores (tela de impacto coletivo)

### P: "O que é essa tela de Corredores? De onde vêm esses números (18 km, 34 pareamentos)?"

**Resposta-relâmpago:**
> "É a tela que mostra o impacto coletivo da plataforma: quando muitos vizinhos casam déficit e excedente, a recomposição é direcionada para onde conecta fragmentos de mata, formando corredores ecológicos. Os números aqui são ilustrativos — é a visão de para onde isso escala, não uma medição."

**Se aprofundarem — por que isso importa:**
- O diferencial não é só regularizar um imóvel: é que, **coordenando as compensações**, o que seria um monte de remendos isolados vira **mata contínua e conectada**. Fauna volta a circular, a microbacia se recupera.
- É o efeito de rede: cada pareamento individual no marketplace, somado e direcionado, produz um ganho ambiental muito maior que a soma das partes.

**Não diga:**
- ❌ "Medimos 18 km de corredor / 34 pareamentos reais." → São **números ilustrativos de pitch**. A mensagem honesta é a **direção** ("a plataforma empurra a recomposição para onde conecta"), não a métrica.
- Em produção, esses números viriam de uma análise geoespacial real de conectividade de fragmentos — é uma evolução natural do pipeline que já cruza geometria.

---

## ⚙️ Arquitetura, escala e dados (perguntas transversais)

### P: "Por que tudo é pré-calculado offline? Isso não é gambiarra pra demo?"

**Resposta-relâmpago:**
> "É decisão de arquitetura, não atalho. O trabalho geoespacial pesado roda antes, num pipeline que calcula o município inteiro de uma vez. Em runtime a API só lê dado pronto — por isso a consulta é instantânea e funciona mesmo com internet ruim. É o mesmo padrão de quem serve mapa em escala."

**Se aprofundarem:**
- Calcular cruzamento de polígono com raster de satélite na hora de cada request seria lento e frágil. Fazer em lote, antes, é o que permite **escala** (município/estado todo) e **velocidade** (lookup O(1) por `cod_imovel`).
- Isso casa direto com o pedido do desafio: *atualizar anualmente, em escala*. O pipeline roda quando sai a nova coleção do MapBiomas, reprocessa tudo, e o runtime continua só lendo.

### P: "Qual a stack e por que escolheram?"

**Resposta-relâmpago:**
> "PostgreSQL com PostGIS porque é o banco que entende geometria nativamente; NestJS e Angular porque é TypeScript ponta a ponta, uma linguagem só; Leaflet pro mapa porque é leve e não depende de chave/tiles externos; e Python no pipeline porque é o padrão de geoprocessamento (geopandas, rasterio)."

**Se aprofundarem — cada escolha tem um porquê:**
- **PostGIS** — faz operações espaciais (interseção, recorte, área) no próprio banco; nenhum banco comum faz isso.
- **NestJS** — modular, com validação de DTO; isola bem o `AuthModule` atrás de interface (troca mock→gov.br sem refatorar).
- **Angular (standalone + signals)** — moderno e reativo; o mapa "acende" via signal.
- **Leaflet** — mapa leve que desenha só os polígonos do imóvel, sem tiles de internet → **à prova de wifi ruim**.
- **Python (pipeline)** — geopandas/rasterio/rasterstats são o ferramental de fato do geoprocessamento.

### P: "Como isso escala para um estado ou o país inteiro?"

**Resposta-relâmpago:**
> "A arquitetura já é a de escala: a demo é o Distrito Federal, mas pra rodar outro estado é só apontar o pipeline para os shapefiles daquele estado e o MapBiomas — que cobrem o Brasil todo. O runtime não muda; cada imóvel continua sendo um lookup rápido indexado pelo número do CAR."

**Se aprofundarem:**
- O custo pesado é o pré-processamento, que é **paralelizável por estado** e roda fora do horário de pico.
- MapBiomas é nacional e anual; os shapefiles do CAR são públicos por UF. Os insumos pra escalar **já existem** — não é redesenho, é mais dado pelo mesmo cano.

### P: "Se o SICAR já calcula o diagnóstico, qual é o valor de vocês?"

**Resposta-relâmpago:**
> "O SICAR mostra o que o produtor declarou, em linguagem técnica, um imóvel por vez, e só quando ele vai lá olhar. A gente traduz pra linguagem de gente, confere o declarado contra o satélite, faz isso em lote pro município inteiro de forma proativa — e ainda conecta quem tem mata sobrando com quem precisa compensar. Isso o SICAR não faz."

**Se aprofundarem:**
- A consulta pública do SICAR mostra o **declarado**, não o que o órgão apontaria como inconsistente. Nós cruzamos com a verdade do satélite (MapBiomas).
- SICAR é **reativo** (você precisa ir buscar) e **individual**; nosso motor é **proativo** (calcula todo mundo antes) e **coletivo** (marketplace).

### P: "E a segurança e a LGPD dos dados?"

**Resposta-relâmpago:**
> "Quase tudo que usamos é dado público — geometria do CAR e cobertura do MapBiomas. Dado pessoal só aparece no login (CPF e nome), que vem do próprio gov.br com consentimento do usuário. No MVP nem guardamos CPF real — fica mascarado. Em produção, o tratamento segue a LGPD, com o gov.br como fonte de identidade e o contrato como base legal."

**Se aprofundarem:**
- Diagnóstico e mapa operam sobre **dado cadastral público** — sem dado sensível.
- O vínculo pessoa↔imóvel é confirmado pelo gov.br (identidade verificada), o que é mais seguro que cadastro com senha própria.
- Os contratos do marketplace envolveriam dado pessoal sob base legal de **execução de contrato**, com assinatura eletrônica gov.br — rastreável e auditável.

### P: "Qual foi o maior risco técnico, e como validaram?"

**Resposta-relâmpago:**
> "O maior risco era o cruzamento geoespacial — projeções, recorte de raster, a fórmula da Reserva Legal bater com a realidade. Validamos cedo, com dados reais do DF, e a nossa conta fechou com o demonstrativo oficial do SICAR. Esse era o coração; provado ele, o resto é montagem."

---

## 🧩 O que é REAL vs. MOCK (tabela honesta — sua blindagem)

Se perguntarem "o que aqui é de verdade?", responda com transparência — isso passa **mais** credibilidade que fingir que tudo é real.

| Componente | Status | Observação curta |
|---|---|---|
| Consulta Rápida (lookup) | ✅ Real | lê dado pré-calculado no PostGIS |
| Geometria do mapa | ✅ Real | GeoJSON oficial do CAR |
| Cálculo de déficit / score | ✅ Real | fórmula §6, bate com o demonstrativo oficial |
| Parser do `.CAR` (upload) | ✅ Real | abre o ZIP de JSON e lê a geometria |
| Pendências da Análise Completa | ✅ Real | derivadas do arquivo enviado |
| Minuta de retificação | ✅ Real (templated) | texto montado dos números (sem LLM) |
| Download da minuta | ✅ Real | baixa o `.txt` com o texto real |
| Compatibilidade de bioma | ✅ Real | mesmo bioma do imóvel consultado (Art. 48) |
| Texto do diagnóstico ("IA") | 🟡 Pré-gerado | redigido por IA, gravado no seed; produção roda ao vivo |
| Ofertas do marketplace | 🟡 Seed | base de demonstração; endpoint de criar oferta é real |
| Valores em R$ da compensação | 🟡 Ilustrativo | mostram ordem de grandeza, não preço de mercado |
| Login gov.br | 🟠 Mock | interface pronta; falta só o `client_id` oficial |
| Assinatura do contrato | 🟠 Mock | tela ilustrativa; produção = assinatura gov.br + registro |
| Números dos Corredores | 🟠 Ilustrativo | visão de pitch, não medição |

**Legenda:** ✅ funciona de verdade · 🟡 real na lógica, dado/recurso simplificado · 🟠 simulado (com caminho claro pra virar real).

**A frase que resume tudo:**
> "O motor de dados — geometria, cálculo, diagnóstico, parser — é real e validado contra o oficial. O que está mockado são as integrações externas (login e assinatura gov.br) e alguns dados de vitrine — e cada uma tem um caminho claro de produção, porque a arquitetura já foi desenhada pra isso."

---
