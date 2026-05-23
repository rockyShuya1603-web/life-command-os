import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return NextResponse.json({
      ready: false,
      message: "Gmail OAuthがキャンセルまたは失敗しました。",
      error,
    });
  }

  if (!code) {
    return NextResponse.json({
      ready: false,
      message: "Gmail OAuth code がありません。",
    });
  }

  return NextResponse.json({
    ready: false,
    message:
      "Gmail OAuth code を受け取りました。次の実装でサーバー側トークン交換と安全な保存を追加します。まだメール本文の自動取得は行いません。",
    nextSteps: [
      "GOOGLE_CLIENT_SECRET をサーバー側で使って token endpoint へ交換",
      "refresh_token をlocalStorageではなく安全なDBへ保存",
      "必要最小限のGmailスコープで受信/送信APIを呼ぶ",
      "送信時は必ず確認画面を挟む",
    ],
  });
}
