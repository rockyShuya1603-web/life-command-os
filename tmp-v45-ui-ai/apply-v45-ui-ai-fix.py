#!/usr/bin/env python3
from pathlib import Path
import shutil

CSS = r"""
/* ===== v45 mobile duplicate header fix + compact home + AI entry polish ===== */
@media (max-width: 767px) {
  html,
  body {
    overflow-x: hidden !important;
  }

  main {
    overflow-x: hidden !important;
    padding-bottom: calc(6.6rem + env(safe-area-inset-bottom)) !important;
  }

  /* 旧スマホ上部UI / 追加した全ページ一覧カードが重なって見える問題を抑制 */
  .life-page-drawer-toggle,
  .home-page-drawer-toggle,
  .mobile-page-drawer-toggle,
  .future-page-drawer-toggle,
  .home-weather-front + .home-weather-front,
  .future-weather-card + .future-weather-card,
  .future-top-hud + .future-top-hud,
  .home-top-head + .home-top-head,
  .future-search-pill + .future-search-pill,
  .life-mobile-header-clone,
  .future-mobile-clone,
  .mobile-home-clone,
  .duplicate-mobile-block {
    display: none !important;
    visibility: hidden !important;
    pointer-events: none !important;
  }

  .future-top-hud {
    display: grid !important;
    grid-template-columns: minmax(0, 1fr) auto auto !important;
    align-items: center !important;
    gap: .55rem !important;
    margin: 0 0 .75rem !important;
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
    font-size: clamp(1.1rem, 5.4vw, 1.36rem) !important;
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

  .future-dashboard,
  .matsuri-dashboard {
    width: 100% !important;
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
    font-size: clamp(1.72rem, 8.3vw, 2.28rem) !important;
    line-height: 1.1 !important;
    letter-spacing: -.03em !important;
    margin-top: .45rem !important;
    margin-bottom: .25rem !important;
    white-space: normal !important;
    word-break: keep-all !important;
    overflow-wrap: anywhere !important;
  }

  .future-welcome-card p,
  .matsuri-welcome p {
    font-size: .86rem !important;
    line-height: 1.5 !important;
  }

  .future-welcome-card .grid,
  .matsuri-welcome .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    gap: .55rem !important;
    margin-top: .75rem !important;
  }

  .future-stat-tile,
  .matsuri-stat-tile {
    min-height: 4.7rem !important;
    padding: .5rem .3rem !important;
    border-radius: 1rem !important;
  }

  .future-progress-card,
  .future-panel-card,
  .matsuri-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    padding: .88rem !important;
    border-radius: 1.2rem !important;
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

  .future-middle-grid,
  .future-home-grid,
  .future-grid-2,
  .future-grid-3 {
    display: grid !important;
    grid-template-columns: 1fr !important;
    gap: .72rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-middle-grid > .future-panel-card {
    width: 100% !important;
    min-width: 0 !important;
    margin: 0 !important;
    min-height: auto !important;
  }

  .future-panel-card .flex.items-start.justify-between,
  .future-panel-card .flex.items-center.justify-between,
  .matsuri-card .flex.items-start.justify-between,
  .matsuri-card .flex.items-center.justify-between {
    display: flex !important;
    flex-direction: row !important;
    align-items: flex-start !important;
    justify-content: space-between !important;
    gap: .5rem !important;
  }

  .future-panel-card .flex.items-start.justify-between > *:last-child,
  .future-panel-card .flex.items-center.justify-between > *:last-child,
  .matsuri-card .flex.items-start.justify-between > *:last-child,
  .matsuri-card .flex.items-center.justify-between > *:last-child {
    white-space: nowrap !important;
    flex: 0 0 auto !important;
    font-size: .82rem !important;
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
    padding: .56rem .68rem !important;
    border-radius: .95rem !important;
  }

  .future-bottom-grid {
    display: grid !important;
    grid-template-columns: 1fr 1fr !important;
    gap: .62rem !important;
    width: 100% !important;
    margin: 0 !important;
  }

  .future-bottom-grid > .matsuri-card {
    min-height: 8.1rem !important;
    padding: .75rem !important;
    border-radius: 1.15rem !important;
  }

  .future-bottom-grid > .matsuri-card:nth-child(n+3) {
    display: none !important;
  }

  #life-floating-quickadd-v41,
  #life-floating-quickadd-v42,
  #life-floating-quickadd-v43,
  #image-floating-quickadd-v40,
  #image-floating-quickadd-v39 {
    display: flex !important;
    width: 3.52rem !important;
    height: 3.52rem !important;
    right: .95rem !important;
    bottom: calc(5.42rem + env(safe-area-inset-bottom)) !important;
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
    width: 2.74rem !important;
    height: 2.74rem !important;
    border-radius: 9999px !important;
    background: rgba(8,16,40,.56) !important;
    color: #fff !important;
    font-size: 1.95rem !important;
  }

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
    min-height: 3.95rem !important;
    padding: .25rem .1rem !important;
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

/* ===== v45 smart AI helper chips/cards polish ===== */
.smart-ai-chip,
.ai-command-chip,
.life-ai-chip {
  border-radius: 999px !important;
  border: 1px solid rgba(125,211,252,.22) !important;
  background: rgba(15,23,42,.38) !important;
  color: rgba(226,232,240,.94) !important;
}

.smart-ai-result-card,
.ai-command-result-card,
.life-ai-result-card {
  border-radius: 1.25rem !important;
  border: 1px solid rgba(125,211,252,.26) !important;
  background: linear-gradient(135deg, rgba(15,23,42,.72), rgba(30,64,175,.28)) !important;
  box-shadow: 0 16px 40px rgba(2,6,23,.28), inset 0 1px 0 rgba(255,255,255,.12) !important;
}
"""

