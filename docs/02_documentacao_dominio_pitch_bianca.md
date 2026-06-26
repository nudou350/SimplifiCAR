# Reverde — Domínio e Pitch (Bianca)

> Onde o conhecimento ambiental vira regra de negócio e onde nasce o pitch.
> Pende da Doc 1 (Visão Geral). Os números legais aqui são a base do cálculo da Doc 2.
> Itens marcados com **[validar]** são de domínio da Bianca e devem ser conferidos na fonte legal antes do pitch.

---

## 1. Conceitos do Código Florestal (Lei 12.651/2012)

A propriedade rural tem áreas que a lei obriga a manter com vegetação. As três que importam para o nosso cálculo:

- **APP (Área de Preservação Permanente):** faixas intocáveis que protegem a natureza. Margem de rio (a largura da faixa depende da largura do rio), raio de 50 m ao redor de nascentes, topo de morro, encostas acima de 45 graus. O SICAR gera boa parte dessas APPs automaticamente a partir da hidrografia e do relevo.
- **Reserva Legal (RL):** porcentagem da propriedade que deve permanecer com mato nativo. Percentuais (art. 12) **[validar]**:
  - Amazônia Legal: 80% em área de floresta, 35% em cerrado, 20% em campos gerais.
  - Demais regiões do país: 20%.
- **Área consolidada:** área já ocupada com atividade antes de 22/07/2008, que tem regras próprias de regularização.

---

## 2. Como medir déficit e excedente (a regra que vira cálculo)

Esta é a lógica que o pipeline da Doc 2 executa. Por imóvel:

1. **Exigido:** percentual de RL do bioma aplicado à área total da propriedade.
2. **Real:** quanta vegetação nativa de fato existe na área de RL (cruzando o polígono declarado com a cobertura real do MapBiomas).
3. **Resultado:**
   - Real menor que exigido = **déficit** (a terra deve mata). Vira demanda no marketplace.
   - Real maior que exigido = **excedente** (a terra tem mata sobrando). Vira oferta no marketplace.
4. **Score de conformidade:** uma nota simples de 0 a 100 que resume o quão em dia está o imóvel, fácil de mostrar no painel.

**[validar]** A definição exata de "exigido" tem detalhes por bioma e por data de ocupação. Para o demo, uma regra simplificada por bioma já basta; para o pitch, conhecer os detalhes evita perguntas difíceis.

---

## 3. As pendências oficiais (por que a Análise Completa importa)

A consulta pública pelo número do CAR só mostra o que o produtor **declarou**. Ela não mostra o que o órgão ambiental já apontou como errado. A análise oficial é rigorosa: no Paraná, por exemplo, ela incide sobre 61 itens, em ciclos, e gera notificação quando acha inconsistência **[validar para outros estados]**.

Esse resultado da análise (as pendências) só está no ambiente do dono, na Central do Proprietário/Possuidor. Por isso a Análise Completa, que usa o arquivo do próprio produtor, consegue mostrar as pendências oficiais e gerar uma retificação de verdade. A Consulta Rápida não consegue.

Dado de impacto para o pitch: dos cerca de 7 milhões de cadastros feitos, menos de 1% foi validado pelo poder público. A fila é gigante e muita coisa está parada esperando retificação do produtor. Nosso produto ataca exatamente esse gargalo. **[validar número atualizado]**

---

## 4. Os dois caminhos, explicados para o usuário

### Consulta Rápida (digita o número do CAR)
Para descobrir a situação na hora. Grátis, instantânea. Mostra o diagnóstico e o gancho (excedente ou déficit), e convida para o marketplace. É o que atrai.

### Análise Completa (upload do arquivo completo)
Para resolver de verdade: lê as pendências oficiais e gera o arquivo de retificação pronto para enviar. Precisa do arquivo `.CAR` **completo** do próprio produtor.

**Por que precisamos do arquivo completo (e não do simplificado):** o `.RET` simplificado traz só o limite do imóvel, sem a etapa Geo (sem os polígonos internos de RL e APP). Sem esses polígonos internos, não dá para calcular conformidade nem gerar retificação. Por isso pedimos o **completo**.

### Instruções claras para o produtor obter o arquivo (mostrar na tela de upload)
1. Acesse a Central do Proprietário/Possuidor em `www.car.gov.br` e clique em "Acessar Central".
2. Faça login (hoje, com a conta gov.br).
3. Selecione o imóvel desejado.
4. Escolha a opção **"Baixar arquivo .CAR"** (ou o `.RET` **completo**, não o simplificado).
5. Suba esse arquivo aqui na Reverde.

Texto curto sugerido para a UI: "Precisamos do seu arquivo .CAR completo (com a etapa Geo) para ler suas pendências oficiais e montar sua retificação. O arquivo simplificado não serve, pois não traz os polígonos da sua reserva e APP."

---

