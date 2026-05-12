# 📘 Guia de Suporte: Carnê Capim e Boleto

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. Existe uma reforma do carnê em rollout controlado por experimento (`PAYMENT_BOOK_REFORM_EXPERIMENT`) que troca a tela antiga por um stepper novo (Boleto tradicional). 🚧 PENDENTE: confirmar percentual atual da reforma e cronograma de GA.

## 1. 🎯 Visão geral

O Carnê Capim é o "carnê da loja" da clínica. A clínica decide vender um tratamento parcelado, gera um carnê com N parcelas mensais, e o paciente recebe um boleto por mês (com data de vencimento fixa). Quem assume o risco da inadimplência é a **clínica**, não a Capim: se o paciente não pagar, é a clínica que perde. A Capim aqui só emite os boletos via Iugu, agrega no PDF do carnê, controla os vencimentos e, opcionalmente, cobra o paciente.

Resolve duas dores principais da clínica: ✅ ter um meio de receber parcelado sem passar por cartão (e sem pagar taxa de antecipação), e ✅ acompanhar pagamento parcela a parcela dentro do dashboard, com a parcela paga refletindo na ficha do paciente e no Controle Financeiro.

**Para quem é:** clínicas com a feature `carnes` ativa. O item de menu "Carnê Capim" só aparece quando essa flag está ligada. ✅ Validar: regra exata de elegibilidade (basta a flag, ou exige também conta de recebimento Iugu KYC aprovada?). No fluxo de criação, a tela `views/finance/carnes/NewView.vue` faz `getExternalDepositAccount` e bloqueia com `VerificationView` quando `kycVerified` é falso, então **conta KYC verificada na Iugu é pré-requisito real para gerar boleto**.

**Diferença vs Financiamento Capim (importante para o suporte):**

* No **Carnê Capim / Boleto tradicional**: a clínica é a credora. A Capim apenas emite e cobra (se contratado). Se o paciente não pagar, a clínica é quem fica sem o dinheiro daquela parcela. Não existe análise de crédito obrigatória, não existe pré-aprovação, não existe contrato CCB.
* No **Financiamento Capim** (módulo "credits"): a Capim assume o risco. Faz análise de crédito do paciente, antecipa o valor para a clínica e cobra o paciente. Se o paciente não paga, é a Capim que perde.
* Resumo prático para o suporte: se o cliente perguntar "quem cobra o paciente que não pagou?", a resposta no Carnê é "a clínica, com apoio opcional do Serviço de Cobrança Capim". No Financiamento, a resposta é "a Capim".

**Versões coexistindo hoje:**

* **Tela `/finance/carnes`** (módulo "Carnê Capim" no menu): página antiga, com Análise de Crédito (Score Capim, SERASA, Boa Vista) integrada, gasto de Pins e tabela do carnê.
* **Tela `/finance/payment_books`** (módulo "Boleto tradicional" no menu, label no `pt-BR.json`): página dedicada só ao carnê em si, sem análise de crédito atrelada. É para onde o botão "Gerar boleto" redireciona.
* **Reforma em experimento**: quando a clínica está no experimento `PAYMENT_BOOK_REFORM_EXPERIMENT`, a tela de criação `/finance/payment_books/new` carrega o `IndexViewExperiment.vue` (stepper de 3 passos: dados do boleto, dados do cliente, resumo) em vez do `NewView.vue` antigo (formulário único). É a mesma feature, layout novo.

**Onde se encaixa no produto Capim:** ligado ao módulo Pacientes (cada carnê pertence a um paciente, aparece no financeiro dele), ao Controle Financeiro (cada parcela paga é uma entrada na fluxo de caixa) e a Orçamentos (dá pra converter um orçamento aprovado em carnê via `convert_to_payment_book`).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Feature `carnes` ativa para a clínica.
* Conta de recebimento na Iugu com KYC verificado (o backend só emite o boleto se a clínica tem a `ExternalDepositAccount` aprovada). Sem isso, a tela mostra a `VerificationView` e bloqueia a criação.
* Paciente com **CPF, nome, telefone, e-mail e endereço completo** preenchidos. O formulário antigo trava sem esses campos. O formulário novo (experimento da reforma) pede só **nome, CPF, celular e e-mail** (e-mail é opcional). ✅ Validar com produto: a versão nova realmente não precisa de endereço, ou ele é puxado da ficha do paciente em segundo plano?

