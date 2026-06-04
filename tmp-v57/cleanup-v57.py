#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

BAD_IMPORTS = [
    'import LifeCommandV53Enhancements from "./components/LifeCommandV53Enhancements";',
    'import LifeTopSearchBoostV54 from "./components/LifeTopSearchBoostV54";',
    'import LifeTopAISearchV56 from "./components/LifeTopAISearchV56";',
    'import LifeHabitRoutinePagesV56 from "./components/LifeHabitRoutinePagesV56";',
]

BAD_TAG_PATTERNS = [
    r'\n\s*<LifeCommandV53Enhancements[^>]*/>\s*\n',
    r'\n\s*<LifeTopSearchBoostV54[^>]*/>\s*\n',
    r'\n\s*<LifeTopAISearchV56[^>]*/>\s*\n',
    r'\n\s*<LifeHabitRoutinePagesV56[^>]*/>\s*\n',
    r'\n\s*<div className="life-v55-top-injected">[\s\S]*?</div>\s*\n',
]

CSS = '\n/* ===== v57 emergency rollback stable ===== */\n/* v53-v56で追加した下部/上部の重複UIを非表示。元の画面を優先して戻す。 */\n.life-v53-shell,\n.life-v54-search-overlay,\n.life-v55-top-injected,\n.life-v56-top-ai,\n.life-v56-page {\n  display: none !important;\n  visibility: hidden !important;\n  pointer-events: none !important;\n}\n\n/* 既存メモページを壊さないため、v57は独立ルートに退避 */\n.life-v57-page {\n  min-height: 100vh;\n  padding: 1rem;\n  color: white;\n  background:\n    radial-gradient(circle at 20% 0%, rgba(125, 211, 252, .22), transparent 34%),\n    linear-gradient(135deg, #061225, #172554 54%, #0f172a);\n}\n\n.life-v57-wrap {\n  width: min(100%, 980px);\n  margin: 0 auto 4rem;\n  display: grid;\n  gap: 1rem;\n}\n\n.life-v57-card {\n  border: 1px solid rgba(125,211,252,.22);\n  border-radius: 1.35rem;\n  padding: 1rem;\n  background: rgba(15, 23, 42, .62);\n  box-shadow: 0 18px 50px rgba(2,6,23,.28), inset 0 1px 0 rgba(255,255,255,.1);\n  backdrop-filter: blur(18px) saturate(1.2);\n}\n\n.life-v57-head {\n  display: flex;\n  align-items: flex-start;\n  justify-content: space-between;\n  gap: .8rem;\n}\n\n.life-v57-head p {\n  margin: 0 0 .28rem;\n  font-size: .72rem;\n  letter-spacing: .18em;\n  font-weight: 950;\n  color: rgba(186,230,253,.86);\n}\n\n.life-v57-head h1,\n.life-v57-head h2 {\n  margin: 0;\n  line-height: 1.1;\n  letter-spacing: -.03em;\n}\n\n.life-v57-head small {\n  display: block;\n  margin-top: .35rem;\n  color: rgba(226,232,240,.7);\n  font-weight: 750;\n  line-height: 1.5;\n}\n\n.life-v57-nav {\n  display: flex;\n  flex-wrap: wrap;\n  gap: .5rem;\n}\n\n.life-v57-nav a,\n.life-v57-nav button,\n.life-v57-form button,\n.life-v57-check button,\n.life-v57-routine button,\n.life-v57-search button {\n  border: 0;\n  border-radius: .9rem;\n  padding: .72rem .9rem;\n  font-weight: 950;\n  text-decoration: none;\n  cursor: pointer;\n}\n\n.life-v57-nav a,\n.life-v57-nav button {\n  color: rgba(226,232,240,.88);\n  background: rgba(255,255,255,.08);\n  border: 1px solid rgba(255,255,255,.1);\n}\n\n.life-v57-form {\n  display: grid;\n  gap: .65rem;\n  margin-top: .9rem;\n}\n\n.life-v57-form input,\n.life-v57-form textarea,\n.life-v57-search input {\n  width: 100%;\n  border: 1px solid rgba(125,211,252,.22);\n  border-radius: 1rem;\n  background: rgba(2,6,23,.38);\n  color: white;\n  padding: .85rem .95rem;\n  font-weight: 850;\n  outline: none;\n}\n\n.life-v57-form textarea {\n  resize: vertical;\n  min-height: 9rem;\n  line-height: 1.6;\n}\n\n.life-v57-form button,\n.life-v57-check button,\n.life-v57-routine button,\n.life-v57-search button.primary {\n  color: #061225;\n  background: linear-gradient(135deg, #bae6fd, #a7f3d0);\n}\n\n.life-v57-toast {\n  border-radius: .9rem;\n  padding: .65rem .8rem;\n  color: #d1fae5;\n  background: rgba(16,185,129,.13);\n  border: 1px solid rgba(52,211,153,.22);\n  font-weight: 950;\n}\n\n.life-v57-grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0,1fr));\n  gap: .75rem;\n}\n\n.life-v57-check,\n.life-v57-routine,\n.life-v57-result {\n  border-radius: 1.1rem;\n  padding: .85rem;\n  background: rgba(2,6,23,.28);\n  border: 1px solid rgba(255,255,255,.1);\n}\n\n.life-v57-check-title {\n  display: grid;\n  grid-template-columns: auto 1fr;\n  gap: .6rem;\n  align-items: center;\n}\n\n.life-v57-check-title span,\n.life-v57-routine-title span {\n  width: 2.35rem;\n  height: 2.35rem;\n  display: grid;\n  place-items: center;\n  border-radius: .9rem;\n  background: rgba(255,255,255,.08);\n}\n\n.life-v57-check-title b,\n.life-v57-routine-title b {\n  display: block;\n}\n\n.life-v57-check-title small,\n.life-v57-routine-title small {\n  color: rgba(226,232,240,.62);\n  font-weight: 800;\n}\n\n.life-v57-week {\n  display: grid;\n  grid-template-columns: repeat(7, 1fr);\n  gap: .32rem;\n  margin: .7rem 0;\n}\n\n.life-v57-week em {\n  height: 1.9rem;\n  display: grid;\n  place-items: center;\n  border-radius: .65rem;\n  background: rgba(255,255,255,.06);\n  color: rgba(226,232,240,.55);\n  font-size: .72rem;\n  font-style: normal;\n  font-weight: 950;\n}\n\n.life-v57-week em.on {\n  color: #052e2b;\n  background: linear-gradient(135deg, #67e8f9, #86efac);\n}\n\n.life-v57-routines {\n  display: grid;\n  gap: .75rem;\n}\n\n.life-v57-routine-title {\n  display: grid;\n  grid-template-columns: auto 1fr auto;\n  gap: .65rem;\n  align-items: center;\n  width: 100%;\n  background: transparent;\n  color: white;\n  border: 0;\n  padding: 0;\n  text-align: left;\n}\n\n.life-v57-routine ol {\n  margin: .75rem 0 0;\n  color: rgba(226,232,240,.76);\n  line-height: 1.75;\n  font-weight: 800;\n}\n\n.life-v57-search {\n  display: grid;\n  grid-template-columns: 1fr auto;\n  gap: .55rem;\n  margin-top: .9rem;\n}\n\n.life-v57-chips {\n  display: flex;\n  flex-wrap: wrap;\n  gap: .45rem;\n  margin-top: .65rem;\n}\n\n.life-v57-chips button {\n  color: rgba(226,232,240,.88);\n  background: rgba(255,255,255,.08);\n  border: 1px solid rgba(255,255,255,.1);\n}\n\n.life-v57-result {\n  margin-top: .8rem;\n}\n\n.life-v57-result h3 {\n  margin: 0 0 .65rem;\n  line-height: 1.5;\n}\n\n.life-v57-result ul {\n  margin: .65rem 0 0;\n  padding-left: 1.1rem;\n  color: rgba(226,232,240,.76);\n  line-height: 1.6;\n}\n\n@media (max-width: 767px) {\n  .life-v57-page {\n    padding: .75rem;\n  }\n  .life-v57-grid,\n  .life-v57-search {\n    grid-template-columns: 1fr;\n  }\n  .life-v57-head {\n    flex-direction: column;\n  }\n}\n'

