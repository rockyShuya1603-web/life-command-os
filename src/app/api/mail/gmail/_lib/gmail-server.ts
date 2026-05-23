import { createClient } from "@supabase/supabase-js";

type GmailTokenRow = {
  id?: string;
  user_label: string;
  email?: string | null;
  refresh_token?: string | null;
  access_token?: string | null;
  scope?: string | null;
  token_type?: string | null;
  expires_at?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

const TOKEN_TABLE = "gmail_oauth_tokens";
const USER_LABEL = process.env.GMAIL_USER_LABEL || "shuya";

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRole) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing");
  }
  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function jsonError(message: string, status = 400, detail?: unknown) {
  return Response.json({ ok: false, message, detail }, { status });
}

export function getGoogleEnv() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_GMAIL_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET / GOOGLE_GMAIL_REDIRECT_URI is missing");
  }
  return { clientId, clientSecret, redirectUri };
}

export async function getLatestTokenRow(): Promise<GmailTokenRow | null> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from(TOKEN_TABLE)
    .select("*")
    .eq("user_label", USER_LABEL)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(`gmail token select failed: ${error.message}`);
  }
  return data || null;
}

export async function saveTokenRow(partial: Partial<GmailTokenRow>) {
  const supabase = getSupabaseAdmin();
  const current = await getLatestTokenRow();
  const payload = {
    user_label: USER_LABEL,
    ...current,
    ...partial,
    updated_at: new Date().toISOString(),
  };

  if (current?.id) {
    const { data, error } = await supabase
      .from(TOKEN_TABLE)
      .update(payload)
      .eq("id", current.id)
      .select("*")
      .single();
    if (error) throw new Error(`gmail token update failed: ${error.message}`);
    return data;
  }

  const { data, error } = await supabase
    .from(TOKEN_TABLE)
    .insert(payload)
    .select("*")
    .single();
  if (error) throw new Error(`gmail token insert failed: ${error.message}`);
  return data;
}

export async function exchangeCodeForTokens(code: string) {
  const { clientId, clientSecret, redirectUri } = getGoogleEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Google token exchange failed: ${JSON.stringify(json)}`);
  }

  return json as {
    access_token: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
}

export async function refreshAccessToken(refreshToken: string) {
  const { clientId, clientSecret } = getGoogleEnv();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Google token refresh failed: ${JSON.stringify(json)}`);
  }

  return json as {
    access_token: string;
    expires_in?: number;
    scope?: string;
    token_type?: string;
  };
}

export function getExpiresAt(expiresIn?: number) {
  const seconds = typeof expiresIn === "number" ? expiresIn : 3600;
  return new Date(Date.now() + Math.max(seconds - 60, 60) * 1000).toISOString();
}

export async function getValidAccessToken() {
  const row = await getLatestTokenRow();
  if (!row?.refresh_token && !row?.access_token) {
    throw new Error("Gmail is not connected");
  }

  const expires = row.expires_at ? new Date(row.expires_at).getTime() : 0;
  if (row.access_token && expires > Date.now() + 60_000) {
    return row.access_token;
  }

  if (!row.refresh_token) {
    throw new Error("refresh_token is missing. Reconnect Gmail.");
  }

  const refreshed = await refreshAccessToken(row.refresh_token);
  await saveTokenRow({
    access_token: refreshed.access_token,
    scope: refreshed.scope || row.scope,
    token_type: refreshed.token_type || row.token_type,
    expires_at: getExpiresAt(refreshed.expires_in),
  });

  return refreshed.access_token;
}

export async function getGmailProfile(accessToken: string) {
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/profile", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Gmail profile failed: ${JSON.stringify(json)}`);
  }
  return json as { emailAddress?: string; messagesTotal?: number; threadsTotal?: number };
}

export function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}


export async function gmailApi(path: string, init?: RequestInit) {
  const accessToken = await getValidAccessToken();
  const res = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/${path.replace(/^\//, "")}`, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`Gmail API failed ${path}: ${JSON.stringify(json)}`);
  }
  return json;
}

export async function cacheGmailMessage(message: any) {
  const supabase = getSupabaseAdmin();
  const payload = {
    gmail_id: message.id,
    thread_id: message.threadId,
    from_email: message.from || "",
    to_email: message.to || "",
    subject: message.subject || "",
    snippet: message.snippet || "",
    body: message.body || "",
    received_at: message.date ? new Date(message.date).toISOString() : new Date().toISOString(),
    unread: Boolean(message.unread),
    important: Boolean(message.important),
    has_attachment: Boolean(message.hasAttachment),
    raw: message,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("gmail_cached_messages").upsert(payload, { onConflict: "gmail_id" });
  if (error) throw new Error(`gmail cache upsert failed: ${error.message}`);
}

export async function storePushEvent(input: { emailAddress?: string; historyId?: string; raw?: unknown }) {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("gmail_push_events").insert({
    email: input.emailAddress || null,
    history_id: input.historyId || null,
    raw: input.raw || {},
  });
  if (error) throw new Error(`gmail push event insert failed: ${error.message}`);
}
