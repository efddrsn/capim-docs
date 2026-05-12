# 📘 Guia de Suporte: Configurações da agenda

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. Cobre todas as clínicas cliente, sem gating por plano.

## 1. 🎯 Visão geral

Configurações da agenda é o conjunto de telas em **Configurações** que define **como a Agenda se comporta** para uma clínica: em que horário cada dentista atende, quais marcadores de cor existem para anotar consultas, em qual fuso horário a clínica opera, como as mensagens de WhatsApp saem para o paciente e como funcionam os envios automáticos de aniversário.

Pense neste módulo como o "painel de controle" por trás do livro de marcações. Quem está aqui não está marcando consulta. Está dizendo pra Agenda o que aceitar e o que não aceitar, e definindo o que o paciente recebe de mensagem.

**Para quem é:** todas as clínicas cliente da Capim, em qualquer plano.

**Quem vê e edita o quê dentro da clínica:** as telas de Configurações da agenda são, na prática, do **admin/dono da clínica**. O fuso horário, por exemplo, **só pode ser alterado por admin** (usuários sem o papel de admin veem o campo desabilitado e o tooltip "Somente admins podem alterar esta configuração."). 🚧 PENDENTE: confirmar com produto se as demais telas (Disponibilidade, Marcadores, Notificações, Lembretes de aniversário) têm a mesma trava ou se qualquer usuário interno consegue mexer.

**Onde se encaixa no produto Capim:** é um módulo de bastidor. Toda mudança feita aqui é consumida principalmente pela **Agenda** (horário válido pra marcar, marcador que aparece no agendamento, faixa de horário visível, mensagem que sai). Tem dependência também com **Pacientes** (o cadastro precisa ter celular pra mensagem sair) e com **Central da Camila** (o link público de marcação e os envios automáticos respeitam a disponibilidade configurada aqui).

Este guia **não cobre** a Agenda em si (guia separado) nem as Configurações gerais da clínica (logo, dados cadastrais, métodos de pagamento, em outro guia).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Usuário logado, idealmente com papel de admin para as configurações que pedem esse nível (timezone confirmado; demais 🚧 PENDENTE).
* Para Disponibilidade do dentista: o dentista precisa estar cadastrado em **Usuários** com o papel `dentist`.
* Para que o paciente receba notificação: o cadastro dele precisa ter **celular válido**. **O canal é exclusivamente WhatsApp**, não há envio por SMS nem por e-mail.

**Onde acessar:** Menu lateral → Configurações. Dentro de Configurações, este guia trata das seções:

* **Configurar disponibilidade** (URL `/#/settings/availability`): lista de dentistas com a disponibilidade de cada um.
* **Ajustes da agenda** (URL `/#/settings/calendar`): fuso horário e marcadores.
* **Central de notificações** (URL `/#/settings/notifications`): notificações ao paciente e tela de falhas.
* **Lembretes de aniversário** (URL `/#/settings/birthday-reminders`): configuração da mensagem automática de aniversário, integrada à Camila.

A **faixa de horário visível** da agenda (ex: mostrar das 08:00 às 20:00) **não fica em Configurações**: ela é editada dentro da própria Agenda, no botão de ajustes do topo, e a escolha **vale só para o usuário logado** (é uma preferência pessoal, não da clínica). Esse detalhe gera dúvida recorrente, por isso entra neste guia.

### 2.1 Disponibilidade do dentista

Define o horário de trabalho de cada dentista por dia da semana, dentro de quais janelas a Agenda aceita marcar (com alerta quando passar fora) e qual a antecedência permitida quando o paciente marca pelo link público.

**Como configurar:**

