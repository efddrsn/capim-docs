# 📘 Guia de Suporte: Central de Relacionamento

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA, controlada por feature flag `FF_DEALS_ENABLED` no backend (sem flag, os deals nem são criados automaticamente). 🚧 PENDENTE: confirmar se essa flag está hoje em 100% das clínicas ou se ainda há gating por clínica.

## 1. 🎯 Visão geral

A Central de Relacionamento é o **kanban de recuperação de consulta** da clínica. Não é um CRM de leads de campanha nem de orçamento: é o lugar onde a recepção e o time comercial da clínica acompanham os pacientes que **faltaram** na consulta ou que **desmarcaram**, e organizam o contato pra trazer essa pessoa de volta (ligar, mandar WhatsApp, reagendar, ou marcar como "desistiu"). ✅ Validar com produto o nome "comercial" que eles dão pra esse fluxo.

Resolve uma dor bem específica da clínica: paciente que faltou ou desmarcou costuma "sumir" depois que sai do grid da agenda. A Central junta esses casos numa visão única, com card por paciente, e permite registrar o que aconteceu no contato (anotação livre) e mover entre estágios conforme a recuperação evolui.

**Para quem é:** clínicas com a feature flag `FF_DEALS_ENABLED` ativa. O item de menu aparece em **Comunicação → Central de relacionamento**, e fica oculto para clínicas de rede sem assinatura. 🚧 PENDENTE: confirmar com produto se hoje essa flag está ligada por padrão pra todas as clínicas pagas.

**Onde se encaixa no produto Capim:** é uma camada de **acompanhamento pós-agenda**. Os cards aqui **não são criados manualmente**: eles aparecem automaticamente quando um agendamento na Agenda muda de status pra "Cancelado" ou é marcado como "Não compareceu". A Central conecta com Pacientes (cada card tem botão pra abrir a ficha clínica) e com WhatsApp (botão "Abrir WhatsApp" direto do card).

⚠️ **Importante:** o nome "Central de Relacionamento" sugere um CRM completo, mas hoje o produto **só cobre dois pipelines fixos: Faltas e Desmarcados**. Não há pipeline customizado, não há cadastro de lead solto, não há campo de "valor da oportunidade", "origem", "responsável" ou criação manual de deal. Se a clínica pedir esses recursos, é evolução de produto, não configuração. ✅ Validar com produto.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Feature flag `FF_DEALS_ENABLED` ativa pra clínica. Sem ela, os cards nem são criados quando um agendamento é cancelado ou marcado como falta.
* O agendamento original na Agenda precisa ter **paciente vinculado** (com ficha cadastrada). Agendamento sem paciente não gera card. ✅ Validar com produto se essa restrição é intencional.
* Pra usar o botão "Abrir WhatsApp" do card, o paciente precisa de celular no cadastro.

**Onde acessar:**

* Menu lateral → Comunicação → Central de relacionamento.
* URL típica: `/communication/deal_pipelines`.
* Ao entrar, a clínica vê **dois cards de pipeline** lado a lado:
  * **Faltas**: pacientes que não compareceram a consultas.
  * **Desmarcados**: pacientes que recusaram agendamentos.
* Clicar em "Visualizar" abre o kanban daquele pipeline (`/communication/deal_pipelines/time_slots_not_attended` ou `/communication/deal_pipelines/time_slots_canceled`).

**Estágios (colunas) de cada pipeline:**

* Pipeline **Faltas**: Faltou → Contato realizado → Remarcado → Compareceu → Desistiu da consulta.
* Pipeline **Desmarcados**: Desmarcou → Contato realizado → Remarcado → Compareceu → Desistiu da consulta.

Os estágios são fixos no código. **A clínica não consegue criar, renomear ou remover colunas.** ✅ Validar com produto se há previsão de customização.

**Fluxo típico (como um card aparece):**

