# 📦 Guia de Suporte: Estoque

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA, dividido em dois sub módulos com telas próprias dentro do menu **Controle de Estoque**: **Estoque** (controle de materiais) e **Solicitações de Prótese** (pedidos ao laboratório protético).

## 1. 🎯 Visão geral

O Estoque é o "armário da clínica" dentro da Capim. Cobre dois fluxos bem diferentes que moram debaixo do mesmo guarda chuva no menu:

* **Controle de Estoque (materiais):** cadastro dos itens que a clínica consome no dia a dia (caixa de luva, anestésico, broca, gaze, EPI), registro de entradas (compras, lotes recebidos) e saídas (consumo no atendimento), com alerta visual quando a quantidade cai abaixo do mínimo configurado.
* **Solicitações de Prótese:** pedidos feitos a laboratórios protéticos, organizados em um kanban com três colunas (Solicitação criada → Enviada para laboratório → Retornada à clínica), incluindo prazos, forma de envio, forma de retorno e marcação de prótese instalada.

Resolve duas dores clássicas da clínica: a recepção descobrir só no meio do atendimento que acabou a anestesia, e o dentista perder o controle de "cadê a prótese da paciente Fulana?" porque o pedido foi feito num bloquinho de papel.

**Para quem é:** todas as clínicas cliente da Capim. ✅ Validar com produto se há gating de plano para algum dos dois sub módulos.

**Onde se encaixa no produto Capim:** o **Controle de Estoque** é uma ilha pequena: registra item, quantidade, movimentações e validade. **Não tem hoje consumo automático ao executar procedimento, não emite despesa no Controle Financeiro e não envia notificação ativa quando o estoque baixa.** Já as **Solicitações de Prótese** se conectam com Pacientes (cada pedido aponta para uma ficha) e com a Agenda (dá pra criar um agendamento direto do drawer do pedido). Não há conexão automática com o Controle Financeiro nessas solicitações também: valor da prótese e do transporte ficam guardados no pedido, mas não viram lançamento financeiro automático. 🚧 PENDENTE: confirmar se existe alguma sincronização indireta com financeiro (ex: relatório que cruza os dois).

## > 2. ⚙️ Como funciona (passo a passo)

### 2.1 Controle de Estoque (materiais)

**Pré requisitos:**

* Usuário logado em uma clínica. ✅ Validar com produto se existe restrição de papel (admin × dentista × recepção) para cadastrar item e registrar movimentação. No backend, o controller não checa policy por papel: qualquer usuário autenticado da clínica consegue cadastrar item e movimentar.

**Onde acessar:**

* Menu lateral → **Controle de Estoque → Estoque**.
* URL típica: `/#/inventory` (lista) e `/#/inventory/:id` (detalhe do item, com histórico de movimentações).

**Fluxo típico (cadastrar item):**

1. Na tela **Estoque**, clica em **"Cadastrar produto"** no canto superior direito.
2. Abre modal **"Cadastrar produto"** com os campos:
   * **Nome do produto** (obrigatório, mínimo 3 caracteres).
   * **Categoria** (obrigatório). Opções fixas: EPI, Instrumento, Material de consumo, Medicamento, Outros.
   * **Unidade de medida** (obrigatório). Opções fixas: Caixa, Cartela, Mililitros, Pacote, Rolo, Unidade.
   * **Estoque mínimo** (obrigatório, número inteiro ≥ 0). Esse número é a referência usada pelo sistema para classificar o item como "baixo" ou "indisponível".
3. Clica em **"Concluir"**. O item aparece na lista com quantidade zero e tag **"Indisponível"** (porque ainda não houve nenhuma entrada).

**Fluxo típico (registrar entrada, ex: chegou caixa de luva nova):**

1. Na lista, clica em **"Registrar movimentação"** no card do item.
2. Abre gaveta **"Registrar movimentação"** com duas opções: **Entrada** e **Saída**. Clica em **Entrada**.
3. Abre nova gaveta **"Nova entrada"** com os campos:
   * **Data da entrada** (obrigatório).
   * **Quantidade** (obrigatório, > 0).
   * **Valor unitário** (obrigatório). Em centavos, no banco; a tela usa o seletor de moeda padrão.
   * **Lote** (opcional).
   * **Validade** (opcional).
   * **Fornecedor** (opcional, texto livre).
   * **Marca** (opcional, texto livre).
