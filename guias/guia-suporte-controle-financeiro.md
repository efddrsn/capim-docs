# 📘 Guia de Suporte: Controle Financeiro

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. A tela de Conciliação bancária (extrato Capim x lançamentos) está disponível para clínicas com acesso administrativo total ao módulo.

## 1. 🎯 Visão geral

O Controle Financeiro é o "livro caixa" digital da clínica. É onde a clínica registra o que **entra** (recebimento de paciente, venda de produto, receita financeira) e o que **sai** (aluguel, conta de luz, salário, comissão de dentista associado, taxa de cartão, material odontológico). Pense no caderno do contador da clínica, só que automaticamente alimentado pelo que acontece no resto do Capim (Carnê, Maquininha, BNPL) e com uma tela própria para conferir o que caiu na conta da clínica contra o que está registrado no sistema (conciliação bancária).

Resolve três dores clássicas: clínica que não sabe quanto realmente lucrou no mês, clínica que confunde recebimento de paciente com depósito bancário e clínica que paga comissão "no feeling" sem rastrear orçamento ou procedimento que originou.

**Para quem é:** clínicas cliente da Capim que têm o módulo `financial-control` ativado para o grupo de clínicas. O acesso individual depende ainda das permissões de usuário (ver seção de permissões).

**Quem vê e edita o quê dentro da clínica:** depende de duas permissões de usuário no Capim, combinadas com a feature `financial-control` no grupo de clínicas:

* `access-financial-control-all`: **admin financeiro**. Vê e edita todos os lançamentos da clínica, todas as receitas e todas as despesas. **É a permissão que libera a tela de Conciliação bancária.**
* `access-financial-control-user`: **dentista comum**. Vê apenas o que é dele (lançamentos vinculados ao próprio `dentist_id`). Não acessa a Conciliação bancária.
* Sem nenhuma das duas permissões + sem a feature `financial-control` no grupo: o usuário não vê o menu Controle Financeiro.

**Onde se encaixa no produto Capim:** o Controle Financeiro é o **destino final do dinheiro** que passa por outras partes do produto. Recebimento que entra pela Maquininha (Capim POS, Stone, Cielo, etc.) cai aqui automaticamente como receita já categorizada. Parcela de Carnê paga pelo paciente entra aqui. BNPL (parcelado da Capim) idem. Comissão de dentista calculada em cima de orçamento ou procedimento entra aqui como despesa. Por isso ele aparece tanto no menu próprio quanto espelhado dentro de cada ficha de paciente (aba financeira do paciente).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Feature `financial-control` ativa para o grupo de clínicas.
* Usuário com pelo menos uma das permissões: `access-financial-control-all` ou `access-financial-control-user`.
* Para a tela de Conciliação bancária: `access-financial-control-all` obrigatoriamente.

**Onde acessar:**

* Menu lateral → Controle Financeiro.
* URL típica da listagem: `/#/financial_control`.
* URL da Conciliação bancária: `/#/financial_control/reconcile-transactions/unreconciled`.
* URL do resumo de comissões: `/#/financial_control/commissions_summary`.

### 2.1 Tela principal (lista de lançamentos)

A tela inicial é uma tabela de **lançamentos financeiros** (chamados internamente de "registries" ou "operations"). Cada linha é uma entrada ou uma saída, com data de vencimento, descrição, categoria, dentista, paciente (se houver), valor e status (pago, pendente, cancelado).

No topo:

* Filtro por intervalo de datas (atalhos: semana passada, esta semana, este mês, mês passado, próximo mês).
* Seletor "Todos / Recebimentos / Despesas".
* Busca por descrição.
* Botão "Adicionar lançamento" (cadastrar manualmente uma entrada ou saída).
* Link "Importar planilha" (leva para a Migração de Dados, fluxo separado).
* Resumo do período: total a receber, total recebido, total a pagar, total pago, saldo.

### 2.2 Cadastrar lançamento manual

