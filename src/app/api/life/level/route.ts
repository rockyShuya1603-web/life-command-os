import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function headers() {
  if (!serviceRoleKey) return null;
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get("userId") || "shuya";
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, reason: "supabase env missing", state: null });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/life_level_states?id=eq.${encodeURIComponent(userId)}&select=state,updated_at&limit=1`, {
      headers: headers()!,
      cache: "no-store",
    });
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    return NextResponse.json({ ok: res.ok, state: row?.state ?? null, updatedAt: row?.updated_at ?? null });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "failed", state: null }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const userId = String(body.userId || "shuya");
  const state = body.state ?? null;

  if (!state) return NextResponse.json({ ok: false, error: "state required" }, { status: 400 });
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ ok: false, reason: "supabase env missing" });
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/life_level_states`, {
      method: "POST",
      headers: headers()!,
      body: JSON.stringify({
        id: userId,
        state,
        updated_at: new Date().toISOString(),
      }),
    });

    if (res.status === 409) {
      const patch = await fetch(`${supabaseUrl}/rest/v1/life_level_states?id=eq.${encodeURIComponent(userId)}`, {
        method: "PATCH",
        headers: headers()!,
        body: JSON.stringify({ state, updated_at: new Date().toISOString() }),
      });
      return NextResponse.json({ ok: patch.ok, status: patch.status });
    }

    return NextResponse.json({ ok: res.ok, status: res.status });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "failed" }, { status: 500 });
  }
}
