# 📘 Guia de Suporte: Maquininha

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. O credenciamento V2 está em produção (`/finance/accreditation-v2`). Antecipação manual ("spot") só aparece para clínicas com `anticipation_type = manual`; clínicas com plano automático recebem D+1 sem botão de antecipar. 🚧 PENDENTE: confirmar percentual atual de clínicas em cada plano.

## 1. 🎯 Visão geral

A Maquininha é o produto de meios de pagamento da Capim. Vai além da maquininha física (POS): é o pacote completo de "Stone/Cielo/PagSeguro" voltado pra clínica odontológica, com aparelho na recepção pra passar cartão e Pix, painel pra acompanhar as vendas, agenda de recebíveis, antecipação, controle de split entre dentistas e saque pra conta bancária do titular. Pense na vitrine de uma adquirente tradicional, só que integrada ao prontuário do paciente: a transação cobrada na maquininha aparece automaticamente no financeiro do paciente e no Controle Financeiro da clínica.

Resolve três dores: depender de adquirente externa (e perder visibilidade do que entra no caixa), conciliar manualmente o que cada dentista recebeu de comissão (split), e esperar 30 dias pelo dinheiro do cartão de crédito quando a clínica precisa do caixa hoje (antecipação).

**Para quem é:** clínicas que passaram pelo credenciamento de POS e tiveram a proposta aprovada. Não é um plano "ligado por padrão", a clínica entra na fila e o aparelho é enviado depois da aprovação do credenciamento e da validação da conta bancária.

**Quem vê e edita o quê dentro da clínica:** o acesso é granular por permissão. Existem quatro permissões específicas da Maquininha (slugs internos):
* `access-transactions-capininha`: ver histórico de transações.
* `access-receivables-capininha`: ver agenda de recebíveis.
* `access-split-capininha`: configurar split (rateio entre dentistas/clínica).
* `access-spot-capininha`: solicitar antecipação avulsa ("spot").

O **admin da clínica enxerga e faz tudo** mesmo sem essas permissões nominais. Saque não tem permissão dedicada visível no código: tipicamente segue o padrão admin. 🚧 PENDENTE: confirmar com produto se saque tem permissão própria fora dessas quatro.

**Onde se encaixa no produto Capim:** conecta com o **Simulador de Vendas** (calcular líquido antes de cobrar, com ou sem repasse de taxa pro paciente), com **Controle Financeiro** (cada transação vira uma entrada no caixa), com **Pacientes** (a cobrança aparece no financeiro do paciente), com **Credenciamento** (`/finance/accreditation-v2`, mesmo fluxo do BNPL/Carnê com etapa adicional de endereço de entrega da maquininha) e com **Comissões/Split** (rateio configurável da venda entre clínica titular e profissionais cadastrados).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Clínica precisa ter CNPJ cadastrado (o fluxo de credenciamento pergunta logo no início se é pessoa jurídica).
* Credenciamento completo: passa pelas etapas de telefone, endereço, faturamento mensal, faturamento em cartão, sócio legal, sócio técnico (CRO/COREM/CRBM/CRM), pessoa de contato, dados bancários, documentos de KYC (RG/CNH frente e verso, selfie) e prova de vida (liveness).
* Conta bancária validada (a aprovação do POS depende disso, o estado interno passa por `external_validation_pending` antes de virar `approved`).
* Aceite do contrato de uso (Termos de Uso da Maquininha). O sistema bloqueia o uso enquanto `pos_contract_accepted_at` for nulo: mostra um modal de termos no acesso à tela.

**Onde acessar:**

* Menu lateral → Financeiro → Maquininha.
* URL típica: `/finance/card-transactions` (tela principal com abas Transações e Recebíveis).
* Telas relacionadas:
  * `/finance/accreditation-v2`: credenciamento (todas as etapas do KYC).
  * `/finance/pos-checkout`: checkout do aparelho depois da aprovação (conta bancária + endereço de entrega).
  * `/finance/card-transactions/anticipation`: solicitar antecipação avulsa.
  * `/finance/card-transactions/anticipation/history`: histórico de antecipações.
  * `/finance/card-transactions/split-members`: configuração de split (percentual por dentista).
  * `/finance/card-transactions/sales-simulator`: simulador de venda.
  * `/finance/card-transactions/:transactionId`: detalhes de uma transação específica.
  * `/finance/withdraw`: saque pra conta bancária.
* ⚠️ Atenção: `/finance/pins` **NÃO é o PIN da maquininha**. É uma tela que vende pacotes de "PINs de consulta de crédito" (usados no produto BNPL pra analisar paciente). Não confundir com senha do aparelho.

**Fluxo típico (credenciar e receber o aparelho):**