Clica em "Adicionar lançamento" e abre a gaveta lateral. A clínica escolhe o tipo (Receita ou Despesa) e preenche:

* **Descrição** obrigatório (ex: "Conta de luz Maio", "Salário recepcionista", "Fornecedor X").
* **Dentista** opcional, mas se vier preenchido o lançamento entra na visão do "dentista comum" daquele profissional.
* **Paciente** disponível apenas em Receita.
* **Categoria** obrigatório. Lista varia por tipo:
  * Receita: serviço, venda de produto, receitas financeiras, outros.
  * Despesa, agrupada por bloco: impostos; financeiro (taxas bancárias, juros, multa, taxa de cartão, comissão, análise de crédito); pessoal (salário, benefícios, férias, 13º, vale-transporte, vale-refeição); administrativo (aluguel, água, luz, internet, gás, contabilidade, condomínio, IPTU, correios, material de escritório, material de cozinha, higiene, segurança, seguro, outros); vendas (marketing); material odontológico (material, despesa de laboratório, prótese).
* **Valor**.
* **Data de vencimento**.
* **Forma de pagamento (parcelamento)**: três opções:
  * À vista (1 lançamento só).
  * Recorrente (repete por N meses ou indefinidamente).
  * Por parcelas (de 1 a 36).
* **Já pago?**: switch sim/não. Se "sim", abre data de pagamento e método (dinheiro, pix, cartão de crédito, cartão de débito, transferência, cheque, boleto, outros).

Salva. O lançamento aparece na tabela.

### 2.3 Lançamentos que aparecem automaticamente (sem cadastro manual)

Alguns lançamentos **caem na lista sem que ninguém digite**, porque vêm de outras partes do Capim. O suporte precisa reconhecer pelo `registry_type`/`source`:

| Origem | Como entra | O que a clínica vê na tabela |
|---|---|---|
| Carnê pago pelo paciente | source `payment_book` / registry_type `payment_book` | Receita, categoria "Receita de serviço", já com paciente vinculado |
| Maquininha (Capim POS ou outras) | source `remote_transaction` / registry_type `point_of_sale` | Receita, com a forma de pagamento "Maquininha" no lugar do método tradicional |
| BNPL (Crédito Capim) | source `bnpl` / registry_type `credit` | Receita, vinculada ao paciente |
| Análise de crédito BNPL | registry_type `credit_check` | Despesa |
| Taxa de cartão da maquininha | registry_type `fee` | Despesa, vinculada à transação remota |
| Comissão de dentista | source `procedure` ou `budget`, registry_type `commission` | Despesa, vinculada ao dentista que ganhou a comissão |
| Orçamento pago pelo paciente | source `budget` | Receita, vinculada ao paciente e ao orçamento |
| Procedimento avulso pago | source `procedure` | Receita |

Esses lançamentos automáticos **têm regras especiais de edição**:

* Lançamento vindo da Maquininha (transação remota da Capim) **não é editável nem deletável pela tela**. A clínica só vê e usa para conciliar.
* Lançamento de Carnê (registry_type `payment_book`) e de Crédito (registry_type `credit`) **não são deletáveis**.
* Lançamento avulso do próprio Controle Financeiro (registry_type `manual`) e lançamentos de orçamento/procedimento são editáveis e deletáveis com algumas validações.

### 2.4 Conciliação bancária

A tela de Conciliação bancária (`/financial_control/reconcile-transactions`) é exclusiva para usuários com `access-financial-control-all`. Ela mostra de um lado as **transações remotas** (`remote_transaction`) que caíram na conta da clínica via Capim POS/maquininha e do outro lado os **lançamentos financeiros pendentes** (`financial_registry` com `status: pending` e ainda sem `remote_transaction_id`). O objetivo é casar cada transação que entrou na conta com o lançamento certo no livro caixa.

**Três abas:**

* **Não conciliadas**: transações que entraram e ainda não foram vinculadas a um lançamento.
* **Conciliadas**: transações já vinculadas.
* **Ocultas**: transações que a clínica decidiu esconder (ex: transação irrelevante, duplicada).

