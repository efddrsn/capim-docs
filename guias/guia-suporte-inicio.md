# 📘 Guia de Suporte: Início (Home / Dashboard)

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. Existem duas telas distintas por trás de "Início" (HomeView simples e DashboardView completo), e o sistema decide qual mostrar automaticamente conforme a configuração da clínica.

## 1. 🎯 Visão geral

A tela de Início é a primeira coisa que o usuário vê depois de logar na Capim. É o "painel" da clínica: um único lugar que junta os agendamentos do dia, atalhos para as ações mais usadas (novo agendamento, novo paciente, novo crédito), um resumo financeiro do dia, banners de comunicação da Capim e widgets contextuais (migração de dados, upgrade de plano, microcrédito). A ideia é responder em um piscar de olhos: "o que eu preciso resolver hoje?" e "como começo uma tarefa rápida?".

**Para quem é:** todas as clínicas cliente da Capim. Não há gating de plano para acessar a tela de Início. O que muda é **qual versão** da tela aparece para a clínica.

**Existem duas telas por trás de "Início":**

* **Dashboard completo** (rota interna `/dashboard`): é a versão "rica", com agendamentos do dia, atalhos, resumo financeiro, novidades da Capim, banners. Aparece quando a clínica tem a configuração `saas_enabled` ativa.
* **Home simples** (rota interna `/home`): só mostra três cards de navegação (Agenda, Pacientes e Financeiro/Crédito). Aparece quando a clínica **não** tem `saas_enabled` (tipicamente clínicas que entraram só pelo produto de crédito/BNPL, sem o SaaS odontológico completo).

O usuário **não escolhe** entre as duas: o sistema redireciona conforme a configuração da clínica. Para o suporte, a regra prática é: se a clínica é cliente do SaaS, ela vê o Dashboard; se é só de produto financeiro, vê a Home simples.

**Onde se encaixa no produto Capim:** é o hub de entrada. Tudo passa por aqui depois do login. Os atalhos disparam ações em outros módulos (abrem gaveta de novo agendamento da Agenda, gaveta de novo paciente, etc.), e o widget de agendamentos é uma "miniatura" da Agenda do dia.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Usuário logado na Capim com vínculo ativo a uma clínica.
* Para ver o Dashboard completo (e não a Home simples de 3 cards), a clínica precisa ter `saas_enabled` ativo nas configurações. 🚧 PENDENTE: confirmar onde o suporte verifica/ativa essa flag para uma clínica específica.

**Onde acessar:**

* É a tela inicial: depois do login, cai direto nela. A URL raiz (`/`) redireciona para Início automaticamente.
* No menu lateral, há um item "Início" (ícone de casa) que volta para essa tela de qualquer ponto do sistema.
* URL típica: `/#/home` (que redireciona para `/#/dashboard` quando a clínica tem SaaS habilitado).

**O que aparece no Dashboard completo (clínica com SaaS habilitado):**

Coluna principal (esquerda):

1. **Widget de migração de dados** (só aparece se a clínica está migrando de outro software ou se há solicitação de migração ativa). Mostra o status da migração ou um banner pra começar.
2. **Banner de microcrédito** (só para clínicas elegíveis ao produto de microcrédito da Capim).
3. **Atalhos rápidos** (linha de cards clicáveis). Atalhos padrão: "Agendamento" (abre gaveta de novo agendamento), "Paciente" (abre gaveta de novo paciente), "Crédito" (vai para a tela de créditos pendentes), "Indique e Ganhe" (abre gaveta do programa Member Get Member), "Capim POS" (vai para transações de cartão), "Link de auto agendamento". Atalhos condicionais: "Assistente IA" (só para clínicas beta testers), "Carnê" (só se a clínica está no experimento de reforma do carnê), "Camila" (configurar Central da Camila, varia conforme o setup).
4. **Widget de agendamentos do dia** (mini agenda): lista os agendamentos de hoje agrupados por status em três abas (Pendentes, Confirmados, Cancelados). Mostra horário, dentista, paciente, marca de "primeira consulta" e permite marcar Compareceu/Não compareceu direto dali. Tem botão de recarregar (refetch) no topo. Limite por aba: poucos eventos visíveis (paginado), com botão "Ver mais" que abre a Agenda completa em nova aba. Se o usuário logado é dentista, o widget já filtra para a agenda dele. Se for recepcionista/admin, aparece um seletor de dentista no header do widget.

