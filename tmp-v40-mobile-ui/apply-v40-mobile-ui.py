#!/usr/bin/env python3
from pathlib import Path
import re
import shutil

CSS = r'''

/* ===== v40 mobile UI polish + home image button ===== */
@media (max-width: 767px) {
  :root {
    --v40-card-border: rgba(125, 211, 252, 0.28);
    --v40-card-glow: rgba(96, 165, 250, 0.24);
  }

  /* overall vertical compaction */
  main {
    padding-bottom: calc(8.6rem + env(safe-area-inset-bottom)) !important;
  }

  .matsuri-dashboard,
  .future-dashboard,
  .future-hero-grid,
  .future-bottom-grid,
  .matsuri-hero {
    gap: .85rem !important;
  }

  .matsuri-welcome,
  .future-welcome-card,
  .future-progress-card,
  .future-panel-card,
  .matsuri-quest,
  .matsuri-card,
  .future-bottom-grid > div,
  .future-bottom-grid > section,
  .future-bottom-grid > article {
    border-radius: 1.45rem !important;
    box-shadow:
      0 18px 48px rgba(2, 6, 23, 0.32),
      0 0 22px var(--v40-card-glow),
      inset 0 1px 0 rgba(255,255,255,.16) !important;
  }

  .matsuri-welcome,
  .future-welcome-card {
    min-height: auto !important;
    padding: 1.15rem !important;
  }

  .matsuri-welcome h2,
  .future-welcome-card h2 {
    font-size: clamp(1.95rem, 8vw, 2.8rem) !important;
    line-height: 1.08 !important;
    margin-top: .65rem !important;
  }

  .matsuri-welcome p,
  .future-welcome-card p {
    line-height: 1.72 !important;
  }

  .matsuri-hero,
  .future-hero-grid {
    grid-template-columns: 1fr !important;
  }

  .matsuri-dashboard > .grid,
  .future-dashboard > .grid {
    grid-template-columns: 1fr !important;
  }

  .matsuri-dashboard > .grid:last-child,
  .future-bottom-grid {
    grid-template-columns: 1fr 1fr !important;
  }

  .matsuri-dashboard > .grid:last-child > :first-child,
  .future-bottom-grid > :first-child,
  .future-bottom-grid > :nth-child(2) {
    min-height: 0 !important;
  }

  .matsuri-dashboard > .grid:last-child > :nth-child(n+3),
  .future-bottom-grid > :nth-child(n+3) {
    display: none !important;
  }

  .future-top-hud {
    padding-top: .35rem !important;
    margin-bottom: .75rem !important;
  }

  .future-search-pill,
  .future-search-bar,
  .future-search {
    min-height: 3rem !important;
    border-radius: 999px !important;
  }

  /* hide legacy mobile nav variations */
  nav.safe-bottom,
  .safe-bottom,
  #hard-mobile-nav,
  .hard-mobile-nav,
  .lc-mobile-nav-final,
  #image-mobile-nav-v39,
  [class*="mobile-bottom-nav"],
  [class*="force-mobile-nav"],
  [class*="lc-mobile-nav-final"],
  [class*="hard-mobile-nav"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .quick-add-fab,
  #image-floating-quickadd-v39 {
    display: none !important;
  }

  #image-mobile-nav-v40 {
    display: block !important;
    position: fixed !important;
    left: .8rem !important;
    right: .8rem !important;
    bottom: max(.55rem, env(safe-area-inset-bottom)) !important;
    z-index: 999990 !important;
    border-radius: 1.8rem !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    background: linear-gradient(135deg, rgba(6, 23, 52, .88), rgba(4, 12, 32, .92)) !important;
    box-shadow: 0 0 38px rgba(56,189,248,.18), inset 0 1px 0 rgba(255,255,255,.15) !important;
    backdrop-filter: blur(20px) saturate(1.35) !important;
    padding: .52rem !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-grid-v40 {
    display: grid !important;
    grid-template-columns: 1.18fr 1fr 1fr 1fr 1fr !important;
    gap: .28rem !important;
    align-items: end !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-item-v40 {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 0 !important;
    min-height: 4.1rem !important;
    border: 0 !important;
    border-radius: 1.35rem !important;
    background: transparent !important;
    color: rgba(226,232,240,.78) !important;
    font-size: .72rem !important;
    font-weight: 900 !important;
    line-height: 1.05 !important;
    gap: .15rem !important;
    padding: .35rem .2rem !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-item-v40.is-active:not(.image-mobile-nav-home-v40) {
    background: linear-gradient(135deg, rgba(96,165,250,.42), rgba(125,211,252,.18)) !important;
    color: white !important;
    box-shadow: 0 0 22px rgba(96,165,250,.24), inset 0 1px 0 rgba(255,255,255,.2) !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-icon-v40 {
    display: flex !important;
    width: 1.8rem !important;
    height: 1.8rem !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 1.2rem !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-item-v40 b {
    display: block !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    font-weight: 900 !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-home-v40 {
    padding: 0 !important;
    background: transparent !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-home-v40 img {
    display: block !important;
    width: 100% !important;
    max-width: 5.1rem !important;
    height: auto !important;
    object-fit: contain !important;
    filter: drop-shadow(0 0 10px rgba(125,211,252,.24));
    opacity: .92 !important;
  }

  #image-mobile-nav-v40 .image-mobile-nav-home-v40.is-active img {
    opacity: 1 !important;
    transform: translateY(-1px) scale(1.02) !important;
    filter: drop-shadow(0 0 18px rgba(125,211,252,.36));
  }

  #image-floating-quickadd-v40 {
    display: flex !important;
    position: fixed !important;
    right: 1.05rem !important;
    bottom: calc(6.15rem + env(safe-area-inset-bottom)) !important;
    z-index: 999991 !important;
    width: 4.35rem !important;
    height: 4.35rem !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 999px !important;
    border: 1px solid rgba(255,255,255,.28) !important;
    background: conic-gradient(from 180deg, #5eead4, #38bdf8, #818cf8, #c084fc, #f472b6, #fb7185, #fbbf24, #5eead4) !important;
    box-shadow: 0 0 34px rgba(125,211,252,.44), 0 0 64px rgba(168,85,247,.28), inset 0 1px 0 rgba(255,255,255,.3) !important;
    color: white !important;
    font-size: 2.25rem !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }

  #image-floating-quickadd-v40 span {
    display: flex !important;
    width: 3.35rem !important;
    height: 3.35rem !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 999px !important;
    background: rgba(15, 23, 42, .36) !important;
    text-shadow: 0 2px 16px rgba(0,0,0,.42) !important;
  }
}
'''