**Como funciona o casamento:**

1. A clínica seleciona uma transação no painel esquerdo.
2. O sistema sugere lançamentos compatíveis no painel direito, classificados em três níveis:
   * ✅ **Exato**: data e valor batem.
   * ⚠️ **Aproximado**: data ou valor próximos, mas não idênticos.
   * ❌ **Diferente**: bate só parcialmente, exige confirmação do usuário antes de conciliar.
3. A clínica seleciona um lançamento sugerido e clica em "Conciliar".
4. Se for "Diferente", abre um modal de confirmação extra ("Valores diferentes, deseja conciliar mesmo assim?").

**Conciliação automática:** o backend tenta conciliar sozinho **antes** de a clínica abrir a tela, em três modos (ver `reconciliation_mode` no banco):

* `automatic_by_intent`: a transação remota tem um identificador de pagamento que aponta direto para um lançamento. ✅ Validar: depende da feature flag `FF_AUTO_RECONCILE_ENABLED`.
* `automatic_by_amount_date`: existe um lançamento pendente com **mesmo valor** e **competency_date dentro de um dia da data do pagamento**. Conciliado automaticamente.
* `automatic_by_patient`: paciente identificado via intenção de pagamento.
* `manual`: nenhum dos automáticos pegou e o usuário conciliou na tela.

**⚠️ Atenção:** a tela hoje cobre apenas **transações remotas geradas pelo próprio ecossistema Capim** (POS, BNPL, etc., com `origin: capim`). 🚧 PENDENTE: confirmar se existe importação de extrato bancário externo (OFX, CSV de banco tradicional) e por qual caminho do menu. O código revisado **não tem importação de extrato externo na tela de Conciliação**: o que aparece lá vem só de transações remotas Capim.

### 2.5 Comissões

Comissão de dentista associado funciona em duas pontas:

* **Cadastro da regra de comissão:** existem dois lugares onde a regra é gravada (modelos `Commission` e `ProcedureCommission`). `Commission` é uma comissão atrelada a um **orçamento ou procedimento específico** (ad hoc). `ProcedureCommission` é uma regra fixa por **tipo de procedimento** (ex: dentista X ganha sempre tanto por canal). 🚧 PENDENTE: confirmar onde exatamente o admin cadastra cada uma dessas regras na interface (tela exata, caminho no menu).
* **Cálculo automático:** quando um pagamento de orçamento ou procedimento é registrado (gera um `payment_statement`), o backend roda `PaymentStatements::GenerateCommissionExpenses`. Esse serviço cria automaticamente um lançamento de **despesa** com:
  * `registry_type: commission`,
  * `source`: `budget` ou `procedure` conforme a origem,
  * `dentist_id` do beneficiário,
  * `category: commission`,
  * descrição "Comissão {nome do dentista} Orçamento {id}" ou "Comissão {nome do dentista} Procedimento {id}",
  * `competency_date`: igual à data de vencimento da parcela paga,
  * valor = `commission.amount / quantidade de parcelas` do orçamento/procedimento.
* Cada parcela do orçamento/procedimento gera uma `financial_operation` adicional dentro do mesmo registry de comissão (a comissão é proporcionalmente distribuída pelas parcelas do recebimento).

**Resumo de comissões:** a tela `/financial_control/commissions_summary` é um **dashboard Metabase embarcado**. O dashboard mostrado depende do perfil:

* Admin (`user.admin === true`): dashboard 120.
* Demais usuários: dashboard 121.

🚧 PENDENTE: confirmar com o time interno o que cada um desses dashboards exibe (ex: comissão por dentista, comissão por período, comissão paga vs a pagar) e se existe filtro de período dentro do iframe.

### 2.6 Importação de planilha (migração)

