import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function detectIntent(query: string) {
  if (/支出|家計|円|交通費|カフェ|買った|使った/.test(query)) return "money";
  if (/予定|明日|今日|来週|カレンダー|何時|午前|午後/.test(query)) return "calendar";
  if (/TODO|タスク|やること|未完了|完了/.test(query)) return "todo";
  if (/習慣|ルーティン|継続|音読/.test(query)) return "habit-routine";
  if (/メール|Gmail|返信|受信/.test(query)) return "mail";
  if (/メモ|記録|日記|Diary|diary/.test(query)) return "memo";
  return "general";
}

function fallback(query: string, clientMemos: any[] = []) {
  const intent = detectIntent(query);
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const relatedMemos = clientMemos.filter((memo) => {
    const haystack = `${memo.title ?? ""} ${memo.body ?? ""} ${memo.content ?? ""} ${memo.text ?? ""}`.toLowerCase();
    return words.some((word) => haystack.includes(word));
  }).slice(0, 3);

  return {
    ok: true,
    mode: "local-fallback",
    query,
    intent,
    summary: `「${query}」は ${intent} 系として検索しました。${relatedMemos.length ? `関連メモ: ${relatedMemos.map((memo) => `「${memo.title ?? String(memo.body ?? memo.content ?? memo.text ?? "").slice(0, 12)}」`).join("、")}` : "関連メモはまだ少ないです。"}`,
    suggestions: ["関連データをカード化", "次の行動を1つに絞る", "メモ/TODO/予定/家計簿へ変換"],
    actions: intent === "habit-routine" ? ["習慣ページへ", "ルーティンページへ", "音読ポイント確認"] : ["メモに保存", "TODO化", "関連ページへ移動"],
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? body.q ?? "").trim();
  const clientMemos = Array.isArray(body.clientMemos) ? body.clientMemos : [];

  if (!query) return NextResponse.json({ ok: false, mode: "empty", intent: "general", summary: "検索したい内容を入力してください。", suggestions: [], actions: [] });

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_SEARCH_MODEL || process.env.OPENAI_MAIL_REPLY_MODEL;

  if (!apiKey || !model) return NextResponse.json(fallback(query, clientMemos));

  try {
    const prompt = [
      "あなたはLife Command OSのAI検索です。短く具体的に返してください。",
      "JSONだけを返してください。",
      "{ ok: true, mode: 'openai', query, intent, summary, suggestions: string[], actions: string[] }",
      `query: ${query}`,
      `clientMemos: ${JSON.stringify(clientMemos).slice(0, 6000)}`,
    ].join("\\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      const cleaned = content.replace(/^```json\\s*/i, "").replace(/```$/i, "").trim();
      return NextResponse.json(JSON.parse(cleaned));
    }
    return NextResponse.json(fallback(query, clientMemos));
  } catch {
    return NextResponse.json(fallback(query, clientMemos));
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(fallback(query));
}