4. Clica em **"Adicionar"**. O sistema soma a quantidade ao estoque atual do item e cria uma linha na lista de **Movimentações**.

**Fluxo típico (registrar saída, ex: consumiu uma cartela de anestésico no atendimento):**

1. Na lista, clica em **"Registrar movimentação"** no card do item.
2. Escolhe **Saída**.
3. Abre gaveta **"Retirada de produto"** com os campos:
   * **Data da retirada** (obrigatório).
   * **Quantidade consumida** (obrigatório, > 0).
4. Clica em **"Confirmar retirada"**. O sistema **subtrai** a quantidade do estoque atual e cria uma linha na lista de **Movimentações** marcada como Saída.

**Como o sistema classifica disponibilidade (cálculo direto no backend, sem job):**

| Situação | Tag |
|---|---|
| `quantity_in_stock > minimum_in_stock` | 🟢 **Disponível** |
| `0 < quantity_in_stock ≤ minimum_in_stock` | 🟡 **Estoque baixo** |
| `quantity_in_stock == 0` | 🔴 **Indisponível** |

**⚠️ Atenção:** o "alerta de estoque baixo" hoje é **visual passivo**: aparece a tag colorida no card do item dentro da tela de Estoque. **Não há notificação push, não há e mail, não há banner no dashboard, não há WhatsApp para a clínica**. Se ninguém entrar na tela de Estoque, ninguém é avisado.

**Página de detalhe do item (`/#/inventory/:id`):**

* Mostra Nome, Categoria, Estoque mínimo, Quantidade atual, Unidade de medida e tag de Disponibilidade.
* Logo abaixo, tabela **Movimentações** com paginação. Colunas: Data, Vencimento, Lote, Valor unitário, Quantidade, Movimentação (Entrada ou Saída).

**Busca e filtros na lista:**

* Campo de busca por nome (autocomplete por Elasticsearch).
* Backend aceita filtro por **categorias** e por **disponibilidades** (ex: listar só "baixo" e "indisponível"). ✅ Validar com produto se a UI atual já expõe esses filtros ou se hoje só aparece a busca por nome.

### 2.2 Solicitações de Prótese

**Pré requisitos:**

* Pelo menos um paciente cadastrado (o pedido é vinculado a um paciente existente, **não permite criar paciente novo no formulário do pedido**).
* Pelo menos um profissional (dentista) cadastrado, que vira o **Responsável** pelo pedido.

**Onde acessar:**

* Menu lateral → **Controle de Estoque → Solicitações de Prótese**.
* URL típica: `/#/inventory/prosthesis_requests`.

**Visualização:**

* Kanban com três colunas, na ordem do fluxo:
  1. 📝 **Solicitação criada** (status `pending`).
  2. 🚚 **Enviada para laboratório** (status `sent_to_lab`).
  3. 🏥 **Retornada à clínica** (status `returned_to_clinic`).
* Cada card mostra: nome do paciente, responsável (dentista), laboratório (se preenchido) e tipo de prótese.
* O filtro padrão traz as solicitações criadas nos últimos 30 dias. Dá pra ampliar pelo botão **"Filtrar"** (paciente, responsável, intervalo de datas de criação).

**Fluxo típico (criar pedido):**

1. Clica em **"Nova solicitação"** no canto superior direito.
2. Abre modal **"Nova solicitação"** com os campos:
   * **Paciente** (obrigatório). Busca pacientes já cadastrados.
   * **Responsável** (obrigatório). Lista de usuários da clínica.
   * **Tipo de prótese** (obrigatório). Texto livre (ex: "Prótese parcial", "Coroa metalocerâmica").
   * **Laboratório** (opcional). Texto livre, **não há cadastro separado de laboratórios**: a clínica digita o nome a cada pedido. Se digitar diferente, vira "laboratório diferente" para o sistema.
   * **Prazo para retorno da prótese** (obrigatório, data).
   * **Horário** do prazo (opcional).
   * **Valor da prótese** (opcional).
   * **Data de pagamento** (opcional).
   * **Observações** (opcional, texto livre, ex: cor do dente, instruções pro laboratório).
