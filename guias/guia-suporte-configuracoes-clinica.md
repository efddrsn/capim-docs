# 📘 Guia de Suporte: Configurações da clínica (estruturais)

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. Cobre os ajustes "estruturais" da clínica em Configurações: dados cadastrais, usuários e papéis, procedimentos e migração de dados. Configurações de agenda, disponibilidade e notificações estão em guia separado. Configurações de documentos, prescrições, anamnese e maquininhas de cartão também estão em guias separados.

## 1. 🎯 Visão geral

As Configurações da clínica são onde o admin define a "espinha dorsal" do uso da Capim: quem é a clínica (CNPJ, razão social, endereço), quem trabalha nela (dentistas e equipe de recepção, com papel e permissões), o catálogo de procedimentos que vai aparecer ao agendar e orçar, e o caminho de entrada quando a clínica está migrando do software antigo. Pense em "ajustes do prédio" antes de começar a atender: sem isso, a clínica até consegue usar a Camila e abrir a Agenda, mas vai esbarrar em campos vazios, permissões erradas e dados ausentes.

Resolve três dores: clínica que assinou e não sabe por onde começar (migração + cadastro inicial), clínica que cresceu e precisa controlar quem vê o quê (usuários e permissões), e clínica que quer padronizar valores e nomes de procedimentos para orçar mais rápido.

**Para quem é:** todas as clínicas cliente da Capim. As telas existem em qualquer plano. O que muda por plano são features específicas dentro de Capim Pay (Capininha) e financeiro, controladas por permissões individuais por usuário. 🚧 PENDENTE: lista oficial de planos e quais features acompanham cada um.

**Quem mexe nessas telas dentro da clínica:** na prática, o **admin** da clínica. O backend não bloqueia tela por tela com policy explícita (não existe `ProcedureTypePolicy` ou `UserPolicy` restringindo acesso a admin no código), mas convencionalmente é o admin que mexe em Configurações. ✅ Validar com produto se a regra "só admin acessa Configurações" deve ser comunicada como oficial ou se a clínica é livre para abrir essas telas com qualquer usuário.

**Onde se encaixa no produto Capim:** conecta com a Agenda (dentistas cadastrados aqui aparecem como agenda própria; procedimentos cadastrados aparecem no formulário de agendamento), com o Orçamento (catálogo de procedimentos com valor sugerido), com o Financeiro (permissões `access-financial-control-*` controlam o que cada usuário vê), com o Capim Pay e a Capininha (permissões `access-*-capininha`) e com a Central da Camila (Camila reconhece o dentista, os procedimentos e a clínica pelas configurações).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Estar logado como **admin** da clínica para o caminho recomendado. Outros usuários podem chegar nas telas pela URL, mas a documentação oficial trata como "ajustes do admin". ✅ Validar.
* Para Procedimentos e Migração, a clínica precisa estar com onboarding minimamente concluído (ter ao menos um dentista cadastrado).

**Onde acessar:**

* Menu lateral → Configurações. URL típica: `/#/settings`. A rota raiz redireciona para `Clinic`, então a tela inicial é "Dados da clínica".
* Sub-rotas principais cobertas neste guia:
  * `/#/settings/clinic`: dados da clínica.
  * `/#/settings/users`, `/#/settings/users/new`, `/#/settings/users/:id`: usuários.
  * `/#/settings/procedures`: catálogo de procedimentos.
  * `/#/settings/data-migration` e `/#/settings/data-migration-internal`: migração de dados.

**Fluxo típico (atualizar dados da clínica):**

