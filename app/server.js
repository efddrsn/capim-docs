const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const { marked } = require('marked');

const PORT = process.env.PORT || 3000;
const APP_PASSWORD = process.env.APP_PASSWORD;
const SESSION_SECRET = process.env.SESSION_SECRET;
const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'efddrsn';
const GITHUB_REPO = process.env.GITHUB_REPO || 'capim-docs';
const GUIAS_DIR = path.resolve(__dirname, process.env.GUIAS_DIR || '../guias');
const PUBLIC_BASE_URL = process.env.PUBLIC_BASE_URL || '';

for (const [k, v] of Object.entries({ APP_PASSWORD, SESSION_SECRET, GITHUB_PAT })) {
  if (!v) {
    console.error(`[fatal] env var ${k} ausente. Configure no Railway antes de subir.`);
    process.exit(1);
  }
}

const app = express();
app.set('trust proxy', 1);
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/static', express.static(path.join(__dirname, 'public')));
app.use(
  session({
    name: 'capim_docs_sid',
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 30,
    },
  })
);

function requireAuth(req, res, next) {
  if (req.session && req.session.authed) return next();
  if (req.accepts('html')) return res.redirect(`/login?next=${encodeURIComponent(req.originalUrl)}`);
  return res.status(401).json({ error: 'unauthenticated' });
}

function sameOriginGuard(req, res, next) {
  if (!PUBLIC_BASE_URL) return next();
  const origin = req.get('Origin') || req.get('Referer') || '';
  if (origin.startsWith(PUBLIC_BASE_URL)) return next();
  return res.status(403).json({ error: 'bad origin' });
}

