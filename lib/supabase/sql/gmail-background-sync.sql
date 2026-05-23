-- Life Command OS Gmail background sync / PubSub events

create table if not exists public.gmail_cached_messages (
  gmail_id text primary key,
  thread_id text,
  from_email text,
  to_email text,
  subject text,
  snippet text,
  body text,
  received_at timestamptz,
  unread boolean default false,
  important boolean default false,
  has_attachment boolean default false,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists gmail_cached_messages_received_at_idx
  on public.gmail_cached_messages (received_at desc);

alter table public.gmail_cached_messages enable row level security;

drop policy if exists "No direct client access to gmail cached messages" on public.gmail_cached_messages;
create policy "No direct client access to gmail cached messages"
on public.gmail_cached_messages
for all
to anon, authenticated
using (false)
with check (false);

create table if not exists public.gmail_push_events (
  id uuid primary key default gen_random_uuid(),
  email text,
  history_id text,
  raw jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists gmail_push_events_created_at_idx
  on public.gmail_push_events (created_at desc);

alter table public.gmail_push_events enable row level security;

drop policy if exists "No direct client access to gmail push events" on public.gmail_push_events;
create policy "No direct client access to gmail push events"
on public.gmail_push_events
for all
to anon, authenticated
using (false)
with check (false);