1. Vai em Configurações → Dados da clínica.
2. Visualiza: CNPJ ou CPF (em "Identificador"), razão social ("Legal name"), nome fantasia, telefone, endereço completo (CEP, logradouro, número, complemento, bairro, cidade, estado) e logo.
3. Para editar nome/telefone/endereço, clica em "Editar". **A edição depende da feature flag `VUE_APP_FF_CLINIC_EDIT_ENABLED` estar ligada** no ambiente. Se a flag estiver desligada, a clínica só visualiza e a única coisa editável é o logo. 🚧 PENDENTE confirmar com produto se essa flag está hoje GA em todas as clínicas ou ainda em rollout.
4. Para alterar CNPJ, CPF ou razão social, **não existe edição pela tela**: esses campos só são preenchidos na assinatura/onboarding e ficam congelados na UI. Mudança aqui passa pelo Time de Sustentação.
5. Logo: clica em "Enviar logo", escolhe arquivo, salva. Aceita apagar pelo botão de remover.
6. Conta bancária (BankAccount) aparece como seção separada nesta mesma tela. ⚠️ Conta bancária pertence ao módulo de Capim Pay/Capininha e está coberta no guia de maquininhas.

**Fluxo típico (cadastrar um novo usuário):**

1. Vai em Configurações → Usuários da clínica → "Novo usuário".
2. Preenche nome completo (validador exige nome e sobrenome), telefone, e-mail.
3. Escolhe o papel ("role"): **Dentista** ou **Equipe** (`staff`, recepção e demais perfis não clínicos). 🚧 PENDENTE confirmar com produto o rótulo final exibido para `staff` na UI da clínica.
4. Se for Dentista: aparecem campos extras de **cor do perfil** (usada na Agenda, com 11 cores disponíveis) e **registro profissional** (estado e número de CRO).
5. Marca, se quiser, a flag **Administrador da clínica** (campo `admin`). Admin tem acesso total a tudo, inclusive financeiro e a essas mesmas Configurações.
6. Liga ou desliga as permissões granulares listadas em três grupos:
   * **Agenda** (`schedules`): `show-all-schedules` (ver agenda de outros) e `edit-all-schedules` (editar agenda de outros).
   * **Financeiro** (`financial`): `access-financial-control-all` (controle financeiro completo), `access-financial-control-user` (controle financeiro só do próprio usuário) e `access-patient-financial-operations` (operações financeiras do paciente).
   * **Capininha** (`capininha`): `access-transactions-capininha`, `access-receivables-capininha`, `access-split-capininha`, `access-spot-capininha`. ⚠️ As permissões de Split e Antecipação (Spot) dependem das de Transações e Recebíveis: se a clínica ligar uma das duas primeiras, o sistema **auto-marca** Transações e Recebíveis (eles passam a aparecer travados como dependência).
7. Clica em "Criar". O backend dispara em paralelo: e-mail de definição de senha para o usuário recém-criado, criação das permissões padrão de `staff` (quando o papel for staff), criação do registro no Bubble (sistema legado de operação), criação de disponibilidade padrão de agenda (se dentista) e criação do registro de UserSettings.

**Fluxo típico (editar um usuário existente):**

1. Vai em Configurações → Usuários da clínica → clica no ícone de lápis na linha do usuário.
2. **E-mail não é editável** depois que o usuário foi criado (a tela trava o campo). Os demais campos podem ser alterados.
3. Marca/desmarca admin, ajusta permissões granulares.
4. ⚠️ A tela **não exibe** o bloco de permissões quando o usuário está editando o próprio perfil (o "showPermissions" fica falso pra evitar que o admin se trave sozinho). Pra mudar permissões do próprio usuário, outro admin precisa fazer.

**Fluxo típico (remover um usuário):**

1. Clica no ícone de lixeira na linha do usuário.
2. Se o usuário for Dentista e tiver agendamentos ativos (`time_slots`), abre um modal de deleção avançada: a clínica decide se remove os agendamentos junto ou mantém. Se o usuário não tem agendamentos ativos (ou se for `staff`), abre o modal de confirmação simples.
3. Confirma. O usuário é "discardado" (soft delete via gem `discard`). Não some do banco, mas perde acesso à plataforma.

**Fluxo típico (cadastrar procedimento):**

