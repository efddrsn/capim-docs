# 📘 Guia de Suporte: Início (Home / Dashboard)

> Material para o time de suporte da Capim. Atualizado em 13/11/2026.
> Status da feature: GA. Existem duas telas distintas por trás de "Início" (HomeView simples e DashboardView completo), e o sistema decide qual mostrar automaticamente conforme a configuração da clínica.

## 1. 🎯 Visão geral

A tela de Início é a primeira coisa que o usuário vê depois de logar na Capim. É o "painel" da clínica: um único lugar que junta os agendamentos do dia, atalhos para as ações mais usadas (novo agendamento, novo paciente, Financiamento Capim, Maquininha Capim), um resumo financeiro do dia, banners de comunicação da Capim e widgets contextuais (migração de dados, upgrade de plano, Capix). A ideia é responder em um piscar de olhos: "o que eu preciso resolver hoje?" e "como começo uma tarefa rápida?".

**Para quem é:** todas as clínicas cliente da Capim. Não há gating de plano para acessar a tela de Início. O que muda é **qual versão** da tela aparece para a clínica.

**Existem duas telas por trás de "Início":**

* **Dashboard completo** (rota interna `/dashboard`): é a versão "rica", com agendamentos do dia, atalhos, resumo financeiro, novidades da Capim, banners. Aparece quando a clínica contratou o sistema de gestão (configuração `saas_enabled` ativa).
* **Home simples** (rota interna `/home`): título "Escolha uma área para iniciar" e três cards de navegação (Agenda, Pacientes e Financeiro). Só existe para clínicas **sem** `saas_enabled`, ou seja, clínicas que usam o produto de financiamento sem o sistema de gestão. Na prática, no navegador, esse usuário costuma ser levado direto para a tela de créditos pendentes logo depois do login (ver "Atenção" na seção 2).

O usuário **não escolhe** entre as duas: o sistema redireciona conforme a configuração da clínica. Para o suporte, a regra prática é: se a clínica contratou o sistema de gestão, ela vê o Dashboard; se usa só o financiamento, vê a Home simples (ou cai direto na área de financiamento). O tipo de plano (por exemplo, o plano "Só Maquininha") **não entra nessa decisão**: o sistema olha apenas `saas_enabled`.

**Onde se encaixa no produto Capim:** é o hub de entrada. Tudo passa por aqui depois do login. Os atalhos disparam ações em outros módulos (abrem gaveta de novo agendamento da Agenda, gaveta de novo paciente, etc.), e o widget de agendamentos é uma "miniatura" da Agenda do dia.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Usuário logado na Capim com vínculo ativo a uma clínica.
* Para ver o Dashboard completo (e não a Home simples de 3 cards), a clínica precisa ter `saas_enabled` ativo. Essa configuração faz parte do cadastro da clínica no sistema interno da Capim: o dash só lê o valor ao carregar as configurações da clínica (dica para escalonamento: endpoint `/v3/retails/{id da clínica}/configurations`). **Ela não aparece e não pode ser alterada em nenhuma tela do dash**, nem em Configurações, nem para administrador. O suporte não consegue conferir nem ligar sozinho: o caminho é escalar para o Time de Sustentação (ver "Para quem escalar" na seção 5).

**Onde acessar:**

* É a tela inicial: depois do login, cai direto nela. A URL raiz (`/`) redireciona para Início automaticamente.
* No menu lateral, há um item "Início" (ícone de casa). Pelo código, esse item leva sempre ao endereço do Dashboard completo (`/#/dashboard`). No app, o item só aparece para clínicas com sistema de gestão.
* URL típica: `/#/home` (que redireciona para `/#/dashboard` quando a clínica tem o sistema de gestão).

**O que aparece no Dashboard completo (clínica com sistema de gestão):**

Coluna principal (esquerda):

