#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_LINE = 'import HomeOrganizerV71 from "./components/HomeOrganizerV71";'

NEW_HOME_BLOCK = '''            {page === "home" && (
              <div className="space-y-4">
                <HomeOrganizerV71 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <details className="rounded-[1.4rem] border border-white/10 bg-black/25 p-4 text-white shadow-xl backdrop-blur-xl">
                  <summary className="cursor-pointer text-sm font-black text-white/70">
                    従来ホームの詳細パネルを開く
                  </summary>
                  <div className="mt-4">
                    <HomePanel themeKey={themeKey} {...panelProps} />
                  </div>
                </details>
              </div>
            )}'''

def backup(path: Path, root: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    rel = path.relative_to(root)
    out = root / ".life-backups" / "v71" / f"{str(rel).replace('/', '__')}.backup-{stamp}"
    out.parent.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, out)
    print("backup", out)

def write_file(path: Path, content: str, root: Path):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup(path, root)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def ensure_import(text: str) -> str:
    if IMPORT_LINE in text:
        return text
    lines = text.splitlines()
    insert_at = 0
    for i, line in enumerate(lines):
        if line.startswith("import "):
            insert_at = i + 1
    lines.insert(insert_at, IMPORT_LINE)
    return "\n".join(lines) + "\n"

def replace_home_block(text: str) -> str:
    pattern = re.compile(r'            \{page === "home" && \([\s\S]*?\n            \)\}', re.MULTILINE)
    matches = list(pattern.finditer(text))
    if not matches:
        raise RuntimeError('home page render block was not found')
    match = matches[0]
    old = match.group(0)
    print("old home block length", len(old))
    return text[:match.start()] + NEW_HOME_BLOCK + text[match.end():]

def patch_page(path: Path, root: Path) -> bool:
    if not path.exists():
        return False
    backup(path, root)
    text = path.read_text(encoding="utf-8")
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")
    text = ensure_import(text)
    text = replace_home_block(text)
    path.write_text(text, encoding="utf-8")
    print("patched", path)
    return True

def patch_gitignore(path: Path):
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    adds = []
    for line in [".life-backups/", "*.backup-*", "app/*.backup-*", "src/app/*.backup-*"]:
        if line not in text:
            adds.append(line)
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
component = (base / "HomeOrganizerV71.tsx").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "HomeOrganizerV71.tsx", component, root)
    patched = patch_page(root / "app" / "page.tsx", root) or patched

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "HomeOrganizerV71.tsx", component, root)
    patched = patch_page(root / "src" / "app" / "page.tsx", root) or patched

patch_gitignore(root / ".gitignore")
remove_old_backup_files(root)

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v71 clean home dashboard completed")
