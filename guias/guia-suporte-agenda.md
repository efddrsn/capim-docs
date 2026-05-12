# 📘 Guia de Suporte: Agenda

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA na versão V1, com a V2 em rollout controlado por whitelist de clínicas (🚧 PENDENTE: confirmar percentual atual e data de GA da V2).

## 1. 🎯 Visão geral

A Agenda é o "livro de marcações" digital da clínica. É onde a recepcionista ou o dentista registra cada consulta, vê quem vem hoje, remarca quando o paciente liga pedindo, bloqueia horário de almoço e folga, e deixa o sistema cuidar de avisar o paciente por SMS, WhatsApp ou e-mail. Pense na agenda de papel da recepção, só que sincronizada entre todo mundo da clínica, com várias visualizações (dia, semana, mês, por dentista) e capaz de receber agendamento direto do paciente por um link público ou pela Camila (IA da Capim no WhatsApp).

Resolve três dores clássicas da clínica: confusão com remarcação, esquecimento de paciente (que vira buraco na agenda) e duplicidade de horário entre dentistas que dividem sala ou cadeira.

**Para quem é:** todas as clínicas cliente da Capim, em qualquer plano. 🚧 PENDENTE: confirmar se existe algum plano em que a Agenda não fica disponível, e se há restrição de papel (dentista X recepcionista X admin) na hora de editar agendamento de outro dentista.

**Onde se encaixa no produto Capim:** é o coração do dia a dia da clínica. Conecta com Pacientes (cada agendamento aponta pra uma ficha), com Configurações (horários de trabalho do dentista, marcadores, notificações), com Central da Camila (agendamento por IA cai aqui) e com Agendamento online (link público que o paciente usa pra marcar sozinho também grava aqui).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Pelo menos um dentista cadastrado na clínica.
* Disponibilidade configurada para esse dentista em Configurações → Configurar disponibilidade. Sem isso, a agenda aceita marcar fora do horário, mas mostra alerta "Fora do horário de trabalho".
* Para que o paciente receba notificação, o cadastro dele precisa ter celular válido.

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

* Na V2, pode arrastar o agendamento pra outro horário (drag-and-drop). Antes de salvar, abre modal pedindo confirmação e perguntando se quer notificar o paciente.
* Em ambas as versões, pode clicar no agendamento, abrir "Editar" e mudar horário pelo formulário.
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

* O campo paciente fica **travado depois de criar** o agendamento. Se errou o paciente, o jeito é cancelar e criar de novo. Não dá pra "trocar o paciente" de um agendamento existente.
* Cancelamento é soft delete (marca como cancelado, não apaga do banco). Reverter um cancelamento por engano não é uma ação que existe na tela; o agendamento precisa ser recriado, ou 🚧 PENDENTE: confirmar se há fluxo interno de eng pra restaurar.
* Notificação ao paciente: ao criar, parece enviar por padrão se o paciente tem celular cadastrado; ao editar, o checkbox "Notificar paciente" vem **marcado**; ao deletar, vem **desmarcado**. Repare nesse detalhe antes de confirmar a ação.

## > 3. 💼 Casos de uso esperados

* **Caso 1, recepcionista marca por telefone:** dentista atende o paciente pelo WhatsApp, repassa pra recepção. Recepção abre a Agenda, clica no horário, escolhe o paciente, salva. Paciente recebe SMS de confirmação automaticamente.
* **Caso 2, dentista bloqueia almoço fixo toda terça:** abre a Agenda, escolhe "Bloqueio", coloca terça das 12:00 às 13:30, ativa recorrência semanal. A agenda passa a recusar marcações nesse horário e mostra "bloqueio" pra quem tentar marcar ali.
* **Caso 3, paciente liga pedindo pra remarcar:** recepção localiza o agendamento (consegue buscar por nome via lupa em V2), arrasta pra novo horário (ou clica e edita), confirma notificação ao paciente. O paciente recebe aviso do novo horário.
* **Caso 4, tratamento de ortodontia com 12 visitas:** recepção marca a primeira consulta, ativa recorrência mensal por 12 meses. Todas as visitas aparecem na agenda. Se precisar reagendar uma, o sistema pergunta se é só aquela ou a série toda.
* **Caso 5, paciente marcou sozinho pelo link público:** o agendamento aparece na agenda do dentista, normalmente com status "Pendente". A recepção valida (confirma ou ajusta horário) e muda o status pra "Confirmado".
* **Caso 6, Camila marcou pelo WhatsApp:** a Camila cria o agendamento direto via API, ele aparece na agenda como qualquer outro. 🚧 PENDENTE: confirmar se existe alguma marcação visual ou tag que diferencie "agendado pela Camila" dos demais. O código que olhei só salva uma origem de criação interna, sem ícone visível.

