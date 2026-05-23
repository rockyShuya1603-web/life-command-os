import { NextRequest, NextResponse } from "next/server";
import { base64UrlEncode, getValidAccessToken } from "../_lib/gmail-server";

export const runtime = "nodejs";

function sanitizeHeader(value: string) {
  return String(value || "").replace(/[\r\n]+/g, " ").trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const to = sanitizeHeader(body.to);
    const cc = sanitizeHeader(body.cc);
    const bcc = sanitizeHeader(body.bcc);
    const subject = sanitizeHeader(body.subject);
    const text = String(body.body || "");

    if (!to || !subject || !text.trim()) {
      return NextResponse.json({
        ok: false,
        message: "宛先・件名・本文は必須です。",
      }, { status: 400 });
    }

    const headers = [
      `To: ${to}`,
      cc ? `Cc: ${cc}` : "",
      bcc ? `Bcc: ${bcc}` : "",
      `Subject: =?UTF-8?B?${Buffer.from(subject, "utf8").toString("base64")}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/plain; charset=UTF-8",
      "",
      text,
    ].filter((line) => line !== "").join("\r\n");

    const accessToken = await getValidAccessToken();
    const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: base64UrlEncode(headers) }),
    });

    const json = await res.json();
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        message: "Gmail送信に失敗しました。",
        detail: json,
      }, { status: res.status });
    }

    return NextResponse.json({
      ok: true,
      message: "Gmailから送信しました。",
      gmail: json,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "メール送信処理に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