O link "Importar planilha" na tela principal **não importa direto no Controle Financeiro**: ele leva para a tela de Migração de Dados (`/data_migration`). É o caminho usado para carregar dados de sistemas antigos (por exemplo, planilha de extrato histórico de outro software dental). 🚧 PENDENTE: confirmar se há orientação oficial pro suporte sobre quais colunas a planilha deve ter e se o cliente preenche sozinho ou se a Capim importa.

**⚠️ Atenção:**

* Lançamentos vindos de Maquininha, Carnê, Crédito e Comissão **respeitam regras de edição mais rígidas**. Se a clínica reclamar "não consigo editar/deletar esse lançamento", a resposta começa por checar a **origem** do lançamento. Se for `point_of_sale` (Maquininha) ou `payfac_transaction`, **não dá pela tela**.
* Categoria de despesa pode parecer redundante (ex: "outros" aparece em mais de um grupo). Não é bug: o backend trata cada categoria com um identificador único.
* Lançamento marcado como "pago" pode ser **reaberto** (volta para pendente) pelo modal de reabertura. Não é todo lançamento que aceita reabrir: depende do tipo (lançamento de Maquininha tipicamente não aceita).
* O resumo de comissões depende do Metabase. Se o iframe não carrega, **o suporte vê a tela em branco**, não há mensagem de erro amigável. Causa mais comum: bloqueio de iframe pelo navegador ou token expirado.

## > 3. 💼 Casos de uso esperados

* **Caso 1, fechamento de mês:** no final do mês a recepcionista (ou o admin) abre o Controle Financeiro, filtra "Este mês", confere o resumo (total recebido vs total pago, saldo), exporta CSV se precisa enviar pro contador.
* **Caso 2, registrar conta de luz:** clica em "Adicionar lançamento", escolhe Despesa, descrição "Conta de luz Maio/26", categoria "Administrativo → Conta de luz", valor R$ 480,00, vencimento dia 15, "Já pago?" Não (vai marcar como pago só no dia que pagar de fato). Salva.
* **Caso 3, registrar salário recorrente:** despesa com categoria "Pessoal → Salário", valor da folha, vencimento dia 5, parcelamento "Recorrente → Repetir indefinidamente". Aparece todo mês.
* **Caso 4, conciliar maquininha:** no dia seguinte a uma venda, o admin abre Conciliação bancária. Aba "Não conciliadas" mostra uma transação de R$ 350 do POS. A sugestão "✅ Exato" aponta para a parcela do orçamento pago do João Silva. Admin clica em "Conciliar". Pronto, a transação some da aba "Não conciliadas" e vai pra "Conciliadas".
* **Caso 5, ajustar comissão divergente:** dentista olha o Controle Financeiro com sua permissão `access-financial-control-user`, vê uma despesa "Comissão Dr. Fulano Orçamento 1234" com valor diferente do combinado. Reclama com o admin. Admin localiza o registry de comissão, confere a regra cadastrada (Commission ou ProcedureCommission), corrige a regra ou pede ajuste do lançamento. (🚧 PENDENTE: confirmar como o admin reabre/edita o lançamento de comissão sem desfazer o pagamento original).
* **Caso 6, paciente pagou em dinheiro na recepção:** recepcionista cadastra como receita manual, categoria "Receita de serviço", método "Dinheiro", marca "Já pago" com data de hoje. O lançamento já aparece como pago, sem precisar conciliação bancária (não é transação remota).
* **Caso 7, marcação de "pago" via tela do paciente:** quando a recepção marca uma parcela do orçamento do paciente como paga, o lançamento correspondente espelha no Controle Financeiro automaticamente (estados se sincronizam via `FinancialRegistry` e suas `financial_operations`).

## > 4. ❓ FAQ

**P: A clínica diz que o dentista não vê o Controle Financeiro. O que verificar?**

R: Em ordem: (1) a feature `financial-control` está ativa no grupo de clínicas? Se não, ninguém da clínica vê o menu, independente do que cada usuário tem. (2) O usuário tem `access-financial-control-all` ou `access-financial-control-user`? Sem nenhuma das duas, o menu também não aparece. Lembrar: `-user` mostra **só os lançamentos do próprio dentista**, então o profissional vai abrir e ver pouca coisa. Se ele quer ver tudo da clínica, precisa de `-all`.

