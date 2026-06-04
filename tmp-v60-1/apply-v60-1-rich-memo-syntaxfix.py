#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil

def patch_component(path: Path):
    if not path.exists():
        return False

    backup = path.with_suffix(path.suffix + f".backup-v60-1-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    text = path.read_text(encoding="utf-8")
    changed = False

    # v60 build error:
    # `.onerror:` になっていて TypeScript/ECMAScript の構文として壊れていた
    if ".onerror:" in text:
        text = text.replace(".onerror:", "onerror:")
        changed = True

    # 補助モードのoption値が型定義とズレていたので合わせる
    if '<option value="付け足し">補助</option>' in text:
        text = text.replace('<option value="付け足し">補助</option>', '<option value="補助">補助</option>')
        changed = True

    # 念のため SpeechRecognition の error handler 型も存在させる
    if "onerror: (() => void) | null;" not in text and "type SpeechRecognitionLike" in text:
        text = text.replace(
            "  onend: (() => void) | null;\n};",
            "  onend: (() => void) | null;\n  onerror: (() => void) | null;\n};"
        )
        changed = True

    path.write_text(text, encoding="utf-8")
    print(("patched" if changed else "checked"), path)
    print("backup", backup)
    return changed

root = Path.cwd()

targets = [
    root / "app" / "components" / "RichMemoComposerTopV60.tsx",
    root / "src" / "app" / "components" / "RichMemoComposerTopV60.tsx",
]

found = False
for target in targets:
    if target.exists():
        found = True
        patch_component(target)

if not found:
    raise SystemExit("RichMemoComposerTopV60.tsx was not found")

print("v60.1 rich memo syntax fix completed")
