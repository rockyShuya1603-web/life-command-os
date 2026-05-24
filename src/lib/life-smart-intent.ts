export type LifeSmartIntent =
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
