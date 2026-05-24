import { NextRequest, NextResponse } from "next/server";

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