Coluna lateral (direita):

5. **Novidades Capim**: iframe com notícias/comunicados da Capim (campanhas, novidades de produto). O link do iframe muda conforme a clínica está com assinatura ativa ou não. **Não aparece no app mobile.**
6. **Upgrade de plano**: card que oferece desconto pra upgrade do plano anual. Só aparece para clínicas elegíveis (varia conforme tempo de assinatura e plano atual).
7. **Resumo financeiro do dia**: card com "Entradas", "Saídas" e "Total" do dia (do controle financeiro), com botão para criar novo lançamento e link para abrir o Controle Financeiro completo. Só aparece se o usuário tem permissão de Controle Financeiro **e não está no app mobile**.

**Outros elementos que podem aparecer no Dashboard:**

* **Modal "Primeira venda"**: aparece automaticamente uma única vez quando a clínica fez entre 1 e 5 transações no produto de crédito, parabenizando e abrindo o fluxo de indique-e-ganhe. Depois de fechado uma vez, fica marcado no navegador (localStorage) e não volta a aparecer.
* **Popover de cross-sell**: aparece para clínicas elegíveis ao produto Carnê.

**O que aparece na Home simples (clínica sem SaaS, só produto financeiro):**

* Título "Início" centralizado.
* Três cards de navegação grandes: **Agenda**, **Pacientes** e **Financeiro** (ou Créditos, dependendo da configuração).
* Cards podem aparecer com cadeado (locked) quando a clínica não tem o produto correspondente ativo. Clicar num card travado não navega.

**Fluxo típico (dentista/recepcionista logando pela manhã):**

1. Faz login. Cai direto na tela de Início (Dashboard ou Home simples).
2. No Dashboard, olha o widget de agendamentos do dia para ver quem chega.
3. Usa os atalhos para tarefas rápidas (marcar novo agendamento sem precisar entrar na Agenda inteira, cadastrar paciente novo sem sair daqui).
4. Confere "Entradas/Saídas" do dia no resumo financeiro lateral.
5. Lê as novidades da Capim na coluna lateral.

**⚠️ Atenção:**

* **A tela de "Início" não é uma só.** Se uma clínica diz "minha home é diferente da do meu colega", a primeira hipótese é que uma clínica tem `saas_enabled` e outra não, ou que os dois usuários têm permissões diferentes (o resumo financeiro, por exemplo, só aparece para quem tem permissão de Controle Financeiro).
* **No app mobile, parte do Dashboard some**: o card de Novidades Capim e o resumo financeiro não aparecem no app, mesmo que apareçam no navegador.
* O **resumo financeiro mostra só o dia de hoje**, não acumulado nem mês. Para ver período maior, clicar em "Ver tudo" e abrir o Controle Financeiro.
* O **widget de agendamentos do dia mostra só hoje**, e só lista agendamentos que têm paciente vinculado (eventos de aniversário e bloqueios não aparecem). Para ver outros dias, vai para a Agenda.
* O modal "Primeira venda" aparece **uma única vez por navegador**. Se a clínica reclamar que "perdi o modal de parabéns", o registro fica no localStorage do navegador, então em outro navegador/dispositivo pode reaparecer.

## > 3. 💼 Casos de uso esperados

