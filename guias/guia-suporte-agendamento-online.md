# 📘 Guia de Suporte: Agendamento online

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: em rollout controlado por feature flag `FF_SELF_APPOINTMENT_LINKS_ENABLED`. Convivem hoje duas implementações: a versão antiga de "agendamento avulso" (um link por paciente) e a nova de **Links de agendamento reutilizáveis** (um link por tipo de consulta, compartilhável publicamente). 🚧 PENDENTE: confirmar percentual de clínicas com a flag nova ligada e data prevista de GA.

## 1. 🎯 Visão geral

Agendamento online é o **link público que a clínica compartilha** (no site, no Instagram, no WhatsApp, no rodapé do e-mail) para o paciente marcar consulta sozinho, sem ligar pra recepção. O paciente abre o link, vê o "cardápio" da clínica (tipo de consulta, dentistas disponíveis, duração), escolhe data e hora, preenche os dados básicos (nome, CPF, celular) e confirma. O agendamento entra automaticamente na **Agenda da clínica como "Pendente"**, pra recepção dar uma olhada e validar.

Resolve três dores: telefone ocupado na hora do almoço (paciente acaba desistindo), recepcionista interrompida o tempo todo pra marcar consulta (que não é o trabalho dela) e clínica que quer aparecer "moderna" no Instagram com botão de marcar consulta direto no perfil. ✅ Validar com produto se há outras dores oficiais que o time usa pra vender a feature.

**Para quem é:** todas as clínicas cliente da Capim que tenham a feature flag `FF_SELF_APPOINTMENT_LINKS_ENABLED` ativa. ✅ Validar com produto se há gating por plano além da flag.

**Quem ativa, personaliza e compartilha o link dentro da clínica:** qualquer usuário com acesso à Agenda consegue abrir a gaveta de Links de agendamento (pelo widget de atalhos do dashboard, pela sidebar da Agenda, ou pelo "+" de novo evento na Agenda V2) e criar um link novo. ✅ Validar com produto se há restrição por papel (ex: só admin pode criar).

**Onde se encaixa no produto Capim:** é uma das três entradas automáticas de agendamento que existem hoje, junto com a Central da Camila (IA no WhatsApp) e a marcação manual da recepção. Tudo cai no mesmo lugar: a **Agenda**. Conecta também com Pacientes (cria ou atualiza ficha automaticamente) e com Configurações da Agenda (a **disponibilidade do dentista controla os horários que aparecem pro paciente escolher**).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Feature flag `FF_SELF_APPOINTMENT_LINKS_ENABLED` ativa pra clínica.
* Pelo menos um dentista cadastrado **com disponibilidade ativa** em Configurações → Configurar disponibilidade. Se o dentista não tem disponibilidade ativa, ele **não aparece na lista** de dentistas selecionáveis ao criar o link, e mesmo que aparecesse o paciente não conseguiria marcar (o backend rejeita com erro "dentista indisponível").
* Logotipo da clínica configurado (opcional, mas recomendado pra ficar bonito na tela que o paciente vê). O logo vem do **cadastro principal da clínica** e é replicado em todos os links, não dá pra trocar logo por link.

**Onde acessar (lado da clínica, pra criar/gerenciar o link):**

* Menu lateral → Atendimento → Agenda → sidebar esquerda → atalho "Link de agendamento".
* Alternativamente: na Agenda, no botão "+" de novo evento, opção "Link de agendamento".
* Também via widget de atalhos no Dashboard inicial.

**Fluxo típico (criar um link de agendamento):**

1. A clínica abre a gaveta "Link de agendamento". Se ainda não tem nenhum link criado, ela cai na tela vazia com botão "Começar". Se já tem, vê a lista dos links existentes.
2. Clica em "Criar novo link de agendamento". Abre o formulário com os campos:
   * **Título do agendamento** (opcional). Ex: "Avaliação inicial", "Limpeza", "Retorno de ortodontia". Se ficar vazio, o título padrão é "Agendamento de {duração} minutos".
   * **Duração** (obrigatório). Três opções fixas: 15 min, 30 min ou 60 min.
   * **Dentista** (obrigatório). Lista só os dentistas que têm disponibilidade ativa. Pode marcar **mais de um** (o paciente vai escolher entre os marcados).
   * **Marcadores** (opcional). Os mesmos marcadores que já existem na Agenda. Os agendamentos criados pelo link herdam esses marcadores.
   * **Observações** (opcional). Texto livre que vai aparecer na tela do paciente e no agendamento que chega na Agenda.
