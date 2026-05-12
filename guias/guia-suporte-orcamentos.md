# 📘 Guia de Suporte: Orçamentos

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA, com um fluxo novo de criação em 4 passos liberado por feature flag (`FF_NEW_BUDGET_ENABLED`). 🚧 PENDENTE: confirmar se a flag já está em 100% das clínicas ou ainda é parcial.

## 1. 🎯 Visão geral

Orçamentos é onde o dentista monta a proposta financeira do tratamento que vai oferecer ao paciente. Pense no orçamento de papel que o dentista entregava na recepção, só que digital, calculado automaticamente a partir dos procedimentos selecionados no odontograma, com desconto aplicado, forma de pagamento definida (à vista, parcelado em várias formas, Financiamento Capim) e com a opção de enviar para assinatura eletrônica ou aprovar sem assinatura. É o documento que liga clinicamente o plano de tratamento ao financeiro da clínica: assim que um orçamento é aprovado, ele gera os débitos do paciente no Controle Financeiro e dispara comissões para os profissionais.

Resolve três dores clássicas da clínica: orçamento feito na mão e esquecido na recepção (sem rastro), divergência entre o que o paciente combinou e o que entra no caixa, e dentista que precisa lembrar de comissão de cada procedimento manualmente.

**Para quem é:** todas as clínicas cliente da Capim, em qualquer plano. ✅ Validar: não há gating de plano identificado no backend para Orçamentos.

**Quem cria, edita e aprova dentro da clínica:** o backend grava `created_by_user_id` e `approved_by_user_id` com o usuário logado em ação, sem verificação de papel específico no controller (qualquer usuário autenticado da clínica que enxerga a ficha do paciente consegue criar e aprovar). 🚧 PENDENTE: confirmar com produto se a regra de negócio esperada é "qualquer usuário" mesmo, ou se há feature/policy específica que o suporte precisa solicitar quando uma clínica quiser restringir quem aprova.

**Onde se encaixa no produto Capim:** vive dentro da ficha do paciente, na aba Orçamentos. Conecta com Procedimentos (a lista de procedimentos cadastrada em Configurações alimenta o que o dentista pode selecionar), com Plano de Tratamento (criar orçamento a partir da tela de procedimentos do paciente marca `creation_source = treatment_plan`), com Controle Financeiro (orçamento aprovado vira débitos), com Comissões dos profissionais, com Documentos (assinatura eletrônica), e com Financiamento Capim, Carnê e Maquininha como formas de pagamento (mencionados aqui, documentados em guias próprios).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Paciente cadastrado.
* Procedimentos cadastrados em Configurações → Procedimentos (cada procedimento tem nome, código e valor padrão). Sem catálogo cadastrado a clínica até consegue criar um procedimento avulso no meio do orçamento, mas o caminho previsto é ter o catálogo pronto.
* Pelo menos um dentista cadastrado, se a clínica quiser registrar comissão por profissional.

**Onde acessar:**

* Menu lateral → Pacientes → abrir a ficha do paciente → aba **Orçamentos**.
* URL típica: `/#/patients/:id/budgets`.
* Botão "Novo Orçamento" no canto superior direito da listagem.
* Alternativa: dentro da aba **Procedimentos** do paciente, marcar procedimentos no odontograma e clicar em "Criar orçamento". Isso já leva pro fluxo de criação com `creation_source = treatment_plan`.

**Fluxo típico (criar orçamento, fluxo novo em 4 passos):**

