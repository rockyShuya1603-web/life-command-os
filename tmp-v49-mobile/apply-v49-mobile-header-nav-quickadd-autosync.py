#!/usr/bin/env python3
from pathlib import Path
import shutil
from datetime import datetime

CSS = r"""

/* ===== v49 mobile header/nav/quickadd/autosync fix ===== */
@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden !important;
  }

  main {
    overflow-x: hidden !important;
    padding-bottom: calc(6.35rem + env(safe-area-inset-bottom)) !important;
  }

  #hard-mobile-nav,
  #life-mobile-nav-v41,
  #life-mobile-nav-v42,
  #life-mobile-nav-v43,
  #image-mobile-nav-v40,
  #image-mobile-nav-v39,
  nav[aria-label="スマホ下部ナビ"],
  nav[aria-label="Mobile bottom navigation"] {
    position: fixed !important;
    left: .72rem !important;
    right: .72rem !important;
    bottom: max(.45rem, env(safe-area-inset-bottom)) !important;
    top: auto !important;
    z-index: 2147483000 !important;
    transform: none !important;
    margin: 0 !important;
    padding: .38rem !important;
    border-radius: 1.36rem !important;
    background: rgba(4,12,34,.94) !important;
    backdrop-filter: blur(18px) saturate(1.2) !important;
    box-shadow: 0 0 28px rgba(56,189,248,.18), inset 0 1px 0 rgba(255,255,255,.12) !important;
    overflow: hidden !important;
  }

  #hard-mobile-nav .hard-mobile-nav-grid,
  #life-mobile-nav-v41 .life-mobile-nav-v41-grid,
  #life-mobile-nav-v42 .life-mobile-nav-v42-grid,
  #life-mobile-nav-v43 .life-mobile-nav-v43-grid,
  #image-mobile-nav-v40 .image-mobile-nav-grid-v40,
  #image-mobile-nav-v39 .image-mobile-nav-grid-v39,
  nav[aria-label="スマホ下部ナビ"] > div,
  nav[aria-label="Mobile bottom navigation"] > div {
    display: grid !important;
    grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    gap: .12rem !important;
    align-items: stretch !important;
  }

  #hard-mobile-nav button,
  #life-mobile-nav-v41 button,
  #life-mobile-nav-v42 button,
  #life-mobile-nav-v43 button,
  #image-mobile-nav-v40 button,
  #image-mobile-nav-v39 button,
  nav[aria-label="スマホ下部ナビ"] button,
  nav[aria-label="Mobile bottom navigation"] button {
    min-width: 0 !important;
    min-height: 3.72rem !important;
    max-height: 3.72rem !important;
    padding: .2rem .08rem !important;
    border-radius: .92rem !important;
    overflow: hidden !important;
  }

  #hard-mobile-nav img,
  #life-mobile-nav-v41 img,
  #life-mobile-nav-v42 img,
  #life-mobile-nav-v43 img,
  #image-mobile-nav-v40 img,
  #image-mobile-nav-v39 img,
  nav[aria-label="スマホ下部ナビ"] img,
  nav[aria-label="Mobile bottom navigation"] img {
    width: 2.8rem !important;
    max-width: 2.8rem !important;
    height: 2.18rem !important;
    max-height: 2.18rem !important;
    object-fit: contain !important;
    transform: none !important;
  }

  #hard-mobile-nav b,
  #life-mobile-nav-v41 b,
  #life-mobile-nav-v42 b,
  #life-mobile-nav-v43 b,
  #image-mobile-nav-v40 b,
  #image-mobile-nav-v39 b,
  nav[aria-label="スマホ下部ナビ"] b,
  nav[aria-label="Mobile bottom navigation"] b {
    font-size: .66rem !important;
    line-height: 1.04 !important;
    white-space: nowrap !important;
  }

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

  .future-top-hud {
    position: relative !important;
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto auto !important;
    align-items: center !important;
    column-gap: .52rem !important;
    row-gap: .55rem !important;
    margin: 0 0 .72rem !important;
    padding: .4rem .18rem .25rem !important;
    border: 0 !important;
    background: transparent !important;
    box-shadow: none !important;
    backdrop-filter: none !important;
  }

  .future-top-hud > * {
    min-width: 0 !important;
  }

  .future-brand-lockup {
    min-width: 0 !important;
    padding-left: 2.82rem !important;
  }

  .future-brand-lockup::before {
    width: 2.18rem !important;
    height: 2.18rem !important;
  }

  .future-brand-lockup p:first-child {
    font-size: clamp(1.02rem, 4.8vw, 1.24rem) !important;
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
    grid-column: 1 / -1 !important;
    order: 10 !important;
    position: relative !important;
    z-index: 2 !important;
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

  .future-search-pill + .future-search-pill,
  .future-top-hud + .future-top-hud,
  .home-top-head + .home-top-head,
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card {
    display: none !important;
  }

  .life-page-drawer-toggle,
  .home-page-drawer-toggle,
  .mobile-page-drawer-toggle,
  .future-page-drawer-toggle {
    display: flex !important;
    visibility: visible !important;
    pointer-events: auto !important;
    width: 100% !important;
    min-height: 3rem !important;
    max-height: 3.4rem !important;
    margin: .45rem 0 .72rem !important;
    padding: .55rem .72rem !important;
    border-radius: 1.15rem !important;
    align-items: center !important;
    justify-content: space-between !important;
    background: rgba(15,23,42,.46) !important;
    border: 1px solid rgba(125,211,252,.22) !important;
    box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 10px 26px rgba(2,6,23,.16) !important;
    overflow: hidden !important;
  }

  .life-page-drawer-toggle *,
  .home-page-drawer-toggle *,
  .mobile-page-drawer-toggle *,
  .future-page-drawer-toggle * {
    font-size: .88rem !important;
    line-height: 1.1 !important;
    white-space: nowrap !important;
  }

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
    min-height: 7.2rem !important;
    max-height: 10.6rem !important;
    padding: .68rem !important;
    border-radius: 1.08rem !important;
    overflow: hidden !important;
  }

  .future-bottom-grid h3,
  .future-bottom-grid .matsuri-card h3 {
    font-size: .9rem !important;
    line-height: 1.1 !important;
    white-space: nowrap !important;
  }

  .future-bottom-grid .space-y-4,
  .future-bottom-grid .space-y-3 {
    gap: .28rem !important;
  }

  .future-bottom-grid [class*="h-24"],
  .future-bottom-grid [class*="h-28"],
  .future-bottom-grid [class*="h-32"],
  .future-bottom-grid [class*="h-36"] {
    height: 4.3rem !important;
  }

  #life-floating-quickadd-v49,
  #life-floating-quickadd-v48,
  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39 {
    display: flex !important;
    visibility: visible !important;
    pointer-events: auto !important;
    position: fixed !important;
    align-items: center !important;
    justify-content: center !important;
    width: 3.5rem !important;
    height: 3.5rem !important;
    right: .95rem !important;
    bottom: calc(5.15rem + env(safe-area-inset-bottom)) !important;
    z-index: 2147483001 !important;
    border-radius: 9999px !important;
    border: 1px solid rgba(255,255,255,.24) !important;
    background: conic-gradient(from 180deg, #60a5fa, #a78bfa, #f472b6, #f59e0b, #34d399, #60a5fa) !important;
    box-shadow: 0 0 0 3px rgba(255,255,255,.08), 0 10px 30px rgba(96,165,250,.34), 0 0 26px rgba(244,114,182,.28) !important;
  }

  #life-floating-quickadd-v49 span,
  #life-floating-quickadd-v48 span,
  #life-floating-quickadd-v41 span,
  #life-floating-quickadd-v42 span,
  #life-floating-quickadd-v43 span,
  #image-floating-quickadd-v40 span,
  #image-floating-quickadd-v39 span {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: 2.68rem !important;
    height: 2.68rem !important;
    border-radius: 9999px !important;
    background: rgba(8,16,40,.56) !important;
    color: #fff !important;
    font-size: 1.9rem !important;
    font-weight: 900 !important;
    line-height: 1 !important;
  }
}
"""