**P: O admin reclama que não vê a aba Conciliação bancária.**

R: A Conciliação exige a policy `FINANCIAL_CONTROL_FULL`, que é `access-financial-control-all` + `financial-control`. Só `access-financial-control-user` **não libera essa tela**. Confirmar a permissão do usuário.

**P: Uma transação da maquininha está na aba "Não conciliadas" há vários dias. Por quê não conciliou sozinha?**

R: A conciliação automática tenta três caminhos, na ordem: por intenção de pagamento (precisa ter um identificador de pagamento na transação remota), por paciente (precisa de intenção vinculada a paciente) e por valor+data (precisa ter um lançamento pendente com mesmo valor e data próxima, dentro de um dia). Se nenhum pegou, sobra a manual. Causas típicas: o lançamento que deveria casar **já foi conciliado com outra transação**, está com `status` diferente de pendente, ou nunca foi criado. Em última instância, o usuário pode marcar como "Oculto" se for irrelevante.

**P: A clínica quer importar o extrato do banco tradicional dela (Itaú, Bradesco, etc.). Dá pra fazer?**

R: 🚧 PENDENTE confirmar oficialmente. Pelo código revisado, a tela de Conciliação bancária **trabalha apenas com transações remotas geradas no ecossistema Capim** (POS, BNPL, etc., `origin: capim`). Não existe upload de OFX/CSV bancário identificado nessa tela. Para histórico antigo, há o caminho de "Importar planilha", que joga a clínica para Migração de Dados, fluxo separado. Antes de prometer ao cliente, validar com produto.

**P: O dentista pediu para deletar uma comissão. Dá pra apagar pela tela?**

R: Comissão (registry_type `commission`) vem de um `payment_statement` real do orçamento/procedimento. Apagar a comissão sem desfazer o pagamento origem cria inconsistência. Pela interface do Controle Financeiro, o comportamento esperado é que o lançamento **não seja editável/deletável** (`editable?` retorna `false` para registries de orçamento/procedimento que não são do próprio módulo de financial_control). O caminho correto: desfazer o pagamento do orçamento/procedimento, que cancela a comissão como efeito colateral. 🚧 PENDENTE: confirmar com produto o fluxo oficial pro suporte orientar.

**P: O Resumo de comissões está em branco. O que faço?**

R: A tela é um iframe do Metabase. Causas comuns: (1) navegador bloqueando iframes/cookies de terceiros; (2) token de embed expirado; (3) dashboard com erro. Pedir pra recarregar (F5). Se persistir e for em vários usuários da mesma clínica, escalar.

**P: A clínica diz que a maquininha "puxa" o lançamento já marcado como pago, mas a clínica não cobrou. Como assim?**

R: Não é a clínica que cobra duas vezes. Quando uma venda é fechada pela maquininha do ecossistema Capim, o backend cria automaticamente um `financial_registry` de receita com o valor da venda. Esse lançamento aparece no Controle Financeiro com a forma de pagamento "Maquininha" e fica pendente até a conciliação bancária casar com a transação que o adquirente liquidou.

**P: Dá pra ver quanto a clínica tem a receber no próximo mês?**

R: Sim. Filtro de datas no topo, intervalo do mês desejado, seletor "Recebimentos". O resumo mostra "Total a receber" e "Total recebido" do período. (Atalho útil no filtro: "Próximo mês".)

**P: Posso filtrar por dentista no Controle Financeiro?**

R: O filtro de Dentista está disponível na barra de filtros (`RecordsFilter`). 🚧 PENDENTE: confirmar todos os campos do filtro avançado disponíveis hoje (dentista, paciente, método de pagamento, categoria, status) e se algum depende de feature flag.

**P: O lançamento foi cancelado por engano. Tem como reabrir?**