1. Clica em "Novo Orçamento". Abre o stepper com 4 passos.
2. **Passo 1, Selecionar procedimentos.** A tela mostra o odontograma do paciente (decídua ou permanente) e a tabela de procedimentos. O dentista clica nos dentes pra abrir o drawer de procedimento e escolhe do catálogo, ou adiciona linha avulsa. Cada procedimento traz valor padrão do catálogo, mas pode ser editado ali.
3. **Passo 2, Definir valores.** O sistema mostra o subtotal, a comissão total dos profissionais, o valor que sobra pra clínica, e o campo de desconto. O desconto aceita valor em reais ou em percentual (toggle de moeda/percentual). Tem também o campo de observações (até 600 caracteres) que sai impresso no orçamento.
4. **Passo 3, Formas de pagamento.** Duas trilhas: "Definir agora" (escolhe método de pagamento, entrada e parcelas) ou "Definir depois" (passa para aprovação e o financeiro registra a forma à medida que o tratamento avança). Métodos disponíveis: à vista (cartão de crédito, cartão de débito, boleto, dinheiro, cheque, pix, transferência, outros), parcelado com múltiplas formas, ou **Financiamento Capim** (BNPL, aparece quando o valor passa do threshold mínimo configurado no front, `BNPL_THRESHOLD`). 🚧 PENDENTE: confirmar com produto qual é o valor atual desse threshold em produção e se varia por clínica.
5. **Passo 4, Confirmar.** Tela de revisão com procedimentos, totais, formas de pagamento. Aqui o dentista decide: aprovar **com assinatura eletrônica** (envia pro fluxo de assinatura, gera link pro paciente assinar) ou marcar o checkbox **"Aprovar sem assinatura"** (orçamento vira aprovado direto, sem documento assinado).
6. Clica em "Aprovar orçamento" ou "Criar orçamento" (texto muda dependendo do checkbox de aprovação sem assinatura).

**Fluxo típico (criar rascunho):**

* Em qualquer passo, ao sair sem aprovar, o sistema grava um rascunho (`status = draft`). Endpoint próprio `POST /v2/patient/:id/budgets/draft`. O rascunho aparece na listagem com tag "Rascunho" e dá pra retomar pela ação "Editar".

**Estados do orçamento (campo `consolidated_status` que aparece na listagem):**

* 🟦 **Rascunho** (`draft`): foi começado mas não concluído. Editável.
* 🟪 **Orçamento criado** (`created`): foi concluído sem aprovação imediata, está pronto pra entrar em pagamento. Editável.
* ⏳ **Aguardando assinatura** (`waiting_for_signature`): foi enviado pra assinatura eletrônica e está com a Clicksign/provedor rodando. Paciente ainda não assinou.
* 🔄 **Em processo de geração** (`generating_external_document`): o documento de assinatura está sendo gerado externamente, estado transitório.
* ❌ **Erro ao solicitar assinatura** (`signature_error`): o fluxo de assinatura falhou ou foi cancelado.
* ✅ **Assinado** (`signed`): o paciente assinou eletronicamente.
* ✅ **Aprovado sem assinatura** (`approved_without_signature`): a clínica aprovou marcando "Aprovar sem assinatura", sem documento assinado pelo paciente.

**⚠️ Atenção:**

* **Não existe status "expirado" automático.** O orçamento tem um campo `valid_until` (validade) que é gravado e aparece impresso no PDF, **mas o sistema não muda o status sozinho quando essa data passa**. A validade é informativa pro paciente, não um gatilho automático no backend.
* **Não existe status "recusado" pelo paciente.** O fluxo previsto é a clínica apagar (excluir) o orçamento quando o paciente não fechar, ou deixar parado em "Rascunho". O suporte deve esclarecer: se o paciente não fechou, a clínica exclui ou substitui por outro orçamento.
* **Aprovar sem assinatura é definitivo no estado da AASM**: o backend chama `finish!` e o orçamento passa pra `finished` (consolidado como `approved_without_signature`). Não há botão "voltar pra rascunho" depois de aprovado.
* **Excluir orçamento abre um modal com 4 opções de remoção** (escolhe o que faz com procedimentos e débitos já gerados, ver seção FAQ).
* **Edição depois de aprovado é bloqueada.** Só rascunho, pendente (estado interno antigo) e criado são editáveis (`EDITABLE_STATUS`).

## > 3. 💼 Casos de uso esperados