1. **Widget de migração de dados** (só aparece se a clínica está migrando de outro software ou se há solicitação de migração ativa). Mostra o status da migração ou um banner pra começar.
2. **Banner do Capix (parcelamento via Pix)**: convite "Mais pacientes aprovados, mais tratamentos fechados!" com botão para falar com o time. Só para clínicas liberadas para o Capix, e não aparece enquanto o widget de migração estiver na tela.
3. **Banner do Painel de vendas**: só para clínicas com o Painel de vendas liberado e usuários com permissão de Controle Financeiro. Não aparece no app.
4. **Atalhos rápidos** (linha de cards clicáveis). Atalhos padrão: "Agendar" (abre gaveta de novo agendamento), "Administrar paciente" (abre gaveta de novo paciente), "Financiamento Capim" (vai para a tela de créditos pendentes; não aparece no app), "Indique & Ganhe" (abre gaveta do programa de indicação), "Maquininha Capim" (vai para transações de cartão), "Link de agendamento". Atalhos condicionais: "Assistente Capim com I.A." (só para clínicas beta testers), "Boleto tradicional" (só se a clínica está no experimento de reforma do carnê), "Central da Camila" ou "Ativar Assistente Camila IA" (só no navegador, conforme o setup da Camila na clínica).
5. **Banner de entrega da maquininha**: aparece enquanto o pedido da maquininha está enviado e com código de rastreio. Some quando o pedido é entregue.
6. **Widget de agendamentos do dia** ("Seu dia hoje", mini agenda): lista os agendamentos de hoje agrupados por status em três abas ("Pendente confirmação", "Confirmadas", "Canceladas"). Mostra horário, dentista, paciente, marca de "1° consulta" e permite marcar se o paciente compareceu direto dali. Tem botão de recarregar ("Atualizar agendamentos") no topo. Limite por aba: poucos eventos visíveis (paginado), com botão "Ver mais agendamentos" que abre a Agenda completa em nova aba. Se o usuário logado é dentista, o widget já filtra para a agenda dele. Se for recepcionista/admin, aparece um seletor de dentista no header do widget.

Coluna lateral (direita):

7. **Novidades Capim**: iframe com notícias/comunicados da Capim (campanhas, novidades de produto). O link do iframe muda conforme a clínica está com assinatura ativa ou não. Para clínicas com maquininha elegíveis à lista de espera do link de pagamento, o convite da lista de espera aparece no lugar das Novidades. **Não aparece no app mobile.**
8. **Upgrade de plano**: card que oferece desconto pra upgrade do plano anual. Só aparece para clínicas elegíveis (varia conforme tempo de assinatura e plano atual).
9. **Resumo financeiro do dia**: card "Controle Financeiro" com "Entradas totais hoje", "Saídas totais hoje" e "Saldo do dia", botão "Adicionar lançamento" e link "Ver tudo" para abrir o Controle Financeiro completo. Só aparece se o usuário tem permissão de Controle Financeiro **e não está no app mobile**.

**Outros elementos que podem aparecer no Dashboard:**

* **Modal "Primeira venda"** ("Parabéns pelas primeiras vendas com a Capininha!"): aparece automaticamente uma única vez quando a clínica fez de 1 a 5 vendas na maquininha, parabenizando e abrindo o fluxo de Indique & Ganhe. Depois de fechado uma vez, fica marcado no navegador (localStorage) e não volta a aparecer.
* **Popover de cross-sell**: aparece para clínicas elegíveis ao produto Carnê.

**O que aparece na Home simples (clínica sem sistema de gestão):**

* Título "Escolha uma área para iniciar".
* Três cards de navegação grandes: **Agenda**, **Pacientes** e **Financeiro**. O card Financeiro leva para a área de financiamento (créditos) quando a clínica tem o produto de financiamento ativo (`dash_finance_enabled`); sem ele, leva ao Controle Financeiro.
* Cards aparecem com cadeado (locked) quando a clínica não tem o produto correspondente ativo: sem sistema de gestão, Agenda e Pacientes ficam travados. Clicar num card travado não navega.
* Não existe card de Maquininha na Home simples.

**Fluxo típico (dentista/recepcionista logando pela manhã):**

1. Faz login. Cai direto na tela de Início (Dashboard ou Home simples).
2. No Dashboard, olha o widget de agendamentos do dia para ver quem chega.
3. Usa os atalhos para tarefas rápidas (marcar novo agendamento sem precisar entrar na Agenda inteira, cadastrar paciente novo sem sair daqui).
4. Confere entradas e saídas do dia no resumo financeiro lateral.
5. Lê as novidades da Capim na coluna lateral.

