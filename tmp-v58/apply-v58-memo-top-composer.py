#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_LINE = 'import MemoComposerTopV58 from "./components/MemoComposerTopV58";'

def ensure_import(text: str) -> str:
    if IMPORT_LINE in text:
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

    lines.insert(insert_at, IMPORT_LINE)
    return "\n".join(lines) + "\n"

def remove_old_v58(text: str) -> str:
    text = re.sub(r'\n\s*<MemoComposerTopV58[^>]*/>\s*\n', '\n', text)
    text = re.sub(r'\n\s*<div className="memo-v58-injected">[\s\S]*?</div>\s*\n', '\n', text)
    return text

def build_injection(text: str) -> str:
    has_page = re.search(r"\bpage\b", text) is not None
    props = ' page={page as any}' if has_page else ""
    return "\n      <div className=\"memo-v58-injected\">\n        <MemoComposerTopV58" + props + " />\n      </div>\n"

def patch_page(path: Path):
    if not path.exists():
        return False

    backup = path.with_suffix(path.suffix + f".backup-v58-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    text = path.read_text(encoding="utf-8")

    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = ensure_import(text)
    text = remove_old_v58(text)

    injection = build_injection(text)

    main_match = re.search(r"<main\b[^>]*>", text)
    if main_match:
        text = text[:main_match.end()] + injection + text[main_match.end():]
        print("inserted MemoComposerTopV58 after <main>", path)
    else:
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx == -1:
            raise RuntimeError(f"main tag was not found in {path}")
        text = text[:idx] + injection + text[idx:]
        print("inserted MemoComposerTopV58 before </main> fallback", path)

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)
    return True

def write_component(root: Path, relative: str, content: str):
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v58 memo composer true top" not in text:
        text += "\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent
component = (base / "MemoComposerTopV58.tsx").read_text(encoding="utf-8")
css = (base / "memo-v58.css").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_component(root, "app/components/MemoComposerTopV58.tsx", component)
    patched = patch_page(root / "app" / "page.tsx") or patched
    patch_css(root / "app" / "globals.css", css)

if (root / "src" / "app" / "page.tsx").exists():
    write_component(root, "src/app/components/MemoComposerTopV58.tsx", component)
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched
    patch_css(root / "src" / "app" / "globals.css", css)

if not patched:
    raise SystemExit("page.tsx was not found")

print("v58 memo top composer completed")