1. Na Agenda, a recepção marca um agendamento como "Cancelado" (paciente desmarcou) ou marca o paciente como "Não compareceu" depois do horário.
2. O backend dispara um job (`HandleOriginatedDealJob`) que cria um card no pipeline correspondente, na coluna inicial ("Desmarcou" ou "Faltou"), com **estágio = 0**.
3. O card aparece na Central de Relacionamento com o nome do paciente, dentista, data e hora do agendamento original.

**Fluxo típico (trabalhar o card):**

1. O usuário entra na Central, escolhe o pipeline (Faltas ou Desmarcados).
2. Clica no card do paciente. Abre um modal com:
   * Nome do paciente.
   * Dentista responsável pelo agendamento original.
   * Data do agendamento.
   * Email (com botão "Copiar"), telefone (com botão "Abrir WhatsApp").
   * Botão pra abrir a ficha clínica do paciente (ícone de usuário).
   * Botão pra excluir o card (ícone de lixeira).
   * Campo de **anotação livre** ("Notas") salvo no card.
3. Faz o contato (WhatsApp, telefone, o que for) e registra na anotação o que aconteceu.
4. Arrasta o card pra próxima coluna conforme o resultado:
   * Conseguiu falar com o paciente: arrasta pra **"Contato realizado"**.
   * Paciente aceitou remarcar: arrasta pra **"Remarcado"**. Isso abre a gaveta de novo agendamento (mesma gaveta da Agenda) já pré-preenchida com o paciente, pra clínica criar o novo horário.
   * Paciente compareceu na consulta remarcada: arrasta pra **"Compareceu"**.
   * Paciente desistiu de vez: arrasta pra **"Desistiu da consulta"**.

**Drag-and-drop e transições permitidas:**

A movimentação entre estágios **não é livre**: o frontend bloqueia transições inválidas. As regras (idênticas pros dois pipelines, fora a coluna inicial):

* Da coluna inicial (Faltou / Desmarcou) → pode ir pra Contato realizado ou Desistiu da consulta.
* De Contato realizado → pode ir pra Remarcado ou Desistiu da consulta.
* De Remarcado → pode ir pra Compareceu ou Desistiu da consulta.
* De Compareceu → só pode ir pra Desistiu da consulta.
* De Desistiu da consulta → só pode voltar pra Compareceu.

Tentar arrastar pra uma coluna não permitida: o drag não conclui, o card volta pra origem. **Não há mensagem explícita de erro**, o card simplesmente "recusa" a soltar.

**Filtros disponíveis na visão de pipeline:**

* **Por paciente**: campo de busca no topo da tela do pipeline (selecionar paciente já cadastrado).
* **Período padrão fixo**: o frontend pede sempre os últimos 14 dias retroativos + 14 dias à frente (no pipeline de Desmarcados) ou últimos 14 dias até hoje (no pipeline de Faltas). **A clínica não tem seletor de período na tela**. ✅ Validar com produto se essa janela é fixa por design ou se é evolução pendente.
* **Não há filtro** por dentista, por origem do agendamento, por responsável pela recuperação, por estágio.

**⚠️ Atenção:**

* **Cards não são criados manualmente.** Tecnicamente o modal de exclusão diz textualmente "A ação não poderá ser desfeita e não é possível adicionar manualmente." Se a clínica pedir pra criar um card pra um paciente que faltou em um agendamento de antes da Central existir, **não tem caminho pela interface**.
* **Excluir card é definitivo na visão da clínica.** Tecnicamente o backend faz "soft delete" (`discard`), mas não há botão de reverter na tela.
* **A movimentação pra "Remarcado" abre a gaveta de novo agendamento.** Se a clínica fechar a gaveta sem salvar, o card volta pra coluna de origem (rollback automático).
* **Comparecimento marcado aqui também atualiza o agendamento original.** Quando o card vai pra "Compareceu", o sistema chama a API que marca o `time_slot.attended = true` no agendamento original.
* **Não existe filtro nem visão "por responsável".** Não há campo de "dono do card" no modelo. Qualquer usuário da clínica que tenha acesso ao menu vê e mexe em qualquer card. ✅ Validar com produto se há previsão de atribuição.

## > 3. 💼 Casos de uso esperados