**⚠️ Atenção:**

* **A tela de "Início" não é uma só.** Se uma clínica diz "minha home é diferente da do meu colega", a primeira hipótese é que uma clínica tem `saas_enabled` e outra não, ou que os dois usuários têm permissões diferentes (o resumo financeiro, por exemplo, só aparece para quem tem permissão de Controle Financeiro).
* **Clínica sem sistema de gestão quase não vê a Home simples logo após o login.** No navegador, quando o login cai no Início, o sistema leva direto para a tela de créditos pendentes. A Home simples aparece quando o usuário volta ao Início por outro caminho (por exemplo, pelo botão da página "não encontrada" ou quando o sistema o devolve ao Início por falta de permissão).
* **No app, clínica sem sistema de gestão fica bloqueada.** Aparece a mensagem "Aplicativo Capim disponível somente para clínicas contratantes do sistema de gestão", com o link "Clique aqui para acessar as outras funções diretamente pelo navegador", e a tela fica carregando.
* **Clínica sem sistema de gestão e sem financiamento** é, em regra, deslogada no login com a mensagem "Erro ao carregar suas configurações. Tente novamente".
* **No app mobile, parte do Dashboard some**: Novidades Capim, resumo financeiro, banner do Painel de vendas, convite da lista de espera do link de pagamento e os atalhos "Financiamento Capim" e da Camila não aparecem no app, mesmo que apareçam no navegador. No iPhone, o atalho "Indique & Ganhe" também some.
* O **resumo financeiro mostra só o dia de hoje**, não acumulado nem mês. Para ver período maior, clicar em "Ver tudo" e abrir o Controle Financeiro.
* O **widget de agendamentos do dia mostra só hoje**, e só lista agendamentos que têm paciente vinculado (eventos de aniversário e bloqueios não aparecem). Para ver outros dias, vai para a Agenda.
* O modal "Primeira venda" aparece **uma única vez por navegador**. Se a clínica reclamar que "perdi o modal de parabéns", o registro fica no localStorage do navegador, então em outro navegador/dispositivo pode reaparecer.

## > 3. 💼 Casos de uso esperados

* **Caso 1, recepcionista começa o dia:** loga, vê no widget de agendamentos quem está marcado pra hoje, confirma os pendentes pelo próprio widget, marca que o paciente compareceu nos que já chegaram. Sem precisar abrir a Agenda inteira.
* **Caso 2, dentista cadastrando paciente novo entre consultas:** clica no atalho "Administrar paciente" no Dashboard, a gaveta de novo paciente abre por cima do Dashboard mesmo, preenche e salva. Não muda de tela.
* **Caso 3, recepcionista marcando agendamento rápido:** clica em "Agendar" nos atalhos. Abre a gaveta de novo agendamento (a mesma da Agenda), preenche e salva. O agendamento aparece no widget da Home se for pra hoje, ou só na Agenda se for futuro.
* **Caso 4, dentista querendo ver "quanto entrou hoje":** olha o resumo financeiro no canto direito. Se quer detalhe, clica em "Ver tudo" e cai no Controle Financeiro.
* **Caso 5, clínica recém migrada de outro software:** o widget de migração de dados aparece no topo do Dashboard mostrando status (em andamento, concluída, com erro). Depois que a migração termina, o widget some.
* **Caso 6, clínica que só tem o produto de financiamento (sem sistema de gestão):** no navegador, loga e é levada direto para a tela de créditos pendentes; ao voltar ao Início, vê a Home simples de três cards, com Agenda e Pacientes travados e Financeiro liberado. Não tem widget de agendamentos, não tem atalhos, não tem resumo financeiro. No app, fica bloqueada com a mensagem de app exclusivo para quem contratou o sistema de gestão.
* **Caso 7, dentista visualizando só os agendamentos dele:** o sistema detecta que o usuário logado é dentista e o widget de agendamentos já abre filtrado para a agenda dele, sem precisar selecionar. Para admin/recepcionista, aparece um seletor de dentista no widget.

