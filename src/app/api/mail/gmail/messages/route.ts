import { NextRequest, NextResponse } from "next/server";
import { getValidAccessToken } from "../_lib/gmail-server";

export const runtime = "nodejs";

function headerValue(headers: any[] | undefined, name: string) {
  return headers?.find((h) => String(h.name || "").toLowerCase() === name.toLowerCase())?.value || "";
}

function toTextFromPayload(payload: any): string {
  const chunks: string[] = [];

  function walk(part: any) {
    if (!part) return;
    const mimeType = part.mimeType || "";
    const bodyData = part.body?.data;
    if (bodyData && (mimeType.includes("text/plain") || mimeType === "")) {
      try {
        chunks.push(Buffer.from(bodyData.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8"));
      } catch {}
    }
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  }

  walk(payload);
  return chunks.join("\n").trim();
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const maxResults = Math.min(Number(url.searchParams.get("maxResults") || 10), 25);
    const q = url.searchParams.get("q") || "";

    const accessToken = await getValidAccessToken();

    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("maxResults", String(maxResults));
    if (q) listUrl.searchParams.set("q", q);

    const listRes = await fetch(listUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const listJson = await listRes.json();
    if (!listRes.ok) {
      return NextResponse.json({ ok: false, message: "Gmail一覧取得に失敗しました。", detail: listJson }, { status: listRes.status });
    }

    const messages = await Promise.all(
      (listJson.messages || []).slice(0, maxResults).map(async (row: { id: string; threadId: string }) => {
        const detailRes = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${row.id}?format=full`,
          { headers: { Authorization: `Bearer ${accessToken}` } },
        );
        const detail = await detailRes.json();
        if (!detailRes.ok) return null;

        const headers = detail.payload?.headers || [];
        return {
          id: detail.id,
          threadId: detail.threadId,
          from: headerValue(headers, "From"),
          to: headerValue(headers, "To"),
          subject: headerValue(headers, "Subject") || "(件名なし)",
          date: headerValue(headers, "Date"),
          snippet: detail.snippet || "",
          body: toTextFromPayload(detail.payload) || detail.snippet || "",
          labelIds: detail.labelIds || [],
          unread: (detail.labelIds || []).includes("UNREAD"),
          important: (detail.labelIds || []).includes("IMPORTANT"),
          hasAttachment: JSON.stringify(detail.payload || {}).includes("filename"),
        };
      }),
    );

    return NextResponse.json({
      ok: true,
      messages: messages.filter(Boolean),
      resultSizeEstimate: listJson.resultSizeEstimate || 0,
    });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "Gmail受信箱の取得に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
