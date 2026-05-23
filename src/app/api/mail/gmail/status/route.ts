import { NextResponse } from "next/server";
import { getLatestTokenRow, getValidAccessToken, getGmailProfile, saveTokenRow } from "../_lib/gmail-server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const row = await getLatestTokenRow();
    if (!row?.refresh_token && !row?.access_token) {
      return NextResponse.json({
        ok: true,
        connected: false,
        message: "Gmailはまだ連携されていません。",
      });
    }

    const accessToken = await getValidAccessToken();
    const profile = await getGmailProfile(accessToken);

    if (profile.emailAddress && profile.emailAddress !== row.email) {
      await saveTokenRow({ email: profile.emailAddress });
    }

    return NextResponse.json({
      ok: true,
      connected: true,
      email: profile.emailAddress || row.email,
      messagesTotal: profile.messagesTotal,
      threadsTotal: profile.threadsTotal,
      expiresAt: row.expires_at,
      scope: row.scope,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      connected: false,
      message: "Gmail連携状態の確認に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