3. Clica em "Continuar" e cai numa tela de confirmação que mostra um preview de como o card vai ficar.
4. Confirma com "Criar link". O link entra na lista de links da clínica.

**Personalização disponível hoje:**

* **Logo da clínica** na tela do paciente: vem automaticamente do cadastro da clínica (não é configurável por link).
* **Nome e endereço da clínica** na tela do paciente: vêm do cadastro da clínica.
* **Título do agendamento**, **duração**, **dentistas que aparecem como opção**, **marcadores** e **observações**: configuráveis por link.
* **Mensagem padrão pra mandar no WhatsApp**: o botão "Enviar no WhatsApp" gera um texto pronto no formato `Olá! Tudo bem? Aqui é da clínica {nome}. Escolha o dia e o horário da sua consulta com um dos nossos dentistas: {link}`. ✅ Validar se há plano de tornar essa mensagem customizável.

**Fluxo típico (compartilhar o link):**

* No card do link na lista, dois botões:
  * **Copiar link**: copia o URL pra área de transferência. O formato é `https://agenda.capim.com.br/#/agenda/self_appointment_links/{uuid}` (✅ validar URL exata em produção).
  * **Enviar no WhatsApp**: abre o WhatsApp Web com a mensagem padrão preenchida, pronta pra mandar pro paciente.
* O link é estável e reutilizável: a clínica pode colar no Instagram bio, no site, no rodapé do e-mail. **Não há QR code gerado pelo dashboard hoje**, se a clínica quiser QR code precisa usar uma ferramenta externa (encurtador, gerador de QR).

**Fluxo típico (lado do paciente, marcando consulta):**

O paciente abre o link no celular ou no computador e passa por estes passos (sem login):

1. **Boas-vindas**: vê logo, nome e endereço da clínica, o título e a duração do agendamento e a lista de dentistas que podem atender. Clica em "Agendar consulta".
2. **Dados do paciente**: preenche nome completo, CPF, celular e marca se já é paciente da clínica ("Sim" ou "Não"). O CPF é validado (CPF inválido bloqueia). Esse passo identifica ou cria o paciente:
   * Se o **CPF bate** com um paciente existente da clínica, atualiza o cadastro.
   * Se não, tenta por **celular com similaridade de nome**. Pacientes que já são da clínica passam por um limiar mais brando (similaridade de 80 no telefone e 90 no nome). Pacientes que se declaram novos ("Não") passam por limiar mais rígido (95 no telefone, 100 no nome).
   * Se não encontra nada, **cria uma ficha nova** com origem `self_appointment_link`.
3. **Mês**: escolhe o dentista (se o link permite mais de um) e o dia no calendário. Os dias bloqueados ou sem horário disponível aparecem inativos.
4. **Dia**: vê a lista de horários disponíveis no dia escolhido. Os horários respeitam a disponibilidade do dentista, a antecedência mínima e máxima configurada (em horas/dias), os bloqueios da agenda e os agendamentos já existentes.
5. **Confirmação**: revisa nome, data, horário e dentista. Clica em "Confirmar".
6. **Agendamento criado**: vê uma tela final com os dados do agendamento, telefone da clínica e botões "Copiar telefone" e "Falar no WhatsApp". É por aqui que ele entra em contato se quiser mudar (não dá pra desmarcar pelo link).

**Como aparece na Agenda da clínica:**

* O agendamento entra **imediatamente** na Agenda do dentista escolhido, com `created_by: patient` no banco.
* **Status: "Pendente"** (esse é o estado inicial automático de qualquer agendamento). A recepção precisa abrir, conferir e mudar pra "Confirmado".
* O **título** do agendamento na Agenda fica como `Nome do paciente` ou, se o link tem título, `Nome do paciente (Título do link)`.
* Os marcadores do link são aplicados.
* As observações do link viram a observação do agendamento.

**Notificação pra clínica de que entrou agendamento novo:**

* O modelo de **alertas internos do dashboard** (sininho/AlertsView) dispara hoje em dois eventos: **agendamento confirmado** e **agendamento cancelado**. Como o agendamento que veio do link entra como "Pendente" (e não "Confirmado"), **não dispara alerta automaticamente quando o paciente marca**. 🚧 PENDENTE: confirmar com produto se existe outro mecanismo (e-mail, push, WhatsApp pra clínica) avisando que entrou agendamento novo pelo link.
* Na prática hoje, o jeito de a clínica ver os agendamentos pendentes é abrir a Agenda e olhar.

