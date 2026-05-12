# 📘 Guia de Suporte: Simulador de vendas

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: em produção, disponível apenas para clínicas que já têm a maquininha da Capim (Capininha) entregue ou enviada. Acesso condicionado também à flag `PIX_SALES_SIMULATOR` para mostrar a opção Pix. ✅ Validar com produto se a flag de Pix já está 100% ligada em produção.

## 1. 🎯 Visão geral

O Simulador de vendas é a "calculadora" da maquininha da Capim. É a tela onde o dentista ou a recepção digita um valor de venda, escolhe a forma de pagamento (débito, crédito ou Pix) e o número de parcelas, e a tela responde **na hora**: qual a taxa, quanto a clínica vai receber, quando o dinheiro cai e quanto sai do bolso do paciente em cada cenário. Tudo isso **antes** de cobrar de fato.

Resolve duas dúvidas comuns do dia a dia: "se eu passar essa venda em 6x no crédito, quanto eu recebo?" e "se eu repassar a taxa pro paciente, quanto eu cobro dele pra continuar recebendo o valor cheio da consulta?". Não cria cobrança, não envia link, não mexe em transação real, **só simula**.

**Para quem é:** clínicas Capim que já possuem a maquininha (Capininha). O acesso à tela é bloqueado quando a clínica ainda não tem um pedido de maquininha com status `delivered` (entregue) ou `sent` (enviada). Quem tenta entrar sem isso é redirecionado para a tela de cadastro da Capininha, com o toast "Redirecionado para o cadastro da Capininha".

**Onde se encaixa no produto Capim:** vive dentro do módulo Financeiro → Transações no cartão, ao lado de Antecipação, Conciliação e Minhas taxas. Usa as **mesmas taxas reais** que serão aplicadas quando a clínica passar uma venda de verdade (a tela busca as taxas atuais do payfac, configuradas para o CNPJ daquela clínica). Não é uma tabela genérica de marketing, são as taxas daquela clínica.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Clínica com maquininha da Capim cadastrada e com status do pedido em `delivered` ou `sent`. Sem isso, a tela nem abre.
* Cadastro completo dos sócios/responsáveis (split members) e dados de antecipação, porque o simulador busca o prazo de recebimento a partir desses cadastros. Se faltar algo aqui, a tela carrega, mas pode não mostrar a "Data do recebimento".
* Taxas da clínica carregadas com sucesso. Quando o carregamento falha, aparece o toast "Não foi possível carregar suas taxas. Entre em contato com o suporte."

**Onde acessar:**

* Menu lateral → Financeiro → Simulador de vendas (aparece para clínicas com SaaS ativo).
* Também aparece como card "Simulador de vendas" dentro de Financeiro → Transações no cartão, ao lado dos outros recursos da maquininha.
* URL: `/finance/card-transactions/sales-simulator`.

**Fluxo típico (simular uma venda):**

1. A clínica abre o Simulador. A tela já vem com um valor inicial preenchido (R$1.000,00) e a forma de pagamento "Débito" selecionada, para mostrar um exemplo rápido.
2. Escolhe a **forma de pagamento** no topo: Débito, Crédito ou Pix (Pix só aparece se a flag estiver ligada). Trocar a forma de pagamento reseta o número de parcelas para "à vista".
3. Digita o **valor da venda** no campo "Qual o valor da venda?". O valor precisa estar entre **R$1,00 e R$50.000,00**. Fora disso, a tela mostra mensagem de erro embaixo do campo.
4. Decide se vai **repassar a taxa ao cliente** no toggle "Repassar a taxa ao cliente". Quando ligado, o cálculo inverte: em vez de mostrar quanto a clínica recebe líquido, mostra quanto a clínica deve cobrar do paciente pra receber o valor cheio digitado. O tooltip da tela explica: "Ativando esta opção, mostramos quanto cobrar para que o cliente pague pelo valor da taxa."
5. Se a forma de pagamento for **Crédito**, escolhe o **número de parcelas** (de 1 a 21, sendo "1x" tratado como "à vista"). Para Débito e Pix, o campo de parcelas fica desabilitado.
6. O painel da direita ("Resultado da simulação") atualiza **instantaneamente** a cada mudança. Não há botão "Calcular": tudo é reativo na tela.

**O que aparece no resultado:**

