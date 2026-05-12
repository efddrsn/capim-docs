# 📘 Guia de Suporte: Relatórios

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA. O módulo está em produção como uma vitrine de 4 dashboards do Metabase embarcados via iframe, mais um card de "Sugerir um relatório" que abre um formulário de feedback.

## 1. 🎯 Visão geral

Relatórios é a área onde a clínica olha "o retrato do mês": quantas consultas aconteceram, quantos orçamentos foram feitos, quanto entrou e saiu de dinheiro, qual procedimento mais rende, qual profissional mais gera receita. Não é um lugar onde a clínica edita nada: é só leitura, para tomada de decisão.

Importante alinhar a expectativa desde o início: hoje o módulo Relatórios da Capim **não é um construtor de relatórios próprio**. Cada relatório é um **dashboard montado no Metabase** (ferramenta de BI externa) e exibido dentro do dashboard da Capim por um iframe. A clínica não escolhe colunas, não cria relatório novo, não monta gráfico. Quem precisar de um relatório que ainda não existe usa o card "Sugerir um relatório" e descreve para o time de produto da Capim.

**Para quem é:** clínicas cliente da Capim em planos pagos. **O menu "Relatórios" não aparece para clínicas de rede sem assinatura ativa** (`isNetworkClinicWithoutSubscription`). ✅ Validar com produto se há outras condições de gating de plano que escondem o menu.

**Quem vê dentro da clínica:** ✅ Validar com produto. O código do módulo de Relatórios não tem uma policy específica visível para limitar quem clica em "Relatórios" no menu lateral. O JWT enviado para o Metabase carrega só o `clinic_id` da clínica logada, então **os dados sempre são da clínica inteira**, não filtrados por usuário (um dentista que abre Relatórios vê o consolidado da clínica, não só dele). 🚧 PENDENTE: confirmar se existe alguma role/permissão que esconde o menu para perfis específicos (ex: dentista comum versus admin).

**Onde se encaixa no produto Capim:** os relatórios consomem dados de **vários módulos ao mesmo tempo**, sempre da clínica logada:

* **Agenda** (consultas, comparecimentos, faltas, status dos agendamentos).
* **Orçamentos** (orçamentos criados e aprovados).
* **Procedimentos** realizados (a partir da ficha clínica e dos orçamentos fechados).
* **Financeiro/Fluxo de caixa** (lançamentos de receita e despesa, recebíveis em aberto).

Se algum desses módulos está com dado errado na origem, o relatório também fica errado: o relatório é o reflexo, não a fonte.

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Clínica em plano pago (não rede sem assinatura).
* Pelo menos algum dado registrado nos módulos de origem (Agenda, Orçamentos, Financeiro). Clínica recém-criada vai ver dashboards praticamente vazios, e isso é esperado.

**Onde acessar:**

* Menu lateral → Relatórios.
* URL: `/#/reports` (lista de relatórios). Cada relatório abre em `/#/reports/<id-do-relatorio>` (ex: `/#/reports/overview`).

**O que aparece na tela inicial (`/reports`):**

Três blocos, de cima pra baixo:

1. **Três cartões de resumo** no topo, que mostram um número de destaque do período atual:
   * 💰 **Receita gerada**, valor total das entradas do mês corrente (fonte: lançamentos financeiros).
   * 🦷 **Comparecimentos**, número de consultas da semana corrente (fonte: Agenda).
   * 🧮 **Orçamentos**, quantidade de orçamentos criados no mês corrente (fonte: Orçamentos).
2. **Quatro cards de relatório** para abrir o dashboard cheio, descritos no item 3 abaixo.
3. **Um card "Sugerir um relatório"** para a clínica pedir um relatório que ainda não existe.

**Os quatro relatórios disponíveis hoje:**

* 📊 **Visão geral**: resumo consolidado da clínica. Consultas realizadas, orçamentos aprovados, procedimentos por profissional e receita gerada. (Categoria interna: `overview`, dashboard Metabase 188.)
* 📅 **Agenda**: total de agendamentos, confirmações e comparecimentos por período, profissional e status. (Categoria interna: `schedule`, dashboard Metabase 183.)
* 💵 **Fluxo de caixa**: entradas, saídas, valores em aberto, previsões de recebimentos e pagamentos. (Categoria interna: `cashFlow`, dashboard Metabase 215.)
* 📈 **Distribuição de receita**: faturamento por tipo de procedimento, receita por profissional e preço médio. (Categoria interna: `revenueDistribution`, dashboard Metabase 217.)

