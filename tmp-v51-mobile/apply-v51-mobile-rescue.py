#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import re
import shutil

BAD_MARKERS = [
    "HARD FIX: only one mobile bottom nav",
    "HARD FIX: final single mobile bottom nav",
    "v39 mobile UI based on reference image",
    "v40 mobile UI polish + home image button",
    "v41 mobile unified UI / reference image direction",
    "v42 mobile proportion fix / closer to ideal",
    "v43 mobile UI real fix: readable compact smartphone layout",
    "v44 mobile compact fix: stop tall layout + suppress duplicate mobile blocks",
    "v45 mobile duplicate header fix + compact home + AI entry polish",
    "v46 mobile rollback compact fix",
    "v47 mobile clean repair",
    "v48 mobile header/nav/autosync fix",
    "v49 mobile header/nav/quickadd/autosync fix",
]

CSS = r"""

/* ===== v51 mobile rescue: fixed nav, clean header, drawer, quick add, visible cards ===== */
@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden !important;
  }

  main {
    overflow-x: hidden !important;
    padding-bottom: calc(6.8rem + env(safe-area-inset-bottom)) !important;
  }

  /* 旧ナビ/旧QuickAddを完全に隠して、v51だけ使う */
  #hard-mobile-nav,
  #life-mobile-nav-v41,
  #life-mobile-nav-v42,
  #life-mobile-nav-v43,
  #image-mobile-nav-v40,
  #image-mobile-nav-v39,
  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #life-floating-quickadd-v48,
  #life-floating-quickadd-v49,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39,
  nav[aria-label="スマホ下部ナビ"],
  nav[aria-label="Mobile bottom navigation"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* 検索欄付近で重なっている右上アイコン/手動同期/ユーザー系をスマホでは非表示 */
  .future-top-hud .future-hud-widgets,
  .future-top-hud .future-icon-button,
  .future-top-hud .future-avatar,
  .future-mode-row,
  .future-clock-chip,
  .future-weather-chip,
  .future-sync-row,
  .future-sync-panel,
  .mobile-sync-row,
  .mobile-sync-panel,
  .manual-sync-row,
  .manual-sync-button,
  .user-mini-card,
  .mobile-user-card,
  .mobile-profile-card,
  .quick-sync-card,
  .sync-status-card,
  .sync-mini-card {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* 既存の全ページ一覧ボタンが大きく出る場合は消して、v51のdetailsだけ使う */
  .life-page-drawer-toggle,
  .home-page-drawer-toggle,
  .mobile-page-drawer-toggle,
  .future-page-drawer-toggle {
    display: none !important;
  }

  .future-search-pill + .future-search-pill,
  .future-top-hud + .future-top-hud,
  .home-top-head + .home-top-head,
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card {
    display: none !important;
  }

  /* 上部ヘッダーは名前と検索だけをきれいに表示 */
  .future-top-hud {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .62rem !important;
    margin: 0 0 .72rem !important;
    padding: .42rem .2rem .25rem !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .future-brand-lockup {
    width: 100% !important;
    min-width: 0 !important;
    padding-left: 2.85rem !important;
  }

  .future-brand-lockup::before {
    width: 2.18rem !important;
    height: 2.18rem !important;
  }

  .future-brand-lockup p:first-child {
    display: block !important;
    max-width: 100% !important;
    font-size: clamp(1.05rem, 5vw, 1.32rem) !important;
    line-height: 1.08 !important;
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
    letter-spacing: -.03em !important;
  }

  .future-brand-lockup p:nth-child(2) {
    display: none !important;
  }

  .future-search-pill {
    width: 100% !important;
    height: 2.78rem !important;
    min-height: 2.78rem !important;
    margin: 0 !important;
    border-radius: 999px !important;
    justify-content: flex-start !important;
    gap: .68rem !important;
    padding: 0 .95rem !important;
    background: rgba(255,255,255,.13) !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 12px 30px rgba(2,6,23,.16) !important;
    backdrop-filter: blur(18px) saturate(1.25) !important;
  }

  /* v51 全ページ一覧：開閉可能、コンパクト */
  #life-page-drawer-v51 {
    display: block !important;
    margin: .45rem 0 .72rem !important;
    border-radius: 1.15rem !important;
    border: 1px solid rgba(125,211,252,.22) !important;
    background: rgba(15,23,42,.46) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 10px 26px rgba(2,6,23,.16) !important;
    overflow: hidden !important;
  }

  #life-page-drawer-v51 summary {
    display: flex !important;
    min-height: 3.05rem !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: .72rem .82rem !important;
    cursor: pointer !important;
    list-style: none !important;
    font-weight: 900 !important;
    color: white !important;
  }

  #life-page-drawer-v51 summary::-webkit-details-marker {
    display: none !important;
  }

  #life-page-drawer-v51 summary span {
    font-size: .92rem !important;
    white-space: nowrap !important;
  }

  #life-page-drawer-v51 .life-page-drawer-v51-grid {
    display: grid !important;
    grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    gap: .42rem !important;
    padding: 0 .72rem .72rem !important;
  }

  #life-page-drawer-v51 button {
    min-height: 2.55rem !important;
    border-radius: .9rem !important;
    border: 1px solid rgba(255,255,255,.12) !important;
    background: rgba(255,255,255,.08) !important;
    color: white !important;
    font-size: .78rem !important;
    font-weight: 900 !important;
    white-space: nowrap !important;
  }

  /* 下部カードは見切らない。習慣トラッカー/モチベーション/天気を機能表示優先 */
  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .72rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-bottom-grid > .matsuri-card,
  .future-bottom-grid > * {
    min-width: 0 !important;
    min-height: auto !important;
    max-height: none !important;
    padding: .82rem !important;
    border-radius: 1.12rem !important;
    overflow: visible !important;
  }

  .future-bottom-grid h3,
  .future-bottom-grid .matsuri-card h3 {
    font-size: 1rem !important;
    line-height: 1.16 !important;
    white-space: nowrap !important;
  }

  .future-bottom-grid .space-y-4,
  .future-bottom-grid .space-y-3 {
    gap: .45rem !important;
  }

  .future-bottom-grid [class*="h-24"],
  .future-bottom-grid [class*="h-28"],
  .future-bottom-grid [class*="h-32"],
  .future-bottom-grid [class*="h-36"] {
    height: 5.5rem !important;
  }

  /* v51固定ナビ：均等・ホームだけ飛び出さない */
  #life-mobile-nav-v51 {
    display: block !important;
    visibility: visible !important;
    pointer-events: auto !important;
    position: fixed !important;
    left: .72rem !important;
    right: .72rem !important;
    bottom: max(.45rem, env(safe-area-inset-bottom)) !important;
    z-index: 2147483000 !important;
    margin: 0 !important;
    padding: .38rem !important;
    border-radius: 1.36rem !important;
    border: 1px solid rgba(255,255,255,.12) !important;
    background: rgba(4,12,34,.94) !important;
    backdrop-filter: blur(18px) saturate(1.2) !important;
    box-shadow: 0 0 28px rgba(56,189,248,.18), inset 0 1px 0 rgba(255,255,255,.12) !important;
    overflow: hidden !important;
  }

  #life-mobile-nav-v51 .life-mobile-nav-v51-grid {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .12rem !important;
  }

  #life-mobile-nav-v51 button {
    display: flex !important;
    min-width: 0 !important;
    min-height: 3.72rem !important;
    max-height: 3.72rem !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    gap: .18rem !important;
    padding: .2rem .08rem !important;
    border: 0 !important;
    border-radius: .92rem !important;
    background: transparent !important;
    color: rgba(226,232,240,.82) !important;
    overflow: hidden !important;
  }

  #life-mobile-nav-v51 button.is-active {
    background: linear-gradient(135deg, rgba(96,165,250,.35), rgba(125,211,252,.13)) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 0 18px rgba(96,165,250,.18) !important;
    color: white !important;
  }

  #life-mobile-nav-v51 .life-mobile-nav-v51-icon {
    display: flex !important;
    width: 1.45rem !important;
    height: 1.45rem !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 1.12rem !important;
    line-height: 1 !important;
  }

  #life-mobile-nav-v51 b {
    max-width: 100% !important;
    font-size: .66rem !important;
    line-height: 1.04 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    font-weight: 900 !important;
  }

  /* v51 Quick Add 復活 */
  #life-floating-quickadd-v51 {
    display: flex !important;
    visibility: visible !important;
    pointer-events: auto !important;
    position: fixed !important;
    align-items: center !important;
    justify-content: center !important;
    width: 3.45rem !important;
    height: 3.45rem !important;
    right: .95rem !important;
    bottom: calc(5.25rem + env(safe-area-inset-bottom)) !important;
    z-index: 2147483001 !important;
    border-radius: 9999px !important;
    border: 1px solid rgba(255,255,255,.24) !important;
    background: conic-gradient(from 180deg, #60a5fa, #a78bfa, #f472b6, #f59e0b, #34d399, #60a5fa) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,.08), 0 10px 30px rgba(96,165,250,.34), 0 0 26px rgba(244,114,182,.28) !important;
  }

  #life-floating-quickadd-v51 span {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 2.62rem !important;
    height: 2.62rem !important;
    border-radius: 9999px !important;
    background: rgba(8,16,40,.56) !important;
    color: #fff !important;
    font-size: 1.88rem !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }
}
"""

