import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type AssistMode = "整理" | "注釈" | "分類" | "補助" | "TODO化";

function localAssist(body: string, mode: AssistMode, attachments: Array<{ name?: string; type?: string; kind?: string; text?: string }>) {
  const lines = body.split(/\n|。|！|!/).map((line) => line.trim()).filter(Boolean);
  const title = lines[0]?.slice(0, 28) || attachments[0]?.name || "無題メモ";
  const category =
    /筋トレ|ジム|ラン|運動|体|プロテイン/.test(body) ? "体づくり" :
    /支出|円|買った|家計|交通費|食費/.test(body) ? "家計" :
    /予定|明日|今日|午前|午後|カレンダー/.test(body) ? "予定" :
    /不安|気分|しんどい|嬉しい|日記/.test(body) ? "Diary" :
    /UI|アプリ|コード|バグ|実装|修正/.test(body) ? "開発" : "メモ";
  const tags = Array.from(new Set([category, ...(attachments.length ? ["添付あり"] : []), ...(/TODO|やる|直す|追加|作る/.test(body) ? ["TODO候補"] : [])]));
  const todos = lines.filter((line) => /する|やる|作る|直す|追加|確認|保存|移動|改善|修正|改造/.test(line)).slice(0, 8);
  const attachmentLine = attachments.length ? `\n\n添付: ${attachments.map((item) => item.name).filter(Boolean).join(" / ")}` : "";
  if (mode === "TODO化") return { ok: true, title, body, tags, category, todos: todos.length ? todos : [`${title}を確認する`], note: "TODO候補を作りました。" };
  if (mode === "分類") return { ok: true, title, body, tags, category, todos, note: `分類候補は「${category}」です。` };
  if (mode === "注釈") return { ok: true, title, body: `${body}${attachmentLine}\n\n注釈:\n- 後で見返すための要点\n- 次の行動がある場合はTODO化できる`, tags, category, todos, note: "注釈を追加しました。" };
  if (mode === "補助") return { ok: true, title, body: `${body}${attachmentLine}\n\n補助メモ:\n- 「${category}」系のメモとして扱えます\n- 迷ったら次の行動を1つだけTODOに変換すると使いやすいです`, tags, category, todos, note: "補助文を追加しました。" };
  return { ok: true, title, body: lines.length ? `${lines.map((line) => `・${line}`).join("\n")}${attachmentLine}` : body, tags, category, todos, note: "メモを整理しました。" };
}

export async function POST(req: NextRequest) {
  const payload = await req.json().catch(() => ({}));
  const mode = String(payload.mode || "整理") as AssistMode;
  const title = String(payload.title || "");
  const body = String(payload.body || "");
  const tags = Array.isArray(payload.tags) ? payload.tags.map(String) : [];
  const category = String(payload.category || "");
  const attachments = Array.isArray(payload.attachments) ? payload.attachments : [];

  if (!body.trim() && attachments.length === 0) return NextResponse.json({ ok: false, note: "本文か添付が必要です。" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MEMO_MODEL || process.env.OPENAI_SEARCH_MODEL || process.env.OPENAI_MAIL_REPLY_MODEL || "gpt-4o-mini";
  if (!apiKey) return NextResponse.json(localAssist(body, mode, attachments));

  try {
    const prompt = [
      "あなたはLife Command OSのメモ補助AIです。",
      "日本語で、短く具体的に返してください。",
      "返答は必ずJSONだけにしてください。",
      "形式: { ok: true, title: string, body: string, tags: string[], category: string, todos: string[], note: string }",
      `mode: ${mode}`,
      `currentTitle: ${title}`,
      `currentCategory: ${category}`,
      `currentTags: ${JSON.stringify(tags)}`,
      `body: ${body}`,
      `attachments: ${JSON.stringify(attachments).slice(0, 6000)}`,
      "注意: 画像の中身は直接読めない場合があります。本文と添付ファイル名を中心に、推測しすぎないでください。",
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], temperature: 0.2 }),
    });
    const data = await res.json();
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content === "string") {
      const cleaned = content.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();
      return NextResponse.json(JSON.parse(cleaned));
    }
    return NextResponse.json(localAssist(body, mode, attachments));
  } catch {
    return NextResponse.json(localAssist(body, mode, attachments));
  }
}
