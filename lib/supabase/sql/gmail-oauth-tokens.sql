-- Life Command OS Gmail OAuth token storage
-- Run this in Supabase SQL Editor before using Gmail live sync.

create table if not exists public.gmail_oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  user_label text not null default 'shuya',
  email text,
  refresh_token text,
  access_token text,
  scope text,
  token_type text,
  expires_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists gmail_oauth_tokens_user_label_idx
  on public.gmail_oauth_tokens (user_label, updated_at desc);

alter table public.gmail_oauth_tokens enable row level security;

-- Direct browser access is intentionally blocked.
-- Server-side API routes should use SUPABASE_SERVICE_ROLE_KEY.
drop policy if exists "No direct client access to gmail oauth tokens" on public.gmail_oauth_tokens;
create policy "No direct client access to gmail oauth tokens"
on public.gmail_oauth_tokens
for all
to anon, authenticated
using (false)
with check (false);
