# 📣 Guia de Suporte: Campanhas (Camila Connects)

> Material para o time de suporte da Capim. Atualizado em 12/05/2026.
> Status da feature: GA no menu principal para clínicas com assinatura ativa, mas a aplicação que abre dentro do dashboard é um produto separado (`camila-comunicativa.capim.com.br`) cuja documentação técnica não está nos repositórios principais (dash frontend, dash backend, capim-backend). 🚧 PENDENTE: confirmar com o time do produto Camila qual repositório e equipe são donos da aplicação interna.

## 1. 🎯 Visão geral

Campanhas (também chamado de "Camila Connects" no código) é a ferramenta da Capim para a clínica disparar mensagens em massa pela base de pacientes via WhatsApp. Em vez de mandar um a um, a clínica define um público (ex: pacientes aniversariantes do mês, pacientes que não vêm há tempos, pós-tratamento, oferta sazonal) e a Camila dispara a mensagem para todos. A promessa principal do produto é **reativar paciente inativo**, combinando a mensagem da Camila com a oferta de parcelamento via CaPix (Pix parcelado) para destravar o agendamento.

Resolve dores como: paciente que sumiu, agenda com buracos, falta de tempo da recepção para ligar de um em um, e oferta de retorno feita "no escuro" sem template padronizado.

**Para quem é:** clínicas cliente da Capim com assinatura ativa. **Clínicas de rede sem assinatura não enxergam o item no menu** (a regra `isNetworkClinicWithoutSubscription` esconde o submenu inteiro de Comunicação). 🚧 PENDENTE: confirmar com produto se há gating adicional por plano dentro de Camila Connects (ex: cota de disparos por mês variando por plano).

**Quem vê e edita o quê dentro da clínica:** o item de menu aparece para todos os usuários da clínica que não estejam em conta de rede sem assinatura. **Quem pode efetivamente criar e disparar campanha dentro da aplicação Camila Connects depende das permissões internas do app embutido**, que não estão visíveis no código do dashboard. 🚧 PENDENTE: confirmar com o time da Camila quais papéis (admin, dentista, recepção) conseguem criar campanha e quais só visualizam.

**Onde se encaixa no produto Capim:** abre embutido dentro do dashboard via iframe, sob a área de **Comunicação**, ao lado de Central de relacionamento (deal pipelines). Conecta com Pacientes (o público alvo sai da base cadastrada), com a Camila (a Camila é quem efetivamente envia e provavelmente cuida das respostas que voltam pelo WhatsApp) e com CaPix (oferta de parcelamento via Pix dentro da mensagem de reativação).

## > 2. ⚙️ Como funciona (passo a passo)

**Pré-requisitos:**

* Clínica com assinatura ativa da Capim. Sem isso, o item "Campanhas" nem aparece no menu.
* Base de pacientes cadastrada com **celular válido**. Sem celular, o paciente não recebe WhatsApp.
* Camila ativa para a clínica. ✅ Validar com produto: até onde sabemos, Camila Connects depende da mesma Camila configurada em Central da Camila, mas isso não está no código do dashboard.

**Onde acessar:**

* Menu lateral → Comunicação → Campanhas.
* URL típica no dashboard: `/communication/camila-connects`.
* O dashboard apenas **carrega a aplicação Camila Connects dentro de um iframe**. A tela em si vem da URL configurada na variável `VITE_CAMILA_CONNECTS_URL` (em produção, `https://camila-comunicativa.capim.com.br`).

**Pontos de entrada além do menu:**

* **Popover de divulgação:** no canto inferior esquerdo do dashboard aparece um card "Pacientes inativos?" com botão "Saiba mais". Quem clica é redirecionado para Campanhas. Dá pra fechar no X e ele não volta naquele navegador (fica salvo em `localStorage`).
* **Modal de divulgação:** abre quando a URL do dashboard tem `?showCamilaConnectsModal=true` (links de campanha interna, e-mail de produto). Mostra os benefícios (Campanhas inteligentes, Personalize cada campanha, Reative mais com CaPix, Disparos via WhatsApp) e o botão "Começar agora" que joga em Campanhas. Também guarda dismiss em `localStorage` por navegador.

**Fluxo típico (criar e disparar campanha):**

A criação acontece **dentro da aplicação embutida** (Camila Connects). O dashboard não tem telas próprias para "Nova campanha em massa", "Selecionar público" ou "Escolher template". O que o time de suporte sabe a partir da comunicação oficial (modal de divulgação) é que o fluxo combina:

