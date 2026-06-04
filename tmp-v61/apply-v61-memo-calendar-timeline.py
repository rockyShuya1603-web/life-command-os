#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_MEMO = 'import RichMemoComposerTopV61 from "./components/RichMemoComposerTopV61";'
IMPORT_CAL = 'import CalendarTimelineV61 from "./components/CalendarTimelineV61";'

OLD_IMPORTS = [
    'import MemoComposerTopV58 from "./components/MemoComposerTopV58";',
    'import RichMemoComposerTopV60 from "./components/RichMemoComposerTopV60";',
    'import RichMemoComposerTopV61 from "./components/RichMemoComposerTopV61";',
    'import CalendarTimelineV61 from "./components/CalendarTimelineV61";',
]

OLD_PATTERNS = [
    r'\n\s*<MemoComposerTopV58[^>]*/>\s*\n',
    r'\n\s*<RichMemoComposerTopV60[^>]*/>\s*\n',
    r'\n\s*<RichMemoComposerTopV61[^>]*/>\s*\n',
    r'\n\s*<CalendarTimelineV61[^>]*/>\s*\n',
    r'\n\s*<div className="memo-v58-injected">[\s\S]*?</div>\s*\n',
    r'\n\s*<div className="rich-memo-v60-injected">[\s\S]*?</div>\s*\n',
    r'\n\s*<div className="life-v61-injected">[\s\S]*?</div>\s*\n',
]

def ensure_imports(text: str) -> str:
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

    for import_line in [IMPORT_MEMO, IMPORT_CAL]:
        if import_line not in lines:
            lines.insert(insert_at, import_line)
            insert_at += 1

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
    page_prop = ' page={page as any}' if has_page else ""
    return "\n      <div className=\"life-v61-injected\">\n        <RichMemoComposerTopV61" + page_prop + " />\n        <CalendarTimelineV61" + page_prop + " />\n      </div>\n"

def patch_page(path: Path):
    if not path.exists():
        return False

    backup = path.with_suffix(path.suffix + f".backup-v61-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    text = path.read_text(encoding="utf-8")

    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = cleanup_old(text)
    text = ensure_imports(text)
    injection = build_injection(text)

    main_match = re.search(r"<main\b[^>]*>", text)
    if main_match:
        text = text[:main_match.end()] + injection + text[main_match.end():]
        print("inserted v61 portals after <main>", path)
    else:
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx == -1:
            raise RuntimeError(f"main tag was not found in {path}")
        text = text[:idx] + injection + text[idx:]
        print("inserted v61 portals before </main> fallback", path)

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)
    return True

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup = path.with_suffix(path.suffix + f".backup-v61-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        shutil.copyfile(path, backup)
        print("backup", backup)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v61 memo placement + calendar timeline" not in text:
        text += "\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent
memo = (base / "RichMemoComposerTopV61.tsx").read_text(encoding="utf-8")
calendar = (base / "CalendarTimelineV61.tsx").read_text(encoding="utf-8")
api = (base / "memo-assist-route.ts").read_text(encoding="utf-8")
timeline_page = (base / "timeline-page.tsx").read_text(encoding="utf-8")
css = (base / "life-v61.css").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "RichMemoComposerTopV61.tsx", memo)
    write_file(root / "app" / "components" / "CalendarTimelineV61.tsx", calendar)
    write_file(root / "app" / "api" / "memo" / "assist" / "route.ts", api)
    write_file(root / "app" / "timeline" / "page.tsx", timeline_page)
    write_file(root / "app" / "calendar-pro" / "page.tsx", timeline_page)
    patched = patch_page(root / "app" / "page.tsx") or patched
    patch_css(root / "app" / "globals.css", css)

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "RichMemoComposerTopV61.tsx", memo)
    write_file(root / "src" / "app" / "components" / "CalendarTimelineV61.tsx", calendar)
    write_file(root / "src" / "app" / "api" / "memo" / "assist" / "route.ts", api)
    write_file(root / "src" / "app" / "timeline" / "page.tsx", timeline_page)
    write_file(root / "src" / "app" / "calendar-pro" / "page.tsx", timeline_page)
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched
    patch_css(root / "src" / "app" / "globals.css", css)

if not patched:
    raise SystemExit("page.tsx was not found")

print("v61 memo calendar timeline completed")
