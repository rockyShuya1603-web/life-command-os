#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

def backup(path: Path, root: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    rel = path.relative_to(root)
    out = root / ".life-backups" / "v73" / f"{str(rel).replace('/', '__')}.backup-{stamp}"
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, out)
    print("backup", out)

def write_file(path: Path, content: str, root: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup(path, root)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_events_table(path: Path, root: Path):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    before = text
    text = text.replace('.from("events")', '.from("calendar_events")')
    text = text.replace(".from('events')", ".from('calendar_events')")
    if text != before:
        backup(path, root)
        path.write_text(text, encoding="utf-8")
        print("fixed events table", path)

def patch_gitignore(path: Path):
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    adds = [line for line in [".life-backups/", "*.backup-*", "app/*.backup-*", "src/app/*.backup-*"] if line not in text]
    if adds:
        path.write_text(text.rstrip() + "\n" + "\n".join(adds) + "\n", encoding="utf-8")
        print("patched", path)

root = Path.cwd()
base = Path(__file__).resolve().parent
component = (base / "CalendarTodoPhotoFixV72.tsx").read_text(encoding="utf-8")
route = (base / "photo-extract-route-v73.ts").read_text(encoding="utf-8")

targets = []
if (root / "app" / "page.tsx").exists():
    targets.append(root / "app")
if (root / "src" / "app" / "page.tsx").exists():
    targets.append(root / "src" / "app")

if not targets:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

for appdir in targets:
    write_file(appdir / "components" / "CalendarTodoPhotoFixV72.tsx", component, root)
    write_file(appdir / "api" / "calendar" / "photo-extract" / "route.ts", route, root)
    patch_events_table(appdir / "page.tsx", root)
    for comp in (appdir / "components").glob("*.tsx"):
        patch_events_table(comp, root)

patch_gitignore(root / ".gitignore")

print("v73 force calendar TODO/photo completed")