**Onde acessar:**

* Menu lateral → Produtos financeiros → **Carnê Capim** (rota `/finance/carnes`) para a página completa com análise de crédito + lista de carnês.
* Menu lateral → Produtos financeiros → **Boleto tradicional** (rota `/finance/payment_books`) para a lista pura de carnês e geração direta.
* Também é possível chegar pelo financeiro do paciente, no item "Lançar carnê" da ficha financeira, e por um orçamento aprovado, no botão "Converter em carnê".

**Fluxo típico (criar carnê pela ficha do paciente ou pelo botão "Novo carnê"):**

1. A recepcionista escolhe a origem: home do Carnê, ficha do paciente ou orçamento.
2. Informa o **valor total** do parcelamento.
3. Escolhe a **quantidade de parcelas**: o limite na UI é **1 a 36 parcelas** (constante `INSTALLMENTS_QUANTITY` cobre 1x até 36x). O backend também aceita até 36.
4. Define a **data do 1º vencimento**. A partir dela, o sistema calcula automaticamente os vencimentos seguintes adicionando 1 mês a cada parcela (`due_date_for_installment` no `CreateForm`).
5. Confere os dados do paciente (puxa da ficha, ou cria paciente novo direto na tela).
6. Aceita os termos gerais ("Será cobrado o valor de R$ 1,99 por cada boleto pago"). ✅ Validar: o texto exibido na UI hoje é literal `R$ 1,99 por cada boleto pago`. Confirmar com produto se essa taxa por boleto é a vigente hoje (a constante `COLLECTION_SERVICE_PRICE` vem da env `VUE_APP_COLLECTION_SERVICE_PRICE`, ou seja, é configurável por ambiente).
7. (Opcional) Contrata o **Serviço de Cobrança Capim** (CaaS): radio "Deseja contratar os Serviços de Cobrança da Capim?". Esse trecho está **comentado no formulário antigo** hoje (`<!-- ... -->` em `FormComponent.vue`), então na prática a opção **não aparece para o usuário no formulário tradicional**. ✅ Validar: se a contratação do Serviço de Cobrança está sendo feita por outra tela, ou se o produto desligou esse upsell de propósito.
8. Confirma. Aparece um modal "Gerar boleto?" e, ao confirmar, o backend cria o `FinancialRegistry` com `registry_type: payment_book`, gera N `FinancialOperations` (uma por parcela) e dispara o job assíncrono `NewPaymentBooks::GenerateInvoicesJob` que pede um boleto para a Iugu por parcela.
9. A tela vai para `/finance/payment_books/:id`, mostra "Aguarde a geração dos boletos" e fica escutando WebSocket (canal `NEW_PAYMENT_BOOKS_CHANNEL`) até os boletos prontos. Quando combina tudo num PDF único (`CombineInvoicesJob`), o link "Imprimir boletos" passa a funcionar.

**Fluxo típico (criar carnê a partir de orçamento aprovado):**

1. Na tela de orçamento, clicar em "Converter em carnê".
2. Cai no formulário do carnê com o **valor já preenchido e bloqueado** com o total do orçamento.
3. Recepção só escolhe número de parcelas e vencimento, confirma. Backend chama `convert_to_payment_book` e linka o `budget_id` no `FinancialRegistry`.

**Fluxo típico (envio do boleto ao paciente):**