1. A clínica entra em Maquininha pela primeira vez. Se ainda não tem credenciamento, vê o `EmptyState` com proposta de valor e botão pra começar.
2. Clica em começar e cai em `/finance/accreditation-v2`. Percorre as etapas (no fluxo otimizado, pula sociais e procedimentos médios). Em cada etapa o backend grava o avanço (`step` da `FinanceAccreditation`).
3. Faz a prova de vida (liveness) e envia os documentos. O `pos_state` passa de `incomplete` pra `analysis`.
4. Após análise interna, o `pos_state` pode ir pra `bank_account_incomplete`, `external_validation_pending`, `bank_account_manual_validation`, `external_validation_rejected` (todos relacionados a validação de conta) ou direto pra `approved`.
5. Quando `approved`, a clínica é redirecionada pra `/finance/pos-checkout`: confirma os dados bancários (banco, agência, conta, chave Pix), escolhe endereço de entrega (endereço da clínica ou endereço do sócio legal cadastrado), aceita os termos e a ordem (`PosOrder`) é criada com status `pending`.
6. A `PosOrder` segue o fluxo `pending → sent → delivered`. O `sent` significa que saiu pra entrega; `delivered` é confirmado pela clínica clicando em "Recebi a maquininha".
7. Quando a clínica clica em "Recebi" no `OrderSummaryComponent`, a `PosOrder` vira `delivered`. Só a partir daí as abas de Transações e Recebíveis ficam habilitadas (o sistema usa `deliveredAndCapimPOS` como travão na UI).

**Fluxo típico (passar uma cobrança no aparelho):**

* A operação física acontece no aparelho, fora do dashboard. O dashboard só **espelha** as transações que vêm do processador (Payfac, integração interna).
* A clínica abre `/finance/card-transactions`, aba Transações, e vê o histórico.

**Fluxo típico (ver transações no painel):**

1. Entra em Maquininha, aba Transações.
2. Vê dois totalizadores no topo: "Total transacionado" e "Total de transações" (filtra pelo status escolhido).
3. Filtros disponíveis: período (calendário) e status (pendente, processada, negada, cancelada, estornada).
4. Tabela lista as transações. Cada linha tem bandeira do cartão (ou ícone Pix), data, valor, status, parcelas.
5. Clica numa linha pra ir em `/finance/card-transactions/:id`: vê valor bruto, taxa, valor líquido a receber, bandeira, portador, data, método de pagamento, número de parcelas, status.
6. Se foi Pix, aparece o botão "Estornar Pix" (só se a transação não foi estornada ainda). Ao clicar, abre modal de confirmação. O fluxo de estorno **não chama API direto**: atualiza um contato no Hubspot com os dados da transação que o cliente quer estornar. Operação humana no backoffice/CS faz o resto.

**Fluxo típico (ver recebíveis):**

1. Entra em Maquininha, aba Recebíveis.
2. Vê totalizadores de "Recebíveis futuros" e "Último recebimento" (com data e valor).
3. Filtros: profissional/split member (filtra recebíveis de um CPF/CNPJ específico) e período.
4. Tabela lista cada parcela a receber com data de pagamento prevista e valor.

**Fluxo típico (antecipar recebíveis, plano "spot" manual):**

1. Só aparece se o `anticipation_type` da clínica é `manual`. Clínicas com plano `automatic` recebem D+1 sempre e não veem botão de antecipar.
2. Na tela principal, no card de Antecipação no painel lateral, clica em "Antecipar".
3. Cai em `/finance/card-transactions/anticipation`. Escolhe o split member (por padrão vem a clínica titular).
4. Vê tabela com cada parcela antecipável: valor bruto, valor da taxa de antecipação ("spot"), valor líquido se antecipar agora.
5. Marca as parcelas (checkbox) que quer antecipar. Resumo lateral mostra total bruto, total de taxa e líquido a receber hoje.
6. Clica em "Solicitar antecipação". Modal de confirmação. Confirma.
7. Drawer mostra a antecipação aprovada com o líquido e a data de pagamento (data prevista informada pelo motor de antecipação, vem do campo `paymentDate` do Payfac).
8. A antecipação vai pra histórico (`/finance/card-transactions/anticipation/history`).

**Fluxo típico (configurar split entre dentistas):**