## 5. O ativo ambiental: venda e aluguel

O art. 66 do Código Florestal permite que quem tem déficit de RL compense usando área de outra propriedade. Duas modalidades viram produto:

- **Venda (CRA, Cota de Reserva Ambiental):** título que representa a área de mata. O dono vende e transfere. Definitivo.
- **Aluguel (arrendamento de servidão ambiental):** o dono mantém a propriedade e aluga o excedente por um prazo definido. Renda recorrente, sem abrir mão da terra. A lei prevê que se estabeleça o prazo da servidão, o que torna a modalidade naturalmente temporária, ou seja, um "aluguel".

Ganho para os dois lados, nas duas modalidades. Para quem tem déficit: regulariza (destrava crédito e venda da safra) de forma mais barata que recompor na própria terra. Para quem tem excedente: a mata além do exigido vira renda, monetizando um recurso que estava parado.

### Regra geográfica (atenção no palco) **[validar]**
- Para o **arrendamento de servidão**, vale o critério de **mesmo bioma**.
- Para a **CRA**, o STF (ADC 42) puxou para um critério mais apertado de "identidade ecológica", o que gerou alguma insegurança jurídica sobre qual critério aplicar.

Na prática do produto não muda nada, mas se um jurado citar a ADC 42, a resposta é que conhecemos a distinção entre os critérios das duas modalidades.

> Nota: isto é enquadramento de produto para hackathon, não aconselhamento jurídico. Os detalhes finos devem ser validados na fonte legal.

---

## 6. Benefícios individuais e coletivos (o desafio pede os dois)

- **Individual:** o produtor descobre a situação dele, regulariza, destrava crédito rural, e ainda pode descobrir valor escondido na terra (excedente que vira renda).
- **Coletivo:** o marketplace empurra a recuperação e a compensação para onde faz sentido ambiental (mesmo bioma, áreas prioritárias), favorecendo a recuperação de bacias muito desmatadas e a formação de corredores ecológicos. O Código Florestal inclusive cita esses objetivos coletivos ao tratar das áreas prioritárias de compensação.

---

## 7. Autenticação gov.br: a narrativa do pitch

No demo é mockup, mas a história é forte:

- "O produtor entra com o gov.br, a **mesma conta** que ele já usa para acessar o CAR desde o fim de 2024."
- "Sem cadastro novo, sem senha nova, e com a identidade confirmada (confiabilidade prata ou ouro)."
- "E como a venda e o aluguel viram contrato, a formalização usa a **assinatura eletrônica gov.br**, dentro da própria plataforma."

Honestidade técnica que impressiona: "o gov.br confirma quem é a pessoa; os dados do CAR vêm do número da propriedade ou do arquivo. Em produção, a captura evolui via integração oficial."

---

## 8. Estrutura do pitch

1. **O problema (20s, sem jargão):** todo fazendeiro precisa do cadastro ambiental em dia. Fazer e corrigir é caro e confuso, então muita gente fica irregular e perde acesso a crédito. (Conte como uma pessoa, não como uma lei.)
2. **A solução:** a Reverde diagnostica na hora, ajuda a corrigir, e transforma a regularização em oportunidade.
3. **Demo ao vivo:** login gov.br, mapa acende, score, diagnóstico em português de gente, o gancho do excedente/déficit.
4. **O diferencial:** o marketplace que conecta quem tem mata sobrando (vende ou aluga) com quem precisa compensar.
5. **Impacto:** individual (crédito, renda) e coletivo (corredores ecológicos, bacias recuperadas).
6. **Roadmap:** gov.br real, assinatura eletrônica, integração oficial de dados, expansão por município.
7. **Time:** a combinação de engenharia ambiental e de energia (Bianca) com engenharia de dados e IA (Raphael) é o que torna isso difícil de copiar.

---

## 9. Munição para perguntas (transformar fraqueza em força)

- **Sobreposição de polígonos:** o CAR é autodeclarado e cheio de imóveis sobrepostos. Argumento nosso: "por ser autodeclarado, o cadastro tem muito erro; nós validamos contra dado real antes de enviar".
- **"Ter CAR não é estar regular":** ter número de CAR não significa cadastro aprovado. A maioria está em fila ou com pendência. É exatamente a dor que resolvemos.
- **Dado público desatualizado:** a Consulta Rápida usa foto periódica; a Análise Completa usa o arquivo atual do dono. Cobrimos os dois.

---

## 10. Checklist de validação antes do palco (responsabilidade Bianca)

- [ ] Percentuais de Reserva Legal por bioma e por região.
- [ ] Definição de "exigido" considerando área consolidada e data de 22/07/2008.
- [ ] Critério geográfico de venda (CRA) vs aluguel (arrendamento) e o status atual da ADC 42.
- [ ] Número atualizado de cadastros validados vs total.
- [ ] Passo a passo de download do `.CAR` completo conferido na Central atual.
