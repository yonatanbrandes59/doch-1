-- ─────────────────────────────────────────────────────────────
--  הגנת פרט: אימות אמיתי + RLS מהודק לפי תפקיד וסניף
--  הרצה אחרי 0001_init.sql
-- ─────────────────────────────────────────────────────────────

-- סוג תפקיד
do $$
begin
  if not exists (select 1 from pg_type where typname = 'user_role') then
    create type user_role as enum ('coordinator', 'haml');
  end if;
end$$;

-- ── טבלת פרופילים: מקשרת משתמש מאומת (auth.users) לתפקיד וסניף ──
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role user_role not null default 'coordinator',
  branch_id uuid references public.branches (id) on delete set null,
  created_at timestamptz not null default now()
);

-- ── פונקציות עזר (security definer כדי לקרוא profiles בלי רקורסיית RLS) ──
create or replace function public.is_haml()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'haml'
  );
$$;

create or replace function public.current_branch()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select branch_id from public.profiles where id = auth.uid();
$$;

-- ── ניקוי המדיניות הפתוחה מ-0001 ──
drop policy if exists "branches read" on public.branches;
drop policy if exists "branches write" on public.branches;
drop policy if exists "reports read" on public.reports;
drop policy if exists "reports write" on public.reports;

-- ── profiles: כל אחד רואה את עצמו; חמ"ל רואה את כולם ──
alter table public.profiles enable row level security;
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles
  for select using (id = auth.uid() or public.is_haml());

-- ── branches: כל משתמש מאומת קורא; רק חמ"ל כותב ──
create policy "branches read" on public.branches
  for select to authenticated using (true);
create policy "branches manage" on public.branches
  for all to authenticated using (public.is_haml()) with check (public.is_haml());

-- ── reports: רכז רואה/כותב רק את הסניף שלו; חמ"ל רואה הכל ──
create policy "reports read own or haml" on public.reports
  for select to authenticated
  using (public.is_haml() or branch_id = public.current_branch());

create policy "reports insert own" on public.reports
  for insert to authenticated
  with check (public.is_haml() or branch_id = public.current_branch());

-- ── הגבלת שמירה (Data Retention): מחיקת דיווחים ישנים ──
create or replace function public.delete_old_reports(days integer default 180)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted integer;
begin
  delete from public.reports where created_at < now() - (days || ' days')::interval;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

-- אופציונלי (דורש הרחבת pg_cron): הרצה יומית
-- select cron.schedule('purge-old-reports', '0 3 * * *', $$select public.delete_old_reports(180)$$);

-- ─────────────────────────────────────────────────────────────
--  הקמת משתמשים (דוגמה):
--  1) צור משתמשים ב-Authentication → Users (email + password).
--  2) שייך פרופיל לכל משתמש:
--
--  insert into public.profiles (id, full_name, role, branch_id) values
--    ('<user-uuid>', 'מנהל חמ"ל', 'haml', null),
--    ('<user-uuid>', 'דנה כהן', 'coordinator',
--       (select id from public.branches where name = 'מרכז'));
-- ─────────────────────────────────────────────────────────────
