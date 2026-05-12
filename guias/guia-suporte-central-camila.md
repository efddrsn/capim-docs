# 📘 Guia de Suporte: Central da Camila

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: gated por configuração da clínica (`ai_agent_scheduler_setup_enabled`). Quando essa configuração está ligada, a Central da Camila aparece no atalho da home e o menu lateral leva pra `/camila/settings`. 🚧 PENDENTE: confirmar se há gating de plano além desse setup interno.

## 1. 🎯 Visão geral

A **Central da Camila** é o painel dentro do dashboard Capim onde a clínica conecta a Camila ao WhatsApp e controla o que ela faz pelos pacientes. A Camila é a assistente de IA que atende o paciente direto pelo número da clínica: interpreta o que o paciente quer, faz o primeiro cadastro, consulta a agenda em tempo real, sugere e marca horário. O painel **não é onde o paciente conversa**, é onde a clínica liga, desliga e ajusta a Camila.

Resolve três dores: (1) paciente que manda mensagem fora do expediente e fica sem resposta, (2) recepção sobrecarregada com perguntas repetidas (preço, convênio, endereço, horário), (3) agenda com buracos porque ninguém retornou o lead a tempo.

**Para quem é:** clínicas que contrataram a Camila e tiveram o setup feito pela Capim (ligação interna `ai_agent_scheduler_setup_enabled`). Sem essa configuração, o atalho da Central da Camila aparece como "Ativar Camila" e leva pra um WhatsApp comercial em vez de abrir o painel.

**Quem acessa o painel dentro da clínica:** qualquer usuário do dashboard com permissão pra ver Configurações. 🚧 PENDENTE: confirmar se há recorte de perfil (admin x dentista x recepção) na visibilidade da Central da Camila.

**Onde se encaixa no produto Capim:** é a "sala de controle" da Camila. Conecta com **Agenda** (a Camila marca, cancela e remarca agendamentos que caem na agenda da clínica), com **Pacientes** (cria ficha do paciente quando ele fala pela primeira vez), com **Configurações de disponibilidade** (a Camila respeita os horários do dentista) e com a tela **Camila Connects**, em Comunicação, que é separada da Central de Configurações.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos pra Camila funcionar:**

* Setup interno da Capim feito (`ai_agent_scheduler_setup_enabled` ligado pela engenharia).
* Um número de WhatsApp dedicado da clínica (a Camila assume o WhatsApp da clínica via QR Code, então o número precisa estar livre pra ela).
* Pelo menos um dentista cadastrado com disponibilidade configurada em **Configurações → Configurar disponibilidade**. Sem isso, a Camila não consegue oferecer horário.
* Pacientes só recebem mensagem da Camila se entrarem em contato primeiro (a Camila responde, não prospecta ativamente dentro deste módulo).

**Onde acessar:**

* Menu lateral, ou pelo atalho da home da clínica (ícone com sparkles quando ainda não está ativa, ou ícone da Camila quando já está).
* URL típica: `/#/camila/settings`. Sub-telas: `/#/camila/settings/qrcode`, `/#/camila/settings/clinic-settings`, `/#/camila/settings/dentists-schedules`, `/#/camila/settings/ai-agent-settings`.

**Tela principal (Central da Camila):**

A clínica entra e vê três coisas:

1. **Avatar da Camila + balões de fala** mostrando o estado da conexão com WhatsApp: ✅ Conectada, ⚠️ Conexão perdida ou ❌ Desconectada. Quando conectada, os balões trazem atalhos pra "Ver na agenda" e "Falar no WhatsApp".
2. **Três cards de configuração** que levam pras sub-telas:
   * **Ajustes Camila** ("Gerencie as funções e conexão") → tela de identidade e funções da Camila + conexão WhatsApp.
   * **Configurações da clínica** ("Dados, pagamentos e convênios") → tela com 4 abas dos dados que a Camila usa pra responder o paciente.
   * **Agendas dos dentistas** ("Configure dias e horários") → lista dos dentistas com cartões individuais.