function listGuides() {
  if (!fs.existsSync(GUIAS_DIR)) return [];
  return fs
    .readdirSync(GUIAS_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .map((file) => {
      const slug = file.replace(/^guia-suporte-/, '').replace(/\.md$/, '');
      const raw = fs.readFileSync(path.join(GUIAS_DIR, file), 'utf8');
      const titleMatch = raw.match(/^#\s+(.+)$/m);
      const title = titleMatch ? titleMatch[1].replace(/^[^\p{L}\p{N}]*\s*/u, '').trim() : slug;
      return { slug, file, title, raw };
    });
}

function findGuide(slug) {
  return listGuides().find((g) => g.slug === slug);
}

function slugify(text) {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}

function buildMarkedRenderer() {
  const renderer = new marked.Renderer();
  let headingCounter = 0;
  renderer.heading = (token) => {
    const level = token.depth;
    const text = token.text;
    const html = marked.parseInline(text);
    const id = slugify(text) || `s-${++headingCounter}`;
    const trecho = text.replace(/[#`>*_]/g, '').trim();
    return `<h${level} id="${id}" data-section-id="${id}" class="doc-heading">
      <a class="anchor-link" href="#${id}" aria-label="link permanente">#</a>
      <span class="heading-text">${html}</span>
      <button class="feedback-btn" data-section="${id}" data-trecho="${escapeAttr(trecho)}" title="Sugerir correção ou comentar este trecho">💬</button>
    </h${level}>
`;
  };
  return renderer;
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractLacunas(guide) {
  const lines = guide.raw.split('\n');
  const out = [];
  let inSection = false;
  let currentSubsection = null;
  for (const line of lines) {
    const headingMatch = line.match(/^##\s*>?\s*(.+)$/);
    if (headingMatch) {
      const heading = headingMatch[1].trim();
      if (/🚧/.test(heading) && /lacunas/i.test(heading)) {
        inSection = true;
        currentSubsection = null;
        continue;
      }
      if (inSection) break;
    }
    if (!inSection) continue;
    const subMatch = line.match(/^\*\*(.+?)\*\*\s*$/);
    if (subMatch) {
      currentSubsection = subMatch[1].trim();
      continue;
    }
    const bulletMatch = line.match(/^\s*\*\s*\[\s\]\s*(.+)$/);
    if (bulletMatch) {
      const question = bulletMatch[1].trim();
      out.push({
        id: slugify(question).slice(0, 60) + '-' + (out.length + 1),
        question,
        subsection: currentSubsection,
        guide: guide.slug,
        guideTitle: guide.title,
      });
    }
  }
  return out;
}

function renderGuideLacunas(lacunas) {
  if (!lacunas.length) return '';
  const grouped = {};
  for (const l of lacunas) {
    const key = l.subsection || 'Geral';
    (grouped[key] ||= []).push(l);
  }
  const groups = Object.entries(grouped)
    .map(
      ([title, items]) => `
      <div class="lacuna-subgroup">
        <h3>${escapeHtml(title)}</h3>
        <ul class="lacuna-list">
          ${items
            .map(
              (l) => `
            <li class="lacuna-item" data-id="${escapeAttr(l.id)}">
              <div class="lacuna-question">${escapeHtml(l.question)}</div>
              <button class="answer-btn" data-guide="${escapeAttr(l.guide)}" data-question="${escapeAttr(l.question)}">Responder</button>
            </li>`
            )
            .join('')}
        </ul>
      </div>`
    )
    .join('');
  return `
    <section class="guide-section guide-lacunas">
      <h2>🚧 Lacunas em aberto deste guia</h2>
      <p class="lead">Perguntas que ainda dependem de validação humana. Responda o que souber e vira issue no GitHub pra atualizar este guia.</p>
      ${groups}
    </section>
  `;
}

function renderGuideAskBox(guide) {
  return `
    <section class="guide-section guide-ask">
      <h2>＋ Mandar pergunta sobre ${escapeHtml(guide.title)}</h2>
      <p class="lead">Outra dúvida sobre essa feature? Mande pra cá: vira issue no GitHub, e nós avaliamos se atualiza este guia ou se entra como FAQ.</p>
      <button class="ask-btn primary-action" data-topic="${escapeAttr(guide.title)}">Abrir formulário</button>
    </section>
  `;
}

async function createIssue({ title, body, labels }) {
  const res = await fetch(`https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${GITHUB_PAT}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'capim-docs-app',
    },
    body: JSON.stringify({ title, body, labels }),
  });
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`GitHub API ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function renderPage({ title, body, user, navActive }) {
  const guides = listGuides();
  const navHtml = guides
    .map(
      (g) =>
        `<a class="${navActive === g.slug ? 'active' : ''}" href="/guia/${g.slug}">${escapeHtml(g.title)}</a>`
    )
    .join('');
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} · Capim Docs</title>
  <link rel="stylesheet" href="/static/style.css" />
</head>
<body>
  <header class="top">
    <a class="brand" href="/">📘 Capim Docs</a>
    <nav class="top-nav">
      <a href="/" class="${navActive === 'home' ? 'active' : ''}">Início</a>
    </nav>
    <div class="who">${user ? `<span class="badge">logado</span> <a href="/logout">sair</a>` : ''}</div>
  </header>
  <div class="layout">
    <aside class="side">
      <h3>Guias</h3>
      <nav class="side-nav">${navHtml || '<em>nenhum guia ainda</em>'}</nav>
    </aside>
    <main class="content">${body}</main>
  </div>
  <div id="modal-root"></div>
  <script>window.CAPIM = ${JSON.stringify({ csrf: '' })};</script>
  <script src="/static/app.js"></script>
</body>
</html>`;
}

app.get('/login', (req, res) => {
  if (req.session && req.session.authed) return res.redirect('/');
  const next = req.query.next || '/';
  const error = req.query.error ? '<p class="error">Senha incorreta.</p>' : '';
  res.send(`<!DOCTYPE html>
<html lang="pt-BR"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Entrar · Capim Docs</title>
<link rel="stylesheet" href="/static/style.css"/>
</head><body class="login-page">
<form method="post" action="/login" class="login-card">
  <h1>📘 Capim Docs</h1>
  <p>Acesso restrito ao time. Use a senha compartilhada.</p>
  ${error}
  <input type="password" name="password" placeholder="Senha" autofocus required />
  <input type="hidden" name="next" value="${escapeAttr(next)}"/>
  <button type="submit">Entrar</button>
</form>
</body></html>`);
});

app.post('/login', (req, res) => {
  const { password, next } = req.body;
  if (password && password === APP_PASSWORD) {
    req.session.authed = true;
    req.session.loginAt = Date.now();
    return res.redirect(next && next.startsWith('/') ? next : '/');
  }
  return res.redirect(`/login?error=1&next=${encodeURIComponent(next || '/')}`);
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

app.get('/', requireAuth, (req, res) => {
  const guides = listGuides();
  const cards = guides
    .map(
      (g) => `
    <a class="card" href="/guia/${g.slug}">
      <h3>${escapeHtml(g.title)}</h3>
      <p>Guia de suporte. Última atualização do arquivo: ${new Date(
        fs.statSync(path.join(GUIAS_DIR, g.file)).mtime
      ).toLocaleString('pt-BR')}.</p>
    </a>`
    )
    .join('');
  const body = `
    <h1>Guias de suporte</h1>
    <p class="lead">Material interno para o time de suporte/CS da Capim. Cada guia descreve um módulo do produto, com FAQ, troubleshooting e lacunas em aberto. Você pode comentar trechos, responder lacunas ou mandar uma pergunta nova.</p>
    <div class="cards">${cards || '<em>Nenhum guia ainda.</em>'}</div>
  `;
  res.send(renderPage({ title: 'Guias', body, user: true, navActive: 'home' }));
});

app.get('/guia/:slug', requireAuth, (req, res) => {
  const guide = findGuide(req.params.slug);
  if (!guide) return res.status(404).send(renderPage({ title: 'Não encontrado', body: '<h1>Guia não encontrado</h1>', user: true }));
  const renderer = buildMarkedRenderer();
  const html = marked.parse(guide.raw, { renderer, gfm: true, breaks: false });
  const lacunas = extractLacunas(guide);
  const body = `
    <article class="doc" data-guide="${escapeAttr(guide.slug)}" data-guide-title="${escapeAttr(guide.title)}">
      <div class="doc-actions">
        <a class="back" href="/">← voltar</a>
      </div>
      <div class="doc-body">${html}</div>
      <hr class="end-divider"/>
      ${renderGuideLacunas(lacunas)}
      ${renderGuideAskBox(guide)}
    </article>
  `;
  res.send(renderPage({ title: guide.title, body, user: true, navActive: guide.slug }));
});

app.get('/lacunas', requireAuth, (req, res) => {
  const guides = listGuides();
  const allLacunas = [];
  for (const g of guides) allLacunas.push(...extractLacunas(g));
  const grouped = {};
  for (const l of allLacunas) {
    const key = `${l.guideTitle}${l.subsection ? ' · ' + l.subsection : ''}`;
    (grouped[key] ||= []).push(l);
  }
  const groups = Object.entries(grouped)
    .map(
      ([title, items]) => `
      <section class="lacuna-group">
        <h2>${escapeHtml(title)}</h2>
        <ul class="lacuna-list">
          ${items
            .map(
              (l) => `
            <li class="lacuna-item" data-id="${escapeAttr(l.id)}">
              <div class="lacuna-question">${escapeHtml(l.question)}</div>
              <button class="answer-btn" data-guide="${escapeAttr(l.guide)}" data-question="${escapeAttr(l.question)}">Responder</button>
            </li>`
            )
            .join('')}
        </ul>
      </section>
    `
    )
    .join('');
  const body = `
    <h1>Lacunas em aberto</h1>
    <p class="lead">Perguntas que ficaram em aberto nos guias e dependem de validação com produto/eng/operação para fechar. Responda o que souber e o backend cria uma issue no GitHub com sua resposta.</p>
    ${groups || '<em>Nenhuma lacuna registrada.</em>'}
  `;
  res.send(renderPage({ title: 'Lacunas', body, user: true, navActive: 'lacunas' }));
});

app.post('/api/feedback', requireAuth, sameOriginGuard, async (req, res) => {
  try {
    const { guide, section, trecho, comment, author } = req.body || {};
    if (!guide || !comment) return res.status(400).json({ error: 'guide e comment são obrigatórios' });
    const title = `[${guide}] feedback em "${(trecho || section || '').slice(0, 60)}"`;
    const body =
      `**Guia:** \`guias/guia-suporte-${guide}.md\`\n` +
      (section ? `**Seção:** \`#${section}\`\n` : '') +
      (trecho ? `**Trecho:** ${trecho}\n` : '') +
      (author ? `**De:** ${author}\n` : '') +
      `\n---\n\n${comment}\n`;
    const issue = await createIssue({ title, body, labels: ['feedback', 'guia:' + guide] });
    res.json({ ok: true, url: issue.html_url, number: issue.number });
  } catch (err) {
    console.error('feedback fail', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/lacuna', requireAuth, sameOriginGuard, async (req, res) => {
  try {
    const { guide, question, answer, author } = req.body || {};
    if (!guide || !question || !answer) return res.status(400).json({ error: 'guide, question e answer são obrigatórios' });
    const title = `[${guide}] resposta de lacuna: ${question.slice(0, 60)}`;
    const body =
      `**Guia:** \`guias/guia-suporte-${guide}.md\`\n` +
      `**Pergunta em aberto:** ${question}\n` +
      (author ? `**Respondido por:** ${author}\n` : '') +
      `\n---\n\n${answer}\n\n_Quando aplicar no guia, marcar a lacuna como resolvida._`;
    const issue = await createIssue({ title, body, labels: ['lacuna', 'guia:' + guide] });
    res.json({ ok: true, url: issue.html_url, number: issue.number });
  } catch (err) {
    console.error('lacuna fail', err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/pergunta', requireAuth, sameOriginGuard, async (req, res) => {
  try {
    const { topic, question, author } = req.body || {};
    if (!question) return res.status(400).json({ error: 'question é obrigatório' });
    const title = `[pergunta nova] ${question.slice(0, 80)}`;
    const body =
      (topic ? `**Tópico/módulo:** ${topic}\n` : '') +
      (author ? `**De:** ${author}\n` : '') +
      `\n---\n\n${question}\n\n_Avaliar se vira FAQ no guia correspondente ou guia novo._`;
    const issue = await createIssue({ title, body, labels: ['pergunta-saas'] });
    res.json({ ok: true, url: issue.html_url, number: issue.number });
  } catch (err) {
    console.error('pergunta fail', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/healthz', (req, res) => res.json({ ok: true, guides: listGuides().length }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

app.use((err, req, res, next) => {
  console.error('unhandled', err);
  res.status(500).send('erro interno');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`capim-docs app ouvindo em 0.0.0.0:${PORT}`);
  console.log(`guias dir: ${GUIAS_DIR}`);
  console.log(`guias encontrados: ${listGuides().length}`);
});
