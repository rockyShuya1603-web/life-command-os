#!/usr/bin/env python3
from pathlib import Path
import shutil

CSS = """

/* ===== v43 mobile UI real fix: readable compact smartphone layout ===== */
@media (max-width: 430px) {
  main {
    padding-bottom: calc(6.8rem + env(safe-area-inset-bottom)) !important;
    overflow-x: hidden !important;
  }

  .future-dashboard,
  .matsuri-dashboard {
    gap: 0.7rem !important;
  }

  .future-welcome-card,
  .matsuri-welcome {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0.9rem !important;
    border-radius: 1.25rem !important;
  }

  .future-welcome-card h2,
  .matsuri-welcome h2 {
    font-size: clamp(1.5rem, 7vw, 2rem) !important;
    line-height: 1.15 !important;
    margin-bottom: 0.2rem !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: 0.82rem !important;
    line-height: 1.45 !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    min-height: 4.8rem !important;
    padding: 0.45rem 0.2rem !important;
  }

  .future-progress-card {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0.85rem !important;
    border-radius: 1.2rem !important;
  }

  .future-progress-row,
  .future-list-row,
  .matsuri-list-row {
    padding: 0.5rem 0.65rem !important;
    border-radius: 0.95rem !important;
    min-height: auto !important;
  }

  /* 最重要：小さいスマホでは予定/メモを1カラムに戻して文字崩れを防ぐ */
  .future-middle-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 0.7rem !important;
    width: 100% !important;
  }

  .future-middle-grid > .future-panel-card {
    min-width: 0 !important;
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
    padding: 0.85rem !important;
    border-radius: 1.2rem !important;
    min-height: auto !important;
  }

  .future-middle-grid > .future-panel-card h3 {
    font-size: 1.05rem !important;
    line-height: 1.2 !important;
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
    white-space: nowrap !important;
  }

  .future-panel-card .flex.items-start.justify-between,
  .future-panel-card .flex.items-center.justify-between {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 0.5rem !important;
  }

  .future-panel-card .flex.items-start.justify-between > *:first-child,
  .future-panel-card .flex.items-center.justify-between > *:first-child {
    flex: 1 1 auto !important;
    min-width: 0 !important;
  }

  .future-panel-card .flex.items-start.justify-between > *:last-child,
  .future-panel-card .flex.items-center.justify-between > *:last-child {
    flex: 0 0 auto !important;
    white-space: nowrap !important;
    font-size: 0.82rem !important;
  }

  .future-panel-card .space-y-3 > *,
  .future-panel-card .space-y-4 > * {
    min-width: 0 !important;
  }

  .future-panel-card p,
  .future-panel-card span,
  .future-panel-card button,
  .future-list-row,
  .future-progress-row {
    writing-mode: horizontal-tb !important;
    text-orientation: mixed !important;
  }

  .future-list-row span,
  .future-progress-row span {
    white-space: normal !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  /* 下段だけ2カラム寄せ */
  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: 0.65rem !important;
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .future-bottom-grid > .matsuri-card {
    min-height: 8.6rem !important;
    padding: 0.8rem !important;
    border-radius: 1.2rem !important;
  }

  .future-bottom-grid > .matsuri-card:nth-child(n+3) {
    display: none !important;
  }

  /* Quick Add：理想画像寄せの小さめ虹色オーブ */
  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39 {
    display: flex !important;
    width: 3.6rem !important;
    height: 3.6rem !important;
    right: 0.95rem !important;
    bottom: calc(5.55rem + env(safe-area-inset-bottom)) !important;
    border-radius: 9999px !important;
    background: conic-gradient(from 180deg, #60a5fa, #a78bfa, #f472b6, #f59e0b, #34d399, #60a5fa) !important;
    box-shadow:
      0 0 0 3px rgba(255,255,255,0.08),
      0 10px 30px rgba(96,165,250,0.35),
      0 0 30px rgba(167,139,250,0.35) !important;
    z-index: 999991 !important;
  }

  #life-floating-quickadd-v41 span,
  #life-floating-quickadd-v42 span,
  #life-floating-quickadd-v43 span,
  #image-floating-quickadd-v40 span,
  #image-floating-quickadd-v39 span {
    width: 2.85rem !important;
    height: 2.85rem !important;
    border-radius: 9999px !important;
    background: rgba(8, 16, 40, 0.55) !important;
    font-size: 2rem !important;
    color: white !important;
  }

  /* 下部ナビ：高さを抑える */
  #life-mobile-nav-v41,
  #life-mobile-nav-v42,
  #life-mobile-nav-v43,
  #image-mobile-nav-v40,
  #image-mobile-nav-v39,
  #hard-mobile-nav {
    display: block !important;
    left: 0.7rem !important;
    right: 0.7rem !important;
    bottom: max(0.45rem, env(safe-area-inset-bottom)) !important;
    padding: 0.42rem !important;
    border-radius: 1.5rem !important;
    background: rgba(4, 12, 34, 0.92) !important;
    backdrop-filter: blur(18px) saturate(1.25) !important;
    z-index: 999990 !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-grid,
  #life-mobile-nav-v42 .life-mobile-nav-v42-grid,
  #life-mobile-nav-v43 .life-mobile-nav-v43-grid,
  #image-mobile-nav-v40 .image-mobile-nav-grid-v40,
  #image-mobile-nav-v39 .image-mobile-nav-grid-v39,
  #hard-mobile-nav .hard-mobile-nav-grid {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: 0.18rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-item,
  #life-mobile-nav-v42 .life-mobile-nav-v42-item,
  #life-mobile-nav-v43 .life-mobile-nav-v43-item,
  #image-mobile-nav-v40 .image-mobile-nav-item-v40,
  #image-mobile-nav-v39 .image-mobile-nav-item-v39,
  #hard-mobile-nav .hard-mobile-nav-item {
    min-height: 4.05rem !important;
    padding: 0.28rem 0.15rem !important;
    border-radius: 1rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-icon,
  #life-mobile-nav-v42 .life-mobile-nav-v42-icon,
  #life-mobile-nav-v43 .life-mobile-nav-v43-icon,
  #image-mobile-nav-v40 .image-mobile-nav-icon-v40,
  #image-mobile-nav-v39 .image-mobile-nav-icon-v39,
  #hard-mobile-nav .hard-mobile-nav-icon {
    width: 1.45rem !important;
    height: 1.45rem !important;
    font-size: 1.08rem !important;
  }

  #life-mobile-nav-v41 b,
  #life-mobile-nav-v42 b,
  #life-mobile-nav-v43 b,
  #image-mobile-nav-v40 b,
  #image-mobile-nav-v39 b,
  #hard-mobile-nav b {
    font-size: 0.72rem !important;
    line-height: 1.05 !important;
    white-space: nowrap !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-home,
  #life-mobile-nav-v42 .life-mobile-nav-v42-home,
  #life-mobile-nav-v43 .life-mobile-nav-v43-home,
  #image-mobile-nav-v40 .image-mobile-nav-home-v40,
  #image-mobile-nav-v39 .image-mobile-nav-home-v39,
  #hard-mobile-nav .hard-mobile-nav-item.is-active {
    background: linear-gradient(135deg, rgba(96,165,250,.34), rgba(125,211,252,.12)) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.16), 0 0 18px rgba(96,165,250,.18) !important;
  }

  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card {
    display: none !important;
  }
}

/* 少し広いスマホでは予定/メモだけ2カラムに戻して理想画像寄せ */
@media (min-width: 431px) and (max-width: 767px) {
  .future-middle-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 0.7rem !important;
  }

  .future-middle-grid > .future-panel-card h3 {
    writing-mode: horizontal-tb !important;
    white-space: nowrap !important;
  }
}
"""

def append_css(path: Path):
    if not path.exists():
        return
    text = path.read_text()
    if "v43 mobile UI real fix: readable compact smartphone layout" not in text:
        text += CSS
        path.write_text(text)
        print("patched", path)
    else:
        print("already patched", path)

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
    append_css(file)
