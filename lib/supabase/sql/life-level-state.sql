-- Life Command OS v54 Life Level cross-device sync
create table if not exists public.life_level_states (
  id text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.life_level_states enable row level security;

-- API route uses SUPABASE_SERVICE_ROLE_KEY, so RLS policy for users is not required.
-- If you want anon read/write later, add authenticated policies carefully.