3. **FAQ** no rodapé com 3 perguntas estáticas (o que a Camila faz, se funciona em fim de semana, com quais módulos integra).

**Fluxo 1, ativar a Camila pela primeira vez (conectar WhatsApp via QR Code):**

1. Na Central da Camila, abrir **Ajustes Camila** → card **WhatsApp da clínica** mostra "Sem dispositivo conectado".
2. Clicar em **Conectar**. Cai na tela de **QR Code**.
3. Tela mostra 4 passos: abrir o WhatsApp do celular **com o número oficial da clínica**, ir em Mais Opções (⋮) no Android ou Configurações no iPhone, tocar em **Aparelhos conectados** → **Conectar aparelho**, e apontar a câmera pro QR Code da tela.
4. A tela faz polling de 1 em 1 minuto checando a conexão. Quando conecta, abre o modal **Conexão concluída** ("A Camila já está 100% integrada à sua clínica").
5. Se passar de 10 tentativas sem conectar, o sistema desloga a instância e gera novo QR Code automaticamente.

**Fluxo 2, desconectar a Camila:**

1. **Ajustes Camila** → card **WhatsApp da clínica** com status "Conectada" mostra link **Desconectar**.
2. Clica e abre modal de confirmação: "Você tem certeza de que quer desconectar a Camila? Ao desconectar o WhatsApp da sua clínica, a Camila não vai mais responder seus pacientes e nem outras ações. Você pode conectar de novo quando quiser."
3. Confirma. A Camila para de responder os pacientes pelo WhatsApp. Configurações ficam salvas, é só reconectar pra voltar.

**Fluxo 3, ajustar o que a Camila pode fazer (funções):**

Dentro de **Ajustes Camila**, há dois cards de comportamento:

* **Ative ou desative as funções** (toggles, modo assistente). Três switches independentes:
  * **Novos agendamentos** ("Para permitir que a Camila agende consultas.").
  * **Cancelar consultas** ("Permitir o cancelamento de consultas diretamente com a Camila.").
  * **Remarcar consultas** ("Autonomia para que a Camila encontre um novo horário na agenda para o paciente.").
* **Modo manual** (chips de tempo). "Defina o tempo que a Camila fica pausada após intervenção humana." Opções fixas: 1h, 2h, 4h, 8h, 12h, 24h. Quando alguém da clínica responde o paciente pelo WhatsApp, a Camila entra em pausa por esse tempo escolhido pra não atropelar o atendimento humano. ✅ Validar com produto a regra exata que dispara a pausa.

**Fluxo 4, personalizar como a Camila se apresenta (identidade):**

Card **Identidade da assistente**, na mesma tela de Ajustes Camila. Três campos:

* **Nome da assistente** (texto). É como a Camila se chama pro paciente.
* **Personalize a mensagem inicial** (textarea, até 2000 caracteres). A primeira mensagem que a Camila manda quando o paciente abre conversa.
* **Prefixo nas mensagens** (toggle). Quando ligado, a Camila começa cada resposta com **"Assistente -"** pra deixar claro que é IA. Quando desligado, a Camila responde sem rótulo.

Tem preview ao vivo da mensagem inicial logo abaixo dos campos.

**Fluxo 5, configurar dados da clínica que a Camila usa:**

Card **Configurações da clínica** abre uma tela com 4 abas (CapTabBar). Cada aba tem botão **Salvar** próprio. A tela pergunta antes de sair sem salvar (modal "Opa, espera um pouco!").

* **Dados da clínica:** telefone, CEP, endereço, número, bairro, cidade, estado, complemento + horários de atendimento da clínica (segunda a domingo, faixas de hora, com botão de copiar a mesma faixa pra todos os dias) + checkboxes do que a Camila pode pedir ao paciente (CPF, Endereço, Plano de saúde, Número da carteirinha).
* **Pagamentos:** PIX, Boleto, Cartão de crédito, Cartão de débito, Dinheiro, Financiamento Capim.
* **Convênios:** lista os convênios aceitos pela clínica (texto livre, ex: "Amil, Bradesco, MetLife").
* **Diferenciais:** texto livre com diferenciais da clínica que a Camila pode mencionar (ex: estacionamento, pontos de referência, preparos pra exames, comodidades).

