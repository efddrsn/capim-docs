(function () {
  const modalRoot = document.getElementById('modal-root');
  const guideSlug = document.querySelector('article.doc')?.dataset.guide || null;

  function openModal({ title, ctx, fields, submitLabel, onSubmit }) {
    modalRoot.innerHTML = '';
    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop';
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) close();
    });
    const modal = document.createElement('div');
    modal.className = 'modal';
    const ctxHtml = ctx ? `<div class="ctx">${escapeHtml(ctx)}</div>` : '';
    const fieldsHtml = fields
      .map((f) => {
        const val = escapeHtml(f.value || '');
        if (f.type === 'textarea') {
          return `<label for="f-${f.name}">${escapeHtml(f.label)}</label>
            <textarea id="f-${f.name}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${escapeHtml(f.placeholder || '')}">${val}</textarea>`;
        }
        return `<label for="f-${f.name}">${escapeHtml(f.label)}</label>
          <input id="f-${f.name}" type="text" name="${f.name}" placeholder="${escapeHtml(f.placeholder || '')}" value="${val}" />`;
      })
      .join('');
    modal.innerHTML = `
      <h2>${escapeHtml(title)}</h2>
      ${ctxHtml}
      <form id="m-form">
        ${fieldsHtml}
        <div class="msg" id="m-msg"></div>
        <div class="actions">
          <button type="button" id="m-cancel">Cancelar</button>
          <button type="submit" class="primary" id="m-submit">${escapeHtml(submitLabel || 'Enviar')}</button>
        </div>
      </form>
    `;
    backdrop.appendChild(modal);
    modalRoot.appendChild(backdrop);
    const form = modal.querySelector('#m-form');
    const msg = modal.querySelector('#m-msg');
    const submit = modal.querySelector('#m-submit');
    modal.querySelector('#m-cancel').addEventListener('click', close);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      submit.disabled = true;
      msg.textContent = 'Enviando…';
      msg.className = 'msg';
      try {
        const data = {};
        for (const f of fields) data[f.name] = form.elements[f.name].value.trim();
        const result = await onSubmit(data);
        if (result && result.url) {
          msg.innerHTML = `Enviado. Issue criada: <a href="${result.url}" target="_blank" rel="noopener">#${result.number}</a>`;
          msg.className = 'msg ok';
          setTimeout(close, 2500);
        } else {
          msg.textContent = 'Enviado.';
          msg.className = 'msg ok';
          setTimeout(close, 1500);
        }
      } catch (err) {
        msg.textContent = 'Erro: ' + (err.message || 'tente novamente');
        msg.className = 'msg error';
        submit.disabled = false;
      }
    });
    setTimeout(() => {
      const firstInput = modal.querySelector('textarea, input[type=text]');
      if (firstInput) firstInput.focus();
    }, 30);

    function close() {
      modalRoot.innerHTML = '';
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  async function postJSON(url, data) {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  // Feedback em trecho do guia (botões em cada heading)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.feedback-btn');
    if (!btn) return;
    const section = btn.dataset.section;
    const trecho = btn.dataset.trecho;
    openModal({
      title: 'Sugerir correção ou comentar este trecho',
      ctx: `Seção: ${trecho || section}\nGuia: ${guideSlug || '(desconhecido)'}`,
      fields: [
        { name: 'comment', label: 'O que está errado, faltando ou que poderia melhorar?', type: 'textarea', required: true, placeholder: 'Descreva a sugestão. Pode colar trechos do que está no guia hoje.' },
        { name: 'author', label: 'Seu nome (opcional)', type: 'text', placeholder: 'Como assinar a sugestão' },
      ],
      submitLabel: 'Enviar sugestão',
      onSubmit: (data) =>
        postJSON('/api/feedback', { guide: guideSlug, section, trecho, comment: data.comment, author: data.author }),
    });
  });

  // Resposta a lacuna (página /lacunas)
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.answer-btn');
    if (!btn) return;
    const guide = btn.dataset.guide;
    const question = btn.dataset.question;
    openModal({
      title: 'Responder lacuna',
      ctx: `Pergunta: ${question}\nGuia: ${guide}`,
      fields: [
        { name: 'answer', label: 'Sua resposta', type: 'textarea', required: true, placeholder: 'Responda o que souber. Pode anotar "parcialmente, ver fulano" também.' },
        { name: 'author', label: 'Seu nome (opcional)', type: 'text', placeholder: 'Como assinar a resposta' },
      ],
      submitLabel: 'Enviar resposta',
      onSubmit: (data) =>
        postJSON('/api/lacuna', { guide, question, answer: data.answer, author: data.author }),
    });
  });

  // Botão "Mandar pergunta sobre <guia>" dentro do guia
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ask-btn');
    if (!btn) return;
    const topic = btn.dataset.topic || '';
    openModal({
      title: topic ? `Mandar pergunta sobre ${topic}` : 'Mandar pergunta',
      ctx: topic ? `Tópico: ${topic}` : null,
      fields: [
        { name: 'topic', label: 'Sobre qual módulo/feature?', type: 'text', placeholder: 'ex: Agenda', value: topic },
        { name: 'question', label: 'Sua pergunta', type: 'textarea', required: true, placeholder: 'Escreva a pergunta na voz do dentista, do suporte ou do CS.' },
        { name: 'author', label: 'Seu nome (opcional)', type: 'text', placeholder: 'Como assinar' },
      ],
      submitLabel: 'Enviar pergunta',
      onSubmit: (data) => postJSON('/api/pergunta', data),
    });
  });

  // Adiciona botão de feedback em qualquer parágrafo, item de lista ou blockquote do guia
  function annotateBlocks() {
    const doc = document.querySelector('article.doc .doc-body');
    if (!doc) return;
    const SKIP_SELECTORS = '.lacuna-item, .lacuna-list, .guide-ask, .doc-actions, pre, code';
    const elements = doc.querySelectorAll('p, li, blockquote, td');
    let counter = 0;
    elements.forEach((el) => {
      if (!el.textContent.trim()) return;
      if (el.closest(SKIP_SELECTORS) && !el.matches('li, blockquote, p, td')) return;
      if (el.querySelector(':scope > .feedback-btn')) return;
      // pula <li> que só contém uma sub-lista (sem texto direto)
      const directText = Array.from(el.childNodes)
        .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !/UL|OL/.test(n.tagName)))
        .map((n) => n.textContent || '')
        .join('')
        .trim();
      if (!directText) return;
      counter++;
      const id = `b-${counter}`;
      el.classList.add('doc-block');
      el.dataset.blockId = id;
      const trecho = directText.slice(0, 140);
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'feedback-btn block-fb';
      btn.title = 'Comentar este trecho';
      btn.textContent = '💬';
      btn.dataset.section = id;
      btn.dataset.trecho = trecho;
      el.appendChild(btn);
    });
  }


  // ---- Divergências (/divergencias) ----
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.div-resolve');
    if (!btn) return;
    const li = btn.closest('.div-item');
    const id = li.dataset.id;
    const resolucao = btn.dataset.res;
    const precisaResposta = resolucao === 'outro';
    openModal({
      title: btn.dataset.label,
      ctx: `${li.dataset.tema}\nAgente: ${li.dataset.fonteNome} · id ${id}`,
      fields: [
        {
          name: 'resposta',
          label: precisaResposta ? 'Qual é a informação certa? (obrigatório)' : 'Observação ou fonte (opcional)',
          type: 'textarea',
          required: precisaResposta,
          placeholder: precisaResposta
            ? 'Escreva a regra correta e, se possível, quem confirmou.'
            : 'Ex.: confirmado com o PM; regra mudou em nov/26.',
        },
        { name: 'author', label: 'Seu nome (opcional)', type: 'text', placeholder: 'Quem decidiu' },
      ],
      submitLabel: 'Registrar decisão',
      onSubmit: async (data) => {
        if (precisaResposta && !data.resposta) throw new Error('informe qual é a informação certa');
        const r = await postJSON('/api/divergencia', { id, resolucao, resposta: data.resposta, author: data.author });
        li.dataset.status = 'decidido';
        const wrap = li.querySelector('.div-status-wrap');
        if (wrap)
          wrap.innerHTML = `<span class="div-status decidido">Decidido: ${escapeHtml(btn.dataset.label)}</span> <a href="${r.url}" target="_blank" rel="noopener">#${r.number}</a>`;
        applyDivFilters();
        return r;
      },
    });
  });

  const divForm = document.getElementById('div-filtros');
  function applyDivFilters() {
    if (!divForm) return;
    const f = Object.fromEntries(new FormData(divForm).entries());
    const q = (f.q || '').toLowerCase();
    let shown = 0;
    document.querySelectorAll('#div-list .div-item').forEach((li) => {
      const d = li.dataset;
      const ok =
        (!f.fonte || d.fonte === f.fonte) &&
        (!f.guia || d.guia === f.guia) &&
        (!f.tipo || d.tipo === f.tipo) &&
        (!f.sev || d.sev === f.sev) &&
        (!f.status || d.status === f.status) &&
        (!q || li.textContent.toLowerCase().includes(q));
      li.hidden = !ok;
      if (ok) shown++;
    });
    const c = document.getElementById('div-count');
    if (c) c.textContent = `${shown} ${shown === 1 ? 'item' : 'itens'} na lista`;
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(f)) if (v) params.set(k, v);
    history.replaceState(null, '', location.pathname + (params.toString() ? '?' + params : ''));
  }
  if (divForm) {
    divForm.addEventListener('input', applyDivFilters);
    divForm.addEventListener('change', applyDivFilters);
    applyDivFilters();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', annotateBlocks);
  } else {
    annotateBlocks();
  }
})();