3. Clica em **"Salvar"**. O pedido aparece na coluna **Solicitação criada**.

**Fluxo típico (mover de coluna, ex: enviou a moldagem pro laboratório):**

1. Arrasta o card de **Solicitação criada** para **Enviada para laboratório** (ou abre o card e muda lá dentro).
2. Abre o **Drawer "Resumo do pedido"** com um acordeão para cada etapa já cumprida e a próxima a preencher.
3. Na seção **Envio ao laboratório**, preenche:
   * **Data do envio da prótese** (obrigatório nessa transição).
   * **Horário do envio** (obrigatório).
   * **Forma de envio da prótese**: Entregue diretamente no laboratório, Retirado por entregador, ou Enviado pelos Correios.
   * **Valor do transporte** (opcional).
   * **Retirado por** (opcional, nome).
4. Clica em **"Salvar"**. O card muda de coluna.

**Fluxo típico (laboratório devolveu a peça):**

1. Arrasta o card de **Enviada para laboratório** para **Retornada à clínica**.
2. No drawer, na seção **Retorno à clínica**, preenche:
   * **Data do recebimento da prótese** (obrigatório nessa transição).
   * **Horário do recebimento**.
   * **Forma de recebimento da prótese**: Retirada diretamente no laboratório, Entregue na clínica por entregador, ou Recebido pelos Correios.
   * **Recebido por** (opcional, nome).
3. Salva. O card vai para a coluna final.

**Marcar como instalada:**

* No card já na coluna **Retornada à clínica**, aparece um checkbox **"Instalada"** dentro do card. Quando o dentista marca, o card fica com aparência "concluído" (visual mais apagado) e **fica travado contra movimentação**: tentar arrastar exibe a mensagem "Não foi possível mover a solicitação! Desmarque 'Instalada' para liberar a ação."

**Voltou ao laboratório (ajuste de prótese):**

* Se o pedido já está em **Enviada para laboratório**, foi devolvida e precisa ir de novo ao laboratório (problema de ajuste, cor errada), dá pra mover de volta: a transição existe no backend (`returned_to_clinic → sent_to_lab`). O sistema marca o pedido como "Retornou ao laboratório" e mostra a tag amarela **"Retornou ao laboratório"** no card.

**Atrasados:**

* Cards em **Enviada para laboratório** cujo `due_return_date` já passou (ou cujo horário de hoje passou) ganham tag vermelha **"Atrasado"**.

**Excluir pedido:**

* Pelo menu de três pontos do card, opção **"Excluir"**. Confirma no modal "Tem certeza que deseja excluir esta solicitação?". É **soft delete** (descarte lógico, registro fica no banco), não recuperável pela tela.

**Ações relacionadas dentro do drawer:**

* **"Ficha clínica":** abre a ficha do paciente.
* **"Agendar consulta":** abre o drawer de novo agendamento já com o paciente preenchido. Útil pra marcar a sessão de instalação assim que a prótese chega.

**⚠️ Atenção:**

* **Valor da prótese, valor do transporte e data de pagamento ficam guardados no pedido**, mas **não geram lançamento automático no Controle Financeiro**. Se a clínica quer registrar a despesa, faz lançamento manual no financeiro.
* **Não há cadastro de laboratórios.** Campo é texto livre. Para ver "histórico por laboratório" hoje, a clínica filtra cliente a cliente ou olha pelo nome no card. ✅ Validar se em algum lugar da UI existe agrupamento por laboratório (não encontrei).

## > 3. 💼 Casos de uso esperados

