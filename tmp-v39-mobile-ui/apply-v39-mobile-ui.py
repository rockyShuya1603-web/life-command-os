#!/usr/bin/env python3
from pathlib import Path
import re

FINAL_MOBILE_NAV = """
      <nav id="image-mobile-nav-v39" className="lg:hidden" aria-label="スマホ下部ナビ">
        <div className="image-mobile-nav-grid-v39">
          <button type="button" onClick={() => setPage("home")} className={`image-mobile-nav-item-v39 ${page === "home" ? "is-active" : ""}`} aria-label="ホーム">
            <span className="image-mobile-nav-icon-v39">🏠</span><b>ホーム</b>
          </button>
          <button type="button" onClick={() => setPage("memos")} className={`image-mobile-nav-item-v39 ${page === "memos" ? "is-active" : ""}`} aria-label="メモ">
            <span className="image-mobile-nav-icon-v39">📝</span><b>メモ</b>
          </button>
          <button type="button" onClick={() => setPage("todos")} className={`image-mobile-nav-item-v39 ${page === "todos" ? "is-active" : ""}`} aria-label="TODO">
            <span className="image-mobile-nav-icon-v39">☑️</span><b>TODO</b>
          </button>
          <button type="button" onClick={() => setPage("calendar")} className={`image-mobile-nav-item-v39 ${page === "calendar" ? "is-active" : ""}`} aria-label="カレンダー">
            <span className="image-mobile-nav-icon-v39">📅</span><b>カレンダー</b>
          </button>
          <button type="button" onClick={() => setCommandOpen(true)} className="image-mobile-nav-item-v39" aria-label="もっと">
            <span className="image-mobile-nav-icon-v39">•••</span><b>もっと</b>
          </button>
        </div>
      </nav>
      <button
        id="image-floating-quickadd-v39"
        type="button"
        onClick={() => setQuickAddOpen(true)}
        className="lg:hidden"
        aria-label="Quick Add"
      >
        <span>＋</span>
      </button>
"""