1. Vai em Configurações → Procedimentos → botão "+ Novo procedimento". Abre uma gaveta lateral.
2. Preenche **nome** do procedimento (campo obrigatório), **valor base** (preço sugerido), **especialidade** e **plano de saúde** vinculado (opcional, da lista de planos cadastrados).
3. ⚠️ "Plan name" e "Specialty name" são strings livres no backend, não vinculadas a uma tabela mestre de especialidades. Cada clínica cria a própria nomenclatura. 🚧 PENDENTE confirmar se a UI restringe a lista ou aceita texto livre.
4. Salva. O procedimento entra no catálogo da clínica e fica disponível em Agendamento, Orçamento e Evolução.
5. Editar: clicar no procedimento na tabela. Excluir: ícone de lixeira, com confirmação. Exclusão é soft delete (`discard`).
6. Busca por nome no campo do topo, com debounce. Paginação na tabela.

**Fluxo típico (iniciar uma migração de dados):**

1. Vai em Configurações → Migração de dados (Importação de dados).
2. Se a clínica ainda não escolheu o software anterior, abre o setup (`SetupOrchestrationComponent`) pedindo: qual era o software antigo (lista oficial: **Simples Dental, Dontus, Clinicorp, Dental Office, Controle Odonto, Outros**), confirmação dos dentistas existentes, e termo de início.
3. Quando o software anterior é **Simples Dental** e a feature flag `FF_NEW_MIGRATION_FLOW` está ligada, a rota redireciona automaticamente para o **fluxo interno** (`/data-migration-internal`) que é mais direto.
4. No fluxo interno, em "Nova migração", a clínica seleciona os **módulos a migrar**: **Pacientes (obrigatório, vem travado), Dentistas, Convênios, Procedimentos cadastrados (tipos), Agenda (time slots), Procedimentos realizados, Controle financeiro, Anotações**.
5. Anexa arquivos (planilhas xls/xlsx/csv ou zip, limite 100 MB por arquivo) e envia. O backend dispara o processamento por módulo, na ordem de dependência.
6. Acompanhamento por status no `MigrationDetailView`: **pending → processing → succeeded / failed / partially_migrated**. A tela tem um WebSocket (canal `MigrationProcessingChannel`) que atualiza o status em tempo real.

**⚠️ Atenção:**

* Edição de dados cadastrais da clínica está atrás de feature flag (`VUE_APP_FF_CLINIC_EDIT_ENABLED`). Se a clínica diz que "não consegue editar o nome da clínica", primeiro checar a flag.
* Mudança de CNPJ, CPF e razão social não é feita pela UI em nenhum cenário. Sempre passa pelo Time de Sustentação.
* Ao deletar um dentista com agendamentos, **decidir conscientemente** se vai apagar a agenda dele junto. Sem agendamentos ativos, o sistema nem oferece a opção.
* Quem cria um novo usuário recebe e-mail de "definir senha" (fluxo `FirstSetupJob`). Se o usuário não recebeu, o caminho é reenviar pelo time interno ou pedir pra checar caixa de spam, nessa ordem.
* Procedimentos excluídos não somem do banco, são apenas marcados como descartados. Agendamentos antigos que referenciavam o procedimento continuam consistentes.
* Migração não tem rollback automático na UI. Se um módulo falhar parcialmente, a clínica fica em `partially_migrated` e o time interno avalia.

## > 3. 💼 Casos de uso esperados

