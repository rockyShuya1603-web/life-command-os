#!/usr/bin/env python3
from pathlib import Path
import shutil

CSS = r"""

/* ===== v42 mobile proportion fix / closer to ideal ===== */
@media (max-width: 767px) {
  main {
    padding-bottom: calc(7.4rem + env(safe-area-inset-bottom)) !important;
  }

  .future-top-hud {
    gap: .6rem !important;
    padding: .38rem 0 .28rem !important;
    margin-bottom: .62rem !important;
  }

  .future-brand-lockup {
    padding-left: 3rem !important;
  }

  .future-brand-lockup p:first-child {
    font-size: 1.22rem !important;
  }

  .future-search-pill {
    height: 2.82rem !important;
    margin-top: .08rem !important;
  }

  .future-icon-button,
  .future-avatar {
    width: 2.65rem !important;
    height: 2.65rem !important;
    min-width: 2.65rem !important;
  }

  .future-dashboard,
  .matsuri-dashboard {
    gap: .62rem !important;
  }

  /* make the page less vertically stretched */
  .future-welcome-card,
  .matsuri-welcome,
  .future-progress-card,
  .future-panel-card,
  .future-bottom-grid,
  .future-bottom-grid > .matsuri-card {
    width: 100% !important;
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  .future-welcome-card,
  .matsuri-welcome {
    padding: .95rem .95rem .82rem !important;
    border-radius: 1.32rem !important;
  }

  .future-welcome-card h2,
  .matsuri-welcome h2 {
    font-size: clamp(1.55rem, 7.5vw, 2.18rem) !important;
    margin-top: .52rem !important;
    margin-bottom: .2rem !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: .82rem !important;
    line-height: 1.5 !important;
  }

  .future-welcome-card .grid,
  .matsuri-welcome .grid {
    gap: .34rem !important;
    margin-top: .68rem !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    padding: .48rem .16rem !important;
    min-height: 5.2rem !important;
  }

  .future-progress-card {
    padding: .84rem .88rem .78rem !important;
    border-radius: 1.28rem !important;
  }

  .future-progress-card .mt-5,
  .future-panel-card .mt-5,
  .matsuri-card .mt-5 {
    margin-top: .55rem !important;
  }

  .future-progress-row,
  .future-list-row,
  .matsuri-list-row {
    padding: .5rem .62rem !important;
    min-height: auto !important;
  }

  .future-middle-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: .56rem !important;
  }

  .future-middle-grid > .future-panel-card {
    min-width: 0 !important;
    padding: .82rem !important;
    border-radius: 1.24rem !important;
  }

  .future-middle-grid > .future-panel-card h3 {
    font-size: 1rem !important;
  }

  .future-middle-grid > .future-panel-card .space-y-3,
  .future-middle-grid > .future-panel-card .space-y-4 {
    gap: .35rem !important;
  }

  .future-middle-grid > .future-panel-card:nth-child(1) {
    min-height: 10.9rem !important;
  }

  .future-middle-grid > .future-panel-card:nth-child(2) {
    min-height: 10.9rem !important;
  }

  .future-bottom-grid {
    grid-template-columns: 1fr 1fr !important;
    gap: .56rem !important;
  }

  .future-bottom-grid > .matsuri-card {
    min-height: 8rem !important;
    padding: .75rem !important;
  }

  /* keep only one weather block visible if duplicate variants exist */
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card {
    display: none !important;
  }

  /* use bottom nav exactly like target */
  #life-mobile-nav-v41 {
    left: .68rem !important;
    right: .68rem !important;
    bottom: max(.48rem, env(safe-area-inset-bottom)) !important;
    border-radius: 1.58rem !important;
    padding: .42rem .44rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-grid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .1rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-home img {
    max-width: 4.5rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-item {
    min-height: 4rem !important;
    border-radius: 1.1rem !important;
    padding: .32rem .12rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-icon {
    width: 1.58rem !important;
    height: 1.58rem !important;
    font-size: 1.08rem !important;
  }

  #life-mobile-nav-v41 b {
    font-size: .74rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-home {
    background: linear-gradient(135deg, rgba(96,165,250,.34), rgba(125,211,252,.16)) !important;
    box-shadow: 0 0 20px rgba(96,165,250,.18), inset 0 1px 0 rgba(255,255,255,.18) !important;
  }

  /* quick add as smaller floating orb like the ideal */
  #life-floating-quickadd-v41 {
    width: 3.72rem !important;
    height: 3.72rem !important;
    right: 1rem !important;
    bottom: calc(5.75rem + env(safe-area-inset-bottom)) !important;
  }

  #life-floating-quickadd-v41 span {
    width: 2.92rem !important;
    height: 2.92rem !important;
    font-size: 2rem !important;
  }

  /* if target page supports a dedicated calendar label, make it longer but keep compact */
  #life-mobile-nav-v41 .life-mobile-nav-v41-item[aria-label="カレンダー"] b {
    font-size: .72rem !important;
  }
}
"""


def patch_css(path: Path):
    if not path.exists():
        return False
    text = path.read_text()
    if 'v42 mobile proportion fix / closer to ideal' not in text:
        text += CSS
        path.write_text(text)
    print('patched', path)
    return True


def patch_page(path: Path):
    if not path.exists():
        return False
    text = path.read_text()
    text = text.replace('aria-label="カレンダー">\n            <span className="life-mobile-nav-v41-icon">📅</span><b>予定</b>',
                        'aria-label="カレンダー">\n            <span className="life-mobile-nav-v41-icon">📅</span><b>カレンダー</b>')
    text = text.replace('aria-label="予定">\n            <span className="life-mobile-nav-v41-icon">📅</span><b>予定</b>',
                        'aria-label="カレンダー">\n            <span className="life-mobile-nav-v41-icon">📅</span><b>カレンダー</b>')
    path.write_text(text)
    print('patched', path)
    return True


def copy_asset(root: Path):
    src = Path(__file__).resolve().parent / 'mobile-home-button-v40.png'
    public = root / 'public'
    public.mkdir(exist_ok=True)
    dst = public / 'mobile-home-button-v40.png'
    if src.exists():
        shutil.copyfile(src, dst)
        print('copied', dst)

root = Path.cwd()
copy_asset(root)
for file in [root/'app'/'page.tsx', root/'src'/'app'/'page.tsx']:
    patch_page(file)
for file in [root/'app'/'globals.css', root/'src'/'app'/'globals.css']:
    patch_css(file)