## > 4. ❓ FAQ

**P: A clínica disse que está com agenda diferente da última vez. O que aconteceu?**

R: Provavelmente entrou na versão nova (V2). A V2 está em rollout em uma lista controlada de clínicas, com filtro por flag e por configuração individual do usuário. Se a clínica está na lista e o usuário tem "Mostrar agenda V2" ligado, ele cai na V2. Se não, segue na V1. Para confirmar, dá pra pedir um print ou checar 🚧 PENDENTE (qual é a fonte oficial pra suporte conferir se uma clínica está na whitelist).

**P: O paciente jura que não recebeu o SMS de confirmação. O que verificar?**

R: Três coisas, nessa ordem: (1) o cadastro do paciente tem celular e está correto? Sem celular, o sistema nem tenta enviar e mostra aviso "O paciente não receberá as notificações sem um número de celular associado." (2) Ao criar/editar, a opção "Notificar paciente" estava marcada? (3) A clínica tem o tipo de notificação ativo em Configurações → Agenda → Notificações? Algumas clínicas têm SMS, outras WhatsApp, outras e-mail. 🚧 PENDENTE: confirmar se WhatsApp é padrão pra todas as clínicas ou requer ativação separada.

**P: Como o dentista muda a visão (dia, semana, mês)?**

R: Botões no topo da agenda. Em V1 e V2 funciona igual: Dia, Semana, Mês, Agenda (lista linear) e Por dentista (semana com uma coluna por dentista). A escolha fica salva no navegador, então da próxima vez abre na mesma visualização.

**P: Como filtrar por dentista quando a clínica tem vários?**

R: No painel lateral da agenda, há lista de dentistas com checkbox. Só os marcados aparecem no grid. Aniversários e feriados aparecem sempre.

**P: A recepcionista arrastou um agendamento e nada aconteceu. Por quê?**

R: Drag-and-drop só funciona na V2. Se a clínica ainda está na V1, ela precisa clicar no agendamento e usar "Editar". Mesmo na V2, em telas pequenas ou em alguns navegadores o arrasto pode falhar. Alternativa segura: usar "Editar".

**P: O dentista cancelou um agendamento por engano. Dá pra desfazer?**

R: Pela tela, não. O agendamento fica marcado como cancelado no banco, mas a interface não tem botão "restaurar". O caminho rápido é recriar o agendamento manualmente. 🚧 PENDENTE: existe um fluxo de eng pra reabilitar um agendamento cancelado quando o cliente pede?

**P: Por que aparece "Pendente" em vez de "Confirmado"?**

R: Tipicamente quando o agendamento veio do link público de marcação online, ou quando quem criou escolheu o status "Pendente" manualmente. A recepção pode editar e mudar pra "Confirmado".

**P: A Camila marcou um horário em que o dentista não atende. Como?**

R: Em tese, a Camila respeita as configurações de disponibilidade. Se algo passou, vale checar se a disponibilidade do dentista está configurada e se a Camila está configurada pra aquele dentista nas configurações da Central da Camila. 🚧 PENDENTE: confirmar com o time da Camila o comportamento exato em caso de bloqueio pontual (folga não recorrente) criado depois que a Camila já carregou o slot.

**P: Como o link público pra paciente marcar funciona?**

R: Existe um link gerado nas configurações que a clínica compartilha (no site, no Instagram, no WhatsApp). Quem clica passa por algumas telas (escolhe serviço, data e hora, preenche dados) e o agendamento entra na agenda da clínica, geralmente como "Pendente" pra recepção validar. Esse link depende de uma feature flag ativa e da clínica ter gerado o link em Configurações.