* **Caso 1, recuperação de falta no fim do dia:** dentista marca dois pacientes do dia como "Não compareceu" na Agenda. Os dois caem automaticamente no pipeline Faltas, coluna "Faltou". No dia seguinte, a recepção abre a Central, vê os dois, clica no primeiro, abre WhatsApp pelo botão, conversa, paciente concorda em remarcar. Recepção arrasta o card pra "Remarcado", a gaveta de novo agendamento abre, ela marca pra semana que vem. Card fica em "Remarcado".
* **Caso 2, paciente que desmarcou tenta ser recuperado:** paciente liga e cancela. Recepção marca o agendamento como "Cancelado" na Agenda. Card aparece em Desmarcados, coluna "Desmarcou". Recepção liga, paciente diz que prefere semana que vem. Card vai pra "Contato realizado" enquanto a recepção busca horário, depois pra "Remarcado" quando o novo agendamento é criado.
* **Caso 3, paciente que faltou e desistiu:** recepção tenta contato três vezes em uma semana e o paciente não retorna. Anota nas Notas o que tentou e arrasta direto pra "Desistiu da consulta". Card sai da rotina diária mas fica registrado.
* **Caso 4, paciente compareceu na remarcação:** o card está em "Remarcado". Quando o agendamento remarcado acontece e a recepção marca presença na Agenda, o card vai pra "Compareceu" (porque o `attended` do time_slot original também é atualizado quando o usuário arrasta o card pra "Compareceu" pela Central). 🚧 PENDENTE: confirmar com produto se há também sincronização inversa (marcar presença na Agenda no agendamento novo refletir no card antigo). Pela leitura do código, a relação `originated_deal ↔ time_slot original` é fixa, então atualizar o agendamento novo não muda o card antigo.

## > 4. ❓ FAQ

**P: A clínica diz que não enxerga "Central de relacionamento" no menu. Por quê?**

R: Três motivos possíveis: (1) a clínica é de rede sem assinatura (o item de Comunicação inteiro fica oculto). (2) A feature flag `FF_DEALS_ENABLED` está desligada (mais provável se a clínica nunca viu o menu). (3) O usuário está em uma resolução pequena ou o item está dentro do submenu "Comunicação" e precisa expandir. Antes de escalar, confirmar pela URL direta `/communication/deal_pipelines` se o item carrega. 🚧 PENDENTE: confirmar com produto/eng o caminho oficial pra ativar a flag por clínica.

**P: A clínica quer criar um card pra um paciente do nada (sem ter cancelado um agendamento). Como faz?**

R: Hoje **não dá**. Os cards só nascem automaticamente quando um agendamento é cancelado ou marcado como falta. O próprio modal de exclusão informa: "não é possível adicionar manualmente". Se a clínica quer registrar contato com um paciente fora desse fluxo, hoje a recomendação é anotar na ficha do paciente, na Agenda, ou (futuramente) usar Campanhas. ✅ Validar com produto.

**P: O paciente recusou um agendamento, mas o card não apareceu na Central. Por quê?**

R: Checar nessa ordem: (1) A flag `FF_DEALS_ENABLED` está ativa pra essa clínica? Sem ela o backend nem cria o card. (2) O agendamento tinha paciente vinculado? Time slot sem paciente não gera card. (3) O status real do time slot na Agenda é "Cancelado" (e não só "Pendente" sumindo da grid)? (4) A janela de período da tela é os últimos 14 dias retroativos: se o agendamento original era de mais de 14 dias atrás, pode ter saído da visão. Pra confirmar, buscar pelo nome do paciente no filtro da própria tela.

**P: Por que tem dois pipelines parecidos? Qual a diferença entre Faltas e Desmarcados?**

R: **Desmarcados** são pacientes que avisaram que não vinham (agendamento foi cancelado antes do horário). **Faltas** são pacientes que simplesmente não apareceram (marcado como "não compareceu" depois do horário). O tratamento de recuperação costuma ser diferente, por isso ficam separados. As colunas internas são quase iguais, só a primeira muda (Desmarcou vs Faltou).