* **Caso 1, clínica nova chegou e quer começar do zero:** admin entra em Configurações → Dados da clínica, confere CNPJ/razão social que veio do contrato, completa endereço e telefone. Em Usuários, cadastra a recepcionista como `staff` e marca permissões de Agenda (`show-all-schedules` e `edit-all-schedules`) pra ela trabalhar com a agenda de todos os dentistas. Cadastra mais dentistas no papel `dentist`. Em Procedimentos, cadastra os 10 a 15 procedimentos mais comuns com preço sugerido. Pronto pra agendar.
* **Caso 2, clínica está migrando do Simples Dental:** admin entra em Migração de dados. Como o software anterior é Simples Dental e a flag `FF_NEW_MIGRATION_FLOW` está ligada, vai direto pro fluxo interno. Escolhe os módulos (Pacientes obrigatório, mais Dentistas, Convênios, Procedimentos cadastrados, Agenda, Procedimentos realizados, Controle financeiro, Anotações), sobe a planilha exportada do Simples Dental, envia. Acompanha o status em tempo real. Em caso de `partially_migrated`, abre relatório de erros listado na própria tela de detalhe.
* **Caso 3, dentista pediu pra ver a agenda da colega:** admin abre o usuário do dentista solicitante, vai em Permissões → Agenda, liga `show-all-schedules`. Se também precisar editar a agenda da colega (encaixe, troca), liga `edit-all-schedules`. Salva. Não precisa logout, o dentista recarrega a tela.
* **Caso 4, recepcionista cresceu e virou admin:** admin abre o usuário da recepcionista, marca a flag "Administrador da clínica" (`admin`), salva. Ela passa a ter acesso a tudo, inclusive Configurações.
* **Caso 5, clínica revisou tabela de preços e quer subir valores:** admin abre Procedimentos, busca pelo nome, edita o `base_value` de cada procedimento. O novo valor aparece como sugestão em orçamentos e agendamentos futuros. Orçamentos já criados não são afetados.
* **Caso 6, clínica trocou de endereço:** admin abre Dados da clínica, clica em "Editar" (precisa da flag `VUE_APP_FF_CLINIC_EDIT_ENABLED`), preenche o novo CEP (o sistema busca via ViaCEP e completa logradouro, bairro, cidade, estado), ajusta número e complemento, salva. Endereço atualizado entra em documentos, recibos e boletos gerados depois disso. Documentos anteriores ficam com o endereço antigo.

## > 4. ❓ FAQ

**P: A clínica disse que "não consegue trocar o CNPJ" pela tela. Por quê?**

R: Por design. CNPJ, CPF e razão social ficam congelados na UI depois do onboarding (entram no contrato e em documentos fiscais, então não são alteráveis em autosserviço). Para mudar, escalar pra Time de Sustentação com print do que precisa ser alterado e qual o motivo.

**P: A clínica disse que "não consegue editar nem o endereço". O que tá acontecendo?**

R: A edição dos campos editáveis (nome fantasia, telefone, endereço) depende da feature flag `VUE_APP_FF_CLINIC_EDIT_ENABLED` estar ligada. Se a clínica abre "Dados da clínica" e não vê o botão "Editar", a flag está desligada. 🚧 PENDENTE: confirmar com produto onde o suporte verifica/solicita essa flag.

**P: Qual a diferença entre "Administrador da clínica" e o papel "Dentista" ou "Equipe"?**

R: O **papel** (`role`) diz o que o usuário faz no consultório: `dentist` atende paciente, `staff` é recepção/equipe. O papel define alguns campos extras (Dentista tem cor de perfil e CRO; staff não). A **flag admin** é independente do papel: tanto um Dentista quanto um Staff podem ser admin. Quem é admin tem acesso completo à plataforma (financeiro, configurações, todas as agendas, todos os pacientes), sem precisar marcar permissões granulares.

**P: Cadastrei um usuário e ele não recebeu o e-mail de definir senha. E agora?**

R: O backend dispara `Users::Passwords::FirstSetupJob` no momento da criação. Verificar: (1) e-mail digitado correto na tela? (2) caixa de spam? (3) se passou tempo suficiente (o job é assíncrono). Se nada disso resolveu, escalar pra Sustentação pedindo reenvio do convite, com o e-mail e o ID do usuário.

**P: Apagamos um dentista sem querer. Dá pra restaurar?**

R: Pela tela, não tem botão. O usuário foi soft-deletado (`discard`), continua no banco. Sustentação consegue restaurar internamente. Escalar com o e-mail do usuário e o ID da clínica.

**P: Como filtrar Procedimentos por especialidade ou plano de saúde?**

