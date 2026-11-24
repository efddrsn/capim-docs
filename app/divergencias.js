// Divergências entre o capim-docs (fonte da verdade de produto) e as bases de
// conhecimento dos agentes (Claudinha, Leo, ...).
//
// Dados: ../divergencias/<fonte>.json (gerados pela análise, versionados no repo).
// Estado: cada decisão vira uma GitHub Issue com label `divergencia` e o id do item
// no título (`[div:<id>]`). O status de cada item é lido dessas issues, com cache curto.

const fs = require('fs');
const path = require('path');

const RESOLUCOES = {
  docs_certo: { label: 'capim-docs está certo', acao: 'Corrigir a base do agente', cor: 'ok' },
  agente_certo: { label: 'Agente está certo', acao: 'Corrigir o capim-docs', cor: 'warn' },
  outro: { label: 'Nenhum dos dois', acao: 'Corrigir os dois com a resposta informada', cor: 'warn' },
  incluir_docs: { label: 'Incluir no capim-docs', acao: 'Adicionar a informação ao capim-docs', cor: 'warn' },
  incluir_agente: { label: 'Incluir na base do agente', acao: 'Adicionar a informação à base do agente', cor: 'ok' },
  remover_agente: { label: 'Agente está errado', acao: 'Remover ou corrigir a informação na base do agente', cor: 'ok' },
  descartar: { label: 'Não é divergência', acao: 'Nada a fazer', cor: 'muted' },
};

const OPCOES_POR_TIPO = {
  conflito: ['docs_certo', 'agente_certo', 'outro', 'descartar'],
  desatualizado: ['docs_certo', 'agente_certo', 'outro', 'descartar'],
  so_no_agente: ['incluir_docs', 'remover_agente', 'outro', 'descartar'],
  so_no_docs: ['incluir_agente', 'outro', 'descartar'],
};

const TIPOS = {
  conflito: 'Conflito',
  desatualizado: 'Desatualizado',
  so_no_agente: 'Só no agente',
  so_no_docs: 'Só no capim-docs',
};