**P: A recepcionista tentou arrastar um card e ele "não deixou" soltar em outra coluna. Bug?**

R: Não, é regra de fluxo. Cada coluna só aceita cards vindos de colunas específicas (ver seção 2, "Drag-and-drop e transições permitidas"). Exemplo comum: tentar voltar um card de "Remarcado" pra "Contato realizado" não é permitido. Se a clínica precisa "voltar atrás" porque a remarcação caiu, hoje não tem botão. Alternativa prática: usar a anotação pra registrar e arrastar pra "Desistiu" se for o caso.

**P: O card foi pra "Remarcado" mas a gaveta de agendamento não abriu. O que faz?**

R: A movimentação pra "Remarcado" dispara a abertura da gaveta de novo agendamento (a mesma da Agenda). Se não abriu, possivelmente a gaveta foi bloqueada por outro modal aberto, ou houve um erro no carregamento de dentistas/notificações. Pedir pra recarregar a página e tentar de novo. Se persistir, escalar pra eng com print, ID da clínica e ID do card (deal).

**P: Como filtrar por dentista ou por responsável pela recuperação?**

R: **Não dá hoje.** O único filtro da tela é busca por paciente. Não há filtro por dentista, por origem do agendamento, nem por responsável. Não existe campo de "dono do card" no produto. Se a clínica quer dividir a recuperação entre recepcionistas, hoje a única forma é combinar offline e usar a anotação pra registrar quem fez o contato.

**P: Pode controlar quem da clínica vê a Central?**

R: O menu fica oculto pra clínicas de rede sem assinatura. Dentro de uma clínica habilitada, **qualquer usuário com acesso ao dashboard vê e mexe**. Não há diferenciação por papel (admin vs dentista vs recepcionista) na visualização ou na ação dos cards. ✅ Validar com produto se existe alguma restrição não evidente.

**P: Excluí um card por engano. Como recupero?**

R: Pela interface, **não tem como**. O backend faz soft-delete (mantém no banco com `discarded_at`), mas a tela não tem botão de restaurar. Pra recuperar, escalar pra engenharia com o ID do card. 🚧 PENDENTE: confirmar canal oficial pra esse tipo de pedido.

**P: O card aparece pro paciente em algum lugar? O paciente vê isso?**

R: **Não.** A Central de Relacionamento é interna da clínica. O paciente não recebe nenhuma notificação automática quando um card é criado ou movido. Os contatos (WhatsApp, ligação) são iniciados manualmente pela recepção a partir do card.

**P: A clínica perguntou se dá pra registrar valor de orçamento, fonte de origem (Instagram, indicação), responsável pelo deal. Onde está isso?**