R: A tela de Procedimentos tem campo de busca por **nome**. O backend aceita filtros adicionais (`health_plan_id`), mas a UI hoje só expõe a busca textual. 🚧 PENDENTE: confirmar se há filtro por especialidade exposto na UI atual.

**P: A clínica perguntou se dá pra ter "salas" ou "cadeiras" cadastradas para amarrar a procedimento. Existe isso?**

R: **Não existe módulo de salas / cadeiras / consultórios no produto hoje.** No menu de Configurações há "Pontos de venda" (`points_of_sale`), mas isso é cadastro de **maquininhas de cartão** (com tarifas, antecipação, PIX, número de série), não de salas físicas. Não há filtro na Agenda por sala porque não existe a entidade. 🚧 PENDENTE: confirmar com produto se "salas" está no roadmap ou se nunca foi pedido.

**P: Já cadastrei procedimentos e quero mudar todos os valores em lote. Tem como?**

R: Pela UI, não. A edição é um por um. Para alteração em lote, escalar pra Sustentação, que tem caminho interno. 🚧 PENDENTE: confirmar se existe importação CSV de procedimentos pela própria UI (a tela atual não mostra).

**P: A clínica subiu uma planilha de migração e tá há horas em "processing". Normal?**

R: Pode ser normal pra volumes grandes (pacientes em massa do Simples Dental costuma demorar). O status é atualizado em tempo real pelo `MigrationProcessingChannel`. Se passou de 🚧 PENDENTE (definir SLA esperado por módulo) horas, abrir chamado pra Sustentação com o ID da migração.

**P: O que acontece se a migração for "partially_migrated"?**

R: Significa que um ou mais módulos falharam ou foram parcialmente importados. A tela de detalhe lista os módulos com status individual e mostra um bloco de "erros principais" (`error_details`). A clínica pode (1) corrigir a planilha e reenviar só os módulos com erro, (2) escalar pra Sustentação se o erro não estiver claro. Não há rollback automático: o que entrou, ficou.

**P: Qual a ordem dos módulos da migração? Posso pular algum?**

R: A ordem segue dependências do backend (`Migrations::ModuleKindsDependencyOrder`). Pacientes vem primeiro e é **obrigatório**, vem travado na UI (não dá pra desmarcar). Os outros (Dentistas, Convênios, Procedimentos cadastrados, Agenda, Procedimentos realizados, Controle financeiro, Anotações) podem ser desmarcados. ✅ Validar com produto se há restrição prática (ex: não dá pra importar Agenda sem Dentistas).

**P: Quais softwares anteriores a Capim aceita na migração?**

R: A lista oficial visível na UI é: **Simples Dental, Dontus, Clinicorp, Dental Office, Controle Odonto, Outros**. Para Simples Dental existe o fluxo interno mais direto (atrás da flag `FF_NEW_MIGRATION_FLOW`). Para os demais, o caminho passa pelo fluxo padrão de orquestração (`SetupOrchestrationComponent`) que costuma exigir mais coleta de informação por parte do time interno.

**P: Mudei a logo da clínica, mas o boleto antigo continua com a logo velha. Por quê?**

