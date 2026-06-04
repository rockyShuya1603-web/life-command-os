#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_V53 = 'import LifeCommandV53Enhancements from "./components/LifeCommandV53Enhancements";'
IMPORT_SEARCH = 'import LifeTopSearchBoostV54 from "./components/LifeTopSearchBoostV54";'

def ensure_import(text: str, line: str) -> str:
    if line in text:
        return text
    lines = text.splitlines()
    insert_at = 0
    for i, current in enumerate(lines):
        if current.startswith("import "):
            insert_at = i + 1
    if insert_at == 0:
        for i, current in enumerate(lines):
            if current.strip() in ['"use client";', "'use client';"]:
                insert_at = i + 1
                break
    lines.insert(insert_at, line)
    return "\n".join(lines) + "\n"

def remove_existing_injections(text: str) -> str:
    text = re.sub(r'\n\s*<LifeCommandV53Enhancements[^>]*/>\s*\n', '\n', text)
    text = re.sub(r'\n\s*<LifeTopSearchBoostV54[^>]*/>\s*\n', '\n', text)
    return text

def patch_page(path: Path):
    if not path.exists():
        return
    backup = path.with_suffix(path.suffix + f".backup-v54-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)
    text = path.read_text(encoding="utf-8")

    # 以前のバグ対策
    if "\\n" in text[:300] and text.count("\n") < 5:
      text = text.replace("\\n", "\n")

    text = ensure_import(text, IMPORT_V53)
    text = ensure_import(text, IMPORT_SEARCH)
    text = remove_existing_injections(text)

    has_page = re.search(r"\bpage\b", text) is not None
    has_set_page = "setPage" in text
    props = ' page={page as any} setPage={setPage}' if has_page and has_set_page else ""
    search_props = ' setPage={setPage}' if has_set_page else ""

    snippet = f'\n      <LifeTopSearchBoostV54{search_props} />\n      <LifeCommandV53Enhancements{props} />\n'

    m = re.search(r"<main\\b[^>]*>", text)
    if m:
        text = text[:m.end()] + snippet + text[m.end():]
    else:
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx != -1:
            text = text[:idx] + snippet + text[idx:]
        else:
            print("warning: main tag not found; injection skipped")

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v54 memo top / top AI search / life sync polish" not in text:
        text += "\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent

v53 = (base / "LifeCommandV53Enhancements.tsx").read_text(encoding="utf-8")
search = (base / "LifeTopSearchBoostV54.tsx").read_text(encoding="utf-8")
level = (base / "LifeLevelGachaV52.tsx").read_text(encoding="utf-8")
api_level = (base / "life-level-route.ts").read_text(encoding="utf-8")
api_search = (base / "life-ai-search-route.ts").read_text(encoding="utf-8")
css = (base / "life-v54.css").read_text(encoding="utf-8")
sql = (base / "life-level-state.sql").read_text(encoding="utf-8")

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "LifeCommandV53Enhancements.tsx", v53)
    write_file(root / "app" / "components" / "LifeTopSearchBoostV54.tsx", search)
    write_file(root / "app" / "components" / "LifeLevelGachaV52.tsx", level)
    write_file(root / "app" / "api" / "life" / "level" / "route.ts", api_level)
    write_file(root / "app" / "api" / "life-ai" / "search" / "route.ts", api_search)
    write_file(root / "lib" / "supabase" / "sql" / "life-level-state.sql", sql)
    patch_page(root / "app" / "page.tsx")
    patch_css(root / "app" / "globals.css", css)

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "LifeCommandV53Enhancements.tsx", v53)
    write_file(root / "src" / "app" / "components" / "LifeTopSearchBoostV54.tsx", search)
    write_file(root / "src" / "app" / "components" / "LifeLevelGachaV52.tsx", level)
    write_file(root / "src" / "app" / "api" / "life" / "level" / "route.ts", api_level)
    write_file(root / "src" / "app" / "api" / "life-ai" / "search" / "route.ts", api_search)
    write_file(root / "src" / "lib" / "supabase" / "sql" / "life-level-state.sql", sql)
    patch_page(root / "src" / "app" / "page.tsx")
    patch_css(root / "src" / "app" / "globals.css", css)

print("v54 completed")