* A tela de criação no fluxo novo (experimento da reforma) abre um modal "Enviar boletos" com opções de envio: **E-mail**, **Baixar boletos** (download de PDF). A opção de **WhatsApp existe no schema** (`whatsapp: true` como default), mas o checkbox está **comentado na UI** atual e por isso **não aparece para o usuário**. ✅ Validar com produto: o WhatsApp está desligado de propósito (rollout) ou é um esquecimento?
* No fluxo antigo (`/finance/carnes` + `NewView`), **não há modal de envio**. Após gerar, o usuário entra na `ShowView` e usa o botão "Imprimir boletos", que abre o PDF combinado para baixar/imprimir manualmente. O envio ao paciente fica a cargo da clínica (manda no zap próprio, e-mail, ou imprime).
* No backend, a notificação por WhatsApp de "carnê gerado" tem um template pronto (`Notifications::PaymentBooks::Templates::PaymentBookCreation`) **com a constante `WHATSAPP_ENABLED = false`**. Hoje o disparo automático por WhatsApp do "criamos seu carnê" está **desligado em código**. ✅ Validar: confirmar com produto se há previsão de virar `true` e em que condições.
* Por **e-mail**, existe job `PaymentBooks::Emails::GeneratedJob` que dispara para o paciente quando o flag `send_email_notification` chega `true` no momento da criação (controlado pela UI no fluxo novo do experimento).

**Status do carnê (`FinancialRegistry`, coluna `status`):**

* 🟡 **Em aberto / pending**: carnê criado, pelo menos uma parcela ainda em aberto.
* ✅ **Paga / finished**: todas as parcelas foram pagas (ou conciliadas).
* ⏳ **Em cancelamento / canceling**: clínica pediu cancelar; o sistema está cancelando os boletos com a Iugu. Estado transitório.
* ❌ **Cancelada / canceled**: cancelamento concluído, todas as parcelas em aberto foram canceladas.

**Status de cada parcela (`FinancialOperation`/boleto):**

* 🟡 **Em aberto / unpaid**: boleto emitido, vencimento futuro.
* ✅ **Pago / paid (finished)**: boleto compensado, parcela liquidada.
* 🔴 **Atrasada / overdue** e **Vencido / expired**: passou da data de vencimento e ainda não pagou. ✅ Validar: a UI tem dois labels diferentes (`overdue` e `expired`) no `constants/payment-books.js` e nos `bank-slips.js`. A diferença prática parece ser que `overdue` é o status do carnê quando tem parcela atrasada, e `expired` é o status do boleto individual. Confirmar com produto se a clínica enxerga os dois nomes ou só um.
* ❌ **Cancelada / canceled**: parcela cancelada (manualmente pela clínica ou junto com cancelamento do carnê inteiro).

**⚠️ Atenção:**

* O dia de vencimento das parcelas seguintes **é fixado pelo dia da 1ª**. Se a 1ª vence dia 10/06, as demais vencem 10/07, 10/08, 10/09... O sistema **não tem campo separado** "dia do mês para vencer" no fluxo antigo, é o dia da 1ª parcela que define tudo.
* O **valor da parcela é calculado automaticamente** pelo `Installments::AmountCalculator` a partir do total e da quantidade. O usuário não digita o valor da parcela, apenas o total. Diferenças de centavos por arredondamento ficam concentradas em alguma parcela (geralmente a primeira ou a última). ✅ Validar com eng/produto qual parcela carrega o ajuste de centavos.
* **Limite Iugu de 4 anos**: o `disabledDate` do calendário trava vencimentos além de 4 anos a partir de hoje (`IUGU_LIMIT_YEARS = 4`). Em prática, com 36 parcelas mensais isso não chega a aparecer, mas vale lembrar se a clínica testar datas longe demais.
* **Cancelar carnê inteiro vs cancelar parcela**: na tela `ShowView` existem dois botões. "Cancelar carnê" (no topo) cancela o carnê todo (chama `start_cancel!` e roda `NewPaymentBooks::Cancel`). O ícone "X" em cada linha cancela só aquela parcela. A clínica pode cancelar parcelas que ainda estão em aberto ou vencidas; parcelas pagas não dá pra cancelar pela tela (o atributo `can_cancel_bank_slips` do backend e a função `cancelVariantFor` desabilitam o ícone).
* **Dar baixa manual** (a clínica recebeu o pagamento por fora, em dinheiro ou Pix direto): o caminho é pela ficha do paciente, no Controle Financeiro, marcar a parcela como paga e informar método de pagamento (`payment_method`: cash, pix, credit_card, debit_card, check, wire_transfer, others). O sistema **só cancela o boleto na Iugu se a parcela for cancelada**; se a clínica só dá baixa manual sem cancelar o boleto, o boleto continua emitido e o paciente pode pagar duas vezes. Atenção a esse cenário no atendimento.