1. Só com permissão `access-split-capininha` (ou admin).
2. Acessa Maquininha → ícone "Comissões" no menu lateral → `/finance/card-transactions/split-members`.
3. Tabela lista cada "receiver" cadastrado (a clínica titular e cada profissional adicional). Cada um tem um percentual editável.
4. A soma dos percentuais precisa fechar em 100% (a UI mostra alerta verde quando bate 100, amarelo quando falta e vermelho quando passou). Botão de salvar fica desabilitado se o total não é 100.
5. Pra adicionar um novo split member, clica em "Adicionar profissional". Abre uma URL externa (configurada em `VITE_ADD_SPLIT_MEMBER`). Lá fora a clínica preenche dados do profissional (nome, documento, conta bancária). ⚠️ Cadastro de novo dentista no split **não é feito dentro do dashboard**: é um formulário externo (provavelmente Typeform ou similar). 🚧 PENDENTE: confirmar qual é o destino real e o SLA pra ele aparecer no dashboard.
6. Após salvar, cada nova transação passa a respeitar o novo split. Transações antigas não são recalculadas.

**Fluxo típico (sacar pra conta bancária):**

1. Acessa `/finance/withdraw`.
2. Vê o saldo disponível em "Total disponível para saque".
3. Clica em "Solicitar saque". Abre modal.
4. ⚠️ O **valor do saque é fixo no saldo total**: o campo de valor vem **desabilitado** e preenchido com todo o saldo disponível. **Não dá pra sacar valor parcial pela tela**.
5. Valor mínimo: R$ 5,00 (500 centavos no backend).
6. Confirma. A solicitação entra na fila (`RequestWithdrawalJob`) e o dinheiro cai na conta bancária cadastrada (banco, agência e conta exibidos abaixo).
7. A clínica vê as últimas movimentações de saque no painel "Últimas transações" ao lado.

**Fluxo típico (simulador de vendas):**

1. Acessa Maquininha → "Simulador de vendas" no menu lateral → `/finance/card-transactions/sales-simulator`.
2. Preenche: método de pagamento (crédito, débito ou Pix), valor da venda, número de parcelas (se crédito), se quer repassar a taxa pro paciente.
3. Resultado mostra valor líquido que a clínica recebe e (se repasse) valor final que o paciente vai pagar.
4. Útil pra decisão antes de cobrar: ver quanto custa cada método e simular o repasse.

**Estados que aparecem no credenciamento (`pos_state` da `FinanceAccreditation`):**

* `incomplete`: clínica começou e não terminou o fluxo.
* `analysis`: enviou e está em análise interna da Capim.
* `bank_account_incomplete`: análise passou, falta completar dados bancários.
* `external_validation_pending`: dados bancários enviados, aguardando validação do parceiro externo (geralmente até 24h, depende do parceiro).
* `bank_account_manual_validation`: precisa de intervenção manual da Capim pra validar.
* `external_validation_rejected`: o parceiro recusou os dados bancários, clínica precisa corrigir e reenviar.
* `approved`: credenciamento aprovado, próximo passo é receber o aparelho.
* `rejected`: análise rejeitou o credenciamento. Motivos vão de "CNPJ com restrição alta", "sócios com restrição", "empresa recém-aberta", "clínica não localizada", "CRO menor que 1 ano", "documentos expirados" até "CNAE secundário de odontologia".
* `lost`: caso em que o credenciamento foi marcado como perdido (clínica abandonou ou foi marcada como perdida pelo backoffice).

**Estados que aparecem na entrega do aparelho (`status` da `PosOrder`):**

* `pending`: ordem criada, ainda não saiu pra entrega.
* `sent`: aparelho enviado, está com a transportadora.
* `delivered`: clínica confirmou recebimento.
* `canceled`: ordem cancelada (transição só sai de `pending`).

**⚠️ Atenção:**

* O **valor mensal da maquininha física é exibido como R$ 69,90/mês** no resumo de credenciamento (constante `POS_VALUE = 69.9` em `pos-accreditation.js`). A tela também mostra um banner "Isenção da mensalidade" com condições; o texto real do banner vem de i18n e fala em isenção condicionada a faturamento mínimo. 🚧 PENDENTE: confirmar com produto a regra atual de isenção da mensalidade da maquininha (faturamento mínimo, prazo, se já está em vigor).
* **Quantidade na ordem é fixa em 1 aparelho** por credenciamento (`POS_QUANTITY = 1`). Não existe fluxo de pedido de aparelho adicional pela tela.
* **Modelo do aparelho não é informado na UI**. 🚧 PENDENTE: confirmar qual modelo/fornecedor a Capim entrega hoje.
* **Saque parcial não existe na UI**, mesmo o backend aceitando valores diferentes do saldo total (o `RequestWithdrawalForm` só valida mínimo 500). A trava é só visual.
* **Estorno de cartão não tem fluxo pela UI**. Só Pix tem o botão "Estornar Pix", e mesmo esse botão **não estorna direto**: ele só atualiza o contato no Hubspot com os dados do pedido. Quem efetiva é o operacional da Capim. Para cartão, a clínica precisa abrir chamado com o suporte.
* **Endereço de entrega da maquininha**: a clínica escolhe entre endereço da clínica (do `FinanceAccreditation`) ou endereço do sócio legal (legal_member_address). Depois de criada a `PosOrder`, **não há reedição visível de endereço** na UI.