def restore_backup_if_available(path: Path) -> bool:
    candidates = []
    for tag in ["backup-v53-", "backup-v54-", "backup-v55-", "backup-v56-"]:
        candidates.extend(path.parent.glob(path.name + "." + tag + "*"))
    if not candidates:
        return False

    v53 = [p for p in candidates if ".backup-v53-" in p.name]
    chosen = sorted(v53 or candidates, key=lambda p: p.stat().st_mtime)[0]

    current_backup = path.with_suffix(path.suffix + f".broken-v57-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, current_backup)
    shutil.copyfile(chosen, path)
    print(f"restored {path} from {chosen}")
    print(f"current broken backup: {current_backup}")
    return True

def clean_page(path: Path):
    if not path.exists():
        return

    restore_backup_if_available(path)
    backup = path.with_suffix(path.suffix + f".backup-v57-clean-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    text = path.read_text(encoding="utf-8")
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    for line in BAD_IMPORTS:
        text = text.replace(line + "\n", "")
        text = text.replace(line, "")

    for pattern in BAD_TAG_PATTERNS:
        text = re.sub(pattern, "\n", text)

    path.write_text(text, encoding="utf-8")
    print("cleaned page", path)
    print("backup", backup)

def patch_css(path: Path):
    if not path.exists():
        return
    backup = path.with_suffix(path.suffix + f".backup-v57-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)
    text = path.read_text(encoding="utf-8")
    if "v57 emergency rollback stable" not in text:
        text += CSS
    path.write_text(text, encoding="utf-8")
    print("patched css", path)
    print("backup", backup)

root = Path.cwd()

for page in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    clean_page(page)

for css_path in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(css_path)

print("v57 emergency rollback completed")
