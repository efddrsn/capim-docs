# 💸 Guia de Suporte: Capix

> Material para o time de suporte da Capim. Atualizado em 13/11/2026.
> Status da feature: disponível por whitelist de clínicas (variável de ambiente `VITE_FF_MICROCREDITS_CLINICS`), atrás da flag `VITE_FF_MICROCREDITS_ENABLED`. 🚧 PENDENTE: confirmar percentual atual de clínicas habilitadas e se há plano de GA.

> ⚠️ **Alerta de descoberta para o time de Produto/Suporte:** o briefing original deste guia descrevia Capix como **empréstimo da Capim para a clínica** (capital de giro, antecipação, equipamento). O que está no código hoje é o oposto: Capix é uma forma de **pagamento parcelado via Pix oferecida ao paciente**, em que a **clínica recebe à vista** (com deságio) e o paciente paga em parcelas à Capim. Os fluxos descritos abaixo refletem o produto que existe no código. 🚧 PENDENTE crítico: confirmar com produto se existe (ou está em construção) um produto separado de empréstimo para a clínica, e se a marca "Capix" também cobre esse cenário.

> ⚖️ **Regra de linguagem (questão legal):** Capix **não é crédito**, nem para a clínica nem para o paciente. Pela lei, o produto não se encaixa nessa categoria. No atendimento, **nunca** chamar o Capix de crédito, microcrédito, empréstimo ou financiamento. Falar sempre em "parcelamento via Pix". Nomes técnicos que aparecem no sistema (como `FF_MICROCREDITS` ou `CreditApplication`) são só nomes internos e não devem ser repetidos pro cliente. (Denis Maeda, #32)

## 1. 🎯 Visão geral

Capix é a forma de pagamento "parcele via Pix" que a clínica oferece pro paciente no fechamento do orçamento. Na prática: o paciente paga **uma entrada via Pix** (o valor da entrada **não é fixo**, varia de proposta pra proposta) e o **restante em parcelas mensais via Pix**, e **a Capim antecipa para a clínica** o líquido em até 1 dia útil após a entrada do paciente. O slogan que aparece no banner do produto resume: **"Você recebe à vista, a Capim cuida do resto."**

Resolve a dor clássica de orçamento perdido por falta de meio de pagamento: o paciente não tem limite no cartão, não quer fazer cheque, mas consegue Pix. A clínica não vira "banco" do paciente nem precisa esperar várias parcelas pra receber, e ainda assim oferece parcelamento.

**Para quem é:** clínicas presentes na whitelist de Capix (lista de IDs configurada por variável de ambiente). Se a clínica não está na whitelist, o item "Capix" não aparece no menu lateral e a rota `/finance/microcredits` cai em 404. ✅ Validar com produto: critério de entrada de uma clínica na whitelist (volume, plano, região, fase de rollout).

**Quem na clínica usa:** qualquer usuário autenticado da clínica habilitada acessa pelo menu lateral. 🚧 PENDENTE: confirmar se há restrição de papel (admin vs recepcionista vs dentista) para abrir uma simulação Capix.

**Onde se encaixa no produto Capim:**

* **Controle Financeiro / Finance:** o item "Capix" vive na seção financeira do menu lateral.
* **Pacientes:** a simulação usa CPF e telefone do paciente; um paciente que já tem contrato Capix ativo é bloqueado pra nova simulação (ver FAQ).
* **Agenda / Orçamentos:** existia um experimento de "Simular Capix" disparado a partir da tela de agendamento e do perfil do paciente (banner "CreditStimulusBanner"). **Esse experimento foi desligado** (Denis Maeda, #31). Se a clínica perguntar pelo banner, ele não aparece mais.
* **Maquininha (Pontos de venda) e Carnês:** **não há integração de cobrança** no código entre Capix e maquininha/carnê. O recebimento das parcelas do paciente é feito por Pix administrado pela Capim, fora da maquininha da clínica. ✅ Validar com produto se isso muda no roadmap.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* A clínica precisa estar na **whitelist Capix** (`FF_MICROCREDITS_CLINICS`).
* A flag global `FF_MICROCREDITS_ENABLED` precisa estar ligada no ambiente.
* A simulação só pode ser iniciada **dentro do horário de funcionamento Capix**: segunda a sexta das **08h às 20h** e sábado das **08h às 14h**. Domingo, fora desse horário ou em qualquer outro intervalo, a tela mostra o aviso "No momento, a opção de parcelamento via Pix está indisponível" e bloqueia o botão "Continuar". (⚠️ Observação: o texto exibido pra clínica diz "sábado, das 8h às 16h", mas o código aplica corte às 14h no sábado. Tratar como bug conhecido até produto alinhar. 🚧 PENDENTE: confirmar qual é o horário oficial.)
* O paciente precisa de **CPF válido** (validação via `cpf-cnpj-validator` no front) e **celular**.
* A clínica também precisa informar **um telefone de contato próprio** pra receber a confirmação da contratação.

**Onde acessar:**

* Menu lateral → Capix (ou banner "Capix" que aparece em telas de finanças e em alguns pontos do produto pra clínicas habilitadas).
* URL: `/#/finance/microcredits`.

**Fluxo típico (simular e contratar):**

A simulação é um wizard de **3 passos**:

1. **Passo 1, "Parcele via Pix com o Capix":** a clínica preenche valor do parcelamento, procedimento(s), CPF do paciente, celular do paciente, e-mail do paciente (opcional), telefone de contato da clínica, e aceita os Termos de Uso. Clica em "Continuar". O sistema cria uma **solicitação** (registro interno `CreditApplication`) e envia pra análise.
2. **Passo 2, "R$ X liberados para parcelar":** a tela espera o resultado da análise por **polling a cada 5 segundos** enquanto a solicitação está em estados `pending` ou `analysing`. Quando vira `approved`, aparecem as opções de entrada (o valor da entrada **não é fixo**, varia conforme a proposta) e o valor em reais que a clínica vai receber por opção de parcela. A clínica seleciona a opção e clica em "Escolher parcelas".
3. **Passo 3, "R$ X liberados para parcelar, selecione a quantidade de parcelas":** mostra as opções de **1x, 2x, 3x ou 4x**, cada uma com o valor da parcela pro paciente, o valor que a clínica vai receber líquido e a data do primeiro vencimento (sempre **um mês a partir de hoje**). A clínica seleciona, aceita os Termos de Uso de novo e clica em "Enviar proposta ao paciente".

**Depois do envio da proposta:**

Abre o "Modal de conclusão" com a sequência que vai acontecer com o paciente:

1. O paciente recebe os **Termos de Uso por WhatsApp** pra aceitar.
2. Após o aceite, ele recebe o **link de pagamento da entrada via Pix**. A entrada **precisa ser paga no mesmo dia**; se não for, a proposta expira (Denis Maeda, #38).
3. Quando ele paga a entrada, a clínica é avisada pelo contato da Capim e **pode iniciar o tratamento**.
4. **Em até 1 dia útil** após a entrada, o **valor líquido cai na conta da clínica** (com o deságio por antecipação aplicado).

Em seguida abre o **modal de pesquisa (SurveyModal)** perguntando se o valor do Capix cobriu o tratamento todo, e se não, como o paciente vai pagar o restante (cartão, boleto da clínica, financiamento, pix/dinheiro, não informado). É opcional, fecha o ciclo da simulação.

**Limites técnicos da simulação (extraídos do código):**

* **Valor mínimo:** R$ 100,00.
* **Valor máximo:** R$ 1.000,00 (texto de erro: "Valor deve ser entre R$ 100,00 e R$ 1000,00"). Teto oficial confirmado (Denis Maeda, #44).
* **Quantidade de parcelas:** de 1 a 4.
* **Entrada:** **não é fixa**, varia de proposta pra proposta. O modelo antigo de entrada fixa de 10% está desatualizado desde dezembro de 2025 (Denis Maeda, #47 e #48).
* **Valor que a clínica recebe (deságio por antecipação):** a clínica vê **sempre o valor em reais, já calculado**, nunca o percentual de deságio. O deságio **não depende da quantidade de parcelas** e segue uma política nova; a Capim **não divulga tabela de taxas** pra clínica (Denis Maeda, #30, #33, #43 e #46). O valor definitivo é o que vem do sistema da Capim na proposta (`net_clinic_payout`). Não citar percentuais pro cliente.
* **Primeiro vencimento:** **um mês depois da simulação**, calculado no front.

**Estados (status) do contrato (`CreditApplication`):**

* `pending`: solicitação criada, ainda não entrou em análise. Estado inicial.
* `analysing`: solicitação em análise. Tela mostra skeleton e fica em polling.
* `approved`: análise aprovada. Tela mostra valor liberado e propostas.
* `rejected`: existe no modelo interno, mas **hoje não é usado**: não existe reprovação na análise. Os casos que parecem "reprovados" são **CPF não localizado** ou **paciente menor de idade**, que não são elegíveis ao Capix (Denis Maeda, #42).
* `blocked`: solicitação bloqueada (caso clássico: o **paciente já tem contrato Capix em andamento**). A tela abre o modal "Paciente com contrato em andamento" e oferece a opção "Quero receber um aviso quando este paciente puder contratar novamente".
* `finished`: contrato finalizado/quitado.

Não há estado explícito de "em atraso" no enum do `CreditApplication`. O que acontece quando o paciente atrasa parcelas é tratado fora desse modelo. **Hoje a clínica não enxerga o status de atraso/inadimplência** dos Capix dos pacientes dela; isso está em desenvolvimento (Denis Maeda, #41).

**⚠️ Atenção:**

* A clínica **não vê uma lista histórica de Capix contratados** dentro da tela `/finance/microcredits`. A tela é só de simulação/contratação. Pra ver os contratos existentes, **só mediante pedido direto ao suporte** (o time interno usa o backoffice `/backoffice/credit_applications`, que **não é tela do cliente**). Uma tela de histórico pra clínica está em desenvolvimento, mas ainda não existe (Denis Maeda, #29 e #40).
* O **valor que a clínica recebe** é o **líquido com deságio**, não o valor cheio. Sempre que o cliente perguntar "por que recebi menos que o orçamento?", a resposta começa por aí.
* O **paciente paga as parcelas direto pra Capim, por Pix**. A clínica **não cobra o paciente** e **não recebe alerta de atraso** pelo Capix.
* Existe modal "**Capix temporariamente fora do ar**" (`ServiceUnavailableModal`) controlado pela flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE`. Quando ligada, abre o modal informando manutenção e pedindo pra não acionar o suporte. Se o cliente reclamar disso, primeiro checar se essa flag está ativa.
* **Telefone de suporte Capix:** **(11) 4210-5578**. O WhatsApp antigo que aparecia no modal de conclusão (`+55 11 96173-3162`) e os demais números anteriores **foram desativados** (Denis Maeda, #28 e #45). Se o cliente citar o número antigo, passar o novo.

## > 3. 💼 Casos de uso esperados

* **Caso 1, paciente quer fazer um procedimento de R$ 800 e não tem cartão:** a recepção abre Capix, simula R$ 800 e escolhe a quantidade de parcelas. O paciente paga a entrada via Pix no mesmo dia (o valor da entrada vem na proposta) e o restante em parcelas mensais via Pix pra Capim. A clínica recebe, em até 1 dia útil após a entrada, o valor em reais que aparece na tela da proposta.
* **Caso 2, dentista quer testar o Capix antes de oferecer pro paciente:** preenche um valor dentro da faixa permitida, com CPF de teste (precisa ser CPF válido na conta de dígito), e vê as opções. Importante: criar uma simulação **dispara workflow real** no backend (N8N), então não usar dados de paciente real só pra testar.
* **Caso 3, paciente já tem um Capix em andamento:** ao simular pra ele de novo, o sistema retorna `blocked` e abre o modal "Paciente com contrato em andamento". O mesmo paciente **não pode contratar um novo Capix sem terminar de pagar as pendências antigas** (Denis Maeda, #34). A clínica pode marcar "Quero receber um aviso quando este paciente puder contratar novamente" e a Capim avisa quando o contrato anterior for quitado.
* **Caso 4, valor do tratamento maior que o teto:** o tratamento custa R$ 3.000, paciente não tem outra forma. Capix sozinho não cobre (teto R$ 1.000). A própria pesquisa de pós-contratação considera esse cenário ("o paciente vai pagar o restante junto, depois, com cartão, boleto da clínica..."). A clínica usa Capix pra parte do valor e combina o restante separadamente.
* **Caso 5, clínica entra na tela fora do horário Capix (domingo, ou 21h):** aparece o aviso "No momento, a opção de parcelamento via Pix está indisponível, das 8h às 20h em dias úteis e das 8h às 14h no sábado". O botão de continuar fica desabilitado. Existe uma **exceção hardcoded** pra a clínica de id `41201`, que pode operar Capix fora do horário (🚧 PENDENTE: confirmar com produto por que essa clínica é exceção e se há outras).
* **Caso 6, paciente não é elegível:** a clínica tenta simular e o paciente não passa. Hoje isso acontece quando o **CPF não é localizado** ou o **paciente é menor de idade**. Não existe reprovação por análise; esses casos simplesmente não são elegíveis ao Capix (Denis Maeda, #42).

> O antigo experimento "simular Capix a partir do agendamento" (banner "Não perca mais orçamentos, simular Capix") **foi desligado** (Denis Maeda, #31).

## > 4. ❓ FAQ

**P: O que significa "Capix"?**

R: É o nome comercial do **parcelamento via Pix** da Capim: o paciente parcela via Pix e a clínica recebe à vista. **Capix não é crédito**, nem pra clínica nem pro paciente; pela lei, o produto não se encaixa nessa categoria, então nunca apresentar como crédito, microcrédito, empréstimo ou financiamento (Denis Maeda, #32). Em outros pontos do dashboard, o nome "Capix" também aparece numa tela com o rótulo "Crédito pré-aprovado" no resumo de agendamento (ao lado de "BNPL"); mesmo assim, no atendimento, a linguagem continua sendo "parcelamento via Pix". 🚧 PENDENTE: confirmar com produto a relação exata entre Capix e BNPL e se há intenção de ajustar esse rótulo.

**P: A clínica perguntou se Capix é um empréstimo pra ela. É?**

R: **Não.** Capix não é empréstimo nem crédito: é parcelamento via Pix pro paciente; a clínica recebe à vista um valor com deságio. Se o cliente está pedindo empréstimo pra capital de giro da clínica (compra de equipamento, antecipação de recebíveis da maquininha), **não é Capix**. Repassar pro time comercial/financeiro Capim, é fora do escopo dessa tela. 🚧 PENDENTE crítico: confirmar com produto se existe roadmap pra um produto separado de empréstimo à clínica.

**P: Por que a clínica recebe menos do que o valor combinado com o paciente?**

R: Por causa do **deságio por antecipação**. A Capim adianta pra clínica em até 1 dia útil o valor das parcelas, descontando uma taxa. A clínica vê **sempre o valor em reais já calculado** na proposta, nunca o percentual. O deságio **não depende da quantidade de parcelas**: segue uma política nova, e a Capim não divulga tabela de taxas pra clínica (Denis Maeda, #30, #33 e #43). Não citar percentuais pro cliente. ✅ Validar com produto se há mensagem oficial pra explicar isso pro cliente.

**P: Quanto tempo leva a análise?**

R: A tela espera ativamente o resultado fazendo polling a cada 5 segundos enquanto está em `analysing`. **Não há timeout explícito no front**. Na prática, a análise é via workflow externo (N8N) e o tempo depende da fila desse workflow. 🚧 PENDENTE: confirmar com produto o tempo esperado e o que acontece se demorar muito (a tela hoje fica esperando indefinidamente).

**P: O paciente foi reprovado. O que a clínica vê?**

R: Hoje **não existe reprovação** na análise do Capix. Os casos que a clínica percebe como "reprovados" são de pacientes **não elegíveis**: **CPF não localizado** ou **paciente menor de idade** (Denis Maeda, #42). Orientar a clínica a conferir o CPF digitado; se estiver correto, ou se o paciente for menor de idade, o Capix não está disponível pra ele.

**P: O paciente não recebeu o link de pagamento da entrada. E agora?**

R: Verificar (1) o número de celular no cadastro do paciente está correto e ativo no WhatsApp? (2) Os Termos de Uso foram aceitos por ele? O link da entrada **só é enviado após o aceite**. Se sim pros dois, encaminhar pro canal de suporte Capix com o **CPF do paciente** e a **data/hora da simulação** pra time conseguir rastrear a `CreditApplication`.

**P: O paciente atrasou as parcelas. A clínica sofre alguma coisa?**

R: O recebimento da clínica acontece à vista, então o atraso do paciente **não afeta o valor que a clínica já recebeu**. O processo de cobrança do paciente em atraso é tocado pela Capim. A clínica não precisa cobrar o paciente. Hoje a clínica **não é informada** do atraso (essa visão está em desenvolvimento, Denis Maeda, #41). E o mesmo paciente **não pode contratar um novo Capix sem terminar de pagar as pendências antigas** (Denis Maeda, #34).

**P: O paciente quer pagar tudo de uma vez e quitar o Capix antes do prazo. Como faz?**

R: 🚧 PENDENTE: não encontrei no código do front nem no controlador da clínica um caminho de quitação antecipada. Encaminhar pro canal de suporte Capix com o CPF do paciente.

**P: A clínica pode cancelar uma proposta enviada pro paciente antes do aceite?**

R: Não há botão de cancelamento na tela. O caminho oficial é **acionar o telefone de suporte** Capix, (11) 4210-5578 (Denis Maeda, #39). Vale lembrar que a entrada precisa ser paga **no mesmo dia**; se não for, a proposta expira sozinha (Denis Maeda, #38).

**P: Por que a tela mostra "Capix temporariamente fora do ar"?**

R: Porque a flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE` está ligada. É um modal de manutenção controlado por variável de ambiente. **A mensagem do modal explicitamente pede pro cliente não acionar o suporte**, então alinhar com o cliente que é manutenção planejada e que assim que o ambiente normalizar a tela volta. 🚧 PENDENTE: confirmar o canal interno onde o suporte fica sabendo quando essa flag é ligada/desligada.

**P: O Capix tem tarifa pra clínica?**

R: A Capim **não divulga tabela de taxas** pra clínica (política nova). A clínica vê apenas o valor final em reais que vai receber, já calculado na proposta. O deságio não depende da quantidade de parcelas (Denis Maeda, #43 e #46).

**P: A clínica perdeu o acesso ao Capix de um dia pro outro. Por quê?**

R: Causa provável é a clínica ter saído da whitelist `FF_MICROCREDITS_CLINICS`. Confirmar com o **Time de Riscos** (interno Capim) o motivo (ex: pausada por inadimplência, mudança de plano, ajuste comercial) (Denis Maeda, #35). 🚧 PENDENTE: confirmar quem decide entrada/saída de clínica na whitelist Capix.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo abrir o Capix, a tela dá 404." | A clínica não está na whitelist Capix, ou a flag global `FF_MICROCREDITS_ENABLED` está desligada no ambiente. | Confirmar com a clínica o ID e olhar com o time interno se ela está na whitelist. | Escalar pro **Time de Riscos** pra checar/incluir a clínica na whitelist, se for o caso. |
| "Não aparece a opção Capix no menu lateral." | Mesma causa de cima: clínica fora da whitelist ou flag global desligada. | Mesmo caminho: confirmar ID e checar whitelist. | Idem. |
| "Estou tentando simular e diz que o Capix está indisponível, mas é horário comercial." | (1) Pode estar realmente fora do horário Capix (domingo, antes das 8h, depois das 20h em dia útil, depois das 14h no sábado). (2) Pode ser falso aviso: o horário aparente diverge do horário real do servidor da clínica. (3) Pode ser a flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE` ligada (modal de manutenção). | Pedir print da tela. Conferir hora atual da clínica. Conferir se aparece o modal de manutenção ou só o banner "Working hours". | Se o cliente está dentro do horário e ainda assim aparece bloqueado, escalar pro **Time de Riscos**. |
| "O sistema diz que esse paciente tem um contrato em andamento, mas ele já quitou." | Possível dessincronização entre o estado real do contrato (que pode estar `finished` no banco) e o que o `CreditApplication` da simulação está retornando como `blocked`. | Confirmar com o cliente o CPF do paciente e a data aproximada da última quitação. | Escalar pro Time de Sustentação com CPF do paciente e ID da clínica. |
| "A análise ficou parada eternamente carregando, nunca chega no resultado." | Workflow externo (N8N) preso ou erro silencioso. O front não tem timeout, fica em polling. | Pedir pro cliente sair da tela e tentar de novo. Coletar horário aproximado e CPF do paciente. | Escalar pro Time de Sustentação com horário, CPF do paciente e ID da clínica. |
| "Recebi um valor diferente do que vi na simulação." | O valor que cai na conta é o calculado pelo sistema da Capim na proposta (`net_clinic_payout`). O cálculo local antigo da tela (percentuais por número de parcelas) está desatualizado: o deságio segue política nova e não depende das parcelas. Não citar percentuais pro cliente. | Coletar o valor simulado, o número de parcelas escolhido e o valor recebido. Conferir o orçamento. | Escalar pro Time de Sustentação com o ID da `CreditApplication` (ou CPF do paciente + data) pra confirmar a regra aplicada. |
| "Errei o valor/procedimento na hora de simular, como faço pra corrigir?" | Não há tela de edição pós-envio da proposta. | Se a entrada ainda não foi paga, a proposta expira no fim do mesmo dia. Se precisar cancelar antes, o caminho oficial é acionar o telefone de suporte Capix, (11) 4210-5578. | Escalar pro Time de Sustentação com ID da `CreditApplication` (ou CPF do paciente + data) pra cancelar. |
| "O paciente diz que não recebeu o link de pagamento da entrada." | Termos de Uso não aceitos pelo paciente, ou número de celular errado, ou o WhatsApp dele não recebe. | Verificar o celular cadastrado na simulação. Pedir pro paciente confirmar se aceitou os Termos. | Escalar pro Time de Sustentação se número e Termos estão corretos e ainda assim não chegou. |
| "Está parado no horário do banner de manutenção e a clínica não pode esperar." | Flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE` ativa. | Alinhar com o cliente que é uma janela de manutenção planejada e que **o próprio modal pede pra não acionar suporte**. Anotar o caso pra acompanhar. | Escalar pro Time de Sustentação se a janela está demorando além do previsto ou se outras clínicas começarem a reclamar do mesmo. |
| "Tentei simular pro paciente e não passou." | Paciente não elegível: CPF não localizado ou menor de idade. Não existe reprovação por análise. | Conferir o CPF digitado. Se estiver correto ou o paciente for menor de idade, explicar que ele não é elegível ao Capix. | Escalar pro Time de Sustentação só se o CPF estiver correto, o paciente for maior de idade e ainda assim não passar. |
| "Quero ver os Capix antigos da minha clínica." | Não há tela de histórico Capix pra a clínica hoje (em desenvolvimento). | Explicar a limitação: hoje a clínica só tem esse histórico mediante pedido direto ao suporte. | Escalar pro Time de Sustentação pedindo a lista de `CreditApplication` da clínica num intervalo de datas. |

**Para quem escalar:**

* **Time de Riscos:** acesso ao Capix (whitelist), clínica que perdeu acesso e bloqueio dentro do horário (Denis Maeda, #35, #36 e #37).
* **Time de Sustentação** (canal interno Capim): bugs, tela travada, dessincronização de contrato e extração de histórico.
* **Telefone de suporte Capix, (11) 4210-5578:** cancelamento de proposta antes do aceite (Denis Maeda, #39).

## > 6. ⚠️ Limitações conhecidas

* **Sem tela de histórico de Capix pra clínica** dentro do dashboard (em desenvolvimento). A tela `/finance/microcredits` é só simulação/contratação; histórico só mediante pedido ao suporte.
* **Tela trava em `analysing` indefinidamente** se o workflow externo de análise não responder; não há timeout no front.
* **Sem botão de cancelar proposta** depois de enviada ao paciente: cancelamento só pelo telefone de suporte Capix.
* **Sem informação de atraso/inadimplência** do paciente exposta pra clínica (em desenvolvimento).
* **Sem opção de quitação antecipada** visível na tela da clínica.
* **Divergência entre texto e código do horário de sábado**: o aviso fala "até 16h", o corte real é 14h.
* **Exceção hardcoded de clínica** (`41201`) que ignora o corte de horário Capix. 🚧 PENDENTE: confirmar razão.
* **Limite de R$ 1.000 por simulação**, teto oficial confirmado (não dá pra emendar simulações pro mesmo paciente enquanto ele tiver pendências do Capix anterior, porque ele vira `blocked`).
* **Sem integração de cobrança com Maquininha**: o pagamento do paciente é por Pix administrado pela Capim, totalmente fora da maquininha da clínica.

## > 7. 🗺️ Próximos passos [opcional]

* 🚧 PENDENTE: o briefing do guia menciona um Capix "empréstimo pra clínica" (capital de giro, antecipação, equipamento) que não existe no código atual. Se está no roadmap, precisa virar guia separado quando o produto sair.
* 🚧 PENDENTE: convivência Capix vs BNPL na tela de simulação a partir de agendamento (já aparecem juntos no resumo "Créditos disponíveis").
* Tela de histórico/listagem de Capix pra clínica: em desenvolvimento, ainda sem data (Denis Maeda, #40).
* Visão de atraso/inadimplência dos pacientes pra clínica: em desenvolvimento (Denis Maeda, #41).

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: passo 1, formulário "Parcele via Pix com o Capix" com valor, procedimento, CPF, telefone do paciente e da clínica]

[INSERIR PRINT: aviso "WorkingHoursWarning" exibido fora do horário Capix]

[INSERIR PRINT: passo 2, "R$ X liberados para parcelar", com as opções de entrada]

[INSERIR PRINT: passo 3, "Selecione a quantidade de parcelas" com as opções 1x a 4x]

[INSERIR PRINT: `MicrocreditSummary` (resumo lateral) na etapa de parcelas]

[INSERIR PRINT: `CompletionModal` com a sequência Termos → Entrada → Pagamento concluído → Pagamento recebido]

[INSERIR PRINT: `SurveyModal` com as perguntas pós-contratação]

[INSERIR PRINT: `ModalPatientOngoingContract` (paciente bloqueado com contrato ativo)]

[INSERIR PRINT: `ServiceUnavailableModal` (manutenção)]

[INSERIR PRINT: banner Capix no menu/finanças (`MicrocreditsBanner`)]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Conceito e posicionamento**

* [ ] Capix "empréstimo pra clínica" (capital de giro, antecipação, compra de equipamento) existe ou está em construção, ou o briefing do guia estava equivocado? Se existir, é o mesmo Capix da tela `/finance/microcredits` ou é outro produto?
* [ ] Relação oficial entre Capix e BNPL (aparecem lado a lado em "Créditos disponíveis" no resumo de agendamento).

**Acesso e gating**

* [ ] Critério de entrada de uma clínica na whitelist `FF_MICROCREDITS_CLINICS`: quem decide, com base em quê?
* [ ] Restrição de papel dentro da clínica pra abrir uma simulação (admin/recepção/dentista)?
* [ ] Razão da clínica `41201` ser exceção hardcoded ao corte de horário.
* [ ] Horário oficial de funcionamento Capix no sábado: 14h (código) ou 16h (texto exibido)?

**Operação e fluxo**

* [ ] Tempo esperado de análise (a tela hoje espera indefinidamente).
* [x] Experiência do usuário quando o estado é `rejected` (não há tratamento explícito no front). ✅ Não existe `rejected` hoje; "reprovados" são CPF não localizado ou menor de idade, não elegíveis (Denis Maeda, #42)
* [x] Existe expiração automática da proposta enviada ao paciente? Quanto tempo? ✅ A entrada deve ser paga no mesmo dia, senão expira (Denis Maeda, #38)
* [x] Caminho oficial pra cancelar uma proposta enviada antes do aceite. ✅ Acionar o telefone de suporte (Denis Maeda, #39)
* [ ] Caminho oficial pra quitação antecipada do paciente.
* [x] Onde a clínica enxerga (se enxerga) o status de atraso/inadimplência de Capix dos pacientes dela. ✅ Não enxerga hoje; em desenvolvimento (Denis Maeda, #41)

**Histórico e relatórios**

* [x] Tela ou relatório onde a clínica vê o histórico dos Capix contratados (existe? está no roadmap?). ✅ Ainda não existe, em desenvolvimento; hoje só via pedido ao suporte (Denis Maeda, #29 e #40)

**Comercial e tarifas**

* [x] Tabela oficial de deságio por número de parcelas (no front, 90/85/80/75% para 1/2/3/4x); ela varia por clínica? ✅ Desconsiderar: política nova, nenhuma tabela de taxas é divulgada pra clínica (Denis Maeda, #43)
* [x] Teto de R$ 1.000 por simulação ainda é o oficial? ✅ Sim, segue o teto oficial (Denis Maeda, #44)

**Canais e SLAs**

* [x] O WhatsApp `+55 11 96173-3162` é o canal oficial para o cliente em casos de Capix, ou é só pra essa fase? ✅ Desligado; novo telefone (11) 4210-5578 (Denis Maeda, #28 e #45)
* [ ] Canal pelo qual o suporte fica sabendo quando `FF_MICROCREDITS_SERVICE_UNAVAILABLE` é ligada/desligada.
* [ ] SLA esperado de resposta no Time de Sustentação para os cenários Capix listados na tabela.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Capix é pagamento pro paciente, clínica recebe à vista com deságio" como definição oficial (encontrado no código, mas em direta contradição com o briefing original do guia).
* [x] "Os percentuais 90/85/80/75% são apenas a simulação local do front e podem divergir do líquido real do backend." ✅ Desconsiderar esses valores: o deságio não depende da quantidade de parcelas (Denis Maeda, #46)
* [ ] "O modal de paciente bloqueado oferece 'avisar quando puder contratar novamente' via `sendRenewalInterest`": confirmar como esse aviso é entregue ao usuário e quando.
* [x] "Existe um experimento de simular Capix a partir do agendamento e do perfil do paciente, controlado por `isActiveContactOnCreditProductsClinic`": ainda está ativo? ✅ Experimento desligado (Denis Maeda, #31)

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-backend` e `capim-dash-frontend`, podem ser tratados como confirmados:

* Acesso à tela Capix depende de `FF_MICROCREDITS_ENABLED` + clínica em `FF_MICROCREDITS_CLINICS`; sem isso a rota cai em 404.
* O wizard tem 3 passos: dados do paciente/valor, escolha de entrada, escolha de parcelas.
* Valor permitido por simulação: R$ 100 a R$ 1.000 (validação Zod no front).
* Quantidade de parcelas: 1 a 4 (helper `installments.js`).
* Entrada paga pelo paciente via Pix, no mesmo dia. **Correção:** a entrada **não é fixa**, varia; o modelo de 10% fixo está desatualizado desde dezembro de 2025 (Denis Maeda, #47 e #48).
* Estados do `CreditApplication`: `pending`, `analysing`, `approved`, `rejected`, `finished`, `blocked` (AASM no model `CreditApplication`). Na prática, `rejected` não é usado hoje (Denis Maeda, #42).
* Polling de 5s no front enquanto a solicitação está em análise.
* Paciente com contrato em andamento bate em `blocked` e abre `ModalPatientOngoingContract`, com opção `sendRenewalInterest`.
* Horário Capix codificado: seg a sex 8h às 20h, sáb 8h às 14h, domingo bloqueado, exceção pra clinic id `41201`.
* Modal de manutenção controlado pela flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE`.
* Backoffice tem `/backoffice/credit_applications` para o time interno; **não é tela da clínica**.
* Criação da `CreditApplication` no backend dispara workflow externo via N8N (`N8N::Microcredit::Client`).
* Pesquisa pós-contratação (`SurveyModal`) cobre se o Capix cobriu o tratamento todo e como o paciente pagará o restante.