## > 3. 💼 Casos de uso esperados

* **Caso 1, clínica nova quer maquininha:** entra em Financeiro → Maquininha pela primeira vez, vê tela vazia com proposta de valor e botão pra credenciar. Faz o credenciamento V2 completo (telefone, endereço, faturamento, sócios, documentos, liveness). Aguarda análise. Quando aprovado, recebe e-mail ou nota in-app e volta no dashboard pra completar checkout (dados bancários + endereço de entrega). Aceita termos, ordem é criada. Aparelho chega pelos Correios em alguns dias úteis (🚧 PENDENTE: SLA real de entrega). Clínica clica em "Recebi a maquininha" e o painel libera as abas de Transações/Recebíveis.
* **Caso 2, recepcionista quer ver venda do dia:** entra em Maquininha, aba Transações, calendário em "hoje", vê totalizador "Total transacionado" e a lista. Se uma transação aparece como "pendente", explica pra clínica que ainda está em processamento e o status muda quando o adquirente confirma.
* **Caso 3, dentista de clínica grande quer ver só o que é dele:** ele tem `access-receivables-capininha` ativo. Entra em Maquininha, aba Recebíveis, filtra o split member pelo CPF dele. A tabela passa a mostrar só os recebíveis da participação dele.
* **Caso 4, dona da clínica precisa de caixa hoje:** plano `manual` (spot). Tem R$ 12 mil em recebíveis futuros. Entra em Maquininha, card Antecipação no lateral, clica em "Antecipar". Escolhe seis parcelas, vê que ia receber R$ 6 mil em 30 dias, e antecipando recebe R$ 5.700 hoje (com R$ 300 de taxa, valores hipotéticos). Confirma. Recebe pra conta D+1 ou conforme `paymentDate` retornado.
* **Caso 5, dentista associado precisa receber direto:** clínica configura split. Em Comissões, define clínica 70% e dentista 30% (por exemplo). A próxima venda do dentista entra na maquininha; o dashboard mostra a transação total, e a parte do dentista vai pra conta bancária dele (cadastrada como split member), enquanto a parte da clínica vai pra conta da clínica. Saque é por receptor.
* **Caso 6, clínica quer cobrar a taxa do paciente:** abre o Simulador de Vendas, marca "Repassar taxa para o cliente". Vê o valor que o paciente paga e o valor líquido pra clínica. Decide se é viável. O simulador é só cálculo, não cria cobrança nem trava a maquininha.
* **Caso 7, clínica quer sacar saldo:** entra em Saque, vê saldo, clica em "Solicitar saque". O modal já vem com o valor cheio (não dá pra editar). Confirma. Dinheiro cai na conta cadastrada.

## > 4. ❓ FAQ

**P: A clínica fez o credenciamento, está há 5 dias em "análise". É normal?**

R: Depende do estado exato. `analysis` é a etapa de análise interna da Capim (KYC do CNPJ, sócios, antecedentes). A duração média não está documentada no código, depende do operacional/backoffice. 🚧 PENDENTE: confirmar SLA típico de análise. Se passar de uma semana, vale escalar pra time de credenciamento checar manualmente. Se o estado virou `bank_account_incomplete` ou `external_validation_rejected`, a clínica precisa voltar no fluxo (a UI direciona) e corrigir os dados bancários.

**P: A clínica diz que foi rejeitada. Por que?**

R: O motivo fica no campo `pos_rejection_reason` do `FinanceAccreditation`. Os motivos possíveis são: CNPJ com restrição, sócios com restrição, técnico responsável com restrição, empresa recém-aberta, sócios em processos judiciais, avaliações negativas em Reclame Aqui/Google, sócios politicamente expostos, clínica não localizada, dados de cadastro inválidos, clínica já cadastrada, documentos banidos, suspeita de fraude, calamidade pública, antecedentes criminais, documentos expirados, documentos inválidos, situação na Receita Federal, não ser empresa odontológica, ações judiciais, CRO com menos de 1 ano, RT diferente do RL e CNAE secundário de odontologia. O suporte pode olhar no backoffice qual foi o motivo e orientar a clínica (alguns têm solução, como "documentos expirados"; outros são final).

**P: O aparelho não chegou. Onde acompanho?**