## > 4. ❓ FAQ

**P: A clínica diz "minha tela inicial mudou", o que aconteceu?**

R: Provavelmente a clínica teve `saas_enabled` ativado (ou desativado) e migrou entre a Home simples (3 cards) e o Dashboard completo. Antes de escalar, peça um print pra confirmar qual das duas o usuário está vendo agora. Se a clínica contratou o sistema de gestão e está caindo na Home simples (ou na tela de créditos pendentes logo após o login), escalar para o Time de Sustentação conferir e ativar `saas_enabled`. O suporte não vê nem altera essa configuração pelo dash.

**P: Onde eu vejo se a clínica tem `saas_enabled` ligado?**

R: Não há tela no dash que mostre isso, nem em Configurações. Dá para deduzir pelo comportamento: se a clínica cai no Dashboard completo (com agendamentos e atalhos), está ligado; se cai na Home simples de 3 cards, na tela de créditos pendentes logo após o login, ou no bloqueio do app, está desligado. Para confirmar ou alterar, escalar para o Time de Sustentação.

**P: Dá para a clínica que usa só a maquininha (plano "Só Maquininha") ver a Home simples em vez do Dashboard?**

R: Hoje não. A escolha entre Dashboard e Home simples olha apenas `saas_enabled`; o plano da clínica não entra na conta, e não existe uma versão de Início pensada para quem usa só a maquininha. Se a clínica tem `saas_enabled` ligado, vê o Dashboard completo (o atalho "Maquininha Capim" está lá). Se não tem, segue as regras de clínica sem sistema de gestão: no navegador vai para créditos pendentes ou para a Home simples (que não tem card de Maquininha e trava Agenda e Pacientes); no app, fica bloqueada; e, se também não tiver financiamento, é deslogada no login. Uma Home específica para "apenas maquininha" está registrada como pedido de produto em Próximos passos.

**P: O usuário não vê o card de resumo financeiro. Por quê?**

R: Três motivos possíveis: (1) o usuário não tem a permissão de Controle Financeiro vinculada (admin tem por padrão, dentista comum não). (2) Está acessando pelo app mobile (o card não existe no app hoje). (3) A clínica está na Home simples (não no Dashboard). Confirmar qual cenário antes de escalar.

**P: O resumo financeiro do dia deveria aparecer também no app?**

R: Hoje ele não aparece no app, de propósito: o card é escondido quando o acesso é pelo app. Além disso, o app não tem a tela de Controle Financeiro, então o "Ver tudo" do card não teria para onde levar. Quem precisa do resumo deve usar o dash pelo navegador (no celular também funciona pelo navegador). Levar o resumo para o app está registrado como pedido de produto em Próximos passos.

**P: O widget de agendamentos do dia está vazio, mas tem gente marcada pra hoje. Por quê?**

R: Causas mais comuns: (1) os agendamentos estão sem paciente vinculado, e o widget filtra fora bloqueios e eventos de aniversário. (2) O widget está filtrado num dentista que não tem agendamento hoje (verificar o seletor no topo do widget; se o usuário é dentista, ele já vem filtrado pra ele). (3) O fuso horário da clínica está errado em Configurações, então "hoje" no sistema é outro dia. (4) Cache do navegador desatualizado, vale o botão de recarregar no canto do widget.

**P: O dentista marcou que o paciente compareceu no widget e nada mudou visualmente. É bug?**

R: Não. A ação atualiza o status no backend, mas a linha continua na lista do dia. Para conferir, o registro aparece no histórico do paciente (Pacientes → Histórico de agendamentos) e impacta relatórios de comparecimento. Se a clínica está reclamando que "deveria sumir da lista", explicar que o desenho da tela mantém o agendamento visível até o fim do dia.

**P: O atalho "Indique & Ganhe" não aparece pra um usuário, mas aparece pra outro da mesma clínica. Por quê?**

R: Esse atalho some quando a assinatura **não está ativa** ou quando o usuário está no app em iPhone (iOS). Verificar status da assinatura da clínica e onde o usuário está acessando.

**P: O modal "Parabéns pela primeira venda" não aparece mais. Pode trazer de volta?**