Tudo aqui alimenta a Camila pra responder o paciente: se ele perguntar "vocês aceitam Bradesco?", "tem estacionamento?", "qual o endereço?", a resposta sai daqui.

**Fluxo 6, configurar agenda de cada dentista pra Camila:**

Card **Agendas dos dentistas** → lista de cartões, um por dentista, cada um com tag indicando se a agenda está **Ativada** ou **Desativada**. Clica em **Editar** num cartão e entra na edição daquele dentista (`/camila/settings/dentists-schedules/:id/edit`):

* **Agenda do dentista** (toggle): ativa ou desativa esse dentista pra Camila. Desativado, a Camila não oferece horário dele.
* **Editar detalhes**:
  * Especialidade (texto livre, ex: "Endodontia, Odontopediatria").
  * Duração da consulta de avaliação: 15, 30, 45 ou 60 minutos (radio).
  * Convênios aceitos pelo profissional (texto livre).
  * Atende crianças de até 12 anos: Sim / Não.
* **Quais os dias e horários de atendimento desse profissional**: por dia da semana, com toggle por dia (ativa/desativa) e faixas de hora editáveis (HH:mm às HH:mm), validando sobreposição de intervalo.

Esses horários são o mesmo modelo de **Disponibilidade** que a Agenda usa, então editar aqui reflete na agenda do dentista no módulo Agenda.

**⚠️ Atenção:**

* Conectar a Camila por QR Code é como conectar **WhatsApp Web em qualquer celular novo**: a Camila vira "um aparelho conectado" do WhatsApp da clínica. Se o celular oficial desconectar todos os aparelhos, ou se o WhatsApp for instalado em outro celular, a Camila cai e precisa reconectar.
* Desconectar a Camila **não apaga** as configurações. Tudo (identidade, dados, dentistas, funções) fica salvo e volta quando reconectar.
* **Modo manual** pausa a Camila por tempo determinado depois que um humano da clínica intervém na conversa. Não é uma pausa global manual configurável pela tela: é gatilho automático. ✅ Validar com produto a regra que considera "intervenção humana" (toda mensagem da clínica? alguma exceção?).
* O **prefixo "Assistente -"** é o jeito da Camila avisar o paciente que é IA. Desligar isso é uma escolha da clínica, mas tem implicações de transparência com o paciente. 🚧 PENDENTE: confirmar se há recomendação oficial pra clínicas sobre manter o prefixo.

## > 3. 💼 Casos de uso esperados