* **Caso 1, recepcionista começa o dia:** loga, vê no widget de agendamentos quem está marcado pra hoje, confirma os pendentes pelo próprio widget, marca "Compareceu" nos que já chegaram. Sem precisar abrir a Agenda inteira.
* **Caso 2, dentista cadastrando paciente novo entre consultas:** clica no atalho "Paciente" no Dashboard, a gaveta de novo paciente abre por cima do Dashboard mesmo, preenche e salva. Não muda de tela.
* **Caso 3, recepcionista marcando agendamento rápido:** clica em "Agendamento" nos atalhos. Abre a gaveta de novo agendamento (a mesma da Agenda), preenche e salva. O agendamento aparece no widget da Home se for pra hoje, ou só na Agenda se for futuro.
* **Caso 4, dentista querendo ver "quanto entrou hoje":** olha o resumo financeiro no canto direito. Se quer detalhe, clica em "Ver tudo" e cai no Controle Financeiro do dia.
* **Caso 5, clínica recém migrada de outro software:** o widget de migração de dados aparece no topo do Dashboard mostrando status (em andamento, concluída, com erro). Depois que a migração some, o widget some.
* **Caso 6, clínica que só tem produto de crédito (sem SaaS):** loga e cai na Home simples de três cards. Clica em "Financeiro" e vai pra área de créditos. Não tem widget de agendamentos, não tem atalhos, não tem resumo financeiro.
* **Caso 7, dentista visualizando só os agendamentos dele:** o sistema detecta que o usuário logado é dentista e o widget de agendamentos já abre filtrado para a agenda dele, sem precisar selecionar. Para admin/recepcionista, aparece um seletor de dentista no widget.

## > 4. ❓ FAQ

**P: A clínica diz "minha tela inicial mudou", o que aconteceu?**

R: Provavelmente a clínica teve a flag `saas_enabled` ativada (ou desativada) e migrou entre a Home simples (3 cards) e o Dashboard completo. Antes de escalar, peça um print pra confirmar qual das duas o usuário está vendo agora. Se a clínica espera o Dashboard completo e está caindo na Home simples, é caso de produto/eng ativar a flag.

**P: O usuário não vê o card de resumo financeiro. Por quê?**

R: Três motivos possíveis: (1) o usuário não tem a permissão de Controle Financeiro vinculada (admin tem por padrão, dentista comum não). (2) Está acessando pelo app mobile (o card foi escondido no mobile). (3) A clínica está na Home simples (não no Dashboard). Confirmar qual cenário antes de escalar.

**P: O widget de agendamentos do dia está vazio, mas tem gente marcada pra hoje. Por quê?**

R: Causas mais comuns: (1) os agendamentos estão sem paciente vinculado, e o widget filtra fora bloqueios e eventos de aniversário. (2) O widget está filtrado num dentista que não tem agendamento hoje (verificar o seletor no topo do widget; se o usuário é dentista, ele já vem filtrado pra ele). (3) O fuso horário da clínica está errado em Configurações, então "hoje" no sistema é outro dia. (4) Cache do navegador desatualizado, vale o botão de recarregar no canto do widget.

**P: O dentista marcou "Compareceu" no widget e nada mudou visualmente. É bug?**

R: Não. A ação atualiza o status no backend, mas a linha continua na lista do dia. Para conferir, o registro aparece no histórico do paciente (Pacientes → Histórico de agendamentos) e impacta relatórios de comparecimento. Se a clínica está reclamando que "deveria sumir da lista", explicar que o desenho da tela mantém o agendamento visível até o fim do dia.

**P: O atalho "Indique e Ganhe" não aparece pra um usuário, mas aparece pra outro da mesma clínica. Por quê?**

R: Esse atalho some quando a assinatura **não está ativa** ou quando o usuário está no app mobile (iOS). Verificar status da assinatura da clínica e onde o usuário está acessando.

**P: O modal "Parabéns pela primeira venda" não aparece mais. Pode trazer de volta?**