NAV_TEMPLATE = '''
      <nav id="image-mobile-nav-v40" className="lg:hidden" aria-label="スマホ下部ナビ">
        <div className="image-mobile-nav-grid-v40">
          <button type="button" onClick={() => setPage("home")} className={`image-mobile-nav-item-v40 image-mobile-nav-home-v40 ${page === "home" ? "is-active" : ""}`} aria-label="ホーム">
            <img src="/mobile-home-button-v40.png" alt="ホーム" />
          </button>
          <button type="button" onClick={() => setPage("memos")} className={`image-mobile-nav-item-v40 ${page === "memos" ? "is-active" : ""}`} aria-label="メモ">
            <span className="image-mobile-nav-icon-v40">📝</span><b>メモ</b>
          </button>
          <button type="button" onClick={() => setPage("todos")} className={`image-mobile-nav-item-v40 ${page === "todos" ? "is-active" : ""}`} aria-label="TODO">
            <span className="image-mobile-nav-icon-v40">✅</span><b>TODO</b>
          </button>
          <button type="button" onClick={() => setPage("calendar")} className={`image-mobile-nav-item-v40 ${page === "calendar" ? "is-active" : ""}`} aria-label="カレンダー">
            <span className="image-mobile-nav-icon-v40">📅</span><b>予定</b>
          </button>
          <button type="button" onClick={() => %MORE_ACTION%} className={`image-mobile-nav-item-v40 ${page === "settings" ? "is-active" : ""}`} aria-label="もっと">
            <span className="image-mobile-nav-icon-v40">•••</span><b>もっと</b>
          </button>
        </div>
      </nav>
      <button
        id="image-floating-quickadd-v40"
        type="button"
        onClick={() => %QUICK_ADD_ACTION%}
        className="lg:hidden"
        aria-label="Quick Add"
      >
        <span>＋</span>
      </button>
'''