* **Caso 1, clínica acabou de assinar a Camila:** Capim faz o setup interno. Clínica entra na Central, abre Ajustes Camila, escaneia o QR Code com o celular do WhatsApp da clínica, vê o modal "Conexão concluída". Depois passa em **Configurações da clínica** preenchendo as 4 abas, em **Agendas dos dentistas** ativando cada profissional e ajustando duração e dias, e em **Ajustes Camila → Identidade** colocando nome e primeira mensagem. Em seguida ativa os toggles de função (no mínimo "Novos agendamentos") e está pronto.
* **Caso 2, clínica em férias coletivas:** clínica quer pausar a Camila por uma semana. Caminho mais direto: **Ajustes Camila → WhatsApp da clínica → Desconectar**. A Camila para de responder. Voltando das férias, conecta de novo (vai precisar escanear o QR Code outra vez).
* **Caso 3, recepcionista assume conversa que a Camila começou:** paciente está falando com a Camila pelo WhatsApp, recepção entra e responde pelo próprio WhatsApp Web da clínica. Pelo **Modo manual** configurado (ex: 2h), a Camila fica pausada nessa conversa pelo tempo escolhido pra não atropelar o atendimento humano. Depois desse tempo, volta a responder normalmente.
* **Caso 4, clínica não quer que a Camila cancele consultas:** vai em **Ajustes Camila → Ative ou desative as funções**, desliga o toggle **Cancelar consultas**. A Camila continua agendando e remarcando, mas se o paciente pedir pra cancelar, ela não cancela sozinha (presumivelmente direciona pra recepção). ✅ Validar com produto qual a mensagem que a Camila dá ao paciente quando uma função está desligada.
* **Caso 5, clínica adicionou um dentista novo:** o dentista é cadastrado no módulo Equipe. Pra Camila considerar esse dentista, é preciso ir em **Agendas dos dentistas**, encontrar o card dele (entra como Desativada), abrir, ativar a agenda, definir especialidade, duração da consulta de avaliação, convênios, se atende crianças e os dias/horários. Sem essas configurações preenchidas, a Camila pode ignorar o dentista ou agendar de forma genérica. 🚧 PENDENTE: confirmar com produto o comportamento da Camila pra dentistas recém-cadastrados sem configuração na Central.
* **Caso 6, clínica viu agendamento que a Camila marcou e quer confirmar que foi a IA:** o agendamento entra na Agenda como qualquer outro. O backend grava `created_by: artificial_intelligence`, **mas a tela da Agenda hoje não diferencia** visualmente. Resposta honesta pro cliente: a Central da Camila não tem uma "lista de agendamentos criados pela Camila"; pra ver as **conversas** que a Camila teve, o caminho é **Comunicação → Camila Connects** (tela separada via iframe).

## > 4. ❓ FAQ

**P: A clínica acabou de assinar e o item "Central da Camila" não aparece no atalho. Por quê?**

R: O atalho da Central só vira "Central da Camila" depois que a configuração `ai_agent_scheduler_setup_enabled` é ligada pelo backoffice da Capim. Antes disso, a clínica vê um atalho de "Ativar Camila" que abre um WhatsApp comercial em vez de abrir o painel. Suporte deve confirmar com o time interno se o setup já rodou pra essa clínica. 🚧 PENDENTE: confirmar canal exato pra suporte verificar/solicitar esse setup.

**P: O QR Code não funciona. O que verificar?**

R: Em ordem: (1) o celular está usando **o número oficial da clínica**, e não um número pessoal? (2) o WhatsApp do celular abre normalmente em "Aparelhos conectados"? (3) a câmera tá com permissão? (4) o QR Code expira: a tela gera um novo de tempos em tempos automaticamente, então recarregar a página com F5 costuma resolver. Se passar de 10 tentativas, o sistema desloga e gera outro. Se nada disso resolver, o botão **Chamar a Capim** na tela do QR Code abre WhatsApp da Capim pra suporte.

**P: A Camila parou de responder. O que aconteceu?**

R: Quase sempre é a conexão WhatsApp que caiu. Pedir pro cliente abrir **Central da Camila → Ajustes Camila** e checar o status do card WhatsApp da clínica: se aparecer "Desconectada" ou "Conexão perdida", o caminho é clicar em Conectar e refazer o QR Code. Causas comuns de queda: alguém desconectou os aparelhos no WhatsApp da clínica, o celular ficou muito tempo sem internet, ou o WhatsApp foi instalado em outro aparelho. Se aparecer "Conectada" e mesmo assim a Camila não responde, escalar.

**P: A Camila marcou consulta com convênio que a clínica nem aceita. Como?**

R: A Camila usa o que está em **Configurações da clínica → Convênios**. Se aquele convênio está listado lá, a Camila considera válido. Pedir pra clínica revisar a aba Convênios e a aba "Convênios aceitos" no card de cada dentista (em **Agendas dos dentistas**, há um campo de convênios por profissional, separado dos da clínica). Se o convênio não está em nenhum dos dois e a Camila marcou mesmo assim, escalar.

