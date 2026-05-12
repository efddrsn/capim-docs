# 📘 Guia de Suporte: Financiamento Capim

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA na versão V1 ("Financiamento" antigo). A V2 (UnifiedBnplV2) está em rollout via experimento `bnpl_unified_flow` (variação `bnpl_unified_flow`) gated por feature flag `FF_BNPL_UNIFIED_FLOW`. 🚧 PENDENTE: confirmar percentual atual de rollout e data prevista de GA da V2.

## 1. 🎯 Visão geral

O Financiamento Capim é o produto BNPL (Buy Now Pay Later) da Capim. Funciona como um "cartão de crédito da Capim" dedicado a tratamentos: a clínica oferece o financiamento ao paciente, a Capim faz a análise de crédito, paga o valor cheio do tratamento pra clínica e fica responsável por cobrar o paciente em parcelas. Para o dentista, isso resolve a dor de fechar tratamento caro com paciente que não tem o valor à vista, sem a clínica precisar virar "financeira" do paciente.

Resolve três dores típicas: paciente que desiste por falta de limite no cartão, clínica que vira credora informal e leva calote, e clínica que perde venda alta por não conseguir parcelar acima de 12x.

**Para quem é:** clínicas com **credenciamento financeiro aprovado** na Capim. Tecnicamente, o acesso ao módulo depende de:
* `dash_finance_enabled` ativo nas configurações da clínica (sem isso, a tela mostra um wrapper de bloqueio convidando a se credenciar);
* `finance_accreditation` da clínica não estar em um estado que bloqueie operação (sem conta bancária verificada, por exemplo, mostra `CreditsEmptyState`);
* clínica PJ ter contrato social anexado (modal de pendência aparece em corporativos cuja flag está aprovada, deadline configurado em `DATE_DEADLINE` interno).

**Quem dispara o quê dentro da clínica:** a permissão fina é controlada hoje pelo conjunto de configurações da clínica e pelo cadastro do credenciamento. 🚧 PENDENTE: confirmar se existe uma policy específica do tipo "quem na clínica pode iniciar/aprovar financiamento" (no código de policies do dashboard só achei `CARNE_SUMMARY`, `PATIENTS_TAB`, `FINANCIAL_CONTROL` e `FINANCIAL_CONTROL_FULL`; nenhuma diz especificamente "iniciar BNPL"). ✅ Validar com produto.

**Onde se encaixa no produto Capim:** se conecta direto com Pacientes (cadastro do paciente é base da pré-análise e da simulação), com Orçamentos (banner "BNPL" dentro do orçamento abre direto a pré-análise já preenchida com `budget_id` e `patient_id`), com Maquininha/POS (existe um produto separado `pos_orders` que oferece BNPL como modalidade na maquininha, fora do escopo deste guia) e com Cobrança/Boleto da Capim com o paciente (a clínica acompanha o contrato, mas a operação de cobrança é interna da Capim).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Clínica credenciada no financeiro (`finance_accreditation` em estado ok, conta bancária verificada). Sem isso, o módulo aparece com tela de bloqueio.
* Configurações `dash_finance_enabled` e (na V2) experimento `bnpl_unified_flow` ativo se a clínica é elegível à V2.
* Em clínicas PJ corporativas, contrato social anexado é exigido a partir de um deadline interno; a UI mostra modal de pendência em Home, Proposta de Parcelamento e Controle Financeiro.

**Onde acessar:**

* Menu lateral → Financiamento (Credits).
* URL típica V1: `/#/finance/credits` (com tabs `pending`, `finished`, `contracts`, `analytics`, `delayed-contracts`).
* URL típica V2: `/#/finance/credits/v2` (com tabs `payment-cash` e `payment-books`; redireciona para `PendingCreditsV2`).
* A escolha V1 vs V2 acontece em `beforeEnter` da rota: se a clínica está na variação do experimento `bnpl_unified_flow` e a flag `FF_BNPL_UNIFIED_FLOW` está ligada, vai pra V2; senão, V1. Quem entra em uma rota da versão errada é redirecionado automaticamente.

**Fluxo típico V1 (Pré-análise → Análise → Contrato):**