* **Caso 1, primeiro orçamento no plano de tratamento:** o paciente chega, faz a avaliação, o dentista usa o odontograma na aba Procedimentos para marcar o que precisa ser feito (cárie no 16, canal no 36, restauração no 11) e clica em "Criar orçamento". O fluxo já abre no passo 1 com esses procedimentos selecionados. O dentista revisa valores, define forma de pagamento e aprova. Os débitos entram no Controle Financeiro e o paciente recebe o link de assinatura.
* **Caso 2, paciente pede pra pensar:** o dentista monta o orçamento até o passo 3 ou 4, sai sem aprovar. Fica como Rascunho. Quando o paciente volta na clínica, a recepção entra na ficha, aba Orçamentos, clica em "Editar" no rascunho, ajusta o que mudou e aprova.
* **Caso 3, paciente quer dividir o pagamento (entrada + parcelas):** no passo 3, o dentista escolhe "Definir agora", marca entrada (down payment, ex: cartão de débito agora) e o restante em parcelas (ex: cartão de crédito em N vezes). Tela de revisão mostra os dois blocos: Entrada e Pagamento parcelado.
* **Caso 4, financiamento via Capim:** quando o valor do orçamento passa do threshold, no passo 3 aparece o banner do Financiamento Capim. O dentista escolhe BNPL e o sistema redireciona o paciente pro fluxo de pré-análise (abre em nova aba). Fluxo do financiamento em si tem guia próprio.
* **Caso 5, paciente vai pagar à vista:** o dentista escolhe "Pagamento à vista", seleciona método (pix, dinheiro, cartão), aprova. A clínica pode marcar "Aprovar sem assinatura" se for procedimento simples e o paciente já pagou no balcão.
* **Caso 6, dentista precisa reaproveitar um orçamento parecido:** **não há funcionalidade de duplicar.** O caminho prático é olhar o orçamento antigo no histórico (a aba lista todos), abrir o PDF para conferir e refazer o novo orçamento do zero.
* **Caso 7, dentista quer enviar o orçamento por WhatsApp:** **a tela de imprimir/visualizar abre o PDF em nova janela**, e o dentista usa o navegador pra baixar/salvar e mandar manualmente. ✅ Validar: não foi identificado botão "enviar por WhatsApp" direto da tela de orçamento. Há o fluxo de assinatura eletrônica (que envia link pro paciente), mas não envio do PDF puro.

## > 4. ❓ FAQ

**P: O paciente disse que não recebeu o link de assinatura do orçamento. O que fazer?**

R: Primeiro confirmar (1) o paciente tem celular e e-mail cadastrados corretos na ficha? (2) O orçamento está em "Aguardando assinatura" ou em "Erro ao solicitar assinatura"? Se está em erro, o fluxo de assinatura falhou: a clínica pode tentar reenviar pela aba Documentos do paciente, ou apagar o orçamento e refazer. 🚧 PENDENTE: confirmar com produto qual é o canal exato pelo qual o link de assinatura sai (WhatsApp, e-mail, ambos) e qual a janela típica de entrega.

**P: O orçamento aprovado sumiu da tela ou virou outro status, o que aconteceu?**

R: Tipicamente é o fluxo de assinatura mudando de estado em tempo real via websocket. A tela escuta o canal `SIGNED_DOCUMENT_UPDATED_CHANNEL` e atualiza o status do orçamento na hora que o provedor de assinatura confirma. Status que muda sozinho: "Em processo de geração" → "Aguardando assinatura" → "Assinado" (ou "Erro ao solicitar assinatura" se algo falhar).

**P: A clínica quer "recusar" um orçamento. Como?**

R: Não tem botão "recusar". O caminho prático é **excluir o orçamento** pela aba Orçamentos. O modal de exclusão pergunta o que fazer com os procedimentos e débitos vinculados (ver pergunta abaixo). Se a clínica só quer guardar o histórico, oriente a deixar o orçamento como está (Rascunho ou Criado) e criar outro orçamento atualizado.

