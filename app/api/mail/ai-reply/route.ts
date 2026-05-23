import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

function fallbackReply(style: string, subject: string) {
  const base = subject ? `「${subject}」について` : "ご連絡について";
  if (style === "short") {
    return `お世話になっております。\n\n${base}確認しました。\n対応いたします。\n\nよろしくお願いいたします。`;
  }
  if (style === "soft") {
    return `お世話になっております。\n\nご連絡ありがとうございます。\n${base}、内容を確認しました。\n無理のない範囲で順に対応いたします。\n\n引き続きよろしくお願いいたします。`;
  }
  if (style === "points") {
    return `お世話になっております。\n\n${base}、以下の通り確認しました。\n\n・確認事項：\n・対応内容：\n・期限：\n\nよろしくお願いいたします。`;
  }
  return `お世話になっております。\n\nご連絡ありがとうございます。\n${base}、内容を確認しました。\n確認のうえ、対応いたします。\n\nよろしくお願いいたします。`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const subject = String(body.subject || "");
    const from = String(body.from || "");
    const originalBody = String(body.originalBody || "").slice(0, 6000);
    const draft = String(body.draft || "");
    const style = String(body.style || "polite");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        ok: true,
        ai: false,
        reply: fallbackReply(style, subject),
        message: "OPENAI_API_KEY が未設定のため、ローカルテンプレートで返信案を作成しました。",
      });
    }

    const styleLabel =
      style === "short" ? "短く簡潔" :
      style === "soft" ? "やわらかく安心感のある文体" :
      style === "points" ? "要点を箇条書きで整理" :
      "丁寧で自然なビジネス文体";

    const prompt = [
      "あなたは日本語メール返信を整えるアシスタントです。",
      "ユーザーの代わりに勝手に約束・謝罪・支払い・個人情報開示を確定しないでください。",
      "必要なら『確認します』『対応します』のような安全な表現にしてください。",
      `文体: ${styleLabel}`,
      "",
      `差出人: ${from}`,
      `件名: ${subject}`,
      "",
      "元メール:",
      originalBody,
      "",
      "現在の下書き:",
      draft,
      "",
      "返信文だけを出力してください。"
    ].join("\n");

    const res = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MAIL_REPLY_MODEL || "gpt-4.1-mini",
        input: prompt,
      }),
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        ok: true,
        ai: false,
        reply: fallbackReply(style, subject),
        message: "OpenAI APIの呼び出しに失敗したため、ローカルテンプレートで返信案を作成しました。",
        detail: json,
      });
    }

    const reply =
      json.output_text ||
      json.output?.flatMap((o: any) => o.content || []).map((c: any) => c.text || "").join("\n").trim() ||
      fallbackReply(style, subject);

    return NextResponse.json({ ok: true, ai: true, reply });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "AI返信生成に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
