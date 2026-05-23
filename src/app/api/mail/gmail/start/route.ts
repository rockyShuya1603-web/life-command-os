import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri =
    process.env.GOOGLE_GMAIL_REDIRECT_URI ||
    (process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/mail/gmail/callback`
      : "");

  if (!clientId || !redirectUri) {
    return NextResponse.json({
      ready: false,
      message:
        "Gmail OAuthはまだ未設定です。GOOGLE_CLIENT_ID と GOOGLE_GMAIL_REDIRECT_URI をVercel環境変数に入れると認証開始できます。",
      requiredEnv: [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "GOOGLE_GMAIL_REDIRECT_URI",
        "NEXT_PUBLIC_APP_URL",
      ],
      security:
        "アクセストークンやリフレッシュトークンはlocalStorageに保存せず、サーバー側または安全なDBで管理してください。",
    });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: GMAIL_SCOPES,
    access_type: "offline",
    prompt: "consent",
    state: "life-command-os-gmail",
  });

  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
}
