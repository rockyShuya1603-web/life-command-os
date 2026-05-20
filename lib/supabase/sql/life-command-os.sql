-- Life Command OS unified schema
-- SQLはこの1ファイルだけ実行してください。
-- 既存データを削除する DROP TABLE / DELETE FROM / TRUNCATE は使っていません。
-- create table if not exists / alter table add column if not exists / policy再作成のみです。

create extension if not exists pgcrypto;

-- =========================
-- Tables
-- =========================

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,-- Life Command OS unified schema
-- SQLはこの1ファイルだけ実行してください。
-- 既存データを削除する DROP TABLE / DELETE FROM / TRUNCATE は使っていません。
-- create table if not exists / alter table add column if not exists / policy再作成のみです。

create extension if not exists pgcrypto;

-- =========================
-- Tables
-- =========================

create table if not exists public.memos (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.todos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  done boolean not null default false,
  priority text not null default 'normal',
  due_date date,
  due_time time,
  location_name text,
  location_url text,
  notify_enabled boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.todos
  add column if not exists due_time time,
  add column if not exists location_name text,
  add column if not exists location_url text,
  add column if not exists notify_enabled boolean not null default false;

create table if not exists public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.diary_entries (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null default current_date,
  mood text not null default '普通',
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.diary_entries
  add column if not exists title text,
  add column if not exists image_url text,
  add column if not exists content_json jsonb;

create table if not exists public.coffee_logs (
  id uuid primary key default gen_random_uuid(),
  drink_date date not null default current_date,
  coffee_name text not null,
  cups numeric not null default 1,
  caffeine_mg integer not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.tweets (
  id uuid primary key default gen_random_uuid(),
  tweet_date date not null default current_date,
  content text not null,
  mood text,
  created_at timestamptz not null default now()
);

create table if not exists public.budget_logs (
  id uuid primary key default gen_random_uuid(),
  spend_date date not null default current_date,
  type text not null default 'expense' check (type in ('income', 'expense', 'charge')),
  category text not null,
  amount integer not null check (amount >= 0),
  source text,
  wallet text,
  payment_method text,
  memo text,
  created_at timestamptz not null default now()
);

alter table public.budget_logs
  add column if not exists source text,
  add column if not exists wallet text,
  add column if not exists payment_method text,
  add column if not exists image_url text;

create table if not exists public.budget_fixed_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category text not null default 'サブスク',
  amount integer not null default 0 check (amount >= 0),
  wallet text,
  due_day integer default 1 check (due_day >= 1 and due_day <= 31),
  active boolean not null default true,
  memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.routines (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  routine_time time,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.trash_rules (
  id uuid primary key default gen_random_uuid(),
  trash_type text not null,
  weekday integer not null check (weekday >= 0 and weekday <= 6),
  notify_time time,
  note text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.place_logs (
  id uuid primary key default gen_random_uuid(),
  place_date date not null default current_date,
  title text not null,
  category text not null default '思い出',
  address text,
  map_url text,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.sleep_logs (
  id uuid primary key default gen_random_uuid(),
  sleep_date date not null default current_date,
  bedtime time,
  wake_time time,
  quality text,
  note text,
  created_at timestamptz not null default now()
);

-- =========================
-- Indexes
-- =========================

create index if not exists memos_created_at_idx on public.memos(created_at desc);
create index if not exists todos_created_at_idx on public.todos(created_at desc);
create index if not exists todos_due_date_idx on public.todos(due_date desc);
create index if not exists calendar_events_event_date_idx on public.calendar_events(event_date desc);
create index if not exists diary_entries_entry_date_idx on public.diary_entries(entry_date desc);
create index if not exists coffee_logs_drink_date_idx on public.coffee_logs(drink_date desc);
create index if not exists tweets_tweet_date_idx on public.tweets(tweet_date desc);
create index if not exists budget_logs_spend_date_idx on public.budget_logs(spend_date desc);
create index if not exists budget_fixed_templates_created_at_idx on public.budget_fixed_templates(created_at desc);
create index if not exists routines_created_at_idx on public.routines(created_at desc);
create index if not exists trash_rules_weekday_idx on public.trash_rules(weekday asc);
create index if not exists place_logs_place_date_idx on public.place_logs(place_date desc);
create index if not exists sleep_logs_sleep_date_idx on public.sleep_logs(sleep_date desc);

-- =========================
-- Row Level Security
-- =========================

alter table public.memos enable row level security;
alter table public.todos enable row level security;
alter table public.calendar_events enable row level security;
alter table public.diary_entries enable row level security;
alter table public.coffee_logs enable row level security;
alter table public.tweets enable row level security;
alter table public.budget_logs enable row level security;
alter table public.budget_fixed_templates enable row level security;
alter table public.routines enable row level security;
alter table public.trash_rules enable row level security;
alter table public.place_logs enable row level security;
alter table public.sleep_logs enable row level security;

-- =========================
-- Policies: memos
-- =========================

drop policy if exists "Allow public read memos" on public.memos;
drop policy if exists "Allow public insert memos" on public.memos;
drop policy if exists "Allow public update memos" on public.memos;
drop policy if exists "Allow public delete memos" on public.memos;
create policy "Allow public read memos" on public.memos for select to anon using (true);
create policy "Allow public insert memos" on public.memos for insert to anon with check (true);
create policy "Allow public update memos" on public.memos for update to anon using (true) with check (true);
create policy "Allow public delete memos" on public.memos for delete to anon using (true);

-- =========================
-- Policies: todos
-- =========================

drop policy if exists "Allow public read todos" on public.todos;
drop policy if exists "Allow public insert todos" on public.todos;
drop policy if exists "Allow public update todos" on public.todos;
drop policy if exists "Allow public delete todos" on public.todos;
create policy "Allow public read todos" on public.todos for select to anon using (true);
create policy "Allow public insert todos" on public.todos for insert to anon with check (true);
create policy "Allow public update todos" on public.todos for update to anon using (true) with check (true);
create policy "Allow public delete todos" on public.todos for delete to anon using (true);

-- =========================
-- Policies: calendar_events
-- =========================

drop policy if exists "Allow public read calendar events" on public.calendar_events;
drop policy if exists "Allow public insert calendar events" on public.calendar_events;
drop policy if exists "Allow public update calendar events" on public.calendar_events;
drop policy if exists "Allow public delete calendar events" on public.calendar_events;
create policy "Allow public read calendar events" on public.calendar_events for select to anon using (true);
create policy "Allow public insert calendar events" on public.calendar_events for insert to anon with check (true);
create policy "Allow public update calendar events" on public.calendar_events for update to anon using (true) with check (true);
create policy "Allow public delete calendar events" on public.calendar_events for delete to anon using (true);

-- =========================
-- Policies: diary_entries
-- =========================

drop policy if exists "Allow public read diary entries" on public.diary_entries;
drop policy if exists "Allow public insert diary entries" on public.diary_entries;
drop policy if exists "Allow public update diary entries" on public.diary_entries;
drop policy if exists "Allow public delete diary entries" on public.diary_entries;
create policy "Allow public read diary entries" on public.diary_entries for select to anon using (true);
create policy "Allow public insert diary entries" on public.diary_entries for insert to anon with check (true);
create policy "Allow public update diary entries" on public.diary_entries for update to anon using (true) with check (true);
create policy "Allow public delete diary entries" on public.diary_entries for delete to anon using (true);

-- =========================
-- Policies: coffee_logs
-- =========================

drop policy if exists "coffee_logs_select_all" on public.coffee_logs;
drop policy if exists "coffee_logs_insert_all" on public.coffee_logs;
drop policy if exists "coffee_logs_update_all" on public.coffee_logs;
drop policy if exists "coffee_logs_delete_all" on public.coffee_logs;
create policy "coffee_logs_select_all" on public.coffee_logs for select to anon using (true);
create policy "coffee_logs_insert_all" on public.coffee_logs for insert to anon with check (true);
create policy "coffee_logs_update_all" on public.coffee_logs for update to anon using (true) with check (true);
create policy "coffee_logs_delete_all" on public.coffee_logs for delete to anon using (true);

-- =========================
-- Policies: tweets
-- =========================

drop policy if exists "tweets_select_all" on public.tweets;
drop policy if exists "tweets_insert_all" on public.tweets;
drop policy if exists "tweets_update_all" on public.tweets;
drop policy if exists "tweets_delete_all" on public.tweets;
create policy "tweets_select_all" on public.tweets for select to anon using (true);
create policy "tweets_insert_all" on public.tweets for insert to anon with check (true);
create policy "tweets_update_all" on public.tweets for update to anon using (true) with check (true);
create policy "tweets_delete_all" on public.tweets for delete to anon using (true);

-- =========================
-- Policies: budget_logs
-- =========================

drop policy if exists "budget_logs_select_all" on public.budget_logs;
drop policy if exists "budget_logs_insert_all" on public.budget_logs;
drop policy if exists "budget_logs_update_all" on public.budget_logs;
drop policy if exists "budget_logs_delete_all" on public.budget_logs;
create policy "budget_logs_select_all" on public.budget_logs for select to anon using (true);
create policy "budget_logs_insert_all" on public.budget_logs for insert to anon with check (true);
create policy "budget_logs_update_all" on public.budget_logs for update to anon using (true) with check (true);
create policy "budget_logs_delete_all" on public.budget_logs for delete to anon using (true);




-- =========================
-- Policies: budget_fixed_templates
-- =========================

drop policy if exists "budget_fixed_templates_select_all" on public.budget_fixed_templates;
drop policy if exists "budget_fixed_templates_insert_all" on public.budget_fixed_templates;
drop policy if exists "budget_fixed_templates_update_all" on public.budget_fixed_templates;
drop policy if exists "budget_fixed_templates_delete_all" on public.budget_fixed_templates;
create policy "budget_fixed_templates_select_all" on public.budget_fixed_templates for select to anon using (true);
create policy "budget_fixed_templates_insert_all" on public.budget_fixed_templates for insert to anon with check (true);
create policy "budget_fixed_templates_update_all" on public.budget_fixed_templates for update to anon using (true) with check (true);
create policy "budget_fixed_templates_delete_all" on public.budget_fixed_templates for delete to anon using (true);

-- =========================
-- Policies: routines
-- =========================

drop policy if exists "routines_select_all" on public.routines;
drop policy if exists "routines_insert_all" on public.routines;
drop policy if exists "routines_update_all" on public.routines;
drop policy if exists "routines_delete_all" on public.routines;
create policy "routines_select_all" on public.routines for select to anon using (true);
create policy "routines_insert_all" on public.routines for insert to anon with check (true);
create policy "routines_update_all" on public.routines for update to anon using (true) with check (true);
create policy "routines_delete_all" on public.routines for delete to anon using (true);

-- =========================
-- Policies: trash_rules
-- =========================

drop policy if exists "trash_rules_select_all" on public.trash_rules;
drop policy if exists "trash_rules_insert_all" on public.trash_rules;
drop policy if exists "trash_rules_update_all" on public.trash_rules;
drop policy if exists "trash_rules_delete_all" on public.trash_rules;
create policy "trash_rules_select_all" on public.trash_rules for select to anon using (true);
create policy "trash_rules_insert_all" on public.trash_rules for insert to anon with check (true);
create policy "trash_rules_update_all" on public.trash_rules for update to anon using (true) with check (true);
create policy "trash_rules_delete_all" on public.trash_rules for delete to anon using (true);

-- =========================
-- Policies: place_logs
-- =========================

drop policy if exists "place_logs_select_all" on public.place_logs;
drop policy if exists "place_logs_insert_all" on public.place_logs;
drop policy if exists "place_logs_update_all" on public.place_logs;
drop policy if exists "place_logs_delete_all" on public.place_logs;
create policy "place_logs_select_all" on public.place_logs for select to anon using (true);
create policy "place_logs_insert_all" on public.place_logs for insert to anon with check (true);
create policy "place_logs_update_all" on public.place_logs for update to anon using (true) with check (true);
create policy "place_logs_delete_all" on public.place_logs for delete to anon using (true);

-- =========================
-- Policies: sleep_logs
-- =========================

drop policy if exists "sleep_logs_select_all" on public.sleep_logs;
drop policy if exists "sleep_logs_insert_all" on public.sleep_logs;
drop policy if exists "sleep_logs_update_all" on public.sleep_logs;
drop policy if exists "sleep_logs_delete_all" on public.sleep_logs;
create policy "sleep_logs_select_all" on public.sleep_logs for select to anon using (true);
create policy "sleep_logs_insert_all" on public.sleep_logs for insert to anon with check (true);
create policy "sleep_logs_update_all" on public.sleep_logs for update to anon using (true) with check (true);
create policy "sleep_logs_delete_all" on public.sleep_logs for delete to anon using (true);

-- =========================
-- Added: routine check history for streak count
-- =========================
create table if not exists public.routine_checks (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  check_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (routine_id, check_date)
);

create index if not exists routine_checks_routine_date_idx on public.routine_checks(routine_id, check_date desc);
alter table public.routine_checks enable row level security;

drop policy if exists "Allow public read routine checks" on public.routine_checks;
drop policy if exists "Allow public insert routine checks" on public.routine_checks;
drop policy if exists "Allow public update routine checks" on public.routine_checks;
drop policy if exists "Allow public delete routine checks" on public.routine_checks;
create policy "Allow public read routine checks" on public.routine_checks for select to anon using (true);
create policy "Allow public insert routine checks" on public.routine_checks for insert to anon with check (true);
create policy "Allow public update routine checks" on public.routine_checks for update to anon using (true) with check (true);
create policy "Allow public delete routine checks" on public.routine_checks for delete to anon using (true);


-- =========================
-- Realtime publication / sync repair
-- =========================
-- 常時同期で使う全テーブルを Supabase Realtime に登録します。
-- 既に登録済みのテーブルはスキップします。既存データは削除しません。

do $$
declare
  tbl text;
  tables text[] := array[
    'memos',
    'tweets',
    'todos',
    'calendar_events',
    'diary_entries',
    'coffee_logs',
    'budget_logs',
    'routines',
    'routine_checks',
    'trash_rules',
    'place_logs',
    'sleep_logs'
  ];
begin
  foreach tbl in array tables loop
    execute format('alter table public.%I replica identity full', tbl);

    if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
      and not exists (
        select 1
        from pg_publication_tables
        where pubname = 'supabase_realtime'
          and schemaname = 'public'
          and tablename = tbl
      ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;
  end loop;
end $$;

-- =========================
-- App settings / theme sync
-- =========================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

drop policy if exists "Allow public read app settings" on public.app_settings;
drop policy if exists "Allow public insert app settings" on public.app_settings;
drop policy if exists "Allow public update app settings" on public.app_settings;
drop policy if exists "Allow public delete app settings" on public.app_settings;
create policy "Allow public read app settings" on public.app_settings for select to anon using (true);
create policy "Allow public insert app settings" on public.app_settings for insert to anon with check (true);
create policy "Allow public update app settings" on public.app_settings for update to anon using (true) with check (true);
create policy "Allow public delete app settings" on public.app_settings for delete to anon using (true);

do $$
begin
  execute 'alter table public.app_settings replica identity full';
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime')
    and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'app_settings'
    ) then
    execute 'alter publication supabase_realtime add table public.app_settings';
  end if;
end $$;


-- Budget account corners: wallet / bank / Suica / savings / custom
create table if not exists public.budget_accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null default '財布',
  balance numeric not null default 0,
  note text,
  created_at timestamptz not null default now()
);

alter table public.budget_accounts enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='budget_accounts' and policyname='budget_accounts_select_all') then
    create policy "budget_accounts_select_all" on public.budget_accounts for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='budget_accounts' and policyname='budget_accounts_insert_all') then
    create policy "budget_accounts_insert_all" on public.budget_accounts for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='budget_accounts' and policyname='budget_accounts_update_all') then
    create policy "budget_accounts_update_all" on public.budget_accounts for update to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='budget_accounts' and policyname='budget_accounts_delete_all') then
    create policy "budget_accounts_delete_all" on public.budget_accounts for delete to anon using (true);
  end if;
end $$;

-- Ideal board: images can be data URLs or normal URLs. Existing data is not deleted.
create table if not exists public.ideal_items (
  id uuid primary key default gen_random_uuid(),
  title text not null default '理想像',
  image_url text,
  description text,
  created_at timestamptz not null default now()
);

alter table public.ideal_items enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ideal_items' and policyname='ideal_items_select_all') then
    create policy "ideal_items_select_all" on public.ideal_items for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ideal_items' and policyname='ideal_items_insert_all') then
    create policy "ideal_items_insert_all" on public.ideal_items for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ideal_items' and policyname='ideal_items_update_all') then
    create policy "ideal_items_update_all" on public.ideal_items for update to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='ideal_items' and policyname='ideal_items_delete_all') then
    create policy "ideal_items_delete_all" on public.ideal_items for delete to anon using (true);
  end if;