**P: O que cada opção do modal de excluir faz?**

R: O modal tem 4 opções de remoção:

* **"Excluir tudo, incluindo procedimentos finalizados e débitos recebidos"** (`full_wipe`): apaga tudo, inclusive procedimentos já marcados como realizados e débitos já recebidos. Drástico.
* **"Excluir somente procedimentos não realizados e débitos não recebidos"** (`remove_uncompleted`): mantém o que já aconteceu de fato no tratamento (procedimentos feitos, dinheiro recebido) e remove o restante.
* **"Manter todos os débitos, mas excluir todos os procedimentos"** (`keep_debits_remove_procedures`): tira os procedimentos do plano clínico e mantém os lançamentos financeiros.
* **"Manter todos os procedimentos, mas excluir todos os débitos"** (`keep_procedures_remove_debits`): tira os lançamentos financeiros e mantém os procedimentos no plano.

Se o orçamento foi assinado, aparece um alerta: o orçamento assinado é removido do sistema da clínica, mas o paciente mantém acesso à cópia assinada (link enviado no fluxo de assinatura).

**P: Aprovou orçamento errado, dá pra desfazer?**

R: Pela interface, não. O orçamento passa pra `finished` na AASM e não tem botão "voltar pra rascunho". O caminho prático é excluir e recriar (escolhendo a opção de remoção que faça sentido pros débitos e procedimentos que já foram lançados). 🚧 PENDENTE: confirmar com a engenharia se existe transição interna pra reverter um orçamento aprovado por engano (similar à reativação de agendamento cancelado), ou se o caminho é apagar mesmo.

**P: Como o desconto entra no cálculo?**

R: O desconto pode ser **em reais** (`amount`) ou **em percentual** (`percentage`). Quando é percentual, o front converte pra reais usando o `total_amount` do orçamento e manda o valor calculado pro backend (o campo `discount_amount` é sempre em reais no banco). O saldo a pagar do orçamento é `total_amount - discount_amount - já_pago`.

**P: O paciente pediu pra trocar um procedimento depois que o orçamento foi aprovado. Como?**

R: Não dá pra editar orçamento aprovado pela interface. Caminhos: (1) excluir o orçamento e refazer (escolhendo a opção de remoção que preserve o que já foi feito/pago), ou (2) deixar o orçamento atual como está e criar um orçamento adicional pra cobrir só o procedimento novo, com forma de pagamento separada.

**P: Como imprimir o orçamento?**

R: Na listagem da aba Orçamentos, clica no menu de três pontos do orçamento e escolhe "Visualizar orçamento". Abre um modal com checkboxes que controlam o que aparece no PDF: valor total, valor por procedimento, dentistas, desconto, observações, forma de pagamento. Marca o que quer mostrar, confirma, abre em nova aba o PDF formatado. Daí imprime pelo navegador (Ctrl+P) ou salva como PDF.

**P: Tem como mandar o orçamento pelo WhatsApp direto do sistema?**

R: ✅ Validar: pela investigação no código, o caminho é abrir o PDF e enviar manualmente (compartilhar o link ou o arquivo pelo WhatsApp web/app). O envio automatizado vem pelo fluxo de **assinatura eletrônica**, que dispara link de assinatura pro paciente. Não foi identificado botão direto "Enviar por WhatsApp" do PDF de orçamento.

**P: Quem aparece como "Adicionado por" / "Editado por"?**

R: O backend grava `created_by_user_id` (quem criou) e atualiza `approved_by_user_id` a cada edição/aprovação (na prática, fica como "quem fez a última ação"). A listagem mostra o nome do usuário logado que fez essa ação. Se a clínica acha que está aparecendo o usuário errado, vale checar se quem editou estava logado com a conta correta.

**P: Como adicionar um procedimento que não está no catálogo da clínica?**