1. Camila sugere o público e a mensagem ("campanhas inteligentes").
2. A clínica personaliza ("refine até estar do seu jeito").
3. Camila dispara via WhatsApp ("Você aprova, a Camila dispara").
4. Em campanhas de reativação, a mensagem pode incluir a oferta de **CaPix** (Pix parcelado de R$100 a R$1.000) para facilitar o pagamento e destravar o agendamento.

🚧 PENDENTE: o detalhe operacional de cada passo (telas, campos, ordem) precisa vir do time da Camila. Esta seção é o que o suporte sabe pela vitrine que o dashboard mostra.

**⚠️ Atenção:**

* Como a tela é um **iframe de outro domínio**, qualquer problema visual (tela branca, "não carrega", "ficou preto") pode ser bloqueio de cookies de terceiros, extensão de navegador ou problema na própria aplicação Camila Connects, não no dashboard.
* O dashboard só **abre** a tela. Quem dispara mensagem, mantém histórico, gera métrica e cobra (se cobrar) é o app Camila Connects.
* **Popover e modal de divulgação são por navegador**, não por usuário. Se a clínica trocou de máquina ou limpou cache, o popover volta a aparecer mesmo que alguém já tenha fechado antes.

## > 3. 💼 Casos de uso esperados

* **Caso 1, clínica quer disparar aniversariantes do mês:** a recepção entra em Comunicação → Campanhas, cria a campanha de aniversário dentro da aplicação Camila Connects, aprova a mensagem sugerida pela Camila e dispara. ✅ Validar com produto: este é um caso de uso oficial, mas os campos exatos (seleção do público "aniversariantes", template, data de disparo) precisam ser confirmados pelo time da Camila.
* **Caso 2, paciente sumiu há muito tempo (reativação):** este é o caso de uso "estrela" do produto, repetido na vitrine (popover e modal). A clínica seleciona o público de inativos, a Camila monta a mensagem com oferta de retorno e CaPix, a clínica aprova, a Camila dispara. Quem responder cai numa conversa de WhatsApp com a Camila para fechar o agendamento.
* **Caso 3, comunicado em massa (ex: mudança de endereço, recesso, oferta sazonal):** intenção parecida com os outros casos, mas com mensagem custom. 🚧 PENDENTE: confirmar com produto se Camila Connects permite mensagem 100% livre (sem template aprovado) ou se exige template pré-definido pelo WhatsApp Business.
* **Caso 4, paciente responde a campanha:** a resposta cai no WhatsApp e a Camila assume a conversa, podendo até marcar o paciente direto na Agenda (como qualquer conversa via Central da Camila). ✅ Validar com produto: até onde sabemos, é assim que funciona porque é o mesmo canal e a mesma Camila, mas não há código no dashboard que confirme essa ligação.
* **Caso 5, clínica de rede sem assinatura tenta ver Campanhas:** não vê. O item nem aparece no menu. Se o usuário tem o link direto, a sidebar não destaca, e o conteúdo do iframe pode até carregar (depende do app Camila Connects), mas é fora do fluxo esperado.

## > 4. ❓ FAQ

**P: A clínica diz que clicou em "Campanhas" e ficou tela branca. O que verificar?**

R: Como a tela é um iframe externo, primeiro confirmar (1) que o usuário não está com bloqueador de cookies de terceiros muito agressivo, (2) que não tem extensão tipo AdBlock ou Privacy Badger bloqueando `camila-comunicativa.capim.com.br`, (3) que o navegador é Chrome desktop atualizado. Se persistir, pedir print do console (F12 → aba Console) e escalar.

**P: Quais tipos de campanha existem (aniversário, retorno, sem-vir-há-X-dias, custom)?**

R: 🚧 PENDENTE: a lista oficial de tipos de campanha está dentro da aplicação Camila Connects e não está exposta nos repositórios principais. O que a vitrine do dashboard cita explicitamente é reativação de pacientes inativos. O suporte deve confirmar com o time da Camila a lista completa antes de afirmar para o cliente.

**P: Qual é o público alvo de uma campanha? Vem da minha base de pacientes?**

R: Sim, o público sai da base de Pacientes cadastrada na Capim (mesmo lugar que a Agenda e a Camila consultam). Quais filtros estão disponíveis (data do último atendimento, faixa etária, procedimento, status) é 🚧 PENDENTE confirmar com produto.

**P: A mensagem é livre ou tem que ser um template aprovado pelo WhatsApp?**

R: 🚧 PENDENTE. O WhatsApp Business API exige template aprovado (HSM) para iniciar conversa fora da janela de 24h, então é provável que Camila Connects use templates aprovados ao menos no primeiro contato. Mas o detalhe (quantos templates existem, se a clínica pode submeter novo, prazo de aprovação) não está no código do dashboard e precisa vir do time da Camila.