R: Boletos e documentos são gerados no momento da emissão e ficam imutáveis dali pra frente. A logo nova vale a partir do próximo documento.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o cliente relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não consigo editar o nome ou o endereço da clínica." | Feature flag `VUE_APP_FF_CLINIC_EDIT_ENABLED` desligada no ambiente. Sem ela, a tela só exibe os dados sem botão "Editar". | Pedir print pra confirmar que o botão "Editar" não aparece. Explicar que é uma feature controlada. | Escalar pra Sustentação pedindo ativação da flag pra clínica, com ID da clínica. |
| "Preciso trocar o CNPJ da clínica." | Por design, não há edição via UI. | Coletar CNPJ atual, novo CNPJ, nova razão social, motivo (mudança contratual, fusão), comprovante. | Sempre escalar pra Sustentação. |
| "O dentista novo não recebeu o e-mail de definir senha." | E-mail digitado errado, caixa de spam, ou job atrasado. | Conferir o e-mail na tela do usuário. Pedir pra olhar spam. Se ainda zero, pedir reenvio do convite. | Escalar pra Sustentação com ID do usuário e e-mail correto. |
| "Recepcionista não vê agendamento de outros dentistas." | Permissão `show-all-schedules` desligada no usuário dela. | Abrir o usuário em Configurações → Usuários → Editar e ligar a permissão. | Se a permissão está ligada e ainda assim não vê, escalar pra eng com ID da clínica e do usuário. |
| "Quero deletar um dentista mas tá dando alerta de agendamentos ativos." | Comportamento esperado: o sistema só pede confirmação extra quando o dentista tem `time_slots` ativos. | Explicar o modal: ou apaga a agenda junto, ou cancela e remove a agenda antes. Decisão da clínica. | Não escala. Decisão de produto. |
| "Apaguei o usuário errado. Como recuperar?" | Soft delete, dá pra restaurar internamente. | Coletar ID do usuário (ou e-mail) e ID da clínica. | Escalar pra Sustentação com pedido de restauração. |
| "Cadastrei procedimento com valor errado e quero atualizar 50 de uma vez." | UI faz um por um. Edição em lote não está exposta. | Explicar a limitação. Oferecer caminho interno. | Escalar pra Sustentação pedindo update em massa, com a lista (idealmente planilha). |
| "Migração tá há muito tempo em processing." | Volume grande ou falha silenciosa em job. | Confirmar status na tela de detalhe (`MigrationDetailView`). Se status ficou parado por mais de 🚧 PENDENTE horas, abrir chamado. | Escalar pra Sustentação com ID da migração e ID da clínica. |
| "Migração ficou em partially_migrated, não sei o que falhou." | Um ou mais módulos terminaram com erro. | Olhar bloco `error_details` na tela. Se o erro for de dado (CPF inválido, paciente duplicado), orientar a clínica a corrigir e reenviar só o módulo. Se for erro técnico, escalar. | Sempre escalar erros técnicos, especialmente se a clínica está bloqueada. |
| "A clínica quer cadastrar salas / cadeiras pra organizar a agenda." | Funcionalidade não existe no produto. | Explicar que hoje não há cadastro de salas. "Pontos de venda" são maquininhas, não salas. | Registrar como feedback de produto. |
| "Liguei a permissão de Capininha pra split, mas Transações e Recebíveis ficaram travadas." | Comportamento esperado: split e antecipação dependem de transações e recebíveis. A UI auto-marca e trava como dependência. | Explicar a regra. Se a clínica não quer transações/recebíveis ligadas, precisa desligar split/antecipação primeiro. | Não escala. |
| "Não vejo o bloco de permissões quando edito meu próprio usuário." | Comportamento esperado: a tela esconde o bloco quando o usuário logado é o mesmo que está sendo editado. | Pedir pra outro admin da clínica abrir o usuário e alterar permissões. | Se a clínica só tem um admin e ele se prendeu sem querer, escalar pra Sustentação pra desbloquear. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Esse canal cobre: ativação de feature flag (`VUE_APP_FF_CLINIC_EDIT_ENABLED`, `FF_NEW_MIGRATION_FLOW`), edição manual de campos congelados (CNPJ, CPF, razão social), restauração de usuário soft-deletado, reenvio de convite, migrações travadas ou parcialmente migradas, e edição de procedimentos em lote.

## > 6. ⚠️ Limitações conhecidas