R: O modal é registrado como visto no navegador (localStorage com a chave `@capim:first-sale-modal-viewed:1.0.0`). Em outro navegador ou aba anônima, ele reaparece se a clínica ainda está com transações entre 1 e 5. Não tem botão de "mostrar de novo" na interface.

**P: O atalho "Assistente IA" / "Camila" aparece pra uma clínica e pra outra não. Como funciona?**

R: O atalho de **Assistente IA** depende de uma flag global (clínicas beta testers). O atalho de **Camila** (Central da Camila) aparece em duas variações: se a clínica já tem o setup do agent scheduler habilitado, aparece "Camila" e abre as configurações; se não tem mas a flag de Camila está ligada, aparece "Ativar Camila" e dispara um WhatsApp pra um número de demo. Quem ativa: produto/comercial, pelo processo padrão de onboarding da Camila.

**P: O widget de migração de dados sumiu, a clínica está reclamando que perdeu o acompanhamento.**

R: O widget some quando a migração foi concluída e não há solicitações ativas. Para acompanhar histórico de migrações, o caminho é Configurações → Migração de dados.

**P: A clínica está vendo "Novidades Capim" com um conteúdo estranho ou em branco.**

R: O bloco de Novidades é um iframe que aponta pra um link externo (varia se a clínica tem assinatura ativa ou não). Se o iframe veio em branco, pode ser bloqueio do navegador, adblocker, ou indisponibilidade do conteúdo. **Não aparece no app mobile.**

**P: O atalho "Carnê" aparece pra uma clínica e pra outra não.**

R: O atalho de Carnê só aparece para clínicas no experimento de reforma do carnê (Payment Book Reform). Não é GA. Quem decide elegibilidade do experimento é o time de produto.

**P: O dentista clica num card da Home simples (3 cards) e nada acontece, parece travado.**