1. Dentista clica em "Nova Solicitação" na home de Financiamento (botão `new-pre-analysis-start`). Vai pra tela de **Pré-análise** (`/finance/credits/patients/new`).
2. Tela de pré-análise: dentista informa se o paciente é o responsável financeiro ou não, busca o paciente (ou cria novo), preenche CPF, data de nascimento, CEP, ocupação, tipo de procedimento (`dentistry`, `aesthetic`, `diagnosys_exams`, `ophthalmology`, `optical_shop`, `dermatology`, `gynecology_obstetrics`, `vaccine`, `other`), valor total do tratamento. Em clínicas SaaS, há checkbox obrigatório de autorização para consulta SCR.
3. Backend cria um `PreAnalysis` em estado `awaiting_analysis`. Possíveis transições: `eligible`, `eligible_with_counter_proposal`, `rejected`, `expired` (expira em **15 dias**).
4. Se aprovado, gera uma **Request** (estado inicial `awaiting_analysis`, depois `analysis`, `approved`, `documents_pending`/`documents_sent`/`documents_approved`, `awaiting_lvs_flow`/`lvs_completed`, `awaiting_release`, `finished`; estados de falha: `rejected`, `expired`, `canceled`, `replaced_by_counter_proposal`, `error`).
5. Aprovado, o paciente recebe link e assina contrato. A `Proposal` correspondente entra em `contract_sign`. A clínica aparece com botão "Solicitar pagamento" no card do contrato.
6. Clínica clica em "Solicitar pagamento" (`postRelease`). A proposta passa por `release_blocked` (em andamento) → `release_approved` (endosso aprovado) → `released` → `retailer_paid` (lojista pago). A `Request` casa fica `finished`.

**Fluxo típico V2 (UnifiedBnplV2, fluxo de simulação primeiro):**

1. Dentista clica em "Gerar Proposta" no banner da home de Financiamento V2. Vai pra **Simulação de Crédito** (`SimulationCreditV2`, rota `/finance/credits/v2/simulation`).
2. Stepper de 2 passos:
   * **Passo 1 (Valor do tratamento):** informa o valor.
   * **Passo 2 (Dados do paciente):** busca paciente existente ou clica em "Cadastrar novo paciente", preenche CPF, profissão (oculto se menor de idade), checkbox "Paciente é menor de idade" (`underage`), telefone, CEP, autorização de consulta de dados (`dataAccessAuthorization`), e marca se o paciente está presente na clínica agora (`patientLocation`: `yes`/`no`).
3. Backend cria um `CreditLead` (`requested_amount` obrigatório, estado inicial `pending`). A V2 manda também uma simulação ao motor da Capim. Estados do lead: `pending`, `rejected`, `appealable`, `active`, `financed_by_retail`, `expired` (após 15 dias), `error`.
4. Conforme o resultado, o dentista é redirecionado para uma das telas via `CREDIT_LEAD_REDIRECT_MAP`:
   * `Propostas` → `OfferChoicesViewV2` (mostra duas ofertas lado a lado: parcelado e à vista, com `UserRiskComponent`).
   * `Em analise` → `CreditRequestViewV2`.
   * `Ligacao` → `CreditRequestViewV2` (a Capim precisa ligar pro paciente antes de aprovar).
   * `Plano de tratamento` → `TreatmentPlanOutcomeV2`.
   * `Parcelado` → `PaymentBooksV2` (trata-se de Carnê, fluxo de Boleto da Casa, fora do escopo deste guia).
   * `Algo deu errado` → `SimulationFailedV2`.
   * Variações sem conclusão: `notConcludedAdultRelative` (paciente menor exige responsável adulto, vai pra `RelativeSimulationV2`); `notCompletedPreApproved` (vai pra `PreApprovedRequestV2`); `pendingContact`, `pendingTreatmentPlan`.
5. Quando o paciente é elegível, abre o **Pedido pré-aprovado** (stepper de 3 etapas em `RequestFormContainer.vue`: dados pessoais, plano de tratamento, revisão). Na revisão, dentista preenche telefone da clínica e confirma. A `ModalCreateCreditRequest` é o último passo antes de criar a `Request` no backend.
6. Após criada a Request, o paciente recebe link de assinatura. Em V2 a clínica vê o contrato na aba `payment-cash` em `SummaryOfSignedContracts`, com as mesmas ações (solicitar pagamento, abrir contrato, abrir boletos, cancelar). Cancelamento valida estado, ver tabela abaixo.

**Status do contrato (Proposal, o que aparece na tela da clínica):**

| Estado backend | Tag UI (V2) | O que significa |
|---|---|---|
| `analysis` | neutral, "Em análise" | Capim ainda está validando o contrato. |
| `sent_to_moneyplus` | info | Já foi enviado pra securitizadora (Moneyplus). |
| `contract_sign` | success, "Contrato assinado" | Paciente assinou. Aqui a clínica pode "Solicitar pagamento" ou cancelar. |
| `release_blocked` | warning, "Em andamento" | Solicitação de pagamento em andamento, em análise interna. |
| `release_approved` | info, "Endosso aprovado" | Endosso aprovado, fila pra pagar lojista. |
| `released` | info | Pagamento liberado pro lojista (proposta passa por aqui antes de virar `retailer_paid`). |
| `retailer_paid` | success, "Lojista pago" | Clínica recebeu o valor cheio. |
| `payment_failed` | error | Falha no pagamento ao lojista, intervenção interna. |
| `canceled` | neutral/error | Contrato cancelado (pela clínica ou pela Capim). |

