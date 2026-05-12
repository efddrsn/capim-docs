# 🗂️ Resumo geral: 19 guias de suporte da Capim

> Material para o time de suporte da Capim. Compilado em 12/05/2026.

## 1. Lista de guias entregues

| # | Módulo | Arquivo |
|---|---|---|
| 1 | Agenda (piloto, com fact-check completo) | [`guia-suporte-agenda.md`](guia-suporte-agenda.md) |
| 2 | Início (Home/Dashboard) | [`guia-suporte-inicio.md`](guia-suporte-inicio.md) |
| 3 | Pacientes (ficha, abas, financeiro do paciente, documentos) | [`guia-suporte-pacientes.md`](guia-suporte-pacientes.md) |
| 4 | Orçamentos | [`guia-suporte-orcamentos.md`](guia-suporte-orcamentos.md) |
| 5 | Documentos (modelos, geração, assinatura) | [`guia-suporte-documentos.md`](guia-suporte-documentos.md) |
| 6 | Simulador de vendas | [`guia-suporte-simulador-vendas.md`](guia-suporte-simulador-vendas.md) |
| 7 | Financiamento Capim (BNPL) | [`guia-suporte-financiamento-capim.md`](guia-suporte-financiamento-capim.md) |
| 8 | Carnê Capim e Boleto tradicional | [`guia-suporte-carne-boleto.md`](guia-suporte-carne-boleto.md) |
| 9 | Capix (microcrédito) | [`guia-suporte-capix.md`](guia-suporte-capix.md) |
| 10 | Maquininha (POS, credenciamento, recebíveis, antecipação, saque, split) | [`guia-suporte-maquininha.md`](guia-suporte-maquininha.md) |
| 11 | Controle financeiro (entradas, saídas, conciliação, comissões) | [`guia-suporte-controle-financeiro.md`](guia-suporte-controle-financeiro.md) |
| 12 | Campanhas (Camila Connects) | [`guia-suporte-campanhas.md`](guia-suporte-campanhas.md) |
| 13 | Central de Relacionamento (pipeline de faltas e desmarcados) | [`guia-suporte-central-relacionamento.md`](guia-suporte-central-relacionamento.md) |
| 14 | Estoque (controle + solicitação de prótese) | [`guia-suporte-estoque.md`](guia-suporte-estoque.md) |
| 15 | Relatórios | [`guia-suporte-relatorios.md`](guia-suporte-relatorios.md) |
| 16 | Central da Camila (configurações da IA) | [`guia-suporte-central-camila.md`](guia-suporte-central-camila.md) |
| 17 | Configurações da clínica (dados, usuários, procedimentos, migração) | [`guia-suporte-configuracoes-clinica.md`](guia-suporte-configuracoes-clinica.md) |
| 18 | Configurações da agenda (disponibilidade, marcadores, notificações, aniversários) | [`guia-suporte-configuracoes-agenda.md`](guia-suporte-configuracoes-agenda.md) |
| 19 | Agendamento online (link público pra paciente marcar sozinho) | [`guia-suporte-agendamento-online.md`](guia-suporte-agendamento-online.md) |

**Não incluído de propósito:** Portal do paciente (paciente final, fora do escopo de suporte ao dentista), Assinatura/Plano da Capim (lifecycle comercial, separado), Indicações/Member-get-member (drawer pontual), Upvoty (integração externa).

## 2. Top 9 achados surpreendentes (úteis pro suporte saber de cabeça)

1. **Cancelamento e exclusão são destrutivos sem rollback acessível pela UI.** Agenda só recupera via Time de Sustentação (transição AASM `restart`). Orçamentos têm quatro estratégias de exclusão (`full_wipe`, `remove_uncompleted`, `keep_debits_remove_procedures`, `keep_procedures_remove_debits`) e a escolha errada apaga pagamentos já recebidos. Aprovar orçamento é definitivo, sem botão de "voltar pra rascunho".

2. **Notificações ao paciente são exclusivamente por WhatsApp**, horários fixos no backend (1h e 24h antes da consulta, mais 5 tipos de evento). Não tem SMS, não tem e-mail. Há tela de notificações falhadas dos últimos 7 dias com botão de reenviar, mas sem alerta proativo quando uma falha acontece.

3. **Permissões variam radicalmente entre módulos.** Agenda tem gating duro (`show_all_schedules`/`edit_all_schedules`). Pacientes não tem gating por dentista (qualquer um da clínica vê todas as fichas). Financeiro tem três camadas (`financial-control` + `access-financial-control-all` ou `-user`). Maquininha tem quatro permissões granulares. O suporte precisa saber o regime de cada um.

4. **Várias telas que parecem nativas são iframes de Camila ou Metabase.** Campanhas inteiro, Relatórios inteiro (quatro dashboards), Lembretes de aniversário, abas "Em atraso" e "Analytics" do BNPL. Troubleshooting muda: virar problema de embed, DNS ou JWT em vez de bug do dashboard.