**Fluxo típico (ver um relatório):**

1. A clínica abre Relatórios pelo menu.
2. Clica em "Visualizar" no card do relatório desejado.
3. A página `/reports/<id>` carrega: o frontend pede um token JWT ao backend (rota `/v2/jwt` da BNPL, em `capim-backend`), passando o `dashboard_id` do Metabase e o `clinic_id` da clínica logada.
4. O Metabase recebe o token, valida e devolve o dashboard renderizado dentro do iframe, **já filtrado para a clínica logada** (parâmetro `retail_id` = `clinic_id`).
5. A clínica navega dentro do iframe: muda filtros do próprio dashboard, hovers nos gráficos, clica em colunas para detalhar.

**Filtros disponíveis:**

* O filtro de **clínica** é sempre automático e fixo, vem no token JWT, a clínica não vê nem altera.
* Filtros adicionais (período, profissional, procedimento, status) **são definidos pelo próprio dashboard do Metabase**, não pela tela da Capim. Cada dashboard tem o seu conjunto de filtros configurado no Metabase, então o que aparece em "Visão geral" pode ser diferente do que aparece em "Fluxo de caixa". ✅ Validar com produto/dados a lista oficial e atualizada de filtros por dashboard.

**Exportação:**

* **Não existe botão "Exportar PDF" ou "Exportar Excel" feito pela Capim** dentro do módulo Relatórios. Não há código de download de CSV/PDF nessa tela.
* O que pode existir é o **menu de export nativo do próprio Metabase** dentro do iframe (PNG, CSV de uma pergunta individual). Esse menu depende da configuração do embed no Metabase. 🚧 PENDENTE: confirmar com produto/dados se o embed atual mantém esses botões nativos do Metabase visíveis para a clínica, ou se foram desativados.
* Quando a clínica pede "quero baixar o relatório", a resposta honesta é: nativo da Capim, não tem; o que tiver vem do Metabase dentro do iframe.

**⚠️ Atenção:**

* **Dado de relatório segue dado de origem.** Se a clínica corrigir um agendamento ou um lançamento financeiro antigo, o relatório vai refletir essa correção na próxima atualização. **Relatório de período passado pode mudar** se a clínica editou dado antigo. Isso é esperado e não é bug.
* **Relatório que mudou sem ninguém editar dado é sinal de bug** (ou de processo: import em massa, migração, ajuste por engenharia). Pedir pra clínica registrar a data e o número que viu antes e depois antes de escalar.
* **O dashboard só atualiza enquanto está aberto se o Metabase atualizar a cache dele.** Não há refresh automático na tela da Capim. Recarregar a página é o caminho rápido.
* **Latência de atualização:** dado registrado agora pode demorar para aparecer no relatório, dependendo da pipeline de dados do Metabase. ✅ Validar com produto/dados qual é a janela esperada (real-time, alguns minutos, atualização noturna).

## > 3. 💼 Casos de uso esperados

* **Caso 1, fechamento mensal:** no dia 1º do mês, a dona da clínica abre Relatórios → Fluxo de caixa, filtra o mês anterior, vê total de entradas e saídas, e usa pra conversar com o contador.
* **Caso 2, avaliação de profissional:** o admin abre Relatórios → Distribuição de receita, olha receita por profissional do trimestre e percentual de cada um no faturamento. Cruza com Visão geral para ver quantos procedimentos cada profissional fez.
* **Caso 3, acompanhamento de comparecimento:** a recepção abre Relatórios → Agenda, vê quantos comparecimentos versus faltas no mês. Usa pra ajustar política de confirmação prévia ou bloqueio de paciente faltoso.
* **Caso 4, preço médio de procedimento:** a clínica abre Distribuição de receita pra entender qual procedimento mais entra e qual tem ticket médio maior. Útil pra decidir promoção ou foco de marketing.
* **Caso 5, sugestão de relatório novo:** a clínica precisa de um relatório que não existe (ex: estoque consumido por dentista). Clica em "Sugerir um relatório", marca a categoria (Ficha clínica, Estoque, Financeiro, Outros), descreve o que espera ver e envia. Vira input para o time de produto.

## > 4. ❓ FAQ

**P: A clínica não vê o menu "Relatórios". Por quê?**

R: O menu fica escondido para clínicas de rede sem assinatura ativa (`isNetworkClinicWithoutSubscription`). Conferir o status comercial da clínica. Se a clínica pagou e mesmo assim o menu sumiu, escalar para Sustentação com o ID da clínica. ✅ Validar se há outras condições (perfil de usuário, plano específico) que escondem o menu.