**Status do CreditLead (V2, tabela de Pendentes):**

| Status (label PT) | O que significa |
|---|---|
| Propostas | Lead com 2 ofertas (parcelado/à vista) prontas pro dentista mostrar ao paciente. |
| Em analise | Motor ainda analisando. |
| Pendencia | Algo no formulário travou ou falta dado. |
| Nao concluido | Fluxo iniciado mas não foi até o fim. |
| Algo deu errado | Erro do motor. |
| Parcelado | Já virou Carnê (Boleto da Casa), não é mais financiamento Capim. |
| Contrato a assinar | Aguardando paciente assinar. |
| Plano de tratamento | Plano de tratamento em análise/feedback. |
| Contrato assinado | Paciente assinou. |
| Finalizado | Fluxo concluído. |
| Cancelado | Lead/Request cancelado. |
| Ligacao | Capim precisa ligar pro paciente antes de aprovar. |

**Status da Pré-análise (V1):**

* `awaiting_analysis` (inicial), `eligible`, `eligible_with_counter_proposal` (Capim aprova com valor diferente, contraproposta), `rejected`, `expired` (15 dias).

**O que acontece quando aprovado (clínica recebe quando?):**

* A clínica **não recebe automaticamente no momento da aprovação do contrato**. O fluxo é: paciente assina (`contract_sign`) → clínica precisa clicar em "Solicitar pagamento" no card do contrato (`postRelease`) → contrato passa por `release_blocked`/`release_approved`/`released` → `retailer_paid`. O valor cai na conta cadastrada no credenciamento da clínica. 🚧 PENDENTE: confirmar prazo típico entre "Solicitar pagamento" e crédito efetivo na conta da clínica.

**⚠️ Atenção:**

* **Pré-análise e CreditLead expiram em 15 dias** (scope `expirable` em `PreAnalysis` e `CreditLead`). Lead/análise antiga não pode ser "ressuscitada", precisa começar do zero.
* **Endereço/CPF/CEP da pré-análise são criptografados** em campo deterministic do banco (atributo `encrypts :cpf, :zipcode`). Suporte não consegue buscar diretamente no banco por CPF "cru", precisa usar a busca da interface.
* **Cancelamento de contrato pela UI só está disponível em estados específicos:** `contract_sign`, `release_blocked`, `release_approved`. Em `analysis`, `released`, `retailer_paid` ou `canceled`, o botão "Cancelar contrato" não aparece (ver `CONTRACT_ACTIONS_MAP_BY_STATE`).
* **Existe um caminho "Contraproposta"**: se o paciente não é elegível pro valor pedido, a Capim pode oferecer um valor menor. O estado da pré-análise vira `eligible_with_counter_proposal` e a Request original vira `replaced_by_counter_proposal`. A clínica decide aceitar ou não.
* **Motivos de rejeição** do BNPL são enumerados no backend (`Request::BNPL_REJECTION_REASONS`): `bacen`, `committed_income`, `geolocation`, `high_amount_for_risk_with_counter_proposal`, `no_contact`, `occupation`, `out_of_policy`, `patient_negativation`, `registration_not_found`, `registry_inconsistency`, `suspected_fraud`, `unrelated_person`. A clínica vê o status final, mas geralmente não vê o motivo bruto na UI.
* **Motivos de cancelamento de Request** (quando uma Request é cancelada): `clinic_fraud`, `clinic_gave_up`, `other`, `user_and_clinic_gave_up`, `user_fraud`, `user_gave_up`. ✅ Validar onde no UI a clínica escolhe esse motivo.
* **Atrasos do paciente (delayed contracts)** aparecem hoje como **iframe Metabase** (dashboard `4` em V2 e dashboard `2` em Analytics V1). Ou seja, a clínica vê um relatório embutido, não uma tela nativa.

## > 3. 💼 Casos de uso esperados