AUTO_SYNC_ROUTE = r"""import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.MAIL_CRON_SECRET;
  const provided = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const syncUrl = new URL("/api/mail/gmail/sync", origin);
  if (secret) syncUrl.searchParams.set("secret", secret);

  try {
    const res = await fetch(syncUrl.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      mode: "gmail-auto-sync",
      note: "Vercel Hobby cron is daily only. Frontend can still poll while app is open.",
      syncStatus: res.status,
      sync: data,
    }, { status: res.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      mode: "gmail-auto-sync",
      error: error instanceof Error ? error.message : "sync failed",
    }, { status: 500 });
  }
}
"""

VERCEL_JSON_CRON = {
    "path": "/api/mail/gmail/auto-sync",
    "schedule": "0 3 * * *"
}

PAGE_LABELS = {
    "home": "ホーム",
    "memos": "メモ",
    "todos": "TODO",
    "calendar": "カレンダー",
    "budget": "家計簿",
    "mail": "メール",
    "settings": "設定",
    "diary": "日記",
    "mind": "Mind",
    "news": "AIニュース",
}

def strip_previous_patches(css: str) -> str:
    indexes = [css.find(m) for m in BAD_MARKERS if css.find(m) != -1]
    if not indexes:
        return css
    start = min(indexes)
    comment_start = css.rfind("/*", 0, start)
    if comment_start == -1:
        comment_start = start
    return css[:comment_start].rstrip() + "\n"

