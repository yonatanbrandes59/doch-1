-- ═══════════════════════════════════════════════════════════════════
--  חמ"ל דיווחים — סקריפט הקמה מאוחד (הכל ביחד)
--
--  בטוח להרצה חוזרת (idempotent): אפשר להריץ גם אם חלק כבר רץ.
--  שימוש: Supabase Dashboard → SQL Editor → הדבק הכל → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── טיפוסים (enums) ──
do $$
begin
  if not exists (select 1 from pg_type where typname = 'branch_status') then
    create type branch_status as enum ('ok', 'attention', 'emergency');
  end if;
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('coordinator', 'haml');
  end if;
end$$;

-- ── טבלת סניפים ──
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  created_at timestamptz not null default now()
);
alter table public.branches add column if not exists camp text;
alter table public.branches add column if not exists phone text;

-- ── טבלת דיווחים ──
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  coordinator_name text not null,
  status branch_status not null default 'ok',
  headcount integer,
  message text not null default '',
  created_at timestamptz not null default now()
);
alter table public.reports add column if not exists camp_phase text;
alter table public.reports add column if not exists attendance jsonb;

create index if not exists reports_branch_id_idx on public.reports (branch_id);
create index if not exists reports_created_at_idx on public.reports (created_at desc);
create index if not exists branches_camp_idx on public.branches (camp);
create index if not exists branches_phone_idx on public.branches (phone);

-- ── טבלת פרופילים (אימות → תפקיד + סניף) ──
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'coordinator',
  branch_id uuid references public.branches (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── טבלת הגדרות גלובליות (מחנה פעיל וכו') ──
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);
insert into public.settings (key, value)
values ('camp_phase', 'shachbag')
on conflict (key) do nothing;

-- ── פונקציות עזר (security definer) ──
create or replace function public.is_haml()
returns boolean language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'haml');
$$;

create or replace function public.current_branch()
returns uuid language sql security definer set search_path = public stable as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

-- ── Realtime (מוגן מפני הוספה כפולה) ──
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='branches') then
    alter publication supabase_realtime add table public.branches;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='reports') then
    alter publication supabase_realtime add table public.reports;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='settings') then
    alter publication supabase_realtime add table public.settings;
  end if;
end$$;

-- ═══════════════════════════════════════════════════════════════════
--  Row Level Security
-- ═══════════════════════════════════════════════════════════════════
alter table public.branches enable row level security;
alter table public.reports  enable row level security;
alter table public.profiles enable row level security;
alter table public.settings enable row level security;

-- ניקוי מדיניות קודמת (פתוחה/ישנה)
drop policy if exists "branches read" on public.branches;
drop policy if exists "branches write" on public.branches;
drop policy if exists "branches manage" on public.branches;
drop policy if exists "reports read" on public.reports;
drop policy if exists "reports write" on public.reports;
drop policy if exists "reports read own or haml" on public.reports;
drop policy if exists "reports insert own" on public.reports;
drop policy if exists "profiles self read" on public.profiles;
drop policy if exists "settings read" on public.settings;
drop policy if exists "settings manage" on public.settings;

-- profiles: כל אחד רואה את עצמו; חמ"ל רואה את כולם
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_haml());

-- branches: כל מאומת קורא; רק חמ"ל כותב
create policy "branches read" on public.branches
  for select to authenticated using (true);
create policy "branches manage" on public.branches
  for all to authenticated using (public.is_haml()) with check (public.is_haml());

-- reports: רכז רואה/כותב רק את הסניף שלו; חמ"ל רואה הכל
create policy "reports read own or haml" on public.reports
  for select to authenticated
  using (public.is_haml() or branch_id = public.current_branch());
create policy "reports insert own" on public.reports
  for insert to authenticated
  with check (public.is_haml() or branch_id = public.current_branch());

-- settings: כל מאומת קורא; רק חמ"ל כותב
create policy "settings read" on public.settings
  for select to authenticated using (true);
create policy "settings manage" on public.settings
  for all to authenticated using (public.is_haml()) with check (public.is_haml());

-- ── שמירת מידע (Data Retention): מחיקת דיווחים ישנים ──
create or replace function public.delete_old_reports(days integer default 180)
returns integer language plpgsql security definer set search_path = public as $$
declare deleted integer;
begin
  delete from public.reports where created_at < now() - (days || ' days')::interval;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

-- ✅ הסתיים. המערכת מוכנה: מחנה שכב"ג/שכב"צ, נוכחות לפי שכבה, הרשאות RLS.