R: O card vem marcado como "locked" (com cadeado) quando a clínica não tem o produto correspondente ativo. Por exemplo, a Home simples sem `saas_enabled` trava os cards de Agenda e Pacientes (que dependem do SaaS) e libera só o card de Financeiro/Crédito. Para destravar, a clínica precisa ter o SaaS contratado/ativado.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o dentista relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Minha tela inicial está diferente da do meu sócio." | Diferença entre `saas_enabled` (Dashboard vs Home simples) ou permissões de usuário (resumo financeiro só aparece pra quem tem permissão). | Pedir print das duas telas. Confirmar papel e permissões dos usuários. Confirmar se a clínica é cliente do SaaS. | Se a clínica deveria ver o Dashboard completo e está caindo na Home simples, escalar pra produto/eng ativar `saas_enabled`. |
| "Não consigo ver o resumo financeiro na home." | Sem permissão de Controle Financeiro, ou acesso por app mobile, ou clínica está na Home simples. | Confirmar canal (web ou app), papel do usuário e versão da tela. | Se o usuário deveria ter permissão e não tem, ajustar em Configurações → Usuários. Bug só se nada acima encaixar. |
| "O widget de agendamentos não atualiza." | Cache do navegador ou estado interno desatualizado. | Pedir pra clicar no botão de recarregar (ícone redondo) no canto do widget. Como alternativa, F5 na página. | Se mesmo após recarregar persiste, escalar pra eng com ID da clínica, ID do dentista filtrado e print. |
| "Marquei Compareceu/Não compareceu pelo widget e não mudou." | A atualização salva no backend mas a UI mantém o agendamento na lista do dia, comportamento esperado. | Explicar o comportamento. Conferir no Histórico do paciente que a marcação foi salva. | Se a marcação não persistir mesmo no histórico, escalar pra eng. |
| "O atalho que eu usava sumiu (Indique e Ganhe, Camila, Carnê, etc.)." | Atalhos condicionais: dependem de assinatura ativa, plataforma (mobile vs web), flag de beta tester ou experimento. | Confirmar plataforma (web/app), status da assinatura, qual atalho exatamente sumiu. | Se a clínica deveria ter o atalho e não tem, escalar pra produto/eng (depende de qual atalho: flag de experimento, beta tester, setup de Camila). |
| "A página inicial está em branco / só carregando." | Pode ser falha ao carregar configurações da clínica (`getClinicConfigurations`), navegador travado ou indisponibilidade pontual da API. | Sugerir F5, sair e entrar de novo, testar em aba anônima. Verificar console do navegador se possível (peça print). | Se persistir, escalar pra eng com print do console, ID da clínica e horário. |
| "Cliquei num card e abriu um cadeado / não navegou." | Card travado (Home simples) porque a clínica não tem o produto ativo. | Explicar dependência: cards de Agenda e Pacientes dependem do SaaS contratado; card de Crédito/Financeiro depende do `dash_finance_enabled`. | Se a clínica afirma que contratou o produto e o card continua travado, escalar pra ativação. |
| "O banner de migração ainda aparece mesmo depois de concluir a migração." | Pode haver solicitação de migração residual ainda registrada. | Conferir Configurações → Migração de dados pra ver o histórico. | Se há registro pendente que não deveria existir, escalar pra eng pedindo limpeza. |
| "O iframe de Novidades Capim está em branco." | Adblocker, navegador bloqueando iframe, ou indisponibilidade do conteúdo. | Sugerir desativar adblocker, testar em outro navegador. | Persistindo em navegador limpo, escalar pra produto/marketing (são eles que mantêm o conteúdo do iframe). |
| "O modal de 'Primeira venda' não fecha / não para de aparecer." | Falha em registrar o evento no localStorage. | Pedir pra clicar em "Fechar" do modal. Como contorno, limpar localStorage do site. | Se o modal não fecha nem por clique no botão, escalar pra eng com print. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Toda issue de bug, ativação de flag (`saas_enabled`, `dash_finance_enabled`, experimentos), liberação de atalho ou ajuste de permissão entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Só existe a visão "hoje" no widget de agendamentos**. Não dá para o usuário olhar outro dia ou semana pelo widget; precisa abrir a Agenda.
* **Só existe a visão "hoje" no resumo financeiro**. Período maior só via Controle Financeiro.
* **O widget de agendamentos ignora aniversários e bloqueios**, mesmo que existam no dia. Eles seguem aparecendo na Agenda completa.
* **No app mobile, Novidades Capim e resumo financeiro não aparecem.** Quem usa o app vê uma Home mais enxuta.
* **A escolha entre Dashboard completo e Home simples não é configurável pelo usuário.** Depende da flag `saas_enabled` da clínica, ativada pelo time interno da Capim.
* **Atalhos exibidos não são personalizáveis pela clínica.** A lista é definida no frontend e variada apenas por flags/experimentos/elegibilidade.
* **O modal de "Primeira venda" é local ao navegador (localStorage).** Se a clínica troca de navegador, o modal pode reaparecer; e não há botão de "ver de novo".
* **Não há "menções" ou "alertas" agregados na Home** (ex: "você tem X notificações pendentes" no canto). Cada coisa aparece no widget próprio.
* **Sem alerta no Início para coisas críticas** (ex: notificações de WhatsApp falhadas, agendamentos sem dentista). O usuário só descobre entrando em cada módulo.

## > 7. 🗺️ Próximos passos [opcional]

* Unificação das duas telas (Home simples e Dashboard) em uma só, parametrizada por elegibilidade dos produtos. 🚧 PENDENTE: confirmar se está no roadmap.
* Expansão do widget de agendamentos para incluir filtros adicionais (sala, status, intervalo de datas). 🚧 PENDENTE.
* Personalização de atalhos por usuário. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: Dashboard completo, layout padrão com os widgets carregados]

[INSERIR PRINT: Home simples de 3 cards (clínica sem `saas_enabled`)]