R: A `PosOrder` tem status `pending → sent → delivered`. Não existe tela com código de rastreio: a clínica vê apenas "ordem criada" na tela de checkout. 🚧 PENDENTE: confirmar se existe canal pra clínica acompanhar (e-mail com rastreio? mensagem do CS?). Quando o aparelho chega, a própria clínica clica em "Recebi a maquininha" no banner do dashboard. Isso muda o status pra `delivered` e libera Transações/Recebíveis.

**P: A clínica recebeu o aparelho mas não consegue usar o painel. Por que?**

R: Provável: ela não clicou em "Recebi a maquininha" ainda. O painel olha pra `PosOrder.status === 'delivered'` (variável `deliveredAndCapimPOS` na UI) pra liberar as abas. Outro motivo: ela ainda não aceitou os Termos de Uso da Maquininha (`pos_contract_accepted_at` nulo). Nesse caso aparece um modal de termos no acesso.

**P: A clínica tem maquininha mas não vê o botão de antecipar. Por que?**

R: O botão de antecipar só aparece pra clínicas com `anticipation_type = manual` (plano "spot"). Quem está no `automatic` recebe D+1 todo dia útil sem ação humana e não tem botão. Pra mudar o tipo de antecipação (manual ↔ automático) é via backoffice (`/backoffice/retails` em `update_anticipation_type`), não há autosserviço.

**P: O cliente quer antecipar mas só parte das parcelas. Dá?**

R: Sim. Na tela `/finance/card-transactions/anticipation` cada parcela é um checkbox. A clínica escolhe quais quer antecipar; o resumo lateral recalcula taxa e líquido em tempo real.

**P: Quanto custa a antecipação? Qual a taxa?**

R: A taxa vem do `SellerFees` da clínica, campo `spotPercentage`. **Cada clínica pode ter taxa diferente** (depende do plano/negociação). O suporte vê a taxa atual na tela de antecipação, no resumo lateral, ou em "Minhas taxas" no menu lateral da Maquininha (`openCapimPOSDrawer`). 🚧 PENDENTE: confirmar onde o suporte vê a tabela vigente pra cada cliente, idealmente sem precisar logar como ele.

**P: A clínica quer mudar a conta bancária de saque/recebimento. Como?**

R: O cadastro inicial é no checkout do POS. Após cadastrada, **a UI não tem fluxo de troca direta**. A troca passa por validação externa de novo (`external_validation_pending`). 🚧 PENDENTE: confirmar caminho oficial (autosserviço? backoffice? CS?).

**P: Recebi pela maquininha, mas o valor não bateu. Por que aparece menos?**

R: Diferença = taxa do meio de pagamento. Na tela de detalhe da transação (`/finance/card-transactions/:id`) tem "Valor bruto", "Taxa" e "Valor líquido a receber". A taxa varia por método (débito, crédito 1x, crédito parcelado, Pix) e por clínica. O simulador de vendas mostra essa diferença antes da venda.

**P: Quem recebeu a venda foi um dentista, e ele quer saber quanto cai pra ele.**

R: Se a clínica tem split configurado, na tela de detalhe da transação aparece o `CommissionPlaceholder` mostrando o rateio. A parte de cada split member cai na conta bancária cadastrada dele (no `PosSplitMember`).

**P: A clínica quer cancelar/estornar uma transação no cartão.**

R: Cancelamento de cartão **não tem fluxo na UI**. Cliente tem que abrir chamado com o suporte. Para Pix, existe o botão "Estornar Pix" na tela de detalhe; ele **não estorna direto**, só registra no Hubspot a intenção (dados da transação que o cliente quer estornar) e dispara um modal de sucesso. O time interno conclui o estorno depois.

**P: O paciente fala em chargeback (disputa no cartão). Onde vejo isso?**

R: A UI **não mostra status de chargeback hoje**: os status visíveis são `pending`, `processed`, `denied`, `canceled`, `undone`. 🚧 PENDENTE: confirmar como a clínica é notificada sobre chargeback e qual é o caminho atual de defesa.

**P: O saque travou em "solicitado" há horas. É normal?**

R: O saque é assíncrono (`RequestWithdrawalJob` enfileira e dispara depois). Em ambiente normal cai em poucas horas. Se demorar muito mais, vale escalar com ID da `Transaction` de saque. Há um job paralelo `RefundRejectedWithdrawalJob` que devolve saldo se o saque for rejeitado pelo banco; o suporte deve perguntar se o saldo voltou pra carteira.

**P: A clínica perguntou sobre PIN da maquininha (senha do aparelho).**