**P: Posso ver na agenda quem foi atendido e quem faltou?**

R: Sim. Cada agendamento tem um marcador separado de "Compareceu" e "Não compareceu". A recepção marca depois do horário. Isso entra nos relatórios de comparecimento.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo marcar nesse horário, fica vermelho." | Conflito com outro agendamento, com bloqueio de agenda ou fora do horário do dentista. | Pedir print do alerta exato. Se "Fora do horário de trabalho", orientar a checar Disponibilidade do dentista em Configurações. Se "Bloqueio", procurar o evento de bloqueio que está ali (almoço, folga, feriado). Se "Horário ocupado", ver o outro agendamento que existe no mesmo slot. | Se o cliente confirma que o horário deveria estar livre e tudo está configurado, escalar pra eng com print, ID da clínica, ID do dentista, data e hora exata. |
| "O paciente não recebeu nenhuma notificação." | Falta de celular no cadastro, opção "Notificar paciente" desmarcada, ou tipo de notificação inativo nas configurações da clínica. | Conferir cadastro do paciente (tem celular?), pedir pra clínica refazer com "Notificar" marcado, e checar Configurações → Agenda → Notificações da clínica. | Se tudo está configurado e a notificação ainda não sai, escalar pra eng informando ID do agendamento e horário em que a clínica esperava o envio. |
| "Arrastar agendamento não funciona." | Cliente está na V1 (não tem drag-and-drop) ou navegador/resolução incompatível. | Confirmar versão (V1 ou V2) com print. Se V1, orientar a usar "Editar". Se V2, sugerir Chrome desktop atualizado. | Se for V2 em Chrome desktop atualizado e mesmo assim falhar, escalar pra eng com vídeo curto da tentativa. |
| "Estou agendando uma recorrência e dá erro." | Flag de recorrência não está ativa para a clínica, ou o "fim da recorrência" ficou inválido (data passada ou número zerado). | Conferir se a flag de recorrência aparece no formulário (o campo "Repetir agendamento" tem que aparecer). Pedir pra ajustar o "fim" da recorrência: data futura ou número positivo de ocorrências. | Se a flag deveria estar ativa e não aparece, escalar pra time de Produto/Eng pedindo ativação. |
| "Agendamento do link público sumiu / não aparece na agenda do dentista." | Possível dessincronização: o dentista carregou a agenda antes do link público criar o evento, e não recarregou. | Pedir pra trocar a data ou apertar F5 na página da agenda. | Se mesmo após recarregar não aparece e a clínica tem o ID do agendamento (vindo do e-mail de confirmação), escalar pra eng. |
| "O agendamento que cancelei sumiu, mas eu queria desfazer." | Cancelamento é definitivo na interface. | Explicar que o caminho é recriar. Pegar dados (paciente, data, hora, dentista) e orientar a recriar. | 🚧 PENDENTE: existe um caminho de eng pra restaurar o agendamento original? Se sim, descrever aqui. |
| "O paciente marcou pela Camila num horário que eu bloqueei." | Possível corrida de timing: a Camila já tinha aquele slot em mãos quando o dentista criou o bloqueio. | Confirmar o horário do bloqueio e o horário em que a Camila respondeu o paciente. Orientar a clínica a remarcar manualmente. | Escalar pro time da Camila se for recorrente em uma clínica específica. |
| "A V2 da agenda está com bug X." | Bug específico da V2, ainda em rollout. | Coletar print, vídeo, ID da clínica e versão do navegador. Se reprodutível, orientar a usuária a usar V1 temporariamente (desligar "Mostrar agenda V2" no perfil), se possível. | Sempre escalar bugs da V2 pra eng. A V2 está em rollout, não é GA. |

**Para quem escalar:** 🚧 PENDENTE: confirmar com Produto qual é o time/canal dono da Agenda hoje (squad? canal no Slack? label no Linear?).

## > 6. ⚠️ Limitações conhecidas

