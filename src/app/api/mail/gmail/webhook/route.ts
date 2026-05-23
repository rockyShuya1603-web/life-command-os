import { NextRequest, NextResponse } from "next/server";
import { storePushEvent } from "../_lib/gmail-server";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const data = payload?.message?.data;
    let decoded: any = {};
    if (data) {
      const text = Buffer.from(String(data), "base64").toString("utf8");
      decoded = JSON.parse(text);
    }

    await storePushEvent({
      emailAddress: decoded.emailAddress,
      historyId: decoded.historyId ? String(decoded.historyId) : undefined,
      raw: payload,
    });

    // Gmail Pub/Sub notifications only say "mailbox changed".
    // A separate sync endpoint can fetch the latest messages.
    return NextResponse.json({
      ok: true,
      received: true,
      emailAddress: decoded.emailAddress,
      historyId: decoded.historyId,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "Gmail Pub/Sub webhook処理に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