R: A tela tem o botão "Reabrir" no menu de ações da linha (`ReopenDialog`). Reabrir muda o status do lançamento de `finished` ou `canceled` de volta para `pending`. Mas atenção: lançamentos vindos de Maquininha (`payfac_transaction`) **não são reabertos pela tela**; o status segue o ciclo da transação remota lá no adquirente.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não vejo o menu Controle Financeiro." | Falta a feature `financial-control` no grupo de clínicas, ou o usuário não tem `access-financial-control-all` nem `-user`. | Confirmar com o cliente quem é o usuário. Checar feature do grupo e permissões do usuário. Explicar que `-user` mostra só os próprios lançamentos. | Escalar para **Time de Sustentação** pedindo ativação da feature ou ajuste de permissão, informando ID da clínica e usuário afetado. |
| "Não vejo a aba de Conciliação bancária." | Usuário tem só `access-financial-control-user`, falta `-all`. | Explicar que Conciliação exige permissão administrativa total. | Escalar pedindo upgrade de permissão se for realmente admin financeiro da clínica. |
| "Lançamento da Maquininha apareceu duplicado." | Pode ser conciliação não feita (a transação remota e o lançamento gerado pelo POS estão ambos visíveis, dando impressão de duplicidade). | Pedir print da listagem e da tela de Conciliação. Validar se um deles é `registry_type: point_of_sale` e o outro é a transação remota correspondente. | Escalar para **Time de Sustentação** com ID da clínica, IDs dos dois lançamentos e ID da transação remota. |
| "Conciliação automática não está funcionando." | Lançamento pendente com valor ou data fora do intervalo de 1 dia em relação ao pagamento; ou a feature flag `FF_AUTO_RECONCILE_ENABLED` está desligada. | Coletar exemplos concretos (ID da transação remota, ID do lançamento esperado, data e valor de cada). Conferir se as datas batem com a janela de 1 dia. | Escalar para **Time de Sustentação** com os exemplos. Bug recorrente vira investigação de produto. |
| "Comissão saiu com valor errado." | Regra de comissão (Commission ou ProcedureCommission) cadastrada com valor diferente do esperado, ou parcelamento do orçamento mudou o cálculo (valor da comissão é dividido pelo número de parcelas). | Confirmar com a clínica o valor esperado por procedimento e o número de parcelas do orçamento. Calcular `commission.amount / quantidade_parcelas` e comparar. | Se a regra cadastrada não bate com o que o cliente diz ter combinado, escalar para o time de produto/sustentação com IDs do orçamento, da comissão e do dentista. |
| "Não consigo editar/apagar esse lançamento." | Lançamento veio de Maquininha (`payfac_transaction`), de Carnê (`registry_type: payment_book`) ou de Crédito Capim (`registry_type: credit`). Regras de edição mais rígidas. | Identificar a origem pela coluna de forma de pagamento e pela descrição. Explicar que esses lançamentos seguem o ciclo da origem (POS, Carnê, BNPL) e não dá pra mexer pelo Controle Financeiro. | Escalar se a clínica precisa de ajuste excepcional (refund, estorno) que só engenharia faz. |
| "Resumo de comissões está em branco." | Iframe do Metabase bloqueado, token expirado, ou dashboard sem dados para o usuário/clínica. | Pedir F5, testar em outro navegador, conferir se a clínica realmente tem comissões cadastradas e pagas no período. | Se mesmo recarregando e em outro navegador a tela fica em branco, escalar para o time que mantém os dashboards Metabase. |
| "Importei a planilha e os lançamentos não apareceram." | A importação não acontece no Controle Financeiro: o link leva para Migração de Dados. Pode ser que a planilha esteja em revisão ou tenha erro de formato. | Confirmar com o cliente onde ele subiu a planilha. Verificar status na tela de Migração. | Escalar para o time responsável pela Migração de Dados, com ID da clínica e arquivo. |
| "Conciliei a transação errada e quero desfazer." | A conciliação manual não tem botão direto de desfazer na interface descoberta (o backend aceita `toggle_visibility` e `reconcile`, mas reverter um `reconcile` exige ação de bastidor). 🚧 PENDENTE confirmar. | Anotar IDs envolvidos (transação remota + lançamento). Explicar que pode precisar passar para engenharia. | Escalar para **Time de Sustentação** com os IDs. |

