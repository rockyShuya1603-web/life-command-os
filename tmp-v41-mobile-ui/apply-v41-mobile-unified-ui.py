#!/usr/bin/env python3
from pathlib import Path
import re
import shutil

NAV_TEMPLATE = """
      <nav id="life-mobile-nav-v41" className="lg:hidden" aria-label="スマホ下部ナビ">
        <div className="life-mobile-nav-v41-grid">
          <button type="button" onClick={() => setPage("home")} className={`life-mobile-nav-v41-item life-mobile-nav-v41-home ${page === "home" ? "is-active" : ""}`} aria-label="ホーム">
            <img src="/mobile-home-button-v40.png" alt="ホーム" />
          </button>
          <button type="button" onClick={() => setPage("memos")} className={`life-mobile-nav-v41-item ${page === "memos" ? "is-active" : ""}`} aria-label="メモ">
            <span className="life-mobile-nav-v41-icon">📝</span><b>メモ</b>
          </button>
          <button type="button" onClick={() => setPage("todos")} className={`life-mobile-nav-v41-item ${page === "todos" ? "is-active" : ""}`} aria-label="TODO">
            <span className="life-mobile-nav-v41-icon">✅</span><b>TODO</b>
          </button>
          <button type="button" onClick={() => setPage("calendar")} className={`life-mobile-nav-v41-item ${page === "calendar" ? "is-active" : ""}`} aria-label="カレンダー">
            <span className="life-mobile-nav-v41-icon">📅</span><b>予定</b>
          </button>
          <button type="button" onClick={() => %MORE_ACTION%} className="life-mobile-nav-v41-item" aria-label="もっと">
            <span className="life-mobile-nav-v41-icon">•••</span><b>もっと</b>
          </button>
        </div>
      </nav>
      <button
        id="life-floating-quickadd-v41"
        type="button"
        onClick={() => %QUICK_ADD_ACTION%}
        className="lg:hidden"
        aria-label="Quick Add"
      >
        <span>＋</span>
      </button>
"""