R: Dentro do fluxo de criação do orçamento, ao adicionar uma linha de procedimento, dá pra digitar o nome e valor manualmente em vez de buscar no catálogo. Aquele procedimento entra como "avulso" naquele orçamento. Pra reaproveitar em outros pacientes, o ideal é cadastrar de verdade em Configurações → Procedimentos.

**P: A clínica quer limitar quem aprova orçamento (só admin, por exemplo). Dá?**

R: 🚧 PENDENTE: confirmar com produto. Pelo código do controller, qualquer usuário autenticado da clínica que abre a ficha do paciente consegue criar e aprovar. Não foi encontrada policy específica de Orçamentos no backend (`app/policies`), só os endpoints abertos no controller. Se uma clínica pedir essa restrição, escalar pro time de Produto.

**P: O paciente assinou pelo link, mas a clínica não vê "Assinado" na tela. O que verificar?**

R: A atualização é via websocket. Pedir pra recarregar a página (F5). Se mesmo recarregando segue "Aguardando assinatura", checar a aba Documentos do paciente (status do documento de assinatura). Se o provedor de assinatura registra como assinado e o orçamento não atualiza, escalar pra engenharia com ID do orçamento e ID do documento.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Aprovei o orçamento e não apareceu o débito no financeiro." | Aprovação travou no meio (erro em comissões, no checkout ou no documento), ou o usuário olhou no lugar errado. | Confirmar status do orçamento (aprovado de fato?). Conferir aba Financeiro do paciente. Pedir refresh. Pegar ID do orçamento. | Se o orçamento está aprovado mas os débitos não foram gerados, escalar pra eng com ID do orçamento e ID da clínica. |
| "Não consigo editar o orçamento, o botão sumiu." | Orçamento já está em estado que bloqueia edição (Aprovado sem assinatura, Aguardando assinatura, Assinado, etc.). Só Rascunho, Pendente e Criado aparecem como editáveis. | Confirmar o status do orçamento na tag da listagem. Explicar a regra: aprovado não edita. | Se o cliente jura que está em Rascunho e mesmo assim não aparece "Editar", escalar pra eng. |
| "O paciente não recebeu o link de assinatura." | Cadastro do paciente sem celular/e-mail, ou o fluxo travou no provedor de assinatura. | Conferir cadastro do paciente. Conferir status do documento na aba Documentos. Se está em "Erro ao solicitar assinatura", refazer o envio. | Se o documento foi gerado mas o link não saiu, escalar pra eng com ID do documento. |
| "Marquei 'sem assinatura' por engano e o orçamento foi aprovado." | Aprovou direto via checkbox no passo 4. Não tem botão de desfazer. | Orientar o caminho de excluir o orçamento (escolhendo a opção de remoção que preserve o que já aconteceu) e recriar com o fluxo de assinatura. | Se a clínica pedir reverter em vez de recriar, abrir ticket pra engenharia com o ID do orçamento. 🚧 PENDENTE confirmar se existe rota interna pra reverter. |
| "Excluí o orçamento e perdi débitos que já estavam pagos." | A clínica escolheu `full_wipe` em vez de `remove_uncompleted` no modal. | Mostrar a diferença das 4 opções (FAQ). Explicar que `full_wipe` apaga tudo, inclusive o que já aconteceu. | Se a clínica precisa restaurar débitos apagados, escalar pra eng com ID do orçamento e a data da exclusão. |
| "O Financiamento Capim não aparece como opção no orçamento." | Valor do orçamento abaixo do threshold mínimo de BNPL, ou clínica sem habilitação pra BNPL. | Conferir valor do orçamento. Conferir se a clínica está habilitada pra Financiamento Capim. | Encaminhar pro time/guia de Financiamento Capim. |
| "O orçamento mostra a data de validade vencida e ainda aceita pagamento." | Esperado: a `valid_until` é informativa, não bloqueia nada. | Esclarecer que o campo é só pro PDF e não muda status automaticamente. Se a clínica quer "fechar" o orçamento vencido, orientar a excluir ou criar novo. | Não escala, é comportamento atual. |
| "O orçamento mudou de status sozinho." | Atualização via websocket do fluxo de assinatura (Aguardando → Em geração → Assinado, ou erro). | Confirmar pelo nome do status atual. É esperado e em tempo real. | Só escala se o status muda de forma inconsistente com o fluxo (ex: vai pra "Erro" sem nunca ter sido enviado pra assinatura). |
| "Estou no fluxo novo (4 passos) e a clínica do lado está no fluxo antigo (uma tela só)." | Feature flag `FF_NEW_BUDGET_ENABLED` controla qual fluxo aparece. Pode ter ido pra uma clínica e não pra outra. | Confirmar a clínica e checar a flag. 🚧 PENDENTE: confirmar canal/ferramenta exata pro suporte conferir feature flag por clínica. | Escalar pra eng se a flag deveria estar ativa e não está. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Bugs de cálculo, débitos não gerados após aprovação, falhas de assinatura, pedidos de reativação ou ativação de feature flag entram por esse canal.