R: O modal é registrado como visto no navegador (localStorage com a chave `@capim:first-sale-modal-viewed:1.0.0`). Em outro navegador ou aba anônima, ele reaparece se a clínica ainda está com 1 a 5 vendas na maquininha. Não tem botão de "mostrar de novo" na interface.

**P: O atalho "Assistente Capim com I.A." ou o da Camila aparece pra uma clínica e pra outra não. Como funciona?**

R: Os dois só aparecem no navegador, nunca no app. O atalho **Assistente Capim com I.A.** depende de uma lista de clínicas beta testers. O atalho da **Camila** só aparece se a configuração da clínica tiver o setup da Camila habilitado, e tem duas variações: se a clínica já concluiu a configuração inicial da Camila, aparece "Central da Camila" e abre as configurações; se ainda não concluiu, aparece "Ativar Assistente Camila IA" e abre a tela de ativação da Camila. Quem habilita: produto/comercial, pelo processo padrão de onboarding da Camila.

**P: O widget de migração de dados sumiu, a clínica está reclamando que perdeu o acompanhamento.**

R: O widget some quando a migração foi concluída e não há solicitações ativas, ou quando o usuário escolheu "Ocultar". Para acompanhar histórico de migrações, o caminho é Configurações → Migração de dados.

**P: A clínica está vendo "Novidades Capim" com um conteúdo estranho ou em branco.**

R: O bloco de Novidades é um iframe que aponta pra um link externo (varia se a clínica tem assinatura ativa ou não). Se o iframe veio em branco, pode ser bloqueio do navegador, adblocker, ou indisponibilidade do conteúdo. **Não aparece no app mobile.**

**P: O atalho "Boleto tradicional" aparece pra uma clínica e pra outra não.**

R: Esse atalho (do Carnê) só aparece para clínicas no experimento de reforma do carnê (Payment Book Reform). Não é GA. Quem decide elegibilidade do experimento é o time de produto.

**P: O dentista clica num card da Home simples (3 cards) e nada acontece, parece travado.**