**P: A Camila marcou em horário que o dentista não atende. Como?**

R: Em tese, a Camila respeita os horários da aba **Agendas dos dentistas** + o status de **Agenda do dentista** (toggle Ativada/Desativada). Vale checar: (1) a agenda do dentista está Ativada? (2) os dias da semana estão com toggle ligado? (3) as faixas de hora cobrem o horário que ela marcou? (4) houve um **bloqueio pontual** criado depois da Camila ter oferecido o horário pro paciente? Esse último é o caso de corrida de timing entre a oferta da Camila e a criação do bloqueio pela clínica. 🚧 PENDENTE: confirmar o comportamento esperado da Camila quando um bloqueio é criado entre a oferta e a confirmação do paciente.

**P: O que é "Modo manual" e quando ele dispara?**

R: É o tempo que a Camila fica pausada **depois que um humano da clínica responde o paciente**. Funciona pra evitar dois atendimentos simultâneos no mesmo paciente (Camila e recepção falando ao mesmo tempo). A clínica escolhe entre 1h, 2h, 4h, 8h, 12h ou 24h em chips. ✅ Validar com produto a definição exata de "intervenção humana" que aciona a pausa.

**P: Onde a clínica vê as conversas que a Camila teve com os pacientes?**

R: Não é dentro da Central da Camila. É em **Comunicação → Camila Connects** (item no menu de Comunicação). Essa tela é um iframe que carrega a interface externa de conversas/leads da Camila. 🚧 PENDENTE: confirmar onde fica o histórico oficial de conversas e quais filtros existem.

**P: O agendamento que a Camila marcou aparece destacado na Agenda?**

R: Não, hoje a tela da Agenda **não diferencia visualmente** agendamentos criados pela Camila dos manuais. O backend grava `created_by: artificial_intelligence`, mas a UI não usa essa informação. Pra saber se um agendamento foi marcado pela Camila, o caminho prático é o histórico de conversa no Camila Connects ou escalar pra engenharia consultar o registro.

**P: Como mudar o nome ou a mensagem inicial da Camila?**

R: **Ajustes Camila → Identidade da assistente**. Edita Nome da assistente, Personalize a mensagem inicial (textarea de até 2000 caracteres), liga ou desliga o switch de **Prefixo nas mensagens** (que coloca "Assistente -" no início) e clica em **Salvar** no topo da página. Tem preview ao vivo da mensagem inicial logo abaixo dos campos.

**P: A clínica desligou a função de "Novos agendamentos". Como a Camila responde o paciente que pede pra marcar?**

R: ✅ Validar com produto a mensagem exata que a Camila usa quando uma função está desligada. O esperado é ela informar o paciente e direcionar pra recepção.

**P: A Camila pode pedir CPF, endereço, plano de saúde e número da carteirinha do paciente?**

R: Sim, em **Configurações da clínica → Dados da clínica**, há um bloco "O que a Camila pode solicitar ao paciente?" com 4 checkboxes: CPF, Endereço, Plano de saúde, Número da carteirinha do plano. A clínica marca o que quiser. Sem marcar, a Camila não pede esses dados no primeiro contato.

**P: A Camila atende fora do horário comercial?**