* **Taxa do {forma de pagamento} {parcelas}**: a porcentagem que a Capim cobra naquela combinação (ex: "Taxa do crédito em 6x: 4,50%"). Formato em percentual com vírgula. ✅ Validar números, a Capim **não publica taxa fixa**, cada clínica tem a sua.
* **Valor da taxa**: o valor em reais correspondente à taxa aplicada sobre o valor digitado.
* **Caixa em destaque (verde ou roxa)**:
  * Em verde: "Valor que você recebe" → quanto a clínica recebe líquido (valor digitado menos taxa).
  * Em roxa: "Valor que você deve cobrar" → aparece quando "Repassar a taxa ao cliente" está ligado. É o valor que a clínica deve passar na maquininha pro paciente, para que o líquido recebido seja igual ao valor digitado.
* **Valor que você recebe** (linha extra): quando o toggle está ligado, mostra também o valor líquido, que coincide com o valor digitado, pra deixar claro que o repasse funcionou.
* **Valor das parcelas**: aparece só pra Crédito. Mostra "{parcelas}x de {valor}" usando o total dividido pelo número de parcelas. Em Débito e Pix, sempre exibe "1x de {valor}".
* **Data do recebimento**: data prevista de queda do dinheiro na conta, vinda do cadastro de antecipação da clínica. Se a clínica **não tem antecipação automática** e a venda for parcelada, o texto muda para "Data do recebimento da **1ª parcela**", deixando claro que as outras parcelas caem nas datas seguintes.

**⚠️ Atenção:**

* O simulador **não cria cobrança**. Não gera link de pagamento, não envia nada pro paciente, não aparece em relatório financeiro. É puramente uma calculadora. A venda real precisa ser feita na maquininha física ou no fluxo de pagamento de verdade.
* As taxas exibidas vêm direto do **cadastro da clínica no payfac da Capim**, não de uma tabela genérica. Se a clínica negociou taxa especial com o time comercial, é essa taxa que vai aparecer aqui (e é a mesma que ela paga de verdade quando passa uma venda).
* O cálculo é todo feito **na própria tela** (no navegador), a partir das taxas baixadas uma vez ao abrir o simulador. Se a clínica deixar a tela aberta e a taxa mudar no backend, **o resultado da simulação só atualiza ao recarregar a página**. ✅ Validar com produto se há refresh automático.
* O campo de valor tem limite **mínimo de R$1,00 e máximo de R$50.000,00**. Tentar passar acima ou abaixo bloqueia a simulação.
* O toggle "Repassar a taxa ao cliente" muda a fórmula, não dá desconto. Quando ligado, o "Valor da taxa" mostrado é a parcela do acréscimo que vai pro paciente para compensar a taxa, **não** a taxa nominal multiplicada pelo valor digitado.

## > 3. 💼 Casos de uso esperados

* **Caso 1, "paciente quer parcelar em 6x sem juros, quanto fica?":** dentista digita o valor da consulta (ex: R$1.800,00), troca pra Crédito, escolhe 6x. A tela mostra a taxa do crédito em 6x para aquela clínica, quanto a clínica recebe líquido, quanto cada parcela do paciente vai ficar (R$1.800 ÷ 6 = R$300,00) e a data do recebimento. O paciente paga 6x de R$300,00 normalmente, e a clínica absorve a taxa.
* **Caso 2, "quero passar a taxa pro paciente, quanto cobrar?":** dentista digita R$1.800,00, Crédito, 6x, e **liga o toggle** "Repassar a taxa ao cliente". A tela passa a mostrar "Valor que você deve cobrar" (acréscimo embutido) e mantém "Valor que você recebe" igual a R$1.800,00. A clínica passa esse valor maior na maquininha e o paciente assume a taxa.
* **Caso 3, "vai pagar no Pix, quanto cai?":** clínicas com a flag Pix ligada selecionam Pix, digitam o valor, e veem a taxa do Pix (geralmente menor que cartão) e o valor que cai. Parcelas ficam fixas em "à vista", porque Pix é sempre à vista.
* **Caso 4, "vai pagar no débito, quando recebo?":** mesma lógica do Pix. Débito não parcela. A tela mostra valor líquido, taxa do débito e data de recebimento prevista.
* **Caso 5, "quero comparar 3x com 10x antes de oferecer pro paciente":** a clínica fica trocando o número de parcelas no select e olha como a taxa e o valor recebido mudam. É o uso mais comum para o dentista decidir até quantas parcelas vale a pena oferecer sem repassar a taxa.