R: **Não existe hoje.** O modelo de dados do card tem só: paciente, dentista, data do agendamento original, estágio, anotação livre e pipeline (Faltas ou Desmarcados). Não há campo de valor, origem, responsável, próxima ação. Se a clínica quer isso, é pedido de evolução pra produto.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o usuário relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não vejo o menu Central de relacionamento." | Clínica sem a flag `FF_DEALS_ENABLED`, ou clínica de rede sem assinatura, ou submenu Comunicação fechado. | Tentar abrir pela URL direta `/communication/deal_pipelines`. Se carregar, é o menu colapsado. Se não carregar, é a flag ou o tipo de clínica. | Se a clínica é cliente pagante e a flag deveria estar ligada, escalar pedindo ativação com ID da clínica. |
| "Cancelei um agendamento e o card não apareceu na Central." | Flag desligada, agendamento sem paciente vinculado, agendamento antigo (fora da janela de 14 dias) ou job de criação ainda não rodou. | Confirmar status real do agendamento na Agenda. Buscar pelo paciente no filtro da Central. Se nada, esperar alguns segundos e recarregar (o job é assíncrono). | Se o agendamento atende todos os critérios e o card não aparece após alguns minutos, escalar com ID do clinic, ID do time_slot e horário do cancelamento. |
| "Arrastei um card e ele voltou pra coluna original sem aviso." | Transição não permitida (regras de fluxo) ou erro de rede no PATCH do estágio. | Conferir se a transição pretendida é permitida (ver tabela em "Como funciona"). Se for permitida e ainda assim falhar, pedir pra recarregar e tentar de novo. | Se transição permitida falha consistentemente, escalar com ID da clínica, ID do card e estágio origem/destino. |
| "Movi um card pra 'Remarcado' mas a gaveta de agendamento não abriu." | Conflito com outro modal, erro de carregamento de dentistas ou erro no carregamento do paciente padrão. | Recarregar a página, refazer o movimento. Pedir print do console se possível. | Sempre escalar pra eng se acontece mais de uma vez. |
| "Movi pra 'Compareceu' e o paciente não aparece como atendido na Agenda." | A atualização vai pra um time_slot específico (o original do card). Se a clínica esperava que isso refletisse no agendamento remarcado, é confusão de fluxo. | Explicar: o card aponta pro agendamento original. Marcar "Compareceu" no card marca presença no agendamento original, não no novo. | Escalar só se há divergência real entre o card e o time_slot original (`attended` não bateu). |
| "Recepcionista quer filtrar por dentista / origem / responsável." | Recurso não existe. | Explicar que hoje só dá pra filtrar por paciente. Anotar a demanda. | Encaminhar pra produto como feedback de evolução. |
| "Quero criar um card manualmente." | Recurso não existe; o produto deixa isso explícito no modal de exclusão. | Explicar a limitação. Sugerir caminhos alternativos (anotar na ficha do paciente, criar agendamento e cancelar não é alternativa válida porque vira ruído na agenda). | Encaminhar pra produto como feedback. |
| "Excluí um card por engano e quero recuperar." | Soft-delete no banco; sem reversão pela tela. | Coletar ID do card (deal) e contexto. | Escalar pra eng pedindo restore. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Pedidos de ativação de flag, restore de card excluído e bugs de movimentação entram por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Pipelines são fixos (Faltas e Desmarcados).** Não há criação, renomeação ou customização de pipelines/estágios pela clínica.
* **Cards não são criados manualmente.** Só por gatilho automático a partir da Agenda (cancelamento ou falta).
* **Sem campo de valor, origem, responsável.** O card carrega só paciente, dentista, data do agendamento, anotação livre e estágio.
* **Sem filtro por dentista, por origem, por estágio ou por responsável.** Só filtro por paciente.
* **Janela de período fixa em código** (14 dias retroativos + 14 dias à frente em Desmarcados; 14 dias retroativos em Faltas). Sem seletor na tela.
* **Sem visão "por responsável" ou divisão entre recepcionistas.** Qualquer usuário da clínica vê e mexe em todos os cards.
* **Transições de estágio bloqueadas sem mensagem clara.** Drag inválido só "não solta", sem toast explicativo.
* **Reversão de exclusão não existe na interface.** Só engenharia consegue restaurar.
* **Sem notificação automática ao paciente.** A Central não dispara WhatsApp / SMS / email automaticamente; tudo é iniciado manualmente pela recepção pelo botão "Abrir WhatsApp" do card.
* **Dependência da flag `FF_DEALS_ENABLED`.** Sem flag ativa, mesmo cancelar agendamento não cria card.

## > 7. 🗺️ Próximos passos [opcional]

* 🚧 PENDENTE: confirmar com produto se existe roadmap pra Central virar CRM mais completo (criar deal manualmente, custom stages, atribuição por responsável).
* 🚧 PENDENTE: confirmar se a flag `FF_DEALS_ENABLED` está em 100% das clínicas ou se há gating.
* 🚧 PENDENTE: confirmar integração futura com Campanhas (lead de campanha virar card aqui).

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: tela de seleção dos dois pipelines (Faltas / Desmarcados)]

[INSERIR PRINT: kanban do pipeline Faltas com cards em colunas diferentes]

[INSERIR PRINT: modal de detalhe do card com botões Copiar email, Abrir WhatsApp, ficha clínica, excluir]

[INSERIR PRINT: gaveta de novo agendamento aberta após arrastar pra "Remarcado"]

