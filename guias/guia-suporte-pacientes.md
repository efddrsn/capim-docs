# 📘 Guia de Suporte: Pacientes

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. A aba **Financeiro do paciente** está em rollout controlado por feature flag (`access-patient-financial-operations`) e a tela de **Procedimentos** tem um experimento ativo em algumas clínicas (reforma do Carnê de Pagamento). 🚧 PENDENTE: confirmar como o suporte checa se uma clínica está no experimento.

## 1. 🎯 Visão geral

Pacientes é o "prontuário digital" da clínica. É onde a recepção cadastra cada paciente novo, a dentista abre a ficha pra ver o histórico clínico, o financeiro pendente, anexar foto da boca, escrever evolução depois do atendimento e mandar receita ou atestado pra assinatura. Pense na pasta de papel que cada paciente tem no arquivo da clínica, só que tudo digital, conectado com a Agenda, com Orçamentos e com Documentos da Capim.

Resolve três dores clássicas: prontuário espalhado em vários cadernos e gavetas, perda de informação clínica entre consultas (anamnese antiga que ninguém acha) e falta de visão financeira por paciente (quanto ele deve, quanto pagou, quais procedimentos foram cobrados). ✅ Validar

**Para quem é:** todas as clínicas cliente da Capim. Não há gating de plano no módulo Pacientes em si. A aba **Financeiro do paciente** depende da feature `access-patient-financial-operations` estar ativa na clínica.

**Quem vê e edita o quê dentro da clínica:** no nível de módulo, não há restrição por dentista hoje. **Qualquer usuário logado da clínica enxerga e edita a ficha de qualquer paciente da mesma clínica.** O isolamento é por clínica (a query do backend filtra `current_clinic.patients`), não por dentista. ✅ Validar. A única aba com gating é Financeiro, que depende da feature acima.

**Onde se encaixa no produto Capim:** é o cadastro central que sustenta o resto do produto. Cada agendamento na Agenda aponta pra um paciente; cada orçamento, procedimento, evolução, anamnese, documento assinado, receita, atestado e arquivo enviado fica dentro da ficha do paciente. Se a recepção apaga um paciente, perde a porta de entrada pra esse histórico.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Estar logado em uma clínica. O paciente sempre nasce vinculado à clínica do usuário logado.
* Nada mais. Não exige plano específico nem configuração prévia.

**Onde acessar:**

* Menu lateral → Pacientes.
* URLs típicas:
  * Lista: `/#/patients`
  * Ficha: `/#/patients/:id` (cai por padrão na aba **Procedimentos**)
  * Novo: `/#/patients/new`
  * Editar dados cadastrais: `/#/patients/:id/edit`

**Fluxo típico (criar paciente novo):**

1. Recepção clica em "Novo Paciente" no topo da lista de pacientes (também é possível criar paciente novo de dentro da Agenda, da tela de Documentos, do Controle Financeiro, do tutorial e da calculadora, e a origem fica gravada no campo `creation_source`).
2. Abre o formulário em três blocos visuais: **Dados pessoais** (nome, foto/selfie, data de nascimento, CPF, RG e órgão emissor, gênero, estado civil, ocupação, plano de saúde, número do plano, ID do prontuário, origem), **Contato** (celular, telefone fixo, e-mail), **Contato adicional** (nome, CPF, telefone e grau de parentesco de um responsável/familiar) e **Endereço** (CEP, rua, número, complemento, bairro, cidade, estado).
3. **Nome é o único campo obrigatório** no backend. Todo o resto pode ficar em branco.
4. Salva. O sistema redireciona pra ficha do paciente recém-criado, já na aba **Procedimentos**.

**Fluxo típico (buscar paciente existente):**

* Na lista de pacientes, há uma barra de busca no topo. A pesquisa é feita por **nome, CPF, telefone ou ID do prontuário** (o backend usa um índice de busca que casa todos esses campos ao mesmo tempo). ✅ Validar
* A lista ordena por nome alfabético crescente por padrão.
* Resultado vem paginado.

**Fluxo típico (navegar pela ficha):**

