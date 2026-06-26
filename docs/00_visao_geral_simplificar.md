# SimplifiCAR — Visão Geral do Projeto

> Documento base, lido pelos dois membros do time. É a fonte da verdade do projeto.
> As docs técnica (Raphael) e de domínio/pitch (Bianca) se penduram nesta.
> **Nome:** "SimplifiCAR" (simplificar + CAR) — definido. Nomes anteriores descartados: "Reverde", "Meu CAR em Dia".

---

## Pitch em uma linha

Plataforma que ajuda o produtor rural a fazer e corrigir o cadastro ambiental da terra dele (o CAR), diz na hora se ele está em dia com a lei, e transforma a regularização em oportunidade: quem tem mata sobrando vende ou aluga esse excedente para quem está em débito.

---

## O problema (Desafio 2 do hackathon)

Todo imóvel rural no Brasil é obrigado a ter o CAR, o Cadastro Ambiental Rural. Fazer e principalmente corrigir esse cadastro é caro, lento e confuso. O sistema oficial (SICAR) é cheio de termo técnico e mapa que o pequeno produtor não entende. O resultado: muita gente faz errado, recebe pendência, ou simplesmente não mexe e fica irregular. Cadastro irregular trava crédito rural, licenças e a venda da safra.

O Desafio 2 pede exatamente isto: simplificar a declaração e a retificação do CAR usando bases de dados abertas, garantindo o cumprimento do Código Florestal e gerando benefícios individuais e coletivos.

---

## A solução

A plataforma funciona como um funil único, não como features soltas:

1. **Diagnóstico.** O produtor entra, identifica a propriedade, e em segundos vê um raio-x de conformidade em linguagem simples: está em dia? O que falta? O que fazer?
2. **Retificação assistida.** A plataforma ajuda a corrigir o cadastro e gera o arquivo pronto para enviar ao SICAR.
3. **Marketplace de ativos ambientais.** O diagnóstico revela se a terra tem mata sobrando (excedente) ou faltando (déficit). Isso vira oferta e procura: quem tem excedente vende ou aluga, quem tem déficit compensa.

O ponto que amarra tudo: **o cadastro alimenta o marketplace.** Ao regularizar, a plataforma descobre e qualifica quem vende, quem aluga e quem precisa comprar. Não são dois produtos, é um só.

---

## O insight diferencial (o que nos diferencia)

A maioria das equipes vai parar no "você está irregular". Nós viramos o jogo: **regularização deixa de ser custo e vira ativo.** Quem preservou além do exigido tem um bem que vale dinheiro. Quem deve, compensa de forma mais barata que recompondo na própria terra. O marketplace conecta os dois lados.

O moat (vantagem difícil de copiar) está no time: domínio ambiental e de energia (Bianca), engenharia de dado geoespacial e IA (Raphael), e a lógica de ativo verde com registro rastreável. Essa combinação raramente mora na mesma equipe.

---

## Os dois caminhos de entrada

Dois degraus do mesmo funil, com papéis distintos. A diferença não é precisão geográfica (a geometria é praticamente a mesma), é o que o dado é, quão atual ele é, e o que dá para fazer com ele.

| | **Consulta Rápida** | **Análise Completa** |
|---|---|---|
| Como entra | Digita o número do CAR | Faz upload do arquivo `.CAR` completo da Central |
| Fonte | Base pública pré-carregada (foto periódica) | Arquivo oficial do próprio dono, atual |
| Traz pendências oficiais? | Não (só o declarado) | Sim (resultado da análise do órgão) |
| Gera retificação para enviar? | Não | Sim |
| Papel | Descobrir (gancho, grátis, alimenta o marketplace) | Resolver (valor profundo, retificação real) |

A Consulta Rápida atrai e diagnostica. A Análise Completa resolve e entrega o arquivo de retificação. Detalhes de domínio e as instruções de como o produtor baixa o arquivo completo estão na Doc 3 (Bianca).

---

## O marketplace: venda e aluguel

O Código Florestal (Lei 12.651/2012, art. 66) permite que quem tem déficit de Reserva Legal compense usando área de outra propriedade. Duas dessas formas viram dois tipos de oferta na plataforma:

- **Venda (CRA, Cota de Reserva Ambiental):** o dono da mata vende um título que representa a área. Transação definitiva.
- **Aluguel (arrendamento de servidão ambiental):** o dono mantém a terra e aluga o excedente por um prazo. Renda recorrente, sem abrir mão da propriedade.

Tecnicamente, é um campo `tipo_oferta` (venda ou arrendamento); no arrendamento entram prazo e valor periódico. Custo baixo de implementação, ganho grande de narrativa, e fecha o ciclo do produtor (diagnostiquei, regularizei, monetizei ou compensei).

