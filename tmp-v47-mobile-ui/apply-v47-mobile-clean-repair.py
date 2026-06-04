#!/usr/bin/env python3
from pathlib import Path
import shutil
from datetime import datetime

# これまでのv39〜v46追記CSSを一度消して、v47だけを最後に入れる
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
]

CSS = r"""

/* ===== v47 mobile clean repair: balanced nav / single header / weather restored ===== */
@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden !important;
  }

  main {
    overflow-x: hidden !important;
    padding-bottom: calc(6.4rem + env(safe-area-inset-bottom)) !important;
  }

  /* 全ページ一覧カードが検索欄の下で重なって見える原因になるため、スマホでは隠す */
  .life-page-drawer-toggle,
  .home-page-drawer-toggle,
  .mobile-page-drawer-toggle,
  .future-page-drawer-toggle {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* 同じ上部UIや検索欄が複数ある場合、2個目以降だけ消す */
  .future-top-hud + .future-top-hud,
  .home-top-head + .home-top-head,
  .future-search-pill + .future-search-pill,
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card {
    display: none !important;
  }

  /* 上部ヘッダー：アプリ名を省略しすぎない・検索欄を1本に見せる */
  .future-top-hud {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto auto !important;
    align-items: center !important;
    column-gap: .55rem !important;
    row-gap: .58rem !important;
    margin: 0 0 .75rem !important;
    padding: .4rem .18rem .25rem !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .future-brand-lockup {
    min-width: 0 !important;
    padding-left: 2.85rem !important;
  }

  .future-brand-lockup::before {
    width: 2.25rem !important;
    height: 2.25rem !important;
  }

  .future-brand-lockup p:first-child {
    max-width: none !important;
    font-size: clamp(1.05rem, 5.1vw, 1.28rem) !important;
    line-height: 1.08 !important;
    white-space: nowrap !important;
    overflow: visible !important;
    text-overflow: clip !important;
    letter-spacing: -.03em !important;
  }

  .future-brand-lockup p:nth-child(2),
  .future-weather-chip,
  .future-clock-chip,
  .future-mode-row {
    display: none !important;
  }

  .future-icon-button,
  .future-avatar {
    width: 2.55rem !important;
    height: 2.55rem !important;
    min-width: 2.55rem !important;
    border-radius: 999px !important;
  }

  .future-search-pill {
    grid-column: 1 / -1 !important;
    order: 10 !important;
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

  .future-search-pill span:first-child {
    font-size: 1.72rem !important;
  }

  .future-search-pill span:last-child {
    font-size: .94rem !important;
  }

  /* ホーム全体 */
  .future-dashboard,
  .matsuri-dashboard {
    width: 100% !important;
    max-width: 100% !important;
    display: flex !important;
    flex-direction: column !important;
    gap: .72rem !important;
  }

  .future-hero-grid,
  .matsuri-hero {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .72rem !important;
  }

  .future-welcome-card,
  .matsuri-welcome {
    width: 100% !important;
    margin: 0 !important;
    padding: .9rem !important;
    border-radius: 1.22rem !important;
    overflow: hidden !important;
  }

  .future-welcome-card h2,
  .matsuri-welcome h2 {
    font-size: clamp(1.48rem, 7.2vw, 2rem) !important;
    line-height: 1.12 !important;
    margin: .42rem 0 .2rem !important;
    letter-spacing: -.03em !important;
    white-space: normal !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: .82rem !important;
    line-height: 1.44 !important;
  }

  /* ステータスは理想画像寄せで5つ横並び。巨大化させない */
  .future-welcome-card .grid,
  .matsuri-welcome .grid {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .36rem !important;
    margin-top: .66rem !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    min-height: 4.15rem !important;
    padding: .38rem .1rem !important;
    border-radius: .82rem !important;
  }

  .future-stat-tile > div,
  .matsuri-stat-tile > div {
    width: 1.82rem !important;
    height: 1.82rem !important;
    font-size: .9rem !important;
  }

  .future-stat-tile p:nth-of-type(1),
  .matsuri-stat-tile p:nth-of-type(1) {
    font-size: .5rem !important;
    line-height: 1.05 !important;
  }

  .future-stat-tile p:nth-of-type(2),
  .matsuri-stat-tile p:nth-of-type(2) {
    font-size: .64rem !important;
    line-height: 1.05 !important;
  }

  .future-progress-card,
  .future-panel-card,
  .matsuri-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: .82rem !important;
    border-radius: 1.15rem !important;
    overflow: hidden !important;
  }

  .future-progress-card h3,
  .future-panel-card h3,
  .matsuri-card h3 {
    font-size: 1rem !important;
    line-height: 1.18 !important;
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    white-space: nowrap !important;
  }

  .future-progress-row,
  .future-list-row,
  .matsuri-list-row {
    min-height: auto !important;
    padding: .48rem .58rem !important;
    border-radius: .84rem !important;
    font-size: .76rem !important;
    writing-mode: horizontal-tb !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  /* 予定/メモは2カラム。ただし文字が縦書きにならないように強制 */
  .future-middle-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: .58rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-middle-grid > .future-panel-card {
    min-width: 0 !important;
    width: 100% !important;
    min-height: 8.7rem !important;
    max-height: 10.2rem !important;
    padding: .72rem !important;
  }

  .future-panel-card .flex.items-start.justify-between,
  .future-panel-card .flex.items-center.justify-between,
  .matsuri-card .flex.items-start.justify-between,
  .matsuri-card .flex.items-center.justify-between {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: .4rem !important;
  }

  .future-panel-card .flex.items-start.justify-between > *:last-child,
  .future-panel-card .flex.items-center.justify-between > *:last-child {
    white-space: nowrap !important;
    flex: 0 0 auto !important;
    font-size: .68rem !important;
  }

  .future-panel-card p,
  .future-panel-card span,
  .matsuri-card p,
  .matsuri-card span {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
  }

  /* 天気・習慣・モチベーションを消さない。縦長だけ抑える */
  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: .58rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-bottom-grid > .matsuri-card,
  .future-bottom-grid > * {
    min-width: 0 !important;
    min-height: 7.3rem !important;
    max-height: 10.2rem !important;
    padding: .68rem !important;
    border-radius: 1.08rem !important;
    overflow: hidden !important;
  }

  .future-bottom-grid h3,
  .future-bottom-grid .matsuri-card h3 {
    font-size: .9rem !important;
    line-height: 1.1 !important;
  }

  .future-bottom-grid .text-xl,
  .future-bottom-grid .text-2xl,
  .future-bottom-grid .text-3xl {
    font-size: 1.05rem !important;
  }

  .future-bottom-grid .space-y-4,
  .future-bottom-grid .space-y-3 {
    gap: .28rem !important;
  }

  /* 習慣トラッカーの棒グラフだけコンパクトに */
  .future-bottom-grid [class*="h-24"],
  .future-bottom-grid [class*="h-28"],
  .future-bottom-grid [class*="h-32"],
  .future-bottom-grid [class*="h-36"] {
    height: 4.3rem !important;
  }

  /* 下部ナビ：ホームだけ巨大化・飛び出しを止める */
  #hard-mobile-nav,
  #life-mobile-nav-v41,
  #life-mobile-nav-v42,
  #life-mobile-nav-v43,
  #image-mobile-nav-v40,
  #image-mobile-nav-v39 {
    left: .72rem !important;
    right: .72rem !important;
    bottom: max(.45rem, env(safe-area-inset-bottom)) !important;
    padding: .38rem !important;
    border-radius: 1.36rem !important;
    background: rgba(4,12,34,.94) !important;
    backdrop-filter: blur(18px) saturate(1.2) !important;
    z-index: 999990 !important;
    overflow: hidden !important;
  }

  #hard-mobile-nav .hard-mobile-nav-grid,
  #life-mobile-nav-v41 .life-mobile-nav-v41-grid,
  #life-mobile-nav-v42 .life-mobile-nav-v42-grid,
  #life-mobile-nav-v43 .life-mobile-nav-v43-grid,
  #image-mobile-nav-v40 .image-mobile-nav-grid-v40,
  #image-mobile-nav-v39 .image-mobile-nav-grid-v39 {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .12rem !important;
  }

  #hard-mobile-nav .hard-mobile-nav-item,
  #life-mobile-nav-v41 .life-mobile-nav-v41-item,
  #life-mobile-nav-v42 .life-mobile-nav-v42-item,
  #life-mobile-nav-v43 .life-mobile-nav-v43-item,
  #image-mobile-nav-v40 .image-mobile-nav-item-v40,
  #image-mobile-nav-v39 .image-mobile-nav-item-v39 {
    min-height: 3.72rem !important;
    max-height: 3.72rem !important;
    padding: .2rem .08rem !important;
    border-radius: .92rem !important;
    overflow: hidden !important;
  }

  #hard-mobile-nav b,
  #life-mobile-nav-v41 b,
  #life-mobile-nav-v42 b,
  #life-mobile-nav-v43 b,
  #image-mobile-nav-v40 b,
  #image-mobile-nav-v39 b {
    font-size: .66rem !important;
    white-space: nowrap !important;
    line-height: 1.04 !important;
  }

  #hard-mobile-nav img,
  #life-mobile-nav-v41 img,
  #life-mobile-nav-v42 img,
  #life-mobile-nav-v43 img,
  #image-mobile-nav-v40 img,
  #image-mobile-nav-v39 img {
    width: 2.95rem !important;
    max-width: 2.95rem !important;
    height: 2.35rem !important;
    max-height: 2.35rem !important;
    object-fit: contain !important;
    transform: none !important;
  }

  #hard-mobile-nav .hard-mobile-nav-icon,
  #life-mobile-nav-v41 .life-mobile-nav-v41-icon,
  #life-mobile-nav-v42 .life-mobile-nav-v42-icon,
  #life-mobile-nav-v43 .life-mobile-nav-v43-icon,
  #image-mobile-nav-v40 .image-mobile-nav-icon-v40,
  #image-mobile-nav-v39 .image-mobile-nav-icon-v39 {
    width: 1.32rem !important;
    height: 1.32rem !important;
    font-size: 1rem !important;
  }

  /* Quick Add */
  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39 {
    display: flex !important;
    width: 3.36rem !important;
    height: 3.36rem !important;
    right: .95rem !important;
    bottom: calc(5.18rem + env(safe-area-inset-bottom)) !important;
    border-radius: 9999px !important;
    background: conic-gradient(from 180deg, #60a5fa, #a78bfa, #f472b6, #f59e0b, #34d399, #60a5fa) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,.08), 0 10px 30px rgba(96,165,250,.34), 0 0 26px rgba(244,114,182,.28) !important;
    z-index: 999991 !important;
  }

  #life-floating-quickadd-v41 span,
  #life-floating-quickadd-v42 span,
  #life-floating-quickadd-v43 span,
  #image-floating-quickadd-v40 span,
  #image-floating-quickadd-v39 span {
    width: 2.55rem !important;
    height: 2.55rem !important;
    border-radius: 9999px !important;
    background: rgba(8,16,40,.56) !important;
    color: #fff !important;
    font-size: 1.8rem !important;
  }
}

@media (max-width: 374px) {
  .future-middle-grid,
  .future-bottom-grid {
    grid-template-columns: 1fr !important;
  }
}
"""

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
    backup = path.with_suffix(path.suffix + f".backup-v47-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)
    css = path.read_text(encoding="utf-8")
    css = strip_previous_patches(css)
    if "v47 mobile clean repair" not in css:
        css += CSS
    path.write_text(css, encoding="utf-8")
    print("patched", path)
    print("backup", backup)

def copy_asset(root: Path):
    src = Path(__file__).resolve().parent / "mobile-home-button-v40.png"
    if not src.exists():
        return
    public = root / "public"
    public.mkdir(exist_ok=True)
    dst = public / "mobile-home-button-v40.png"
    shutil.copyfile(src, dst)
    print("copied", dst)

root = Path.cwd()
copy_asset(root)
for file in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(file)
