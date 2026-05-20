# Capim Docs (app interno)

Visualizador privado dos guias de suporte da Capim, com **feedback inline**, **resposta de lacunas** e **canal de pergunta nova**. Tudo o que vier desses três caminhos cai como **GitHub Issue** no `efddrsn/capim-docs`.

Stack: Node 20 + Express + marked. Auth por senha compartilhada (env var) + sessão por cookie. Sem banco de dados (estado vive em sessão na memória do processo).

## Como rodar localmente

```bash
cd app
cp .env.example .env
# edite .env e preencha APP_PASSWORD, SESSION_SECRET e GITHUB_PAT
npm install
npm start
```

O app sobe em `http://localhost:3000` e lê os markdowns de `../guias/*.md`.

## Como deployar no Railway

1. Crie um projeto no Railway e conecte ao repo `efddrsn/capim-docs`.
2. Em **Settings → Root Directory**, **deixe vazio** (ou `/`). O `railway.json` na raiz já entra em `app/` na hora de buildar e rodar. Se você definir Root Directory = `app`, a pasta `guias/` (que mora na raiz do repo) **não vai pro container** e o app não acha guia nenhum.
3. Em **Variables**, configure (mesmos nomes do `.env.example`):
   * `APP_PASSWORD`: senha que o time vai usar pra entrar.
   * `SESSION_SECRET`: string aleatória forte (use `openssl rand -hex 32`).
   * `GITHUB_PAT`: fine-grained token com `Issues: Read & Write` no `efddrsn/capim-docs`.
   * `PUBLIC_BASE_URL`: a URL pública que o Railway gerar (ex: `https://capim-docs.up.railway.app`). Usada pra validar `Origin` em requisições POST.
   * `NODE_ENV=production`.
4. Em **Settings → Networking**, gere o domínio público (Railway dá um `*.up.railway.app` grátis).
5. O `railway.json` já define `healthcheckPath` em `/healthz`, start em `node server.js` e usa Nixpacks.
6. Faça push: o Railway buildará e subirá.

## O que o app faz

* **/login**: tela de senha. Cookie de sessão com `SameSite=Lax` + `Secure` em produção.
* **/**: lista de guias (cards). Cada card aponta pra `/guia/:slug`.
* **/guia/:slug**: renderiza o markdown do guia. Cada heading ganha:
  * Anchor `#id` pra deep-linking.
  * Botão 💬 que abre modal de **feedback** (vira issue `feedback`, `guia:<slug>`).
* **/lacunas**: painel com todas as lacunas extraídas dos guias (linhas `* [ ] ...` dentro da seção `## > 🚧 Lacunas`). Cada uma tem botão **Responder** que abre modal e cria issue `lacuna`, `guia:<slug>`.
* **Mandar pergunta** (botão fixo no topo): modal pra pergunta nova. Cria issue `pergunta-saas`.
* **/healthz**: GET sem auth, devolve `{ ok: true, guides: N }`.

## Labels que serão criadas no GitHub

* `feedback` (comentário em trecho do guia)
* `lacuna` (resposta a uma lacuna em aberto)
* `pergunta-saas` (pergunta nova do time)
* `guia:<slug>` (ex: `guia:agenda`)
* `via:claude` (issue criada via endpoint MCP — pra diferenciar do que vem do app web)

Criar essas labels antes de subir (ou deixar que apareçam automaticamente quando vier a primeira issue: o GitHub aceita labels novas via API).

## MCP endpoint

Além do app web, o mesmo processo Express expõe um endpoint **MCP HTTP** (`Streamable HTTP`, modo stateless) em **`POST /mcp`**, pra que o Claude dos colegas (via Custom Connector no Claude Teams) consuma os guias como contexto e use as features de feedback sem ninguém precisar abrir o app.

### Tools expostas (descriptions em pt-BR no schema)

Leitura:

* `list_guides()` — lista slug, title e headings (índice) de todos os guias.
* `read_guide({ slug })` — markdown completo de um guia.
* `list_lacunas({ slug? })` — lacunas em aberto (agregadas ou de um guia).

Escrita (cada uma cria uma Issue no `efddrsn/capim-docs`):

* `submit_feedback({ slug, section?, comment, author })` — labels: `feedback`, `guia:<slug>`, `via:claude`.
* `respond_lacuna({ slug, lacuna_text, response, author })` — labels: `lacuna`, `guia:<slug>`, `via:claude`.
* `ask_question({ question, author })` — labels: `pergunta-saas`, `via:claude`.