**Maquininha física vs. link de pagamento:** o simulador trabalha em cima das taxas da maquininha da Capim (a Capininha). Hoje a tela **não diferencia** simulação para maquininha física e para link de pagamento; mostra um único conjunto de taxas (as taxas do payfac da clínica). 🚧 PENDENTE: confirmar com produto se as taxas aplicadas em link de pagamento (quando existir) são as mesmas exibidas aqui ou se há tabela separada.

## > 4. ❓ FAQ

**P: As taxas que aparecem no simulador são as taxas reais que a clínica paga?**

R: Sim. A tela consulta o cadastro da clínica no payfac da Capim (endpoint `/api/v1/sellers/{retail_id}/current_fees`) e usa as taxas vigentes daquele CNPJ. Se a clínica negociou condição especial, é o que vai aparecer aqui. Não é tabela genérica.

**P: Por que o "Valor da taxa" muda quando eu ligo o toggle de repasse, se a porcentagem é a mesma?**

R: Porque a fórmula muda. Sem repasse, a taxa é descontada do valor digitado (valor × taxa). Com repasse, o sistema calcula **quanto adicionar** ao valor pra que o líquido continue igual ao valor digitado. Matematicamente é `valor / (1 - taxa) − valor`, e dá um número um pouco maior do que `valor × taxa`. Não é bug, é a forma correta de repassar.

**P: O simulador faz a cobrança ou envia link pro paciente?**

R: Não. **É só simulação.** Para cobrar de verdade, a clínica precisa usar a maquininha física da Capim ou o fluxo de pagamento que ela já usa hoje. Nada do que é simulado aqui chega no paciente.

**P: A clínica disse que abriu o simulador e foi jogada de volta pra outra tela. Por quê?**

R: A tela só abre se a clínica já tem pedido da Capininha (maquininha da Capim) com status `delivered` (entregue) ou `sent` (enviada). Sem isso, o sistema redireciona pra tela de cadastro/pedido da Capininha e mostra o toast "Redirecionado para o cadastro da Capininha". Caminho: confirmar com a clínica se a maquininha já foi pedida e qual o status do pedido.

**P: A clínica abriu o simulador e apareceu "Não foi possível carregar suas taxas". O que fazer?**

R: Significa que a chamada de taxas falhou (o backend não retornou as taxas da clínica). Caminhos: (1) pedir pra recarregar a página; (2) checar se a clínica está com cadastro completo no payfac; (3) se persistir, escalar pra engenharia com o ID da clínica para investigar a chamada `/v3/retails/{clinic_id}/payfac/fees`.

**P: Por que o campo "Em quantas parcelas?" fica cinza?**

R: O campo só fica habilitado para Crédito. Em Débito e Pix, a parcela é sempre 1x à vista, então a tela trava o campo de propósito.

**P: O simulador tem opção de Pix?**

R: Depende da flag `PIX_SALES_SIMULATOR`. Se a flag está ligada no ambiente da clínica, aparece o botão Pix junto com Débito e Crédito. Se não, só Débito e Crédito. 🚧 PENDENTE: confirmar se já é 100% e em quais ambientes a flag está ativa hoje.

**P: A clínica diz que a taxa que aparece no simulador é diferente da que ela paga de fato. Como tratar?**

R: A tela usa o mesmo endpoint que define a taxa cobrada na hora da venda real. Diferenças costumam ter três causas: (1) a clínica está olhando uma tabela antiga ou material de marketing, e não a taxa cadastrada para ela; (2) a taxa foi renegociada e o payfac ainda não propagou, vale recarregar; (3) algum bug pontual. Confirmar o valor exato que aparece, em qual modalidade (débito, crédito Nx, Pix), e escalar pra engenharia com print + ID da clínica.

**P: Pra que serve o número até 21x se a taxa fica muito alta?**

R: A Capim oferece o leque completo de parcelamento da maquininha (de 1x a 21x). A clínica vê o impacto da taxa em cada faixa e decide até quantas parcelas faz sentido oferecer sem repassar a taxa pro paciente. Não há limite menor no simulador, mesmo que na prática raramente alguém ofereça acima de 12x sem juros.

**P: A data do recebimento que aparece é confiável?**