1. Configurações → Configurar disponibilidade. A tela lista os dentistas da clínica, cada um com um switch de "Agenda ativa?".
2. Clicar em **Editar** no dentista desejado. Abre a tela de edição.
3. **Antecedência mínima** (em horas): tempo mínimo entre "agora" e o horário marcado para que a marcação online seja aceita. Exemplo: 6 horas. Não permite marcar pra daqui a 1 hora.
4. **Antecedência máxima** (em dias): horizonte máximo no futuro que o paciente pode marcar pelo link público. Exemplo: 45 dias.
5. **Disponibilidade por dia**: para cada dia da semana (de segunda a domingo), ativar o dia e adicionar uma ou mais janelas de horário (ex: segunda 08:00 a 12:00 e 13:30 a 18:00, configurando almoço como o "buraco" entre as duas faixas).
6. Switch **Agenda ativa?** liga ou desliga a disponibilidade do dentista como um todo. Só fica habilitado se houver pelo menos uma janela de horário cadastrada.
7. Salvar.

**Como o sistema lê isso:**

* Antecedência mínima e máxima validam **a marcação pelo link público de agendamento** (paciente marcando sozinho). A recepção marcando manualmente pela Agenda **não é bloqueada** por essas duas regras, mas pode receber alerta de "Fora do horário de trabalho" quando cair fora da janela do dia.
* Para configurar **folgas pontuais** (ex: dentista de férias na próxima semana, feriado interno), a clínica usa o tipo **Bloqueio** dentro da própria Agenda, não esta tela. Esta tela cuida apenas do horário recorrente da semana.
* Almoço também é representado como **ausência de janela** entre dois intervalos do mesmo dia, não como um campo separado de "almoço".

### 2.2 Ajustes da agenda (fuso horário e marcadores)

A tela **Ajustes da agenda** em Configurações tem duas seções.

**Fuso horário da clínica:**

* Campo único de seleção, lista de fusos do Brasil (Brasília, Fernando de Noronha, Manaus, Cuiabá, Campo Grande, Porto Velho, Boa Vista, Rio Branco). Confirmado pelo backend.
* **Só admin pode alterar.** Outros usuários veem o campo desabilitado.
* **Por que importa:** o fuso horário afeta como os horários dos agendamentos são exibidos e validados, e **também afeta o horário de envio das mensagens automáticas** ao paciente (1h e 24h antes da consulta saem de acordo com este fuso).
* Se o fuso estiver errado, **toda a Agenda fica deslocada**. É a primeira coisa a checar quando o cliente reclama de "consulta aparecendo na hora errada".

**Marcadores de calendário:**

* Marcadores são **etiquetas coloridas** que a clínica cria para anotar consultas (ex: "Primeira consulta", "Urgência", "Convênio X").
* Lista atual da clínica aparece em tabela, com botão **Adicionar marcador** no topo.
* Ao criar marcador, escolhe **nome** (texto livre) e **cor** (a paleta tem opções como amarelo, azul claro, azul escuro, turquesa, laranja, rosa, roxo, verde claro, verde escuro, vermelho, violeta).
* É possível **excluir** um marcador pela lista. A clínica usa esses marcadores depois dentro da Agenda, na hora de criar ou editar um agendamento, no campo "Marcador (opcional)".
* ✅ Validar: comportamento ao excluir um marcador que **já está vinculado a agendamentos existentes**: o agendamento perde o marcador, mantém o marcador antigo registrado mas oculto, ou bloqueia a exclusão?

### 2.3 Faixa visível e exibição da agenda

Esta configuração **não fica em Configurações**. Fica dentro da Agenda, no botão de ajustes da própria tela. O motivo: ela é **preferência por usuário**, não da clínica.

O modal de ajustes da agenda permite:

* **Horário visível** (faixa): hora de início e fim que a agenda exibe no grid. Ex: 08:00 às 20:00. Marcações fora dessa faixa **acontecem normalmente no banco**, mas só ficam visíveis se o usuário aumentar a faixa, e geram o alerta "Evento fora da faixa de horário" na tentativa de marcar.
* **Eventos de aniversário** (toggle): exibe ou oculta os aniversariantes do dia na agenda.
* **Eventos de feriado** (toggle): exibe ou oculta feriados.
* **Fins de semana** (toggle): exibe ou oculta sábado e domingo nas visualizações de semana e mês.

