# 📘 Guia de Suporte: Agenda

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA na versão V1, com a V2 em rollout controlado por whitelist de clínicas (🚧 PENDENTE: confirmar percentual atual e data de GA da V2).

## 1. 🎯 Visão geral

A Agenda é o "livro de marcações" digital da clínica. É onde a recepcionista ou o dentista registra cada consulta, vê quem vem hoje, remarca quando o paciente liga pedindo, bloqueia horário de almoço e folga, e deixa o sistema cuidar de avisar o paciente por WhatsApp. Pense na agenda de papel da recepção, só que sincronizada entre todo mundo da clínica, com várias visualizações (dia, semana, mês, por dentista) e capaz de receber agendamento direto do paciente por um link público ou pela Camila (IA da Capim no WhatsApp).

Resolve três dores clássicas da clínica: confusão com remarcação, esquecimento de paciente (que vira buraco na agenda) e duplicidade de horário entre dentistas que dividem sala ou cadeira.

**Para quem é:** todas as clínicas cliente da Capim, em qualquer plano. Não há gating de plano na Agenda.

**Quem vê e edita o quê dentro da clínica:** por padrão (sem features especiais), cada **dentista vê apenas os próprios agendamentos** e **admin da clínica vê todos**. Para que recepcionistas e outros dentistas vejam ou editem a agenda dos demais, a clínica precisa ter as features `show_all_schedules` (ver) e `edit_all_schedules` (editar) ativas. 🚧 PENDENTE: confirmar onde o suporte verifica/solicita ativação dessas features para uma clínica específica.

**Onde se encaixa no produto Capim:** é o coração do dia a dia da clínica. Conecta com Pacientes (cada agendamento aponta pra uma ficha), com Configurações (horários de trabalho do dentista, marcadores, notificações), com Central da Camila (agendamento por IA cai aqui) e com Agendamento online (link público que o paciente usa pra marcar sozinho também grava aqui).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Pelo menos um dentista cadastrado na clínica.
* Disponibilidade configurada para esse dentista em Configurações → Configurar disponibilidade. Sem isso, a agenda aceita marcar fora do horário, mas mostra alerta "Fora do horário de trabalho".
* Para que o paciente receba notificação por WhatsApp, o cadastro dele precisa ter celular válido. **O canal de notificação é exclusivamente WhatsApp hoje**, não há envio por SMS nem por e-mail.

**Onde acessar:**

* Menu lateral → Atendimento → Agenda.
* URL típica: `/#/schedule` (V1) ou `/#/schedule_v2` (V2, para clínicas habilitadas).

**Fluxo típico (criar agendamento manualmente):**

1. A recepcionista clica em "Novo agendamento" (no topo, no botão azul, ou clica direto no horário desejado no grid).
2. Abre uma gaveta lateral com o formulário. Ela escolhe o tipo: agendamento ou bloqueio de horário.
3. Para agendamento: busca o paciente pelo nome ou cria um paciente novo na hora.
4. Seleciona dentista, data, hora de início e fim (ou marca "dia inteiro"), define status (Confirmado, Pendente ou Cancelado), pode anexar procedimentos e adicionar observação.
5. Se a flag de recorrência estiver ativa, pode marcar "Repetir agendamento" (diário, semanal, mensal, anual ou personalizado).
6. Clica em "Salvar". O agendamento aparece no grid.

**Fluxo típico (remarcar):**

* Pode arrastar o agendamento pra outro horário (drag-and-drop). Funciona nas duas versões da agenda (V1 e V2). Antes de salvar, abre modal pedindo confirmação e perguntando se quer notificar o paciente.
* Alternativa: clicar no agendamento, abrir "Editar" e mudar horário pelo formulário.
* Se for um agendamento recorrente, aparece a pergunta: editar "apenas este", "este e próximos" ou "todos".

**Fluxo típico (cancelar):**

1. Clica no agendamento, clica em "Deletar".
2. Modal pergunta "Notificar paciente?" (vem desmarcado por padrão).
3. Para recorrentes, pergunta o escopo (apenas este, este e próximos, todos).
4. Confirma. O agendamento some da visualização, mas continua no histórico (cancelamento é "marcar como cancelado", não excluir).

**Estados que o dentista pode ver no agendamento:**

* ✅ Confirmado: paciente confirmou ou marcou já confirmado.
* ⏳ Pendente: marcou e ainda não confirmou (típico de marcação por link público antes da clínica aprovar).
* ❌ Cancelado: o agendamento foi desmarcado e sai do grid (fica no histórico).
* Compareceu / Não compareceu: marcador separado, registrado depois que o paciente chega (ou não). Útil pra relatório de faltas.