ROUTE = r"""import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const DEFAULT_INTERVAL_MINUTES = 10;

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
      intervalMinutes: Number(process.env.MAIL_AUTO_SYNC_MINUTES || DEFAULT_INTERVAL_MINUTES),
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

VERCEL_JSON = r"""{
  "crons": [
    {
      "path": "/api/mail/gmail/auto-sync",
      "schedule": "0 */6 * * *"
    }
  ]
}
"""

def append_css(path: Path):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "v49 mobile header/nav/quickadd/autosync fix" not in text:
        text += CSS
        path.write_text(text, encoding="utf-8")
        print("patched css", path)
    else:
        print("already patched css", path)

def ensure_quickadd_button(path: Path):
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    if "life-floating-quickadd-v49" in text:
        print("quickadd already exists", path)
        return

    if "setQuickAddOpen" in text:
        action = "setQuickAddOpen(true)"
    elif "setCommandOpen" in text:
        action = "setCommandOpen(true)"
    else:
        action = 'setPage("braindump")'

    button = """
      <button
        id="life-floating-quickadd-v49"
        type="button"
        onClick={() => ACTION_PLACEHOLDER}
        className="lg:hidden"
        aria-label="Quick Add"
      >
        <span>＋</span>
      </button>
""".replace("ACTION_PLACEHOLDER", action)

    idx = text.rfind("    </main>")
    if idx == -1:
        idx = text.rfind("</main>")
    if idx == -1:
        print("skip quickadd; </main> not found", path)
        return

    text = text[:idx] + button + "\n" + text[idx:]
    path.write_text(text, encoding="utf-8")
    print("inserted quickadd", path)

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    print("wrote", path)

def merge_vercel_json(path: Path):
    if path.exists():
        backup = path.with_suffix(path.suffix + f".backup-v49-{datetime.now().strftime('%Y%m%d%H%M%S')}")
        shutil.copyfile(path, backup)
        print("backup", backup)
    path.write_text(VERCEL_JSON, encoding="utf-8")
    print("wrote", path)

root = Path.cwd()

for p in [root / "app" / "page.tsx", root / "src" / "app" / "page.tsx"]:
    ensure_quickadd_button(p)

for p in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    append_css(p)

for p in [
    root / "app" / "api" / "mail" / "gmail" / "auto-sync" / "route.ts",
    root / "src" / "app" / "api" / "mail" / "gmail" / "auto-sync" / "route.ts",
]:
    write_file(p, ROUTE)

merge_vercel_json(root / "vercel.json")