A ficha tem um cabeçalho com foto, nome, idade, contatos e botões de "Enviar mensagem" (abre WhatsApp), "Editar" (vai pro formulário de edição) e "Info do paciente" (abre uma gaveta lateral com todos os campos cadastrais). Abaixo do cabeçalho, há uma barra de abas. As abas, na ordem em que aparecem:

1. **Procedimentos**: lista de procedimentos planejados e executados, com dente/face, status (planejado, em andamento, concluído), valor, dentista responsável, observações e comissões. Permite criar procedimento novo, marcar como executado (com data), editar e excluir. Existe um experimento de "reforma do Carnê" rodando em algumas clínicas: nesse experimento, a tela de procedimentos é diferente (componente `IndexViewExperiment.vue`). 🚧 PENDENTE: confirmar com produto que clínicas estão no experimento.
2. **Anamnese**: lista de anamneses preenchidas para o paciente. Cada anamnese tem status e versão (existe uma flag `FF_NEW_ANAMNESIS_ENABLED` que troca o layout entre tabela antiga e cartões da V2). Permite criar nova (a partir de um template definido pela clínica), duplicar uma anterior, editar, excluir, baixar PDF (assinado ou não) e enviar pro paciente assinar pelo celular.
3. **Evoluções**: anotações cronológicas do que aconteceu em cada atendimento. Texto livre, vinculado ao usuário (dentista) que registrou. Permite criar, editar, excluir e imprimir (rota dedicada `/patients/:id/evolutions/:evolutionId`).
4. **Orçamentos**: lista de orçamentos do paciente (escopo do módulo de Orçamentos, este guia só aponta). Permite criar, editar, ver procedimentos, ver pagamentos e ver resumo.
5. **Financeiro** *(só aparece se a feature `access-patient-financial-operations` estiver ativa)*: visão financeira do paciente, com lançamentos por orçamento ou por procedimento (botão de alternar quando a flag `FF_PATIENT_COMPLETE_FINANCIAL` está desligada; quando está ligada, mostra uma visão consolidada única). Tem filtros e botão "+ Novo lançamento".
6. **Documentos**: lista os documentos vinculados ao paciente (atestados, receitas, anamneses assinadas, documentos customizados). Há atualização em tempo real via WebSocket quando uma assinatura é concluída.
7. **Arquivos** (rota interna `Folders`): pastas e arquivos enviados (radiografias, fotos, exames, PDFs). A clínica pode criar pastas, soltar arquivos soltos fora de pasta e baixar tudo. Backend chama de `folders` e `upload_files`.
8. **Histórico de agendamentos**: futuros e anteriores. Permite criar agendamento novo direto da ficha (abre o mesmo drawer usado na Agenda) e marcar comparecimento ("Compareceu" / "Não compareceu").

**Edição da ficha:**

* O botão "Editar" leva pro formulário completo. Quase tudo pode ser alterado. Exceção visual: **se o paciente já tem CPF preenchido, o campo CPF fica desabilitado** (não dá pra trocar pela tela). O backend até aceita, mas o input vem com `disabled` quando já tem valor.

**⚠️ Atenção:**

* Excluir paciente é **soft delete** (`discard!` do gem Discard). O registro continua no banco com `discarded_at` preenchido e desaparece de todas as listas e buscas. **Não há botão na interface pra reativar.** Engenharia consegue restaurar por dentro. ✅ Validar
* Ao excluir um paciente, **todos os lembretes de aniversário criados pra ele são apagados de verdade** (`destroy_all` em `time_slots.birthday`). Outros vínculos (procedimentos, agendamentos, orçamentos, anamneses) seguem regras de `dependent` do modelo: alguns são destruídos junto (documentos, anotações, pastas, prescrições, evoluções, atestados, arquivos, prosthesis requests, leads de campanha), outros são apenas desvinculados (`nullify`: anamneses, orçamentos, procedimentos, agendamentos, simulações de crédito, payment intents). ✅ Validar
* **Exclusão em lote** existe (endpoint `batch_destroy`, modal "Excluir selecionados" na lista). Mesmo comportamento de soft delete.
* **Não existe funcionalidade de "mesclar pacientes duplicados" na interface nem no backend.** Se a clínica tem dois cadastros pro mesmo paciente, o caminho é editar um, copiar dados manualmente e excluir o outro, ou pedir intervenção pela engenharia. ✅ Validar
* **Origem do cadastro (`creation_source`) é gravada automaticamente** conforme a tela em que o paciente foi criado: `patients_module`, `calendar`, `home`, `financial_control`, `tutorial`, `calculator`, `documents`, `self_appointment_link` (link público de agendamento online), `artificial_intelligence` (Camila no WhatsApp), `automatic_dash_migration` (paciente importado de migração).

