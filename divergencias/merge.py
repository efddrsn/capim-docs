#!/usr/bin/env python3
"""Junta as partes da análise (um JSON por área) num arquivo por agente.

Uso: python3 divergencias/merge.py <dir-com-partes> <saida.json> <slug> <agente> <nome> <origem_url> <gerado_em>

Valida campos, remove ids duplicados, confere se o guia existe e se o trecho
citado do capim-docs aparece de fato no guia (aviso, não erro).
"""
import json, re, sys, unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
GUIAS = {p.stem.replace('guia-suporte-', ''): p.read_text(encoding='utf-8') for p in (ROOT / 'guias').glob('*.md')}
TIPOS = {'conflito', 'desatualizado', 'so_no_agente', 'so_no_docs'}
SEVS = {'alta', 'media', 'baixa'}


def norm(t):
    t = unicodedata.normalize('NFKC', t or '').lower()
    t = re.sub(r'[*_`>#|]', '', t)
    return re.sub(r'\s+', ' ', t).strip()


def citado(texto, guia):
    if not texto or guia not in GUIAS:
        return False
    corpo = norm(GUIAS[guia])
    partes = [norm(p) for p in re.split(r'…|\.\.\.', texto) if len(norm(p)) >= 15]
    return bool(partes) and all(p[:60] in corpo for p in partes)


def main(parts_dir, out, slug, agente, nome, origem_url, gerado_em):
    itens, ids, avisos = [], set(), []
    for f in sorted(Path(parts_dir).glob('*.json')):
        for it in json.loads(f.read_text(encoding='utf-8')):
            if it.get('id') in ids:
                avisos.append(f"id duplicado {it.get('id')} ({f.name})")
                continue
            if it.get('tipo') not in TIPOS or it.get('severidade') not in SEVS:
                avisos.append(f"tipo/severidade inválido em {it.get('id')}")
                continue
            if it.get('guia') and it['guia'] not in GUIAS:
                avisos.append(f"guia inexistente {it['guia']} em {it['id']}")
                it['guia'] = None
            cd = it.get('capim_docs')
            if cd and cd.get('texto') and it.get('guia') and not citado(cd['texto'], it['guia']):
                avisos.append(f"citação do capim-docs não encontrada literalmente em {it['id']}")
            ids.add(it['id'])
            itens.append(it)
    data = {'slug': slug, 'agente': agente, 'nome': nome, 'origem_url': origem_url, 'gerado_em': gerado_em, 'itens': itens}
    Path(out).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'{len(itens)} itens -> {out}')
    for a in avisos:
        print('AVISO:', a)


if __name__ == '__main__':
    main(*sys.argv[1:8])