**Estados do horário (quando tenta marcar e o sistema avisa):**

* "Este horário já está ocupado": outro agendamento ocupa o slot.
* "Fora do horário de trabalho": fora da janela configurada em Disponibilidade.
* "Há um bloqueio de agenda no mesmo horário": existe um evento do tipo bloqueio nesse horário (ex: dentista marcou "almoço" ou "feriado interno").
* "Evento fora da faixa de horário": o horário está fora da faixa visível configurada (ex: clínica mostra só 08:00 às 20:00 e a marcação caiu fora).

**⚠️ Atenção:**

* O campo paciente **não pode ser trocado pela interface** depois de criar o agendamento. Se a recepção errou o paciente, o jeito é cancelar e criar de novo. (Tecnicamente o backend permite a troca, mas a tela trava o campo.)
* Cancelar muda o **status do agendamento para "Cancelado"**: ele some do grid, mas fica no histórico do banco. **Não é um "apagar definitivo"**. Mesmo assim, **não há botão para reativar** um agendamento cancelado: se a clínica cancelou por engano, o caminho prático é recriar (ou pedir reativação para a engenharia, que consegue restaurar por dentro).
* Notificação ao paciente, atenção nas três situações:
  * **Ao criar agendamento**, a tela atual não tem checkbox visível de "Notificar paciente". O comportamento real do envio imediato depende do que o frontend manda por trás dos panos. Os **lembretes automáticos (1h e 24h antes do horário) são sempre disparados** se o paciente tem celular válido e o agendamento é futuro. Canal: WhatsApp.
  * **Ao editar**, o checkbox "Notificar paciente" vem **marcado** por padrão.
  * **Ao cancelar/deletar**, o checkbox "Notificar paciente" vem **desmarcado** por padrão. Repare nesse detalhe antes de confirmar a ação.

## > 3. 💼 Casos de uso esperados

* **Caso 1, recepcionista marca por telefone:** dentista atende o paciente pelo WhatsApp, repassa pra recepção. Recepção abre a Agenda, clica no horário, escolhe o paciente, salva. O paciente recebe pelo WhatsApp o lembrete automático 24h antes e outro 1h antes da consulta. (Se há também um aviso imediato de "agendamento confirmado" no ato da marcação, depende do que o frontend dispara: 🚧 PENDENTE confirmar com produto.)
* **Caso 2, dentista bloqueia almoço fixo toda terça:** abre a Agenda, escolhe "Bloqueio", coloca terça das 12:00 às 13:30, ativa recorrência semanal. A agenda passa a recusar marcações nesse horário e mostra "bloqueio" pra quem tentar marcar ali.
* **Caso 3, paciente liga pedindo pra remarcar:** recepção localiza o agendamento (consegue buscar por nome via lupa em V2), arrasta pra novo horário (ou clica e edita), confirma notificação ao paciente. O paciente recebe aviso do novo horário.
* **Caso 4, tratamento de ortodontia com 12 visitas:** recepção marca a primeira consulta, ativa recorrência mensal por 12 meses. Todas as visitas aparecem na agenda. Se precisar reagendar uma, o sistema pergunta se é só aquela ou a série toda.
* **Caso 5, paciente marcou sozinho pelo link público:** o agendamento aparece na agenda do dentista, normalmente com status "Pendente". A recepção valida (confirma ou ajusta horário) e muda o status pra "Confirmado".
* **Caso 6, Camila marcou pelo WhatsApp:** a Camila cria o agendamento direto via API e ele aparece na agenda como qualquer outro. O backend grava a origem (`created_by: artificial_intelligence`), mas **a tela hoje não diferencia visualmente** agendamentos da Camila dos manuais. Se a clínica perguntar "qual foi marcado pela Camila?", a resposta honesta é que a interface não mostra hoje.

## > 4. ❓ FAQ

**P: A clínica disse que está com agenda diferente da última vez. O que aconteceu?**

R: Provavelmente entrou na versão nova (V2). A V2 está em rollout em uma lista controlada de clínicas, com filtro por flag e por configuração individual do usuário. Se a clínica está na lista e o usuário tem "Mostrar agenda V2" ligado, ele cai na V2. Se não, segue na V1. Para confirmar, dá pra pedir um print ou checar 🚧 PENDENTE (qual é a fonte oficial pra suporte conferir se uma clínica está na whitelist).