Como é preferência por usuário, **mudar aqui não afeta os colegas da clínica**. Cada um vê do seu jeito.

### 2.4 Central de notificações ao paciente

Tela em Configurações → Notificações. Tem duas partes.

**Parte 1, configuração das notificações:** lista os eventos em que a Capim envia mensagem automática ao paciente. Cada item tem um switch "Notificação ativa?" e mostra a **mensagem que será enviada** (puxa o template oficial do provedor de WhatsApp). Eventos cobertos:

* **No momento da marcação do horário pela clínica.**
* **24 horas antes da consulta** (com botões de confirmação para o paciente). Horário fixo, não é configurável.
* **1 hora antes do horário marcado** (lembrete). Horário fixo, não é configurável.
* **Quando a clínica remarcar a consulta.**
* **Quando a clínica cancelar a consulta.**

Esses são os **5 eventos hoje cadastrados** como tipos de notificação no backend (`appointment_creation`, `appointment_confirmation`, `appointment_reminder`, `appointment_reschedule`, `appointment_cancellation`). A clínica pode ligar e desligar cada um. **O canal é exclusivamente WhatsApp**, não há SMS nem e-mail.

**Parte 2, "Erro no envio de notificações":** lista os envios que **falharam nos últimos 7 dias** (confirmado pelo backend). Cada falha aparece como um cartão com nome do paciente, telefone, motivo da falha, data e hora prevista, mais três botões:

* **Reenviar:** tenta enviar de novo pelo provedor.
* **Ícone do WhatsApp:** abre o WhatsApp do usuário com a mensagem pré-pronta para enviar manualmente. Útil quando o reenvio também falha.
* **Editar paciente:** atalho pra ficha do paciente, para corrigir o celular cadastrado.

Tooltip informativo na tela diz: *"As falhas de envio listadas foram identificadas pela Meta, nossa parceira para o envio de mensagens via WhatsApp."*. Ou seja, a fonte da informação de falha é a própria Meta.

**⚠️ Não existe alerta automático** na tela principal avisando "uma notificação acabou de falhar". A clínica precisa entrar nessa tela para ver as falhas.

### 2.5 Lembretes de aniversariantes

Em Configurações → Lembretes de aniversário. A tela é **um iframe que carrega a aplicação da Camila** (não é uma tela nativa do dashboard). É lá que a clínica configura a **mensagem automática de aniversário** que sai pelo WhatsApp para os pacientes do dia.

O que a clínica configura nessa tela (com base na descrição do modal correlato dentro da agenda):

* **Conexão do WhatsApp** da clínica com a Camila (se ainda não estiver).
* **Modelo personalizado da mensagem** de aniversário.
* **Ativação dos envios automáticos** para os aniversariantes do dia.

Como é tela embarcada da Camila, **o detalhe fino dos campos vive no produto Camila**, não no dashboard da Capim. 🚧 PENDENTE: confirmar com o time da Camila os campos exatos da tela, regra de horário do envio diário e se há limite de pacientes por dia.

Importante separar: **aniversariantes que aparecem na Agenda** (toggle de "Eventos de aniversário") **é coisa diferente** de mensagem automática de aniversário. O toggle só liga ou desliga a exibição na agenda. A mensagem automática é configurada aqui em Lembretes de aniversário.

✅ Validar: "lembretes de retorno" (chamar paciente que não volta há X meses) **não foi encontrado** como módulo separado em Configurações da agenda. Pode ser feature de outro módulo (Pacientes, Camila, Marketing) ou ainda não existir no produto.

**⚠️ Atenção:**

