#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

def patch_file(path: Path):
    if not path.exists():
        return False

    text = path.read_text(encoding="utf-8")
    backup = path.with_suffix(path.suffix + f".backup-v54-1-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    changed = False

    # v54で updatedAt が optional になっていて、addLog() の戻り型 LifeState と
    # let next の推論型が噛み合わず TypeScript が落ちるため、必須に戻す。
    replacements = {
        "updatedAt?: string;": "updatedAt: string;",
        "updatedAt?: string | undefined;": "updatedAt: string;",
    }
    for old, new in replacements.items():
        if old in text:
            text = text.replace(old, new)
            changed = True

    # addLogの戻り値が常に updatedAt を持つことを明示
    old_addlog = """function addLog(state: LifeState, log: string): LifeState {
  return { ...state, recentLogs: [`${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ${log}`, ...state.recentLogs].slice(0, 8), updatedAt: new Date().toISOString() };
}"""
    new_addlog = """function addLog(state: LifeState, log: string): LifeState {
  const next: LifeState = {
    ...state,
    recentLogs: [`${new Date().toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })} ${log}`, ...state.recentLogs].slice(0, 8),
    updatedAt: new Date().toISOString(),
  };
  return next;
}"""
    if old_addlog in text:
        text = text.replace(old_addlog, new_addlog)
        changed = True

    path.write_text(text, encoding="utf-8")
    print(("patched" if changed else "checked"), path)
    print("backup", backup)
    return changed

root = Path.cwd()

targets = [
    root / "app" / "components" / "LifeLevelGachaV52.tsx",
    root / "src" / "app" / "components" / "LifeLevelGachaV52.tsx",
]

found = False
for target in targets:
    if target.exists():
        found = True
        patch_file(target)

if not found:
    print("LifeLevelGachaV52.tsx was not found in app/components or src/app/components")
    raise SystemExit(1)

print("v54.1 typefix completed")