* **Caso 1, paciente com tratamento de R$ 8 mil sem cartão:** dentista pede "Nova Solicitação", preenche pré-análise com CPF do paciente. Em V2, vai pelo fluxo de simulação. Sai aprovado em parcelado, mostra as ofertas ao paciente, paciente escolhe, recebe link, assina. Dentista clica em "Solicitar pagamento" e Capim libera o valor cheio pra conta da clínica.
* **Caso 2, paciente menor de idade:** ao marcar `underage` na simulação, profissão e telefone do paciente ficam ocultos/desabilitados. Fluxo é redirecionado pra `RelativeSimulationV2`, onde o dentista preenche os dados do responsável adulto (pai, mãe, etc, conforme `RELATIONSHIP_TYPES`).
* **Caso 3, financiamento direto de um orçamento:** dentro de um orçamento do paciente, aparece o banner "BNPL" (`BnplBanner`). Ao clicar, abre nova aba em `PreAnalysisNew` já com `patient_id` e `budget_id` na query, e a pré-análise vem pré-preenchida com `total_amount` do orçamento, CPF, CEP, data de nascimento e tipo de procedimento `dentistry`.
* **Caso 4, contraproposta:** paciente pediu R$ 10 mil, Capim aprova R$ 6 mil. Pré-análise fica `eligible_with_counter_proposal`. O dentista mostra a oferta menor ao paciente, paciente decide aceitar (vira nova Request), ou recusar (Request fica `replaced_by_counter_proposal`).
* **Caso 5, paciente em "Ligacao":** o motor pediu validação por contato. O lead aparece com status "Ligacao" e o redirect aponta pra `CreditRequestViewV2`. A clínica espera a Capim ligar pro paciente. Não há ação manual pra clínica nesse estado.
* **Caso 6, simulação preliminar pré-paciente (PreliminarySimulation):** se o cadastro do paciente já tem `approved_preliminary_simulation_amount`, abrir a rota `/finance/patients/:patientId/preliminary-simulation` mostra um cartão com o valor máximo pré-aprovado e CTA pra começar a simulação formal. Vem de um sinal interno (`preliminary_simulation_finished` é um evento de notificação do dashboard). ✅ Validar com produto quando esse fluxo é mostrado pro dentista.

## > 4. ❓ FAQ

**P: A clínica disse que viu uma tela diferente da última vez no Financiamento. O que aconteceu?**

R: Provavelmente entrou na V2. A V2 está gated pelo experimento `bnpl_unified_flow` (`Clinic` como `experimentable_type`) e pela flag `FF_BNPL_UNIFIED_FLOW`. Se a clínica caiu na variação e a flag está ligada, vai pra V2 (rotas `/finance/credits/v2/*`); senão, V1 (`/finance/credits/*`). A entrada nas duas tem `beforeEnter` que redireciona, então não dá pra abrir manualmente a V1 numa clínica de V2. 🚧 PENDENTE: como o suporte confere/altera a variação de uma clínica.

**P: Quando a clínica recebe o valor do tratamento?**

R: **Não é automático no momento da aprovação ou da assinatura do contrato.** Quando o contrato fica em `contract_sign` (paciente assinou), o card do contrato passa a mostrar a ação "Solicitar pagamento". Só depois que a clínica clica e o endosso é aprovado é que a Capim libera o pagamento. O valor cai na conta bancária cadastrada no credenciamento. 🚧 PENDENTE: SLA em dias úteis entre "Solicitar pagamento" e crédito efetivo.

**P: A clínica pediu pra cancelar um contrato e não achou o botão. Por quê?**

R: Cancelamento só aparece em alguns estados. Em V2, conforme `CONTRACT_ACTIONS_MAP_BY_STATE`, a ação "Cancelar contrato" está disponível em: `contract_sign`, `release_blocked`, `release_approved`. Em `analysis`, `released`, `retailer_paid`, `payment_failed`, `sent_to_moneyplus` ou `canceled`, a ação não aparece. Se o contrato já está em `released`/`retailer_paid`, o dinheiro já foi liberado e cancelamento envolve estorno, que não é via interface, é via **Time de Sustentação**.

**P: Aparece "Em analise" há vários dias e não sai. O que fazer?**

R: O CreditLead tem expiração de 15 dias (scope `expirable` no model). Se passou disso e ainda está sem desfecho, é caso de escalar pro **Time de Sustentação** com o ID do CreditLead e o CPF do paciente. Em geral, "Em analise" prolongado significa que o motor de risco mandou pra fila interna de avaliação humana (queues `new_clinics`, `high_risk`, `low_risk_auto_approval`, `low_risk`, `alert_retails`, `skycam`, `counter_proposal_on_pre_analysis`).

**P: O paciente é menor de idade. Como faz?**