* Mudar **fuso horário** com agendamentos já criados: os horários dos agendamentos existentes podem aparecer deslocados depois da troca. Avaliar com o cliente o impacto antes de mudar.
* **Desativar a disponibilidade de um dentista** (switch "Agenda ativa?") afeta o **link público** de marcação, mas **não cancela** agendamentos já marcados na agenda dele.
* **Excluir um marcador**: ainda precisa de validação do comportamento exato em agendamentos que já usam ele.
* A **faixa visível** é por usuário, não da clínica. Cliente reclama "minha colega vê diferente", isso é esperado.
* Toggle de **notificações** em Configurações **não apaga** lembretes que já saíram. Só afeta envios futuros do tipo desativado.

## > 3. 💼 Casos de uso esperados

* **Caso 1, configurar primeiro dentista da clínica recém-criada:** admin entra em Configurar disponibilidade → Editar do dentista → define janelas de seg a sex (08:00 a 12:00 e 13:30 a 18:00) → liga o switch "Agenda ativa?" → salva. A partir daí, a Agenda passa a sinalizar marcações fora dessas janelas e o link público respeita esse horário.
* **Caso 2, criar marcador "Primeira consulta":** admin entra em Ajustes da agenda → Adicionar marcador → nome "Primeira consulta", cor turquesa → salva. Recepção passa a poder etiquetar agendamentos com esse marcador.
* **Caso 3, clínica em Manaus reclama que mensagem chega na hora errada:** primeiro checar Configurações → Ajustes da agenda → Fuso horário. Se estiver em "Brasília", trocar para "Amazonas - UTC-4:00" e validar com o cliente que o próximo lembrete sai no horário certo.
* **Caso 4, dentista vai sair de férias por 2 semanas:** o caminho correto é a clínica entrar na **Agenda** e criar um **Bloqueio** cobrindo o período, não desabilitar a disponibilidade. Bloqueio impede novas marcações no intervalo e mantém o histórico.
* **Caso 5, paciente reclamou que não recebeu lembrete:** suporte entra em Configurações → Notificações, seção "Erro no envio de notificações", procura o paciente nas falhas dos últimos 7 dias. Se aparecer, clica em Reenviar ou orienta a clínica a fazer. Se não aparecer, checa o cadastro do paciente (celular válido) e se o evento estava ativo no momento da consulta.
* **Caso 6, clínica quer ligar o envio automático de mensagem de aniversário:** admin entra em Lembretes de aniversário, completa a configuração da Camila (conectar WhatsApp, modelo de mensagem, ativar envios).

## > 4. ❓ FAQ

**P: Por que o campo de fuso horário aparece desabilitado pro meu usuário?**

R: Porque apenas usuários **admin** podem alterar o fuso horário da clínica. Usuários não-admin veem o tooltip "Somente admins podem alterar esta configuração.". Caminho: pedir a um admin para alterar, ou promover o usuário a admin em Configurações → Usuários.

**P: O dentista mudou de horário. Onde eu altero?**

R: Configurações → Configurar disponibilidade → Editar no dentista. Lá você ajusta as janelas de cada dia da semana. Para folga pontual (férias, feriado interno), o lugar **não é essa tela**, é a Agenda, criando um Bloqueio.

**P: Como configuro o horário de almoço do dentista?**

R: O sistema não tem um campo "almoço". A forma de representar almoço é **deixar duas janelas no mesmo dia com um intervalo entre elas**, ex: 08:00 a 12:00 e 13:30 a 18:00. O intervalo entre 12:00 e 13:30 funciona como almoço.

**P: A clínica quer que a Agenda mostre só de 07:00 às 21:00. Onde mudo?**

R: Não é em Configurações. É **dentro da Agenda**, no botão de ajustes no topo da tela. E **vale só para o usuário logado**, é uma preferência pessoal, não da clínica inteira. Se a clínica quer que todos vejam a mesma faixa, cada usuário precisa ajustar no perfil dele.

**P: O paciente jura que não recebeu o lembrete. O que verificar?**