**P: A clínica paga a mais por campanha disparada? Tem custo de WhatsApp repassado?**

R: 🚧 PENDENTE. O WhatsApp Business API cobra por conversa iniciada por template. Se esse custo está embutido no plano da Capim, é repassado por disparo ou tem cota mensal, **não está documentado no código** e o suporte não deve inventar valor. Subir pra produto/comercial antes de responder ao cliente.

**P: Existe limite de quantas mensagens dá pra disparar por dia ou por hora?**

R: 🚧 PENDENTE. Não há limite codificado no dashboard. Limites técnicos do WhatsApp Business API existem (tier de envio do número, throttling), e a Camila Connects pode aplicar limites próprios. Confirmar com produto antes de afirmar números.

**P: A clínica consegue ver quantas mensagens foram enviadas, entregues, lidas e respondidas?**

R: 🚧 PENDENTE. A tela de métricas mora dentro de Camila Connects, fora do escopo do dashboard. O suporte precisa abrir a aplicação para confirmar quais métricas são expostas. Não prometer "lidas" ou "respondidas" sem ver na tela.

**P: A Camila responde os pacientes que reagem à campanha?**

R: ✅ Validar com produto. A vitrine do produto sugere que sim (mesma Camila, mesmo canal de WhatsApp), e respostas a campanhas tipicamente caem na mesma esteira da Central da Camila. Mas o suporte não deve afirmar como regra fechada antes de bater com o time da Camila.

**P: Quem dentro da clínica pode disparar campanha?**

R: 🚧 PENDENTE. O item de menu "Campanhas" aparece para qualquer usuário em clínica com assinatura ativa, mas as permissões internas de quem cria, aprova e dispara campanha são definidas dentro de Camila Connects, fora do código do dashboard. Confirmar com produto a matriz de permissão.

**P: Apareceu um popover "Pacientes inativos?" no canto da tela. O que é?**

R: É a divulgação de Camila Connects. Aparece para clínicas que ainda não dispensaram o popover naquele navegador. Quem clica em "Saiba mais" vai para a tela de Campanhas. Quem fecha no X não vê mais naquele navegador (o dismiss vale só por navegador, não por usuário nem por clínica). Não é alerta de problema, é convite de uso.

**P: A clínica vê o modal "Reative pacientes com IA!" toda vez que entra. Como tirar?**

R: O modal abre quando a URL contém `?showCamilaConnectsModal=true` (vem de link de campanha interna ou e-mail de produto) e se o navegador ainda não marcou como dispensado. Clicar em "Começar agora" ou fechar dispensa para sempre naquele navegador. Se a clínica está vendo todo dia, alguém pode estar clicando num link recorrente com essa query, ou o navegador está limpando localStorage entre sessões.

**P: A clínica de rede sem assinatura quer usar Campanhas. Dá?**

R: Pela regra atual do menu, não. O grupo Comunicação inteiro (Campanhas e Central de relacionamento) é escondido para conta de rede sem assinatura. Para liberar, precisa virar cliente com assinatura ativa da Capim. Escalar para comercial se o cliente insistir.

## > 5. 🛠️ Resolvendo problemas