## > 3. 💼 Casos de uso esperados

* **Caso 1, parcelar tratamento de R$ 3.000 em 6x:** dentista combina com o paciente no consultório, recepção vai em "Carnê Capim" → "Novo carnê", preenche valor total R$ 3.000, 6 parcelas, 1º vencimento daqui a 30 dias. Sistema gera 6 boletos de R$ 500. Recepção imprime o PDF do carnê e entrega ao paciente, ou (no fluxo novo) marca "enviar por e-mail".
* **Caso 2, paciente pagou a 1ª parcela em dinheiro na clínica:** recepção vai na ficha financeira do paciente, abre a parcela 1, dá baixa manual marcando "Dinheiro" como método. ⚠️ **Importante orientar a clínica a cancelar o boleto daquela parcela junto**, senão o paciente pode pagar o boleto também e vai duplicar.
* **Caso 3, paciente quer renegociar (atrasou 2 parcelas, quer prorrogar):** hoje, a renegociação do Carnê Capim é feita cancelando as parcelas atrasadas e gerando um carnê novo (ou parcelas extras) com as novas datas. **Não existe botão de "renegociar" dedicado no Carnê Capim** na UI do dashboard. ✅ Validar com produto se há um fluxo planejado ou se o caminho oficial é mesmo cancelar e recriar.
* **Caso 4, clínica quer cancelar o carnê inteiro porque o paciente desistiu do tratamento:** recepção entra no carnê, clica em "Cancelar carnê", confirma. O sistema cancela na Iugu todos os boletos que ainda não foram pagos. Parcelas já pagas continuam pagas (o cancelamento do carnê **não estorna pagamento existente**). Para devolver dinheiro ao paciente, a clínica tem que fazer por fora.
* **Caso 5, converter orçamento aprovado em carnê:** dentista fechou orçamento de R$ 5.000, paciente concorda em parcelar em 10x. Recepção vai no orçamento, clica "Converter em carnê", confirma número de parcelas e vencimento, gera. O carnê fica linkado ao orçamento e os pagamentos das parcelas refletem no orçamento como recebido.
* **Caso 6, clínica usou análise de crédito antes:** na tela `/finance/carnes`, a clínica fez análise SERASA/Score Capim do CPF do paciente (consumindo Pins), viu o resultado, decidiu vender e clicou em "Gerar boleto" direto da tela do resultado. Esse fluxo é específico do `/finance/carnes` (a tela `/finance/payment_books` não tem essa integração). Vale lembrar para o suporte: gastar Pin em análise é uma decisão da clínica, não é obrigatório para gerar carnê.

## > 4. ❓ FAQ

**P: Qual a diferença entre "Carnê Capim" e "Boleto tradicional" no menu? São coisas diferentes?**

R: Não. Os dois levam ao mesmo produto (boleto avulso/parcelado gerado pela clínica). "Carnê Capim" (`/finance/carnes`) é a tela completa, com análise de crédito do paciente, gasto de Pins e lista de carnês. "Boleto tradicional" (`/finance/payment_books`) é só a lista e a criação, sem a parte de score. Por trás, é o mesmo `FinancialRegistry` do tipo `payment_book`. ✅ Validar com produto: existe plano de unificar essas duas entradas no menu?

**P: A clínica perguntou se a Capim cobra do paciente que não pagou. Como funciona?**

R: Por padrão, **não**. A clínica é quem cobra. Existe o **Serviço de Cobrança Capim (CaaS)**, opcional, contratado por carnê, que faz envio automático de 3 mensagens de WhatsApp pelo lado da Capim: 1 lembrete antes do vencimento e 2 mensagens de cobrança entre 5 e 15 dias de atraso (texto literal da UI). O valor cobrado é por **boleto pago** quando o serviço está contratado (a tela mostra "R$ {price} por cada boleto pago"). O radio de contratação no formulário antigo está **comentado na UI hoje**, então em prática a clínica não consegue contratar o CaaS pela tela. ✅ Validar: como a clínica contrata o CaaS hoje, qual o canal?