CSS = r"""

/* ===== v41 mobile unified UI / reference image direction ===== */
@media (max-width: 767px) {
  :root {
    --life-v41-deep: rgba(4, 14, 35, .88);
    --life-v41-card: rgba(9, 28, 62, .58);
    --life-v41-card-strong: rgba(8, 22, 52, .72);
    --life-v41-border: rgba(125, 211, 252, .30);
    --life-v41-glow: rgba(96, 165, 250, .28);
    --life-v41-purple: rgba(168, 85, 247, .28);
  }

  main {
    padding-bottom: calc(8.7rem + env(safe-area-inset-bottom)) !important;
    overflow-x: hidden !important;
  }

  .future-os .relative.z-10.mx-auto.flex,
  .matsuri-app .relative.z-10.mx-auto.flex,
  .relative.z-10.mx-auto.flex {
    display: block !important;
    max-width: 100% !important;
    padding: .72rem .88rem calc(8.5rem + env(safe-area-inset-bottom)) !important;
  }

  aside,
  .future-sidebar,
  .matsuri-sidebar,
  [class*="sidebar"] {
    display: none !important;
  }

  .future-os .min-w-0.flex-1,
  .matsuri-app .min-w-0.flex-1,
  .min-w-0.flex-1 {
    width: 100% !important;
    min-width: 0 !important;
  }

  .future-main-stage,
  .matsuri-main-stage {
    margin-top: 0 !important;
    padding: 0 !important;
  }

  /* Top HUD closer to the reference image */
  .future-top-hud {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto auto !important;
    align-items: center !important;
    gap: .68rem !important;
    margin: 0 auto .86rem !important;
    padding: .65rem .32rem .35rem !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .future-brand-lockup {
    position: relative !important;
    min-width: 0 !important;
    padding-left: 3.05rem !important;
  }

  .future-brand-lockup::before {
    content: "" !important;
    position: absolute !important;
    left: .05rem !important;
    top: 50% !important;
    width: 2.45rem !important;
    height: 2.45rem !important;
    border-radius: 999px !important;
    transform: translateY(-50%) !important;
    background: conic-gradient(from 210deg, #38bdf8, #818cf8, #c084fc, #34d399, #38bdf8) !important;
    box-shadow: 0 0 28px rgba(96,165,250,.75), inset 0 0 0 7px rgba(15,23,42,.42) !important;
  }

  .future-brand-lockup p:first-child {
    font-size: 1.34rem !important;
    line-height: 1.05 !important;
    white-space: nowrap !important;
    letter-spacing: -.03em !important;
  }

  .future-brand-lockup p:nth-child(2) {
    display: none !important;
  }

  .future-search-pill {
    grid-column: 1 / -1 !important;
    order: 10 !important;
    height: 3.05rem !important;
    width: 100% !important;
    justify-content: flex-start !important;
    border-radius: 999px !important;
    padding: 0 1rem !important;
    gap: .72rem !important;
    border: 1px solid rgba(255,255,255,.22) !important;
    background: rgba(255,255,255,.14) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 16px 42px rgba(2,6,23,.18) !important;
    backdrop-filter: blur(20px) saturate(1.25) !important;
  }

  .future-search-pill span:first-child {
    font-size: 2.05rem !important;
  }

  .future-search-pill span:last-child {
    font-size: 1rem !important;
    color: rgba(255,255,255,.70) !important;
  }

  .future-hud-widgets {
    grid-column: 2 / -1 !important;
    justify-content: flex-end !important;
    gap: .52rem !important;
  }

  .future-weather-chip,
  .future-clock-chip,
  .future-mode-row {
    display: none !important;
  }

  .future-icon-button,
  .future-avatar {
    width: 2.85rem !important;
    height: 2.85rem !important;
    min-width: 2.85rem !important;
    border-radius: 999px !important;
    border: 1px solid rgba(125,211,252,.34) !important;
    background: rgba(12,32,65,.56) !important;
    box-shadow: 0 0 24px rgba(96,165,250,.24), inset 0 1px 0 rgba(255,255,255,.18) !important;
  }

  /* Home compact dashboard */
  .future-dashboard,
  .matsuri-dashboard {
    max-width: 100% !important;
    margin: 0 auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: .75rem !important;
  }

  .future-hero-grid,
  .matsuri-hero {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .72rem !important;
  }

  .future-welcome-card,
  .future-progress-card,
  .future-panel-card,
  .future-bottom-grid > .matsuri-card,
  .matsuri-card,
  .matsuri-quest,
  .matsuri-welcome {
    border: 1px solid var(--life-v41-border) !important;
    background:
      radial-gradient(circle at 16% 0%, rgba(125,211,252,.22), transparent 42%),
      linear-gradient(135deg, rgba(255,255,255,.13), rgba(56,189,248,.055) 40%, rgba(2,6,23,.42)) !important;
    box-shadow:
      0 0 0 1px rgba(255,255,255,.045),
      0 16px 44px rgba(2,6,23,.34),
      0 0 26px var(--life-v41-glow),
      inset 0 1px 0 rgba(255,255,255,.20) !important;
    backdrop-filter: blur(21px) saturate(1.22) !important;
  }

  .future-welcome-card,
  .matsuri-welcome {
    width: min(92%, 24rem) !important;
    margin-left: auto !important;
    margin-right: .05rem !important;
    min-height: auto !important;
    border-radius: 1.48rem !important;
    padding: 1.05rem !important;
  }

  .future-kicker {
    font-size: .72rem !important;
    letter-spacing: .24em !important;
    color: rgba(186,230,253,.76) !important;
  }

  .future-welcome-card h2,
  .matsuri-welcome h2 {
    margin-top: .78rem !important;
    font-size: clamp(1.92rem, 8.5vw, 2.72rem) !important;
    line-height: 1.06 !important;
    letter-spacing: -.04em !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: .86rem !important;
    line-height: 1.68 !important;
  }

  .future-welcome-card .grid,
  .matsuri-welcome .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .43rem !important;
    margin-top: .85rem !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    border-radius: .85rem !important;
    padding: .58rem .2rem !important;
    background: rgba(255,255,255,.075) !important;
  }

  .future-stat-tile > div {
    width: 2rem !important;
    height: 2rem !important;
    font-size: .96rem !important;
  }

  .future-stat-tile p:nth-of-type(1) {
    font-size: .55rem !important;
  }

  .future-stat-tile p:nth-of-type(2) {
    font-size: .68rem !important;
  }

  .future-progress-card,
  .future-middle-grid .future-panel-card {
    width: min(78%, 21rem) !important;
    margin-left: auto !important;
    margin-right: .05rem !important;
    border-radius: 1.42rem !important;
    padding: .9rem !important;
  }

  .future-progress-card h3,
  .future-panel-card h3,
  .matsuri-card h3 {
    font-size: 1.1rem !important;
    line-height: 1.1 !important;
  }

  .future-progress-card .mt-5 {
    margin-top: .72rem !important;
  }

  .future-progress-row,
  .future-list-row,
  .matsuri-list-row {
    min-height: 0 !important;
    border-radius: .95rem !important;
    padding: .55rem .68rem !important;
    font-size: .76rem !important;
  }

  .future-progress-row span:nth-child(2),
  .future-list-row span:last-child {
    white-space: nowrap !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
  }

  .future-launch-card,
  .future-mind-capture-home,
  .future-middle-grid > .future-panel-card:nth-child(3),
  .future-motivation-card,
  .future-footer-strip {
    display: none !important;
  }

  .future-middle-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .74rem !important;
  }

  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: .56rem !important;
    width: min(94%, 25rem) !important;
    margin-left: auto !important;
    margin-right: .05rem !important;
  }

  .future-bottom-grid > .matsuri-card {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 1.2rem !important;
    padding: .78rem !important;
    min-height: 8.1rem !important;
  }

  .future-bottom-grid > .matsuri-card:nth-child(n+3) {
    display: none !important;
  }

  .future-bottom-grid h3,
  .future-bottom-grid .matsuri-card h3 {
    font-size: .95rem !important;
  }

  .future-bottom-grid .text-xl,
  .future-bottom-grid .text-2xl,
  .future-bottom-grid .text-3xl {
    font-size: 1.18rem !important;
  }

  .future-bottom-grid .grid {
    gap: .2rem !important;
  }

  .future-bottom-grid .grid > div {
    padding: .3rem !important;
  }

  /* Memo / TODO / Calendar mobile page unification */
  .future-page-shell,
  .matsuri-page-shell,
  .page-shell,
  section[class*="Panel"],
  section[class*="panel"],
  .glass-card,
  .matsuri-card {
    border-color: var(--life-v41-border) !important;
  }

  .future-os input,
  .future-os textarea,
  .future-os select,
  .matsuri-app input,
  .matsuri-app textarea,
  .matsuri-app select {
    border-radius: 1.1rem !important;
    border: 1px solid rgba(125,211,252,.22) !important;
    background: rgba(2,6,23,.34) !important;
    color: white !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.08) !important;
  }

  .future-os button,
  .matsuri-app button {
    touch-action: manipulation !important;
  }

  [data-page="memos"],
  [data-page="todos"],
  [data-page="calendar"] {
    border-radius: 1.5rem !important;
  }

  /* Final mobile nav */
  nav.safe-bottom,
  .safe-bottom,
  #hard-mobile-nav,
  #image-mobile-nav-v39,
  #image-mobile-nav-v40,
  .lc-mobile-nav-final,
  .mobile-bottom-nav-v373,
  .force-mobile-nav-v374,
  [class*="mobile-bottom-nav"],
  [class*="force-mobile-nav"],
  [class*="hard-mobile-nav"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .quick-add-fab,
  #image-floating-quickadd-v39,
  #image-floating-quickadd-v40 {
    display: none !important;
  }

  #life-mobile-nav-v41 {
    display: block !important;
    position: fixed !important;
    left: .78rem !important;
    right: .78rem !important;
    bottom: max(.55rem, env(safe-area-inset-bottom)) !important;
    z-index: 999990 !important;
    border-radius: 1.75rem !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    background: linear-gradient(135deg, rgba(6,23,52,.88), rgba(4,12,32,.93)) !important;
    box-shadow: 0 0 38px rgba(56,189,248,.18), inset 0 1px 0 rgba(255,255,255,.15) !important;
    backdrop-filter: blur(20px) saturate(1.35) !important;
    padding: .48rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-grid {
    display: grid !important;
    grid-template-columns: 1.16fr 1fr 1fr 1fr 1fr !important;
    gap: .26rem !important;
    align-items: end !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-item {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 0 !important;
    min-height: 4.05rem !important;
    border: 0 !important;
    border-radius: 1.3rem !important;
    background: transparent !important;
    color: rgba(226,232,240,.78) !important;
    font-size: .7rem !important;
    font-weight: 900 !important;
    line-height: 1.05 !important;
    gap: .13rem !important;
    padding: .32rem .16rem !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-item.is-active:not(.life-mobile-nav-v41-home) {
    background: linear-gradient(135deg, rgba(96,165,250,.42), rgba(125,211,252,.18)) !important;
    color: white !important;
    box-shadow: 0 0 22px rgba(96,165,250,.24), inset 0 1px 0 rgba(255,255,255,.2) !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-icon {
    display: flex !important;
    width: 1.75rem !important;
    height: 1.75rem !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 1.15rem !important;
  }

  #life-mobile-nav-v41 b {
    display: block !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    font-weight: 900 !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-home {
    padding: 0 !important;
    background: transparent !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-home img {
    display: block !important;
    width: 100% !important;
    max-width: 5.05rem !important;
    height: auto !important;
    object-fit: contain !important;
    filter: drop-shadow(0 0 10px rgba(125,211,252,.24)) !important;
    opacity: .92 !important;
  }

  #life-mobile-nav-v41 .life-mobile-nav-v41-home.is-active img {
    opacity: 1 !important;
    transform: translateY(-1px) scale(1.02) !important;
    filter: drop-shadow(0 0 18px rgba(125,211,252,.36)) !important;
  }

  #life-floating-quickadd-v41 {
    display: flex !important;
    position: fixed !important;
    right: 1.05rem !important;
    bottom: calc(6.05rem + env(safe-area-inset-bottom)) !important;
    z-index: 999991 !important;
    width: 4.15rem !important;
    height: 4.15rem !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 999px !important;
    border: 1px solid rgba(255,255,255,.28) !important;
    background: conic-gradient(from 180deg, #5eead4, #38bdf8, #818cf8, #c084fc, #f472b6, #fb7185, #fbbf24, #5eead4) !important;
    box-shadow: 0 0 34px rgba(125,211,252,.44), 0 0 64px rgba(168,85,247,.28), inset 0 1px 0 rgba(255,255,255,.3) !important;
    color: white !important;
    font-size: 2.2rem !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }

  #life-floating-quickadd-v41 span {
    display: flex !important;
    width: 3.18rem !important;
    height: 3.18rem !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 999px !important;
    background: rgba(15,23,42,.36) !important;
    text-shadow: 0 2px 16px rgba(0,0,0,.42) !important;
  }
}
"""

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
    return NAV_TEMPLATE.replace("%MORE_ACTION%", more_action).replace("%QUICK_ADD_ACTION%", quick_add_action)

