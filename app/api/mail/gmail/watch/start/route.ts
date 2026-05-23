import { NextResponse } from "next/server";
import { gmailApi } from "../../_lib/gmail-server";

export const runtime = "nodejs";

export async function POST() {
  const topicName = process.env.GOOGLE_PUBSUB_TOPIC_NAME;
  if (!topicName) {
    return NextResponse.json({
      ok: false,
      ready: false,
      message: "GOOGLE_PUBSUB_TOPIC_NAME が未設定です。Google Cloud Pub/Sub topicを作成してVercel環境変数へ入れてください。",
      example: "projects/YOUR_PROJECT_ID/topics/life-command-os-gmail",
      requiredExtra: [
        "Cloud Pub/Sub API有効化",
        "topic作成",
        "gmail-api-push@system.gserviceaccount.com に Pub/Sub Publisher 権限付与",
        "push subscription endpoint を /api/mail/gmail/webhook に設定",
      ],
    });
  }

  try {
    const result = await gmailApi("watch", {
      method: "POST",
      body: JSON.stringify({
        topicName,
        labelIds: ["INBOX"],
        labelFilterBehavior: "include",
      }),
    });

    return NextResponse.json({
      ok: true,
      message: "Gmail watchを開始/更新しました。",
      result,
      note: "watchは期限付きです。定期更新用にcronまたは手動更新が必要です。",
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "Gmail watch開始に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
