#!/usr/bin/env python3
from pathlib import Path
import shutil
import re

CSS = """

/* ===== v44 mobile compact fix: stop tall layout + suppress duplicate mobile blocks ===== */
@media (max-width: 430px) {
  html, body {
    overflow-x: hidden !important;
  }

  main {
    padding-bottom: calc(6.4rem + env(safe-area-inset-bottom)) !important;
    overflow-x: hidden !important;
  }

  /* ホーム全体を縦1カラム前提に強制。細長い2カラム崩れを止める */
  .future-dashboard,
  .future-home-stack,
  .matsuri-dashboard {
    display: flex !important;
    flex-direction: column !important;
    gap: 0.75rem !important;
  }

  /* 旧/重複モバイルUI候補を強めに抑制 */
  .mobile-home-legacy,
  .mobile-home-clone,
  .future-mobile-clone,
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card,
  .life-mobile-header-clone,
  .duplicate-mobile-block {
    display: none !important;
  }

  /* 上部 */
  .future-topbar,
  .future-hero-shell,
  .future-welcome-card,
  .matsuri-welcome,
  .future-search-wrap,
  .life-page-drawer-toggle {
    width: 100% !important;
    margin: 0 !important;
    padding-left: 0.95rem !important;
    padding-right: 0.95rem !important;
    border-radius: 1.25rem !important;
  }

  .future-welcome-card,
  .matsuri-welcome {
    padding-top: 0.95rem !important;
    padding-bottom: 0.95rem !important;
    overflow: hidden !important;
  }

  .future-welcome-card h2,
  .matsuri-welcome h2 {
    font-size: clamp(1.7rem, 8vw, 2.2rem) !important;
    line-height: 1.1 !important;
    letter-spacing: -0.02em !important;
    white-space: normal !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: 0.9rem !important;
    line-height: 1.5 !important;
    opacity: 0.92 !important;
  }

  /* メトリクスを2列 or 3列で見やすく */
  .future-stats-grid,
  .future-stat-grid,
  .matsuri-stat-grid {
    display: grid !important;
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: 0.55rem !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    min-height: 4.4rem !important;
    padding: 0.55rem 0.35rem !important;
    border-radius: 1rem !important;
  }

  /* 進行カード */
  .future-progress-card,
  .future-panel-card,
  .matsuri-card,
  .future-section-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: 0.9rem !important;
    border-radius: 1.2rem !important;
    overflow: hidden !important;
  }

  .future-progress-card h3,
  .future-panel-card h3,
  .matsuri-card h3,
  .future-section-card h3 {
    font-size: 1.05rem !important;
    line-height: 1.25 !important;
    white-space: nowrap !important;
    writing-mode: horizontal-tb !important;
  }

  .future-progress-card .flex.items-center.justify-between,
  .future-progress-card .flex.items-start.justify-between,
  .future-panel-card .flex.items-center.justify-between,
  .future-panel-card .flex.items-start.justify-between,
  .matsuri-card .flex.items-center.justify-between,
  .matsuri-card .flex.items-start.justify-between {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: 0.5rem !important;
  }

  /* 中央の予定/メモ/その他は全部1カラム */
  .future-middle-grid,
  .future-bottom-grid,
  .future-home-grid,
  .future-grid-2,
  .future-grid-3 {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: 0.75rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-list-row,
  .future-progress-row,
  .matsuri-list-row {
    min-height: auto !important;
    padding: 0.58rem 0.68rem !important;
    border-radius: 0.95rem !important;
    white-space: normal !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  /* 習慣トラッカーが縦長すぎるのでコンパクト化 */
  .habit-tracker-card,
  .routine-summary-card,
  .future-habit-card {
    max-height: none !important;
  }

  .habit-tracker-card .space-y-4,
  .routine-summary-card .space-y-4,
  .future-habit-card .space-y-4 {
    gap: 0.55rem !important;
  }

  /* フローティング追加ボタン */
  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39 {
    width: 3.5rem !important;
    height: 3.5rem !important;
    right: 0.95rem !important;
    bottom: calc(5.45rem + env(safe-area-inset-bottom)) !important;
    border-radius: 9999px !important;
    background: conic-gradient(from 180deg, #60a5fa, #a78bfa, #f472b6, #f59e0b, #34d399, #60a5fa) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,0.09), 0 10px 30px rgba(96,165,250,.35), 0 0 24px rgba(244,114,182,.30) !important;
    z-index: 999991 !important;
  }

  #life-floating-quickadd-v41 span,
  #life-floating-quickadd-v42 span,
  #life-floating-quickadd-v43 span,
  #image-floating-quickadd-v40 span,
  #image-floating-quickadd-v39 span {
    width: 2.76rem !important;
    height: 2.76rem !important;
    border-radius: 9999px !important;
    background: rgba(8, 16, 40, 0.56) !important;
    color: #fff !important;
    font-size: 1.95rem !important;
  }

  /* 下部ナビ */
  #hard-mobile-nav,
  #life-mobile-nav-v41,
  #life-mobile-nav-v42,
  #life-mobile-nav-v43,
  #image-mobile-nav-v40,
  #image-mobile-nav-v39 {
    left: 0.7rem !important;
    right: 0.7rem !important;
    bottom: max(0.45rem, env(safe-area-inset-bottom)) !important;
    padding: 0.45rem !important;
    border-radius: 1.55rem !important;
    background: rgba(4, 12, 34, 0.94) !important;
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
    gap: 0.16rem !important;
  }

  #hard-mobile-nav .hard-mobile-nav-item,
  #life-mobile-nav-v41 .life-mobile-nav-v41-item,
  #life-mobile-nav-v42 .life-mobile-nav-v42-item,
  #life-mobile-nav-v43 .life-mobile-nav-v43-item,
  #image-mobile-nav-v40 .image-mobile-nav-item-v40,
  #image-mobile-nav-v39 .image-mobile-nav-item-v39 {
    min-height: 4rem !important;
    padding: 0.28rem 0.12rem !important;
    border-radius: 1rem !important;
  }

  #hard-mobile-nav .hard-mobile-nav-icon,
  #life-mobile-nav-v41 .life-mobile-nav-v41-icon,
  #life-mobile-nav-v42 .life-mobile-nav-v42-icon,
  #life-mobile-nav-v43 .life-mobile-nav-v43-icon,
  #image-mobile-nav-v40 .image-mobile-nav-icon-v40,
  #image-mobile-nav-v39 .image-mobile-nav-icon-v39 {
    width: 1.42rem !important;
    height: 1.42rem !important;
    font-size: 1.05rem !important;
  }

  #hard-mobile-nav b,
  #life-mobile-nav-v41 b,
  #life-mobile-nav-v42 b,
  #life-mobile-nav-v43 b,
  #image-mobile-nav-v40 b,
  #image-mobile-nav-v39 b {
    font-size: 0.72rem !important;
    white-space: nowrap !important;
    line-height: 1.05 !important;
  }

  /* ホーム上部のロゴ/ベル/プロフィール重なり軽減 */
  .home-top-head,
  .future-home-header,
  .life-header-row {
    display: grid !important;
    grid-template-columns: minmax(0,1fr) auto auto !important;
    gap: 0.5rem !important;
    align-items: center !important;
  }

  .home-top-head h1,
  .future-home-header h1,
  .life-header-row h1 {
    font-size: 1.05rem !important;
    line-height: 1.1 !important;
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }
}

/* 431px以上のスマホでも詰まりすぎないように少しだけ整える */
@media (min-width: 431px) and (max-width: 767px) {
  .future-middle-grid,
  .future-bottom-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: 0.8rem !important;
  }
}
"""

SNIPPET = "v44 mobile compact fix: stop tall layout + suppress duplicate mobile blocks"


def patch_css(path: Path):
    if not path.exists():
        return False
    text = path.read_text(encoding='utf-8')
    if SNIPPET not in text:
        text += CSS
        path.write_text(text, encoding='utf-8')
        print('patched css', path)
    else:
        print('already patched css', path)
    return True


def copy_asset(root: Path):
    src = Path(__file__).resolve().parent / 'mobile-home-button-v40.png'
    if src.exists():
        public = root / 'public'
        public.mkdir(exist_ok=True)
        dst = public / 'mobile-home-button-v40.png'
        shutil.copyfile(src, dst)
        print('copied asset', dst)


root = Path.cwd()
copy_asset(root)
for p in [root / 'app' / 'globals.css', root / 'src' / 'app' / 'globals.css']:
    patch_css(p)