[INSERIR PRINT: linha de atalhos rápidos no Dashboard]

[INSERIR PRINT: widget de agendamentos do dia com as três abas (Pendentes, Confirmados, Cancelados)]

[INSERIR PRINT: card de resumo financeiro com Entradas, Saídas, Total]

[INSERIR PRINT: card de Novidades Capim (iframe)]

[INSERIR PRINT: card de Upgrade de plano]

[INSERIR PRINT: widget de migração de dados ativa]

[INSERIR PRINT: modal "Parabéns pela primeira venda"]

[INSERIR PRINT: card travado (cadeado) na Home simples]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e disponibilidade**
* [ ] Como o time de suporte confere/ativa a flag `saas_enabled` para uma clínica específica?
* [ ] Como o suporte confere/ativa `dash_finance_enabled` (que controla o card "Financeiro" da Home simples)?
* [ ] Tem alguma clínica hoje em produção rodando na Home simples sem `saas_enabled`, ou todas as clínicas SaaS já caem no Dashboard?

**Atalhos e widgets**
* [ ] Qual o processo oficial para colocar uma clínica como beta tester do "Assistente IA" (atalho do Dashboard)?
* [ ] O atalho "Ativar Camila" dispara WhatsApp pra um número de demo da Capim: qual é esse número e quem opera as conversas que entram por ele?
* [ ] O atalho "Carnê" depende do experimento "Payment Book Reform". Qual o processo para uma clínica entrar nesse experimento?
* [ ] Existe alguma forma de a clínica esconder/reordenar atalhos no Dashboard, ou é totalmente fixo?

**Modal de "Primeira venda"**
* [ ] Existe alguma régua de quando esse modal volta a aparecer (ex: nova safra de transações)? Pelo código, parece único por navegador, sem comeback.

**Operação**
* [ ] Em app mobile, a lista exata de elementos que somem da Home/Dashboard (este guia cobre Novidades e resumo financeiro com base no código; vale conferir se há outros).

## > ✅ Validar com produto/eng antes de publicar

Itens que dependem de confirmação oficial:

* [ ] "A flag `saas_enabled` na configuração da clínica decide se o usuário cai no Dashboard completo ou na Home simples de 3 cards." Confirmado pelo código do router (`dash.js`, `beforeEnter` da rota `home`). Validar com produto se a regra é só essa ou tem mais critérios.
* [ ] "O modal de 'Primeira venda' aparece quando a clínica tem entre 1 e 5 transações de crédito e some depois de fechado uma vez no navegador." Confirmado pelo código (`useFirstSaleModal.js`); validar com produto se há intenção de mudar essa régua.
* [ ] "Atalhos condicionais: Indique e Ganhe (some sem assinatura ativa ou no iOS), Assistente IA (só beta testers), Camila (depende de setup), Carnê (depende de experimento)." Confirmado pelo código do `useShortcutWidget.js`; vale validar a tabela com produto.

### Itens já validados pelo backend/código (não precisa mais perguntar)

* O widget de agendamentos do dia filtra fora eventos do tipo aniversário e agendamentos sem paciente.
* O widget mostra apenas o intervalo do dia (hoje 00:00 às 23:59), por usuário (dentista) quando o usuário logado é dentista.
* Marcar "Compareceu/Não compareceu" pelo widget atualiza o `attended` do agendamento via store de histórico.
* O card "Novidades Capim" é um iframe externo, com link diferente para clínica com assinatura ativa vs inativa, e some no app mobile.
* O card "Resumo Financeiro" só aparece para usuários com permissão de Controle Financeiro e não aparece no app mobile.
* A página `/` sempre redireciona para a rota `Home`, e a rota `Home` redireciona para `Dashboard` quando `saas_enabled` está ativo na clínica.
* O modal "Primeira venda" usa localStorage (`@capim:first-sale-modal-viewed:1.0.0`) e dispara entre 1 e 5 transações.