R: Na simulação V2, marcar o checkbox "Paciente é menor de idade" (`underage`). O sistema oculta profissão e telefone do paciente e direciona o fluxo pra `RelativeSimulationV2`, onde o dentista cadastra o responsável adulto (pai, mãe, avô/avó, irmão, cônjuge, etc, conforme `RELATIONSHIP_TYPES`). Quem assume o contrato é o responsável, não o menor.

**P: A clínica diz que o paciente recebeu uma "contraproposta" e não entendeu. O que é?**

R: O motor da Capim avaliou e aprovou, mas com valor menor que o pedido. A pré-análise (V1) fica em `eligible_with_counter_proposal`, e a Request original entra em `replaced_by_counter_proposal`. A clínica decide com o paciente se aceita o valor menor (continua o fluxo) ou desiste.

**P: A clínica não consegue acessar o módulo, mostra tela de bloqueio.**

R: Provavelmente `dash_finance_enabled` está `false` nas configurações da clínica (sem credenciamento financeiro). A tela mostra `CreditsBlockedWrapper` com botão "Quero me cadastrar" que dispara `flexibleCreateOrUpdate` no `FinanceAccreditationsStore` e leva pra `FinanceAccreditationV2`. Se já está cadastrada mas a conta bancária ainda não foi verificada (`SHOWING_BANK_ACCOUNT_STATUS`), mostra `CreditsEmptyState`.

**P: A pré-análise expirou. Posso só "reativar"?**

R: Não. `PreAnalysis` no estado `expired` não tem transição de volta. O caminho prático é criar uma pré-análise nova com os mesmos dados. Se a clínica reclama que expirou rápido demais, o prazo padrão é **15 dias** (scope `expirable: created_at: ..15.days.ago.beginning_of_day`).

**P: Como o paciente assina o contrato? O dentista precisa entregar alguma coisa?**

R: O paciente recebe o link de assinatura por canal próprio da Capim (geralmente WhatsApp/SMS/e-mail). 🚧 PENDENTE: canal exato e responsabilidade do dentista durante a assinatura (deixar paciente na clínica até assinar? entregar link impresso?).

**P: O dentista vê a inadimplência do paciente?**

R: Em parte. Existe a aba **Em atraso** ("Delayed contracts"). Tanto em V1 (`/finance/credits/delayed-contracts`, dashboard Metabase `2`) quanto em V2 (`payment-cash/delayed-contracts`, dashboard `4`), o conteúdo é um iframe de Metabase, ou seja, relatório embutido. A clínica acompanha o status, mas **a cobrança em si é responsabilidade da Capim** (a clínica já recebeu).

**P: A clínica perguntou se pode oferecer BNPL na maquininha.**

R: Sim, existe um produto separado **POS/Maquininha** (`pos_orders`) que tem BNPL como opção de pagamento. A clínica pede a maquininha em "Maquininha" no menu. O fluxo de pedido, credenciamento e operação da maquininha é assunto de outro guia. ✅ Validar guia próprio para Maquininha.

**P: O contrato social da clínica está pendente, modal não para de aparecer. Por quê?**