R: O card vem marcado como "locked" (com cadeado) quando a clínica não tem o produto correspondente ativo. A Home simples só aparece para clínica sem `saas_enabled`, então os cards de Agenda e Pacientes (que dependem do sistema de gestão) sempre vêm travados ali, e só o card Financeiro fica liberado. Para destravar, a clínica precisa ter o sistema de gestão contratado e ativado.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Minha tela inicial está diferente da do meu sócio." | Diferença entre `saas_enabled` (Dashboard vs Home simples) ou permissões de usuário (resumo financeiro só aparece pra quem tem permissão). | Pedir print das duas telas. Confirmar papel e permissões dos usuários. Confirmar se a clínica é cliente do sistema de gestão. | Se a clínica deveria ver o Dashboard completo e está caindo na Home simples, escalar para o Time de Sustentação ativar `saas_enabled`. |
| "Não consigo ver o resumo financeiro na home." | Sem permissão de Controle Financeiro, ou acesso pelo app, ou clínica está na Home simples. | Confirmar canal (navegador ou app), papel do usuário e versão da tela. No app, orientar a usar o dash pelo navegador. | Se o usuário deveria ter permissão e não tem, ajustar em Configurações → Usuários. Bug só se nada acima encaixar. |
| "Abro o app e aparece 'Aplicativo Capim disponível somente para clínicas contratantes do sistema de gestão', e fica carregando." | Clínica sem `saas_enabled`. O app não abre para quem não tem o sistema de gestão. | Orientar a usar o dash pelo navegador (o próprio aviso tem link). Confirmar se a clínica contratou o sistema de gestão. | Se a clínica contratou o sistema de gestão, escalar para o Time de Sustentação conferir `saas_enabled`. |
| "O widget de agendamentos não atualiza." | Cache do navegador ou estado interno desatualizado. | Pedir pra clicar no botão de recarregar (ícone redondo) no canto do widget. Como alternativa, F5 na página. | Se mesmo após recarregar persiste, escalar pra eng com ID da clínica, ID do dentista filtrado e print. |
| "Marquei que o paciente compareceu pelo widget e não mudou." | A atualização salva no backend mas a tela mantém o agendamento na lista do dia, comportamento esperado. | Explicar o comportamento. Conferir no Histórico do paciente que a marcação foi salva. | Se a marcação não persistir mesmo no histórico, escalar pra eng. |
| "O atalho que eu usava sumiu (Indique & Ganhe, Camila, Boleto tradicional, Financiamento Capim, etc.)." | Atalhos condicionais: dependem de assinatura ativa, plataforma (app ou navegador), lista de beta testers, setup da Camila ou experimento. | Confirmar plataforma (navegador ou app), status da assinatura, qual atalho exatamente sumiu. | Se a clínica deveria ter o atalho e não tem, escalar pra produto/eng (depende de qual atalho: experimento, beta tester, setup de Camila). |
| "A página inicial está em branco / só carregando." | Pode ser falha ao carregar configurações da clínica (`getClinicConfigurations`), navegador travado ou indisponibilidade pontual da API. No app, pode ser o bloqueio de clínica sem sistema de gestão (linha acima). | Sugerir F5, sair e entrar de novo, testar em aba anônima. Verificar console do navegador se possível (peça print). | Se persistir, escalar pra eng com print do console, ID da clínica e horário. |
| "Cliquei num card e abriu um cadeado / não navegou." | Card travado (Home simples) porque a clínica não tem o produto ativo. | Explicar dependência: cards de Agenda e Pacientes dependem do sistema de gestão contratado; o card Financeiro depende do `dash_finance_enabled`. | Se a clínica afirma que contratou o produto e o card continua travado, escalar pra ativação. |
| "O banner de migração ainda aparece mesmo depois de concluir a migração." | Pode haver solicitação de migração residual ainda registrada. | Conferir Configurações → Migração de dados pra ver o histórico. | Se há registro pendente que não deveria existir, escalar pra eng pedindo limpeza. |
| "O iframe de Novidades Capim está em branco." | Adblocker, navegador bloqueando iframe, ou indisponibilidade do conteúdo. | Sugerir desativar adblocker, testar em outro navegador. | Persistindo em navegador limpo, escalar pra produto/marketing (são eles que mantêm o conteúdo do iframe). |
| "O modal de 'Primeira venda' não fecha / não para de aparecer." | Falha em registrar o evento no localStorage. | Pedir pra clicar em "Fechar" do modal. Como contorno, limpar localStorage do site. | Se o modal não fecha nem por clique no botão, escalar pra eng com print. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Toda issue de bug, ativação de configuração da clínica (`saas_enabled`, `dash_finance_enabled`), experimentos, liberação de atalho ou ajuste de permissão entra por esse canal. As configurações `saas_enabled` e `dash_finance_enabled` ficam no cadastro interno da clínica, fora do dash: o suporte não consegue vê-las nem mudá-las sozinho.

## > 6. ⚠️ Limitações conhecidas

* **Só existe a visão "hoje" no widget de agendamentos**. Não dá para o usuário olhar outro dia ou semana pelo widget; precisa abrir a Agenda.
* **Só existe a visão "hoje" no resumo financeiro**. Período maior só via Controle Financeiro.
* **O widget de agendamentos ignora aniversários e bloqueios**, mesmo que existam no dia. Eles seguem aparecendo na Agenda completa.
* **No app mobile, o Dashboard é mais enxuto.** Não aparecem: Novidades Capim, resumo financeiro, banner do Painel de vendas, convite da lista de espera do link de pagamento, atalho "Financiamento Capim" e atalho da Camila. No iPhone, também some o "Indique & Ganhe". O app também não tem a tela de Controle Financeiro.
* **O app não abre para clínica sem sistema de gestão.** Ela fica no aviso de app exclusivo e precisa usar o dash pelo navegador.
* **A escolha entre Dashboard completo e Home simples não é configurável pelo usuário.** Depende só de `saas_enabled` da clínica, ativado pelo time interno da Capim. O plano da clínica (inclusive "Só Maquininha") não muda essa escolha.
* **Atalhos exibidos não são personalizáveis pela clínica.** A lista é definida no sistema e variada apenas por flags/experimentos/elegibilidade.
* **O modal de "Primeira venda" é local ao navegador (localStorage).** Se a clínica troca de navegador, o modal pode reaparecer; e não há botão de "ver de novo".
* **Não há "menções" ou "alertas" agregados na Home** (ex: "você tem X notificações pendentes" no canto). Cada coisa aparece no widget próprio.
* **Sem alerta no Início para coisas críticas** (ex: notificações de WhatsApp falhadas, agendamentos sem dentista). O usuário só descobre entrando em cada módulo.