* **Caso 1, recepção quer saber quanta luva ainda tem:** abre **Controle de Estoque → Estoque**, busca "luva" no campo de busca. O card mostra **Quantidade atual** e a tag (Disponível, Estoque baixo ou Indisponível).
* **Caso 2, chegou caixa de anestésico nova:** recepção abre Estoque, clica em **"Registrar movimentação"** no card do item, escolhe **Entrada**, preenche data, quantidade, valor unitário, lote e validade. Em seguida, ao consumir, faz **Saída** (manual, **o sistema não desconta sozinho ao registrar procedimento no atendimento**).
* **Caso 3, dentista quer histórico daquele item:** abre o card do item (clica no chevron à direita), vai pra `/#/inventory/:id` e vê a tabela de Movimentações com data, lote, validade, valor unitário, quantidade e se é Entrada ou Saída.
* **Caso 4, paciente novo precisa de coroa:** dentista vai em **Solicitações de Prótese**, clica em **"Nova solicitação"**, escolhe o paciente, preenche tipo "Coroa metalocerâmica", coloca o laboratório de costume, define prazo de retorno e adiciona observação "cor B2, cuidado com contato distal". Salva.
* **Caso 5, hoje é o dia de enviar:** dentista arrasta o card pra **Enviada para laboratório**, registra como foi enviado (Correios, entrega, motoboy) e o valor do transporte. O card sai da primeira coluna.
* **Caso 6, prótese voltou:** recepção arrasta pra **Retornada à clínica**, registra data e forma de recebimento. Pelo botão **"Agendar consulta"** já abre a tela de agendamento com o paciente pré preenchido, para marcar a sessão de instalação.
* **Caso 7, prótese veio errada:** dentista volta o card de **Retornada à clínica** para **Enviada para laboratório**. O card ganha a tag amarela **"Retornou ao laboratório"**, sinalizando o retrabalho.

## > 4. ❓ FAQ

**P: O sistema avisa a clínica quando um item está acabando?**

R: Não ativamente. **A clínica precisa entrar na tela Estoque pra ver as tags de Estoque baixo (amarela) e Indisponível (vermelha)**. Não tem e mail, não tem push, não tem banner no dashboard, não tem WhatsApp. O "alerta" é só visual, na lista. Quem não abre a tela, não fica sabendo.

**P: Quando o dentista executa um procedimento, o sistema desconta sozinho do estoque?**

R: **Não.** A baixa é sempre manual: alguém precisa entrar no item e registrar Saída. **Não existe vínculo de procedimento ↔ item de estoque** no produto hoje.

**P: A compra de material vira despesa automática no Controle Financeiro?**

R: Não. O valor unitário e o fornecedor ficam guardados na movimentação de Entrada, mas **não há criação automática de lançamento financeiro**. Se a clínica quer registrar a despesa, lança manualmente em Financeiro.

**P: Posso editar ou apagar uma movimentação registrada errada?**

R: O backend tem um endpoint de **destroy** que apaga a movimentação e **reverte a quantidade do estoque** (se era Entrada, subtrai; se era Saída, soma). ✅ Validar com produto se a UI atual já expõe esse botão de excluir movimentação na lista. Editar uma movimentação existente: não há endpoint para isso no backend; o jeito é excluir e recriar.

**P: Tem como cadastrar fornecedor uma vez e reaproveitar?**

R: Não. **Fornecedor é texto livre digitado a cada Entrada.** Se a recepção digitar diferente em entradas diferentes (ex: "Dental Cremer" e "dentalcremer"), o sistema entende como dois fornecedores distintos.

**P: O sistema considera validade do lote? Avisa quando está perto de vencer?**

R: A validade é registrada na movimentação de Entrada e aparece na coluna **Vencimento** da tabela de Movimentações no detalhe do item. **Não há alerta automático de produto perto do vencimento.** É um campo informativo.

**P: Como funciona o cálculo de "Estoque baixo"?**

R: Comparação direta entre `quantidade atual` e `estoque mínimo` cadastrados no item. Disponível se está acima do mínimo, Estoque baixo se está acima de zero mas no mínimo ou abaixo, Indisponível se zerou. A clínica controla o limiar quando define o **Estoque mínimo** no cadastro do item.

**P: Tem como cadastrar laboratório protético uma vez e reaproveitar nos próximos pedidos?**

