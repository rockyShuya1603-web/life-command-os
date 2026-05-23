import { NextRequest, NextResponse } from "next/server";
import { cacheGmailMessage, getValidAccessToken } from "../_lib/gmail-server";

export const runtime = "nodejs";

function headerValue(headers: any[] | undefined, name: string) {
  return headers?.find((h) => String(h.name || "").toLowerCase() === name.toLowerCase())?.value || "";
}

function partHeaderValue(headers: any[] | undefined, name: string) {
  return headers?.find((h) => String(h.name || "").toLowerCase() === name.toLowerCase())?.value || "";
}

function countRealAttachments(payload: any): number {
  let count = 0;
  function walk(part: any) {
    if (!part) return;
    const filename = String(part.filename || "").trim();
    const mimeType = String(part.mimeType || "").toLowerCase();
    const disposition = partHeaderValue(part.headers, "Content-Disposition").toLowerCase();
    const attachmentId = part.body?.attachmentId;
    const looksReal =
      Boolean(filename && attachmentId && disposition.includes("attachment")) ||
      Boolean(filename && attachmentId && !mimeType.startsWith("image/"));
    if (looksReal) count += 1;
    if (Array.isArray(part.parts)) part.parts.forEach(walk);
  }
  walk(payload);
  return count;
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

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("x-cron-token");
    if (process.env.MAIL_CRON_SECRET && token !== process.env.MAIL_CRON_SECRET) {
      return NextResponse.json({ ok: false, message: "Invalid cron token" }, { status: 401 });
    }

    const accessToken = await getValidAccessToken();
    const maxResults = Math.min(Number(new URL(request.url).searchParams.get("maxResults") || 10), 25);

    const listUrl = new URL("https://gmail.googleapis.com/gmail/v1/users/me/messages");
    listUrl.searchParams.set("maxResults", String(maxResults));
    listUrl.searchParams.set("q", "newer_than:7d");

    const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    const listJson = await listRes.json();
    if (!listRes.ok) {
      return NextResponse.json({ ok: false, message: "Gmail一覧取得に失敗しました。", detail: listJson }, { status: listRes.status });
    }

    let cached = 0;
    for (const row of (listJson.messages || []).slice(0, maxResults)) {
      const detailRes = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${row.id}?format=full`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const detail = await detailRes.json();
      if (!detailRes.ok) continue;
      const headers = detail.payload?.headers || [];
      const attachmentCount = countRealAttachments(detail.payload);
      await cacheGmailMessage({
        id: detail.id,
        threadId: detail.threadId,
        from: headerValue(headers, "From"),
        to: headerValue(headers, "To"),
        subject: headerValue(headers, "Subject") || "(件名なし)",
        date: headerValue(headers, "Date"),
        snippet: detail.snippet || "",
        body: toTextFromPayload(detail.payload) || detail.snippet || "",
        unread: (detail.labelIds || []).includes("UNREAD"),
        important: (detail.labelIds || []).includes("IMPORTANT"),
        hasAttachment: attachmentCount > 0,
        attachmentCount,
        labelIds: detail.labelIds || [],
      });
      cached += 1;
    }

    return NextResponse.json({ ok: true, cached });
  } catch (err) {
    return NextResponse.json({
      ok: false,
      message: "Gmailバックグラウンド同期に失敗しました。",
      error: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}


export async function GET(request: NextRequest) {
  return POST(request);
}