R: A V2 do BNPL adicionou uma trava: clínicas **corporativas** (que têm CNPJ, `cnpj?.length > 0`) na variação `bnpl_unified_flow` precisam ter `social_contract_attached` confirmado em `SocialContractStore`. Enquanto não estiver, o modal `PendingSocialContract` aparece na home do Financiamento, na Proposta de Parcelamento e em Controle Financeiro, com contagem regressiva pra deadline interno (`DATE_DEADLINE`). A clínica anexa o documento pela própria modal. 🚧 PENDENTE: onde no menu fica o ponto de upload se a clínica fecha o modal e quer voltar depois.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo entrar no Financiamento, dá tela de bloqueio." | `dash_finance_enabled` está `false` para a clínica ou conta bancária não foi verificada. | Confirmar com o cliente se já existe credenciamento; se sim, ver estado do `finance_accreditation` (precisa não estar em `SHOWING_BANK_ACCOUNT_STATUS`). | Escalar pro **Time de Sustentação** com ID da clínica para confirmar o estado do credenciamento e do `kyc_verification_status`. |
| "Mandei uma pré-análise há 20 dias e sumiu." | Expiração automática de 15 dias (`PreAnalysis.expirable`). | Explicar que expira em 15 dias e orientar a refazer com os dados do paciente. | Escalar se a clínica precisa do histórico bruto e ID da PreAnalysis original. |
| "Paciente assinou contrato mas não recebi o valor." | A clínica ainda não clicou em "Solicitar pagamento" no card do contrato (`postRelease`), ou o contrato passou por `release_blocked`/`release_approved` e ainda não virou `retailer_paid`. | Conferir estado da Proposal no card (Em andamento, Endosso aprovado, Lojista pago). Orientar a clicar em "Solicitar pagamento" se estiver em `contract_sign`. | Se já está em `release_approved`/`released` há vários dias úteis e ainda não virou `retailer_paid`, escalar pro **Time de Sustentação** com o ID do contrato. |
| "Não consigo cancelar o contrato, o botão sumiu." | Estado do contrato não permite cancelamento pela UI (ver `CONTRACT_ACTIONS_MAP_BY_STATE`). Em `analysis`, `released`, `retailer_paid`, `payment_failed`, `sent_to_moneyplus` ou `canceled`, o botão não aparece. | Pedir print do card do contrato (vai mostrar o tag com o estado). Explicar que cancelamento depende do estado e que estorno só via Sustentação. | Escalar pra **Time de Sustentação** com ID do contrato (`request_id`) e motivo do pedido de cancelamento. |
| "O paciente foi rejeitado e eu não entendo por quê." | Motor de risco interno. Motivos são enumerados (ver `BNPL_REJECTION_REASONS`), mas não são todos expostos na UI da clínica. | Confirmar que o lead/request está em `rejected`. Mostrar pro dentista que ele pode tentar simular um responsável financeiro diferente (parente) ou contraproposta com valor menor. | Escalar pra **Time de Sustentação** se a clínica precisa do motivo bruto pra comunicar com o paciente; respeitar política de privacidade. |
| "O paciente é menor de idade, não consigo finalizar a simulação." | Faltou marcar `underage` no formulário, ou o fluxo de `RelativeSimulationV2` não foi concluído. | Orientar a marcar "Paciente é menor de idade" no passo 2 da simulação V2. O sistema redireciona pra cadastro de responsável adulto. | Escalar se mesmo com o responsável adulto cadastrado o lead vai pra `error`. |
| "A V2 está com bug X." | Bug em rotas `/finance/credits/v2/*`, gated pelo experimento. | Coletar print, vídeo, ID da clínica, navegador. Como rollback temporário: 🚧 PENDENTE confirmar se dá pra desligar o experimento pra clínica específica e cair em V1. | Sempre escalar bugs da V2 pra eng/Sustentação. V2 está em rollout. |
| "Aparece um modal sobre contrato social que não some." | Clínica corporativa (CNPJ) na variação `bnpl_unified_flow` sem `social_contract_attached`. | Orientar a anexar o contrato social pela própria modal. Explicar que o modal aparece em Home, Proposta de Parcelamento e Controle Financeiro. | Escalar se a clínica diz que já anexou e o modal volta. |
| "Estou na aba Em atraso e a tabela está vazia/estranha." | A aba é um iframe Metabase (dashboards `2` em V1 Analytics, `4` em V2 Delayed). Pode ter falha de geração de token ou Metabase fora do ar. | Pedir pra recarregar a página. Verificar se o iframe está renderizando algo (Network → 200 do `/embed/dashboard/...`). | Escalar pra eng/Sustentação se o iframe não carrega em nenhuma clínica. |

**Para quem escalar:** **Time de Sustentação** (canal interno Capim). Toda issue de bug de UI, valor não creditado, cancelamento que precisa de estorno, lead travado em análise por mais de 15 dias, ou modal de contrato social que volta após upload, entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Crédito não cai automático na conta da clínica.** Mesmo com o paciente já tendo assinado o contrato, o pagamento ao lojista exige clique manual em "Solicitar pagamento" e passa por uma fila interna até `retailer_paid`.
* **Pré-análise e CreditLead expiram em 15 dias** sem opção de "reativar" via interface. Tem que recriar.
* **Cancelamento de contrato é gated por estado.** Em `released`/`retailer_paid`/`payment_failed` etc, não existe botão e qualquer estorno passa por Sustentação.
* **A clínica não vê o motivo cru de rejeição.** Os motivos existem como enum no backend (`BNPL_REJECTION_REASONS`), mas a UI não expõe todos.
* **Atrasos do paciente são vistos via Metabase embutido**, não com tela nativa. Se o Metabase cai, a aba "Em atraso" fica sem conteúdo.
* **CPF e CEP de PreAnalysis são criptografados** (deterministic) no banco. Buscas diretas no banco por CPF cru não funcionam pelo suporte.
* **Convivência V1 e V2.** Mesmo cliente pode ver V1 em uma sessão e V2 em outra se o experimento mudar. O redirecionamento é automático nas rotas raiz, mas links profundos podem cair em rota errada e ser redirecionados.
* **Clínicas PJ corporativas têm trava de contrato social** com deadline fixo no código (`DATE_DEADLINE`). Depois do deadline, o modal endurece (lógica diferente em `isDeadlineWeek`/`isDeadlinePassed`).
* **A política de quem na clínica pode iniciar/aprovar financiamento não é explícita** nas policies do dashboard hoje (não há `BNPL_NEW` ou similar). Quem entra no menu Financiamento entra com os mesmos direitos. ✅ Validar com produto se isso é intencional.

