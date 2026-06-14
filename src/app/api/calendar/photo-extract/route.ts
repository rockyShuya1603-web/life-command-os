import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function normalizeDate(value: unknown) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function normalizeTime(value: unknown) {
  const text = String(value || "").trim();
  if (!text || text === "null") return null;
  const colon = text.match(/(\d{1,2})[:：](\d{2})/);
  if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;
  const jp = text.match(/(午前|午後)?\s*(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
  if (!jp) return null;
  let hour = Number(jp[2]);
  const minute = jp[3] ? Number(jp[3]) : 0;
  if (jp[1] === "午後" && hour < 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function fallback(filename: string, date: string, note: string) {
  return [{ title: filename.replace(/\.[^.]+$/, "") || "写真から追加", date, time: null, note, confidence: 0, sourceText: filename }];
}

function parseJson(content: string) {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
  try { return JSON.parse(cleaned); } catch {
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("AIの返答からJSONを見つけられませんでした。");
    return JSON.parse(match[0]);
  }
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const imageDataUrl = String(payload.imageDataUrl || "");
  const today = normalizeDate(payload.today) || new Date().toISOString().slice(0, 10);
  const selectedDate = normalizeDate(payload.selectedDate) || today;
  const filename = String(payload.filename || "uploaded-image");

  if (!imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "画像ファイルを選択してください。", candidates: [] }, { status: 400 });
  }

  if (imageDataUrl.length > 6500000) {
    return NextResponse.json({ ok: false, error: "画像が大きすぎます。切り抜くか小さくしてもう一度試してください。", candidates: fallback(filename, selectedDate, "画像が大きすぎたためAI読み取りは未実行。編集して追加できます。") });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CALENDAR_VISION_MODEL || process.env.OPENAI_MEMO_ORGANIZER_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "OPENAI_API_KEY が未設定です。", candidates: fallback(filename, selectedDate, "OPENAI_API_KEY未設定。編集して予定追加できます。") });
  }

  const prompt = [
    "あなたは日本語の予定読み取りAIです。画像からカレンダー追加候補を抽出してください。",
    `現在日付は ${today}。日付不明なら ${selectedDate} を使ってください。`,
    "時刻なしは time を null。返答はJSONだけ。",
    '{"candidates":[{"title":"予定名","date":"YYYY-MM-DD","time":"HH:MM|null","note":"補足","confidence":0.0,"sourceText":"根拠"}]}',
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [{ role: "user", content: [{ type: "text", text: prompt }, { type: "image_url", image_url: { url: imageDataUrl } }] }],
      }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return NextResponse.json({ ok: false, error: data?.error?.message || `写真AI読み取りに失敗しました。status=${response.status}`, candidates: fallback(filename, selectedDate, "AI読み取りに失敗。編集して予定追加できます。") });
    }

    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== "string") {
      return NextResponse.json({ ok: false, error: "AIの返答を読み取れませんでした。", candidates: fallback(filename, selectedDate, "AI返答なし。編集して予定追加できます。") });
    }

    const parsed = parseJson(content);
    const candidates = (Array.isArray(parsed.candidates) ? parsed.candidates : [])
      .map((x: any) => ({
        title: String(x.title || "").trim().slice(0, 90),
        date: normalizeDate(x.date) || selectedDate,
        time: normalizeTime(x.time),
        note: String(x.note || "").trim().slice(0, 600),
        confidence: typeof x.confidence === "number" ? x.confidence : undefined,
        sourceText: String(x.sourceText || "").trim().slice(0, 600),
      }))
      .filter((x: any) => x.title);

    return NextResponse.json({ ok: true, candidates });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "写真読み取りに失敗しました。", candidates: fallback(filename, selectedDate, "読み取り失敗。編集して予定追加できます。") });
  }
}