**Notificação pro paciente:**

* Os lembretes automáticos (1h e 24h antes do horário) são disparados se o paciente tem celular válido e o agendamento é futuro. Canal: WhatsApp. Mesmas regras dos agendamentos criados manualmente.
* No fim do fluxo do link, o paciente já vê os dados confirmados na tela. Se há ou não um WhatsApp imediato de "agendamento marcado" no ato da criação, ✅ validar com produto (o backend chama `TimeSlots::Notifications::Create` quando o paciente tem telefone e a data é futura, mas o tipo da mensagem depende do template).

**⚠️ Atenção:**

* O link **não cobre paciente menor de idade com responsável legal**, nem casos especiais de cadastro (paciente estrangeiro sem CPF). A validação obriga CPF.
* O link **não pede e-mail nem confirmação por código**. A identificação é por CPF + celular.
* O link **mostra todos os dentistas marcados, sem filtro de especialidade**. Se a clínica tem ortodontista e clínico geral no mesmo link, o paciente escolhe entre os dois sem o sistema sugerir um pra cada tipo de consulta. Para separar, a clínica cria links diferentes.
* O paciente **pode marcar mesmo se nunca teve ficha** na clínica. Nesse caso, a ficha é criada na hora com origem `self_appointment_link`. A clínica completa os outros campos da ficha no primeiro atendimento.
* **Não há limite por padrão** de quantos links uma clínica pode criar. A lista é paginada (5 links por página).
* **Excluir um link** desativa o URL: quem tentar abrir depois recebe erro. Agendamentos que já entraram pelo link continuam na Agenda normalmente (o backend usa `dependent: :nullify`, só desvincula).

## > 3. 💼 Casos de uso esperados

* **Caso 1, clínica coloca link no Instagram bio:** cria um link único "Avaliação inicial de 30 min" com os dois dentistas marcados, copia o URL e cola no perfil do Instagram. Pacientes que clicam caem no fluxo guiado e marcam sozinhos. A recepção abre a Agenda na segunda de manhã, vê os "Pendente" que entraram no fim de semana e confirma um a um.
* **Caso 2, dentista quer separar Avaliação e Retorno:** cria dois links diferentes, "Avaliação inicial de 60 min" e "Retorno de 15 min". Cada um com sua duração e seu título. Manda o link de Retorno só pros pacientes em tratamento, e o de Avaliação no Instagram.
* **Caso 3, recepcionista usa o link como atalho no atendimento:** quando o paciente liga e ela está sobrecarregada, manda o link no WhatsApp dele com o botão "Enviar no WhatsApp" e pede pra ele finalizar sozinho. Útil em horários de pico.
* **Caso 4, paciente liga pedindo pra mudar o horário do que marcou pelo link:** a tela final mostrada ao paciente já orienta a ligar pra clínica (não dá pra remarcar pelo link). A recepção arrasta o agendamento na Agenda normalmente.
* **Caso 5, clínica quer divulgar Black Friday:** cria um link específico "Limpeza promocional de 30 min" com marcador "Promo", divulga no WhatsApp em massa. Depois da campanha, exclui o link.

## > 4. ❓ FAQ

**P: Como a clínica gera o link pela primeira vez?**

R: Pela Agenda. Há três entradas: pelo widget de atalhos do Dashboard ("Link de agendamento"), pela sidebar da Agenda (botão "Link de agendamento") ou pelo "+" de novo evento da Agenda V2 (opção "Link de agendamento"). Em todos os três, abre a mesma gaveta. Se a clínica não tem link nenhum, a gaveta abre na tela "Crie links para enviar aos seus pacientes" com botão "Começar".

**P: Posso ter mais de um link ativo ao mesmo tempo?**

R: Pode. A lista de links é paginada e a clínica pode criar quantos quiser. Cada link tem um URL único (UUID) e configuração independente. ✅ Validar com produto se há limite máximo não documentado.

**P: Dá pra customizar a foto ou cor do link?**

R: Foto, sim: o **logo da clínica** aparece automaticamente na tela do paciente, vindo do cadastro principal da clínica. Não dá pra trocar o logo por link (todos os links da clínica mostram o mesmo logo). Cor de fundo, tema, fontes: não tem customização hoje.

**P: O paciente precisa estar cadastrado na clínica antes?**

R: Não. Se o CPF não bate, o sistema cria uma ficha nova com origem `self_appointment_link`. A clínica completa os outros campos no primeiro atendimento.