* **CNPJ, CPF e razão social não são editáveis pela UI.** Mudança só via Time de Sustentação.
* **Edição dos demais campos da clínica depende de feature flag** (`VUE_APP_FF_CLINIC_EDIT_ENABLED`). Pode estar desligada em ambientes específicos.
* **E-mail do usuário não é editável** depois de criado. Pra trocar, o caminho prático é criar outro usuário e deletar o anterior (ou pedir pra Sustentação).
* **A tela de edição de usuário esconde o bloco de permissões** quando o admin está editando o próprio perfil. Outro admin precisa fazer.
* **Não existe cadastro de salas, cadeiras ou consultórios** no produto. "Pontos de venda" no menu são maquininhas de cartão.
* **Procedimentos não têm importação em massa pela UI.** Edição é um por um.
* **Migração não tem rollback automático.** Se o módulo entra parcialmente, fica parcialmente. Correção depende de reenvio do módulo ou intervenção da Sustentação.
* **Pacientes é módulo obrigatório na migração.** Não dá pra migrar só "outras coisas" sem migrar pacientes.
* **Lista de softwares anteriores na migração é fixa** (Simples Dental, Dontus, Clinicorp, Dental Office, Controle Odonto, Outros). Software fora da lista cai em "Outros" e o tratamento passa a ser manual.
* **Fluxo de migração interno (mais direto) só está disponível pra Simples Dental hoje**, e ainda atrás da flag `FF_NEW_MIGRATION_FLOW`. ✅ Validar status atual da flag.
* **Especialidade e plano em Procedimentos podem ser texto livre** no backend. Padronização depende da disciplina da clínica.

## > 7. 🗺️ Próximos passos [opcional]

* Disponibilizar edição de CNPJ, CPF e razão social via UI (com algum gating). 🚧 PENDENTE: confirmar se está no roadmap.
* Expansão do fluxo interno de migração para outros softwares além do Simples Dental. 🚧 PENDENTE.
* Importação em massa de procedimentos (CSV) pela UI. 🚧 PENDENTE.
* Cadastro de salas / cadeiras / consultórios pra organizar a Agenda. 🚧 PENDENTE confirmar se existe demanda.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: Configurações → Dados da clínica, modo visualização]

[INSERIR PRINT: Dados da clínica, modo edição (com a flag ligada)]

[INSERIR PRINT: Configurações → Usuários da clínica, lista]

[INSERIR PRINT: Cadastro de novo usuário com seleção de papel Dentista e bloco de permissões expandido]

[INSERIR PRINT: Cadastro de novo usuário Equipe (staff)]

[INSERIR PRINT: Modal de exclusão de dentista com agendamentos ativos]

[INSERIR PRINT: Configurações → Procedimentos, com busca e tabela]

[INSERIR PRINT: Gaveta de novo procedimento com valor base e plano de saúde]

[INSERIR PRINT: Configurações → Migração de dados, dashboard com migrações anteriores]

[INSERIR PRINT: Setup orquestrado escolhendo software anterior]

[INSERIR PRINT: Nova migração interna com checkboxes de módulos e drag-and-drop de arquivos]

[INSERIR PRINT: Detalhe de migração em status processing]

[INSERIR PRINT: Detalhe de migração em status partially_migrated com bloco de erros]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Acesso e permissões**

* [ ] A regra "só admin acessa Configurações" é oficial ou as telas são abertas pra qualquer usuário logado?
* [ ] Lista oficial de planos da Capim e quais features acompanham cada plano (financeiro, Capininha).
* [ ] Rótulo final exibido na UI para o papel `staff` (Equipe? Recepção? Outro?).

**Dados da clínica**

* [ ] A flag `VUE_APP_FF_CLINIC_EDIT_ENABLED` está GA em todas as clínicas hoje ou ainda em rollout? Onde o suporte consulta isso?
* [ ] Existe checklist oficial de "o que afeta documentos e boletos" quando a clínica muda endereço, telefone, logo?
* [ ] Conta bancária da clínica: como fica o overlap entre essa tela e o módulo de Capim Pay/Capininha?

**Procedimentos**

* [ ] A UI restringe especialidade e plano a uma lista pré-cadastrada, ou aceita texto livre?
* [ ] Existe importação em massa de procedimentos via planilha pela UI?
* [ ] Há filtro por especialidade ou plano de saúde exposto na tela de Procedimentos?