**Para quem escalar:** **Time de Sustentação** (canal interno Capim). Para questões específicas de comissão (regra cadastrada, valor calculado), pode envolver também o time de Produto. Para problemas de dashboard Metabase, time de dados.

## > 6. ⚠️ Limitações conhecidas

* **Importação de extrato bancário externo (OFX/CSV de banco) não existe na tela de Conciliação**, baseado no que está em código. A Conciliação atual cobre só transações do ecossistema Capim (POS, BNPL, etc.). Para histórico antigo, o caminho é Migração de Dados, separado.
* **Lançamentos automáticos da Maquininha, Carnê e Crédito têm bloqueios de edição/exclusão pela tela.** Editar significa mexer na origem (orçamento, procedimento, parcela do carnê).
* **Sem botão de "desfazer conciliação" claramente exposto.** 🚧 PENDENTE confirmar.
* **Comissão calculada divide o valor pelo número de parcelas do orçamento.** Se a clínica espera comissão "cheia" no recebimento da primeira parcela, a UX atual não atende: cada parcela recebida gera proporção de comissão.
* **Tela de Resumo de comissões é Metabase embarcado.** Sem fallback se o iframe falha.
* **Permissão `access-financial-control-user` mostra só os lançamentos com `dentist_id` do usuário.** Lançamentos sem dentista vinculado (ex: conta de luz da clínica) **não aparecem** para o dentista comum.
* **Sem filtro por sala ou ponto de venda na listagem principal.** Filtro de método de pagamento existe e cobre "Maquininha" como uma das opções.
* **Conciliação automática por valor+data aceita variação de até um dia** entre a data do pagamento e a `competency_date` do lançamento. Lançamento com data mais distante que isso fica pra conciliação manual.

## > 7. 🗺️ Próximos passos [opcional]

* Possível evolução da Conciliação para aceitar extratos bancários externos (OFX). 🚧 PENDENTE confirmar com produto se está no roadmap.
* Expansão dos dashboards de comissão (hoje Metabase embarcado, possível UI nativa). 🚧 PENDENTE.
* Refinamento das regras de edição de lançamentos automáticos (botão "ajustar" sem mexer na origem). 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: tela inicial do Controle Financeiro com tabela de lançamentos]

[INSERIR PRINT: resumo do período com cards de Total recebido, Total a receber, Total pago, Total a pagar]

[INSERIR PRINT: gaveta "Adicionar lançamento" com tipo Receita selecionado]

[INSERIR PRINT: gaveta "Adicionar lançamento" com tipo Despesa e categorias agrupadas]

[INSERIR PRINT: opções de parcelamento (À vista, Recorrente, Por parcelas)]

[INSERIR PRINT: tela de Conciliação bancária na aba "Não conciliadas"]

[INSERIR PRINT: painel de conciliação com sugestão exata (verde), aproximada (amarelo) e diferente (vermelho)]

[INSERIR PRINT: modal de confirmação para conciliação com valores diferentes]

[INSERIR PRINT: aba "Conciliadas" e aba "Ocultas"]

[INSERIR PRINT: tela do Resumo de comissões (Metabase embarcado)]

[INSERIR PRINT: exemplo de lançamento de comissão na tabela, com descrição "Comissão {dentista} Orçamento {id}"]

[INSERIR PRINT: lançamento de Maquininha na tabela mostrando forma de pagamento "Maquininha"]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Permissões e acesso**

* [ ] Como o suporte verifica e solicita ativação da feature `financial-control` no grupo de clínicas, e como pede ajuste das permissões `access-financial-control-all` / `access-financial-control-user` para um usuário específico?
* [ ] Existe alguma permissão intermediária além das duas listadas (ex: ver mas não editar)?

