#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

IMPORT_LINE = 'import MemoLifeOSExpansionV70 from "./components/MemoLifeOSExpansionV70";'

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v70-{stamp}")
    shutil.copyfile(path, out)
    print("backup", out)

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    if path.exists():
        backup(path)
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

def replace_once(text: str, old: str, new: str, label: str) -> str:
    if new in text:
        print(label, "already patched")
        return text
    if old not in text:
        print(label, "anchor not found")
        return text
    print(label, "patched")
    return text.replace(old, new, 1)

def patch_page(path: Path) -> bool:
    if not path.exists():
        return False
    backup(path)
    text = path.read_text(encoding="utf-8")
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = ensure_import(text)

    home_v65_old = '''            {page === "home" && (
              <>
                <LifeCommandExpansionV65_69 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <HomePanel themeKey={themeKey} {...panelProps} />
              </>
            )}'''
    home_v65_new = '''            {page === "home" && (
              <>
                <MemoLifeOSExpansionV70 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} variant="home" />
                <LifeCommandExpansionV65_69 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <HomePanel themeKey={themeKey} {...panelProps} />
              </>
            )}'''

    home_basic_old = '''            {page === "home" && (
              <HomePanel themeKey={themeKey} {...panelProps} />
            )}'''
    home_basic_new = '''            {page === "home" && (
              <>
                <MemoLifeOSExpansionV70 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} variant="home" />
                <HomePanel themeKey={themeKey} {...panelProps} />
              </>
            )}'''

    if home_v65_old in text:
        text = replace_once(text, home_v65_old, home_v65_new, "home v70 before v65")
    else:
        text = replace_once(text, home_basic_old, home_basic_new, "home v70 basic")

    memo_old = '            {page === "memos" && <MemosPanel {...panelProps} />}'
    memo_new = '''            {page === "memos" && (
              <div className="space-y-4">
                <MemoLifeOSExpansionV70 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} variant="memo" />
                <MemosPanel {...panelProps} />
              </div>
            )}'''
    text = replace_once(text, memo_old, memo_new, "memos v70")

    braindump_old = '''            {page === "braindump" && (
              <BrainDumpPanel
                refreshSnapshot={refreshSnapshot}
                setPage={setPage}
              />
            )}'''
    braindump_new = '''            {page === "braindump" && (
              <div className="space-y-4">
                <MemoLifeOSExpansionV70 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} variant="memo" />
                <BrainDumpPanel
                  refreshSnapshot={refreshSnapshot}
                  setPage={setPage}
                />
              </div>
            )}'''
    text = replace_once(text, braindump_old, braindump_new, "braindump v70")

    path.write_text(text, encoding="utf-8")
    print("patched", path)
    return True

def patch_gitignore(path: Path):
    text = path.read_text(encoding="utf-8") if path.exists() else ""
    adds = []
    for line in ["*.backup-*", "app/*.backup-*", "src/app/*.backup-*"]:
        if line not in text:
            adds.append(line)
    if adds:
        path.write_text(text.rstrip() + "\n" + "\n".join(adds) + "\n", encoding="utf-8")
        print("patched", path)

def remove_backup_files(root: Path):
    for pattern in ["app/*.backup-*", "src/app/*.backup-*"]:
        for p in root.glob(pattern):
            try:
                p.unlink()
                print("removed backup file", p)
            except FileNotFoundError:
                pass

root = Path.cwd()
base = Path(__file__).resolve().parent
component = (base / "MemoLifeOSExpansionV70.tsx").read_text(encoding="utf-8")
route_api = (base / "memo-organize-v70-route.ts").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "MemoLifeOSExpansionV70.tsx", component)
    write_file(root / "app" / "api" / "life" / "memo-organize-v70" / "route.ts", route_api)
    patched = patch_page(root / "app" / "page.tsx") or patched

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "MemoLifeOSExpansionV70.tsx", component)
    write_file(root / "src" / "app" / "api" / "life" / "memo-organize-v70" / "route.ts", route_api)
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched

patch_gitignore(root / ".gitignore")
remove_backup_files(root)

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v70 AI organizer memory future completed")
