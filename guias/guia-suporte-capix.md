# 💸 Guia de Suporte: Capix

> Material para o time de suporte da Capim. Atualizado em 13/11/2026.
> Status da feature: habilitado clínica a clínica, pelo cadastro da clínica no sistema da Capim (campo `capix_enabled`). Toda clínica com Capix habilitado vê o **Portal Capix** (abas Simulações, Contratos e Repasses). Quem confirma se uma clínica tem ou não Capix é o **Time de Riscos** (Denis Maeda, issue #35). 🚧 PENDENTE: confirmar percentual atual de clínicas habilitadas e se há plano de GA.

> **Como falar do Capix (regra de produto):** o Capix **não pode ser chamado de crédito**, nem para a clínica nem para o paciente. Pela lei, esse produto não se encaixa na categoria de crédito (Denis Maeda, issue #32). Falar sempre em **parcelamento via Pix** ou **Pix parcelado**. Algumas telas e nomes internos do sistema ainda usam palavras como "crédito" ou "microcrédito" (o código chama o produto de `microcredits`); isso é nome técnico e não deve ser repetido pro cliente.

## 1. 🎯 Visão geral

Capix é a forma de pagamento "parcele via Pix" que a clínica oferece pro paciente no fechamento do orçamento. Na prática: o paciente paga **uma entrada via Pix** e o **restante em parcelas via Pix** (de 1 a 4), e a **Capim adianta para a clínica** o valor a receber em até 1 dia útil depois que a contratação é concluída. O valor da entrada **não é fixo**: ele varia de proposta para proposta (Denis Maeda, issues #47 e #48). O modelo antigo, com entrada fixa de 10%, está desatualizado desde dezembro de 2025 (Denis Maeda, issue #48). O slogan que aparece no banner do produto resume: **"Você recebe à vista, a Capim cuida do resto."**

Resolve a dor clássica de orçamento perdido por falta de meio de pagamento: o paciente não tem limite no cartão, não quer fazer cheque, mas consegue Pix. A clínica não vira "banco" do paciente nem precisa esperar várias parcelas pra receber, e ainda assim oferece parcelamento.

**Para quem é:** clínicas com Capix habilitado no cadastro. Se a clínica não tem Capix, o item "Capix" não aparece no menu lateral e as telas do Capix caem em "página não encontrada". ✅ Validar com produto: critério para uma clínica ter o Capix habilitado (volume, plano, região, fase de rollout).

**Quem na clínica usa:** qualquer usuário da clínica habilitada acessa pelo menu lateral. No código do dash não há restrição de papel para abrir o Capix. 🚧 PENDENTE: confirmar se existe restrição de papel (admin, recepção, dentista) aplicada em outro lugar.

**Onde se encaixa no produto Capim:**

* **Meios de pagamento:** o item "Capix" fica em **Meios de pagamento → Capix** no menu lateral e abre o **Portal Capix**.
* **Pacientes:** a simulação usa CPF e celular do paciente. Um paciente que ainda tem Capix em andamento (parcelas pendentes) não pode contratar um novo Capix até terminar de pagar (Denis Maeda, issue #34).
* **Agenda / Orçamentos:** o experimento de "Simular Capix" a partir da tela de agendamento e do perfil do paciente foi **desligado** (Denis Maeda, issue #31). Não há mais esse atalho.
* **Maquininha (Pontos de venda) e Carnês:** **não há integração de cobrança** entre Capix e maquininha/carnê. As parcelas do paciente são cobradas pela Capim por boleto ou Pix Automático, fora da maquininha da clínica.
* **Financiamento Capim (BNPL):** é **outro produto**. Capix e BNPL não se misturam.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* A clínica precisa ter **Capix habilitado** no cadastro (quem confirma é o Time de Riscos).
* A simulação só pode ser feita **dentro do horário de funcionamento Capix**: segunda a sexta das **8h às 20h** e sábado das **8h às 14h**. Domingo e fora desse horário, a tela mostra o aviso "No momento, a opção de parcelamento via Pix está indisponível" e bloqueia o botão de continuar. (Observação: o texto exibido pra clínica diz "sábado, das 8h às 16h", mas o código corta às 14h no sábado. Tratar como bug conhecido até produto alinhar. 🚧 PENDENTE: confirmar qual é o horário oficial.)
* O paciente precisa de **CPF válido**, ser **maior de idade** e ter **celular**.
* A clínica também informa **um telefone de contato próprio** pra acompanhar a contratação.

**Onde acessar:**

* Menu lateral → **Meios de pagamento → Capix**. Abre o Portal Capix, na aba Simulações.
* Botão **"Simular proposta"**, no canto superior direito do portal, abre uma simulação nova.
* URL do portal: `/#/finance/capix`. URL da simulação: `/#/finance/microcredits`.

**Fluxo típico (simular e enviar proposta):**

1. **Dados do paciente:** a clínica informa CPF do paciente, procedimento(s) e aceita os Termos de Uso. Nessa tela **não há campo de valor**. Ao continuar, o sistema analisa o paciente e calcula até quanto ele pode parcelar.
2. **Valor e propostas:** a tela mostra quanto está liberado pra parcelar. A clínica digita o valor do parcelamento (de R$ 100 até o limite liberado, que nunca passa de R$ 1.000) e vê **3 opções de proposta**. Cada opção mostra, em reais, **quanto o paciente paga de entrada** e **quanto a clínica recebe**. Regra geral: entrada maior, taxa da clínica menor; entrada menor, taxa da clínica maior. A clínica escolhe uma opção junto com o paciente.
3. **Contatos e envio:** a clínica informa o celular do próprio paciente e o telefone da clínica e clica em **"Enviar proposta ao paciente"**. Abre o modal **"Link enviado ao paciente!"**.

**Depois do envio da proposta (a parte do paciente):**

1. O paciente recebe um **link pelo WhatsApp**.
2. Pelo link, ele **escolhe em quantas parcelas** quer pagar (de 1 a 4) e **a data do primeiro vencimento**.
3. Ele **assina os Termos de Uso** na própria página, com um código que chega pelo WhatsApp.
4. Ele **paga a entrada via Pix**. A entrada precisa ser paga **no mesmo dia**, senão a proposta expira (Denis Maeda, issue #38). A tela do dash informa o corte: se não pagar até as 23h, o pedido é cancelado e a clínica é avisada.
5. Com a entrada paga, a clínica é avisada pelo WhatsApp e **pode iniciar o tratamento**. **Em até 1 dia útil**, o valor a receber cai na conta da clínica, já com o desconto por antecipação aplicado.

Exceção: em algumas clínicas, o repasse só é agendado depois de uma **confirmação do paciente no dia seguinte**, e o tratamento não pode começar antes dela. Nesses casos, o próprio modal de envio mostra o aviso "Não inicie o tratamento antes da confirmação do paciente, no dia seguinte à contratação."

**Fluxo antigo (algumas clínicas):** clínicas que participam do experimento de Pix Automático ainda usam a tela antiga, em que o valor é informado logo na primeira tela, a clínica escolhe a quantidade de parcelas e, no fim, abre o "Modal de conclusão" com o botão de WhatsApp de suporte e uma pesquisa opcional (SurveyModal) sobre como o paciente vai pagar o restante do tratamento.

**Limites da simulação:**

* **Valor mínimo:** R$ 100,00.
* **Valor máximo:** R$ 1.000,00. É o teto oficial (Denis Maeda, issue #44). O limite de cada paciente vem da análise e pode ser menor.
* **Quantidade de parcelas:** de 1 a 4, escolhidas pelo paciente no link (no fluxo antigo, pela clínica).
* **Entrada:** **varia** de proposta para proposta. Não existe entrada fixa.
* **Valor que a clínica recebe:** aparece **sempre em reais, já calculado**, em cada proposta e depois na aba Repasses. A clínica **não vê percentual** de desconto e a Capim **não divulga** tabela de taxas pra clínica (Denis Maeda, issues #30 e #43). O suporte também não informa percentual.

**Status que a clínica vê no Portal Capix:**

* **Simulações (status da proposta):** **Em aberto** (ainda não fechou; dá pra reabrir e reenviar), **Enviada ao paciente** (em andamento com o paciente), **Contratada** (entrada paga, virou contrato) e **Encerrada** (não vai avançar: o paciente recusou os termos, não foi aprovado, ou a proposta foi cancelada).
* **Contratos:** **Ativo**, **Cancelamento solicitado**, **Quitado** e **Cancelado**.
* **Parcelas (dentro de cada contrato):** **A vencer**, **Atrasada**, **Expirada**, **Paga**, **Renegociada** e **Estornada**.
* **Repasses:** **Pendente Confirmação**, **Liberado** e **Realizado**.

**Paciente não aprovado:** por enquanto não existe uma reprovação por análise. Os casos "reprovados" são **CPF não localizado** ou **paciente menor de idade**, e os dois simplesmente não são elegíveis (Denis Maeda, issue #42). Na tela, aparece um aviso com o motivo ("CPF não encontrado" ou "Paciente menor de idade") e o botão "Simular outro paciente".

**Paciente com Capix em andamento:** se o paciente ainda tem contrato ativo, a simulação é bloqueada e abre o modal "Paciente com contrato em andamento", com a opção "Quero receber um aviso quando este paciente puder contratar novamente". O mesmo paciente só pode contratar um novo Capix depois de terminar de pagar o anterior (Denis Maeda, issue #34).

**Atenção:**

* **O Portal Capix mostra o histórico da clínica.** A aba **Contratos** lista todos os contratos fechados, em qualquer situação, e a aba **Repasses** mostra quanto a clínica recebe em cada contrato e se o depósito já saiu. Em julho de 2026 isso ainda não existia: a clínica só via o histórico pedindo direto ao suporte (Denis Maeda, issues #29 e #40). O código do dash de novembro de 2026 já tem as abas.
* O **valor que a clínica recebe** é o valor com desconto por antecipação, não o valor cheio do tratamento. Sempre que o cliente perguntar "por que recebi menos que o orçamento?", a resposta começa por aí, sem citar percentual.
* O **paciente paga as parcelas direto pra Capim**, por boleto ou Pix Automático. A clínica **não precisa cobrar o paciente**.
* Existe modal "**Capix temporariamente fora do ar**" (`ServiceUnavailableModal`), controlado pela flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE`. Quando ligada, o modal informa manutenção e pede pra não acionar o suporte. Se o cliente reclamar disso, primeiro checar se essa flag está ativa.
* **Telefone de suporte Capix:** o número atual é **(11) 4210-5578**. Os números anteriores, incluindo o `+55 11 96173-3162`, foram **desativados** (Denis Maeda, issues #28 e #45). Desde 12/11/2026, o número que os botões de WhatsApp do Capix abrem no dash (modal de conclusão do fluxo antigo e banner/modal de divulgação do Capix) vem de uma configuração do ambiente. Se o valor não estiver configurado, o código ainda cai no número antigo. ✅ Validar: confirmar que a configuração de produção aponta para o número novo.

## > 3. 💼 Casos de uso esperados

* **Caso 1, paciente quer fazer um procedimento de R$ 800 e não tem cartão:** a recepção abre Capix, clica em "Simular proposta", informa o CPF e o procedimento, digita R$ 800 e vê as 3 propostas, cada uma com a entrada do paciente e o valor que a clínica recebe, em reais. Escolhe a opção com o paciente e envia. O paciente escolhe as parcelas e o vencimento pelo link, assina e paga a entrada no mesmo dia. A clínica recebe em até 1 dia útil.
* **Caso 2, dentista quer testar o Capix antes de oferecer pro paciente:** usar o **"Tutorial Capix"** (botão no cabeçalho do portal, nas clínicas em que ele está liberado). O tutorial usa dados fictícios e não cria nada real. Uma simulação de verdade **dispara processo real** no sistema, então não usar dados de paciente real só pra testar.
* **Caso 3, paciente já tem um Capix em andamento:** ao simular pra ele de novo, abre o modal "Paciente com contrato em andamento". Ele só pode contratar de novo depois de quitar o anterior (Denis Maeda, issue #34). A clínica pode marcar "Quero receber um aviso quando este paciente puder contratar novamente".
* **Caso 4, valor do tratamento maior que o teto:** o tratamento custa R$ 3.000. Capix sozinho não cobre (teto R$ 1.000). A clínica usa Capix pra parte do valor e combina o restante separadamente.
* **Caso 5, clínica entra na tela fora do horário Capix (domingo, ou 21h):** aparece o aviso de parcelamento indisponível e o botão de continuar fica desabilitado. Existe uma **exceção fixa no código** pra clínica de id `41201`, que pode operar Capix fora do horário (🚧 PENDENTE: confirmar com produto por que essa clínica é exceção e se há outras).
* **Caso 6, clínica fala do banner "simular Capix" no agendamento:** esse experimento foi **desligado** (Denis Maeda, issue #31). O caminho é sempre pelo menu **Meios de pagamento → Capix**.
* **Caso 7, clínica quer saber onde está uma proposta enviada:** na aba **Simulações**, clicar na linha com status **Enviada ao paciente** abre o modal "Andamento da proposta", com as etapas Termos Enviados, Termos Aceitos (ou Recusados), Entrada Enviada e Entrada Paga.
* **Caso 8, clínica quer saber quando recebe:** na aba **Repasses**, cada contrato mostra o Valor Repasse, o Status do Repasse e a Data do Repasse (só aparece quando o repasse já foi feito).

## > 4. ❓ FAQ

**P: O que significa "Capix"?**

R: É o nome comercial do **Pix parcelado da Capim**: o paciente parcela o tratamento via Pix e a clínica recebe à vista. **Não chamar de crédito**, nem para a clínica nem para o paciente: pela lei, o produto não se encaixa nessa categoria (Denis Maeda, issue #32). Capix e Financiamento Capim (BNPL) são produtos diferentes.

**P: A clínica perguntou se Capix é um empréstimo pra ela. É?**

R: **Não.** Capix é parcelamento pro paciente, e a clínica recebe à vista o valor já descontado. Não é empréstimo nem crédito para a clínica (Denis Maeda, issue #32). Se o cliente está pedindo dinheiro pra capital de giro da clínica (compra de equipamento, antecipação de recebíveis da maquininha), **não é Capix**: repassar pro time comercial/financeiro Capim.

**P: Por que a clínica recebe menos do que o valor combinado com o paciente?**

R: Porque a Capim **adianta o valor** pra clínica em até 1 dia útil e desconta uma taxa por isso. A clínica vê **sempre o valor em reais, já calculado**, em cada proposta e na aba Repasses. **Não divulgamos percentual** nem tabela de taxas pra clínica (Denis Maeda, issues #30 e #43). A taxa **não depende da quantidade de parcelas** (Denis Maeda, issues #33 e #46). O que a tela mostra é que, entre as 3 propostas, entrada maior significa taxa menor pra clínica. Na hora de explicar, falar em valor em reais e nunca citar percentual.

**P: Quanto tempo leva a análise do paciente?**

R: A tela fica esperando o resultado e verifica de novo a cada 5 segundos. **Não há tempo limite na tela**: se a análise demorar, a tela continua carregando. 🚧 PENDENTE: confirmar com produto o tempo esperado e o que fazer se demorar muito.

**P: O paciente foi reprovado. O que a clínica vê?**

R: Por enquanto não existe reprovação por análise. Os casos "reprovados" são **CPF não localizado** ou **paciente menor de idade**, que não são elegíveis (Denis Maeda, issue #42). A tela mostra um aviso com o motivo e o botão "Simular outro paciente". No caso de CPF não encontrado, vale conferir se o CPF foi digitado certo.

**P: O paciente não recebeu o link da proposta ou da entrada. E agora?**

R: Verificar (1) o celular informado é do próprio paciente e está ativo no WhatsApp? (2) o paciente já assinou os Termos? O pagamento da entrada vem **depois** da escolha das parcelas e da assinatura. Se a proposta ainda está **Em aberto**, a clínica pode abrir a linha na aba Simulações e usar **"Reenviar link ao paciente"**. Se nada disso resolver, acionar o Time de Riscos com o **CPF do paciente** e a **data/hora da simulação**.

**P: O paciente atrasou as parcelas. A clínica sofre alguma coisa?**

R: A clínica já recebeu à vista, e a cobrança do paciente é feita pela Capim. A clínica não precisa cobrar. O mesmo paciente **não pode contratar novos Capix** enquanto não terminar de pagar suas pendências antigas (Denis Maeda, issue #34). Hoje a clínica consegue ver o atraso **por parcela** na aba Contratos (ver próxima pergunta).

**P: A clínica consegue ver se o paciente está em atraso?**

R: Em julho de 2026 não conseguia, a funcionalidade estava em desenvolvimento (Denis Maeda, issue #41). No código do dash de novembro de 2026, a aba **Contratos** mostra cada contrato e, ao abrir a linha, a lista de parcelas com o status de cada uma (**Atrasada**, **Expirada**, **A vencer**, **Paga** etc.). O status do contrato continua **Ativo** mesmo com parcela atrasada: o atraso só aparece por parcela. O **valor da parcela exibido não inclui multa nem juros** de atraso, então numa parcela atrasada o valor na tela é menor do que o paciente deve hoje. ✅ Validar com produto.

**P: O paciente quer pagar tudo de uma vez e quitar o Capix antes do prazo. Como faz?**

R: 🚧 PENDENTE: não há caminho de quitação antecipada na tela da clínica. Acionar o Time de Riscos com o CPF do paciente.

**P: A clínica pode cancelar uma proposta enviada pro paciente antes do aceite?**

R: Não há botão de cancelar proposta na tela. O caminho é **acionar o telefone de suporte Capix, (11) 4210-5578** (Denis Maeda, issue #39). Lembrando que, se o paciente não pagar a entrada no mesmo dia, a proposta expira sozinha (Denis Maeda, issue #38).

**P: E cancelar um contrato já fechado?**

R: Na aba **Contratos**, os contratos que podem ser cancelados mostram o botão **"Cancelar"**, que abre um formulário de solicitação (se o tratamento começou, se terminou, motivo e observações). O contrato passa a **Cancelamento solicitado** enquanto a Capim analisa: aprovado, vira **Cancelado**; recusado, volta a **Ativo**. Quem decide é o Time de Riscos.

**P: Por que a tela mostra "Capix temporariamente fora do ar"?**

R: Porque a flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE` está ligada. É um modal de manutenção. **A mensagem do modal pede pro cliente não acionar o suporte**, então alinhar com o cliente que é manutenção planejada e que a tela volta assim que o ambiente normalizar. 🚧 PENDENTE: confirmar o canal interno onde o suporte fica sabendo quando essa flag é ligada/desligada.

**P: O Capix tem tarifa pra clínica?**

R: Sim, a clínica paga uma taxa de serviço, e o paciente não paga juros. A taxa já vem descontada no valor que a clínica recebe, mostrado em reais. **Não existe tabela de taxas divulgada pra clínica** e não será divulgada (Denis Maeda, issue #43). A regra do tutorial é clara: **a clínica não deve repassar a taxa ao paciente**.

**P: A clínica perdeu o acesso ao Capix de um dia pro outro. Por quê?**

R: Causa provável é o Capix ter sido desabilitado no cadastro da clínica. Confirmar com o **Time de Riscos** (interno Capim) o motivo (Denis Maeda, issue #35). 🚧 PENDENTE: confirmar quem decide habilitar e desabilitar o Capix de uma clínica.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo abrir o Capix, a tela dá página não encontrada." | A clínica não tem Capix habilitado no cadastro. | Confirmar com a clínica o ID. | Escalar pro **Time de Riscos** pra confirmar se a clínica tem Capix (Denis Maeda, issue #36). |
| "Não aparece a opção Capix no menu lateral." | Mesma causa de cima: clínica sem Capix habilitado. | Mesmo caminho: confirmar ID. | Idem, **Time de Riscos**. |
| "Estou tentando simular e diz que o Capix está indisponível, mas é horário comercial." | (1) Pode estar realmente fora do horário Capix (domingo, antes das 8h, depois das 20h em dia útil, depois das 14h no sábado). (2) O relógio do computador da clínica pode estar errado, porque a tela usa a hora local. (3) Pode ser a flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE` ligada (modal de manutenção). | Pedir print da tela. Conferir hora atual da clínica. Conferir se aparece o modal de manutenção ou só o aviso de horário. | Se o cliente está dentro do horário e ainda assim aparece bloqueado, escalar pro Time de Riscos. |
| "O sistema diz que esse paciente tem um contrato em andamento, mas ele já quitou." | O paciente pode ter alguma parcela ainda pendente, ou o status do contrato ainda não foi atualizado. | Na aba Contratos, buscar o paciente pelo CPF e abrir as parcelas. Confirmar a data aproximada da última quitação. | Escalar pro Time de Riscos com CPF do paciente e ID da clínica. |
| "A análise ficou parada eternamente carregando, nunca chega no resultado." | Processo de análise preso ou erro silencioso. A tela não tem tempo limite. | Pedir pro cliente sair da tela e tentar de novo. Coletar horário aproximado e CPF do paciente. | Escalar pro Time de Riscos com horário, CPF do paciente e ID da clínica. |
| "Recebi um valor diferente do que vi na proposta." | Divergência entre a proposta escolhida e o repasse feito. | Coletar o valor que a proposta mostrava e o valor recebido. Conferir a linha do contrato na aba Repasses (Valor Repasse). | Escalar pro Time de Riscos com CPF do paciente e data da contratação. |
| "Errei o valor/procedimento na hora de simular, como faço pra corrigir?" | Não há tela de edição depois do envio da proposta. | Se o paciente ainda não pagou a entrada, a proposta expira no fim do dia. Para cancelar antes, acionar o telefone de suporte Capix, (11) 4210-5578 (Denis Maeda, issue #39). Depois, simular de novo com o valor certo. | Se o paciente já pagou a entrada, é contrato: usar o botão "Cancelar" da aba Contratos ou acionar o Time de Riscos. |
| "O paciente diz que não recebeu o link." | Celular errado, WhatsApp do paciente não recebe, ou o paciente ainda não chegou na etapa da entrada. | Verificar o celular informado. Se a proposta está Em aberto, usar "Reenviar link ao paciente" na aba Simulações. | Escalar pro Time de Riscos se o número está correto e ainda assim não chegou. |
| "Está parado no modal de manutenção e a clínica não pode esperar." | Flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE` ativa. | Alinhar com o cliente que é uma janela de manutenção planejada e que **o próprio modal pede pra não acionar suporte**. Anotar o caso pra acompanhar. | Escalar pro Time de Riscos se a janela está demorando além do previsto ou se outras clínicas começarem a reclamar do mesmo. |
| "Quero ver os Capix antigos da minha clínica." | A clínica não conhece o Portal Capix. | Orientar: **Meios de pagamento → Capix → aba Contratos** (contratos) e **aba Repasses** (valores recebidos). Dá pra buscar por nome ou CPF e filtrar por data e status. Não há exportação em planilha. | Se a clínica precisar de algo que o portal não mostra, pedir ao Time de Riscos (Denis Maeda, issue #37). |
| "Uma simulação que acabei de fazer não aparece na lista." | A lista do portal pode levar alguns segundos para mostrar registros novos. | Pedir pra recarregar a página em instantes. | Se continuar sem aparecer, escalar pro Time de Riscos. |
| "O botão de WhatsApp do Capix abre conversa com um número antigo." | Configuração do número de suporte no dash. O número oficial é (11) 4210-5578. | Passar o número novo pro cliente. | Avisar o Time de Riscos pra corrigirem a configuração. |

**Para quem escalar:** **Time de Riscos** (interno Capim) para tudo do Capix: acesso da clínica, problemas de simulação, cancelamento, valores e histórico (Denis Maeda, issues #35, #36 e #37). Para o cliente, o canal de suporte Capix é o telefone **(11) 4210-5578**.

## > 6. ⚠️ Limitações conhecidas

* **Sem tempo limite na análise:** a tela fica carregando indefinidamente se a análise não responder.
* **Sem botão de cancelar proposta** antes do aceite; o caminho é o telefone de suporte Capix.
* **Valor da parcela sem multa e juros:** numa parcela atrasada, o valor exibido na aba Contratos é menor do que o paciente deve hoje.
* **Atraso só por parcela:** o status do contrato continua **Ativo** mesmo com parcela atrasada.
* **Sem aviso antecipado de paciente bloqueado:** na lista de Simulações, nada indica que o paciente tem contrato ativo; a clínica só descobre ao tentar contratar.
* **Sem exportação** das abas do portal (não há botão de baixar planilha) e sem ordenação por coluna.
* **Sem opção de quitação antecipada** visível na tela da clínica.
* **Divergência entre texto e código do horário de sábado**: o aviso fala "até 16h", o corte real é 14h.
* **Exceção fixa de clínica** (`41201`) que ignora o corte de horário Capix. 🚧 PENDENTE: confirmar razão.
* **Limite de R$ 1.000 por simulação**, e não dá pra emendar simulações pro mesmo paciente enquanto o contrato anterior não for quitado.
* **Sem integração de cobrança com Maquininha**: o pagamento do paciente é feito direto com a Capim, totalmente fora da maquininha da clínica.

## > 7. 🗺️ Próximos passos [opcional]

* 🚧 PENDENTE: quitação antecipada pelo paciente.
* 🚧 PENDENTE: exibir multa e juros no valor da parcela atrasada.
* 🚧 PENDENTE: aviso de validade das simulações e de paciente bloqueado direto na lista de Simulações.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: Portal Capix, aba Simulações, com os status Em aberto, Enviada ao paciente, Contratada e Encerrada]

[INSERIR PRINT: Portal Capix, aba Contratos, com uma linha aberta mostrando as parcelas]

[INSERIR PRINT: Portal Capix, aba Repasses]

[INSERIR PRINT: modal "Andamento da proposta"]

[INSERIR PRINT: tela de dados do paciente, sem campo de valor]

[INSERIR PRINT: tela de valor e propostas, com as 3 opções mostrando entrada e valor que a clínica recebe]

[INSERIR PRINT: modal "Link enviado ao paciente!"]

[INSERIR PRINT: aviso de horário exibido fora do horário Capix]

[INSERIR PRINT: aviso de paciente não elegível (CPF não encontrado / menor de idade)]

[INSERIR PRINT: `ModalPatientOngoingContract` (paciente com contrato em andamento)]

[INSERIR PRINT: formulário de solicitação de cancelamento de contrato]

[INSERIR PRINT: `ServiceUnavailableModal` (manutenção)]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Conceito e posicionamento**

* [x] Capix "empréstimo pra clínica" (capital de giro, antecipação, compra de equipamento) existe ou está em construção, ou o briefing do guia estava equivocado? Se existir, é o mesmo Capix da tela `/finance/microcredits` ou é outro produto? **Resposta:** Capix não é empréstimo nem crédito, nem para a clínica nem para o paciente; pela lei, o produto não se encaixa nessa categoria. Qualquer pedido de empréstimo para a clínica não é Capix. (Denis Maeda, issue #32)
* [x] Relação oficial entre Capix e BNPL (aparecem lado a lado em "Créditos disponíveis" no resumo de agendamento). **Resposta:** são produtos diferentes (documentação do Portal Capix no repositório do dash, novembro de 2026). A tela do agendamento que mostrava os dois juntos era do experimento "simular Capix a partir do agendamento", que foi desligado. (Denis Maeda, issue #31)

**Acesso e gating**

* [ ] Critério para uma clínica ter o Capix habilitado: quem decide, com base em quê? (A confirmação de acesso de uma clínica é feita com o Time de Riscos, segundo Denis Maeda, issue #35.)
* [ ] Restrição de papel dentro da clínica pra abrir uma simulação (admin/recepção/dentista)? No código do dash não há.
* [ ] Razão da clínica `41201` ser exceção fixa ao corte de horário.
* [ ] Horário oficial de funcionamento Capix no sábado: 14h (código) ou 16h (texto exibido)?

**Operação e fluxo**

* [ ] Tempo esperado da análise do paciente (a tela hoje espera indefinidamente).
* [x] Experiência do usuário quando o estado é `rejected` (não há tratamento explícito no front). **Resposta:** por enquanto não existe reprovação por análise. Os casos "reprovados" são CPFs não localizados ou de menores de idade, ambos não elegíveis. (Denis Maeda, issue #42) No código de novembro de 2026, a tela mostra um aviso com o motivo e o botão "Simular outro paciente".
* [x] Existe expiração automática da proposta enviada ao paciente? Quanto tempo? **Resposta:** a entrada deve ser paga no mesmo dia, senão a proposta expira. (Denis Maeda, issue #38) O dash informa o corte às 23h.
* [x] Caminho oficial pra cancelar uma proposta enviada antes do aceite. **Resposta:** acionar o telefone de suporte Capix, (11) 4210-5578. (Denis Maeda, issues #28 e #39)
* [ ] Caminho oficial pra quitação antecipada do paciente.
* [x] Onde a clínica enxerga (se enxerga) o status de atraso/inadimplência de Capix dos pacientes dela. **Resposta:** em julho de 2026 a clínica não enxergava; estava em desenvolvimento. (Denis Maeda, issue #41) No código do dash de novembro de 2026, a aba Contratos do Portal Capix mostra o status de cada parcela (Atrasada, Expirada etc.). Ver item no ✅ Validar.
* [ ] O que a clínica deve fazer quando um repasse fica em "Pendente Confirmação"? Existe alguma ação do lado da clínica, ou é sempre do lado da Capim?
* [ ] Bugs técnicos da tela Capix (tela travada, portal que não carrega, número de WhatsApp errado) também vão para o Time de Riscos ou para outro time?

**Histórico e relatórios**

* [x] Tela ou relatório onde a clínica vê o histórico dos Capix contratados (existe? está no roadmap?). **Resposta:** em julho de 2026 estava em desenvolvimento e ainda não existia; a clínica só via mediante pedido direto ao suporte. (Denis Maeda, issues #29 e #40) Hoje o Portal Capix (Meios de pagamento → Capix) tem as abas Simulações, Contratos e Repasses, para toda clínica com Capix habilitado (código do dash, novembro de 2026).

**Comercial e tarifas**

* [x] Tabela oficial de deságio por número de parcelas (no front, 90/85/80/75% para 1/2/3/4x); ela varia por clínica? **Resposta:** desconsiderar esses números. Há uma política nova, o desconto não depende da quantidade de parcelas, e nenhuma tabela de taxas será divulgada para a clínica. (Denis Maeda, issues #33, #43 e #46)
* [x] Teto de R$ 1.000 por simulação ainda é o oficial? **Resposta:** sim, R$ 1.000,00 ainda é o teto oficial. (Denis Maeda, issue #44)

**Canais e SLAs**

* [x] O WhatsApp `+55 11 96173-3162` é o canal oficial para o cliente em casos de Capix, ou é só pra essa fase? **Resposta:** esse número já foi desligado. O telefone atual de suporte Capix é (11) 4210-5578; os outros foram desativados. (Denis Maeda, issues #28 e #45)
* [ ] O tutorial da contratação indica o WhatsApp geral de suporte da Capim, e não o telefone de suporte Capix. É esse o canal certo para quem está no tutorial?
* [ ] Canal pelo qual o suporte fica sabendo quando `FF_MICROCREDITS_SERVICE_UNAVAILABLE` é ligada/desligada.
* [ ] SLA esperado de resposta do Time de Riscos para os cenários Capix listados na tabela.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [x] "Capix é pagamento pro paciente, clínica recebe à vista com deságio" como definição oficial. **Resposta:** confirmado em parte. Capix não pode ser chamado de crédito (Denis Maeda, issue #32), e o modelo de entrada fixa está desatualizado desde dezembro de 2025: a entrada varia (Denis Maeda, issues #47 e #48).
* [x] "Os percentuais 90/85/80/75% são apenas a simulação local do front e podem divergir do líquido real do backend." **Resposta:** não usar esses valores. O desconto não depende da quantidade de parcelas. (Denis Maeda, issue #46)
* [ ] "O modal de paciente bloqueado oferece 'avisar quando puder contratar novamente' via `sendRenewalInterest`": confirmar como esse aviso é entregue ao usuário e quando.
* [x] "Existe um experimento de simular Capix a partir do agendamento e do perfil do paciente, controlado por `isActiveContactOnCreditProductsClinic`": ainda está ativo? **Resposta:** experimento desligado. (Denis Maeda, issue #31)
* [ ] Telefone de suporte no dash: desde 12/11/2026 o número dos botões de WhatsApp do Capix vem de uma configuração do ambiente, e o valor padrão no código ainda é o número antigo (11) 96173-3162. Confirmar que produção está configurada com (11) 4210-5578.
* [ ] Atraso visível para a clínica: em julho de 2026 a resposta foi que a clínica não enxergava atraso (issue #41), mas o código de novembro de 2026 mostra o status de cada parcela (Atrasada, Expirada) na aba Contratos. Confirmar que essa é a experiência oficial hoje.
* [ ] Histórico para a clínica: em julho de 2026 a resposta foi que só saía por pedido ao suporte (issues #29 e #40), mas o código de novembro de 2026 libera o Portal Capix para toda clínica com Capix habilitado. Confirmar que o portal já está em produção para todas essas clínicas.
* [ ] Aviso de não elegível: além de "CPF não encontrado" e "Paciente menor de idade", o código tem uma mensagem genérica ("Este paciente não tem crédito disponível no momento"). Confirmar se ela ainda pode aparecer, já que não existe reprovação por análise (issue #42), e ajustar o texto, que usa a palavra "crédito" (issue #32).
* [ ] Fluxo atual: no código, o paciente escolhe a quantidade de parcelas e o primeiro vencimento pelo link, e a clínica escolhe o valor depois da análise. Confirmar que esse é o fluxo de todas as clínicas fora do experimento de Pix Automático.
* [ ] Menu: em clínicas com a tela unificada de "Parcelamentos", o item "Capix" não aparece separado no menu. Confirmar como essas clínicas chegam ao Portal Capix.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-backend` e `capim-dash-frontend`, podem ser tratados como confirmados:

* Acesso às telas Capix depende do Capix estar habilitado no cadastro da clínica (`capix_enabled`); sem isso, as rotas caem em "página não encontrada" (código do dash, novembro de 2026).
* Valor permitido por simulação: R$ 100 a R$ 1.000 (validação no front; teto confirmado por Denis Maeda, issue #44).
* Quantidade de parcelas: 1 a 4.
* Entrada: varia por proposta, paga pelo paciente via Pix no mesmo dia (Denis Maeda, issues #38, #47 e #48).
* Verificação a cada 5 segundos enquanto a análise está em andamento.
* Paciente com contrato em andamento abre `ModalPatientOngoingContract`, com opção `sendRenewalInterest`.
* Horário Capix codificado: seg a sex 8h às 20h, sáb 8h às 14h, domingo bloqueado, exceção pra clinic id `41201`.
* Modal de manutenção controlado pela flag `FF_MICROCREDITS_SERVICE_UNAVAILABLE`.
* Backoffice tem `/backoffice/credit_applications` para o time interno; **não é tela da clínica**. A clínica tem o Portal Capix.
* Portal Capix lê só os dados da própria clínica logada; uma clínica nunca vê dados de outra.