R: Em ordem: (1) o cadastro do paciente tem celular válido? Sem celular, o sistema nem tenta enviar. (2) Em Configurações → Notificações, o evento correspondente (24h antes, 1h antes) está com o switch ligado? (3) Olhar na seção "Erro no envio de notificações" da mesma tela se o paciente aparece nas falhas dos últimos 7 dias. Se aparecer, clicar em Reenviar. (4) Confirmar com o cliente que o fuso horário em Ajustes da agenda está correto, porque fuso errado faz a mensagem sair em horário inesperado.

**P: Posso mudar o horário do lembrete (ex: enviar 2h antes em vez de 1h)?**

R: Não pela interface da clínica. Os horários são **fixos: 1 hora antes e 24 horas antes**. A clínica só consegue ligar ou desligar cada um.

**P: Posso desligar o envio de "1 hora antes" e manter só "24 horas antes"?**

R: Sim. Cada um dos 5 eventos de notificação (marcação, 24h antes, 1h antes, remarcação, cancelamento) tem um switch independente em Configurações → Notificações.

**P: Posso enviar lembrete por SMS ou e-mail?**

R: Não. **O canal é exclusivamente WhatsApp.** Se o paciente não tem WhatsApp ou se o número está errado, não há envio alternativo automático. O caminho manual é a clínica abrir o WhatsApp e enviar do próprio celular (o botão de "abrir WhatsApp" na lista de falhas faz isso).

**P: Como crio um marcador colorido pra usar nos agendamentos?**

R: Configurações → Ajustes da agenda → Adicionar marcador. Escolhe nome e cor. Salva. Aí o marcador aparece como opção dentro do agendamento, no campo "Marcador (opcional)".

**P: Onde configuro a mensagem automática de aniversário?**

R: Configurações → Lembretes de aniversário. Essa tela é da Camila (vem embarcada como iframe no dashboard). Lá a clínica conecta WhatsApp, escolhe modelo de mensagem e ativa os envios automáticos.

**P: Os aniversariantes não estão aparecendo na Agenda. Por quê?**

R: Cada usuário tem um toggle "Eventos de aniversário" no botão de ajustes da Agenda. Provavelmente está desligado pra esse usuário. Importante: esse toggle **não afeta o envio da mensagem automática de aniversário**. São coisas separadas.

**P: A clínica trocou o fuso e agora os agendamentos antigos parecem em horário errado. O que faço?**

R: ✅ Validar com produto qual é o comportamento esperado para agendamentos já criados quando o fuso muda. A regra prática de suporte: **alterar fuso é uma operação delicada**, ideal fazer no início do uso e não com agenda já cheia.

**P: O dentista vai sair de férias na semana que vem. Eu desativo a disponibilidade dele?**

