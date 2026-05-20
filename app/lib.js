// Helpers compartilhados entre o app web (server.js) e o endpoint MCP (mcp.js).
// Tudo que mexe com leitura dos guias do filesystem ou criação de Issue no
// GitHub mora aqui pra que o MCP reuse exatamente a mesma lógica do app web.

const fs = require('fs');
const path = require('path');

const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_OWNER = process.env.GITHUB_OWNER || 'efddrsn';
const GITHUB_REPO = process.env.GITHUB_REPO || 'capim-docs';
const GUIAS_DIR = path.resolve(__dirname, process.env.GUIAS_DIR || '../guias');

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
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
      const title = titleMatch
        ? titleMatch[1].replace(/^[^\p{L}\p{N}]*\s*/u, '').trim()
        : slug;
      return { slug, file, title, raw };
    });
}

function findGuide(slug) {
  return listGuides().find((g) => g.slug === slug);
}

// Mesma lógica de extração de headings que o renderer do marked usa em server.js
// pra montar anchor ids — replicada aqui em formato puramente textual pra expor
// o índice (H2/H3) via MCP sem ter que renderizar HTML.
function extractHeadings(raw) {
  const headings = [];
  let counter = 0;
  const lines = raw.split('\n');
  let inCodeFence = false;
  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeFence = !inCodeFence;
      continue;
    }
    if (inCodeFence) continue;
    const m = line.match(/^(#{2,3})\s+(.+?)\s*#*\s*$/);
    if (!m) continue;
    const text = m[2].replace(/^>?\s*/, '').trim();
    const id = slugify(text) || `s-${++counter}`;
    headings.push({ id, text, level: m[1].length });
  }
  return headings;
}

// Mesma lógica do extractLacunas que server.js usa pra renderizar /lacunas e
// o painel inline no /guia/:slug. Aqui também devolvemos line_number pra o MCP.
function extractLacunas(guide) {
  const lines = guide.raw.split('\n');
  const out = [];
  let inSection = false;
  let currentSubsection = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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
        line_number: i + 1,
      });
    }
  }
  return out;
}

async function createIssue({ title, body, labels }) {
  if (!GITHUB_PAT) throw new Error('GITHUB_PAT não configurado');
  const res = await fetch(
    `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/issues`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${GITHUB_PAT}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'capim-docs-app',
      },
      body: JSON.stringify({ title, body, labels }),
    }
  );
  if (!res.ok) {
    const txt = await res.text();
    const err = new Error(`GitHub API ${res.status}: ${txt}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

module.exports = {
  GUIAS_DIR,
  GITHUB_OWNER,
  GITHUB_REPO,
  slugify,
  listGuides,
  findGuide,
  extractHeadings,
  extractLacunas,
  createIssue,
};
