import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function yen(amount: number) {
  return `¥${Math.round(amount).toLocaleString("ja-JP")}`;
}

function localFallback(query: string, clientData: any = {}) {
  const money = Array.isArray(clientData.money) ? clientData.money : [];
  const memos = Array.isArray(clientData.memos) ? clientData.memos : [];
  const todos = Array.isArray(clientData.todos) ? clientData.todos : [];
  const events = Array.isArray(clientData.events) ? clientData.events : [];

  if (/支出|家計|円|出費|使った/.test(query)) {
    const total = money.reduce((sum: number, item: any) => sum + (Number(item.amount) || 0), 0);
    return {
      ok: true,
      mode: "client-data-fallback",
      intent: "money",
      summary: money.length ? `家計簿候補を${money.length}件見つけました。合計は${yen(total)}です。` : "家計簿候補は見つかりませんでした。",
      details: money.slice(0, 5).map((m: any) => `${m.date ?? "日付不明"} ${m.category ?? "未分類"} ${yen(Number(m.amount) || 0)}`),
      suggestions: ["先週/今月など期間条件を入れると絞れます", "家計簿の保存形式を統一すると精度が上がります"],
      actions: ["家計簿ページへ", "支出メモに保存"],
    };
  }

  if (/TODO|タスク|未完了/.test(query)) {
    return { ok: true, mode: "client-data-fallback", intent: "todo", summary: `TODO候補を${todos.length}件見つけました。`, details: todos.slice(0, 5).map((t: any) => String(t.title ?? t.text ?? t.body ?? "無題TODO")), suggestions: ["未完了だけに絞る"], actions: ["TODOページへ"] };
  }

  if (/予定|カレンダー|明日|今日/.test(query)) {
    return { ok: true, mode: "client-data-fallback", intent: "calendar", summary: `予定候補を${events.length}件見つけました。`, details: events.slice(0, 5).map((e: any) => String(e.title ?? e.name ?? e.text ?? "無題予定")), suggestions: ["今日/明日で絞る"], actions: ["カレンダーへ"] };
  }

  return {
    ok: true,
    mode: "client-data-fallback",
    intent: "general",
    summary: `メモ${memos.length}件、TODO${todos.length}件、予定${events.length}件、家計候補${money.length}件を横断しました。`,
    details: memos.slice(0, 5).map((m: any) => String(m.title ?? m.body ?? m.text ?? "無題メモ")),
    suggestions: ["先週の支出を教えて", "未完了TODOを教えて", "明日の予定を教えて"],
    actions: ["メモへ", "TODOへ", "家計簿へ"],
  };
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? body.q ?? "").trim();
  const clientData = body.clientData ?? {};
  const clientMemos = Array.isArray(body.clientMemos) ? body.clientMemos : [];

  if (!query) {
    return NextResponse.json({ ok: false, mode: "empty", intent: "general", summary: "検索したい内容を入力してください。", suggestions: [], actions: [] });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_SEARCH_MODEL || process.env.OPENAI_MAIL_REPLY_MODEL;

  if (!apiKey || !model) return NextResponse.json(localFallback(query, { ...clientData, memos: clientData.memos ?? clientMemos }));

  try {
    const prompt = [
      "あなたはLife Command OSの上部AI検索です。",
      "ユーザーのローカルデータから、質問に答えてください。",
      "特に「先週の支出を教えて」は家計簿候補から金額とカテゴリを集計してください。",
      "JSONだけ返してください。",
      "{ ok: true, mode: 'openai', intent, summary, details: string[], suggestions: string[], actions: string[] }",
      `query: ${query}`,
      `clientData: ${JSON.stringify(clientData).slice(0, 12000)}`,
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.1 }),
    });

    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      return NextResponse.json(JSON.parse(cleaned));
    }
    return NextResponse.json(localFallback(query, clientData));
  } catch {
    return NextResponse.json(localFallback(query, clientData));
  }
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q") ?? "";
  return NextResponse.json(localFallback(query));
}