**P: O paciente jura que não recebeu o lembrete da consulta. O que verificar?**

R: Primeiro alinhar a expectativa: o canal de envio é **WhatsApp** (não SMS, não e-mail). Depois, em ordem: (1) o cadastro do paciente tem celular e está correto? Sem celular, o sistema nem tenta enviar e mostra o aviso "O paciente não receberá as notificações sem um número de celular associado." (2) O agendamento é futuro? Lembretes só disparam para agendamentos com horário no futuro. (3) Em caso de edição/cancelamento, a opção "Notificar paciente" estava marcada? (4) Se nada acima explicar, **dá pra checar histórico de envio**: existe uma tela de notificações que falharam nos últimos 7 dias e permite reenviar (ver pergunta abaixo sobre falhas).

**P: Onde a clínica vê as notificações que falharam?**

R: Existe uma tela de notificações no dashboard que lista os envios com status de falha dos últimos 7 dias, com botão de reenviar. A clínica precisa entrar nessa tela para ver, **não há alerta automático no canto da tela** avisando que uma notificação falhou. 🚧 PENDENTE: confirmar com produto o caminho exato no menu para chegar nessa tela.

**P: Como o dentista muda a visão (dia, semana, mês)?**

R: Botões no topo da agenda. Em V1 e V2 funciona igual: Dia, Semana, Mês, Agenda (lista linear) e Por dentista (semana com uma coluna por dentista). A escolha fica salva no navegador, então da próxima vez abre na mesma visualização.

**P: Como filtrar por dentista quando a clínica tem vários?**

R: No painel lateral da agenda, há lista de dentistas com checkbox. Só os marcados aparecem no grid. Aniversários e feriados aparecem sempre.

**P: A recepcionista arrastou um agendamento e nada aconteceu. Por quê?**

R: Drag-and-drop funciona nas duas versões da agenda (V1 e V2). Quando falha, costuma ser tela pequena (mobile/tablet), navegador antigo, ou interação em uma região do grid que captura o clique de outro jeito (clica e abre detalhes em vez de arrastar). Alternativa segura sempre disponível: clicar no agendamento e usar "Editar".

**P: O dentista cancelou um agendamento por engano. Dá pra desfazer?**

R: Pela tela, não tem botão. O agendamento fica com status "Cancelado" no banco e o caminho mais rápido para a clínica é recriar manualmente. **Existe sim um caminho via engenharia** para reativar (o backend tem uma transição que volta o agendamento para "Pendente"), mas só roda por dentro, não pela interface. Se a perda do agendamento é crítica (tratamento longo, recorrência inteira cancelada por engano), escale para a engenharia com o ID do agendamento.

**P: Por que aparece "Pendente" em vez de "Confirmado"?**

R: Tipicamente quando o agendamento veio do link público de marcação online, ou quando quem criou escolheu o status "Pendente" manualmente. A recepção pode editar e mudar pra "Confirmado".

**P: A Camila marcou um horário em que o dentista não atende. Como?**

R: Em tese, a Camila respeita as configurações de disponibilidade do dentista. Se algo passou, vale checar (1) se a disponibilidade do dentista está configurada e (2) se a Camila está configurada pra aquele dentista em Central da Camila → Configurações. Em casos de bloqueio pontual (folga criada em cima da hora) pode haver corrida de timing entre a oferta da Camila e a criação do bloqueio: 🚧 PENDENTE confirmar com o time da Camila o comportamento esperado nesse cenário.

**P: Como o link público pra paciente marcar funciona?**

R: Existe um link gerado nas configurações que a clínica compartilha (no site, no Instagram, no WhatsApp). Quem clica passa por algumas telas (escolhe serviço, data e hora, preenche dados) e o agendamento entra na agenda da clínica, geralmente como "Pendente" pra recepção validar. Esse link depende de uma feature flag ativa e da clínica ter gerado o link em Configurações.

**P: Posso ver na agenda quem foi atendido e quem faltou?**

