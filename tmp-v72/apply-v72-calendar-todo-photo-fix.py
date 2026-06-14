#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_LINE = 'import { PhotoCalendarImportV72, CalendarTodoTimelineV72 } from "./components/CalendarTodoPhotoFixV72";'

def backup(path: Path, root: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    rel = path.relative_to(root)
    out = root / ".life-backups" / "v72" / f"{str(rel).replace('/', '__')}.backup-{stamp}"
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, out)
    print("backup", out)

def write_file(path: Path, content: str, root: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup(path, root)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def ensure_import(text: str):
    if IMPORT_LINE in text:
        return text
    lines = text.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1
    lines.insert(insert_at, IMPORT_LINE)
    return "\n".join(lines) + "\n"

def patch_page(path: Path, root: Path):
    if not path.exists():
        return False
    backup(path, root)
    text = path.read_text(encoding="utf-8")
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = ensure_import(text)
    text = re.sub(r'\n\s*<PhotoCalendarImportV6[0-9][^>]*/>\s*', "\n", text)
    text = re.sub(r'\n\s*<CalendarTimelineInlineV6[0-9][^>]*/>\s*', "\n", text)
    text = re.sub(r'\n\s*<CalendarTodoTimelineV72[^>]*/>\s*', "\n", text)

    pattern = re.compile(r'(?P<indent>\s*)<CalendarQuickAddPanel[^>]*/>\s*')
    m = pattern.search(text)
    if not m:
        raise RuntimeError("CalendarQuickAddPanel line was not found")

    quick = m.group(0)
    indent = m.group("indent")
    insert = (
        quick
        + f'{indent}<PhotoCalendarImportV72 refreshSnapshot={{refreshSnapshot}} setSelected={{setSelected}} />\n'
        + f'{indent}<CalendarTodoTimelineV72 events={{snapshot?.events || []}} todos={{snapshot?.todos || []}} selected={{selected}} setSelected={{setSelected}} refreshSnapshot={{refreshSnapshot}} />\n'
    )
    text = text[:m.start()] + insert + text[m.end():]
    path.write_text(text, encoding="utf-8")
    print("patched", path)
    return True

def patch_gitignore(path: Path):
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    adds = [line for line in [".life-backups/", "*.backup-*", "app/*.backup-*", "src/app/*.backup-*"] if line not in text]
    if adds:
        path.write_text(text.rstrip() + "\n" + "\n".join(adds) + "\n", encoding="utf-8")
        print("patched", path)

def remove_old_backup_files(root: Path):
    for pattern in ["app/*.backup-*", "src/app/*.backup-*"]:
        for p in root.glob(pattern):
            try:
                p.unlink()
                print("removed old backup file", p)
            except FileNotFoundError:
                pass

root = Path.cwd()
base = Path(__file__).resolve().parent
component = (base / "CalendarTodoPhotoFixV72.tsx").read_text(encoding="utf-8")
route = (base / "photo-extract-route-v72.ts").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "CalendarTodoPhotoFixV72.tsx", component, root)
    write_file(root / "app" / "api" / "calendar" / "photo-extract" / "route.ts", route, root)
    patched = patch_page(root / "app" / "page.tsx", root) or patched

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "CalendarTodoPhotoFixV72.tsx", component, root)
    write_file(root / "src" / "app" / "api" / "calendar" / "photo-extract" / "route.ts", route, root)
    patched = patch_page(root / "src" / "app" / "page.tsx", root) or patched

patch_gitignore(root / ".gitignore")
remove_old_backup_files(root)

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v72 calendar TODO/photo fix completed")