**Conciliação bancária**

* [ ] Existe importação oficial de extrato bancário externo (OFX/CSV de banco tradicional) no Capim hoje? Se sim, em que tela e com que formato esperado?
* [ ] Existe botão de "desfazer conciliação" (`unreconcile`) acessível pela interface? Se não, qual o caminho oficial para o suporte pedir reversão?
* [ ] Lista atual das origens de transação remota suportadas além da própria Capim POS (Barte, Saude Service aparecem no enum; estão em produção?).

**Comissões**

* [ ] Onde exatamente o admin da clínica cadastra a regra de comissão (`Commission` por orçamento/procedimento e `ProcedureCommission` por tipo de procedimento)? Tela, caminho no menu, campos.
* [ ] O que cada um dos dashboards Metabase de comissão (120 e 121) mostra e quais filtros aceita?
* [ ] Fluxo oficial para ajustar uma comissão calculada com valor errado sem desfazer o pagamento de origem.

**Importação e migração**

* [ ] Orientação oficial sobre quais colunas a planilha de "Importar planilha" precisa ter, e quem preenche (cliente sozinho ou Capim).
* [ ] Existe limite de tamanho/volume na importação?

**Operação do dia a dia**

* [ ] Lista oficial dos métodos de pagamento aceitos no cadastro manual e como cada um se reflete na conciliação.
* [ ] Lista de filtros disponíveis hoje na barra de filtros (`RecordsFilter`): dentista, paciente, método de pagamento, categoria, status?

**Escalação**

* [ ] SLA esperado de resposta para cada nível de severidade no Time de Sustentação para questões financeiras.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Conciliação automática por valor+data aceita janela de 1 dia entre `payment_date` da transação remota e `competency_date` do lançamento." Confirmado por leitura de `RemoteTransactions::AutoReconcileByAmountDate`, mas vale validar se a janela é configurável por clínica.
* [ ] "Conciliação automática por intenção depende da feature flag `FF_AUTO_RECONCILE_ENABLED`." Validar se a flag está ligada em produção para todas as clínicas ou apenas algumas.
* [ ] "Comissão é dividida pelo número de parcelas do orçamento/procedimento." Confirmado em `Commissions::CreateFinancialRegistry` (`@commission.amount / @quantity`), validar se essa é a regra que produto quer manter.
* [ ] Dashboards Metabase 120 (admin) e 121 (não admin) do Resumo de comissões: confirmar conteúdo e segregação.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Categorias de receita e despesa listadas em `src/constants/financialControl.js` são exatamente as disponíveis na gaveta de novo lançamento.
* `registry_type` distingue origem do lançamento: `manual`, `payment_book`, `point_of_sale`, `commission`, `credit`, `credit_check`, `fee`.
* `source` aceita `financial_control`, `commission`, `bank_slip_payment`, `bnpl`, `budget`, `remote_transaction`, `procedure`, `order`, `payment_book`.
* Lançamento de Maquininha (transação remota Capim) **não é editável nem destrutível** pela tela (`editable?` e `destroyable?` retornam falso).
* Lançamentos de Carnê e Crédito (`registry_type: payment_book` ou `credit`) não são destrutíveis pela tela.
* Conciliação tem três status: `unreconciled`, `reconciled`, `hidden`. Aba "Ocultas" é o estado `hidden`.
* A tela de Conciliação só está disponível para usuários com `access-financial-control-all` + feature `financial-control` (policy `FINANCIAL_CONTROL_FULL`).
* Comissão é gravada como `financial_registry` de despesa com `registry_type: commission`, vinculado ao dentista beneficiário, com `competency_date` igual à data de vencimento da parcela do recebimento.
* Resumo de comissões é Metabase embarcado, dashboards diferentes para admin e não admin.
* Parcelamento de lançamento manual aceita até 36 parcelas; recorrência aceita repetição indefinida ou por N ocorrências.