## > 6. ⚠️ Limitações conhecidas

* **Não há status "expirado" automático.** O campo `valid_until` é gravado e impresso no PDF, mas o sistema não muda o status sozinho quando a data passa.
* **Não há status "recusado pelo paciente".** O fluxo previsto é a clínica excluir o orçamento ou deixar como Rascunho/Criado se o paciente não fechar.
* **Não há funcionalidade de duplicar orçamento.** Pra fazer um parecido, refaz do zero.
* **Não há botão "enviar por WhatsApp" direto.** O caminho é abrir o PDF (Visualizar) e enviar manualmente pelo navegador, ou usar o fluxo de assinatura eletrônica (que envia link). ✅ Validar.
* **Não há "voltar pra rascunho" depois de aprovar.** Aprovou, fechou. Se errou, exclui e refaz.
* **Edição depois de aprovado é bloqueada na interface.** Os estados editáveis são `draft`, `pending` e `created` (`EDITABLE_STATUS` no front).
* **Não há, no controller, policy específica restringindo quem cria ou aprova.** Qualquer usuário autenticado que abre a ficha do paciente consegue. 🚧 PENDENTE confirmar se isso é intencional.
* **Threshold do Financiamento Capim está hardcoded no frontend** (`BNPL_THRESHOLD`). Mudanças desse valor exigem deploy. 🚧 PENDENTE confirmar valor atual em produção.
* **Cancelamento (exclusão) tem 4 estratégias e a escolha errada perde dados** (ex: `full_wipe` apaga pagamentos já recebidos). Sem rollback automático.
* **Procedimento avulso criado dentro do orçamento não entra no catálogo da clínica.** Pra reaproveitar, precisa cadastrar em Configurações → Procedimentos.

## > 7. 🗺️ Próximos passos [opcional]

* Rollout do fluxo novo em 4 passos pra 100% das clínicas. 🚧 PENDENTE: status atual.
* Possível integração mais profunda com Carnê e Maquininha como formas de pagamento padrão do orçamento. 🚧 PENDENTE.
* ✅ Validar com produto: roadmap de status "expirado" automático ou notificação de validade vencida.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: aba Orçamentos do paciente com listagem e tags de status]

[INSERIR PRINT: passo 1 do fluxo novo, odontograma + tabela de procedimentos]

[INSERIR PRINT: passo 2, campo de desconto e resumo de comissão/clínica]

[INSERIR PRINT: passo 3, escolha de forma de pagamento e banner Financiamento Capim]

[INSERIR PRINT: passo 4, revisão com checkbox "Aprovar sem assinatura"]

[INSERIR PRINT: modal de imprimir/visualizar com checkboxes do que mostrar no PDF]

[INSERIR PRINT: modal de excluir orçamento com as 4 opções de remoção]