R: Sim, ela responde 24/7 enquanto estiver conectada (esse é um dos diferenciais de venda). Os horários de atendimento configurados em **Configurações da clínica → Dados da clínica** e em **Agendas dos dentistas** servem pra ela **oferecer horário de consulta** dentro do que a clínica trabalha, não pra limitar quando ela responde.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "A Camila não aparece no menu / atalho." | Setup interno (`ai_agent_scheduler_setup_enabled`) ainda não foi feito pra essa clínica. | Confirmar com o cliente se ele já assinou a Camila. Verificar internamente se o setup rodou. | Escalar pra time interno responsável pelo setup se o cliente afirma estar pagando e o setup não rodou. 🚧 PENDENTE confirmar canal. |
| "Conectei o QR Code, mas a Camila aparece como Desconectada." | Polling de 60s ainda não rodou; QR pode ter expirado; celular não confirmou. | Pedir pra atualizar a página (F5). Verificar no celular se "Aparelhos conectados" mostra a Camila. Se passou de 10 tentativas, o sistema gera novo QR sozinho. | Se reconectar repetidas vezes não funciona, escalar com print da tela de QR Code e ID da clínica. |
| "A Camila estava funcionando e parou de responder os pacientes." | Conexão WhatsApp caiu (motivos: outro aparelho assumiu, celular ficou offline, alguém desconectou aparelhos pelo celular da clínica). | Pedir pra abrir **Ajustes Camila** e checar o card WhatsApp da clínica. Se status diferente de "Conectada", clicar em Conectar e refazer o QR Code. | Se aparece "Conectada" e mesmo assim não responde, escalar com horário aproximado da última mensagem recebida e ID da clínica. |
| "A Camila ofereceu horário fora dos dias que o dentista atende." | Configuração da agenda do dentista na Central da Camila está incorreta ou desatualizada. | Abrir **Agendas dos dentistas**, entrar no cartão do dentista, conferir toggle Agenda do dentista (Ativada?), dias da semana e faixas de hora. Pedir pra ajustar e salvar. | Se a configuração está correta e a Camila continua errando, escalar com ID do agendamento da Camila e ID do dentista. |
| "A Camila marcou consulta com convênio que não aceitamos." | Convênio listado em **Configurações da clínica → Convênios** ou no card do dentista, mesmo a clínica não querendo. | Abrir as duas abas (Convênios da clínica e Convênios do dentista no card) e remover o que não se aceita. Salvar. | Escalar se o convênio não está em nenhum lugar e a Camila marcou mesmo assim. |
| "A Camila respondeu o paciente enquanto eu estava atendendo no WhatsApp." | Modo manual desligado ou com tempo curto demais. Ou a regra de detecção da intervenção humana não capturou. | Pedir pra subir o tempo do **Modo manual** (chips de 1h a 24h em **Ajustes Camila**) pra um valor maior. | Se a Camila continua respondendo dentro do tempo configurado, escalar com a conversa de exemplo e horário. |
| "Onde vejo o que a Camila falou com cada paciente?" | Funcionalidade não está dentro da Central da Camila. | Direcionar pra **Comunicação → Camila Connects** no menu lateral. | 🚧 PENDENTE confirmar a fonte oficial pra histórico de conversa antes de escalar. |
| "Quero saber quais agendamentos foram criados pela Camila." | A tela da Agenda hoje não diferencia visualmente. O backend grava `created_by: artificial_intelligence`. | Resposta honesta: hoje não tem na tela. Sugerir Camila Connects pra ver conversas que resultaram em agendamento. | Escalar pra engenharia se a clínica precisar do dado em massa (relatório). |
| "Quero desativar a Camila por uns dias mas sem perder as configurações." | Desconectar o WhatsApp é o jeito atual. Não há "pausa global" na tela. | Orientar a clicar em **Ajustes Camila → Desconectar** com confirmação. Reconectar via QR Code quando voltar. | Não escalar; é fluxo padrão. |
| "Mudei a primeira mensagem da Camila e ela continua mandando a antiga." | Pode ser cache da conversa em andamento, ou o backend ainda não propagou a atualização. | Pedir pra confirmar que clicou em **Salvar** e que viu o toast "Alterações salvas com sucesso". Testar com novo paciente. | Escalar se a clínica afirma que salvou e mesmo conversas novas continuam com a mensagem antiga (a atualização dispara um job interno `UpdatePromptJob`). |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Toda issue de bug, ativação de setup, dúvida de comportamento da IA que não está coberto nas configurações da tela, ou pedido de consulta interna no banco entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Sem "pausa global" pela tela.** Não existe botão "pausar a Camila por X dias". Pra pausar sem perder configurações, o caminho é **Desconectar** o WhatsApp.
* **Sem visão de conversas dentro da Central da Camila.** As configurações ficam aqui, mas o histórico de conversa entre paciente e Camila não. O caminho é **Comunicação → Camila Connects** (iframe externo). 🚧 PENDENTE confirmar se há outras visualizações além desse iframe.
* **Agenda não diferencia visualmente** agendamentos criados pela Camila dos manuais, mesmo o backend marcando `created_by: artificial_intelligence`.
* **Corrida de timing entre bloqueio e oferta de horário.** Se o dentista cria um bloqueio depois da Camila já ter oferecido aquele slot ao paciente, pode haver inconsistência. 🚧 PENDENTE confirmar comportamento esperado.
* **Modo manual tem opções fixas** (1h, 2h, 4h, 8h, 12h, 24h). Não dá pra escolher 30 minutos, nem 6 horas, nem desligar a pausa por completo pela tela.
* **Funções são granulares mas em três níveis fixos:** agendar, cancelar, remarcar. Não dá pra desligar só "remarcar consultas de ortodontia", por exemplo: é tudo ou nada por tipo de ação.
* **Conexão WhatsApp via QR Code é frágil:** comportamento padrão de "WhatsApp Web". Se o celular oficial desconectar aparelhos ou trocar de aparelho, a Camila cai e precisa reconectar manualmente.
* **Não há alerta proativo na tela do dashboard quando a Camila cai.** A clínica só descobre se abrir a Central da Camila e ver o status do card de WhatsApp, ou pelos balões de fala da Camila na home. 🚧 PENDENTE confirmar se há e-mail/push de alerta pra clínica quando a conexão cai.
* **Não há campo "fora do escopo" na identidade.** A clínica configura nome, primeira mensagem e prefixo "Assistente -", mas não consegue editar pela tela o tom, o estilo ou regras específicas de resposta da Camila. ✅ Validar com produto se há outra superfície pra isso (ex: configurado pela Capim no backoffice).
* **Sem histórico de versões das configurações.** Se a clínica trocar nome da Camila ou desligar uma função, não há log na tela mostrando quem alterou e quando.

