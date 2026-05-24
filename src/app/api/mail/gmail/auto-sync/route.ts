import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const secret = process.env.MAIL_CRON_SECRET;
  const provided = req.nextUrl.searchParams.get("secret") || req.headers.get("x-cron-secret");

  if (secret && provided !== secret) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
  const syncUrl = new URL("/api/mail/gmail/sync", origin);
  if (secret) syncUrl.searchParams.set("secret", secret);

  try {
    const res = await fetch(syncUrl.toString(), { method: "GET", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json({
      ok: res.ok,
      mode: "gmail-auto-sync",
      note: "Vercel Hobby cron is daily only. Frontend can still poll while app is open.",
      syncStatus: res.status,
      sync: data,
    }, { status: res.ok ? 200 : 500 });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      mode: "gmail-auto-sync",
      error: error instanceof Error ? error.message : "sync failed",
    }, { status: 500 });
  }
}
