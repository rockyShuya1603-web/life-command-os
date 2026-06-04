import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const text = String(payload.text || "");
  const fallback = payload.fallback || {};
  const today = String(payload.today || new Date().toISOString().slice(0, 10));
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_LIFE_ROUTER_MODEL || process.env.OPENAI_MEMO_MODEL || "gpt-4o-mini";

  if (!apiKey || !text.trim()) {
    return NextResponse.json({ ok: false, draft: fallback });
  }

  const prompt = [
    "あなたはLife Command OSの自動振り分けAIです。返答はJSONだけ。",
    "入力を calendar / todo / budget / diary / memo / fitness / inbox のどれかに分類してください。",
    "日付はYYYY-MM-DD、時刻はHH:MM。分からない場合は空文字。",
    "budgetの場合はamountを数値で抽出。金額不明なら0。",
    "形式: {\"kind\":\"calendar\",\"title\":\"...\",\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\",\"amount\":0,\"category\":\"...\",\"note\":\"...\",\"confidence\":\"high|middle|low\",\"reason\":\"...\"}",
    `today: ${today}`,
    `text: ${text}`,
    `fallback: ${JSON.stringify(fallback)}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, temperature: 0.1, messages: [{ role: "user", content: prompt }] }),
    });
    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return NextResponse.json({ ok: false, draft: fallback });
    const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const draft = JSON.parse(cleaned);
    return NextResponse.json({ ok: true, draft: { ...fallback, ...draft } });
  } catch {
    return NextResponse.json({ ok: false, draft: fallback });
  }
}