## > 3. 💼 Casos de uso esperados

* **Caso 1, paciente novo na clínica:** recepção cria a ficha com nome, celular e CPF. Salva. Manda a dentista preencher a anamnese antes do atendimento. Durante a consulta, a dentista abre a ficha pelo celular, registra procedimentos planejados no odontograma, sai da consulta e escreve a evolução. No mês seguinte, o paciente volta: a recepção busca pelo nome, abre a mesma ficha, marca o procedimento de hoje como "executado".
* **Caso 2, retorno de paciente antigo:** paciente liga, recepção busca por CPF na lista de pacientes, abre a ficha, clica em "Histórico de agendamentos" e vê o último atendimento. Vai pra aba "Anamnese" pra checar alergias e medicação contínua antes de marcar.
* **Caso 3, ortodontia em andamento:** dentista abre a aba "Procedimentos", marca o procedimento mensal como executado, anota detalhes na evolução, manda foto da boca em "Arquivos" dentro de uma pasta "Acompanhamento ortodôntico".
* **Caso 4, atestado e receita:** depois do atendimento, dentista entra na ficha → aba "Documentos" ou pelo botão direto "Receita" / "Atestado", preenche, manda pra assinatura digital, paciente assina pelo celular. O documento volta pra aba "Documentos" com status atualizado em tempo real (WebSocket).
* **Caso 5, recepção cadastra paciente novo pela Agenda:** abre Agenda, clica em horário vazio, cria agendamento e o paciente é cadastrado "na hora" pelo mesmo formulário. A ficha já nasce com `creation_source: calendar`.
* **Caso 6, clínica precisa apagar paciente teste:** recepção entra na lista, seleciona um ou vários pacientes, clica em "Excluir selecionados", confirma. O paciente some das listas mas permanece soft-deleted no banco.
* **Caso 7, paciente criado pela Camila:** quando a Camila marca pelo WhatsApp e o paciente é novo, a ficha nasce com `creation_source: artificial_intelligence`. Hoje a tela **não diferencia visualmente** pacientes criados pela Camila dos demais. ✅ Validar

## > 4. ❓ FAQ

**P: A clínica disse que cadastrou um paciente mas não consegue achar na busca. O que verificar?**

R: Primeiro, confirmar a grafia exata (a busca é fuzzy em nome/CPF/telefone/ID do prontuário, mas erro grosseiro de digitação pode não casar). Segundo, **conferir se o paciente está com `discarded_at` preenchido** (foi excluído): nesse caso ele some das listas e da busca, e o caminho é pedir restauração pela engenharia. Terceiro, conferir se o paciente foi criado em outra clínica (usuário multi-clínica pode estar na clínica errada).

**P: Por que o campo CPF aparece travado quando eu vou editar um paciente?**

R: Por design da tela: quando o paciente já tem CPF cadastrado, o input vem desabilitado pra evitar troca acidental. O backend aceita atualizar, mas a UI bloqueia. Se a clínica precisa corrigir um CPF errado, o caminho hoje é escalar pra engenharia. ✅ Validar

**P: A clínica tem dois cadastros pro mesmo paciente. Como mesclar?**