[INSERIR PRINT: PDF do orçamento aberto em nova aba]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e disponibilidade**
* [ ] Status atual da feature flag `FF_NEW_BUDGET_ENABLED`: já está em 100% das clínicas? Se não, qual canal/ferramenta o suporte usa pra conferir se uma clínica está no fluxo novo ou antigo?
* [ ] Existe gating de plano em Orçamentos, ou está liberado pra todas as clínicas em qualquer plano?

**Permissões**
* [ ] É intencional que qualquer usuário autenticado da clínica crie e aprove orçamento, ou existe policy/feature que o suporte solicita pra restringir (ex: só admin aprova)?

**Status e fluxo**
* [ ] Existe rota interna pra reverter um orçamento aprovado por engano (similar à reativação de agendamento cancelado), ou o caminho oficial é excluir e recriar?
* [ ] Roadmap de status "expirado" automático: tem? Quando?

**Assinatura**
* [ ] Canal exato pelo qual o link de assinatura sai pro paciente (WhatsApp, e-mail, ambos) e janela típica de entrega.
* [ ] Quando o status muda pra "Erro ao solicitar assinatura", existe ação automatizada de retry, ou a clínica precisa refazer manualmente?

**Financiamento Capim**
* [ ] Valor atual do threshold de BNPL em produção (`BNPL_THRESHOLD`) e se varia por clínica.

**Envio do orçamento**
* [ ] Existe botão/fluxo de "enviar PDF do orçamento por WhatsApp" que o suporte deveria conhecer, ou o caminho é mesmo enviar manualmente pelo navegador?

**Escalação**
* [ ] SLA esperado de resposta pra cada nível de severidade no Time de Sustentação.

## > ✅ Validar com produto/eng antes de publicar

Itens que ainda dependem de confirmação oficial:

* [ ] "Não há botão de enviar PDF do orçamento por WhatsApp direto da tela." Inferido pela ausência no código, mas vale validar se existe via algum componente compartilhado de documentos.
* [ ] "Não há funcionalidade de duplicar orçamento." Inferido pela ausência no código.
* [ ] "Qualquer usuário autenticado consegue criar/aprovar." Inferido pelo controller (sem policy), mas a regra de negócio pode ser outra.
* [ ] "Procedimento avulso criado dentro do orçamento não vira item de catálogo." Inferido pelo `CreateForm`, vale confirmar com produto.

### Itens já validados pelo backend (não precisa mais perguntar)

Fact-check feito contra `capim-dash-backend`, podem ser tratados como confirmados:

* Status interno (AASM): `draft`, `pending`, `analyzing`, `created`, `finished`. Status consolidado exposto na UI: `draft`, `created`, `approved_without_signature`, `generating_external_document`, `waiting_for_signature`, `signature_error`, `signed`.
* Aprovar dispara `Budgets::Finish` que faz transição AASM pra `finished` dentro de transação. Não há "desfazer" pela interface.
* Exclusão tem 4 estratégias em `Budgets::V2::Destroy`: `full_wipe`, `remove_uncompleted`, `keep_debits_remove_procedures`, `keep_procedures_remove_debits`.
* `EDITABLE_STATUS = ['pending', 'draft', 'created']` controla quem mostra botão "Editar" na listagem.
* `valid_until` é gravado e usado no PDF, sem efeito automático no status.
* Desconto tem dois tipos: `amount` (reais) e `percentage` (front converte pra reais antes de enviar).
* `creation_source` pode ser `treatment_plan`, `budgets_index` ou `tutorial`, dependendo de onde a criação começou.
* `consolidated_status` é calculado por `Budgets::ConsolidatedStatusCalculator` combinando estado AASM + estado do documento de assinatura.
* O fluxo novo de 4 passos vive sob feature flag `FF_NEW_BUDGET_ENABLED`. Existe fluxo antigo (tela única) ainda no código.
* Atualização de status do orçamento durante o fluxo de assinatura chega na tela via websocket (`SIGNED_DOCUMENT_UPDATED_CHANNEL`).
* Comissões são distribuídas no momento da criação via `Commissions::DistributeByDentist`.
