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
        if (f.type === 'textarea') {
          return `<label for="f-${f.name}">${escapeHtml(f.label)}</label>
            <textarea id="f-${f.name}" name="${f.name}" ${f.required ? 'required' : ''} placeholder="${escapeHtml(f.placeholder || '')}"></textarea>`;
        }
        return `<label for="f-${f.name}">${escapeHtml(f.label)}</label>
          <input id="f-${f.name}" type="text" name="${f.name}" placeholder="${escapeHtml(f.placeholder || '')}" />`;
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

  // Botão "Mandar pergunta" do topo
  document.getElementById('open-new-question')?.addEventListener('click', () => {
    openModal({
      title: 'Mandar pergunta nova',
      ctx: 'Sua pergunta vira issue no GitHub e a gente analisa se entra como FAQ num guia existente ou se merece um guia novo.',
      fields: [
        { name: 'topic', label: 'Sobre qual módulo/feature? (opcional)', type: 'text', placeholder: 'ex: Agenda, Maquininha, Capix…' },
        { name: 'question', label: 'Sua pergunta', type: 'textarea', required: true, placeholder: 'Escreva a pergunta na voz do dentista, do suporte ou do CS.' },
        { name: 'author', label: 'Seu nome (opcional)', type: 'text', placeholder: 'Como assinar' },
      ],
      submitLabel: 'Enviar pergunta',
      onSubmit: (data) => postJSON('/api/pergunta', data),
    });
  });
})();