**Migração**

* [ ] SLA esperado por módulo para migração (quanto tempo é "normal" antes de virar suspeita).
* [ ] Lista de softwares anteriores com fluxo interno disponível além do Simples Dental.
* [ ] Status atual da flag `FF_NEW_MIGRATION_FLOW` em produção.
* [ ] Como o time interno conduz "Outros" na lista de softwares anteriores (planilha padrão? template?).
* [ ] Restrição prática entre módulos da migração (ex: dá pra rodar Agenda sem Dentistas?).

**Escalação**

* [ ] Canal e SLA do Time de Sustentação por severidade pra cada um dos cenários do guia (CNPJ, restauração de usuário, migração travada, edição em lote).

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "A clínica é livre pra abrir Configurações com qualquer usuário; a recomendação prática é só admin." Backend não impõe policy explícita nessas rotas (`UsersController`, `ProcedureTypesController`, `MigrationSolicitationsController` não usam `Pundit` restritivo no caminho de leitura), mas vale validar com produto a comunicação oficial.
* [ ] "Procedimento excluído fica soft-deletado e agendamentos antigos continuam consistentes." Confirmado por `discard!` no `ProcedureTypesController#destroy`, mas vale validar se a UI de agendamentos antigos exibe o nome corretamente.
* [ ] "Mudança de plano de saúde de um procedimento existente respeita orçamentos antigos." Backend tem `health_plan_id` no `update`, mas comportamento sobre histórico precisa ser validado.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Papéis disponíveis são `dentist` e `staff`. A flag `admin` é separada do papel e tem precedência sobre permissões granulares.
* Permissões granulares existentes (slugs em `Feature::KINDS`): `show-all-schedules`, `edit-all-schedules`, `access-financial-control-all`, `access-financial-control-user`, `access-patient-financial-operations`, `access-transactions-capininha`, `access-receivables-capininha`, `access-split-capininha`, `access-spot-capininha`.
* Capininha: `split` e `spot` (antecipação) auto-marcam `transactions` e `receivables` como dependências, na UI.
* Criação de usuário dispara cinco jobs em paralelo: `FirstSetupJob` (senha), `CreateStaffPermissionsJob` (se staff), `Bubble::CreateUserJob`, `Availabilities::CreateDefaultJob`, `UserSettings::CreateJob`.
* E-mail de usuário não é editável depois de criado (campo `disabled` na UI quando há `user`).
* Bloco de permissões na edição é escondido quando o usuário edita o próprio perfil.
* Exclusão de usuário, procedimento e ponto de venda usa `discard!` (soft delete via gem `discard`).
* Procedimento aceita campos `name`, `base_value`, `plan_name`, `specialty_name`, `health_plan_id`.
* "Pontos de venda" (`points_of_sale`) na settings são maquininhas de cartão, com `source`, `nickname`, `serial_number`, `pix`, `card_brand_fees`, `anticipation_fee`. Não existe entidade "sala" ou "cadeira" no produto.
* Migração tem status `pending`, `processing`, `succeeded`, `failed`, `partially_migrated`. Atualização em tempo real via `MigrationProcessingChannel`.
* Lista oficial de softwares anteriores: Simples Dental, Dontus, Clinicorp, Dental Office, Controle Odonto, Outros.
* Módulos de migração: `patients` (obrigatório), `dentists`, `health_plans`, `procedure_types`, `time_slots`, `procedures`, `financial_control`, `annotations`.
* Limite de arquivo da nova migração é 100 MB por upload; aceita `.xls`, `.xlsx`, `.csv`, `.zip`.
* Para Simples Dental, com `FF_NEW_MIGRATION_FLOW` ligada, o usuário é redirecionado automaticamente pro fluxo interno.
* Edição da identidade da clínica (CNPJ, CPF, razão social) não é exposta na UI; só endereço, telefone, nome fantasia e logo são editáveis (com `VUE_APP_FF_CLINIC_EDIT_ENABLED` ligada).