R: É a data calculada com os mesmos dados de antecipação cadastrados pra clínica (cadastro dos sócios/responsáveis e regra de antecipação). Se a clínica tem **antecipação automática**, a data já reflete a antecipação. Se **não tem antecipação automática** e a venda for parcelada, a tela mostra a data da 1ª parcela e deixa explícito na frase "Data do recebimento **da 1ª parcela**" que as próximas parcelas caem em datas seguintes. ✅ Validar com produto a regra exata de cálculo da data exibida.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Cliquei em Simulador de vendas e voltei pra outra tela." | A clínica não tem pedido de Capininha com status `delivered` ou `sent`. O acesso é gated por essa condição. | Confirmar com a clínica o status do pedido da maquininha. Orientar a finalizar o pedido se ainda não fez, ou aguardar a entrega se já está em trânsito. | Se a clínica afirma que a maquininha já chegou e mesmo assim é redirecionada, escalar pra eng com ID da clínica. |
| "Apareceu o toast 'Não foi possível carregar suas taxas'." | Falha na chamada de taxas (`/v3/retails/{clinic_id}/payfac/fees`). Pode ser cadastro da clínica incompleto no payfac, instabilidade ou erro de gateway. | Pedir pra recarregar a página. Conferir se o cadastro da clínica no payfac está completo. | Se persistir após recarregar, escalar pra eng com ID da clínica e horário. |
| "A taxa que aparece está diferente da que eu negociei." | Tabela antiga em material de marketing, taxa renegociada e não propagada, ou bug. | Pedir print do simulador (modalidade e parcelas) e da expectativa do cliente. Confirmar a taxa atual no payfac. | Escalar pra eng/produto se a divergência for real, com ID da clínica e prints. |
| "Liguei 'Repassar taxa' e o valor que aparece pro cliente é maior do que valor × taxa. É bug?" | É o comportamento correto: o cálculo de repasse usa `valor / (1 − taxa) − valor` para garantir que o líquido recebido seja igual ao valor digitado. | Explicar a fórmula de repasse pro cliente. Mostrar que o "Valor que você recebe" continua igual ao valor digitado. | Não escalar, é comportamento esperado. |
| "Não consigo digitar valor acima de R$50.000,00." | Limite máximo do campo (R$1,00 a R$50.000,00). | Explicar o limite. Se a clínica tem vendas acima disso de forma recorrente, registrar como pedido de produto. | Escalar pra produto se houver pedido formal de aumento do teto. |
| "O campo de parcelas está cinza." | Forma de pagamento selecionada é Débito ou Pix; parcelas só liberam para Crédito. | Orientar a trocar pra Crédito. | Não escalar. |
| "Não aparece a data do recebimento na simulação." | Cadastro de antecipação/split members da clínica incompleto ou ainda carregando. | Pedir pra recarregar. Conferir se sócios/responsáveis estão cadastrados. | Se persistir com cadastro completo, escalar pra eng. |
| "A opção Pix sumiu / nunca apareceu." | Flag `PIX_SALES_SIMULATOR` desligada no ambiente da clínica. | Explicar que o Pix no simulador depende de flag e pode não estar ligado pra todas as clínicas ainda. | Escalar pra produto se a clínica precisa muito do Pix no simulador. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Bugs do simulador, divergência de taxa, erro 502/500 no carregamento de taxas e pedidos de ativação da flag de Pix entram por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Não cria cobrança nem link de pagamento.** O simulador é puramente informativo. Para cobrar de verdade, é a maquininha física da Capim (ou o fluxo de pagamento real).
* **Valor da venda limitado a R$1,00 até R$50.000,00.** Fora dessa faixa, a tela bloqueia.
* **Parcelas até 21x apenas no Crédito.** Débito e Pix não parcelam.
* **Sem refresh automático das taxas.** Ao abrir o simulador, a tela carrega as taxas uma vez. Se algo mudar no backend, só recarregando a página atualiza. ✅ Validar com produto.
* **A tela não diferencia simulação para maquininha física vs. link de pagamento.** Mostra uma única tabela de taxas (as do payfac daquela clínica).
* **Sem histórico.** Não existe registro das simulações feitas. Cada acesso começa do zero (com o valor padrão de R$1.000,00 e Débito selecionado).
* **Acesso bloqueado para clínicas sem maquininha.** Sem pedido de Capininha com status `delivered` ou `sent`, a tela redireciona automaticamente.
* **Sem antecipação simulada à parte.** A "Data do recebimento" usa a configuração de antecipação atual da clínica. Não dá pra simular "e se eu antecipasse?" dentro dessa tela.

## > 7. 🗺️ Próximos passos [opcional]