function createDivergencias({ dir, githubFetch, escapeHtml, escapeAttr }) {
  function listFontes() {
    if (!fs.existsSync(dir)) return [];
    return fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .sort()
      .map((file) => {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
          data.slug = data.slug || file.replace(/\.json$/, '');
          data.itens = Array.isArray(data.itens) ? data.itens : [];
          return data;
        } catch (err) {
          console.error('divergencias: json inválido', file, err.message);
          return null;
        }
      })
      .filter(Boolean);
  }

  function findItem(id) {
    for (const f of listFontes()) {
      const item = f.itens.find((i) => i.id === id);
      if (item) return { fonte: f, item };
    }
    return null;
  }

  // ---- estado via GitHub Issues (cache 60s) ----
  let cache = { at: 0, map: new Map(), error: null };
  const TTL = 60 * 1000;

  async function loadResolucoes(force = false) {
    if (!force && Date.now() - cache.at < TTL) return cache;
    const map = new Map();
    try {
      for (let page = 1; page <= 10; page++) {
        const issues = await githubFetch(
          `/issues?labels=divergencia&state=all&per_page=100&page=${page}&sort=created&direction=asc`
        );
        for (const is of issues) {
          const m = /\[div:([^\]]+)\]/.exec(is.title || '');
          if (!m) continue;
          const labels = (is.labels || []).map((l) => (typeof l === 'string' ? l : l.name));
          const res = labels.find((l) => l.startsWith('resolucao:'));
          // a mais recente vence (lista vem em ordem crescente de criação)
          map.set(m[1], {
            resolucao: res ? res.slice('resolucao:'.length) : null,
            number: is.number,
            url: is.html_url,
            state: is.state,
            created_at: is.created_at,
          });
        }
        if (issues.length < 100) break;
      }
      cache = { at: Date.now(), map, error: null };
    } catch (err) {
      console.error('divergencias: falha ao ler issues', err.message);
      cache = { at: Date.now(), map: cache.map, error: err.message };
    }
    return cache;
  }

  // ---- render ----
  // só negrito e `code`: as citações vêm de markdown
  function inlineMd(t) {
    return escapeHtml(t)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  function statusDe(item, map) {
    const r = map.get(item.id);
    if (!r) return { key: 'aberto', r: null };
    if (r.state === 'closed') return { key: 'aplicado', r };
    return { key: 'decidido', r };
  }

  function bloco(titulo, lado, classe) {
    if (!lado || !lado.texto) {
      return `<div class="div-side ${classe} vazio"><div class="div-side-h">${escapeHtml(titulo)}</div><em>Não menciona</em></div>`;
    }
    const ref = lado.url
      ? `<a href="${escapeAttr(lado.url)}" target="_blank" rel="noopener">${escapeHtml(lado.ref || 'abrir')}</a>`
      : lado.ref
      ? escapeHtml(lado.ref)
      : '';
    return `<div class="div-side ${classe}">
      <div class="div-side-h">${escapeHtml(titulo)}${ref ? ` <span class="div-ref">· ${ref}</span>` : ''}</div>
      <blockquote>${inlineMd(lado.texto)}</blockquote>
    </div>`;
  }

  function renderItem(item, fonte, map, guideTitles) {
    const { key, r } = statusDe(item, map);
    const guiaTitle = guideTitles[item.guia] || item.guia || 'Geral';
    const docsLado = item.capim_docs
      ? {
          ...item.capim_docs,
          url: item.capim_docs.url || (item.guia ? `/guia/${item.guia}${item.capim_docs.secao ? '#' + item.capim_docs.secao : ''}` : null),
          ref: item.capim_docs.ref || guiaTitle,
        }
      : null;
    const statusHtml =
      key === 'aberto'
        ? `<span class="div-status aberto">Em aberto</span>`
        : `<span class="div-status ${key}">${key === 'aplicado' ? 'Aplicado' : 'Decidido'}: ${escapeHtml(
            (RESOLUCOES[r.resolucao] || {}).label || r.resolucao || '?'
          )}</span> <a href="${escapeAttr(r.url)}" target="_blank" rel="noopener">#${r.number}</a>`;
    const botoes = (OPCOES_POR_TIPO[item.tipo] || OPCOES_POR_TIPO.conflito)
      .map((k) => [k, RESOLUCOES[k]])
      .map(
        ([k, v]) =>
          `<button type="button" class="div-resolve ${v.cor}" data-res="${k}" data-label="${escapeAttr(v.label)}">${escapeHtml(v.label)}</button>`
      )
      .join('');
    return `<li class="div-item" data-id="${escapeAttr(item.id)}" data-fonte="${escapeAttr(fonte.slug)}"
        data-fonte-nome="${escapeAttr(fonte.agente || fonte.nome || fonte.slug)}"
        data-guia="${escapeAttr(item.guia || '')}" data-tipo="${escapeAttr(item.tipo || '')}"
        data-sev="${escapeAttr(item.severidade || '')}" data-status="${key}"
        data-tema="${escapeAttr(item.tema || '')}">
      <div class="div-head">
        <div>
          <div class="div-tema">${escapeHtml(item.tema || item.id)}</div>
          <div class="div-meta">
            <span class="pill">${escapeHtml(guiaTitle)}</span>
            <span class="pill tipo-${escapeAttr(item.tipo || '')}">${escapeHtml(TIPOS[item.tipo] || item.tipo || '')}</span>
            ${item.severidade ? `<span class="pill sev-${escapeAttr(item.severidade)}">${escapeHtml(item.severidade)}</span>` : ''}
            <span class="pill fonte">${escapeHtml(fonte.agente || fonte.slug)}</span>
            <code class="div-id">${escapeHtml(item.id)}</code>
          </div>
        </div>
        <div class="div-status-wrap">${statusHtml}</div>
      </div>
      <div class="div-compare">
        ${bloco('capim-docs', docsLado, 'docs')}
        ${bloco(fonte.agente || fonte.nome || 'Agente', item.agente, 'agente')}
      </div>
      ${item.nota ? `<p class="div-nota"><strong>Leitura:</strong> ${inlineMd(item.nota)}</p>` : ''}
      <div class="div-actions">${botoes}</div>
    </li>`;
  }

  async function renderPage({ guides, query }) {
    const fontes = listFontes();
    const { map, error } = await loadResolucoes();
    const guideTitles = Object.fromEntries(guides.map((g) => [g.slug, g.title.replace(/^Guia de Suporte:\s*/i, '')]));
    const all = [];
    for (const f of fontes) for (const it of f.itens) all.push({ f, it });

    const counts = { total: all.length, aberto: 0, decidido: 0, aplicado: 0 };
    for (const { it } of all) counts[statusDe(it, map).key]++;

    const guiasUsados = [...new Set(all.map(({ it }) => it.guia || ''))].sort((a, b) =>
      (guideTitles[a] || a).localeCompare(guideTitles[b] || b, 'pt-BR')
    );
    const opt = (v, label, sel) => `<option value="${escapeAttr(v)}"${sel === v ? ' selected' : ''}>${escapeHtml(label)}</option>`;
    const filtros = `
      <form class="div-filtros" id="div-filtros" onsubmit="return false">
        <input type="search" name="q" placeholder="Buscar tema ou texto…" value="${escapeAttr(query.q || '')}" />
        <select name="fonte">${opt('', 'Todos os agentes', query.fonte)}${fontes
          .map((f) => opt(f.slug, f.agente || f.nome || f.slug, query.fonte))
          .join('')}</select>
        <select name="guia">${opt('', 'Todos os guias', query.guia)}${guiasUsados
          .map((g) => opt(g, guideTitles[g] || g || 'Geral', query.guia))
          .join('')}</select>
        <select name="tipo">${opt('', 'Todos os tipos', query.tipo)}${Object.entries(TIPOS)
          .map(([k, v]) => opt(k, v, query.tipo))
          .join('')}</select>
        <select name="sev">${opt('', 'Qualquer severidade', query.sev)}${['alta', 'media', 'baixa']
          .map((s) => opt(s, s, query.sev))
          .join('')}</select>
        <select name="status">${opt('', 'Qualquer status', query.status)}${opt('aberto', 'Em aberto', query.status)}${opt(
      'decidido',
      'Decidido (falta aplicar)',
      query.status
    )}${opt('aplicado', 'Aplicado', query.status)}</select>
      </form>`;

    const fontesInfo = fontes
      .map(
        (f) => `<li><strong>${escapeHtml(f.agente || f.slug)}</strong>: ${escapeHtml(f.nome || '')}${
          f.origem_url ? ` (<a href="${escapeAttr(f.origem_url)}" target="_blank" rel="noopener">fonte</a>)` : ''
        }${f.gerado_em ? `, comparado em ${escapeHtml(f.gerado_em)}` : ''}. ${f.itens.length} itens.</li>`
      )
      .join('');

    const severOrder = { alta: 0, media: 1, baixa: 2 };
    all.sort(
      (a, b) =>
        (severOrder[a.it.severidade] ?? 3) - (severOrder[b.it.severidade] ?? 3) ||
        (guideTitles[a.it.guia] || '').localeCompare(guideTitles[b.it.guia] || '', 'pt-BR')
    );

    return `
      <h1>Divergências com os agentes</h1>
      <p class="lead">O capim-docs é a fonte da verdade de produto. Aqui ficam os pontos em que a base de um agente diz outra coisa, ou em que só um dos lados tem a informação. Escolha quem está certo: cada decisão vira uma issue no GitHub para alguém aplicar a correção.</p>
      <ul class="div-fontes">${fontesInfo || '<li><em>Nenhuma comparação carregada.</em></li>'}</ul>
      ${error ? `<p class="error">Não consegui ler o status no GitHub agora, então todos os itens aparecem como em aberto. Registrar decisões continua funcionando.</p>` : ''}
      <div class="div-kpis">
        <div><b>${counts.total}</b><span>itens</span></div>
        <div><b>${counts.aberto}</b><span>em aberto</span></div>
        <div><b>${counts.decidido}</b><span>decididos</span></div>
        <div><b>${counts.aplicado}</b><span>aplicados</span></div>
      </div>
      ${filtros}
      <p class="div-count" id="div-count"></p>
      <ul class="div-list" id="div-list">
        ${all.map(({ f, it }) => renderItem(it, f, map, guideTitles)).join('')}
      </ul>`;
  }

  function countAbertasPorGuia(slug) {
    let n = 0;
    for (const f of listFontes()) for (const it of f.itens) if (it.guia === slug && !cache.map.has(it.id)) n++;
    return n;
  }

  return { listFontes, findItem, loadResolucoes, renderPage, countAbertasPorGuia, RESOLUCOES, TIPOS };
}

module.exports = { createDivergencias, RESOLUCOES };
