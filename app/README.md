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

Criar essas labels antes de subir (ou deixar que apareçam automaticamente quando vier a primeira issue: o GitHub aceita labels novas via API).

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
