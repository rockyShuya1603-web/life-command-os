#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_MEMO = 'import UnifiedMemoV62 from "./components/UnifiedMemoV62";'
IMPORT_CAL = 'import CalendarTimelineV62 from "./components/CalendarTimelineV62";'

OLD_IMPORTS = [
    'import MemoComposerTopV58 from "./components/MemoComposerTopV58";',
    'import RichMemoComposerTopV60 from "./components/RichMemoComposerTopV60";',
    'import RichMemoComposerTopV61 from "./components/RichMemoComposerTopV61";',
    'import CalendarTimelineV61 from "./components/CalendarTimelineV61";',
    'import UnifiedMemoV62 from "./components/UnifiedMemoV62";',
    'import CalendarTimelineV62 from "./components/CalendarTimelineV62";',
]

OLD_PATTERNS = [
    r'\n\s*<MemoComposerTopV58[^>]*/>\s*\n',
    r'\n\s*<RichMemoComposerTopV60[^>]*/>\s*\n',
    r'\n\s*<RichMemoComposerTopV61[^>]*/>\s*\n',
    r'\n\s*<CalendarTimelineV61[^>]*/>\s*\n',
    r'\n\s*<UnifiedMemoV62[^>]*/>\s*\n',
    r'\n\s*<CalendarTimelineV62[^>]*/>\s*\n',
    r'\n\s*<div className="memo-v58-injected">[\s\S]*?</div>\s*\n',
    r'\n\s*<div className="rich-memo-v60-injected">[\s\S]*?</div>\s*\n',
    r'\n\s*<div className="life-v61-injected">[\s\S]*?</div>\s*\n',
    r'\n\s*<div className="life-v62-injected">[\s\S]*?</div>\s*\n',
]

def cleanup_old(text: str) -> str:
    for old in OLD_IMPORTS:
        text = text.replace(old + "\n", "")
        text = text.replace(old, "")
    for pattern in OLD_PATTERNS:
        text = re.sub(pattern, "\n", text)
    return text

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

def build_injection(text: str) -> str:
    has_page = re.search(r"\bpage\b", text) is not None
    prop = ' page={page as any}' if has_page else ""
    return "\n      <div className=\"life-v62-injected\">\n        <UnifiedMemoV62" + prop + " />\n        <CalendarTimelineV62" + prop + " />\n      </div>\n"

def patch_page(path: Path):
    if not path.exists():
        return False
    backup = path.with_suffix(path.suffix + f".backup-v62-{datetime.now().strftime('%Y%m%d%H%M%S')}")
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
        print("inserted v62 portals after <main>", path)
    else:
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx == -1:
            raise RuntimeError(f"main tag was not found in {path}")
        text = text[:idx] + injection + text[idx:]
        print("inserted v62 portals before </main> fallback", path)
    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)
    return True

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup = path.with_suffix(path.suffix + f".backup-v62-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        shutil.copyfile(path, backup)
        print("backup", backup)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_css(path: Path, css: str):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v62 unified memo + calendar anchor" not in text:
        text += "\n" + css
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent

files = {
    "UnifiedMemoV62.tsx": (base / "UnifiedMemoV62.tsx").read_text(encoding="utf-8"),
    "CalendarTimelineV62.tsx": (base / "CalendarTimelineV62.tsx").read_text(encoding="utf-8"),
    "memo-assist-route.ts": (base / "memo-assist-route.ts").read_text(encoding="utf-8"),
    "timeline-page.tsx": (base / "timeline-page.tsx").read_text(encoding="utf-8"),
    "life-v62.css": (base / "life-v62.css").read_text(encoding="utf-8"),
}

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "UnifiedMemoV62.tsx", files["UnifiedMemoV62.tsx"])
    write_file(root / "app" / "components" / "CalendarTimelineV62.tsx", files["CalendarTimelineV62.tsx"])
    write_file(root / "app" / "api" / "memo" / "assist" / "route.ts", files["memo-assist-route.ts"])
    write_file(root / "app" / "timeline" / "page.tsx", files["timeline-page.tsx"])
    write_file(root / "app" / "calendar-pro" / "page.tsx", files["timeline-page.tsx"])
    patched = patch_page(root / "app" / "page.tsx") or patched
    patch_css(root / "app" / "globals.css", files["life-v62.css"])

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "UnifiedMemoV62.tsx", files["UnifiedMemoV62.tsx"])
    write_file(root / "src" / "app" / "components" / "CalendarTimelineV62.tsx", files["CalendarTimelineV62.tsx"])
    write_file(root / "src" / "app" / "api" / "memo" / "assist" / "route.ts", files["memo-assist-route.ts"])
    write_file(root / "src" / "app" / "timeline" / "page.tsx", files["timeline-page.tsx"])
    write_file(root / "src" / "app" / "calendar-pro" / "page.tsx", files["timeline-page.tsx"])
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched
    patch_css(root / "src" / "app" / "globals.css", files["life-v62.css"])

if not patched:
    raise SystemExit("page.tsx was not found")

print("v62 unified memo and calendar anchor completed")
