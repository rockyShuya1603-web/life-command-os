-- Life Command OS v74 schema fix
-- Supabase SQL Editorで1回だけ実行してください。
-- 既存データは削除しません。足りない列とpolicyだけ追加/再作成します。

create extension if not exists pgcrypto;

alter table public.todos
  add column if not exists due_time time,
  add column if not exists location_name text,
  add column if not exists location_url text,
  add column if not exists notify_enabled boolean not null default false,
  add column if not exists image_url text;

alter table public.calendar_events
  add column if not exists start_time time,
  add column if not exists end_time time,
  add column if not exists image_url text;

create index if not exists todos_due_date_idx on public.todos(due_date desc);
create index if not exists calendar_events_event_date_idx on public.calendar_events(event_date desc);
create index if not exists calendar_events_start_time_idx on public.calendar_events(start_time);

alter table public.todos enable row level security;
alter table public.calendar_events enable row level security;

drop policy if exists "Allow public read todos" on public.todos;
drop policy if exists "Allow public insert todos" on public.todos;
drop policy if exists "Allow public update todos" on public.todos;
drop policy if exists "Allow public delete todos" on public.todos;
create policy "Allow public read todos" on public.todos for select to anon using (true);
create policy "Allow public insert todos" on public.todos for insert to anon with check (true);
create policy "Allow public update todos" on public.todos for update to anon using (true) with check (true);
create policy "Allow public delete todos" on public.todos for delete to anon using (true);

drop policy if exists "Allow public read calendar events" on public.calendar_events;
drop policy if exists "Allow public insert calendar events" on public.calendar_events;
drop policy if exists "Allow public update calendar events" on public.calendar_events;
drop policy if exists "Allow public delete calendar events" on public.calendar_events;
create policy "Allow public read calendar events" on public.calendar_events for select to anon using (true);
create policy "Allow public insert calendar events" on public.calendar_events for insert to anon with check (true);
create policy "Allow public update calendar events" on public.calendar_events for update to anon using (true) with check (true);
create policy "Allow public delete calendar events" on public.calendar_events for delete to anon using (true);

-- PostgREST/Supabaseのスキーマキャッシュ更新
notify pgrst, 'reload schema';