| Sintoma (o que o cliente relata) | Causa provável | O que o suporte faz | Quando escalar |
|---|---|---|---|
| "Cliquei em Campanhas e a tela ficou branca / preta." | Iframe não carregou: bloqueio de cookies de terceiros, extensão bloqueando o domínio `camila-comunicativa.capim.com.br`, navegador antigo ou problema na própria aplicação Camila Connects. | Pedir pra desabilitar extensões e tentar em janela anônima do Chrome desktop atualizado. Coletar print do console (F12). | Se reproduz mesmo em anônimo do Chrome limpo, escalar pra Sustentação informando ID da clínica, usuário e print. |
| "Não vejo o item Campanhas no menu." | Conta de rede sem assinatura ativa (regra do menu esconde Comunicação inteira), ou usuário em clínica sem assinatura. | Confirmar com o cliente se a clínica tem assinatura ativa. Se não tiver, encaminhar pro comercial. | Se a clínica tem assinatura e o item não aparece, escalar pra Sustentação com ID da clínica e do usuário. |
| "Disparei a campanha e ninguém recebeu nada." | Pacientes do público sem celular cadastrado, número da clínica do WhatsApp Business com problema, ou erro na fila de envio de Camila Connects. | Pedir pra abrir a tela de métricas da campanha dentro de Camila Connects (enviadas vs falhadas) e print. Validar cadastros dos pacientes-alvo (têm celular?). | Sempre escalar pra Sustentação / time da Camila com ID da campanha e prints. O suporte não consegue ver a fila por dentro. |
| "Aparece o popover de Camila Connects toda vez, mesmo eu fechando." | Dismiss do popover é guardado em `localStorage` por navegador. Se o navegador limpa cache/localStorage entre sessões, volta. Trocou de máquina ou de perfil também volta. | Explicar que é por navegador. Sugerir conferir se há limpeza automática de cookies/localStorage. | Não precisa escalar, é comportamento esperado. |
| "Cliente respondeu a campanha pelo WhatsApp e ninguém viu." | Resposta entrou na Central da Camila e ficou na conversa, mas a clínica não está olhando a Central. Ou a Camila pegou e respondeu sozinha e o usuário não viu. | Orientar a clínica a abrir Central da Camila e procurar pelo paciente / data da resposta. | Se a resposta sumiu mesmo (não está na Central nem foi tratada), escalar pra time da Camila. |
| "Quero saber quanto vou pagar por essa campanha." | Custo de WhatsApp por conversa pode ou não ser repassado, depende do plano. Não está no código do dashboard. | Não inventar valor. Explicar que vai confirmar com o time interno antes de responder. | Sempre escalar pra produto/comercial. 🚧 PENDENTE: definir donos do tema "preço de campanha" para o suporte. |
| "Preciso submeter um template novo de mensagem pro WhatsApp aprovar." | Templates aprovados (HSM) são gerenciados dentro de Camila Connects, possivelmente com fluxo manual via produto. | Anotar o texto pretendido e o caso de uso e abrir solicitação. | Escalar pra time da Camila com o texto pretendido e o contexto. 🚧 PENDENTE: confirmar caminho oficial. |

**Para quem escalar:** **Time de Sustentação** (interno Capim), com encaminhamento posterior para o time do produto Camila quando a issue for específica da aplicação Camila Connects (templates, métricas, fila de envio, preço de campanha). Toda escalação leva ID da clínica, ID do usuário, ID da campanha (quando houver) e prints.

## > 6. ⚠️ Limitações conhecidas

* **A tela de Campanhas é um iframe de outra aplicação** (`camila-comunicativa.capim.com.br`). O suporte não tem visibilidade do que acontece dentro do app a partir do código do dashboard. Para investigar comportamento interno, precisa pedir print pra clínica ou subir pra time da Camila.
* **Sem visibilidade no dashboard sobre o estado da campanha.** Não existe widget no dashboard mostrando "campanha em andamento, X enviadas". Tudo vive dentro do iframe.
* **Popover e modal de divulgação são por navegador.** Não há controle por usuário nem por clínica para reaparecer ou esconder de propósito.
* **Grupo Comunicação inteiro fica escondido para clínica de rede sem assinatura ativa.** Não dá pra liberar só Campanhas; depende da assinatura.
* **Custo, limite de disparo, tempo de aprovação de template, percentual de entrega: nenhum desses números está no código aberto pro suporte.** Não improvisar.
* **Permissões internas de criar/aprovar campanha não estão expostas no dashboard.** O menu aparece pra qualquer usuário em clínica com assinatura; a gating fina, se existe, mora dentro de Camila Connects.

## > 7. 🗺️ Próximos passos [opcional]

* Documentação técnica oficial da aplicação Camila Connects para o suporte (telas, campos, fluxos, métricas). 🚧 PENDENTE: produto Camila.
* Integração visual no dashboard com indicadores de campanha em andamento (ex: card "Última campanha: X enviadas, Y respondidas"). 🚧 PENDENTE: confirmar se está no roadmap.
* Tabela de preço/limite de disparos por plano da Capim, oficial para o suporte. 🚧 PENDENTE: produto/comercial.

## > 8. 🖼️ Telas e fluxos

[INSERIR PRINT: item de menu "Campanhas" sob Comunicação]

[INSERIR PRINT: popover "Pacientes inativos?" no canto inferior do dashboard]

[INSERIR PRINT: modal "Reative pacientes com IA!" com os quatro benefícios]

[INSERIR PRINT: tela de Campanhas carregada no iframe (visão geral da aplicação Camila Connects)]

[INSERIR PRINT: fluxo de criação de campanha dentro de Camila Connects, passo a passo]

[INSERIR PRINT: tela de métricas / acompanhamento de campanha dentro de Camila Connects]

[INSERIR PRINT: oferta CaPix dentro da mensagem de reativação enviada ao paciente]

***