---

## Autenticação gov.br (mockup no MVP, implementação planejada)

No fim de semana, o "Entrar com gov.br" é um **mockup**: o botão existe e cai direto num painel já preenchido, para o demo ficar rápido. Mas o design já é pensado para virar real depois. Como vai funcionar em produção, e por que isso fortalece o pitch:

- O gov.br confirma **quem** é a pessoa (CPF e nome com confiabilidade prata/ouro), dispensando cadastro com senha nova.
- É a **mesma conta** que o SICAR passou a usar para login desde o fim de 2024. Ou seja, não é um login a mais, é o que o produtor já tem para acessar o CAR.
- Habilita a **assinatura eletrônica gov.br**, que formaliza os contratos de venda e aluguel do marketplace dentro da própria plataforma.

Importante para o palco: o login gov.br confirma identidade, mas **não baixa o CAR junto**. O vínculo com a propriedade vem do número do CAR ou do upload do arquivo. Em produção, a captura automática evoluiria via integração oficial.

---

## O fluxo do demo (o momento uau)

1. Toque em **Entrar com gov.br** (mockup). Cai direto num painel já carregado, sem formulário no meio.
2. O painel mostra a propriedade com o **mapa aceso**: polígono da fazenda, APP em azul, Reserva Legal em verde, déficit em vermelho.
3. Um **score de conformidade** grande aparece (ex: "Conformidade 62%").
4. A IA traduz em linguagem simples: o que falta, o que fazer, e o gancho ("você tem 8 hectares de excedente que valem X" ou "déficit de 8 hectares, veja como compensar").
5. O botão de agir leva ao **marketplace**: anuncia o excedente (venda ou aluguel) ou procura área para compensar.

Regra de ouro do demo: o impacto visual vem rápido. Nada de tela de formulário comendo o tempo do pitch.

---

## Escopo: base sólida vs cereja

Duas camadas, para nunca ficar sem demo.

- **Base sólida (entrega garantida):** login gov.br mockado, Consulta Rápida com mapa e score, diagnóstico em linguagem simples sobre um município pré-carregado.
- **Cereja (se der tempo):** Análise Completa com upload e geração de retificação, marketplace com venda e aluguel, e a camada de registro rastreável.

Se o tempo apertar, corta a cereja de cima para baixo e ainda sobra um produto que funciona e impressiona.

Truque honesto de execução: o processamento geoespacial pesado roda **antes** do evento, com um município pré-carregado no banco. No demo, a busca pelo número do CAR consulta o que já está pronto e parece instantânea.

---

## Divisão de tarefas (resumo)

**Raphael (núcleo técnico):** backend NestJS + PostGIS, pré-processamento geoespacial, mapa Angular, camada de IA do diagnóstico, mockup do login gov.br. Detalhe na Doc 2.

**Bianca (domínio e narrativa):** regras do Código Florestal que viram cálculo, lógica de ativo (venda e aluguel), instruções de captura do arquivo completo, e o pitch. Detalhe na Doc 3.

---

## Critérios de julgamento e como atacamos

- **Aderência ao desafio:** atacamos declaração e retificação direto, com bases abertas e cumprimento do Código Florestal.
- **Execução técnica:** demo que funciona de verdade, com dado real pré-carregado, não maquete.
- **Impacto individual e coletivo:** individual destrava crédito e revela valor; coletivo empurra recuperação para onde faz sentido ambiental, formando corredores ecológicos.
- **Pitch:** história clara que faz o júri entender o problema mesmo sem saber o que é CAR.

---

## Glossário rápido

- **CAR:** Cadastro Ambiental Rural. O "RG ambiental" da fazenda, obrigatório.
- **SICAR:** o sistema oficial do governo onde o CAR vive.
- **APP (Área de Preservação Permanente):** faixas intocáveis (margem de rio, nascente, topo de morro).
- **Reserva Legal:** porcentagem da propriedade que deve ficar com mato nativo (em geral 20%, até 80% na Amazônia).
- **Área consolidada:** área já ocupada antes de 22/07/2008.
- **Déficit / Excedente:** mata faltando (déficit) ou sobrando (excedente) em relação ao exigido por lei.
- **CRA (Cota de Reserva Ambiental):** título que representa área de mata, usado para venda/compensação.
- **Arrendamento de servidão ambiental:** o "aluguel" do excedente de mata por um prazo.
- **MapBiomas:** base aberta de uso e cobertura do solo, usada para ver a mata que existe de verdade.
- **Código Florestal:** Lei 12.651/2012, a base legal de tudo isso.