R: O dashboard não trata PIN do aparelho físico. A tela `/finance/pins` que existe no dashboard é de **pacotes de PINs de consulta de crédito** (produto BNPL, pra consultar paciente), **não tem relação com senha da maquininha**. PIN/senha do aparelho físico é gerenciado no próprio terminal (manual do fabricante). 🚧 PENDENTE: confirmar com produto qual é o procedimento oficial pra "reset de senha do aparelho" (provavelmente passa por contato com a Capim, que repassa pra fornecedor).

**P: O aparelho está sem papel/sem bateria/sem conexão.**

R: Problemas físicos do aparelho não têm tratamento no dashboard. São orientações operacionais (papel térmico padrão do modelo, carga via dock, conexão 4G ou Wi-Fi). 🚧 PENDENTE: confirmar modelo do aparelho e instruções padrão (manual oficial, contato com fabricante).

**P: O dentista vê a maquininha do consultório do colega. Por quê?**

R: O acesso é por permissão (`access-transactions-capininha`, `access-receivables-capininha`). Quem é admin enxerga tudo. Pra escopar, o admin tira essas permissões dos demais usuários, ou usa o filtro de split member dentro das abas (filtra por CPF/CNPJ).

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Estou no credenciamento e dá erro ao avançar." | Algum campo obrigatório faltando ou falha de validação do backend. | Pedir print da tela exata e do toaster de erro. Conferir qual `step` está no banco. | Se o erro é genérico/sem mensagem clara, escalar pra eng com ID da `FinanceAccreditation`. |
| "Análise está parada há mais de uma semana." | KYC parado em backoffice ou aguardando documento. | Conferir `state` e `pos_state`. Se está em `inconsistent`, pedir reenvio de documentos. | Se `analysis` parado, escalar pro time de credenciamento. |
| "Foi rejeitada e quero entender o motivo." | Campo `pos_rejection_reason` populado. | Olhar no backoffice o motivo exato. Comunicar ao cliente com sensibilidade (alguns motivos não voltam atrás, ex: CNAE secundário; outros sim, ex: documentos expirados). | Casos limítrofes ou contestação de cliente importante: escalar pra credenciamento. |
| "Cliente disse que recebeu o aparelho mas no painel ainda aparece 'aguardando'." | A clínica não clicou em "Recebi a maquininha". | Orientar a abrir Maquininha e clicar no botão de confirmação. Isso muda `PosOrder.status` pra `delivered`. | Se o botão não aparece e a `PosOrder` está em `sent`, escalar pra eng. |
| "Não consigo entrar em Transações/Recebíveis." | Falta `pos_contract_accepted_at` (modal de termos não foi aceito), ou `PosOrder.status` não está em `delivered`, ou o usuário não tem permissão. | Conferir: (1) a clínica tem `PosOrder` com status `delivered`? (2) `pos_contract_accepted_at` não é nulo? (3) o usuário tem a permissão certa ou é admin? | Se todos os três estão ok e ainda bloqueia, escalar pra eng com ID do usuário e da clínica. |
| "Não vejo o botão de antecipar." | Clínica está em `anticipation_type = automatic` (D+1 automático), ou usuário não tem `access-spot-capininha`. | Confirmar tipo de antecipação no backoffice. Se manual e a permissão está ok, escalar. Se automatic, explicar pro cliente que ele já recebe D+1 e não precisa de antecipação manual. | Bug: manual + permissão ok e o botão some. |
| "Solicitei antecipação e o dinheiro não caiu na data prometida." | `paymentDate` mostrado vem do Payfac. O depósito depende do banco. | Conferir histórico de antecipações pra ver a data exata e o valor. Se a data já passou e nada caiu, escalar com ID da antecipação. | Sempre escalar atraso de depósito real. |
| "Configurei split mas as transações antigas não recalcularam." | Comportamento esperado: split novo vale só pra novas transações. | Explicar. Se cliente acha que deve retroagir, registrar como pedido de produto. | Não escalar como bug. |
| "Quero adicionar um dentista no split e o botão abre uma página fora do dashboard." | Cadastro de split member é feito num formulário externo (URL `VITE_ADD_SPLIT_MEMBER`). | Orientar a preencher o formulário externo. Após preencher, o dentista aparece no dashboard depois de processado internamente. | Se demora muito (mais de alguns dias úteis), escalar com nome e CPF do profissional. |
| "Saque travado/saldo sumiu." | Saque em fila ou rejeitado pelo banco. | Conferir `Transaction` correspondente. Se rejeitado, o `RefundRejectedWithdrawalJob` deveria devolver pra carteira: confirmar saldo. | Se nem caiu na conta nem voltou pra carteira, escalar pra eng. |
| "Quer estornar uma cobrança no cartão." | Não há fluxo de UI pra estorno de cartão. | Abrir chamado com dados da transação (ID, data, valor, motivo). Operação interna efetiva. | Sempre escalar (não tem autosserviço). |
| "Botão 'Estornar Pix' aparece mas não estorna nada." | Comportamento atual: o botão só registra a intenção em Hubspot, não dispara estorno direto. | Explicar pro cliente que a solicitação foi registrada e o time vai concluir. Acompanhar via CS. | Se o estorno não acontece em prazo razoável, escalar. |
| "PIN/senha do aparelho não funciona." | Problema físico do aparelho. | Não tem solução pelo dashboard. Orientar pra documentação do fabricante. 🚧 PENDENTE: procedimento oficial. | Escalar pra time que cuida da relação com fornecedor da maquininha. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Toda issue de bug, ativação de permissão, mudança de plano de antecipação, problema com aparelho físico, atraso de depósito ou pedido de estorno entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Saque parcial não existe na UI.** Backend aceita qualquer valor (mínimo R$ 5), a tela trava em "saldo total".
* **Estorno de cartão não tem fluxo de autosserviço.** Cliente precisa pedir pro suporte/CS.
* **Estorno de Pix pela UI registra intenção em Hubspot, não estorna direto.** Operação humana conclui.
* **Chargeback não aparece como status na UI** (status visíveis: `pending`, `processed`, `denied`, `canceled`, `undone`).
* **Troca de conta bancária não tem fluxo direto na UI** depois do cadastro inicial. Passa por validação externa de novo.
* **Cadastro de novo split member é num formulário externo** (URL configurada via env var), não dentro do dashboard.
* **Transações antigas não recalculam split** quando o percentual muda. Vale só pra novas.
* **Quantidade de maquininha por credenciamento é fixa em 1.** Não há fluxo pra pedido de aparelho adicional.
* **Modelo do aparelho não aparece na UI.** Cliente vê só "Maquininha Capim".
* **Não há tela com código de rastreio** pra acompanhar a entrega. Ordem só mostra `pending/sent/delivered`.
* **PIN/senha do aparelho físico não tem ligação com o dashboard.** A rota `/finance/pins` é outra coisa (pacotes de consulta de crédito do BNPL).
* **Mudar plano de antecipação (manual ↔ automatic) é só via backoffice**, não há autosserviço.
* **Taxa de antecipação ("spot") e taxas por método são específicas por clínica.** O suporte precisa consultar `SellerFees` da clínica caso a caso.
* **A UI bloqueia uso enquanto `pos_contract_accepted_at` é nulo.** Modal de termos pode passar despercebido em primeiro acesso.