## > 7. 🗺️ Próximos passos [opcional]

* Diferenciação visual de agendamentos da Camila na Agenda. 🚧 PENDENTE confirmar status.
* Histórico de conversa unificado dentro do dashboard (em vez do iframe Camila Connects). 🚧 PENDENTE.
* Mais granularidade no Modo manual (valores customizáveis ou pausa global). 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: Central da Camila, tela principal, com avatar + balões + 3 cards + FAQ]

[INSERIR PRINT: Tela de QR Code com os 4 passos numerados]

[INSERIR PRINT: Modal "Conexão concluída"]

[INSERIR PRINT: Tela Ajustes Camila com WhatsApp da clínica, AssistantMode, ManualMode e Identidade]

[INSERIR PRINT: Modal de confirmação de desconexão da Camila]

[INSERIR PRINT: Tela Configurações da clínica com as 4 abas (Dados, Pagamentos, Convênios, Diferenciais)]

[INSERIR PRINT: Bloco "O que a Camila pode solicitar ao paciente?" com 4 checkboxes]

[INSERIR PRINT: Tela Agendas dos dentistas, grid de cartões com status Ativada/Desativada]

[INSERIR PRINT: Tela de edição de um dentista, com toggle de disponibilidade, formulário e dias/horários]

[INSERIR PRINT: Tela Camila Connects em Comunicação, mostrando que é externa via iframe]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e ativação**
* [ ] Há gating de plano ou só `ai_agent_scheduler_setup_enabled` controla a disponibilidade da Camila pra clínica?
* [ ] Canal oficial pra suporte verificar/solicitar que o setup interno da Camila rode pra uma clínica que acabou de assinar.
* [ ] Recorte de perfil (admin, dentista, recepção) na visibilidade da Central da Camila no menu.

