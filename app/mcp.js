// Endpoint MCP HTTP exposto no mesmo processo Express do app web.
// Modo stateless: cada request HTTP cria um McpServer + StreamableHTTPServerTransport
// novos, sem manter sessão entre chamadas. Identidade do autor vem pelo campo
// `author` das tools de escrita; auth do transport vem por bearer token.
//
// O escopo do GITHUB_PAT é fine-grained, "Issues: Read & Write" apenas. As tools
// só leem do filesystem (../guias/) e criam Issue via API do GitHub. Não há
// caminho de código aqui que toque em conteúdo de repo, branches ou PRs.

const express = require('express');
const {
  listGuides,
  findGuide,
  extractHeadings,
  extractLacunas,
  createIssue,
} = require('./lib');

const MCP_BEARER_TOKEN = process.env.MCP_BEARER_TOKEN;
const TOOL_COUNT = 6;

function bearerAuth(req, res, next) {
  if (!MCP_BEARER_TOKEN) {
    return res
      .status(503)
      .json({ error: 'MCP_BEARER_TOKEN não configurado no servidor' });
  }
  const header = req.get('Authorization') || '';
  const m = header.match(/^Bearer\s+(.+)$/i);
  if (!m || m[1] !== MCP_BEARER_TOKEN) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

function trimTitle(text, max = 80) {
  const clean = String(text).replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  return clean.slice(0, max - 1) + '…';
}

function authorFooter(author) {
  return `\n\n---\nAutor: ${author}\nOrigem: Claude MCP`;
}

// Carrega o SDK (ESM-only) via import dinâmico e retorna um factory que cria
// um McpServer já com todas as tools registradas. Chamado uma vez no boot.
async function buildMcpFactory() {
  const { McpServer } = await import('@modelcontextprotocol/sdk/server/mcp.js');
  const { StreamableHTTPServerTransport } = await import(
    '@modelcontextprotocol/sdk/server/streamableHttp.js'
  );
  const { z } = await import('zod');

  function createServer() {
    const server = new McpServer(
      { name: 'capim-docs-mcp', version: '0.1.0' },
      {
        capabilities: { tools: {} },
        instructions:
          'Servidor MCP dos guias de suporte da Capim. Use list_guides + read_guide pra trazer contexto. Pra escrever (submit_feedback, respond_lacuna, ask_question), sempre mostre preview ao usuário e peça confirmação antes de chamar.',
      }
    );

    server.registerTool(
      'list_guides',
      {
        title: 'Listar guias',
        description:
          'Lista todos os guias de suporte disponíveis. Retorna slug, title e headings (índice de H2/H3 com ids de anchor) de cada guia. Use isso primeiro pra descobrir qual guia ler ou pra qual guia mandar feedback.',
        inputSchema: {},
      },
      async () => {
        const guides = listGuides().map((g) => ({
          slug: g.slug,
          title: g.title,
          headings: extractHeadings(g.raw).map((h) => ({
            id: h.id,
            text: h.text,
          })),
        }));
        return {
          content: [{ type: 'text', text: JSON.stringify(guides, null, 2) }],
        };
      }
    );

    server.registerTool(
      'read_guide',
      {
        title: 'Ler guia',
        description:
          'Retorna o markdown completo de um guia. Parâmetro `slug` é o identificador do guia (ex: "agenda", "estoque"). Use list_guides antes pra descobrir os slugs disponíveis.',
        inputSchema: { slug: z.string().min(1) },
      },
      async ({ slug }) => {
        const guide = findGuide(slug);
        if (!guide) {
          return {
            isError: true,
            content: [
              { type: 'text', text: `Guia não encontrado: ${slug}` },
            ],
          };
        }
        return { content: [{ type: 'text', text: guide.raw }] };
      }
    );

    server.registerTool(
      'list_lacunas',
      {
        title: 'Listar lacunas em aberto',
        description:
          'Lista as lacunas em aberto (linhas `* [ ] ...` dentro da seção "🚧 Lacunas" de cada guia). Sem `slug`, agrega todos os guias; com `slug`, traz só desse guia. Retorna lista de { slug, lacuna_text, line_number }.',
        inputSchema: { slug: z.string().min(1).optional() },
      },
      async ({ slug }) => {
        const guides = slug ? [findGuide(slug)].filter(Boolean) : listGuides();
        if (slug && guides.length === 0) {
          return {
            isError: true,
            content: [
              { type: 'text', text: `Guia não encontrado: ${slug}` },
            ],
          };
        }
        const out = [];
        for (const g of guides) {
          for (const l of extractLacunas(g)) {
            out.push({
              slug: g.slug,
              lacuna_text: l.question,
              line_number: l.line_number,
            });
          }
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(out, null, 2) }],
        };
      }
    );

    server.registerTool(
      'submit_feedback',
      {
        title: 'Enviar feedback sobre trecho do guia',
        description:
          'Cria uma Issue no GitHub com feedback sobre um trecho específico de um guia. Antes de chamar esta tool, mostre ao usuário um preview do que será submetido como Issue no GitHub (título, corpo, labels) e peça confirmação. Não chame sem confirmação explícita. Parâmetros: `slug` (obrigatório, identificador do guia), `section` (opcional, anchor id da seção, ex: "como-funciona-passo-a-passo"), `comment` (obrigatório, texto do feedback), `author` (obrigatório, quem está mandando — pergunte ao usuário se ainda não souber).',
        inputSchema: {
          slug: z.string().min(1),
          section: z.string().optional(),
          comment: z.string().min(1),
          author: z.string().min(1),
        },
      },
      async ({ slug, section, comment, author }) => {
        const guide = findGuide(slug);
        if (!guide) {
          return {
            isError: true,
            content: [
              { type: 'text', text: `Guia não encontrado: ${slug}` },
            ],
          };
        }
        const summary = trimTitle(comment);
        const title = `[feedback] ${slug}: ${summary}`;
        const body =
          `**Guia:** \`guias/guia-suporte-${slug}.md\`\n` +
          (section ? `**Seção:** \`#${section}\`\n` : '') +
          `\n---\n\n${comment}` +
          authorFooter(author);
        const issue = await createIssue({
          title,
          body,
          labels: ['feedback', `guia:${slug}`, 'via:claude'],
        });
        return {
          content: [
            {
              type: 'text',
              text: `Issue criada: #${issue.number} — ${issue.html_url}`,
            },
          ],
        };
      }
    );

    server.registerTool(
      'respond_lacuna',
      {
        title: 'Responder lacuna em aberto',
        description:
          'Cria uma Issue no GitHub com a resposta a uma lacuna em aberto de um guia. Antes de chamar esta tool, mostre ao usuário um preview do que será submetido como Issue no GitHub (título, corpo, labels) e peça confirmação. Não chame sem confirmação explícita. Parâmetros: `slug` (obrigatório, identificador do guia), `lacuna_text` (obrigatório, texto da lacuna original — use list_lacunas pra obter), `response` (obrigatório, sua resposta), `author` (obrigatório, quem está respondendo — pergunte ao usuário se ainda não souber).',
        inputSchema: {
          slug: z.string().min(1),
          lacuna_text: z.string().min(1),
          response: z.string().min(1),
          author: z.string().min(1),
        },
      },
      async ({ slug, lacuna_text, response, author }) => {
        const guide = findGuide(slug);
        if (!guide) {
          return {
            isError: true,
            content: [
              { type: 'text', text: `Guia não encontrado: ${slug}` },
            ],
          };
        }
        const title = `[lacuna] ${slug}: ${trimTitle(lacuna_text)}`;
        const body =
          `**Guia:** \`guias/guia-suporte-${slug}.md\`\n` +
          `**Pergunta em aberto:** ${lacuna_text}\n` +
          `\n---\n\n${response}\n\n_Quando aplicar no guia, marcar a lacuna como resolvida._` +
          authorFooter(author);
        const issue = await createIssue({
          title,
          body,
          labels: ['lacuna', `guia:${slug}`, 'via:claude'],
        });
        return {
          content: [
            {
              type: 'text',
              text: `Issue criada: #${issue.number} — ${issue.html_url}`,
            },
          ],
        };
      }
    );

    server.registerTool(
      'ask_question',
      {
        title: 'Mandar pergunta nova',
        description:
          'Cria uma Issue no GitHub com uma pergunta nova do time (não associada a nenhum guia existente). Antes de chamar esta tool, mostre ao usuário um preview do que será submetido como Issue no GitHub (título, corpo, labels) e peça confirmação. Não chame sem confirmação explícita. Parâmetros: `question` (obrigatório, texto da pergunta), `author` (obrigatório, quem está perguntando — pergunte ao usuário se ainda não souber).',
        inputSchema: {
          question: z.string().min(1),
          author: z.string().min(1),
        },
      },
      async ({ question, author }) => {
        const title = `[pergunta] ${trimTitle(question)}`;
        const body =
          `\n---\n\n${question}\n\n_Avaliar se vira FAQ no guia correspondente ou guia novo._` +
          authorFooter(author);
        const issue = await createIssue({
          title,
          body,
          labels: ['pergunta-saas', 'via:claude'],
        });
        return {
          content: [
            {
              type: 'text',
              text: `Issue criada: #${issue.number} — ${issue.html_url}`,
            },
          ],
        };
      }
    );

    return server;
  }

  return { createServer, StreamableHTTPServerTransport };
}