## > 7. 🗺️ Próximos passos [opcional]

* Alocações de pagamento (`PaymentAllocationsTable`) estão atrás da flag `FF_PAYMENT_ALLOCATIONS`. 🚧 PENDENTE: confirmar status (em rollout, GA, killed?).
* Otimização do credenciamento (`FF_ACCREDITATION_OPTIMIZATION`) está ativa em alguns clientes e pula etapas (mídias sociais, valor médio de procedimentos). 🚧 PENDENTE: confirmar se já é 100%.
* Isenção de mensalidade da maquininha (banner aparece no checkout): regra exata e condições. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: tela inicial de Maquininha em estado vazio (clínica sem credenciamento)]

[INSERIR PRINT: passo do credenciamento V2 com o stepper]

[INSERIR PRINT: tela de status do credenciamento em análise]

[INSERIR PRINT: tela de checkout do POS (dados bancários + endereço de entrega)]

[INSERIR PRINT: banner "Recebi a maquininha" no dashboard]

[INSERIR PRINT: aba Transações com totalizadores e tabela]

[INSERIR PRINT: detalhe de uma transação com valor bruto, taxa, líquido]

[INSERIR PRINT: botão "Estornar Pix" e modal de confirmação]

[INSERIR PRINT: aba Recebíveis com calendário e filtro por split member]

[INSERIR PRINT: tela de antecipação com lista de parcelas e checkboxes]

[INSERIR PRINT: drawer de antecipação aprovada com valores e data]

[INSERIR PRINT: tela de split members com a tabela de percentuais e alerta de soma]

[INSERIR PRINT: simulador de vendas com formulário e resultado]

[INSERIR PRINT: tela de saque com saldo, botão e dados bancários cadastrados]

[INSERIR PRINT: modal de confirmação de saque com valor desabilitado]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Credenciamento e aparelho**
* [ ] SLA típico de análise do credenciamento POS (de `analysis` até `approved` ou `rejected`).
* [ ] SLA de entrega do aparelho após `PosOrder` criada.
* [ ] Modelo/fornecedor do aparelho que a Capim entrega hoje.
* [ ] Manual oficial do aparelho (papel, bateria, conexão, reset, senha/PIN do terminal).
* [ ] Existe rastreio de entrega visível ao cliente (e-mail, CS)?
* [ ] Regra atual da isenção de mensalidade (banner mostra R$ 69,90 e fala em isenção condicionada).