SMART_INTENT_TS = r"""export type LifeSmartIntent =
  | "calendar"
  | "todo"
  | "memo"
  | "budget"
  | "shopping"
  | "mail"
  | "search";

export type LifeSmartIntentResult = {
  intent: LifeSmartIntent;
  confidence: "high" | "medium" | "low";
  input: string;
  title: string;
  summary: string;
  dateHint?: string;
  timeHint?: string;
  amountHint?: number;
  categoryHint?: string;
  needsConfirm: boolean;
};

const timePattern = /(\d{1,2})[:：時](\d{1,2})?/;
const moneyPattern = /(?:¥|￥)?\s*(\d{2,7})\s*(?:円|えん)?/;
const dateWordPattern = /(今日|明日|あした|明後日|あさって|来週|今週|来月|昨日|先週|今月|\d{1,2}\/\d{1,2}|\d{1,2}月\d{1,2}日)/;
const todoWordPattern = /(やる|する|買う|提出|連絡|確認|持っていく|忘れず|タスク|todo|TODO|掃除|片付け|準備)/i;
const shoppingWordPattern = /(買う|購入|スーパー|コンビニ|ドラッグストア|牛乳|卵|日用品|買い物)/;
const mailWordPattern = /(メール|返信|送信|Gmail|gmail|未返信|受信箱)/;
const searchWordPattern = /(教えて|見せて|一覧|まとめ|検索|探して|いくら|何件|先週|今月|来週|昨日|履歴)/;

export function detectLifeSmartIntent(input: string): LifeSmartIntentResult {
  const text = input.trim();
  if (!text) {
    return {
      intent: "memo",
      confidence: "low",
      input,
      title: "空の入力",
      summary: "内容を入力すると、メモ・TODO・予定・家計簿へ振り分けます。",
      needsConfirm: true,
    };
  }

  const time = text.match(timePattern);
  const amount = text.match(moneyPattern);
  const date = text.match(dateWordPattern);

  let intent: LifeSmartIntent = "memo";
  let confidence: LifeSmartIntentResult["confidence"] = "medium";

  if (mailWordPattern.test(text)) {
    intent = "mail";
  } else if (searchWordPattern.test(text)) {
    intent = "search";
    confidence = "high";
  } else if (amount && /(カフェ|交通|電車|コンビニ|支払い|払った|使った|出費|収入|チャージ|円|¥|￥)/.test(text)) {
    intent = "budget";
    confidence = "high";
  } else if (shoppingWordPattern.test(text)) {
    intent = "shopping";
  } else if (date || time) {
    intent = "calendar";
    confidence = "high";
  } else if (todoWordPattern.test(text)) {
    intent = "todo";
  }

  const amountHint = amount ? Number(amount[1]) : undefined;
  const timeHint = time ? time[0] : undefined;
  const dateHint = date ? date[0] : undefined;

  const labelMap: Record<LifeSmartIntent, string> = {
    calendar: "予定候補",
    todo: "TODO候補",
    memo: "メモ候補",
    budget: "家計簿候補",
    shopping: "買い物候補",
    mail: "メール候補",
    search: "AI検索",
  };

  return {
    intent,
    confidence,
    input: text,
    title: labelMap[intent],
    summary: buildSummary(intent, dateHint, timeHint, amountHint),
    dateHint,
    timeHint,
    amountHint,
    categoryHint: inferCategory(text),
    needsConfirm: intent !== "search",
  };
}

function inferCategory(text: string): string | undefined {
  if (/カフェ|コーヒー/.test(text)) return "カフェ";
  if (/電車|交通|Suica|バス/.test(text)) return "交通";
  if (/ジム|筋トレ|運動/.test(text)) return "運動";
  if (/病院|通院|薬/.test(text)) return "通院";
  if (/牛乳|卵|スーパー|コンビニ|食/.test(text)) return "食費";
  if (/メール|返信/.test(text)) return "メール";
  return undefined;
}

function buildSummary(
  intent: LifeSmartIntent,
  dateHint?: string,
  timeHint?: string,
  amountHint?: number,
): string {
  if (intent === "calendar") return `${dateHint ?? "日付未確定"} ${timeHint ?? "時間未確定"} の予定候補です。保存前に確認します。`;
  if (intent === "budget") return `${amountHint ? `¥${amountHint.toLocaleString()}` : "金額未確定"} の家計簿候補です。`;
  if (intent === "todo") return "TODO候補です。今日やる/あとでやるを確認してから保存します。";
  if (intent === "shopping") return "買い物候補です。買い物リストへ送れます。";
  if (intent === "mail") return "メール関連の候補です。開く/返信/TODO化の確認に進めます。";
  if (intent === "search") return "Life Command OS内を横断検索する質問として扱います。";
  return "メモ候補です。必要ならTODO・予定・家計簿へ変換できます。";
}
"""