## > 7. 🗺️ Próximos passos [opcional]

* Unificação das duas telas (Home simples e Dashboard) em uma só, parametrizada por elegibilidade dos produtos. 🚧 PENDENTE: confirmar se está no roadmap.
* Expansão do widget de agendamentos para incluir filtros adicionais (sala, status, intervalo de datas). 🚧 PENDENTE.
* Personalização de atalhos por usuário. 🚧 PENDENTE.
* Versão do Início para clínicas que usam **apenas a maquininha** (hoje o sistema só diferencia quem tem ou não o sistema de gestão, e a Home simples não tem card de Maquininha). Pedido do time de CS (issue #2). 🚧 PENDENTE: pedido de produto, sem confirmação de roadmap.
* Resumo financeiro do dia **no app** (hoje o card é escondido no app, e o app não tem a tela de Controle Financeiro para onde o "Ver tudo" levaria). Pedido do time de CS (issue #4). 🚧 PENDENTE: pedido de produto, sem confirmação de roadmap.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: Dashboard completo, layout padrão com os widgets carregados]

[INSERIR PRINT: Home simples de 3 cards (clínica sem `saas_enabled`)]

[INSERIR PRINT: linha de atalhos rápidos no Dashboard]

[INSERIR PRINT: widget de agendamentos do dia com as três abas (Pendente confirmação, Confirmadas, Canceladas)]

[INSERIR PRINT: card de resumo financeiro com Entradas totais hoje, Saídas totais hoje, Saldo do dia]

[INSERIR PRINT: card de Novidades Capim (iframe)]

[INSERIR PRINT: card de Upgrade de plano]

[INSERIR PRINT: widget de migração de dados ativa]

[INSERIR PRINT: modal "Parabéns pela primeira venda"]

[INSERIR PRINT: card travado (cadeado) na Home simples]

[INSERIR PRINT: aviso do app para clínica sem sistema de gestão]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e disponibilidade**
* [x] Como o time de suporte confere/ativa a flag `saas_enabled` para uma clínica específica? **Resposta:** pelo dash, não confere nem ativa. O valor vem das configurações da clínica no backend (endpoint `/v3/retails/{id}/configurations`), o dash só lê, e nenhuma tela (nem Configurações, nem para admin) mostra ou altera. O suporte deduz pelo comportamento (Dashboard completo = ligado; Home simples, créditos pendentes após o login ou bloqueio no app = desligado) e escala para o Time de Sustentação. A ferramenta interna onde isso é ligado ficou como lacuna própria abaixo. (fonte: código do capim-dash-frontend, issue #3)
* [x] Como o suporte confere/ativa `dash_finance_enabled` (que controla o card "Financeiro" da Home simples)? **Resposta:** mesma situação de `saas_enabled`: vem das configurações da clínica no backend, o dash só lê e não há tela que mostre ou altere. Escalar para o Time de Sustentação. (fonte: código do capim-dash-frontend, issue #3)
* [ ] Em qual ferramenta interna (backoffice/admin, fora do dash) o Time de Sustentação confere e liga `saas_enabled` e `dash_finance_enabled` de uma clínica, e quem pode pedir a mudança? O código do dash não responde.
* [ ] Clínica no plano "Só Maquininha" fica com `saas_enabled` ligado ou desligado? Isso define se ela vê o Dashboard completo, a Home simples ou o bloqueio no app; o dash não diferencia pelo plano. (issue #2)
* [ ] Tem alguma clínica hoje em produção rodando na Home simples sem `saas_enabled`, ou todas as clínicas sem sistema de gestão já caem direto em créditos pendentes?

**Atalhos e widgets**
* [ ] Qual o processo oficial para colocar uma clínica como beta tester do "Assistente Capim com I.A." (atalho do Dashboard)?
* [x] O atalho "Ativar Camila" dispara WhatsApp pra um número de demo da Capim: qual é esse número e quem opera as conversas que entram por ele? **Resposta:** não se aplica mais. Hoje o atalho "Ativar Assistente Camila IA" abre a tela de ativação da Camila dentro do dash, sem WhatsApp de demo. (fonte: código do capim-dash-frontend, revisão de 13/11/2026)
* [ ] O atalho "Boleto tradicional" depende do experimento "Payment Book Reform". Qual o processo para uma clínica entrar nesse experimento?
* [ ] Existe alguma forma de a clínica esconder/reordenar atalhos no Dashboard, ou é totalmente fixo?

**Modal de "Primeira venda"**
* [ ] Existe alguma régua de quando esse modal volta a aparecer (ex: nova safra de vendas)? Pelo código, parece único por navegador, sem comeback.

**Operação**
* [x] Em app mobile, a lista exata de elementos que somem da Home/Dashboard. **Resposta:** somem Novidades Capim, resumo financeiro, banner do Painel de vendas, convite da lista de espera do link de pagamento, atalho "Financiamento Capim" e atalho da Camila; no iPhone, também o "Indique & Ganhe". Clínica sem sistema de gestão nem chega ao Início no app (fica no aviso de app exclusivo). (fonte: código do capim-dash-frontend, issue #4)

## > ✅ Validar com produto/eng antes de publicar

Itens que dependem de confirmação oficial:

* [ ] "A configuração `saas_enabled` da clínica decide se o usuário cai no Dashboard completo ou na Home simples de 3 cards." Confirmado pelo código do router (`dash.js` e `mobile.js`, `beforeEnter` da rota `home`). Validar com produto se a regra é só essa ou tem mais critérios.
* [ ] "O item 'Início' do menu lateral leva sempre para `/dashboard`, sem checar `saas_enabled`." Confirmado pelo código (`useSidebar.js`). Validar se é intencional que uma clínica sem sistema de gestão chegue ao Dashboard completo por esse item.
* [ ] "O modal de 'Primeira venda' aparece quando a clínica tem de 1 a 5 vendas na maquininha e some depois de fechado uma vez no navegador." Confirmado pelo código (`useFirstSaleModal.js`); validar com produto se há intenção de mudar essa régua.
* [ ] "Atalhos condicionais: Indique & Ganhe (some sem assinatura ativa ou no app em iPhone), Financiamento Capim (some no app), Assistente Capim com I.A. (só beta testers), Camila (depende de setup, só navegador), Boleto tradicional (depende de experimento)." Confirmado pelo código do `useShortcutWidget.js`; vale validar a tabela com produto.

### Itens já validados pelo backend/código (não precisa mais perguntar)

* O widget de agendamentos do dia filtra fora eventos do tipo aniversário e agendamentos sem paciente.
* O widget mostra apenas o intervalo do dia (hoje 00:00 às 23:59), por usuário (dentista) quando o usuário logado é dentista.
* Marcar comparecimento pelo widget atualiza o `attended` do agendamento via store de histórico.
* O card "Novidades Capim" é um iframe externo, com link diferente para clínica com assinatura ativa vs inativa, e some no app mobile.
* O card "Resumo Financeiro" só aparece para usuários com permissão de Controle Financeiro e não aparece no app mobile.
* A página `/` sempre redireciona para a rota `Home`, e a rota `Home` redireciona para `Dashboard` quando `saas_enabled` está ativo na clínica.
* No navegador, clínica sem `saas_enabled` que chega ao Início no carregamento do sistema é levada para créditos pendentes; no app, fica no aviso de app exclusivo para quem contratou o sistema de gestão (`Private.vue`).
* `saas_enabled` e `dash_finance_enabled` vêm das configurações da clínica no backend e não têm tela de visualização ou edição no dash.
* O modal "Primeira venda" usa localStorage (`@capim:first-sale-modal-viewed:1.0.0`) e dispara com 1 a 5 vendas na maquininha.