end $$;

-- Ensure theme sharing table exists and can be used by PC/smartphone.
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_settings' and policyname='app_settings_select_all') then
    create policy "app_settings_select_all" on public.app_settings for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_settings' and policyname='app_settings_insert_all') then
    create policy "app_settings_insert_all" on public.app_settings for insert to anon with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_settings' and policyname='app_settings_update_all') then
    create policy "app_settings_update_all" on public.app_settings for update to anon using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='app_settings' and policyname='app_settings_delete_all') then
    create policy "app_settings_delete_all" on public.app_settings for delete to anon using (true);
  end if;
end $$;

-- Realtime publication. Ignore duplicate-publication errors if already added.
do $$
begin
  begin alter publication supabase_realtime add table public.app_settings; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table public.budget_accounts; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table public.ideal_items; exception when duplicate_object then null; when undefined_object then null; end;
end $$;

-- =========================
-- Belongings cards / items
-- =========================
create table if not exists public.belonging_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.belonging_items (
  id uuid primary key default gen_random_uuid(),
  card_id uuid not null references public.belonging_cards(id) on delete cascade,
  name text not null,
  checked boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists belonging_cards_created_at_idx on public.belonging_cards(created_at desc);
create index if not exists belonging_items_card_id_idx on public.belonging_items(card_id, created_at asc);

alter table public.belonging_cards enable row level security;
alter table public.belonging_items enable row level security;

-- Policies: belonging_cards
drop policy if exists "belonging_cards_select_all" on public.belonging_cards;
drop policy if exists "belonging_cards_insert_all" on public.belonging_cards;
drop policy if exists "belonging_cards_update_all" on public.belonging_cards;
drop policy if exists "belonging_cards_delete_all" on public.belonging_cards;
create policy "belonging_cards_select_all" on public.belonging_cards for select to anon using (true);
create policy "belonging_cards_insert_all" on public.belonging_cards for insert to anon with check (true);
create policy "belonging_cards_update_all" on public.belonging_cards for update to anon using (true) with check (true);
create policy "belonging_cards_delete_all" on public.belonging_cards for delete to anon using (true);

-- Policies: belonging_items
drop policy if exists "belonging_items_select_all" on public.belonging_items;
drop policy if exists "belonging_items_insert_all" on public.belonging_items;
drop policy if exists "belonging_items_update_all" on public.belonging_items;
drop policy if exists "belonging_items_delete_all" on public.belonging_items;
create policy "belonging_items_select_all" on public.belonging_items for select to anon using (true);
create policy "belonging_items_insert_all" on public.belonging_items for insert to anon with check (true);
create policy "belonging_items_update_all" on public.belonging_items for update to anon using (true) with check (true);
create policy "belonging_items_delete_all" on public.belonging_items for delete to anon using (true);

do $$
begin
  begin alter table public.belonging_cards replica identity full; exception when others then null; end;
  begin alter table public.belonging_items replica identity full; exception when others then null; end;
  begin alter publication supabase_realtime add table public.belonging_cards; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table public.belonging_items; exception when duplicate_object then null; when undefined_object then null; end;
end $$;

-- =========================
-- AI / image attachment upgrade
-- 既存データを削除せず、画像URL保存用の列だけ追加します。
-- =========================
alter table public.memos
  add column if not exists image_url text;

alter table public.todos
  add column if not exists image_url text;

alter table public.tweets
  add column if not exists image_url text;

alter table public.belonging_items
  add column if not exists image_url text;

do $$
begin
  begin alter publication supabase_realtime add table public.memos; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table public.todos; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table public.tweets; exception when duplicate_object then null; when undefined_object then null; end;
  begin alter publication supabase_realtime add table public.belonging_items; exception when duplicate_object then null; when undefined_object then null; end;
end $$;


-- =========================
-- Budget charge migration / Life OS expansion
-- 既存データは消さず、チャージ種別を許可します。
-- =========================
do $$
begin
  if exists (
    select 1 from pg_constraint
    where conname = 'budget_logs_type_check'
      and conrelid = 'public.budget_logs'::regclass
  ) then
    alter table public.budget_logs drop constraint budget_logs_type_check;
  end if;
  alter table public.budget_logs
    add constraint budget_logs_type_check check (type in ('income', 'expense', 'charge'));
exception when others then null;
end $$;

create table if not exists public.life_item_tags (
  id uuid primary key default gen_random_uuid(),
  item_name text not null,
  tag_code text,
  last_place text,
  note text,
  created_at timestamptz not null default now()
);

alter table public.life_item_tags enable row level security;
drop policy if exists "life_item_tags_select_all" on public.life_item_tags;
drop policy if exists "life_item_tags_insert_all" on public.life_item_tags;
drop policy if exists "life_item_tags_update_all" on public.life_item_tags;
drop policy if exists "life_item_tags_delete_all" on public.life_item_tags;
create policy "life_item_tags_select_all" on public.life_item_tags for select to anon using (true);
create policy "life_item_tags_insert_all" on public.life_item_tags for insert to anon with check (true);
create policy "life_item_tags_update_all" on public.life_item_tags for update to anon using (true) with check (true);
create policy "life_item_tags_delete_all" on public.life_item_tags for delete to anon using (true);

do $$
begin
  begin alter table public.life_item_tags replica identity full; exception when others then null; end;
  begin alter publication supabase_realtime add table public.life_item_tags; exception when duplicate_object then null; when undefined_object then null; end;
end $$;