R: Não. **Não existe cadastro de laboratórios.** Em cada solicitação de prótese, o campo Laboratório é texto livre.

**P: O dentista pode ver "todos os pedidos com o Laboratório X"?**

R: Não há filtro por laboratório na tela. Os filtros disponíveis em **"Filtrar"** são: paciente, responsável e intervalo de datas de criação. Visual sim: na hora de bater o olho no kanban, dá pra ver o nome do laboratório no card. 🚧 PENDENTE: confirmar com produto se há algum relatório agregado por laboratório no dashboard.

**P: Onde vejo as próteses já instaladas?**

R: Continuam na coluna **Retornada à clínica**, com o checkbox **"Instalada"** marcado e o card com aparência apagada. **Não somem do kanban.** Para ver só pedidos do mês X, usar o filtro de "Solicitadas entre".

**P: Por que não consigo arrastar um card da coluna "Retornada à clínica"?**

R: Provavelmente o checkbox **"Instalada"** está marcado. Cards instalados ficam travados contra movimentação. A clínica desmarca **"Instalada"** no próprio card e aí consegue arrastar. A mensagem de erro que o sistema mostra: **"Não foi possível mover a solicitação! Desmarque 'Instalada' para liberar a ação."**

**P: Excluí uma solicitação de prótese e quero de volta. Dá?**

R: Pela tela não. O registro fica no banco (soft delete via `discard`), mas **não há botão "restaurar"** na interface. Recriar é o caminho rápido. Para casos críticos, escalar pra engenharia com o ID do pedido pode permitir reativar internamente. ✅ Validar com produto qual é o canal oficial.

**P: O pedido marcou "Atrasado" sozinho. Como?**

