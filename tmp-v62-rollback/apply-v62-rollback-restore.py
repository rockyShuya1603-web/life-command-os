#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

V62_IMPORTS = [
    'import UnifiedMemoV62 from "./components/UnifiedMemoV62";',
    'import CalendarTimelineV62 from "./components/CalendarTimelineV62";',
]

V62_PATTERNS = [
    r'\n\s*<UnifiedMemoV62[^>]*/>\s*\n',
    r'\n\s*<CalendarTimelineV62[^>]*/>\s*\n',
    r'\n\s*<div className="life-v62-injected">[\s\S]*?</div>\s*\n',
]

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-rollback-v62-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def patch_page(path: Path):
    if not path.exists():
        return False

    backup(path)
    text = path.read_text(encoding="utf-8")

    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    before = text

    for line in V62_IMPORTS:
        text = text.replace(line + "\n", "")
        text = text.replace(line, "")

    for pattern in V62_PATTERNS:
        text = re.sub(pattern, "\n", text, flags=re.DOTALL)

    path.write_text(text, encoding="utf-8")
    print(("patched" if text != before else "checked"), path)
    return True

def patch_css(path: Path):
    if not path.exists():
        return False

    backup(path)
    text = path.read_text(encoding="utf-8")
    before = text

    marker = "/* ===== v62 unified memo + calendar anchor ===== */"
    idx = text.find(marker)
    if idx != -1:
        text = text[:idx].rstrip() + "\n"

    # 念のため、v62が付けた強制非表示だけは個別にも剥がす
    text = text.replace(".life-v62-legacy-memo-hidden", ".life-v62-legacy-memo-hidden-disabled")

    path.write_text(text, encoding="utf-8")
    print(("patched" if text != before else "checked"), path)
    return True

def remove_v62_classes_runtime_note(root: Path):
    # component files are left as-is because unused files do not affect build.
    # This keeps rollback conservative and reversible.
    pass

root = Path.cwd()
patched_any = False

for page in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patched_any = patch_page(page) or patched_any

for css in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(css)

if not patched_any:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v62 rollback completed: v62 injection removed, v62 CSS removed")