**P: A taxa de R$ 1,99 por boleto pago é cobrada sempre, ou só quando contrata cobrança?**

R: Pela UI atual ("Será cobrado o valor de R$ 1,99 por cada boleto pago", em **Condições gerais**, sem depender de contratar CaaS), parece ser sempre, mesmo sem CaaS. O valor vem da env `VUE_APP_COLLECTION_SERVICE_PRICE`. 🚧 PENDENTE: confirmar se essa taxa é descontada do valor recebido pela clínica e quando, e se mudou recentemente.

**P: A clínica pode oferecer carnê por Pix em vez de boleto?**

R: Pelo código atual, a parcela é criada com `pay_mean: 'bank_slip'` e `payment_method: 'bank_slip'` fixos no `CreateForm`. Os métodos de pagamento Pix, cartão, dinheiro, etc., só são usados quando a clínica **dá baixa manual**. O boleto emitido na Iugu **pode ter Pix embutido no QR Code** (o campo `pix_qr_code_text` existe na tabela `installments` do core), então o paciente abre o boleto e paga via Pix se quiser. Da perspectiva da UI da clínica, é "boleto"; do ponto de vista do paciente, ele paga como preferir dentro das opções que a Iugu mostra. ✅ Validar com produto se isso é comunicado para a clínica em algum lugar da UI.

**P: O paciente recebe o boleto automaticamente por algum canal?**

R: Depende da versão da tela. No fluxo novo (reforma em experimento), o modal de "Enviar boletos" oferece **E-mail** e **Baixar PDF**. A opção de **WhatsApp existe no código** mas o checkbox está comentado na UI, e o template de WhatsApp de "carnê gerado" tem `WHATSAPP_ENABLED = false` no backend. No fluxo antigo, **nada é enviado automaticamente**, a clínica imprime ou compartilha o PDF do carnê pelo botão "Imprimir boletos" na `ShowView`. ✅ Validar: cronograma de ativar o envio por WhatsApp no fluxo de criação.

**P: O paciente pagou um boleto. Em quanto tempo aparece como pago no dashboard?**

R: O pagamento entra via webhook da Iugu para o backend. Quando o webhook chega, a `FinancialOperation` muda para `finished`, o `FinancialRegistry` recalcula o `outstanding_balance` e, quando zera, vai pra `finished`. **Não é instantâneo**, depende do tempo de compensação do boleto/Pix e do processamento do webhook. Para Pix dentro do boleto Iugu, costuma ser rápido (minutos). Para boleto bancário, segue o ciclo de compensação normal (geralmente até 2 dias úteis). 🚧 PENDENTE: confirmar SLA oficial Capim/Iugu.

**P: A clínica disse que cancelou o carnê mas o paciente continuou recebendo cobrança. Como?**

R: Possíveis cenários: (1) o cancelamento ficou em `canceling` e não terminou (estado transitório, escalar para eng se ficar parado mais de alguns minutos). (2) Parcelas **já pagas** não viram canceladas, então o paciente não recebe nova cobrança por elas, mas continua tendo o histórico. (3) Se a clínica contratou o Serviço de Cobrança e o cancelamento aconteceu **depois** que a mensagem de cobrança foi disparada, o paciente recebeu a última mensagem antes do cancelamento propagar.

**P: A clínica não está vendo o menu "Carnê Capim" ou "Boleto tradicional". Por quê?**

R: O menu "Carnê Capim" depende da feature flag `carnes` na clínica. Sem a flag, o item simplesmente não aparece. ✅ Validar com produto: como suporte verifica/solicita essa flag para uma clínica.

**P: Tenho um paciente sem CPF, dá pra gerar carnê?**

R: Não pela UI. O CPF é obrigatório no formulário antigo (regra de validação `required`) e a Iugu exige CPF para emitir o boleto. Se o paciente não tem CPF, o caminho é cadastrar primeiro na ficha e voltar.

**P: A parcela paga aparece no Controle Financeiro?**