`author` é **obrigatório** em todas as tools de escrita. O footer de cada issue inclui `Autor: {author}\nOrigem: Claude MCP`. As descriptions das tools de escrita instruem explicitamente o Claude a mostrar preview da issue (título, corpo, labels) e pedir confirmação antes de chamar.

### Autenticação

Header `Authorization: Bearer <MCP_BEARER_TOKEN>`. Sem o header (ou com token errado), o `/mcp` devolve **401**. O `/mcp/health` também exige bearer (devolve `{ ok, guides, tools }`).

Token compartilhado é OK pra MVP — atribuição/identidade vai pelo campo `author` em cada chamada. Gere o token com:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

E configure como `MCP_BEARER_TOKEN` no `.env` local e nas Variables do Railway.

### URL pública

```
${PUBLIC_BASE_URL}/mcp
```

Em produção, algo como `https://capim-docs.up.railway.app/mcp`.

### Como adicionar como Custom Connector no Claude Teams

> Apenas admins do workspace conseguem adicionar. Depois de adicionado, o connector aparece automaticamente pros membros do workspace.

1. No Claude (claude.ai), entrar em **Settings** (canto inferior esquerdo, no menu do nome).
2. Aba **Connectors** (ou **Integrations**, dependendo da versão da UI).
3. Clicar em **Add custom connector**.
4. Preencher:
   * **Name**: `Capim Docs`
   * **URL**: `https://<seu-domínio-railway>/mcp`
   * **Auth**: escolher **Bearer token** e colar o valor de `MCP_BEARER_TOKEN`.
5. Salvar. O Claude vai chamar `tools/list` automaticamente e mostrar as 6 tools.
6. (Opcional) Habilitar pro workspace inteiro pra que todo mundo do time veja o connector.

A partir daí, qualquer membro do workspace pode falar com o Claude em pt-BR pedindo coisas como "como funciona a Agenda?", "lista as lacunas em aberto do Estoque", "manda esse feedback aqui pro guia X" — o Claude pede confirmação antes de criar issue.

### O que o MCP **não** consegue fazer (por design)

O `GITHUB_PAT` usado pelo app (e portanto pelo MCP, já que ambos compartilham o token) é **fine-grained**, com escopo **apenas em `efddrsn/capim-docs`** e permissão **`Issues: Read & Write`** — nada mais. Mesmo se um colega tentar usar o Claude pra:

* commitar arquivo no repo,
* criar branch,
* abrir PR,
* mexer em workflow / Actions,
* ler ou escrever em outro repo,

a chamada à API do GitHub vai falhar com 403/404 porque o PAT não tem escopo pra nada disso. E não há código no app/MCP que tente fazer essas operações — o único caminho de escrita exposto é `POST /repos/.../issues`.

### Testar local

```bash
# health
curl -i -H "Authorization: Bearer $MCP_BEARER_TOKEN" http://localhost:3000/mcp/health

# tools/list
curl -i -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $MCP_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/list","id":1}'

# tools/call
curl -i -X POST http://localhost:3000/mcp \
  -H "Authorization: Bearer $MCP_BEARER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","method":"tools/call","id":2,"params":{"name":"list_guides","arguments":{}}}'
```

## Adicionando guias novos

Basta colocar um arquivo `guias/guia-suporte-<slug>.md` na raiz do repo e fazer redeploy (ou esperar o Railway redeployar no próximo push). O app lista dinamicamente todos os `.md` em `guias/`.

## Segurança

* Senha compartilhada é a barreira mínima. Pra algo mais sério (rotação, audit log, MFA) considerar trocar por SSO (Google Workspace etc).
* Sessões vivem em memória do processo. Restart do Railway desloga todo mundo. Tudo bem pra MVP; pra evoluir, plugar `connect-redis` ou `connect-sqlite3`.
* `PUBLIC_BASE_URL` ativa um guard de Origin nos POSTs pra evitar CSRF de outras origens. Configure depois de gerar o domínio público.
* `GITHUB_PAT` deve ser **fine-grained**, com escopo apenas em `efddrsn/capim-docs` e permissão **só de Issues (Read & Write)**. Sem `repo` cheio.
* O PAT que apareceu nos logs JSONL desta sessão Claude Code deve ser **revogado** assim que o novo (fine-grained, mínimo) entrar em uso.

## Limitações conhecidas

* Renderização server-side: cada request lê os `.md` do disco. Pra escala alta, dá pra cachear; pra dezenas de leituras por dia, irrelevante.
* Sem editor: pra editar o guia, alguém abre PR no repo. O app só lê.
* Sem histórico de quem deu feedback: o cookie só sabe "está logado", não "é o fulano". Por isso o campo "seu nome" no modal é livre.