[INSERIR PRINT: modal de confirmação de exclusão do card]

[INSERIR PRINT: filtro por paciente no topo da tela do pipeline]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Disponibilidade e gating**
* [ ] A flag `FF_DEALS_ENABLED` está ligada hoje pra 100% das clínicas pagas, ou ainda há rollout por clínica?
* [ ] Caminho oficial pro suporte pedir ativação da flag pra uma clínica específica.
* [ ] Existe gating por plano (ex: só clínicas em plano X têm acesso)?

**Comportamento de criação automática**
* [ ] Agendamento sem paciente cadastrado nunca gera card. Confirmar se essa é regra intencional ou limitação.
* [ ] Quando o agendamento é cancelado pela Camila (IA), o card é criado da mesma forma?
* [ ] Quando o agendamento original é restaurado por engenharia (reativado), o card existente é descartado automaticamente? (Pelo código, sim: `DiscardOriginatedDeal` roda quando o time_slot deixa de estar cancelado, mas validar na prática.)

**Filtros e visões**
* [ ] A janela de período (14 dias retroativos + 14 à frente) é por design ou é evolução pendente?
* [ ] Há previsão de filtro por dentista, por responsável, ou por estágio?

**Customização**
* [ ] Há roadmap pra permitir custom stages ou criação manual de cards?
* [ ] Há roadmap pra integrar com Campanhas (lead de campanha virar card aqui)?

**Operação e correção**
* [ ] Canal oficial pra pedir restore de card excluído por engano.
* [ ] Bugs conhecidos em produção hoje na Central (não potenciais): existe lista mantida em algum lugar?

**Escalação**
* [ ] SLA esperado de resposta pra cada nível de severidade no Time de Sustentação.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] Nomenclatura "Central de Relacionamento" como nome de produto vs "Deal Pipelines" do código: qual é o termo oficial usado em conversas com clientes?
* [ ] Modal de exclusão diz "não é possível adicionar manualmente". Confirmar se essa é a mensagem que continua em produção e se não há plano de mudar.
* [ ] Comportamento exato quando o card vai pra "Compareceu": o frontend chama `update_attended` no time_slot original; confirmar com produto se a expectativa é mesmo essa.
* [ ] Quando um agendamento é cancelado e depois "reativado" via engenharia, o card existente é descartado automaticamente pelo `DiscardOriginatedDeal`. Validar na prática com produto.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend` e `capim-dash-frontend`, podem ser tratados como confirmados:

* Existem exatamente dois pipelines: `time_slots_not_attended` (Faltas) e `time_slots_canceled` (Desmarcados). Pipelines novos exigem mudança de código.
* Estágios são fixos no código (`CANCELED_STAGES` e `NOT_ATTENDED_STAGES` em `src/constants/deals.js`).
* Transições permitidas entre estágios são fixas (`STAGES_ALLOWED_CHANGES` no mesmo arquivo).
* Cards são criados automaticamente por job (`Deals::HandleOriginatedDealJob`) quando um `TimeSlot` muda status pra `canceled` ou `attended = false`, e só se a flag `FF_DEALS_ENABLED` estiver ligada.
* Criação manual de card não existe (não há endpoint `create` no `DealsController`, só `index`, `update`, `destroy`).
* Modelo `Deal` carrega apenas: pipeline, dealstage, dealable (TimeSlot polimórfico), anotação. Não há valor, origem, responsável.
* Filtros disponíveis na API: pipeline, patient_id, intervalo de datas. Não há filtro por dentista ou por estágio direto.
* Exclusão é soft-delete via `Discard::Model`. A tela não tem botão de reverter.
* Movimentação pra "Remarcado" abre a gaveta de novo agendamento (mesma da Agenda).
* Movimentação pra "Compareceu" atualiza o `attended` do `TimeSlot` original via endpoint `time_slots/update_attended`.
* O menu fica oculto pra `isNetworkClinicWithoutSubscription` em `useSidebar.js`.
* Não há diferenciação de papel (admin / dentista / recepcionista) na visualização ou edição de cards.
