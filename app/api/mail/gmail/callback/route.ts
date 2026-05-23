import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getExpiresAt, getGmailProfile, saveTokenRow } from "../_lib/gmail-server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json({
      ok: false,
      message: "Gmail OAuthがキャンセルまたは失敗しました。",
      error,
    }, { status: 400 });
  }

  if (!code) {
    return NextResponse.json({
      ok: false,
      message: "Gmail OAuth code がありません。",
    }, { status: 400 });
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getGmailProfile(tokens.access_token);

    await saveTokenRow({
      email: profile.emailAddress || null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || undefined,
      scope: tokens.scope,
      token_type: tokens.token_type,
      expires_at: getExpiresAt(tokens.expires_in),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "/";
    return NextResponse.redirect(`${appUrl.replace(/\/$/, "")}/?gmail=connected`);
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "Gmail token交換または保存に失敗しました。Supabaseテーブルと環境変数を確認してください。",
      error: err instanceof Error ? err.message : String(err),
      requiredTable: "gmail_oauth_tokens",
    }, { status: 500 });
  }
}