API_ROUTE_TS = r"""import { NextRequest, NextResponse } from "next/server";

type Intent = "calendar" | "todo" | "memo" | "budget" | "shopping" | "mail" | "search";

const timePattern = /(\d{1,2})[:：時](\d{1,2})?/;
const moneyPattern = /(?:¥|￥)?\s*(\d{2,7})\s*(?:円|えん)?/;
const dateWordPattern = /(今日|明日|あした|明後日|あさって|来週|今週|来月|昨日|先週|今月|\d{1,2}\/\d{1,2}|\d{1,2}月\d{1,2}日)/;
const todoWordPattern = /(やる|する|買う|提出|連絡|確認|持っていく|忘れず|タスク|todo|TODO|掃除|片付け|準備)/i;
const shoppingWordPattern = /(買う|購入|スーパー|コンビニ|ドラッグストア|牛乳|卵|日用品|買い物)/;
const mailWordPattern = /(メール|返信|送信|Gmail|gmail|未返信|受信箱)/;
const searchWordPattern = /(教えて|見せて|一覧|まとめ|検索|探して|いくら|何件|先週|今月|来週|昨日|履歴)/;

function inferCategory(text: string): string | undefined {
  if (/カフェ|コーヒー/.test(text)) return "カフェ";
  if (/電車|交通|Suica|バス/.test(text)) return "交通";
  if (/ジム|筋トレ|運動/.test(text)) return "運動";
  if (/病院|通院|薬/.test(text)) return "通院";
  if (/牛乳|卵|スーパー|コンビニ|食/.test(text)) return "食費";
  if (/メール|返信/.test(text)) return "メール";
  return undefined;
}

function detect(text: string) {
  const input = text.trim();
  const time = input.match(timePattern);
  const amount = input.match(moneyPattern);
  const date = input.match(dateWordPattern);

  let intent: Intent = "memo";
  let confidence: "high" | "medium" | "low" = input ? "medium" : "low";

  if (mailWordPattern.test(input)) {
    intent = "mail";
  } else if (searchWordPattern.test(input)) {
    intent = "search";
    confidence = "high";
  } else if (amount && /(カフェ|交通|電車|コンビニ|支払い|払った|使った|出費|収入|チャージ|円|¥|￥)/.test(input)) {
    intent = "budget";
    confidence = "high";
  } else if (shoppingWordPattern.test(input)) {
    intent = "shopping";
  } else if (date || time) {
    intent = "calendar";
    confidence = "high";
  } else if (todoWordPattern.test(input)) {
    intent = "todo";
  }

  return {
    ok: true,
    input,
    intent,
    confidence,
    title: {
      calendar: "予定候補",
      todo: "TODO候補",
      memo: "メモ候補",
      budget: "家計簿候補",
      shopping: "買い物候補",
      mail: "メール候補",
      search: "AI検索",
    }[intent],
    dateHint: date?.[0] ?? null,
    timeHint: time?.[0] ?? null,
    amountHint: amount?.[1] ? Number(amount[1]) : null,
    categoryHint: inferCategory(input) ?? null,
    needsConfirm: intent !== "search",
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  return NextResponse.json(detect(String(body.text ?? body.query ?? "")));
}

export async function GET(req: NextRequest) {
  const text = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(detect(text));
}
"""

def append_css(path: Path):
    if not path.exists():
        return
    text = path.read_text()
    if "v45 mobile duplicate header fix + compact home + AI entry polish" not in text:
        text += CSS
        path.write_text(text)
        print("patched css", path)
    else:
        print("already patched css", path)

def write_file(path: Path, content: str):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content)
    print("wrote", path)

def copy_asset(root: Path):
    src = Path(__file__).resolve().parent / "mobile-home-button-v40.png"
    if not src.exists():
        return
    public = root / "public"
    public.mkdir(exist_ok=True)
    shutil.copyfile(src, public / "mobile-home-button-v40.png")
    print("copied", public / "mobile-home-button-v40.png")

root = Path.cwd()
copy_asset(root)

for p in [root / "app" / "globals.css", root / "src" / "app" / "globals.css"]:
    append_css(p)

for p in [root / "lib" / "life-smart-intent.ts", root / "src" / "lib" / "life-smart-intent.ts"]:
    write_file(p, SMART_INTENT_TS)

for p in [
    root / "app" / "api" / "life-ai" / "intent" / "route.ts",
    root / "src" / "app" / "api" / "life-ai" / "intent" / "route.ts",
]:
    write_file(p, API_ROUTE_TS)