R: **Não há função de mesclar duplicados.** Caminhos práticos: (1) escolher qual cadastro vai sobreviver (geralmente o que tem mais histórico, agendamentos, procedimentos, documentos), (2) copiar manualmente os dados úteis do duplicado para o que vai ficar, (3) excluir o duplicado. Se houver muito histórico nos dois (procedimentos em ambos, orçamentos em ambos), escalar pra engenharia, que consegue migrar vínculos por dentro. ✅ Validar

**P: Como funciona a busca da lista de pacientes?**

R: A busca usa um índice por trás (`patients_index`) e casa o termo digitado contra **nome, CPF, telefone e ID do prontuário** ao mesmo tempo. Não há filtro por dentista nem por status (ativo/inativo) na busca da lista. ✅ Validar

**P: A dentista diz que não vê os pacientes de outro dentista. É bug?**

R: **Não.** Diferente da Agenda, **no módulo Pacientes não há restrição por dentista**: todo usuário logado da clínica enxerga e edita qualquer paciente da clínica. Se a dentista de fato não está vendo, vale checar se ela está na clínica certa (multi-clínica) e se o paciente em questão não foi excluído. ✅ Validar

**P: A clínica reclama que sumiu a aba "Financeiro" da ficha do paciente. O que aconteceu?**

R: A aba Financeiro depende da feature `access-patient-financial-operations` (constante `PATIENTS_TAB` no frontend). Se a feature foi desligada pra clínica (ou nunca foi ativada), a aba não aparece. Se deveria estar ativa, escalar pro Time de Sustentação pedindo ativação. 🚧 PENDENTE: confirmar onde o suporte consulta/solicita ativação dessa feature.

**P: O paciente foi excluído por engano. Dá pra desfazer?**

R: Pela tela, não há botão de "restaurar". O paciente está com `discarded_at` no banco e some de todas as listas. **Os lembretes de aniversário foram apagados de verdade** ao excluir, então mesmo restaurando o paciente, o aniversário não volta sozinho. Engenharia consegue restaurar o paciente em si (basta limpar o `discarded_at`). Escalar com ID do paciente.

**P: Quem aparece como dentista no cabeçalho da ficha?**

R: O cabeçalho mostra "o último dentista vinculado", deduzido a partir dos agendamentos do paciente (último `time_slot.user`). Se o paciente nunca foi agendado, o campo fica vazio. ✅ Validar

**P: A clínica enviou anamnese pro paciente assinar pelo celular e o link expirou. O que fazer?**

R: A clínica pode entrar na aba Anamnese, clicar na anamnese em questão e reenviar a solicitação de assinatura. Detalhes finos do fluxo de assinatura caem no guia de Documentos. 🚧 PENDENTE confirmar comportamento de expiração do link.

**P: Aparece um aviso no topo da ficha do paciente sobre anamnese. O que é?**

R: É o "anamnesis warnings": quando o paciente preencheu anamnese e algumas respostas têm **alertas** (ex: alergia a anestésico, gravidez, diabetes), o sistema soma essas respostas e mostra um contador no cabeçalho da ficha (`alerts_count`). Serve pra dentista ver "atenção, tem 3 alertas" sem precisar abrir a anamnese inteira.

**P: Onde a clínica vê o histórico financeiro completo do paciente?**