R: Não é o caminho mais limpo. Desativar a disponibilidade afeta principalmente o **link público** (pacientes pararem de marcar com ele), mas **não cancela** as consultas já marcadas, e dificulta reativar depois. O caminho correto é criar um **Bloqueio** dentro da Agenda no período de férias.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo mudar o fuso horário, o campo está cinza." | Usuário não é admin. | Confirmar o papel do usuário. Pedir a um admin pra alterar, ou promover o usuário em Configurações → Usuários. | Se for admin e mesmo assim aparece desabilitado, escalar pra eng com ID da clínica e usuário. |
| "Os horários da Agenda estão errados / saem fora de hora." | Fuso horário em Ajustes da agenda está diferente do real da clínica. | Confirmar a cidade da clínica e ajustar Configurações → Ajustes da agenda → Fuso horário. | Se mesmo com fuso correto persiste, escalar pra eng com print do agendamento, fuso atual e horário esperado. |
| "Tentei marcar um horário e deu 'Fora do horário de trabalho'." | A janela do dia da semana do dentista não cobre o horário desejado. | Pedir a recepção ou admin pra revisar Configurar disponibilidade → Editar do dentista, adicionando ou ajustando o intervalo daquele dia. | Se as janelas batem e o erro persiste, escalar pra eng. |
| "O paciente conseguiu marcar pelo link a 2 horas da consulta, mas eu queria 6h de antecedência." | Antecedência mínima do dentista está mais baixa do que deveria. | Ajustar Antecedência mínima do dentista em horas em Configurar disponibilidade → Editar. | Não costuma precisar. |
| "Criei um marcador e ele não aparece no agendamento." | Provavelmente cache. | Pedir pra dar F5 na Agenda e abrir um novo agendamento. | Se mesmo assim não aparece, escalar com ID do marcador e da clínica. |
| "O paciente não recebeu o lembrete." | Cadastro sem celular válido, evento desligado em Notificações, ou falha do provedor. | Conferir cadastro → conferir toggle em Notificações → entrar em "Erro no envio de notificações" e procurar o paciente nas falhas dos últimos 7 dias. Se aparecer, reenviar. | Escalar pra eng se o paciente aparece nas falhas com motivo não trivial e a clínica precisa do registro. |
| "Aniversariantes não aparecem na agenda." | Toggle de "Eventos de aniversário" do usuário está desligado nos ajustes da própria Agenda. | Pedir pra ligar o toggle no botão de ajustes da Agenda (não em Configurações). | Não costuma precisar. |
| "Mensagem automática de aniversário não está saindo." | Configuração da tela Lembretes de aniversário incompleta (WhatsApp não conectado, envios não ativados). | Conferir Configurações → Lembretes de aniversário. Verificar se a Camila está conectada e os envios estão ativos. | Escalar pro time da Camila se a clínica disser que está tudo conectado e mesmo assim não sai. |
| "Tentei excluir um marcador e dá erro." | 🚧 Comportamento da exclusão quando o marcador já está em uso ainda precisa ser confirmado. | Pedir print do erro, ID do marcador, ID da clínica. | Escalar pra eng. |
| "A faixa de horário visível mudou sozinha." | A faixa é por usuário e pode ter sido alterada em outro navegador ou sessão. | Pedir pra abrir a Agenda → botão de ajustes → reajustar horário visível. | Não costuma precisar. |

**Para quem escalar:** **Time de Sustentação** (canal interno Capim). Toda issue de bug, ativação de feature ou comportamento inconsistente em Configurações da agenda entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Fuso horário só admin altera.** Tooltip explícito na tela. Não é bug.
* **Faixa de horário visível é por usuário, não da clínica.** Cada usuário precisa ajustar no próprio perfil.
* **Horários dos lembretes (1h e 24h antes) são fixos.** Não há campo pra clínica configurar 2h ou 48h.
* **Canal de notificação é exclusivamente WhatsApp.** Não há SMS nem e-mail. Não há fallback automático.
* **Sem alerta automático na tela principal** quando uma notificação falha. A clínica precisa entrar em Configurações → Notificações pra ver as falhas dos últimos 7 dias.
* **A lista de falhas é dos últimos 7 dias.** Falhas mais antigas não aparecem na tela.
* **Disponibilidade da semana é recorrente.** Folga pontual não fica aqui, fica como Bloqueio dentro da Agenda.
* **Almoço não é campo separado**, e sim o intervalo entre duas janelas do mesmo dia.
* **Lembretes de aniversário** vivem na aplicação da Camila (iframe). O dashboard só embarca a tela, não controla o detalhe fino.
* **"Lembretes de retorno"** (chamar paciente inativo) **não foram encontrados** como módulo dentro de Configurações da agenda. Se a clínica perguntar, escalar pra produto para confirmar se existe e onde.

## > 7. 🗺️ Próximos passos [opcional]

* 🚧 PENDENTE: roadmap de novos canais de notificação (SMS, e-mail) ou se a posição é manter WhatsApp como único canal.
* 🚧 PENDENTE: roadmap de horários configuráveis pela clínica para os lembretes (hoje 1h e 24h são fixos).
* 🚧 PENDENTE: roadmap de "lembretes de retorno" automáticos (paciente que não volta há X meses), se existe.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: lista de dentistas em Configurar disponibilidade com switch "Agenda ativa?"]