R: Sim. Cada agendamento tem um marcador separado de "Compareceu" e "Não compareceu". A recepção marca depois do horário. Isso entra nos relatórios de comparecimento.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo marcar nesse horário, fica vermelho." | Conflito com outro agendamento, com bloqueio de agenda ou fora do horário do dentista. | Pedir print do alerta exato. Se "Fora do horário de trabalho", orientar a checar Disponibilidade do dentista em Configurações. Se "Bloqueio", procurar o evento de bloqueio que está ali (almoço, folga, feriado). Se "Horário ocupado", ver o outro agendamento que existe no mesmo slot. | Se o cliente confirma que o horário deveria estar livre e tudo está configurado, escalar pra eng com print, ID da clínica, ID do dentista, data e hora exata. |
| "O paciente não recebeu nenhuma notificação." | Falta de celular no cadastro, agendamento já passou, ou a tentativa de envio falhou no provedor de WhatsApp. | Conferir cadastro do paciente (tem celular?). Se sim, abrir a tela de notificações falhadas do dashboard e procurar pelo paciente/agendamento. Se aparecer lá, reenviar pelo botão. | Se o envio falhou e a clínica precisa do registro do motivo (paciente reclamou), escalar pra eng com ID do agendamento. |
| "Arrastar agendamento não funciona." | Tela pequena, navegador antigo, ou clique caindo em região do grid que abre detalhes em vez de arrastar. Não tem a ver com V1 vs V2 (as duas têm drag-and-drop). | Sugerir Chrome desktop atualizado. Alternativa imediata: usar "Editar" no agendamento. | Se persistir em Chrome desktop atualizado, escalar pra eng com vídeo curto da tentativa. |
| "Recepcionista não vê os agendamentos de outros dentistas (ou não consegue editar)." | A clínica não tem ativa a feature `show_all_schedules` (para ver) ou `edit_all_schedules` (para editar). Por padrão, dentistas só veem o próprio. | Confirmar com o cliente quem é o usuário e qual o papel. Explicar que precisa de ativação da feature pela Capim. | Escalar pra produto/eng pedindo ativação das features para a clínica, informando ID da clínica e usuários afetados. |
| "Estou agendando uma recorrência e dá erro." | Flag de recorrência não está ativa para a clínica, ou o "fim da recorrência" ficou inválido (data passada ou número zerado). | Conferir se a flag de recorrência aparece no formulário (o campo "Repetir agendamento" tem que aparecer). Pedir pra ajustar o "fim" da recorrência: data futura ou número positivo de ocorrências. | Se a flag deveria estar ativa e não aparece, escalar pra time de Produto/Eng pedindo ativação. |
| "Agendamento do link público sumiu / não aparece na agenda do dentista." | Possível dessincronização: o dentista carregou a agenda antes do link público criar o evento, e não recarregou. | Pedir pra trocar a data ou apertar F5 na página da agenda. | Se mesmo após recarregar não aparece e a clínica tem o ID do agendamento, escalar pra eng. |
| "O agendamento que cancelei sumiu, mas eu queria desfazer." | Cancelamento não tem botão de "restaurar" na interface, mas o agendamento fica no banco com status "Cancelado". | Caminho rápido: orientar a recriar (paciente, data, hora, dentista). Se for caso crítico (recorrência inteira, tratamento longo), explicar que dá pra pedir reativação pela engenharia. | Escalar pra eng com ID do agendamento quando o cliente pedir reativação em vez de recriar. |
| "O paciente marcou pela Camila num horário que eu bloqueei." | Possível corrida de timing: a Camila já tinha aquele slot em mãos quando o dentista criou o bloqueio. | Confirmar o horário do bloqueio e o horário em que a Camila respondeu o paciente. Orientar a clínica a remarcar manualmente. | Escalar pro time da Camila se for recorrente em uma clínica específica. |
| "A V2 da agenda está com bug X." | Bug específico da V2, ainda em rollout. | Coletar print, vídeo, ID da clínica e versão do navegador. Se reprodutível, orientar a usuária a usar V1 temporariamente (desligar "Mostrar agenda V2" no perfil), se possível. | Sempre escalar bugs da V2 pra eng. A V2 está em rollout, não é GA. |

**Para quem escalar:** 🚧 PENDENTE: confirmar com Produto qual é o time/canal dono da Agenda hoje (squad? canal no Slack? label no Linear?).

## > 6. ⚠️ Limitações conhecidas