R: Sim. Como `FinancialRegistry` com `kind: revenue` e `registry_type: payment_book`, cada parcela paga é uma entrada de receita do dia em que o pagamento foi confirmado, e aparece tanto no Controle Financeiro quanto no financeiro da ficha do paciente (origem `payment_book`).

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo gerar um novo carnê, a tela pede para verificar conta." | A conta de recebimento Iugu (`ExternalDepositAccount`) não está com KYC verificado. | Pedir para abrir o módulo "Carnê Capim" e seguir o fluxo da `VerificationView` (preencher os dados bancários/KYC). | Se a clínica jura que preencheu e o sistema continua bloqueando, escalar com ID da clínica e print da tela de verificação. |
| "Cliquei em gerar carnê e a página fica eternamente mostrando 'Aguarde a geração dos boletos'." | O job assíncrono `GenerateInvoicesJob` falhou ou está travado, ou o WebSocket caiu antes de receber o evento. | Pedir pra atualizar a página (F5). Se voltar a aparecer "aguarde", ver na lista de carnês se o carnê apareceu pelo menos com status `pending`. | Escalar com ID do carnê (financial_registry_id) e ID da clínica. Engenharia checa fila Sidekiq e logs da Iugu. |
| "Imprimir boletos abre uma página em branco ou dá erro." | O PDF combinado (`invoices_file`) ainda não foi gerado, ou a Iugu não respondeu a tempo. | Verificar se já passou mais de 2 minutos da criação. Se sim, atualizar a tela do carnê (F5) para repuxar o link. | Escalar se o link continua quebrado depois de F5 com ID do carnê. |
| "Cancelei o carnê mas continua com status 'em cancelamento'." | O `NewPaymentBooks::Cancel` ficou aguardando confirmação da Iugu sobre o cancelamento dos boletos. | Esperar alguns minutos e recarregar. | Se passar de 15 minutos sem mudar para `canceled`, escalar com ID do carnê. |
| "A parcela está como 'paga' no dashboard mas o paciente diz que pagou outro boleto." | Conciliação incorreta ou pagamento manual + boleto pago em paralelo (cenário do FAQ 4). | Confirmar com a clínica se houve baixa manual da parcela. Conferir no histórico financeiro do paciente. | Escalar duplicação para eng com IDs envolvidos. |
| "Quero alterar o valor de uma parcela depois de gerado." | Não é possível pela UI. O valor da parcela é definido na criação e fica imutável. | Orientar a cancelar a parcela específica e criar um carnê novo de uma parcela com o valor correto, ou cancelar o carnê inteiro e refazer. | Escalar só se for situação crítica com muitas parcelas pagas no meio. |
| "Quero mudar a data de vencimento de uma parcela depois de gerada." | Mesma limitação: não dá pra editar pela tela. | Orientar a cancelar e recriar a parcela específica. | Escalar para eng se a clínica quer um ajuste em massa (ex: pandemia, prorrogar todo mundo 30 dias). |
| "A clínica cancelou um carnê por engano. Dá pra desfazer?" | O cancelamento já chamou a Iugu e os boletos viraram inválidos. Não tem botão de "reativar carnê" na UI. | Explicar que o caminho prático é recriar o carnê com as parcelas em aberto que sobraram. | Escalar se a clínica precisa do registro histórico mantido (não recriar do zero). |
| "O paciente diz que não recebeu o boleto por e-mail." | A clínica esqueceu de marcar "Enviar por e-mail" no modal de envio, ou o e-mail do paciente está errado/em branco, ou o e-mail caiu em spam, ou está usando o fluxo antigo (que não envia automaticamente). | Conferir cadastro do paciente (e-mail correto). Orientar a clínica a usar "Imprimir boletos" e mandar o PDF pelo zap da clínica. | Escalar se o e-mail estiver correto, fluxo novo, e mesmo assim não chegou. Eng confere log do `GeneratedJob`. |
| "Tem dois itens 'Carnê Capim' e 'Boleto tradicional' no menu, qual usar?" | A clínica está com as duas entradas habilitadas. | Explicar que são o mesmo produto. Recomendar "Carnê Capim" se quer análise de crédito junto, e "Boleto tradicional" se quer só a lista. | Não escalar, é UX. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Bug de geração de boleto, cancelamento travado, conciliação incorreta de pagamento, ativação da feature `carnes` para uma clínica: tudo passa por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Valor e data de uma parcela individual não são editáveis** pela UI depois de gerados. Para ajustar, é cancelar e recriar.
* **Não existe botão de renegociação** dedicado ao Carnê Capim no dashboard. Renegociação é feita manualmente cancelando parcelas e/ou gerando carnê novo.
* **Cancelamento do carnê não estorna pagamentos já feitos.** Estorno é tratado por fora.
* **Envio automático por WhatsApp do "carnê gerado" está desligado em código** (`WHATSAPP_ENABLED = false` no template do backend, checkbox comentado no front).
* **Serviço de Cobrança Capim (CaaS) não tem caminho de contratação pela tela do formulário antigo hoje**: a seção está comentada no `FormComponent.vue`. ✅ Validar onde a clínica contrata.
* **Vencimentos seguem o dia da 1ª parcela**, não há campo "dia do mês para vencimentos" separado.
* **Mínimo de R$ por parcela** é configurável por env (`VUE_APP_INSTALLMENT_MIN_VALUE`), não é fixo, e a tela rejeita parcelas abaixo desse valor mínimo. 🚧 PENDENTE: confirmar o valor vigente em produção.
* **Limite de 36 parcelas** na UI antiga (`max: 36` no input number e no array `INSTALLMENTS_QUANTITY` de 1 a 36).
* **Limite de 4 anos** para a data do 1º vencimento (constante `IUGU_LIMIT_YEARS = 4`).
* **Taxa de R$ 1,99 por boleto pago** está hard-coded na env do front. Não é configurável por clínica.
* **Conta KYC Iugu obrigatória** para criar carnês. Clínicas com KYC pendente ficam bloqueadas na `VerificationView`.