R: Na aba **Financeiro** dentro da ficha (se a feature estiver ativa). Tem visão por orçamento, visão por procedimento e, com `FF_PATIENT_COMPLETE_FINANCIAL` ligada, uma visão consolidada com resumo de pago, em aberto, vencido. ✅ Validar

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não acho o paciente na busca, mas tenho certeza que cadastrei." | Paciente foi excluído (soft delete) e sumiu das listas; ou está em outra clínica (multi-clínica); ou erro de digitação no termo de busca. | Pedir ID da clínica e nome/CPF do paciente. Confirmar a clínica correta. Pedir pra tentar buscar pelo CPF cru ou pelo telefone. Se nada acha, suspeitar de exclusão. | Se confirmado que foi excluído por engano, escalar pra eng com ID do paciente pedindo restauração. |
| "Quero juntar dois cadastros do mesmo paciente." | Não existe função de mesclar duplicidades na UI. | Orientar a clínica a copiar dados manualmente pro cadastro que ficará e excluir o duplicado. Se houver muito histórico nos dois, recomendar escalonamento. | Escalar pra eng quando há procedimentos, orçamentos ou documentos relevantes nos dois cadastros e a clínica não consegue tratar manualmente. |
| "Não consigo trocar o CPF do paciente, o campo está travado." | UI desabilita o campo CPF quando já tem valor cadastrado. | Confirmar a expectativa: hoje, paciente com CPF preenchido não tem como alterar pela tela. | Escalar pra eng com ID do paciente quando a correção é necessária (ex: CPF do paciente foi digitado errado e está bloqueando emissão de documento). |
| "Excluí um paciente sem querer." | Soft delete via Discard. Sem botão de "desfazer" na tela. | Coletar ID do paciente e ID da clínica. Avisar a clínica que dá pra restaurar via engenharia, mas os lembretes de aniversário foram apagados de verdade e não voltam. | Sempre escalar pra eng com ID do paciente. |
| "Sumiu a aba Financeiro da ficha." | Feature `access-patient-financial-operations` não está ativa pra clínica. | Confirmar com a clínica se isso já estava disponível antes. Se sim, possivelmente desativação acidental. | Escalar pra eng/produto pedindo ativação da feature, com ID da clínica. |
| "Os documentos assinados não estão aparecendo na aba Documentos." | A aba escuta WebSocket pra atualizar em tempo real. Conexão WebSocket pode ter caído. | Pedir pra recarregar a página (F5). Após reload, os documentos vêm via API. | Se reload não traz e a assinatura foi concluída no provedor, escalar pra eng com ID do paciente e ID do documento. |
| "Não vejo procedimentos do paciente, mas tenho certeza que cadastrei." | Procedimentos podem ter sido excluídos (soft delete) ou estar em outra ficha (duplicidade). | Confirmar ID do paciente. Pedir prints. Conferir se há cadastro duplicado. | Escalar pra eng se o procedimento sumiu sem ação aparente da clínica. |
| "A foto do paciente não carrega." | `profile_picture` é Active Storage. Pode ser problema de storage temporário, link expirado, ou imagem corrompida no upload. | Pedir pra editar o paciente, remover a foto (`remove_profile_picture`) e subir de novo. | Se vários pacientes da mesma clínica não carregam, escalar pra eng. |
| "A clínica vê o paciente, mas o histórico de agendamentos está vazio." | Paciente nunca foi agendado, ou os agendamentos foram cancelados e ficaram fora do filtro. | Conferir na aba Histórico de agendamentos se há cancelados. Conferir na Agenda direto. | Se na Agenda aparece o agendamento e na ficha não, escalar pra eng. |
| "A ficha está mostrando dentista errado no cabeçalho." | O cabeçalho infere o dentista a partir do último agendamento. Se o último agendamento foi com outro profissional, vai aparecer ele. | Explicar a lógica. Sugerir agendar com o profissional correto. | Sem ação de eng necessária na maioria dos casos. |
| "A clínica está no experimento de reforma do Carnê de Pagamento e a tela de Procedimentos está diferente." | Esperado: experimento ativo troca o componente da aba Procedimentos. | Validar com a clínica que essa é a versão experimental e coletar feedback. Se houver bug, coletar print e ID da clínica. | Escalar pra produto/eng bugs do experimento (ainda não é GA). |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Toda issue de bug, ativação/desativação de feature flag, restauração de paciente soft-deleted ou pedido de migração de vínculos entre cadastros duplicados entra por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Sem mesclagem de pacientes duplicados.** Não há função na UI nem no backend. Tratamento é manual ou via engenharia.
* **Excluir paciente é soft delete, mas não há botão de restaurar na UI.** Só via engenharia. E os lembretes de aniversário são apagados de verdade na exclusão, então não voltam com a restauração.
* **CPF não pode ser editado pela UI depois de cadastrado** (campo vem desabilitado). Backend aceitaria, mas a tela bloqueia.
* **Sem permissão por dentista no módulo Pacientes.** Diferente da Agenda, no Pacientes não há equivalente a `show_all_schedules` / `edit_all_schedules`. Todo usuário da clínica vê todos os pacientes.
* **Sem filtro por dentista, status ou data na lista de pacientes.** A lista ordena por nome e filtra só pelo termo de busca (nome/CPF/telefone/ID prontuário).
* **Dentista do cabeçalho da ficha é inferido pelo último agendamento.** Não há campo "dentista responsável" persistido na ficha. ✅ Validar
* **Validação mínima no cadastro:** só **nome** é obrigatório no backend. CPF, e-mail, telefone, nada disso bloqueia o salvamento. Isso facilita criação rápida na recepção, mas favorece duplicidade.
* **Aba Financeiro depende de feature flag** (`access-patient-financial-operations`). Clínicas sem a feature não veem a aba.
* **Aba Procedimentos pode estar em versão experimental** (reforma do Carnê) em algumas clínicas, com layout diferente. Não é bug, é experimento.
* **Origem do paciente (`creation_source`) é registrada mas não exposta na UI hoje** de forma simples. Pacientes criados pela Camila ou pelo link público têm a origem gravada, mas a tela não mostra esse rótulo. ✅ Validar