def find_matching_div_end(text: str, start: int) -> int:
    pattern = re.compile(r"</?div\b[^>]*>", re.I)
    depth = 0
    seen = False
    for m in pattern.finditer(text, start):
        token = m.group(0)
        if token.startswith("</"):
            depth -= 1
            if seen and depth == 0:
                return m.end()
        else:
            depth += 1
            seen = True
    return -1


def remove_block(text: str, marker: str, kind: str) -> str:
    while True:
        start = text.find(marker)
        if start == -1:
            return text
        line_start = text.rfind("\n", 0, start)
        if line_start == -1:
            line_start = start
        if kind == "nav":
            end = text.find("</nav>", start)
            if end == -1:
                return text
            end += len("</nav>")
        else:
            end = find_matching_div_end(text, start)
            if end == -1:
                return text
        text = text[:line_start] + "\n" + text[end:]


def remove_button_by_id(text: str, marker: str) -> str:
    while True:
        start = text.find(marker)
        if start == -1:
            return text
        line_start = text.rfind("\n", 0, start)
        if line_start == -1:
            line_start = start
        end = text.find("</button>", start)
        if end == -1:
            return text
        text = text[:line_start] + "\n" + text[end + len("</button>"):]


def build_nav(text: str) -> str:
    more_action = 'setCommandOpen(true)' if 'setCommandOpen' in text else 'setPage("settings")'
    quick_add_action = 'setQuickAddOpen(true)' if 'setQuickAddOpen' in text else 'setPage("braindump")'
    return NAV_TEMPLATE.replace('%MORE_ACTION%', more_action).replace('%QUICK_ADD_ACTION%', quick_add_action)


def patch_page(path: Path):
    if not path.exists():
        return
    text = path.read_text()

    # remove previous mobile nav / quick add variants
    for marker, kind in [
        ('<div id="hard-mobile-nav"', 'div'),
        ('<nav id="image-mobile-nav-v39"', 'nav'),
        ('<nav id="image-mobile-nav-v40"', 'nav'),
        ('<nav className="lc-mobile-nav-final', 'nav'),
        ('<nav className="safe-bottom', 'nav'),
        ('<nav className="mobile-bottom', 'nav'),
        ('<nav className="force-mobile', 'nav'),
    ]:
        text = remove_block(text, marker, kind)

    for marker in [
        '<button\n        id="image-floating-quickadd-v39"',
        '<button id="image-floating-quickadd-v39"',
        '<button\n        id="image-floating-quickadd-v40"',
        '<button id="image-floating-quickadd-v40"',
    ]:
        text = remove_button_by_id(text, marker)

    idx = text.rfind('    </main>')
    if idx == -1:
        idx = text.rfind('</main>')
    if idx == -1:
        raise SystemExit(f'{path}: </main> が見つかりません')

    nav = build_nav(text)
    text = text[:idx] + nav + '\n' + text[idx:]
    path.write_text(text)
    print('patched', path)


def patch_css(path: Path):
    if not path.exists():
        return
    text = path.read_text()
    if 'v40 mobile UI polish + home image button' not in text:
        text += CSS
    path.write_text(text)
    print('patched', path)


def copy_asset(project_root: Path):
    src = Path(__file__).resolve().parent / 'mobile-home-button-v40.png'
    for public_dir in [project_root / 'public', project_root / 'src' / 'public']:
        if public_dir.exists():
            target = public_dir / 'mobile-home-button-v40.png'
            shutil.copyfile(src, target)
            print('copied', target)


project_root = Path.cwd()
copy_asset(project_root)
for file in [project_root / 'app' / 'page.tsx', project_root / 'src' / 'app' / 'page.tsx']:
    patch_page(file)
for file in [project_root / 'app' / 'globals.css', project_root / 'src' / 'app' / 'globals.css']:
    patch_css(file)