**P: A clínica diz que o número do relatório está errado.**

R: Primeiro, alinhar com a clínica **qual número** e em **qual relatório**. Depois, percorrer a origem:

* Receita errada → checar Financeiro → lançamentos do período. O total dos lançamentos casa com o relatório?
* Quantidade de consultas errada → checar Agenda do período. Pode ser agendamento cancelado ou status "pendente" entrando/saindo da contagem.
* Receita por profissional errada → checar se o procedimento está atribuído ao profissional correto na ficha do paciente.

Se a origem está certa e o relatório está errado, é bug do dashboard. Escalar para Sustentação com print do relatório, print da origem (Agenda ou Financeiro) e ID da clínica.

**P: O relatório do mês passado mudou. Isso é bug?**

R: Depende. Se a clínica **editou algum dado antigo** (lançamento financeiro retroativo, alterou um agendamento passado, fechou um orçamento com data anterior), é esperado que o relatório do mês passado também mude, porque ele reflete o estado atual da base. Se a clínica **garante que ninguém mexeu em nada** e ainda assim o número mudou, escalar.

**P: A clínica pediu pra exportar o relatório em PDF/Excel. Tem botão?**

R: A Capim **não tem botão próprio de exportar** no módulo Relatórios. O que pode ter é o menu de export nativo do Metabase dentro do iframe (canto superior do gráfico ou menu do dashboard), mas isso depende da configuração do embed. 🚧 PENDENTE: confirmar com produto/dados qual é o comportamento esperado hoje (botão visível ou não).

**P: A clínica vê dados de outra clínica no relatório.**

R: **Incidente grave de privacidade.** Escalar imediatamente para Sustentação como prioridade alta. O filtro de `clinic_id` é injetado no JWT antes do Metabase montar o dashboard, então isolamento deveria ser por construção. Coletar print, ID da clínica logada, navegador, horário.

**P: O iframe do relatório fica em branco / "carregando" pra sempre.**

R: Costuma ser (1) bloqueador de iframes / extensão de navegador, (2) sessão expirada do Metabase, (3) erro na geração do token JWT, (4) Metabase fora do ar. Pedir pra clínica: recarregar a página, tentar em janela anônima, tentar em outro navegador. Se persistir, escalar com print do console do navegador (F12).

**P: Os filtros que aparecem dentro do relatório são diferentes entre relatórios. Por quê?**

R: Cada relatório é um dashboard separado no Metabase, com filtros configurados independentes. Visão geral, Agenda, Fluxo de caixa e Distribuição de receita são quatro dashboards distintos. Para padronizar filtros, a alteração é no Metabase, não no app da Capim.

**P: A clínica quer um relatório que não existe (ex: pacientes inativos, ranking de procedimentos, produtividade por dentista). Como atender?**

R: Hoje, **não há esses relatórios prontos** no módulo. Existem apenas os quatro (Visão geral, Agenda, Fluxo de caixa, Distribuição de receita). Orientar a clínica a clicar em "Sugerir um relatório" no fim da lista, marcar a categoria (Ficha clínica, Estoque, Financeiro, Outros) e descrever o que espera ver. A sugestão chega no backend pelo endpoint `POST /api/v1/report_suggestions` e vira input para o time de produto.

**P: O dado da semana passada está estranho.**

