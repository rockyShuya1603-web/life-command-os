#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v63-1-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def wrap_glasscard_id(text: str, target_id: str) -> str:
    # GlassCardの型は className/children だけなので、idは外側divへ移す。
    pattern = re.compile(
        rf'(?P<indent>[ \t]*)<GlassCard id="{re.escape(target_id)}" className="(?P<classname>[^"]+)">(?P<body>[\s\S]*?)(?P=indent)</GlassCard>',
        re.MULTILINE,
    )

    def repl(match: re.Match) -> str:
        indent = match.group("indent")
        classname = match.group("classname")
        body = match.group("body")
        return (
            f'{indent}<div id="{target_id}">\n'
            f'{indent}  <GlassCard className="{classname}">{body}'
            f'{indent}  </GlassCard>\n'
            f'{indent}</div>'
        )

    text, count = pattern.subn(repl, text)
    print(f"{target_id}: wrapped {count} block(s)")
    return text

def patch_page(path: Path) -> bool:
    if not path.exists():
        return False

    backup(path)
    text = path.read_text(encoding="utf-8")
    before = text

    text = wrap_glasscard_id(text, "memo-create-top-v63")
    text = wrap_glasscard_id(text, "memo-list-search-v63")

    # 念のため、残ったGlassCard idを最小限で除去
    text = text.replace('<GlassCard id="memo-create-top-v63" ', '<GlassCard ')
    text = text.replace('<GlassCard id="memo-list-search-v63" ', '<GlassCard ')

    path.write_text(text, encoding="utf-8")
    print(("patched" if text != before else "checked"), path)
    return True

root = Path.cwd()
patched = False

for page in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patched = patch_page(page) or patched

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v63.1 GlassCard id fix completed")
