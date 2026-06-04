#!/usr/bin/env python3
from pathlib import Path
import shutil
from datetime import datetime

PATCH_MARKERS = [
    "HARD FIX: only one mobile bottom nav",
    "HARD FIX: final single mobile bottom nav",
    "v39 mobile UI based on reference image",
    "v40 mobile UI polish + home image button",
    "v41 mobile unified UI / reference image direction",
    "v42 mobile proportion fix / closer to ideal",
    "v43 mobile UI real fix: readable compact smartphone layout",
    "v44 mobile compact fix: stop tall layout + suppress duplicate mobile blocks",
    "v45 mobile duplicate header fix + compact home + AI entry polish",
]

CSS = r"""

/* ===== v46 mobile rollback compact fix: no duplicate search / no tall habit tracker ===== */
@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden !important;
  }

  main {
    overflow-x: hidden !important;
    padding-bottom: calc(6.7rem + env(safe-area-inset-bottom)) !important;
  }

  /* 検索欄付近のダブり原因になりやすい追加カードをスマホでは消す */
  .life-page-drawer-toggle,
  .home-page-drawer-toggle,
  .mobile-page-drawer-toggle,
  .future-page-drawer-toggle {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  /* 重複表示だけ消す */
  .future-top-hud + .future-top-hud,
  .home-top-head + .home-top-head,
  .future-search-pill + .future-search-pill,
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card {
    display: none !important;
  }

  /* 上部HUDは1つだけ、軽量化 */
  .future-top-hud {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto auto !important;
    align-items: center !important;
    gap: .55rem !important;
    margin: 0 0 .7rem !important;
    padding: .45rem .25rem .25rem !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .future-brand-lockup {
    min-width: 0 !important;
    padding-left: 3rem !important;
  }

  .future-brand-lockup p:first-child {
    font-size: clamp(1.08rem, 5.4vw, 1.35rem) !important;
    line-height: 1.05 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .future-brand-lockup p:nth-child(2),
  .future-weather-chip,
  .future-clock-chip,
  .future-mode-row {
    display: none !important;
  }

  .future-icon-button,
  .future-avatar {
    width: 2.65rem !important;
    height: 2.65rem !important;
    min-width: 2.65rem !important;
  }

  .future-search-pill {
    grid-column: 1 / -1 !important;
    order: 10 !important;
    width: 100% !important;
    height: 2.85rem !important;
    margin-top: .12rem !important;
    border-radius: 999px !important;
    justify-content: flex-start !important;
    gap: .7rem !important;
    padding: 0 .95rem !important;
    background: rgba(255,255,255,.13) !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.14), 0 12px 30px rgba(2,6,23,.18) !important;
    backdrop-filter: blur(18px) saturate(1.25) !important;
  }

  .future-search-pill span:first-child {
    font-size: 1.75rem !important;
  }

  .future-search-pill span:last-child {
    font-size: .95rem !important;
  }

  /* ホームを理想画像寄せ：縦に伸びすぎない密度へ */
  .future-dashboard,
  .matsuri-dashboard {
    width: 100% !important;
    max-width: 100% !important;
    gap: .72rem !important;
  }

  .future-hero-grid,
  .matsuri-hero {
    grid-template-columns: 1fr !important;
    gap: .72rem !important;
  }

  .future-welcome-card,
  .matsuri-welcome {
    width: 100% !important;
    margin: 0 !important;
    padding: .95rem !important;
    border-radius: 1.28rem !important;
    overflow: hidden !important;
  }

  .future-welcome-card h2,
  .matsuri-welcome h2 {
    font-size: clamp(1.65rem, 7.6vw, 2.2rem) !important;
    line-height: 1.08 !important;
    letter-spacing: -.03em !important;
    margin-top: .45rem !important;
    margin-bottom: .25rem !important;
    white-space: normal !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: .84rem !important;
    line-height: 1.45 !important;
  }

  /* v45の2列巨大タイルを解除。理想画像みたいに5つ横並びへ */
  .future-welcome-card .grid,
  .matsuri-welcome .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .42rem !important;
    margin-top: .72rem !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    min-height: 4.35rem !important;
    padding: .42rem .14rem !important;
    border-radius: .88rem !important;
  }

  .future-stat-tile > div {
    width: 1.95rem !important;
    height: 1.95rem !important;
    font-size: .95rem !important;
  }

  .future-stat-tile p:nth-of-type(1),
  .matsuri-stat-tile p:nth-of-type(1) {
    font-size: .55rem !important;
  }

  .future-stat-tile p:nth-of-type(2),
  .matsuri-stat-tile p:nth-of-type(2) {
    font-size: .7rem !important;
  }

  .future-progress-card,
  .future-panel-card,
  .matsuri-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: .84rem !important;
    border-radius: 1.18rem !important;
    overflow: hidden !important;
  }

  .future-progress-card h3,
  .future-panel-card h3,
  .matsuri-card h3 {
    font-size: 1.05rem !important;
    line-height: 1.2 !important;
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    white-space: nowrap !important;
  }

  /* 予定/メモは狭い端末でも縦書き崩れしない2カラム */
  .future-middle-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: .62rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-middle-grid > .future-panel-card {
    min-width: 0 !important;
    width: 100% !important;
    min-height: 9.2rem !important;
    max-height: 11rem !important;
    padding: .78rem !important;
    overflow: hidden !important;
  }

  .future-panel-card .flex.items-start.justify-between,
  .future-panel-card .flex.items-center.justify-between,
  .matsuri-card .flex.items-start.justify-between,
  .matsuri-card .flex.items-center.justify-between {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: .45rem !important;
  }

  .future-panel-card .flex.items-start.justify-between > *:last-child,
  .future-panel-card .flex.items-center.justify-between > *:last-child {
    white-space: nowrap !important;
    flex: 0 0 auto !important;
    font-size: .72rem !important;
  }

  .future-list-row,
  .future-progress-row,
  .matsuri-list-row,
  .future-panel-card p,
  .future-panel-card span,
  .matsuri-card p,
  .matsuri-card span {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  .future-list-row,
  .future-progress-row,
  .matsuri-list-row {
    min-height: auto !important;
    padding: .48rem .58rem !important;
    border-radius: .86rem !important;
  }

  /* 天気/習慣は2カラム。ただし習慣トラッカーを絶対に縦長に戻さない */
  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: .62rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-bottom-grid > .matsuri-card,
  .future-bottom-grid > * {
    min-width: 0 !important;
    min-height: 7.6rem !important;
    max-height: 9.2rem !important;
    padding: .72rem !important;
    border-radius: 1.12rem !important;
    overflow: hidden !important;
  }

  .future-bottom-grid > *:nth-child(n+3) {
    display: none !important;
  }

  .future-bottom-grid h3,
  .future-bottom-grid .matsuri-card h3 {
    font-size: .95rem !important;
    line-height: 1.15 !important;
  }

  .future-bottom-grid .text-xl,
  .future-bottom-grid .text-2xl,
  .future-bottom-grid .text-3xl {
    font-size: 1.12rem !important;
  }

  .future-bottom-grid .space-y-4,
  .future-bottom-grid .space-y-3 {
    gap: .32rem !important;
  }

  /* Quick Add */
  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39 {
    display: flex !important;
    width: 3.48rem !important;
    height: 3.48rem !important;
    right: .95rem !important;
    bottom: calc(5.35rem + env(safe-area-inset-bottom)) !important;
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
    width: 2.68rem !important;
    height: 2.68rem !important;
    border-radius: 9999px !important;
    background: rgba(8,16,40,.56) !important;
    color: #fff !important;
    font-size: 1.9rem !important;
  }

  /* 下部ナビ */
  #hard-mobile-nav,
  #life-mobile-nav-v41,
  #life-mobile-nav-v42,
  #life-mobile-nav-v43,
  #image-mobile-nav-v40,
  #image-mobile-nav-v39 {
    left: .7rem !important;
    right: .7rem !important;
    bottom: max(.45rem, env(safe-area-inset-bottom)) !important;
    padding: .42rem !important;
    border-radius: 1.48rem !important;
    background: rgba(4,12,34,.94) !important;
    backdrop-filter: blur(18px) saturate(1.2) !important;
    z-index: 999990 !important;
  }

  #hard-mobile-nav .hard-mobile-nav-grid,
  #life-mobile-nav-v41 .life-mobile-nav-v41-grid,
  #life-mobile-nav-v42 .life-mobile-nav-v42-grid,
  #life-mobile-nav-v43 .life-mobile-nav-v43-grid,
  #image-mobile-nav-v40 .image-mobile-nav-grid-v40,
  #image-mobile-nav-v39 .image-mobile-nav-grid-v39 {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .16rem !important;
  }

  #hard-mobile-nav .hard-mobile-nav-item,
  #life-mobile-nav-v41 .life-mobile-nav-v41-item,
  #life-mobile-nav-v42 .life-mobile-nav-v42-item,
  #life-mobile-nav-v43 .life-mobile-nav-v43-item,
  #image-mobile-nav-v40 .image-mobile-nav-item-v40,
  #image-mobile-nav-v39 .image-mobile-nav-item-v39 {
    min-height: 3.9rem !important;
    padding: .23rem .1rem !important;
    border-radius: 1rem !important;
  }

  #hard-mobile-nav b,
  #life-mobile-nav-v41 b,
  #life-mobile-nav-v42 b,
  #life-mobile-nav-v43 b,
  #image-mobile-nav-v40 b,
  #image-mobile-nav-v39 b {
    font-size: .7rem !important;
    white-space: nowrap !important;
    line-height: 1.05 !important;
  }
}

/* かなり細い端末だけは予定/メモを1カラムに逃がす */
@media (max-width: 374px) {
  .future-middle-grid {
    grid-template-columns: 1fr !important;
  }
}
"""

def strip_previous_mobile_patches(text: str) -> str:
    positions = [text.find(marker) for marker in PATCH_MARKERS if text.find(marker) != -1]
    if not positions:
        return text
    first_marker = min(positions)
    css_start = text.rfind("/*", 0, first_marker)
    if css_start == -1:
        css_start = first_marker
    return text[:css_start].rstrip() + "\n"

def patch_css(path: Path):
    if not path.exists():
        return
    original = path.read_text(encoding="utf-8")
    backup = path.with_suffix(path.suffix + f".backup-v46-{datetime.now().strftime('%Y%m%d%H%M%S')}")
    shutil.copyfile(path, backup)

    cleaned = strip_previous_mobile_patches(original)
    if "v46 mobile rollback compact fix" not in cleaned:
        cleaned += CSS

    path.write_text(cleaned, encoding="utf-8")
    print("patched css", path)
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
for p in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(p)
