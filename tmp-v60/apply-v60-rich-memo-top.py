#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_V60 = 'import RichMemoComposerTopV60 from "./components/RichMemoComposerTopV60";'

OLD_IMPORTS = [
    'import MemoComposerTopV58 from "./components/MemoComposerTopV58";',
]

OLD_PATTERNS = [
    r'\n\s*<MemoComposerTopV58[^>]*/>\s*\n',
    r'\n\s*<div className="memo-v58-injected">[\s\S]*?</div>\s*\n',
    r'\n\s*<RichMemoComposerTopV60[^>]*/>\s*\n',
    r'\n\s*<div className="rich-memo-v60-injected">[\s\S]*?</div>\s*\n',
]

def ensure_import(text: str) -> str:
    if IMPORT_V60 in text:
        return text

    lines = text.splitlines()
    insert_at = 0

    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1

    if insert_at == 0:
        for i, line in enumerate(lines):
            if line.strip() in ['"use client";', "'use client';"]:
                insert_at = i + 1
                break

    lines.insert(insert_at, IMPORT_V60)
    return "\n".join(lines) + "\n"

def cleanup_old(text: str) -> str:
    for old in OLD_IMPORTS:
        text = text.replace(old + "\n", "")
        text = text.replace(old, "")

    for pattern in OLD_PATTERNS:
        text = re.sub(pattern, "\n", text)

    return text

def build_injection(text: str) -> str:
    has_page = re.search(r"\bpage\b", text) is not None
    props = ' page={page as any}' if has_page else ""
    return "\n      <div className=\"rich-memo-v60-injected\">\n        <RichMemoComposerTopV60" + props + " />\n      </div>\n"

def patch_page(path: Path):
    if not path.exists():
        return False

    backup = path.with_suffix(path.suffix + f".backup-v60-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    text = path.read_text(encoding="utf-8")

    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = cleanup_old(text)
    text = ensure_import(text)
    injection = build_injection(text)

    main_match = re.search(r"<main\b[^>]*>", text)
    if main_match:
        text = text[:main_match.end()] + injection + text[main_match.end():]
        print("inserted RichMemoComposerTopV60 after <main>", path)
    else:
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx == -1:
            raise RuntimeError(f"main tag was not found in {path}")
        text = text[:idx] + injection + text[idx:]
        print("inserted RichMemoComposerTopV60 before </main> fallback", path)

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)
    return True

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v60 rich memo composer top" not in text:
        text += "\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent
component = (base / "RichMemoComposerTopV60.tsx").read_text(encoding="utf-8")
api = (base / "memo-assist-route.ts").read_text(encoding="utf-8")
css = (base / "rich-memo-v60.css").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "RichMemoComposerTopV60.tsx", component)
    write_file(root / "app" / "api" / "memo" / "assist" / "route.ts", api)
    patched = patch_page(root / "app" / "page.tsx") or patched
    patch_css(root / "app" / "globals.css", css)

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "RichMemoComposerTopV60.tsx", component)
    write_file(root / "src" / "app" / "api" / "memo" / "assist" / "route.ts", api)
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched
    patch_css(root / "src" / "app" / "globals.css", css)

if not patched:
    raise SystemExit("page.tsx was not found")

print("v60 rich memo top completed")
