#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

IMPORT_LINE = 'import LifeCommandExpansionV65_69, { LifeLevelProV66, SmartQuestionSearchV68, WeeklyReviewV69, TrashHistoryV69 } from "./components/LifeCommandExpansionV65_69";'

def backup(path: Path):
    stamp = datetime.now().strftime("%Y%m%d%H%M%S")
    out = path.with_suffix(path.suffix + f".backup-v65-69-{stamp}")
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

    home_old = '''            {page === "home" && (
              <HomePanel themeKey={themeKey} {...panelProps} />
            )}'''
    home_new = '''            {page === "home" && (
              <>
                <LifeCommandExpansionV65_69 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <HomePanel themeKey={themeKey} {...panelProps} />
              </>
            )}'''
    text = replace_once(text, home_old, home_new, "home daily command")

    today_old = '''            {page === "todaycommand" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.todaycommand} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}'''
    today_new = '''            {page === "todaycommand" && (
              <LifeCommandExpansionV65_69 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}'''
    text = replace_once(text, today_old, today_new, "todaycommand page")

    search_old = '''            {page === "search" && (
              <SecondBrainSearch snapshot={snapshot} setPage={setPage} />
            )}'''
    search_new = '''            {page === "search" && (
              <div className="space-y-4">
                <SmartQuestionSearchV68 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <SecondBrainSearch snapshot={snapshot} setPage={setPage} />
              </div>
            )}'''
    text = replace_once(text, search_old, search_new, "smart search page")

    weekly_old = '''            {page === "weeklyreview" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.weeklyreview} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}'''
    weekly_new = '''            {page === "weeklyreview" && (
              <div className="space-y-4">
                <WeeklyReviewV69 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <LifeModulePanel config={lifeModuleConfigsByKey.weeklyreview} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
              </div>
            )}'''
    text = replace_once(text, weekly_old, weekly_new, "weekly review page")

    life_old = '''            {page === "lifescore" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.lifescore} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}'''
    life_new = '''            {page === "lifescore" && (
              <div className="space-y-4">
                <LifeLevelProV66 snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
                <LifeModulePanel config={lifeModuleConfigsByKey.lifescore} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
              </div>
            )}'''
    text = replace_once(text, life_old, life_new, "lifescore page")

    archive_old = '''            {page === "archive" && (
              <LifeModulePanel config={lifeModuleConfigsByKey.archive} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
            )}'''
    archive_new = '''            {page === "archive" && (
              <div className="space-y-4">
                <TrashHistoryV69 />
                <LifeModulePanel config={lifeModuleConfigsByKey.archive} snapshot={snapshot} setPage={setPage} refreshSnapshot={refreshSnapshot} />
              </div>
            )}'''
    text = replace_once(text, archive_old, archive_new, "archive undo page")

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
component = (base / "LifeCommandExpansionV65_69.tsx").read_text(encoding="utf-8")
route_api = (base / "route-intent-route.ts").read_text(encoding="utf-8")

patched = False

if (root / "app" / "page.tsx").exists():
    write_file(root / "app" / "components" / "LifeCommandExpansionV65_69.tsx", component)
    write_file(root / "app" / "api" / "life" / "route-intent" / "route.ts", route_api)
    patched = patch_page(root / "app" / "page.tsx") or patched

if (root / "src" / "app" / "page.tsx").exists():
    write_file(root / "src" / "app" / "components" / "LifeCommandExpansionV65_69.tsx", component)
    write_file(root / "src" / "app" / "api" / "life" / "route-intent" / "route.ts", route_api)
    patched = patch_page(root / "src" / "app" / "page.tsx") or patched

patch_gitignore(root / ".gitignore")
remove_backup_files(root)

if not patched:
    raise SystemExit("app/page.tsx or src/app/page.tsx was not found")

print("v65-69 full command OS completed")