R: Cálculo no frontend: se o status do pedido é **Enviada para laboratório** e a data/hora de retorno prevista (`due_return_date` + `due_return_time`) já passou em relação a "agora", a tag vermelha **"Atrasado"** aparece automaticamente no card. Não é status do banco, é cálculo de tela.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Cadastrei o item mas ele aparece como Indisponível." | Não foi registrada nenhuma Entrada. O cadastro do item começa com quantidade zero. | Orientar a clínica a registrar uma movimentação de Entrada com a quantidade que tem hoje em estoque, data, valor unitário e (se quiser) lote e validade. | Se a Entrada foi feita e mesmo assim a quantidade não atualizou, escalar pra eng com ID do item, ID da clínica e print da movimentação. |
| "Registrei a Saída mas o estoque não diminuiu." | Possível erro de gravação ou falha em rede no momento do salvar. | Pedir pra abrir o detalhe do item (`/#/inventory/:id`) e ver se a movimentação aparece na tabela. Se não aparece, refazer. Se aparece e a quantidade no card está errada, é inconsistência de banco. | Inconsistência (movimentação existe mas saldo não bate): escalar pra eng. |
| "Não consigo marcar Saída maior que o estoque atual." | ✅ Validar: o backend só valida `quantity > 0` (não bloqueia saída maior que o saldo). Logo, o saldo **pode ficar negativo**. Se a clínica diz que está bloqueando, conferir a versão do frontend. | Conferir se houve mensagem de erro específica no momento da saída. Refazer pode resolver. | Se o saldo ficou negativo e a clínica quer corrigir, orientar a registrar uma Entrada compensatória; se isso atrapalha, escalar pra eng. |
| "A clínica não recebeu alerta de que a luva acabou." | Não existe envio ativo de alerta. O sistema mostra só tag visual na tela de Estoque. | Explicar a regra: alerta é apenas visual, na tela. Orientar a clínica a abrir a tela de Estoque periodicamente, ou usar o filtro por **Disponibilidade** para listar só "baixo" e "indisponível". | Se a clínica pede alerta ativo (push, e mail), é pedido de feature: registrar como sugestão de produto. |
| "Compra de material não apareceu no Controle Financeiro." | Não há integração automática. Valor da Entrada fica só no histórico de movimentações do item. | Orientar a clínica a lançar a despesa manualmente em Financeiro. | Se a clínica pede a integração, registrar como sugestão de produto. |
| "O dentista executou o procedimento e o estoque não desceu." | Não há consumo automático por procedimento. | Explicar que a baixa é sempre manual no card do item, opção Saída. | Pedido recorrente: registrar como sugestão de produto. |
| "Card de prótese não arrasta." | Checkbox **"Instalada"** está marcado no card. | Orientar a desmarcar **"Instalada"** primeiro, depois arrastar. | Se mesmo desmarcado não arrasta, escalar pra eng com print e ID do pedido. |
| "Mudei o pedido de coluna e perdi os dados que tinha digitado." | A transição pede campos obrigatórios da etapa nova (data e horário de envio, ou data de recebimento). Se sair sem salvar, a transição não acontece. | Pedir pra reabrir o card e preencher os campos da etapa que está tentando ativar. | Se os campos foram preenchidos e o erro persiste, escalar pra eng com ID do pedido e print do drawer. |
| "Solicitação de prótese sumiu do kanban." | Pode ter sido excluída (soft delete), ou está fora da janela de datas do filtro padrão (últimos 30 dias). | Ampliar o intervalo no botão **"Filtrar"**. Se mesmo assim não aparece, é exclusão. | Restauração de pedido excluído: escalar pra eng com ID do pedido. |
| "Quero ver todos os pedidos do Laboratório X." | Não há filtro por laboratório. Campo é texto livre. | Explicar a limitação. Sugerir cuidado na padronização do nome do laboratório nos próximos pedidos. | Pedido de filtro: registrar como sugestão de produto. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Todo bug, restauração de movimentação ou pedido excluído, e inconsistência de saldo passa por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Alerta de estoque baixo é só visual**, dentro da tela de Estoque. Sem push, sem e mail, sem banner global, sem WhatsApp.
* **Sem consumo automático por procedimento.** Toda baixa é manual.
* **Sem integração automática com Controle Financeiro.** Entrada de material e valor da prótese não viram lançamentos.
* **Sem cadastro de fornecedor.** Texto livre na Entrada.
* **Sem cadastro de laboratório.** Texto livre na solicitação de prótese.
* **Sem filtro por laboratório** na tela de solicitações.
* **Sem alerta de validade próxima** no estoque. O campo Vencimento é apenas registro.
* **Saldo de estoque pode ficar negativo:** o backend não bloqueia saídas maiores que o saldo atual.
* **Excluir movimentação ou solicitação não é reversível pela tela.** Soft delete em prótese (recupera via eng); movimentação de estoque é exclusão dura, com reversão de saldo no momento da exclusão.
* **Card de prótese marcado como "Instalada" trava contra movimentação:** precisa desmarcar antes.
* **A tag "Atrasado"** em pedidos enviados para laboratório é cálculo de frontend, não muda o status no banco.

## > 7. 🗺️ Próximos passos [opcional]

* Cadastro central de laboratórios para reaproveitar entre solicitações. 🚧 PENDENTE: está no roadmap?
* Alertas ativos de estoque baixo e de validade próxima. 🚧 PENDENTE.
* Integração de Entradas com Controle Financeiro (despesa automática). 🚧 PENDENTE.
* Vínculo procedimento ↔ item de estoque para consumo automático. 🚧 PENDENTE.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: lista de Estoque com itens em diferentes tags (Disponível, Estoque baixo, Indisponível)]

[INSERIR PRINT: modal Cadastrar produto com os campos preenchidos]

[INSERIR PRINT: gaveta Registrar movimentação com as duas opções Entrada e Saída]

[INSERIR PRINT: gaveta Nova entrada com lote, fornecedor e validade preenchidos]

[INSERIR PRINT: gaveta Retirada de produto com quantidade consumida]

[INSERIR PRINT: detalhe do item (`/#/inventory/:id`) com tabela de Movimentações]

[INSERIR PRINT: kanban de Solicitações de Prótese com cards nas três colunas]

[INSERIR PRINT: modal Nova solicitação com campos preenchidos]

[INSERIR PRINT: drawer Resumo do pedido com os acordeões das etapas]