**P: Como o sistema decide se é o mesmo paciente ou um novo?**

R: Em ordem: (1) busca por CPF exato; (2) busca por celular com similaridade de nome (Levenshtein); (3) busca por nome com similaridade. Pacientes que se declararam "já sou da clínica" passam por limiar mais brando (80% no telefone, 90% no nome); quem disse "não sou" passa por limiar mais rígido (95%/100%). Se nada bate, cria ficha nova.

**P: Por que esse dentista não aparece como opção no link?**

R: Pra aparecer na lista de seleção do formulário, o dentista precisa ter **disponibilidade ativa** em Configurações → Configurar disponibilidade. Se está como inativa ou nunca foi criada, ele some da lista. Pedir pra clínica verificar a disponibilidade desse dentista.

**P: O paciente disse que não tem horário disponível no link, mas a agenda tem buraco.**

R: A lista de horários respeita: (1) janelas de trabalho do dentista (configuradas na Disponibilidade dele), (2) antecedência mínima (`min_hours_in_advance`) e máxima (`max_hours_in_advance`) configuradas na Disponibilidade, (3) bloqueios criados na Agenda (almoço, folga, feriado), (4) agendamentos já existentes que ocupam o slot. Se a clínica acha que deveria ter horário, verificar primeiro a Disponibilidade. Em particular, antecedência mínima alta (ex: 24h) corta os horários do dia atual e do dia seguinte.

**P: Por que o agendamento que veio do link entra como "Pendente"?**

R: É o estado inicial padrão de qualquer agendamento no sistema (manual ou automático). A recepção precisa confirmar manualmente pra mudar pra "Confirmado". É proposital: dá um filtro humano entre o que o paciente marcou e o que vira commit da agenda.

**P: A clínica não está vendo notificação quando entra agendamento novo pelo link.**

R: Não há alerta automático no sininho do dashboard pra agendamento criado pelo link, porque o sininho dispara em "confirmado" e "cancelado", e o link cria como "pendente". O jeito hoje é abrir a Agenda e olhar os pendentes. 🚧 PENDENTE: confirmar se há mecanismo alternativo de aviso (e-mail pra clínica, WhatsApp interno) e como ativar.

**P: O paciente quer mudar o horário do que marcou pelo link. Tem como?**

R: Pelo link, não. A tela final que o paciente vê depois de marcar mostra o telefone da clínica com botões "Copiar telefone" e "Falar no WhatsApp", e orienta a ligar pra alterar. A recepção remarca direto na Agenda.

**P: Posso excluir um link sem perder os agendamentos que entraram por ele?**

R: Pode. Excluir o link desativa o URL (quem abrir depois recebe erro), mas os agendamentos já criados continuam na Agenda. O backend só desvincula a referência (não apaga os time_slots).

**P: Existe QR code do link gerado pelo Capim?**

R: Não hoje. A clínica que quiser QR code usa um gerador externo (encurtador, ferramenta gratuita) em cima do link copiado. ✅ Validar com produto se há plano de adicionar QR code nativo.

**P: O link novo (Links de agendamento) substitui o agendamento avulso antigo?**

R: Sim, é a evolução. Quando a flag `FF_SELF_APPOINTMENT_LINKS_ENABLED` está ligada, a clínica vê a gaveta de Links reutilizáveis. Quando está desligada, vê o fluxo antigo de gerar um link único por paciente. ✅ Validar com produto o cronograma de aposentar o fluxo antigo.

**P: Posso restringir o link a um tipo de procedimento específico?**

