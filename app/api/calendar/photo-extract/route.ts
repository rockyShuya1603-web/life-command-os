import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type Candidate = {
  title?: string;
  date?: string | null;
  time?: string | null;
  note?: string;
  confidence?: number;
  sourceText?: string;
};

function dateOnly(value: unknown, fallback: string) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : fallback;
}

function timeOnly(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return null;
  const colon = text.match(/(\d{1,2})[:：](\d{2})/);
  if (colon) return `${String(Number(colon[1])).padStart(2, "0")}:${String(Number(colon[2])).padStart(2, "0")}`;

  const jp = text.match(/(午前|午後)?\s*(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
  if (!jp) return null;
  let hour = Number(jp[2]);
  const minute = jp[3] ? Number(jp[3]) : 0;
  if (jp[1] === "午後" && hour < 12) hour += 12;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const imageDataUrl = String(payload.imageDataUrl || "");
  const today = dateOnly(payload.today, new Date().toISOString().slice(0, 10));
  const selectedDate = dateOnly(payload.selectedDate, today);
  const filename = String(payload.filename || "uploaded-image");

  if (!imageDataUrl.startsWith("data:image/")) {
    return NextResponse.json({ ok: false, error: "画像ファイルを選択してください。", candidates: [] }, { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_CALENDAR_VISION_MODEL || process.env.OPENAI_MEMO_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    return NextResponse.json({
      ok: false,
      error: "OPENAI_API_KEY が未設定です。写真読み取りAIを使うには環境変数を設定してください。",
      candidates: [],
    });
  }

  const prompt = [
    "あなたは日本語の予定読み取りAIです。",
    "画像に写っている予定表、メモ、スクリーンショット、チラシ、手書きメモから、カレンダーに入れる候補だけを抽出してください。",
    `現在日付は ${today} です。相対日付（今日/明日/来週/月曜など）はYYYY-MM-DDに変換してください。`,
    "時刻が書かれていない場合は time を null にしてください。",
    "返答はJSONだけ。形式:",
    '{"candidates":[{"title":"予定名","date":"YYYY-MM-DD","time":"HH:MM|null","note":"補足","confidence":0.0,"sourceText":"画像から読んだ根拠テキスト"}]}',
    "読めない場合は candidates を空配列にしてください。推測しすぎないでください。",
    `ファイル名: ${filename}`,
  ].join("\n");

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.1,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              { type: "image_url", image_url: { url: imageDataUrl } },
            ],
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (typeof content !== "string") {
      return NextResponse.json({ ok: false, error: "AIの返答を読み取れませんでした。", candidates: [] });
    }

    const cleaned = content.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    const raw = Array.isArray(parsed.candidates) ? parsed.candidates : [];

    const candidates = raw
      .map((item: Candidate) => {
        const title = String(item.title || "").trim();
        if (!title) return null;
        return {
          title: title.slice(0, 80),
          date: dateOnly(item.date, selectedDate),
          time: timeOnly(item.time),
          note: String(item.note || "").trim().slice(0, 500),
          confidence: typeof item.confidence === "number" ? item.confidence : undefined,
          sourceText: String(item.sourceText || "").trim().slice(0, 500),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ ok: true, candidates });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : "写真読み取りに失敗しました。",
      candidates: [],
    });
  }
}
