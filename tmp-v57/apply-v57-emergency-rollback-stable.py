#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import runpy

root = Path.cwd()
base = Path(__file__).resolve().parent

tmp_cleanup = root / ".tmp-cleanup-v57.py"
tmp_cleanup.write_text((base / "cleanup-v57.py").read_text(encoding="utf-8"), encoding="utf-8")
try:
    runpy.run_path(str(tmp_cleanup), run_name="__main__")
finally:
    tmp_cleanup.unlink(missing_ok=True)

component = (base / "LifeV57StablePages.tsx").read_text(encoding="utf-8")

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup = path.with_suffix(path.suffix + f".backup-v57-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        shutil.copyfile(path, backup)
        print("backup", backup)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

if (root / "app").exists():
    write_file(root / "app" / "components" / "LifeV57StablePages.tsx", component)
    write_file(root / "app" / "habits" / "page.tsx", (base / "habits-page.tsx").read_text(encoding="utf-8"))
    write_file(root / "app" / "routines" / "page.tsx", (base / "routines-page.tsx").read_text(encoding="utf-8"))
    write_file(root / "app" / "memo-write" / "page.tsx", (base / "memo-write-page.tsx").read_text(encoding="utf-8"))
    write_file(root / "app" / "ai-search" / "page.tsx", (base / "ai-search-page.tsx").read_text(encoding="utf-8"))

if (root / "src" / "app").exists():
    write_file(root / "src" / "app" / "components" / "LifeV57StablePages.tsx", component)
    write_file(root / "src" / "app" / "habits" / "page.tsx", (base / "habits-page.tsx").read_text(encoding="utf-8"))
    write_file(root / "src" / "app" / "routines" / "page.tsx", (base / "routines-page.tsx").read_text(encoding="utf-8"))
    write_file(root / "src" / "app" / "memo-write" / "page.tsx", (base / "memo-write-page.tsx").read_text(encoding="utf-8"))
    write_file(root / "src" / "app" / "ai-search" / "page.tsx", (base / "ai-search-page.tsx").read_text(encoding="utf-8"))

print("v57 stable pages installed")