R: Por procedimento ou especialidade, não. Pode definir título, duração e marcadores, e pode escolher quais dentistas aparecem como opção. Pra separar avaliação de retorno (ou clínico geral de ortodontista), o caminho é criar links separados.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo criar link, não aparece o atalho." | A feature flag `FF_SELF_APPOINTMENT_LINKS_ENABLED` está desligada pra clínica. Sem ela, a gaveta de Links reutilizáveis não aparece e o atalho cai no fluxo antigo. | Confirmar se a clínica deveria ter a flag ligada (consultar lista interna). | Escalar pra produto/eng pedindo ativação da flag, informando ID da clínica. |
| "Criei o link mas o dentista X não aparece na lista de seleção." | Esse dentista está sem disponibilidade ativa em Configurações → Configurar disponibilidade. | Pedir pra clínica abrir a configuração de disponibilidade do dentista e ativar. Depois, recarregar a tela de criação do link. | Se a disponibilidade está ativa e ainda assim ele não aparece, escalar pra eng com ID da clínica e ID do dentista. |
| "Paciente clica no link e vê erro." | Link foi excluído, UUID errado, ou clínica sem flag ativa no backend. | Confirmar se o link ainda aparece na lista da clínica. Pedir pro paciente abrir em aba anônima pra descartar cache. | Se o link aparece pra clínica mas o paciente recebe erro, escalar pra eng com o UUID do link e a hora do teste. |
| "Não aparece horário nenhum pro paciente escolher." | Disponibilidade do dentista sem janelas no dia, antecedência mínima muito alta, todos os slots ocupados ou bloqueio cobrindo o dia inteiro. | Verificar com a clínica: janelas de trabalho do dentista, valor de antecedência mínima/máxima, bloqueios criados no período. Pedir pro paciente tentar outra data. | Se a configuração está correta e ainda assim não aparece nada, escalar pra eng com ID do link, ID do dentista e data tentada. |
| "Paciente marcou mas não aparece na agenda do dentista." | Possível dessincronização: o dentista carregou a agenda antes do link criar o evento. | Pedir pra recarregar a página da Agenda (F5) ou trocar de dia/voltar. Conferir que o dentista escolhido pelo paciente é o que está sendo olhado na Agenda. | Se mesmo após recarregar não aparece e a clínica tem o nome do paciente ou horário, escalar pra eng com esses dados. |
| "Marquei duas vezes pelo link e ficou duplicado." | O paciente abriu o link em duas abas ou clicou duas vezes em "Confirmar". O backend valida sobreposição, mas se as duas requests batem ao mesmo tempo em slots diferentes pode passar. | Recepção cancela um dos dois manualmente. | Se o cliente reclamar que ficou um "fantasma" sem dono, escalar pra eng com ID dos dois agendamentos. |
| "Paciente disse que o CPF não passou." | CPF digitado errado (validação rejeita CPF inválido). | Pedir pro paciente conferir os dígitos. | Caso paciente estrangeiro sem CPF, não há solução pelo link hoje: orientar a clínica a marcar manualmente. |
| "Quero mudar a mensagem que vai no WhatsApp." | A mensagem do botão "Enviar no WhatsApp" é fixa no front, não é customizável. | Explicar a limitação. A clínica pode copiar o link e mandar com texto próprio em vez de usar o botão. | Escalar pra produto como feedback de funcionalidade. |
| "Link aparece sem logo da clínica." | Cadastro da clínica não tem logo, ou cache de 1h ainda guarda a versão sem logo (o backend cacheia o logo por 1 hora). | Confirmar que a clínica adicionou logo em Configurações da clínica. Pedir pra aguardar até 1 hora pra o cache invalidar, ou recarregar com cache limpo. | Se o logo está cadastrado e mesmo depois de 1h não aparece, escalar pra eng com ID da clínica. |

**Para quem escalar:** **Time de Sustentação** (canal interno Capim). Toda issue de bug, ativação de feature flag ou troubleshooting que envolva backend entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Duração restrita a 15, 30 ou 60 minutos.** Não dá pra criar link de 45 min, 90 min ou personalizado.
* **Não há filtro por procedimento ou especialidade.** Pra separar tipos de consulta, criar links diferentes.
* **Logo não é customizável por link.** Todos os links da clínica usam o logo principal do cadastro.
* **Sem QR code nativo.** Quem quer QR code usa gerador externo.
* **Mensagem de WhatsApp não é editável.** O botão "Enviar no WhatsApp" usa texto fixo do front.
* **Paciente sem CPF não consegue marcar.** Validação obrigatória.
* **Agendamento entra como "Pendente", sem alerta automático** no sininho do dashboard pra avisar a clínica. A clínica precisa olhar a Agenda.
* **Paciente não consegue cancelar nem remarcar pelo link.** Só ligando pra clínica.
* **Cache de logo de 1 hora.** Se a clínica trocou o logo principal, pode demorar até 1 hora pra aparecer no link.
* **Sem confirmação por código (OTP) no celular.** Identificação por CPF + celular sem verificação adicional. Em tese alguém pode marcar consulta "em nome de" outra pessoa.
* **Mesmo logo na confirmação e na tela inicial**, mas a tela final pós-confirmação não exibe logo (mostra só telefone da clínica e botões de copiar/WhatsApp). ✅ Validar se isso é intencional.

## > 7. 🗺️ Próximos passos [opcional]