async function createMcpRouter() {
  const router = express.Router();
  router.use(express.json({ limit: '1mb' }));

  // Healthcheck do endpoint MCP. Também exige bearer pra não vazar nenhum
  // dado sobre o servidor (count de guias) pra terceiros.
  router.get('/health', bearerAuth, (req, res) => {
    res.json({
      ok: true,
      guides: listGuides().length,
      tools: TOOL_COUNT,
    });
  });

  let factory;
  try {
    factory = await buildMcpFactory();
  } catch (err) {
    console.error('[mcp] falha ao carregar SDK do MCP:', err);
    router.all('/', (req, res) =>
      res
        .status(500)
        .json({ error: 'MCP indisponível: SDK não carregado' })
    );
    return router;
  }

  // Stateless StreamableHTTP: cria server + transport novos por request.
  router.post('/', bearerAuth, async (req, res) => {
    try {
      const server = factory.createServer();
      const transport = new factory.StreamableHTTPServerTransport({
        sessionIdGenerator: undefined,
      });
      res.on('close', () => {
        transport.close().catch(() => {});
        server.close().catch(() => {});
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (err) {
      console.error('[mcp] erro no handleRequest:', err);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message: 'Erro interno do servidor MCP' },
          id: null,
        });
      }
    }
  });

  // Em modo stateless, GET e DELETE no /mcp não são suportados.
  router.get('/', bearerAuth, (req, res) =>
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Método não permitido (stateless).' },
      id: null,
    })
  );
  router.delete('/', bearerAuth, (req, res) =>
    res.status(405).json({
      jsonrpc: '2.0',
      error: { code: -32000, message: 'Método não permitido (stateless).' },
      id: null,
    })
  );

  return router;
}

module.exports = { createMcpRouter };