## > 🚧 Lacunas (preencher antes de publicar)

**Visão geral e disponibilidade**
* [ ] Quem é dono oficial da aplicação Camila Connects (`camila-comunicativa.capim.com.br`) para o suporte escalar? Time, canal, SLA.
* [ ] Existe gating por plano dentro de Camila Connects (cota de disparos, recursos premium) além da regra "assinatura ativa"?
* [ ] Matriz de permissões: quem dentro da clínica (admin, dentista, recepção) cria, aprova e dispara campanha?

**Funcionalidade da aplicação embutida**
* [ ] Lista oficial dos tipos de campanha disponíveis (aniversário, retorno, sem-vir-há-X-dias, custom, outros).
* [ ] Filtros disponíveis na seleção de público alvo (último atendimento, faixa etária, procedimento, status do paciente).
* [ ] Mensagem: 100% livre ou só template aprovado? Quantos templates existem? A clínica pode submeter template novo? Quanto demora a aprovação do WhatsApp?
* [ ] Métricas expostas no acompanhamento da campanha: enviadas, entregues, lidas, respondidas, falhadas. Quais existem hoje e quais são planejadas.

**Comercial e operacional**
* [ ] Custo: a clínica paga a mais por campanha disparada? O custo de WhatsApp Business por conversa é repassado? Tem cota mensal por plano?
* [ ] Limites de disparo (por dia, por hora, por mês, por tier do número da clínica no WhatsApp).
* [ ] Como respostas a campanha entram na Central da Camila: a Camila responde sozinha, encaminha pra recepção, registra em algum lugar?

**Operação do suporte**
* [ ] Caminho oficial para o suporte abrir Camila Connects "do lado da clínica" (impersonate, ferramenta interna) para investigar problema.
* [ ] Canal oficial para pedido de novo template de mensagem (texto pretendido, caso de uso, prazo).

## > ✅ Validar com produto/eng antes de publicar

Itens inferidos do código do dashboard, mas que dependem de confirmação oficial do time Camila:

* [ ] "Campanhas (Camila Connects) é uma aplicação embutida via iframe a partir de `VITE_CAMILA_CONNECTS_URL`, hoje `https://camila-comunicativa.capim.com.br`." Confirmado pelo `CamilaConnectsView.vue` e `.env.sample`, vale revalidar a URL de produção atual.
* [ ] "Clínica de rede sem assinatura ativa não enxerga o grupo Comunicação no menu (esconde Campanhas e Central de relacionamento)." Confirmado em `useSidebar.js` via `isNetworkClinicWithoutSubscription(clinicId)`, vale revalidar regra com produto.
* [ ] "O dashboard expõe um popover (`CamilaConnectsPopover`) e um modal (`CamilaConnectsModal`) puramente de divulgação. Ambos guardam dismiss em `localStorage` (por navegador), não por usuário nem por clínica." Confirmado pelo código, vale validar com produto se a regra de reabertura é mesmo só "limpou localStorage".
* [ ] "Camila Connects integra com CaPix para oferta de Pix parcelado dentro da mensagem de reativação." Vem da vitrine do produto (modal de divulgação cita "Reative mais com CaPix, Parcele de R$100 a R$1.000 via Pix"). Mecânica precisa ser validada com produto.
* [ ] "Camila responde no WhatsApp os pacientes que reagem à campanha." Inferência do posicionamento ("Você aprova, a Camila dispara") e do fato de ser a mesma Camila da Central. Não confirmado por código no dashboard.

### Itens já validados pelo código do dashboard (não precisa mais perguntar)

Fact-check feito contra `capim-dash-frontend`, podem ser tratados como confirmados no que diz respeito ao dashboard (não à aplicação Camila Connects em si):

* O dashboard não tem nenhuma tela própria de "criar campanha em massa". A view `CamilaConnectsView.vue` é só um wrapper de iframe.
* O item de menu vive em Comunicação → Campanhas, rota `/communication/camila-connects`.
* Existe popover (`CamilaConnectsPopover`) com dismiss em `localStorage` e modal (`CamilaConnectsModal`) acionável por query string `?showCamilaConnectsModal=true`, também com dismiss em `localStorage`.
* Não existe modelo, controller ou job no `capim-dash-backend` nem no `capim-backend` chamado `camila_connect`, `bulk_message` ou `template_message`. O backend de Camila Connects vive fora desses repositórios.
* O modelo `Campaign` (`capim-dash-backend`) e a view `/campaigns` no dashboard pertencem ao produto **Central de relacionamento** (kanban de leads), não a Camila Connects. São coisas distintas, apesar do nome em código.
