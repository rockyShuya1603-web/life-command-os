#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

IMPORT_LINE = 'import LifeLevelGachaV52 from "./components/LifeLevelGachaV52";'

def patch_page(path: Path):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    backup = path.with_suffix(path.suffix + f".backup-v52-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    if "LifeLevelGachaV52" not in text:
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
        text = "\n".join(lines) + "\n"

    if "<LifeLevelGachaV52 />" not in text:
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx != -1:
            text = text[:idx] + "\n      <LifeLevelGachaV52 />\n" + text[idx:]

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v52 Life Level / Routine / Reading Gacha" not in text:
        text += "\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

def write_component(root: Path, relative: str, component: str):
    path = root / relative
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(component, encoding="utf-8")
    print("wrote", path)

root = Path.cwd()
component = (Path(__file__).resolve().parent / "LifeLevelGachaV52.tsx").read_text(encoding="utf-8")
css = (Path(__file__).resolve().parent / "life-v52.css").read_text(encoding="utf-8")

if (root / "app" / "page.tsx").exists():
    write_component(root, "app/components/LifeLevelGachaV52.tsx", component)
    patch_page(root / "app" / "page.tsx")
    patch_css(root / "app" / "globals.css", css)

if (root / "src" / "app" / "page.tsx").exists():
    write_component(root, "src/app/components/LifeLevelGachaV52.tsx", component)
    patch_page(root / "src" / "app" / "page.tsx")
    patch_css(root / "src" / "app" / "globals.css", css)