5. **Vários fluxos críticos exigem ação manual da clínica e parecem automáticos.** BNPL: clínica precisa clicar "Solicitar pagamento" depois que o paciente assina (não é automático). Agendamento online: sininho do dashboard só dispara em status `confirmed`/`canceled`, e agendamentos do link entram como `pending`, então não avisa. Estoque: alertas só visuais passivos, sem push.

6. **Capix no código é o oposto do briefing comum.** Não é empréstimo para a clínica, é parcelamento via Pix para o paciente (clínica recebe à vista com deságio). Importante alinhar antes do suporte responder.

7. **Central de Relacionamento não é CRM.** São dois pipelines fixos (Faltas e Desmarcados) com cards criados automaticamente quando um agendamento muda para `canceled` ou `attended: false`. Não dá pra criar card manual, não tem campos de valor/origem/responsável, não tem custom stages.

8. **Vários botões "fazem outra coisa".** "Estornar Pix" da Maquininha só registra contato no HubSpot, não estorna. "Adicionar profissional" do split abre URL externa. "Lembretes de aniversário" abre iframe da Camila, não tela nativa. Saque sempre saca o saldo inteiro (input vem desabilitado, backend aceita parcial).

9. **Muitos módulos têm versões em rollout simultaneamente** (Agenda V1 vs V2, BNPL V1 vs V2 unificado, Carnê tradicional vs reforma `PAYMENT_BOOK_REFORM_EXPERIMENT`, microcredits novo, fluxo de migração novo). O suporte precisa identificar qual versão a clínica está vendo pelo URL ou pelo print antes de responder.

## 3. Top 5 perguntas críticas que aparecem em vários guias

Estas perguntas se repetem em três ou mais guias e desbloqueiam o maior número de lacunas se respondidas:

1. **Cronograma de GA de cada feature em rollout**: Agenda V2, BNPL V2, reforma do Carnê, microcredits novo, fluxo de migração novo. Quem é elegível hoje, como o suporte consulta se uma clínica específica está em qual versão.
2. **SLA do Time de Sustentação por nível de severidade.** Aparece em todos os 19 guias.
3. **Processo de engenharia documentado para "desfazer" ações irreversíveis**: agendamento cancelado, orçamento aprovado por engano, prótese deletada, lembrete de aniversário apagado, contrato BNPL no estado errado. Cada guia abre uma lacuna pedindo o mesmo canal.
4. **Mapa de gating por plano comercial**: BNPL, Camila, Campanhas, Carnê CaaS, Capix, Financeiro avançado, Agendamento online. Quem tem direito ao quê no plano X, Y, Z.
5. **Endereço atual oficial das integrações Camila e Metabase** (URLs, dashboards específicos por clínica/rede, fonte oficial pra o suporte conferir saúde). Aparece quando alguma das telas-iframe quebra.

## 4. Sugestão de ordem para validar com produto/eng

Antes de publicar os guias internamente para o suporte, recomendado validar nesta ordem:

1. **Estruturais (resolve várias lacunas de uma vez).** Definir oficialmente: SLA do Time de Sustentação, canal de restore por engenharia, mapa de planos vs features, lista das features ativas em produção. Uma reunião curta com Produto fecha 30% das lacunas de todos os guias.

2. **Financeiro (BNPL, Carnê, Maquininha, Capix, Controle financeiro).** Esses guias têm regras de negócio sensíveis e foram inferidos parcialmente do código. Pedir revisão do squad/PM responsável de financeiro pra garantir que nenhuma afirmação está errada (taxas, prazos, gatilhos automáticos vs manuais, ciclo de vida do contrato, política de cancelamento).

3. **Permissões e papéis em cada módulo.** Pacientes, Agenda, Maquininha, Financeiro. Confirmar oficialmente o regime real (não só o que o frontend mostra; backend pode aplicar restrição diferente).

4. **Status de rollout das versões V2 e experimentos.** Validar com Produto qual versão é canônica hoje em cada módulo (Agenda, BNPL, Carnê, Microcredits, Migração) e como o suporte consulta se uma clínica está em qual.

5. **Prints e telas.** Cada guia tem placeholders `[INSERIR PRINT: …]` na seção 8. Anexar capturas oficiais antes de publicar. Pode rodar via screenshot automatizado em staging, ou pedido manual ao time.

## 5. Total de lacunas

Cada guia tem um bloco `🚧 Lacunas (preencher antes de publicar)` e um bloco `✅ Validar com produto/eng antes de publicar`. Aproximadamente 150 perguntas acumuladas, com forte sobreposição (as 5 críticas da seção anterior aparecem em vários guias).

O app em [capim-docs-production.up.railway.app](https://capim-docs-production.up.railway.app) permite que qualquer membro do time responda lacuna direto na interface, sem editar markdown. Cada resposta cai como issue no GitHub.

## 6. Próximos passos sugeridos

* Triagem das lacunas estruturais com Produto (uma reunião de 30 min resolve várias).
* Anexar prints na seção 8 de cada guia.
* Publicar internamente (Notion) com link de retorno pro app de feedback.
* Estabelecer cadência de manutenção (provavelmente reler cada guia a cada release relevante do módulo).
