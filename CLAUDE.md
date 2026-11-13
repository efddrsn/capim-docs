# capim-docs

Guias de suporte do SaaS da Capim (`guias/`) e o app que os exibe e transforma feedback do time em GitHub Issues (`app/`).

## Regras que valem para qualquer sessão neste repo

1. **Sem código do front, sem mudança em guia.** Antes de criar ou editar qualquer arquivo em `guias/`, garanta o acesso ao `capimbr/capim-dash-frontend` (veja `.claude/skills/resolver-feedback-guias/SKILL.md`, Passo 0). Se falhar, pare e avise o usuário com o erro exato. O hook `.claude/hooks/exigir-frontend.py` bloqueia a escrita. Não contorne o hook.
2. **Só documentar o que o front expõe.** Feature, filtro, status ou fluxo que existe só no backend, em endpoint ou em flag interna não entra no guia como se a clínica pudesse usar. Nomes técnicos (flag, endpoint, campo) não vão para o texto do suporte.
3. Criar guias: skill `gerador-docs-v1`. Resolver issues do app (feedback, lacuna, pergunta-saas): skill `resolver-feedback-guias`.
4. Deploy: Railway (`friendly-light` / `capim-docs`) a partir de `claude/document-saas-skill-etjsC`. Só fazer merge nesse branch com o ok do usuário.