## > 7. 🗺️ Próximos passos [opcional]

* GA da V2 (UnifiedBnplV2): rollout expandindo o experimento `bnpl_unified_flow` pra mais clínicas. 🚧 PENDENTE: data prevista de GA e descomissionamento da V1.
* Reforma do Carnê/Boleto da Casa (`payment_book_overhaul` é um experimento separado): a aba "Parcelado" na V2 já abre `PaymentBooksV2`, parte da convergência com o produto Carnê. Guia próprio.
* Evolução do fluxo de contraproposta direto na interface da clínica. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: home V1 do Financiamento com tabs "Pendentes", "Finalizados", "Contratos", "Análises", "Em atraso" e botão "Nova Solicitação"]

[INSERIR PRINT: home V2 do Financiamento com BannerCTA "Gerar proposta" e tab bar "À vista" / "Parcelado"]

[INSERIR PRINT: tela de Pré-análise V1 com radio "Paciente é o responsável financeiro", busca de paciente, CPF, CEP, ocupação, tipo de procedimento, valor]

[INSERIR PRINT: tela de Simulação V2 passo 1 (valor do tratamento)]

[INSERIR PRINT: tela de Simulação V2 passo 2 (dados do paciente, checkbox menor de idade, autorização de dados, localização do paciente)]

[INSERIR PRINT: OfferChoicesViewV2 com as duas ofertas lado a lado e `UserRiskComponent`]

[INSERIR PRINT: stepper de Pedido pré-aprovado (3 passos: dados pessoais, plano de tratamento, revisão)]

[INSERIR PRINT: card de contrato em estado `contract_sign` com ações "Solicitar pagamento", "Abrir contrato", "Abrir boletos", "Cancelar contrato"]

[INSERIR PRINT: modal `PendingSocialContract` na home com contagem regressiva pro deadline]

[INSERIR PRINT: banner "BNPL" dentro de um orçamento (`BnplBanner`)]

[INSERIR PRINT: aba "Em atraso" com iframe Metabase]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Rollout e elegibilidade**
* [ ] Percentual atual de clínicas na variação `bnpl_unified_flow` e data prevista de GA da V2.
* [ ] Como o suporte consulta/troca a variação do experimento `bnpl_unified_flow` pra uma clínica específica.
* [ ] Fonte oficial pra suporte conferir se uma clínica tem `dash_finance_enabled`, `saas_enabled`, `social_contract_attached`.
* [ ] Existe ou não política específica (tipo `BNPL_NEW`, `BNPL_APPROVE`) controlando quem dentro da clínica pode iniciar/aprovar financiamento? Hoje só achei policies de Carnê, Pacientes e Controle Financeiro.

**Pagamento e operação**
* [ ] SLA típico (dias úteis) entre "Solicitar pagamento" e crédito efetivo na conta da clínica.
* [ ] Em que momento exato a clínica vê o motivo de rejeição (algum motivo é exposto na UI?). Lista de `BNPL_REJECTION_REASONS` está no backend, mas não confirmei como/se aparece pro dentista.
* [ ] Quem assume a comunicação com o paciente após aprovação? Capim manda link de assinatura por qual canal e em que prazo? A clínica precisa fazer alguma ação pro paciente assinar?

**Cobrança e atraso**
* [ ] A clínica recebe alguma notificação quando um paciente fica em atraso, ou só vê via aba "Em atraso" (Metabase)?
* [ ] Existe alguma renegociação que o dentista pode iniciar pela UI da clínica, ou é 100% interno? O backend tem `Renegotiation` como `installmentable_type`, mas não achei UI da clínica pra isso.

**Contrato social pendente (V2 corporativas)**
* [ ] Caminho do menu pra anexar o contrato social fora do modal `PendingSocialContract`.
* [ ] O que acontece exatamente quando o deadline (`DATE_DEADLINE`) passa: bloqueia simulação? Só piora o tom do modal?

**Modulações de fluxo**
* [ ] Diferença prática entre o estado `pendingContact` (redirect `CreditRequestViewV2`) e o status `Ligacao` (também redirect `CreditRequestViewV2`).
* [ ] Quando exatamente a tela `PreliminarySimulation` (`approved_preliminary_simulation_amount`) é exibida pro dentista? Veio de qual fluxo originalmente?
* [ ] Caminho de cancelamento de Request com `cancellation_reason`: onde a clínica escolhe o motivo (`clinic_gave_up`, `user_gave_up`, etc) na UI?