R: Confirmar primeiro se a clínica acabou de migrar para a Capim ou se fez algum batch de correção. Em seguida, abrir os módulos de origem (Agenda, Financeiro) e conferir se os números fechados batem. Se baterem na origem e divergirem no relatório, escalar.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que a clínica relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Não vejo Relatórios no menu." | Clínica de rede sem assinatura ativa, ou flag/permissão escondendo. | Conferir status comercial. Se devia ter, conferir se outras telas pagas aparecem (ex: Fluxo de caixa avulso). | Escalar pra Sustentação com ID da clínica se devia ter acesso e não tem. |
| "Cliquei em Visualizar e a tela ficou em branco / só carregando." | Bloqueador de iframe, sessão Metabase expirada, falha na geração do JWT, Metabase fora do ar. | Pedir recarregar a página, testar em janela anônima, testar outro navegador. | Persistindo, escalar com print do console (F12) e horário. |
| "O número do relatório não bate com o módulo de origem." | Dado editado no meio (cancelamento, alteração de lançamento), latência da pipeline de dados, ou bug do dashboard. | Conferir Agenda/Financeiro do mesmo período. Anotar diferença exata. | Se a origem bate e o relatório não, escalar com prints dos dois lados, ID da clínica, período, número de origem e número do relatório. |
| "O relatório do mês passado mudou sem motivo." | Alguém editou dado retroativo (lançamento antigo, agendamento antigo) ou houve correção em massa. | Perguntar à clínica se mexeu em dado antigo. Conferir auditoria do módulo de origem se possível. | Se a clínica garante que nada mudou e o número mudou mesmo assim, escalar para investigação. |
| "Quero baixar em PDF/Excel e não tem botão." | A Capim não tem export próprio na tela Relatórios. | Explicar a limitação. Verificar se o menu nativo do Metabase está visível no iframe (depende do embed). | Não escala, é limitação conhecida; pode virar pedido de produto. |
| "Os filtros não são iguais nos quatro relatórios." | Cada dashboard tem filtros próprios configurados no Metabase. | Explicar que cada relatório é independente. | Não escala. Pedido de padronização vira sugestão pra produto. |
| "Vejo dados de outra clínica no meu relatório." | Incidente grave: vazamento de dado entre clínicas. | Coletar prints, ID da clínica logada, e-mail do usuário logado, horário, navegador. | **Escalar imediatamente como prioridade alta.** |
| "Mandei a sugestão de relatório novo e não recebi resposta." | Sugestão é coleta para produto, não há SLA de resposta individual. | Explicar que o canal serve pra priorização do roadmap, não é canal de suporte. | Encaminhar a dor pra produto se for caso recorrente da clínica. |

**Para quem escalar:** **Time de Sustentação** (interno Capim). Bugs nos dashboards (Metabase), erro de filtro de clínica, latência de dados, gating de acesso, todos entram por esse canal. Sugestões de relatórios novos vindas pelo card "Sugerir um relatório" entram automaticamente no backlog de produto pelo `report_suggestions`.

## > 6. ⚠️ Limitações conhecidas

* **Não há export nativo da Capim** para PDF ou Excel/CSV dentro do módulo Relatórios. Só o que o Metabase oferecer no iframe.
* **Não há editor de relatório próprio.** A clínica não monta gráfico, não escolhe colunas, não filtra fora do que o dashboard do Metabase oferece. Para tudo o que sai do padrão, é sugestão via formulário.
* **Os filtros disponíveis variam entre os quatro relatórios.** Não há filtro "global" que se aplica a todos os dashboards de uma vez.
* **Não há filtro por usuário/dentista logado** que afete o relatório. O dashboard sempre vê a clínica inteira, mesmo que o usuário logado seja um dentista que só agenda para si.
* **Não há refresh automático na tela.** Recarregar a página é o caminho.
* **Latência da pipeline de dados:** dado registrado agora pode não aparecer no relatório imediatamente. ✅ Validar janela esperada com produto/dados.
* **Quatro relatórios apenas hoje:** Visão geral, Agenda, Fluxo de caixa, Distribuição de receita. Nomes como "Faturamento por período", "Atendimentos por dentista" (em separado), "Comparecimento e faltas" (em separado), "Ranking de procedimentos", "Produtividade por dentista", "Pacientes ativos/inativos" **não existem como relatórios dedicados**, embora partes desses dados apareçam dentro dos quatro dashboards existentes.
* **Acoplamento com Metabase:** se o Metabase está fora do ar ou se o dashboard foi alterado/removido por engenharia, o relatório quebra na hora pra todas as clínicas.

## > 7. 🗺️ Próximos passos [opcional]

* 🚧 PENDENTE: roadmap de novos relatórios pedidos pela base via "Sugerir um relatório" (existe priorização periódica? quem decide?).
* 🚧 PENDENTE: avaliação de substituir o iframe Metabase por relatórios nativos da Capim em alguma janela de tempo.
* 🚧 PENDENTE: padronização dos filtros entre os quatro dashboards (período, profissional, status).

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: tela inicial de Relatórios com os três cartões de resumo e os cinco cards (4 relatórios + sugerir)]

[INSERIR PRINT: dashboard "Visão geral" aberto dentro do iframe]

[INSERIR PRINT: dashboard "Agenda" aberto dentro do iframe]

[INSERIR PRINT: dashboard "Fluxo de caixa" aberto dentro do iframe]

[INSERIR PRINT: dashboard "Distribuição de receita" aberto dentro do iframe]

[INSERIR PRINT: modal "Sugerir um relatório" passo 1 (categorias) e passo 2 (observação)]