CSS = r"""

/* ===== v39 mobile UI based on reference image ===== */
@media (max-width: 767px) {
  :root {
    --v39-card-bg: rgba(8, 27, 56, .58);
    --v39-card-border: rgba(125, 211, 252, .30);
    --v39-card-glow: rgba(56, 189, 248, .26);
  }

  .future-os .relative.z-10.mx-auto.flex {
    display: block !important;
    max-width: 100% !important;
    padding: .75rem .95rem calc(7.7rem + env(safe-area-inset-bottom)) !important;
  }

  .future-os .min-w-0.flex-1 {
    width: 100% !important;
    min-width: 0 !important;
  }

  .future-os .future-main-stage {
    margin-top: 0 !important;
    padding: 0 !important;
  }

  .future-top-hud {
    display: grid !important;
    grid-template-columns: 1fr auto auto !important;
    align-items: center !important;
    gap: .75rem !important;
    margin: 0 auto 1rem !important;
    padding: .95rem .45rem .4rem !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .future-brand-lockup {
    position: relative !important;
    min-width: 0 !important;
    padding-left: 3.2rem !important;
  }

  .future-brand-lockup::before {
    content: "" !important;
    position: absolute !important;
    left: .05rem !important;
    top: 50% !important;
    width: 2.55rem !important;
    height: 2.55rem !important;
    border-radius: 999px !important;
    transform: translateY(-50%) !important;
    background: conic-gradient(from 210deg, #38bdf8, #818cf8, #c084fc, #34d399, #38bdf8) !important;
    box-shadow: 0 0 28px rgba(96, 165, 250, .8), inset 0 0 0 7px rgba(15, 23, 42, .42) !important;
  }

  .future-brand-lockup p:first-child {
    font-size: 1.35rem !important;
    line-height: 1.05 !important;
    white-space: nowrap !important;
  }

  .future-brand-lockup p:nth-child(2) {
    display: none !important;
  }

  .future-search-pill {
    grid-column: 1 / -1 !important;
    order: 8 !important;
    width: 100% !important;
    height: 3.25rem !important;
    justify-content: flex-start !important;
    gap: .75rem !important;
    border-radius: 999px !important;
    padding: 0 1rem !important;
    border: 1px solid rgba(255,255,255,.22) !important;
    background: rgba(255,255,255,.14) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.18), 0 16px 42px rgba(2,6,23,.20) !important;
    backdrop-filter: blur(20px) saturate(1.3) !important;
  }

  .future-search-pill span:first-child {
    font-size: 2.2rem !important;
  }

  .future-search-pill span:last-child {
    font-size: 1rem !important;
    color: rgba(255,255,255,.72) !important;
  }

  .future-hud-widgets {
    grid-column: 2 / -1 !important;
    justify-content: flex-end !important;
    align-items: center !important;
    gap: .55rem !important;
  }

  .future-weather-chip,
  .future-clock-chip {
    display: none !important;
  }

  .future-icon-button,
  .future-avatar {
    width: 3rem !important;
    height: 3rem !important;
    min-width: 3rem !important;
    border-radius: 999px !important;
    border: 1px solid rgba(125,211,252,.34) !important;
    background: rgba(12, 32, 65, .54) !important;
    box-shadow: 0 0 26px rgba(96,165,250,.24), inset 0 1px 0 rgba(255,255,255,.18) !important;
  }

  .future-avatar {
    font-size: 1.1rem !important;
  }

  .future-mode-row {
    display: none !important;
  }

  .future-dashboard {
    max-width: 760px !important;
    margin: 0 auto !important;
    display: flex !important;
    flex-direction: column !important;
    gap: .9rem !important;
  }

  .future-hero-grid {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .9rem !important;
  }

  .future-welcome-card,
  .future-progress-card,
  .future-panel-card,
  .future-bottom-grid > .matsuri-card {
    border: 1px solid var(--v39-card-border) !important;
    background:
      linear-gradient(135deg, rgba(255,255,255,.14), rgba(56,189,248,.06) 38%, rgba(2,6,23,.40)) !important;
    box-shadow:
      0 0 0 1px rgba(255,255,255,.05),
      0 18px 54px rgba(2,6,23,.38),
      0 0 32px var(--v39-card-glow),
      inset 0 1px 0 rgba(255,255,255,.22) !important;
    backdrop-filter: blur(22px) saturate(1.25) !important;
  }

  .future-welcome-card {
    width: 89% !important;
    margin-left: auto !important;
    margin-right: .1rem !important;
    min-height: auto !important;
    border-radius: 1.45rem !important;
    padding: 1.25rem !important;
  }

  .future-kicker {
    font-size: .77rem !important;
    letter-spacing: .26em !important;
    color: rgba(186,230,253,.78) !important;
  }

  .future-welcome-card h2 {
    margin-top: 1rem !important;
    font-size: clamp(2.15rem, 9.5vw, 3.15rem) !important;
    line-height: 1.04 !important;
    letter-spacing: -.04em !important;
  }

  .future-welcome-card p {
    font-size: .9rem !important;
    line-height: 1.82 !important;
  }

  .future-welcome-card .grid {
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .5rem !important;
    margin-top: 1rem !important;
  }

  .future-stat-tile {
    border-radius: .9rem !important;
    padding: .65rem .25rem !important;
    background: rgba(255,255,255,.08) !important;
  }

  .future-stat-tile > div {
    width: 2.25rem !important;
    height: 2.25rem !important;
    font-size: 1rem !important;
  }

  .future-stat-tile p:nth-of-type(1) {
    font-size: .58rem !important;
  }

  .future-stat-tile p:nth-of-type(2) {
    font-size: .72rem !important;
  }

  .future-progress-card,
  .future-middle-grid .future-panel-card {
    width: 76% !important;
    margin-left: auto !important;
    margin-right: .1rem !important;
    border-radius: 1.45rem !important;
    padding: 1rem !important;
  }

  .future-progress-card h3,
  .future-panel-card h3 {
    font-size: 1.18rem !important;
    line-height: 1.1 !important;
  }

  .future-progress-card .mt-5 {
    margin-top: .85rem !important;
  }

  .future-progress-row,
  .future-list-row {
    min-height: 0 !important;
    border-radius: 1rem !important;
    padding: .65rem .75rem !important;
    font-size: .78rem !important;
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
    gap: .9rem !important;
  }

  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: .65rem !important;
    width: 92% !important;
    margin-left: auto !important;
    margin-right: .1rem !important;
  }

  .future-bottom-grid > .matsuri-card {
    width: 100% !important;
    margin: 0 !important;
    border-radius: 1.25rem !important;
    padding: .9rem !important;
    min-height: 9.5rem !important;
  }

  .future-bottom-grid > .matsuri-card:last-child {
    order: -1 !important;
  }

  .future-bottom-grid h3,
  .future-bottom-grid .matsuri-card h3 {
    font-size: 1rem !important;
  }

  .future-bottom-grid .text-xl,
  .future-bottom-grid .text-2xl,
  .future-bottom-grid .text-3xl {
    font-size: 1.25rem !important;
  }

  .future-bottom-grid .grid {
    gap: .25rem !important;
  }

  .future-bottom-grid .grid > div {
    padding: .35rem !important;
  }

  #image-mobile-nav-v39 {
    display: block !important;
    position: fixed !important;
    left: 1.1rem !important;
    right: 1.1rem !important;
    bottom: max(.8rem, env(safe-area-inset-bottom)) !important;
    z-index: 999990 !important;
    border-radius: 999px !important;
    border: 1px solid rgba(255,255,255,.18) !important;
    background: linear-gradient(135deg, rgba(8, 25, 55, .72), rgba(2, 8, 23, .82)) !important;
    box-shadow: 0 0 38px rgba(56,189,248,.25), inset 0 1px 0 rgba(255,255,255,.18) !important;
    backdrop-filter: blur(20px) saturate(1.35) !important;
    padding: .48rem !important;
  }

  #image-mobile-nav-v39 .image-mobile-nav-grid-v39 {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .25rem !important;
  }

  #image-mobile-nav-v39 .image-mobile-nav-item-v39 {
    display: flex !important;
    flex-direction: column !important;
    align-items: center !important;
    justify-content: center !important;
    min-width: 0 !important;
    min-height: 3.2rem !important;
    border: 0 !important;
    border-radius: 1.2rem !important;
    background: transparent !important;
    color: rgba(226,232,240,.66) !important;
    font-size: .68rem !important;
    font-weight: 900 !important;
    line-height: 1 !important;
    gap: .08rem !important;
  }

  #image-mobile-nav-v39 .image-mobile-nav-item-v39.is-active {
    background: linear-gradient(135deg, rgba(96,165,250,.78), rgba(125,211,252,.35)) !important;
    color: white !important;
    box-shadow: 0 0 22px rgba(96,165,250,.38), inset 0 1px 0 rgba(255,255,255,.28) !important;
  }

  #image-mobile-nav-v39 .image-mobile-nav-icon-v39 {
    display: flex !important;
    width: 1.65rem !important;
    height: 1.65rem !important;
    align-items: center !important;
    justify-content: center !important;
    font-size: 1.1rem !important;
  }

  #image-mobile-nav-v39 b {
    display: block !important;
    max-width: 100% !important;
    overflow: hidden !important;
    text-overflow: ellipsis !important;
    white-space: nowrap !important;
    font-weight: 900 !important;
  }

  #image-floating-quickadd-v39 {
    display: flex !important;
    position: fixed !important;
    right: 1.3rem !important;
    bottom: calc(5.95rem + env(safe-area-inset-bottom)) !important;
    z-index: 999991 !important;
    width: 4.2rem !important;
    height: 4.2rem !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 999px !important;
    border: 1px solid rgba(255,255,255,.28) !important;
    background: conic-gradient(from 180deg, #38bdf8, #818cf8, #c084fc, #f472b6, #38bdf8) !important;
    box-shadow: 0 0 34px rgba(125,211,252,.48), 0 0 60px rgba(168,85,247,.32), inset 0 1px 0 rgba(255,255,255,.3) !important;
    color: white !important;
    font-size: 2.3rem !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }

  #image-floating-quickadd-v39 span {
    display: flex !important;
    width: 3.25rem !important;
    height: 3.25rem !important;
    align-items: center !important;
    justify-content: center !important;
    border-radius: 999px !important;
    background: rgba(32, 43, 88, .30) !important;
    text-shadow: 0 2px 16px rgba(0,0,0,.42) !important;
  }

  nav.safe-bottom,
  .safe-bottom,
  #hard-mobile-nav,
  .lc-mobile-nav-final,
  .mobile-bottom-nav-v373,
  .force-mobile-nav-v374,
  [class*="mobile-bottom-nav"],
  [class*="force-mobile-nav"] {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .quick-add-fab {
    display: none !important;
  }

  main {
    padding-bottom: calc(7.5rem + env(safe-area-inset-bottom)) !important;
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

def patch_page(path: Path):
    if not path.exists():
        return
    text = path.read_text()

    # Remove all previous mobile nav variants / floating add variants.
    text = remove_block(text, '<div id="hard-mobile-nav"', "div")
    text = remove_block(text, '<nav id="image-mobile-nav-v39"', "nav")
    text = remove_button_by_id(text, '<button\n        id="image-floating-quickadd-v39"')
    text = remove_button_by_id(text, '<button id="image-floating-quickadd-v39"')

    for marker in [
        '<nav className="lc-mobile-nav-final',
        '<nav className="safe-bottom',
        '<nav className="mobile-bottom',
        '<nav className="force-mobile',
    ]:
        text = remove_block(text, marker, "nav")

    # Insert target mobile nav and floating Quick Add once before </main>.
    idx = text.rfind("    </main>")
    if idx == -1:
        idx = text.rfind("</main>")
    if idx == -1:
        raise SystemExit(f"{path}: </main> が見つかりません")

    text = text[:idx] + FINAL_MOBILE_NAV + "\n" + text[idx:]
    path.write_text(text)
    print("patched", path)

def patch_css(path: Path):
    if not path.exists():
        return
    text = path.read_text()
    if "v39 mobile UI based on reference image" not in text:
        text += CSS
    path.write_text(text)
    print("patched", path)

for file in [Path("app/page.tsx"), Path("src/app/page.tsx")]:
    patch_page(file)

for file in [Path("app/globals.css"), Path("src/app/globals.css")]:
    patch_css(file)