* O **paciente vinculado a um agendamento não pode ser trocado** pela interface depois de criado. Solução: cancelar e recriar.
* **Reverter cancelamento pela interface não existe.** Engenharia consegue reativar internamente, mas não tem botão na tela.
* **Sem rollback automático em falhas parciais** de operações em massa (ex: deletar uma série recorrente inteira). Se algo falhar no meio, pode ficar inconsistente.
* **Sem filtro por sala ou ponto de venda na agenda.** Filtros disponíveis hoje na API: dentista, status, intervalo de datas. Não existe filtro por procedimento ou sala.
* **Sincronização da agenda do dentista com agendamentos vindos do link público pode atrasar** alguns segundos: pode precisar recarregar.
* **Notificação ao paciente é só por WhatsApp.** Não existe envio por SMS nem por e-mail. Os horários dos lembretes (1h e 24h antes da consulta) são fixos, não configuráveis pela clínica.
* **Sem alerta automático de notificação falhada.** Existe a tela de notificações falhadas (últimos 7 dias) para a clínica consultar, mas nada chama a atenção do usuário quando uma falha acontece.
* **Validação de timezone** depende da clínica ter o fuso horário correto em Configurações. Se estiver errado, agendamentos saem com horários errados.

## > 7. 🗺️ Próximos passos [opcional]

* Rollout da V2 expandindo para mais clínicas. 🚧 PENDENTE: quando vira GA e some a V1?
* Reforma do boleto (Carnê) integrada à agenda (paciente que marcou já recebe boleto na hora). 🚧 PENDENTE: confirmar status.
* Evolução da integração com a Central da Camila, possivelmente com marcação visual na agenda. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: agenda V1 em visualização de semana]

[INSERIR PRINT: agenda V2 em visualização de semana]

[INSERIR PRINT: gaveta de "Novo agendamento" com os campos preenchidos]

[INSERIR PRINT: alerta "Este horário já está ocupado"]

[INSERIR PRINT: alerta "Fora do horário de trabalho"]

[INSERIR PRINT: modal de edição de recorrência com as três opções]

[INSERIR PRINT: modal de cancelamento com checkbox "Notificar paciente"]

[INSERIR PRINT: filtro de dentistas na sidebar]

[INSERIR PRINT: tela do link público de agendamento online vista pelo paciente]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e disponibilidade**
* [ ] Cronograma de GA da V2 da Agenda: quando 100% das clínicas vão pra V2 e a V1 some?
* [ ] Como o time de suporte consulta hoje se uma clínica específica está na whitelist da V2?
* [ ] Como o suporte verifica e solicita ativação das features `show_all_schedules` e `edit_all_schedules` para uma clínica?

**Notificações**
* [ ] No fluxo de criar agendamento manual, o frontend dispara hoje um "agendamento confirmado" imediato ao paciente, ou apenas os lembretes (1h e 24h antes)?
* [ ] Caminho exato no menu do dashboard para a clínica chegar na tela de notificações falhadas.

**Camila e link público**
* [ ] Comportamento da Camila quando o dentista cria um bloqueio pontual no horário que ela acabou de oferecer pro paciente: a Camila reconhece e oferece outro horário, ou marca igual?
* [ ] Link público de agendamento online: como a clínica gera, como compartilha, como personaliza? (este guia menciona, mas pode virar guia próprio)

**Operação e correção**
* [ ] Canal oficial para o suporte pedir reativação de agendamento cancelado por engano (engenharia? produto? formulário?).
* [ ] Bugs conhecidos em produção hoje na Agenda (não bugs potenciais): lista atual mantida em algum lugar?

**Escalação**
* [ ] Time/squad dono da Agenda hoje.
* [ ] Canal oficial (Slack ou Linear) pra suporte abrir chamado relacionado à Agenda.
* [ ] SLA esperado de resposta pra cada nível de severidade.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "A recorrência personalizada aceita intervalo (a cada N), dias da semana e fim por data ou ocorrências." Confirmado pelo backend (`recurring_event`), mas vale validar com produto se há restrições não codificadas (ex: máximo de ocorrências, prazo máximo).
* [ ] "Ao criar manualmente, a regra real de envio de notificação imediata depende do que o frontend manda." Backend só envia se `notify_patient: true` for explicitamente passado.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Cancelamento muda status para "Cancelado", não apaga; existe transição interna para reativar via engenharia.
* Lembretes automáticos saem em horários fixos (1h e 24h antes), via WhatsApp, sem configuração por clínica.
* Não há filtro por sala/procedimento na API; só dentista, status e datas.
* Não há gating de plano para a Agenda.
* Por padrão, dentistas só veem a própria agenda; ver/editar agendas de outros depende de features `show_all_schedules` e `edit_all_schedules` ativas.
* Existe endpoint/tela de notificações falhadas dos últimos 7 dias com opção de reenvio.
* Agendamentos da Camila têm `created_by: artificial_intelligence` no backend, mas a UI hoje não diferencia.
* Drag-and-drop funciona em V1 e V2.
* Auto-agendamento via link público entra como "Pendente".
