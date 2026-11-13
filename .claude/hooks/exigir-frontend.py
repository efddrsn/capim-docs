#!/usr/bin/env python3
"""PreToolUse hook: bloqueia qualquer escrita em guias/ sem um clone local
do capimbr/capim-dash-frontend. Regra do processo: sem código do front,
nenhum guia é criado ou alterado (nem por subagente)."""
import json, os, re, subprocess, sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
FRONT = "capim-dash-frontend"
WRITE_TOOLS = {"Edit", "Write", "MultiEdit", "NotebookEdit"}
# Escrita que mira um caminho em guias/ (ignora mensagens de commit, grep, cat etc.).
G = r"[^\s;&|]*guias/"
BASH_WRITE = re.compile(
    r"(sed\s+(-\w*\s+)*-i[^;&|]*" + G +
    r"|>>?\s*['\"]?" + G +
    r"|\btee\s+(-\w+\s+)*['\"]?" + G +
    r"|\b(mv|cp|rm|truncate|patch)\s[^;&|]*" + G +
    r"|\bgit\s+(apply|checkout|restore)\b[^;&|]*" + G +
    r"|\b(python3?|perl|node)\b.*guias/.*(write|open\(|writeFile|>))",
    re.S)


def candidatos():
    env = os.environ.get("CAPIM_FRONTEND_PATH")
    if env:
        yield Path(env).expanduser()
    marker = REPO_ROOT / ".claude" / "frontend-path"
    if marker.is_file():
        yield Path(marker.read_text().strip()).expanduser()
    home = Path.home()
    for base in (REPO_ROOT.parent, home / "code", home / "repos", home / "dev", home / "Projects", Path("/home/user")):
        yield base / FRONT


def front_ok():
    for p in candidatos():
        if not (p / ".git").exists():
            continue
        try:
            url = subprocess.run(["git", "-C", str(p), "remote", "get-url", "origin"],
                                 capture_output=True, text=True, timeout=5).stdout
        except Exception:
            continue
        if "capimbr/" + FRONT in url and any(p.joinpath("src").iterdir()):
            return p
    return None


def toca_guias(tool, inp):
    if tool in WRITE_TOOLS:
        fp = inp.get("file_path") or inp.get("notebook_path") or ""
        try:
            return Path(fp).resolve().is_relative_to(REPO_ROOT / "guias")
        except Exception:
            return "guias/" in fp
    if tool == "Bash":
        cmd = inp.get("command", "")
        return bool(BASH_WRITE.search(cmd))
    return False


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:
        return 0
    if not toca_guias(data.get("tool_name", ""), data.get("tool_input") or {}):
        return 0
    if front_ok():
        return 0
    sys.stderr.write(
        "BLOQUEADO pelo processo do capim-docs: não há clone local do "
        "capimbr/capim-dash-frontend, então nenhum guia pode ser criado ou "
        "alterado. PARE agora e avise o usuário com o erro exato do acesso "
        "(check_repo_access/add_repo/git clone). Não siga só com o texto das "
        "issues, não delegue a escrita para subagente e não use outro caminho "
        "de escrita. Veja .claude/skills/resolver-feedback-guias/SKILL.md.\n")
    return 2


if __name__ == "__main__":
    sys.exit(main())