## > 7. 🗺️ Próximos passos [opcional]

* GA da reforma do Boleto (`PAYMENT_BOOK_REFORM_EXPERIMENT`), com stepper novo e modal de envio por e-mail/WhatsApp. 🚧 PENDENTE: data prevista e percentual atual.
* Ativação do envio automático por WhatsApp do "carnê gerado" para o paciente. 🚧 PENDENTE.
* Unificação dos itens de menu "Carnê Capim" e "Boleto tradicional". 🚧 PENDENTE confirmar se está planejado.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: home de Carnê Capim com Pins, análise de crédito e lista de carnês]

[INSERIR PRINT: home de Boleto tradicional, só com lista de carnês]

[INSERIR PRINT: formulário antigo de novo carnê com valor, parcelas, data e dados do paciente]

[INSERIR PRINT: stepper novo (reforma) passo "Dados do boleto"]

[INSERIR PRINT: stepper novo passo "Dados do cliente"]

[INSERIR PRINT: stepper novo passo "Resumo"]

[INSERIR PRINT: modal "Enviar boletos" com checkboxes de e-mail e download]

[INSERIR PRINT: ShowView do carnê com a tabela de parcelas e botões de cancelar parcela e cancelar carnê inteiro]

[INSERIR PRINT: tela `VerificationView` quando KYC Iugu está pendente]

[INSERIR PRINT: ficha financeira do paciente mostrando o carnê como `FinancialRegistry` tipo `payment_book`]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Disponibilidade e elegibilidade**
* [ ] Cronograma e percentual atual da reforma do Boleto (`PAYMENT_BOOK_REFORM_EXPERIMENT`). Quando vira GA?
* [ ] Como o suporte verifica/solicita a feature `carnes` para uma clínica?
* [ ] Existe plano de unificar "Carnê Capim" e "Boleto tradicional" num único item de menu?

**Taxa e cobrança**
* [ ] Confirmar valor vigente da taxa por boleto pago em produção (a UI mostra R$ 1,99, mas é env). É descontada quando? Como aparece pra clínica?
* [ ] Onde/como a clínica contrata o Serviço de Cobrança Capim hoje, já que o radio do formulário antigo está comentado? Existe outro fluxo?
* [ ] Confirmar valor mínimo de parcela (`VUE_APP_INSTALLMENT_MIN_VALUE`) em produção.

