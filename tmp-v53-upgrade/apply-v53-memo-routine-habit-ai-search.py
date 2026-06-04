#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_LINE = 'import LifeCommandV53Enhancements from "./components/LifeCommandV53Enhancements";'

def patch_page(path: Path):
    if not path.exists():
        return
    backup = path.with_suffix(path.suffix + f".backup-v53-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)
    text = path.read_text(encoding="utf-8")

    if "LifeCommandV53Enhancements" not in text:
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
        text = "\\n".join(lines) + "\\n"

    if "<LifeCommandV53Enhancements" not in text:
        has_page = re.search(r"\\bpage\\b", text) is not None
        has_set_page = "setPage" in text
        props = ' page={page as any} setPage={setPage}' if has_page and has_set_page else ""
        snippet = f"\\n      <LifeCommandV53Enhancements{props} />\\n"
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx != -1:
            text = text[:idx] + snippet + text[idx:]
        else:
            print("warning: </main> not found; injection skipped")

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v53 Memo / Routine-Habit split / AI search boost" not in text:
        text += "\\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

root = Path.cwd()
component = (Path(__file__).resolve().parent / "LifeCommandV53Enhancements.tsx").read_text(encoding="utf-8")
css = (Path(__file__).resolve().parent / "life-v53.css").read_text(encoding="utf-8")
api = (Path(__file__).resolve().parent / "life-ai-search-route.ts").read_text(encoding="utf-8")

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "LifeCommandV53Enhancements.tsx", component)
    write_file(root / "app" / "api" / "life-ai" / "search" / "route.ts", api)
    patch_page(root / "app" / "page.tsx")
    patch_css(root / "app" / "globals.css", css)

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "LifeCommandV53Enhancements.tsx", component)
    write_file(root / "src" / "app" / "api" / "life-ai" / "search" / "route.ts", api)
    patch_page(root / "src" / "app" / "page.tsx")
    patch_css(root / "src" / "app" / "globals.css", css)