[INSERIR PRINT: card de prótese com tag "Atrasado"]

[INSERIR PRINT: card de prótese com tag "Retornou ao laboratório"]

[INSERIR PRINT: mensagem "Não foi possível mover a solicitação! Desmarque 'Instalada' para liberar a ação."]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Disponibilidade e gating**
* [ ] O módulo Estoque tem gating por plano? Toda clínica enxerga no menu, ou depende de feature flag?
* [ ] Existe controle de permissão por papel (admin × dentista × recepção) para cadastrar item, registrar movimentação ou criar solicitação de prótese? O backend não impõe; a UI esconde algo?

**Controle financeiro e procedimento**
* [ ] Algum relatório agregado cruza Entradas do Estoque com Controle Financeiro (ainda que não seja lançamento automático)?
* [ ] Algum relatório agregado cruza Solicitações de Prótese com Controle Financeiro?
* [ ] Existe alguma sinalização (visual ou em relatório) que aproxime procedimento executado e item consumido, mesmo sem ser automática?

**UX da tela**
* [ ] A UI da lista de Estoque já expõe filtro por **Categoria** e por **Disponibilidade** (o backend aceita os dois)? Ou só busca por nome?
* [ ] Existe na UI botão de excluir movimentação de estoque (o backend tem o endpoint)?
* [ ] Existe na UI agrupamento ou relatório por laboratório protético?

**Operação e correção**
* [ ] Canal oficial para o suporte pedir restauração de solicitação de prótese excluída (soft delete via `discard`).
* [ ] Canal oficial para o suporte pedir correção de saldo de estoque inconsistente (ex: saldo negativo após excluir movimentação).

**Escalação**
* [ ] SLA esperado de resposta pra cada nível de severidade no Time de Sustentação para temas de Estoque e Prótese.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Qualquer usuário autenticado da clínica consegue cadastrar item de estoque e registrar movimentação." Confirmado pelo controller (sem policy por papel), mas vale validar se há restrição no frontend.
* [ ] "O backend permite registrar Saída maior que o saldo atual (saldo pode ficar negativo)." Confirmado pelo `CreateForm` da transação (só valida `quantity > 0`); produto pode ter regra de UI que bloqueia isso antes.
* [ ] "Excluir movimentação de Entrada subtrai do saldo; excluir movimentação de Saída soma." Confirmado pelo `DestroyForm`. Validar se a UI hoje expõe esse botão pra clínica ou se é só endpoint interno.
* [ ] "Tag 'Atrasado' no card de prótese é cálculo de frontend (compara `due_return_date`/`due_return_time` com agora)." Confirmado em `ProsthesisRequestCard.vue`. Validar se há também algum job/relatório que olha "atrasados".

### Itens já validados pelo backend (não precisa mais perguntar)

Fact check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Categorias fixas de item: EPI, Instrumento, Material de consumo, Medicamento, Outros.
* Unidades de medida fixas: Caixa, Cartela, Mililitros, Pacote, Rolo, Unidade.
* Cálculo de disponibilidade: comparação direta entre `quantity_in_stock` e `minimum_in_stock`, sem job assíncrono.
* Status de prótese: três estados (`pending`, `sent_to_lab`, `returned_to_clinic`) via AASM, com transição reversa permitida (de `returned_to_clinic` para `sent_to_lab`).
* Formas de envio e de recebimento: três opções idênticas (entrega no laboratório, entregador, Correios).
* Solicitação de prótese é vinculada a paciente e a usuário (responsável); exclusão é soft delete via `discard`.
* Não há criação automática de lançamento em Controle Financeiro nem na Entrada de material nem na criação de solicitação de prótese.
* Não há modelo de Fornecedor nem de Laboratório separado: ambos são strings livres.
* Não há vínculo procedimento ↔ inventory_item no backend.
* Movimentação de Entrada atualiza o saldo do item somando; Saída subtrai; exclusão de movimentação reverte.
* O agendamento criado a partir do drawer da solicitação de prótese passa pelo fluxo normal de novo evento da Agenda.