* Liberação completa da modalidade Pix no simulador. 🚧 PENDENTE: confirmar status da flag `PIX_SALES_SIMULATOR` em produção.
* Possível inclusão de simulação específica para link de pagamento, se passar a existir como produto. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: simulador de vendas com Débito selecionado e valor R$1.000,00 (estado inicial)]

[INSERIR PRINT: simulador com Crédito em 6x e toggle de repasse desligado]

[INSERIR PRINT: simulador com Crédito em 6x e toggle "Repassar a taxa ao cliente" ligado (caixa roxa)]

[INSERIR PRINT: simulador com Pix selecionado, mostrando o botão Pix entre Débito e Crédito]

[INSERIR PRINT: toast "Redirecionado para o cadastro da Capininha" no fluxo de redirecionamento]

[INSERIR PRINT: toast "Não foi possível carregar suas taxas"]

[INSERIR PRINT: linha "Data do recebimento da 1ª parcela" em uma simulação de crédito parcelado sem antecipação automática]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Acesso e disponibilidade**
* [ ] Status atual da flag `PIX_SALES_SIMULATOR` em produção (porcentagem de clínicas com Pix visível no simulador).
* [ ] Existe alguma clínica/segmento em que o simulador deveria aparecer mas não aparece (além da regra de status da maquininha)?

**Maquininha física vs. link de pagamento**
* [ ] Confirmar se as taxas usadas no simulador valem **também** para link de pagamento da Capim (quando existir), ou se há tabela separada que o simulador não cobre hoje.

**Taxas e cálculo**
* [ ] Existe refresh automático das taxas com a tela aberta, ou o usuário precisa recarregar pra ver mudança? (código aponta para um carregamento único no onBeforeMount)
* [ ] Regra exata de cálculo da "Data do recebimento" exibida (quais inputs do cadastro de antecipação alimentam esse campo).
* [ ] Material oficial / artigo público que o suporte pode mandar pra clínica explicando a fórmula de repasse da taxa ao cliente.

**Operação**
* [ ] Canal oficial para suporte pedir investigação de divergência de taxa exibida vs. taxa cobrada de fato (Sustentação? Produto? Comercial?).
* [ ] Existe limite negociável de R$50.000,00 por simulação, ou é definitivo do produto?

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Tela acessível só para clínicas com pedido de Capininha em status `delivered` ou `sent`." Confirmado pelo código do `SalesSimulatorView.vue`; vale validar com produto se existe exceção (ex: clínicas internas, ambiente de demo).
* [ ] "As taxas exibidas são as taxas reais cobradas na venda." Confirmado pelo endpoint do backend (`/api/v1/sellers/{retail_id}/current_fees`); vale validar com produto se há algum cenário em que a taxa cobrada divirja do que o simulador mostra (ex: promoção temporária, fee adicional).
* [ ] "Cálculo de repasse usa `valor / (1 − taxa) − valor`." Confirmado por `utils.ts` no frontend; vale validar com produto se essa é a fórmula oficial comunicada à clínica.
* [ ] "Não há refresh automático das taxas com a tela aberta." Inferido do código (`onBeforeMount` chama uma vez).

### Itens já validados pelo código (não precisa mais perguntar)

Fact-check feito contra `capim-dash-frontend` e `capim-backend`, podem ser tratados como confirmados:

* Valor permitido entre R$1,00 e R$50.000,00 (`schema.ts` + `constants.ts`).
* Crédito parcela de 1x a 21x; Débito e Pix sempre 1x à vista (`constants.ts` + `FormSimulator.vue`).
* Trocar a forma de pagamento reseta o número de parcelas pra "1x" (`FormSimulator.vue`).
* Toggle "Repassar a taxa ao cliente" troca o cálculo entre desconto e acréscimo (`utils.ts`).
* Endpoint de taxas: `/v3/retails/{clinic_id}/payfac/fees` → `/api/v1/sellers/{retail_id}/current_fees` no payfac.
* Bloqueio de acesso quando o pedido da Capininha não está `delivered` ou `sent`, com toast "Redirecionado para o cadastro da Capininha".
* Toast "Não foi possível carregar suas taxas. Entre em contato com o suporte." aparece em falha do carregamento de taxas.
* Cálculo é todo client-side, a partir das taxas baixadas (`ResultSimulator.vue` + `utils.ts`).
* "Data do recebimento" muda para "Data do recebimento da 1ª parcela" quando a antecipação **não** é automática e a venda é parcelada (`ResultSimulator.vue`).