def patch_css(path: Path):
    if not path.exists():
        return
    backup = path.with_suffix(path.suffix + f".backup-v51-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)
    text = path.read_text(encoding="utf-8")
    text = strip_previous_patches(text)
    if "v51 mobile rescue" not in text:
        text += CSS
    path.write_text(text, encoding="utf-8")
    print("patched css", path)
    print("backup", backup)

def detect_pages(text: str):
    found = []
    for key in re.findall(r'setPage\("([^"]+)"\)', text):
        if key not in found:
            found.append(key)
    ordered = [k for k in ["home", "memos", "todos", "calendar", "budget", "mail", "diary", "settings"] if k in found]
    rest = [k for k in found if k not in ordered][:6]
    return ordered + rest

def more_action(text: str):
    if "setCommandOpen" in text:
        return "setCommandOpen(true)"
    if "setQuickAddOpen" in text:
        return "setQuickAddOpen(true)"
    return 'setPage("settings")'

def quick_action(text: str):
    if "setQuickAddOpen" in text:
        return "setQuickAddOpen(true)"
    if "setCommandOpen" in text:
        return "setCommandOpen(true)"
    return 'setPage("memos")'

def build_drawer(text: str):
    pages = detect_pages(text)
    if not pages:
        pages = ["home", "memos", "todos", "calendar", "budget"]
    buttons = []
    for key in pages[:12]:
        label = PAGE_LABELS.get(key, key)
        buttons.append(f'          <button type="button" onClick={{() => setPage("{key}")}}>{label}</button>')
    return """
      {page === "home" && (
        <details id="life-page-drawer-v51" className="lg:hidden">
          <summary>
            <span>📚 全ページ一覧</span>
            <span>開く / 閉じる</span>
          </summary>
          <div className="life-page-drawer-v51-grid">
BUTTONS
          </div>
        </details>
      )}
""".replace("BUTTONS", "\n".join(buttons))

def build_nav(text: str):
    action_more = more_action(text)
    return f"""
      <nav id="life-mobile-nav-v51" className="lg:hidden" aria-label="スマホ下部ナビ v51">
        <div className="life-mobile-nav-v51-grid">
          <button type="button" onClick={{() => setPage("home")}} className={{page === "home" ? "is-active" : ""}}>
            <span className="life-mobile-nav-v51-icon">🏠</span><b>ホーム</b>
          </button>
          <button type="button" onClick={{() => setPage("memos")}} className={{page === "memos" ? "is-active" : ""}}>
            <span className="life-mobile-nav-v51-icon">📝</span><b>メモ</b>
          </button>
          <button type="button" onClick={{() => setPage("todos")}} className={{page === "todos" ? "is-active" : ""}}>
            <span className="life-mobile-nav-v51-icon">✅</span><b>TODO</b>
          </button>
          <button type="button" onClick={{() => setPage("calendar")}} className={{page === "calendar" ? "is-active" : ""}}>
            <span className="life-mobile-nav-v51-icon">📅</span><b>カレンダー</b>
          </button>
          <button type="button" onClick={{() => {action_more}}}>
            <span className="life-mobile-nav-v51-icon">•••</span><b>もっと</b>
          </button>
        </div>
      </nav>
"""

def build_quickadd(text: str):
    action = quick_action(text)
    return f"""
      <button
        id="life-floating-quickadd-v51"
        type="button"
        onClick={{() => {action}}}
        className="lg:hidden"
        aria-label="Quick Add"
      >
        <span>＋</span>
      </button>
"""

def insert_after_main_open(text: str, snippet: str):
    if "life-page-drawer-v51" in text:
        return text
    m = re.search(r"<main\\b[^>]*>", text)
    if not m:
        return text
    return text[:m.end()] + "\n" + snippet + text[m.end():]

def insert_before_main_close(text: str, snippet: str, marker: str):
    if marker in text:
        return text
    idx = text.rfind("    </main>")
    if idx == -1:
        idx = text.rfind("</main>")
    if idx == -1:
        return text
    return text[:idx] + snippet + "\n" + text[idx:]

def patch_page(path: Path):
    if not path.exists():
        return
    backup = path.with_suffix(path.suffix + f".backup-v51-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)
    text = path.read_text(encoding="utf-8")
    text = insert_after_main_open(text, build_drawer(text))
    text = insert_before_main_close(text, build_nav(text), "life-mobile-nav-v51")
    text = insert_before_main_close(text, build_quickadd(text), "life-floating-quickadd-v51")
    path.write_text(text, encoding="utf-8")
    print("patched page", path)
    print("backup", backup)

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def patch_vercel(path: Path):
    data = {}
    if path.exists():
        backup = path.with_suffix(path.suffix + f".backup-v51-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        shutil.copyfile(path, backup)
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception:
            data = {}
        print("backup", backup)
    crons = data.get("crons")
    if not isinstance(crons, list):
        crons = []
    crons = [c for c in crons if not (isinstance(c, dict) and c.get("path") == VERCEL_JSON_CRON["path"])]
    crons.append(VERCEL_JSON_CRON)
    data["crons"] = crons
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("patched vercel.json daily cron")

root = Path.cwd()

for p in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patch_page(p)

for p in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(p)

for p in [
    root / "app" / "api" / "mail" / "gmail" / "auto-sync" / "route.ts",
    root / "src" / "app" / "api" / "mail" / "gmail" / "auto-sync" / "route.ts",
]:
    write_file(p, AUTO_SYNC_ROUTE)

patch_vercel(root / "vercel.json")