## > 7. 🗺️ Próximos passos [opcional]

* Reforma do Carnê de Pagamento na aba Procedimentos (experimento em curso). 🚧 PENDENTE: cronograma de GA.
* Consolidação total do Financeiro do paciente (flag `FF_PATIENT_COMPLETE_FINANCIAL`). 🚧 PENDENTE: status do rollout.
* Anamnese V2 (flag `FF_NEW_ANAMNESIS_ENABLED`) com layout de cartões em vez de tabela. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: lista de pacientes com a barra de busca no topo]

[INSERIR PRINT: formulário de "Novo Paciente" mostrando os blocos Dados pessoais / Contato / Contato adicional / Endereço]

[INSERIR PRINT: cabeçalho da ficha do paciente com foto, contador de alertas de anamnese e botões Editar / Enviar mensagem / Info do paciente]

[INSERIR PRINT: barra de abas da ficha (Procedimentos, Anamnese, Evoluções, Orçamentos, Financeiro, Documentos, Arquivos, Histórico)]

[INSERIR PRINT: aba Procedimentos versão atual]

[INSERIR PRINT: aba Procedimentos versão experimento (reforma do Carnê)]

[INSERIR PRINT: aba Anamnese mostrando lista de anamneses do paciente]

[INSERIR PRINT: aba Evoluções com timeline]

[INSERIR PRINT: aba Financeiro com filtros e botão "+ Novo lançamento"]

[INSERIR PRINT: aba Documentos com itens assinados e pendentes]

[INSERIR PRINT: aba Arquivos com pastas e uploads]

[INSERIR PRINT: aba Histórico de agendamentos (próximos e anteriores)]

[INSERIR PRINT: modal de "Excluir paciente"]

[INSERIR PRINT: modal de "Excluir selecionados" (exclusão em lote)]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e disponibilidade**
* [ ] Como o suporte verifica e solicita ativação da feature `access-patient-financial-operations` para uma clínica?
* [ ] Como o suporte consulta hoje se uma clínica está no experimento de reforma do Carnê de Pagamento (que troca a aba Procedimentos)?
* [ ] Status oficial do rollout da flag `FF_PATIENT_COMPLETE_FINANCIAL` (visão financeira consolidada).
* [ ] Status oficial do rollout da flag `FF_NEW_ANAMNESIS_ENABLED` (anamnese V2 em cartões).

**Operação**
* [ ] Caminho oficial para restaurar paciente soft-deleted: engenharia? formulário interno? Time de Sustentação direto?
* [ ] Caminho oficial para mesclar/migrar histórico de pacientes duplicados quando há volume relevante de dados nos dois cadastros.
* [ ] Caminho oficial para corrigir CPF cadastrado errado (UI bloqueia, backend aceita): quem pode fazer e como pedir?
* [ ] Comportamento exato de expiração de link de assinatura de anamnese pelo paciente.