* O **paciente vinculado a um agendamento não pode ser trocado** depois de criado. Solução: cancelar e recriar.
* **Reverter cancelamento pela interface não existe.** 🚧 PENDENTE: existe processo paralelo no eng?
* **Drag-and-drop só na V2.** Em telas pequenas ou navegadores antigos, pode falhar mesmo na V2.
* **Sem rollback automático em falhas parciais** de operações em massa (ex: deletar uma série recorrente inteira). Se algo falhar no meio, pode ficar inconsistente.
* **Sem filtro por sala ou ponto de venda na agenda.** Filtro disponível hoje é por dentista.
* **Sincronização da agenda do dentista com agendamentos vindos do link público pode atrasar** alguns segundos: pode precisar recarregar.
* **Notificação ao paciente não dá feedback ao usuário** se o envio falhar no backend. Pra clínica, parece que enviou. 🚧 PENDENTE: existe algum relatório ou tela onde a clínica veja status de entrega de notificações?
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
* [ ] Existe plano da Capim em que a Agenda não fica disponível? Qual?
* [ ] Existem restrições por papel (dentista, recepcionista, admin) na hora de criar, editar ou cancelar agendamentos de outro dentista? O frontend não mostra essa diferença, mas o backend pode validar.
* [ ] Cronograma de GA da V2 da Agenda: quando 100% das clínicas vão pra V2 e a V1 some?
* [ ] Como o time de suporte consulta hoje se uma clínica específica está na whitelist da V2?

**Notificações**
* [ ] WhatsApp como tipo de notificação: padrão pra todas as clínicas ou ativação por solicitação?
* [ ] Os horários "1 hora antes" e "24 horas antes" são fixos ou configuráveis pela clínica?
* [ ] Existe alguma tela na qual a clínica veja status de entrega das notificações (enviado, lido, falhou)?
* [ ] Em caso de falha de envio, a clínica é notificada de alguma forma?

**Camila e link público**
* [ ] Quando a Camila marca um agendamento, existe ícone, tag ou alguma sinalização visual na agenda do dentista que diferencie esse agendamento de um marcado manualmente?
* [ ] Comportamento da Camila quando o dentista cria um bloqueio pontual no horário que ela acabou de oferecer pro paciente: a Camila reconhece e oferece outro horário, ou marca igual?
* [ ] Link público de agendamento online: como a clínica gera, como compartilha, como personaliza? (este guia menciona, mas pode virar guia próprio)

**Operação e correção**
* [ ] Existe processo de engenharia pra reverter um cancelamento feito por engano? Se sim, qual é o canal pra suporte pedir?
* [ ] Bugs conhecidos em produção hoje na Agenda (não bugs potenciais): lista atual mantida em algum lugar?

**Escalação**
* [ ] Time/squad dono da Agenda hoje.
* [ ] Canal oficial (Slack ou Linear) pra suporte abrir chamado relacionado à Agenda.
* [ ] SLA esperado de resposta pra cada nível de severidade.

## > ✅ Validar com produto/eng antes de publicar

Itens que eu inferi do código e podem não refletir a regra de negócio oficial:

* [ ] "Qualquer usuário com acesso à clínica vê todos os agendamentos de todos os dentistas." Inferido do frontend que não tem controle granular, mas o backend pode aplicar restrição.
* [ ] "Paciente vinculado a um agendamento não pode ser trocado depois de criado." Inferido pelo campo desabilitado no formulário em modo edição.
* [ ] "Cancelamento é soft delete: o agendamento fica no banco com status cancelado." Inferido pelo comportamento, mas vale confirmar se há job de limpeza por retenção.
* [ ] "Ao criar agendamento, a confirmação ao paciente é enviada por padrão se o paciente tem celular." Inferido por ausência de campo explícito; a regra de envio pode ser diferente.
* [ ] "Drag-and-drop pra remarcar existe só na V2." Confirmado no código, mas vale validar se foi liberado pra todas as clínicas V2.
* [ ] "A recorrência personalizada aceita intervalo (a cada N semanas, dias da semana específicos) e fim por data ou por número de ocorrências." Inferido do componente de configuração; confirmar se o backend interpreta da mesma forma.
* [ ] "Filtros disponíveis na agenda são por dentista." Outros filtros (sala, procedimento, ponto de venda) não foram encontrados no código, mas podem existir num menu que eu perdi.
* [ ] "Agendamento via link público entra na agenda como 'Pendente' por padrão até a clínica confirmar." Inferido; pode ser configurável.
