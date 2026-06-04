import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const text = String(payload.text || "");
  const fallback = payload.fallback || {};
  const today = String(payload.today || new Date().toISOString().slice(0, 10));
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MEMO_ORGANIZER_MODEL || process.env.OPENAI_LIFE_ROUTER_MODEL || "gpt-4o-mini";

  if (!apiKey || !text.trim()) {
    return NextResponse.json({ ok: false, draft: fallback });
  }

  const prompt = [
    "あなたはLife Command OSのAI自動整理ボックスです。",
    "入力を memo / todo / calendar / diary / budget / body / belief / future / idea / inbox に分類してください。",
    "bodyは筋トレ・体調・睡眠・疲労・痛みログ。beliefは名言/信念カード。futureは未来の自分へのメモ。",
    "日付はYYYY-MM-DD、時刻はHH:MM。分からない場合は空文字。budgetはamountを数値。",
    "返答はJSONのみ。",
    "形式: {\"kind\":\"todo\",\"title\":\"...\",\"date\":\"YYYY-MM-DD\",\"time\":\"HH:MM\",\"amount\":0,\"category\":\"...\",\"note\":\"...\",\"confidence\":\"high|middle|low\",\"reasons\":[\"...\"]}",
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
    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") return NextResponse.json({ ok: false, draft: fallback });
    const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const draft = JSON.parse(cleaned);
    return NextResponse.json({ ok: true, draft: { ...fallback, ...draft } });
  } catch {
    return NextResponse.json({ ok: false, draft: fallback });
  }
}