**UX**
* [ ] A interface diferencia visualmente, em algum lugar, pacientes criados pela Camila (`creation_source: artificial_intelligence`) ou pelo link público (`self_appointment_link`)?
* [ ] O cabeçalho da ficha exibe "último dentista vinculado" baseado no último agendamento. Isso é intencional ou produto pretende ter um campo "dentista responsável" persistido?

**Escalação**
* [ ] SLA esperado por nível de severidade no Time de Sustentação pra requisições do módulo Pacientes.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Qualquer usuário logado da clínica vê e edita qualquer paciente da clínica, sem restrição por dentista." Inferido do controller (`current_clinic.patients.find`) e da ausência de policy por usuário no módulo. Vale confirmar com produto que essa é a regra desejada.
* [ ] "Busca casa nome, CPF, telefone e ID do prontuário simultaneamente." Confirmado pelo `Search::Patients` (`multi_match` nesses 4 campos), mas vale confirmar fuzzy/typo tolerance.
* [ ] "A foto da clínica como `profile_picture` usa Active Storage e o campo `remove_profile_picture` apaga." Inferido do form/params. Vale validar fluxo completo com produto.
* [ ] "Pacientes excluídos perdem lembretes de aniversário definitivamente (destroy_all), enquanto outros vínculos seguem regras mistas de dependent (nullify/destroy)." Confirmado pelo modelo `Patient` e pelo `PatientsController#destroy`, mas vale alinhar com produto qual é o efeito esperado pra cada relação.
* [ ] "Aba Procedimentos pode renderizar a versão experimental quando o experimento `PAYMENT_BOOK_REFORM_EXPERIMENT` está ativo pra clínica." Confirmado no router, mas o critério de elegibilidade da clínica precisa do produto.
* [ ] "O contador de alertas no cabeçalho vem das respostas de anamnese marcadas `with_alerts`." Confirmado pelo serializer e service `Patients::GetAnamnesisWarnings`, mas vale confirmar quais respostas exatamente são marcadas como alerta hoje.
* [ ] "Não existe função de mesclar pacientes duplicados nem na UI nem no backend." Confirmado pela ausência de controller/serviço/rota; vale confirmar com produto que não há plano próximo.
* [ ] "A criação fora do módulo Pacientes (Agenda, Documentos, Controle Financeiro, tutorial, calculadora, link público, Camila) cai no mesmo modelo Patient com `creation_source` correspondente." Confirmado pelos enums do modelo, mas vale validar com produto que todos esses fluxos ainda estão ativos.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* `Patient` usa `Discard::Model` (soft delete via `discarded_at`); `kept` filtra os ativos em todas as queries da ficha.
* Único campo obrigatório no `Patient` é `name`.
* Endpoints REST estão em `/v1/patients`, com subrotas `/v1/patients/:id/anamneses`, `/evolutions`, `/procedures`, `/folders`, `/documents`, `/appointments/next` e `/appointments/previous`.
* Financeiro do paciente fica em `/v2/patient/:id/financial_registries` (e `complete_index` quando a visão consolidada está ligada).
* A busca pública da lista usa `Search::Patients` com `multi_match` em nome (autocomplete), CPF, telefone e `medical_record_id`.
* Exclusão em lote é endpoint `delete /v1/patients/batch_destroy` com `patient_ids: []`, e itera `discard!` dentro de transação.
* O isolamento de dados é por clínica (`current_clinic.patients`) e não por dentista no módulo Pacientes.
* O cabeçalho da ficha deduz o dentista a partir do último `time_slot.user` (último agendamento).
* `creation_source` é enum com `home`, `calendar`, `patients_module`, `csv_upload`, `financial_control`, `tutorial`, `calculator`, `documents`, `self_appointment_link`, `artificial_intelligence`, `automatic_dash_migration`.
* Aba Financeiro depende da policy `access_patient_financial_operations` (feature flag homônima na clínica).
* Não existe controller, service ou rota de "merge"/"mesclagem" de pacientes.