[INSERIR PRINT: tela em branco / erro de carregamento do iframe, para o time reconhecer]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Acesso e permissão**
* [ ] Existe alguma role/permissão (além de "rede sem assinatura") que esconde o menu Relatórios para perfis específicos dentro da clínica (ex: dentista comum, recepcionista)?
* [ ] Plano comercial mínimo para ter acesso a Relatórios: todos os planos pagos veem os quatro? Há plano que vê só alguns?
* [ ] Feature flags do tipo `access-financial-control-*` afetam algum dos quatro dashboards (especialmente Fluxo de caixa e Distribuição de receita)? Não foi encontrado código aplicando essas flags no módulo Relatórios, mas vale confirmar com produto.

**Exportação e filtros**
* [ ] O embed do Metabase hoje mantém os botões nativos de export (PNG/CSV) visíveis dentro do iframe, ou foram desativados?
* [ ] Lista oficial e atualizada de filtros de cada um dos quatro dashboards (período, profissional, procedimento, status, etc).

**Dados e atualização**
* [ ] Qual é a janela esperada de atualização entre "dado registrado na Capim" e "dado aparecendo no relatório"? Tempo real, minutos, horas, atualização diária?
* [ ] Quando um dado antigo é editado (lançamento financeiro de mês anterior, agendamento passado), em quanto tempo o relatório passado é atualizado?
* [ ] Existe alguma página/lugar onde o suporte vê o status de saúde do Metabase (se está fora do ar para todas as clínicas)?

**Backlog e roadmap**
* [ ] Como o time de produto trata as sugestões enviadas pelo card "Sugerir um relatório"? Existe cadência de revisão?
* [ ] Há roadmap público para os relatórios novos mais pedidos (ranking de procedimentos, produtividade por dentista, pacientes ativos/inativos)?

**Escalação**
* [ ] SLA de resposta no Time de Sustentação para bugs de Relatórios (gravidade de número errado, gravidade de vazamento entre clínicas).

## > ✅ Validar com produto/eng antes de publicar

Itens inferidos do código que ainda merecem confirmação oficial:

* [ ] "O JWT do Metabase carrega apenas `clinic_id` (parâmetro `retail_id`), então o dashboard é sempre filtrado para a clínica logada e ignora o usuário individual." Confirmado em `src/api/bnpl/metabase.js`, mas vale confirmar com produto se essa é a intenção definitiva (sem filtro por usuário).
* [ ] "Não há código de export PDF/Excel na tela Relatórios da Capim." Confirmado por busca: nada em `src/views/reports/` nem em `src/components/reports/` faz download. O que existir vem do Metabase nativo.
* [ ] "Os quatro dashboards são: 188 (Visão geral), 183 (Agenda), 215 (Fluxo de caixa), 217 (Distribuição de receita)." Confirmado em `src/constants/reports.js`, mas o ID pode ter sido trocado no Metabase sem trocar o arquivo. Vale conferir com dados.
* [ ] "Os cartões de resumo do topo vêm de: `FinancialOperationsStore` (mês), `CalendarV2Store` (semana), `BudgetsStore` (mês)." Confirmado em `IndexView.vue`.

### Itens já validados pelo código (não precisa mais perguntar)

Fact-check feito contra `capim-dash-frontend` e `capim-dash-backend`, podem ser tratados como confirmados:

* O módulo Relatórios é composto por **quatro dashboards do Metabase embarcados em iframe**, mais um card de sugestão. Não há relatório feito nativamente pela Capim.
* A categoria `suggestion` não abre dashboard: abre um modal de formulário que grava em `POST /api/v1/report_suggestions` no `capim-dash-backend`. Categorias possíveis: Ficha clínica, Estoque, Financeiro, Outros (com texto livre).
* A página inicial de Relatórios exibe três cartões de resumo no topo: Receita gerada (mês), Comparecimentos (semana), Orçamentos (mês).
* O token JWT para o Metabase é gerado pelo `capim-backend` na rota `/v2/jwt` (controller `Api::V2::JwtController`), e leva `retail_id` igual ao `clinic_id` da clínica logada.
* O menu "Relatórios" no sidebar é controlado pelo feature flag `reportsEnabled`, cuja regra é: **aparece se a clínica não for "network clinic sem subscription"**.
* Não existe lógica de gating por feature flag `access-financial-control-*` aplicada especificamente no módulo Relatórios; essas flags aparecem só nos módulos de Controle Financeiro e Carnê.
* Os CSVs gerados pelo backend (`Reports::Csv::*` em `capim-dash-backend`) **não são acionados pela tela Relatórios**. Eles servem a Carnê e a Controle Financeiro, em outras telas.