* GA dos Links de agendamento reutilizáveis e aposentadoria do fluxo antigo (agendamento avulso). 🚧 PENDENTE.
* Customização de mensagem padrão do WhatsApp. 🚧 PENDENTE.
* QR code nativo no card do link. 🚧 PENDENTE.
* Alerta automático no dashboard quando entra agendamento pendente pelo link. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: gaveta "Link de agendamento" no estado vazio com botão "Começar"]

[INSERIR PRINT: formulário de criação do link com os campos título, duração, dentista, marcadores, observações]

[INSERIR PRINT: tela de confirmação do link com preview do card]

[INSERIR PRINT: lista de links existentes com os botões Copiar link e Enviar no WhatsApp]

[INSERIR PRINT: tela de boas-vindas vista pelo paciente, com logo, nome da clínica e card do agendamento]

[INSERIR PRINT: formulário de dados do paciente (nome, CPF, celular, "já é paciente?")]

[INSERIR PRINT: calendário do mês com dias disponíveis/indisponíveis]

[INSERIR PRINT: lista de horários do dia escolhido]

[INSERIR PRINT: tela final "Agendamento criado" com dados, telefone da clínica e botões de copiar/WhatsApp]

[INSERIR PRINT: agendamento aparecendo na Agenda da clínica com status "Pendente"]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Ativação e gating**

* [ ] Percentual atual de clínicas com `FF_SELF_APPOINTMENT_LINKS_ENABLED` ligada e data prevista de GA.
* [ ] Há gating por plano (além da flag) pra usar Agendamento online?
* [ ] Há restrição por papel pra criar/editar/excluir links? (Pode dentista comum? Só admin?)
* [ ] Cronograma de aposentar o fluxo antigo (agendamento avulso por paciente).

**Notificações e avisos pra clínica**

* [ ] Existe algum canal de aviso pra clínica quando entra agendamento novo pelo link (e-mail, WhatsApp interno, push), além da consulta manual da Agenda?
* [ ] No fim do fluxo, o paciente recebe WhatsApp imediato de "agendamento marcado", ou só os lembretes (1h e 24h antes)?

**Limites e configuração**

* [ ] Há limite máximo de links que uma clínica pode criar simultaneamente?
* [ ] Há plano de customizar a mensagem padrão do WhatsApp (botão "Enviar no WhatsApp")?
* [ ] Há plano de adicionar QR code nativo no card do link?
* [ ] URL exata em produção (`agenda.capim.com.br` ou outro domínio).

**Escalação**

* [ ] Canal oficial pra suporte pedir ativação da flag `FF_SELF_APPOINTMENT_LINKS_ENABLED` pra uma clínica específica.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Qualquer usuário da clínica com acesso à Agenda consegue criar link." Inferido do código (não há check de role no form), mas confirmar com produto.
* [ ] "Logo da clínica vem do cadastro principal, não é customizável por link." Confirmado pelo `ClinicLogoResolver`, mas validar com produto se está no roadmap mudar.
* [ ] "Mensagem padrão do WhatsApp é fixa no front." Confirmado no card, mas validar se é por design ou só não chegou ainda.
* [ ] "Cache de logo de 1 hora." Confirmado no `ClinicLogoResolver`, mas vale validar se é configurável.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Agendamento criado pelo link entra com `created_by: patient`, status inicial `pending` (sempre, é o estado inicial padrão de qualquer agendamento).
* Duração do link é restrita a 15, 30 ou 60 minutos (radio fixo no front).
* Pode marcar mais de um dentista por link.
* Dentista só aparece na lista de seleção se tem disponibilidade ativa.
* CPF é obrigatório e validado no upsert do paciente.
* Identificação do paciente segue ordem: CPF exato, depois celular+similaridade de nome, depois nome+similaridade; limiares variam se o paciente se declarou "já sou da clínica" (80/90) ou não (95/100).
* Paciente novo é criado com `creation_source: 'self_appointment_link'`.
* Backend valida sobreposição com agendamentos existentes, bloqueios, antecedência mínima/máxima e janela de trabalho do dentista.
* Lembretes automáticos (1h e 24h antes) seguem as mesmas regras dos agendamentos manuais.
* Excluir link usa `dependent: :nullify`: agendamentos já criados permanecem na Agenda, só desvinculam a referência ao link.
* Logo da clínica é resolvido com cache de 1 hora (`ClinicLogoResolver`).
* Alertas internos do dashboard (sininho) disparam em `appointment_confirmed` e `appointment_canceled`, não em criação de pendente.