def patch_page(path: Path):
    if not path.exists():
        return
    text = path.read_text()

    for marker, kind in [
        ('<div id="hard-mobile-nav"', "div"),
        ('<nav id="image-mobile-nav-v39"', "nav"),
        ('<nav id="image-mobile-nav-v40"', "nav"),
        ('<nav id="life-mobile-nav-v41"', "nav"),
        ('<nav className="lc-mobile-nav-final', "nav"),
        ('<nav className="safe-bottom', "nav"),
        ('<nav className="mobile-bottom', "nav"),
        ('<nav className="force-mobile', "nav"),
    ]:
        text = remove_block(text, marker, kind)

    for marker in [
        '<button\n        id="image-floating-quickadd-v39"',
        '<button id="image-floating-quickadd-v39"',
        '<button\n        id="image-floating-quickadd-v40"',
        '<button id="image-floating-quickadd-v40"',
        '<button\n        id="life-floating-quickadd-v41"',
        '<button id="life-floating-quickadd-v41"',
    ]:
        text = remove_button_by_id(text, marker)

    idx = text.rfind("    </main>")
    if idx == -1:
        idx = text.rfind("</main>")
    if idx == -1:
        raise SystemExit(f"{path}: </main> が見つかりません")

    text = text[:idx] + build_nav(text) + "\n" + text[idx:]
    path.write_text(text)
    print("patched", path)

def patch_css(path: Path):
    if not path.exists():
        return
    text = path.read_text()
    if "v41 mobile unified UI / reference image direction" not in text:
        text += CSS
    path.write_text(text)
    print("patched", path)

def copy_asset(root: Path):
    src = Path(__file__).resolve().parent / "mobile-home-button-v40.png"
    public = root / "public"
    public.mkdir(exist_ok=True)
    target = public / "mobile-home-button-v40.png"
    shutil.copyfile(src, target)
    print("copied", target)

root = Path.cwd()
copy_asset(root)
for file in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    patch_page(file)
for file in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    patch_css(file)