[INSERIR PRINT: tela de edição da disponibilidade de um dentista, com antecedência mínima e máxima e janelas por dia]

[INSERIR PRINT: Ajustes da agenda em Configurações com seletor de fuso horário e lista de marcadores]

[INSERIR PRINT: drawer "Adicionar marcador" com campo nome e seletor de cor]

[INSERIR PRINT: modal de ajustes da Agenda mostrando Horário visível, Eventos de aniversário, Eventos de feriado e Fins de semana]

[INSERIR PRINT: Central de notificações com a lista de 5 eventos e seus switches]

[INSERIR PRINT: seção "Erro no envio de notificações" com cartões de paciente, motivo e botões Reenviar, WhatsApp, Editar paciente]

[INSERIR PRINT: tela de Lembretes de aniversário (iframe da Camila) embarcada no dashboard]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Permissões**
* [ ] Confirmar se Disponibilidade, Marcadores, Notificações e Lembretes de aniversário também são restritos a admin, ou se qualquer usuário interno pode editar.

**Marcadores**
* [ ] Comportamento ao excluir um marcador que já está em uso em agendamentos existentes: o agendamento perde o marcador, mantém oculto, ou bloqueia a exclusão?

**Notificações**
* [ ] Existe alguma forma de a clínica consultar falhas mais antigas que 7 dias?
* [ ] Lista oficial de motivos de falha que a Meta retorna e como o suporte interpreta cada um.

**Lembretes de aniversário (Camila)**
* [ ] Campos exatos da tela embarcada da Camila, regra de horário do envio diário e limite de pacientes por dia.
* [ ] Como o suporte do dashboard interage com problemas dessa tela (escala pro time da Camila? abre no mesmo canal?).

**Lembretes de retorno**
* [ ] Confirmar se existe e onde. Se existe em outro módulo, mencionar aqui o caminho.

**Fuso horário**
* [ ] Comportamento esperado dos agendamentos existentes quando a clínica troca o fuso horário (deslocam? mantêm? convertem?).

**Escalação**
* [ ] SLA esperado de resposta pra cada nível de severidade no Time de Sustentação.

## > ✅ Validar com produto/eng antes de publicar

Itens inferidos do código que vale confirmar oficialmente:

* [ ] "Antecedência mínima e máxima validam o link público de marcação, não a marcação manual pela Agenda." Inferido do contexto, confirmar com produto se há também validação na criação manual.
* [ ] "Switch 'Agenda ativa?' só fica habilitado quando o dentista tem pelo menos uma janela cadastrada." Confirmado em código, validar texto da UI.
* [ ] "Tela de Lembretes de aniversário é iframe da Camila." Confirmado em código, validar com Camila qual o produto/marca correto a comunicar pra clínica.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Canal de notificação ao paciente é exclusivamente WhatsApp.
* Horários dos lembretes são fixos em 1 hora antes e 24 horas antes do agendamento.
* Tipos de notificação cadastrados hoje: appointment_creation, appointment_confirmation, appointment_reminder, appointment_reschedule, appointment_cancellation (5 tipos).
* Tela de "Erro no envio de notificações" lista falhas dos últimos 7 dias, com botão Reenviar.
* Fuso horário da clínica é restrito ao admin para edição.
* Lista de fusos cobre apenas fusos do Brasil (Noronha, Brasília, Cuiabá, Campo Grande, Manaus, Porto Velho, Boa Vista, Rio Branco).
* Disponibilidade do dentista tem status draft, active ou deactivated, e só vira active se houver pelo menos uma janela de trabalho.
* Janelas de trabalho não podem se sobrepor no mesmo dia da semana para o mesmo dentista.
* Faixa de horário visível, eventos de aniversário, eventos de feriado e fins de semana são preferências por usuário (UserSetting), não da clínica.
* A tela de Lembretes de aniversário em Configurações é um iframe que carrega a aplicação da Camila.
