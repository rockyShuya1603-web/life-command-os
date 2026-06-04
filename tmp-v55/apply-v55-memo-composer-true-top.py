#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re
import shutil

IMPORT_V53 = 'import LifeCommandV53Enhancements from "./components/LifeCommandV53Enhancements";'
IMPORT_SEARCH = 'import LifeTopSearchBoostV54 from "./components/LifeTopSearchBoostV54";'

CSS = r"""

/* ===== v55 memo composer true top fix ===== */
.life-v55-top-injected {
  order: -2147483647 !important;
}

.life-v54-top-slot,
.life-v54-memo-first,
.life-v53-shell[data-life-v53] {
  order: -2147483647 !important;
}

/* メモページ上部で余白が大きくならないように調整 */
.life-v55-top-injected .life-v53-shell,
.life-v54-top-slot.life-v53-shell {
  margin-top: 0 !important;
  margin-bottom: 1rem !important;
}

/* 万一、既存ページ側に並び順指定があってもメモ入力を先頭へ */
.life-v54-memo-first {
  margin-top: 0 !important;
}

@media (max-width: 767px) {
  .life-v55-top-injected .life-v53-shell,
  .life-v54-top-slot.life-v53-shell {
    margin-top: .25rem !important;
    margin-bottom: .85rem !important;
  }
}
"""

def ensure_import(text: str, line: str) -> str:
    if line in text:
        return text

    lines = text.splitlines()
    insert_at = 0

    for i, current in enumerate(lines):
        if current.startswith("import "):
            insert_at = i + 1

    if insert_at == 0:
        for i, current in enumerate(lines):
            if current.strip() in ['"use client";', "'use client';"]:
                insert_at = i + 1
                break

    lines.insert(insert_at, line)
    return "\n".join(lines) + "\n"

def remove_previous_component_tags(text: str) -> str:
    # v53/v54で末尾や途中に入った既存タグを全部抜いて、v55でmain直下に入れ直す
    patterns = [
        r'\n\s*<LifeTopSearchBoostV54[^>]*/>\s*\n',
        r'\n\s*<LifeCommandV53Enhancements[^>]*/>\s*\n',
        r'\n\s*<div className="life-v55-top-injected">[\s\S]*?</div>\s*\n',
    ]
    for pattern in patterns:
        text = re.sub(pattern, "\n", text)
    return text

def build_injection(text: str) -> str:
    has_page = re.search(r"\bpage\b", text) is not None
    has_set_page = "setPage" in text

    memo_props = ' page={page as any} setPage={setPage}' if has_page and has_set_page else ""
    search_props = ' setPage={setPage}' if has_set_page else ""

    return f"""
      <div className="life-v55-top-injected">
        <LifeTopSearchBoostV54{search_props} />
        <LifeCommandV53Enhancements{memo_props} />
      </div>
"""

def patch_page(path: Path):
    if not path.exists():
        return

    backup = path.with_suffix(path.suffix + f".backup-v55-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    text = path.read_text(encoding="utf-8")

    # 以前の \\n 文字列化バグ対策
    if "\\n" in text[:300] and text.count("\n") < 5:
        text = text.replace("\\n", "\n")

    text = ensure_import(text, IMPORT_V53)
    text = ensure_import(text, IMPORT_SEARCH)
    text = remove_previous_component_tags(text)

    injection = build_injection(text)

    # v54のバグ原因： r"<main\\\\b" になっていてmain検出に失敗していた。
    # v55では正しく <main ...> の直後へ入れる。
    main_match = re.search(r"<main\b[^>]*>", text)

    if main_match:
        text = text[:main_match.end()] + injection + text[main_match.end():]
        print("inserted after <main>", path)
    else:
        # mainが見つからない場合だけ最後の手段で閉じmain直前
        idx = text.rfind("    </main>")
        if idx == -1:
            idx = text.rfind("</main>")
        if idx != -1:
            text = text[:idx] + injection + text[idx:]
            print("inserted before </main> fallback", path)
        else:
            raise RuntimeError(f"main tag was not found in {path}")

    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)

def patch_css(path: Path):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v55 memo composer true top fix" not in text:
        text += "\n" + CSS
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("css already patched", path)

root = Path.cwd()

patched_any = False
for page_path in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    if page_path.exists():
        patch_page(page_path)
        patched_any = True

for css_path in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(css_path)

if not patched_any:
    raise SystemExit("page.tsx was not found")

print("v55 memo composer true top fix completed")