**Conexão e operação**
* [ ] Existe alerta proativo (e-mail, push, banner) pra clínica quando a conexão WhatsApp da Camila cai?
* [ ] Existe "pausa manual global" planejada, ou desconectar continua sendo o jeito?

**Comportamento da Camila**
* [ ] Mensagem exata que a Camila dá pro paciente quando uma função (agendar, cancelar, remarcar) está desligada na configuração da clínica.
* [ ] Definição operacional de "intervenção humana" que dispara o Modo manual: qualquer mensagem da clínica? só do número conectado? exceções?
* [ ] Comportamento da Camila quando o dentista cria bloqueio pontual entre a oferta do horário e a confirmação do paciente.
* [ ] Comportamento da Camila pra dentistas recém-cadastrados que ainda não têm configuração na Central (Agenda do dentista Desativada por padrão? Camila ignora?).
* [ ] Recomendação oficial sobre manter o prefixo "Assistente -" ligado (transparência com paciente).

**Visibilidade e relatórios**
* [ ] Local oficial onde a clínica vê o histórico completo de conversas Camila × paciente (Camila Connects iframe é o único? tem filtros, busca, exportação?).
* [ ] Há planos pra diferenciar visualmente na Agenda os agendamentos criados pela Camila?
* [ ] Existe relatório agregado de agendamentos criados pela Camila (volume por mês, conversão de conversa em consulta)?

**Escalação**
* [ ] SLA esperado de resposta do Time de Sustentação pra issues da Camila por severidade.

## > ✅ Validar com produto/eng antes de publicar

Itens inferidos do código que ainda dependem de confirmação oficial:

* [ ] **Funções (toggles) são independentes:** o backend aceita qualquer combinação dos 3 valores (`0_Agendar_consultas`, `1_Cancelar_consultas`, `2_Remarcar_consultas`). Confirmado pelo código (`ASSISTANT_MODES`), mas vale checar com produto se "desligar tudo" tem comportamento previsto (a Camila vira só um FAQ?).
* [ ] **Modo manual** é gatilho automático por intervenção humana com timeout fixo (`manual_mode_timeout_minutes`). Valida com produto a regra exata.
* [ ] **Tipos de dado que a Camila pode pedir ao paciente** são exatamente CPF, endereço, plano de saúde e número da carteirinha (`REQUESTED_INFO_TYPES`). Confirma se essa lista é fechada hoje.
* [ ] **Atualização das configurações dispara `UpdatePromptJob` async** depois do save. Pra produto confirmar se há cache/propagação que possa fazer a mudança demorar uns minutos pra refletir nas conversas em andamento.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Conexão da Camila com WhatsApp é via QR Code do tipo WhatsApp Web, com polling de 60s e auto-relogout após 10 tentativas sem sucesso.
* As 4 sub-telas da Central são `/camila/settings`, `/camila/settings/qrcode`, `/camila/settings/clinic-settings`, `/camila/settings/dentists-schedules` (com edit em `/dentists-schedules/:id/edit`) e `/camila/settings/ai-agent-settings`.
* Valores fixos do **Modo manual**: 60, 120, 240, 480, 720, 1440 minutos.
* Valores fixos da **duração da consulta** por dentista: 15, 30, 45, 60 minutos.
* Lista fechada de funções: Novos agendamentos, Cancelar consultas, Remarcar consultas.
* Lista fechada de tipos de informação que a Camila solicita: CPF, endereço, plano de saúde, número da carteirinha.
* Agendamentos criados pela Camila vão pra Agenda com `created_by: artificial_intelligence`, mas a UI não diferencia.
* Desconectar a Camila preserva todas as configurações; só interrompe a comunicação.
* Camila Connects é uma tela em Comunicação que carrega URL externa via iframe (`VITE_CAMILA_CONNECTS_URL`).
* O atalho do dashboard só vira "Central da Camila" quando `ai_agent_scheduler_setup_enabled` está ligado pelo backoffice; sem isso, vira CTA "Ativar Camila" que abre WhatsApp comercial.
