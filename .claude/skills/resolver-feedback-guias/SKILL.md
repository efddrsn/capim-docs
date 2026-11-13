---
name: resolver-feedback-guias
description: Use para resolver as issues do efddrsn/capim-docs (labels feedback, lacuna, pergunta-saas) enviadas pelo app de guias de suporte, ou para qualquer criação ou edição em guias/. Exige o código do capimbr/capim-dash-frontend antes de mexer em qualquer guia.
---

# Resolver feedback dos guias de suporte (capim-docs)

Complementa a skill `gerador-docs-v1` (estrutura e estilo dos guias). Esta skill cobre o ciclo depois da publicação: o time manda feedback pelo app, que vira GitHub Issue, e nós atualizamos o guia.

## Onde roda

* Live: Railway, projeto `friendly-light`, serviço `capim-docs` (capim-docs-production.up.railway.app). Não está no capisce.
* Deploy automático a partir de `claude/document-saas-skill-etjsC` (branch default). Só entra no ar o que for mergeado nele.

## Passo 0: portão do front (obrigatório, sem exceção)

Antes de ler issue para editar, antes de delegar, antes de qualquer escrita em `guias/`:

1. `check_repo_access` em `capimbr/capim-dash-frontend`.
2. `add_repo` (read) e o clone que ele indicar. Fora da nuvem: procurar clone local ou `gh repo clone`.
3. Se o clone não estiver disponível, **pare e avise o usuário** com o erro exato e o caminho de correção (reconectar GitHub, ou um admin da org `capimbr` incluir o repo no Claude GitHub App). Não siga só com o texto das issues, nem "parcialmente".
4. Se o clone ficou fora dos caminhos padrão, grave o path em `.claude/frontend-path` (uma linha) ou exporte `CAPIM_FRONTEND_PATH`.

O hook `.claude/hooks/exigir-frontend.py` bloqueia qualquer escrita em `guias/` (Edit, Write e Bash com sed, redirecionamento etc.) enquanto não houver clone do front, inclusive em subagentes. Se ele bloquear, a resposta certa é parar e avisar, nunca contornar.

## Regra de conteúdo: só o que o front expõe

O guia descreve o que a clínica vê e faz na tela. Portanto:

* **Não documentar feature, botão, filtro, status ou fluxo que não existe no front**, mesmo que exista no backend, em flag interna ou em endpoint. Nada de "o backend até permite..." ou "existe um endpoint que...".
* Se a capacidade só existe internamente, o guia diz apenas o que a clínica não consegue fazer e para quem escalar.
* Nomes de flag, endpoint, variável de ambiente ou campo de banco não entram no texto para o suporte. Se forem úteis para escalar, vão para a seção "✅ Validar com produto/eng".
* Ao revisar um guia por qualquer motivo, remover menções desse tipo que encontrar.

## Fluxo

1. Passo 0 (portão do front).
2. Listar issues abertas. Fechar como `not_planned` as de teste (texto sem sentido).
3. Agrupar por guia (label `guia:<slug>`). Para cada issue, **conferir no código do front** o que ela afirma (tela, botão, status, texto de UI). Se a resposta humana e o código divergirem, aplicar o que a tela mostra hoje e registrar a divergência em "✅ Validar com produto/eng" citando a issue. Regra de negócio que o front não mostra (política, prazo, time dono) vale como a pessoa respondeu.
4. Editar `guias/guia-suporte-<slug>.md` com as regras de estilo da `gerador-docs-v1` e atualizar "Atualizado em".
   * Lacuna respondida: `* [x] pergunta ✅ resposta (Nome, #N)` e propagar no corpo, removendo os 🚧 correspondentes. `[x]` sai do painel /lacunas.
   * Resposta inconclusiva: manter `[ ]` e acrescentar a informação parcial.
   * Feedback: corrigir o trecho e todas as repetições da mesma informação no guia.
   * Pergunta nova (`pergunta-saas`): incorporar onde couber (FAQ, corpo, Próximos passos), conferindo no front se já existe.
   * Pedido de produto, que não é correção: não mexe no guia. Reportar ao usuário.
   * Toda inferência própria vai para "✅ Validar com produto/eng".
5. Subagentes: só depois do Passo 0 passar. Repasse no prompt o path do clone do front, a regra de conteúdo e a ordem de parar se algo falhar.
6. Checagem final: varrer o diff atrás de dashes estilísticos e de menções a backend, endpoint ou flag.
7. Commit, push e PR para `claude/document-saas-skill-etjsC` com `Closes #N` por issue resolvida. O merge publica, então só fazer com o ok do usuário.
8. Atualizar a nota `capim-docs` no vault Contexto vivo se o processo mudar.