**Antecipação e taxas**
* [ ] Onde o suporte consulta a tabela de taxas vigente de uma clínica sem ter que logar como ela.
* [ ] Como o suporte ou backoffice altera `anticipation_type` (manual ↔ automatic). Caminho oficial.
* [ ] Prazo médio do depósito da antecipação manual (a UI mostra `paymentDate` calculado, mas qual é o esperado pra hoje?).

**Conta bancária e split**
* [ ] Caminho oficial pra clínica trocar conta bancária de recebimento/saque depois de cadastrada.
* [ ] Destino real e SLA do formulário externo de cadastro de split member.

**Estorno e disputa**
* [ ] Fluxo oficial pra clínica solicitar estorno de cartão (canal, prazo, quem efetiva).
* [ ] Como clínica é notificada de chargeback. Caminho de defesa.
* [ ] SLA do "Estornar Pix" depois que o cliente clica no botão (que só registra em Hubspot hoje).

**Permissões**
* [ ] Saque tem permissão específica (separada de admin) ou só admin?
* [ ] Quando uma permissão de Maquininha (transações, recebíveis, split, spot) é ativada pra usuário não-admin: caminho?

**Operação**
* [ ] Lista de bugs conhecidos em produção hoje na Maquininha.
* [ ] SLA esperado de resposta do Time de Sustentação pra cada nível de severidade.

## > ✅ Validar com produto/eng antes de publicar

Itens deduzidos do código que vale confirmar:

* [ ] "Antecipação só aparece com `anticipation_type = manual`." Confirmado no `IndexView` (`hasAnticipationSpot = anticipationType === 'manual'`), vale validar com produto se há outros casos.
* [ ] "Quantidade fixa em 1 aparelho por credenciamento" (`POS_QUANTITY = 1`).
* [ ] "Soma do split precisa fechar 100% pra salvar" (vista no botão desabilitado quando `sumOfPercentage !== 100`).
* [ ] "Botão de Estornar Pix grava em Hubspot e não dispara estorno direto" (visto em `handleRequestPixRefund`).
* [ ] "Saque é sempre o saldo total" (input desabilitado em `WithdrawDialog`).
* [ ] "Mínimo de saque é R$ 5,00" (`MINIMUM_WITHDRAWAL_AMOUNT = 500` em centavos).
* [ ] "Quatro permissões dedicadas: transactions, receivables, commissions/split, anticipation/spot." Admin override em todas.
* [ ] "Modal de Termos de Uso bloqueia uso até aceitar" (`pos_contract_accepted_at` nulo).

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-backend`/`capim-dash-backend`, podem ser tratados como confirmados:

* `PosOrder` segue máquina de estados `pending → sent → delivered`, com `canceled` saindo apenas de `pending` (AASM em `pos_order.rb`).
* `FinanceAccreditation` mantém duas máquinas de estados paralelas: `state` (fluxo BNPL/principal) e `pos_state` (fluxo POS), com sincronização entre os dois (`synchronize_states`).
* `pos_state` pode estar em: `incomplete`, `analysis`, `approved`, `rejected`, `bank_account_incomplete`, `external_validation_pending`, `bank_account_manual_validation`, `external_validation_rejected`, `lost`.
* Motivos de rejeição catalogados em `REJECTION_REASONS` (lista completa de 24 motivos).
* `PosSplitMember` carrega banco, agência, conta, percentual, documento (CPF/CNPJ) e tipo de conta (poupança/corrente).
* `member_type` é derivado: se o documento do split member bate com o documento da `Retail`, é `'clinic'`; senão, `'member'`.
* Antecipação spot delega chamadas pra serviço externo Payfac (`AnticipatablesController` faz proxy via `CapimPayfac::BaseAdapter`).
* `RequestWithdrawalJob` enfileira o saque; `RefundRejectedWithdrawalJob` devolve o saldo se o banco rejeitar.
* Adquirência/iugu cuida do depósito externo (`Iugu::Inputs::Withdraw` em `send_withdrawal_request.rb`).
* Status visíveis na tabela de transações: `pending`, `processed`, `denied`, `canceled`, `undone` (não há `chargeback` ou `dispute` na UI hoje).
* Métodos de pagamento aceitos: crédito (à vista ou parcelado), débito, Pix (enum `PaymentMethod` em `salesSimulator/types.ts`).
* Mensalidade da maquininha exibida na UI: R$ 69,90/mês (`POS_VALUE`).