**Envio e notificações**
* [ ] WhatsApp de "carnê gerado": cronograma para virar `WHATSAPP_ENABLED = true` e checkbox aparecer na UI nova.
* [ ] SLA esperado de envio do e-mail com o PDF do carnê depois do "gerar".
* [ ] Texto exato dos lembretes/mensagens automáticas do Serviço de Cobrança Capim (a UI menciona "1 lembrete dias antes" e "2 mensagens entre 5 e 15 dias de atraso", confirmar números e gatilhos).

**Renegociação e baixa manual**
* [ ] Existe fluxo planejado de renegociação dedicado para o Carnê Capim, ou continua sendo cancelar+recriar?
* [ ] Recomendação oficial para o cenário "paciente pagou em dinheiro e o boleto está em aberto" (a baixa manual deveria cancelar o boleto automaticamente?).

**Status e UI**
* [ ] Distinção UI entre `overdue` (carnê) e `expired` (boleto) está exposta para a clínica em algum lugar?
* [ ] Qual parcela carrega o ajuste de centavos do arredondamento (primeira, última, ou distribui)?

**Pix e métodos**
* [ ] A clínica é avisada em algum lugar da UI que o boleto Iugu inclui Pix por QR Code? Vale comunicar?

**Escalação**
* [ ] SLA do Time de Sustentação para bugs de Carnê (criação travada, cancelamento parado, conciliação incorreta).

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Conta KYC Iugu verificada é pré-requisito para gerar carnê." Confirmado pela `VerificationView` no `NewView.vue`, mas vale confirmar se há clínicas com a feature `carnes` ativa e KYC pendente em situação aceitável.
* [ ] "Carnê Capim e Boleto tradicional são o mesmo produto (mesmo `FinancialRegistry` tipo `payment_book`)." Confirmado pelo backend (`registry_type: :payment_book` em ambos os fluxos), mas vale validar com produto se o discurso oficial pro cliente é esse.
* [ ] "O Carnê não tem renegociação dedicada." Confirmado pela ausência de endpoint e botão. Confirmar se é decisão de produto ou se está no roadmap.
* [ ] "Serviço de Cobrança Capim hoje está sem fluxo de contratação visível na UI." Confirmado pelo comentário `<!-- -->` no `FormComponent.vue`. Confirmar se o serviço ainda é vendido e como.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend` e frontend, podem ser tratados como confirmados:

* O Carnê Capim usa `FinancialRegistry` com `registry_type: payment_book`. O Financiamento usa `registry_type: credit`. São produtos distintos.
* Quem cobra o paciente inadimplente no Carnê é a clínica (a Capim só emite o boleto). No Financiamento é a Capim.
* Limite de 1 a 36 parcelas na UI (`INSTALLMENTS_QUANTITY`, `min: 1`, `max: 36`).
* Vencimentos calculados automaticamente somando 1 mês ao 1º vencimento.
* `pay_mean` e `payment_method` da parcela criada vêm como `bank_slip` por padrão.
* Pagamentos manuais (cash, pix, credit_card, debit_card, check, others, wire_transfer) só entram por baixa manual.
* Status do carnê: `pending`, `canceling`, `canceled`, `finished`. Status da parcela: `pending`, `finished`, `canceled`, `expired/overdue` (UI), além de `inactive`, `error`, `refunded` no AASM completo.
* Cancelamento do carnê dispara `NewPaymentBooks::Cancel`, que cancela boletos abertos na Iugu. Não estorna pagamentos.
* O modal de "Enviar boletos" do fluxo novo oferece e-mail e download, com WhatsApp comentado no código.
* O template de WhatsApp de "carnê gerado" tem `WHATSAPP_ENABLED = false` (notificação no ato da criação está desligada).
* Conversão de orçamento em carnê existe via endpoint `/v2/payment_books/convert_to_payment_book`.
* Conta Iugu com KYC verificado é necessária para o `NewView.vue` permitir criação.
* Carnê paga gera entrada de receita (`kind: revenue`) que aparece no Controle Financeiro e no financeiro do paciente.