**Escalação**
* [ ] SLA esperado de resposta no **Time de Sustentação** pra contratos travados em `release_blocked`/`release_approved`, pra pedidos de estorno, e pra leads em "Em analise" prolongado.

## > ✅ Validar com produto/eng antes de publicar

Itens inferidos do código que precisam de confirmação:

* [ ] "Cancelamento de contrato só está disponível em `contract_sign`, `release_blocked`, `release_approved`": tirado de `CONTRACT_ACTIONS_MAP_BY_STATE` em `unifiedBnplV2/constants/contracts.ts`. Vale confirmar se isso é regra de produto ou só limitação atual da UI V2.
* [ ] "Em V1 e V2 a clínica precisa clicar manualmente em 'Solicitar pagamento' pra disparar o release": tirado de `postRelease` em `ContractsStore` e `CONTRACT_ACTIONS_MAP_BY_STATE`. Não há, no código, automação que dispare `release` sozinho a partir de `contract_sign`.
* [ ] "PreAnalysis expira em 15 dias e não tem rota de volta": tirado do scope `expirable` e da máquina de estados; a máquina não tem evento de saída de `expired`.
* [ ] "Aba 'Em atraso' é um relatório Metabase embutido": tirado de `ShowView.vue` da rota delayed-contracts (V1 e V2), que usa `tokenGenerator({ dashboard: 2 })` e `({ dashboard: 4 })` e renderiza iframe. Vale confirmar se está previsto ter tela nativa.
* [ ] "Modal de contrato social só dispara para clínicas com CNPJ na variação do experimento": tirado de `usePendingSocialContract.ts` (`isCorporateClinic = !!clinic?.attributes?.cnpj?.length` + check de experimento).

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-backend` e `capim-dash-backend`, podem ser tratados como confirmados:

* CreditLead estados: `pending` (inicial), `rejected`, `appealable`, `active`, `financed_by_retail`, `expired`, `error`. Expira após 15 dias.
* PreAnalysis estados: `awaiting_analysis` (inicial), `eligible`, `eligible_with_counter_proposal`, `rejected`, `expired`. Expira após 15 dias. Campos `cpf` e `zipcode` são encriptados deterministic.
* Request (contrato) estados: `awaiting_analysis`, `analysis`, `approved`, `documents_pending`, `documents_sent`, `documents_approved`, `awaiting_lvs_flow`, `lvs_completed`, `awaiting_release`, `finished`, `rejected`, `financed_by_retail`, `expired`, `replaced_by_counter_proposal`, `canceled`, `error`.
* Proposal (a representação do contrato no front) estados: `analysis`, `sent_to_moneyplus`, `contract_sign`, `release_blocked`, `release_approved`, `released`, `retailer_paid`, `payment_failed`, `canceled`. O lojista (clínica) só recebe efetivamente quando passa para `retailer_paid`.
* Motivos de rejeição BNPL enumerados: `bacen`, `committed_income`, `geolocation`, `high_amount_for_risk_with_counter_proposal`, `no_contact`, `occupation`, `out_of_policy`, `patient_negativation`, `registration_not_found`, `registry_inconsistency`, `suspected_fraud`, `unrelated_person`.
* Tipos de procedimento aceitos: `dentistry`, `aesthetic`, `diagnosys_exams`, `ophthalmology`, `optical_shop`, `dermatology`, `gynecology_obstetrics`, `vaccine`, `other`.
* Tipos de relação no fluxo de responsável adulto (`RelativeSimulation`): `parent`, `sibling`, `children`, `spouse`, `grandparent`, `grandchildren`, `other`, `self`.
* Experimento que gate V1 vs V2: `bnpl_unified_flow` em `Clinic` (`control`/`bnpl_unified_flow`), combinado com flag `FF_BNPL_UNIFIED_FLOW`.
* Roteamento V1 vs V2 é feito por `beforeEnter` nas duas rotas raiz, que redirecionam pra versão correta conforme a clínica.
* Aba "Em atraso" e "Análises" da V1 e a aba "Em atraso" da V2 são iframes Metabase (dashboards `2` e `4`).
* Banner BNPL dentro de um orçamento abre `PreAnalysisNew` em nova aba com `patient_id` e `budget_id` na query.
* Polling de leads/requests acontece com intervalo `POLLING_INTERVAL` de 30s na simulação V1 (`CreditLeadView`) e refresh de 60s na tabela de contratos V2.
