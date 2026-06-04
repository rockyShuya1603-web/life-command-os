#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v63-2-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def patch_page(path: Path) -> bool:
    if not path.exists():
        return False

    backup(path)
    text = path.read_text(encoding="utf-8")
    before = text

    # GlassCard は id を受け取れない型なので、GlassCard上の id だけ全削除。
    # 例1: <GlassCard id="memo-list-search-v63">
    # 例2: <GlassCard id="memo-create-top-v63" className="...">
    text = re.sub(r'<GlassCard\s+id="[^"]+"\s+className=', '<GlassCard className=', text)
    text = re.sub(r'<GlassCard\s+id="[^"]+"\s*>', '<GlassCard>', text)

    # v63.1で作った外側divは残してOK。機能には影響なし。
    # 念のため、残った GlassCard id があればログで分かるようにする。
    leftovers = re.findall(r'<GlassCard[^>]*\sid="[^"]+"', text)
    if leftovers:
        print("WARNING: GlassCard id still exists:")
        for item in leftovers:
            print(item)

    path.write_text(text, encoding="utf-8")
    print(("patched" if text != before else "checked"), path)
    return True

root = Path.cwd()
patched = False

for page in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patched = patch_page(page) or patched

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v63.2 removed GlassCard id props completed")
