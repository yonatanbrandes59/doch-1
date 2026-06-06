-- ─────────────────────────────────────────────────────────────
--  סכמת מסד הנתונים למערכת חמ"ל דיווחים
--  הרצה: Supabase Dashboard → SQL Editor → הדבק והרץ
-- ─────────────────────────────────────────────────────────────

-- סוג סטטוס
do $$
begin
  if not exists (select 1 from pg_type where typname = 'branch_status') then
    create type branch_status as enum ('ok', 'attention', 'emergency');
  end if;
end$$;

-- סניפים
create table if not exists public.branches (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  region text not null,
  created_at timestamptz not null default now()
);

-- דיווחים
create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  branch_id uuid not null references public.branches (id) on delete cascade,
  coordinator_name text not null,
  status branch_status not null default 'ok',
  headcount integer,
  message text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists reports_branch_id_idx on public.reports (branch_id);
create index if not exists reports_created_at_idx on public.reports (created_at desc);

-- Realtime
alter publication supabase_realtime add table public.branches;
alter publication supabase_realtime add table public.reports;

-- ─────────────────────────────────────────────────────────────
--  Row Level Security
--  הערה: המדיניות כאן פתוחה (anon) כדי להתאים לזרימת קוד-הגישה
--  הנוכחית. בפרודקשן עם Supabase Auth מומלץ להחליף ל-policies
--  מבוססות auth.uid() ותפקידים.
-- ─────────────────────────────────────────────────────────────
alter table public.branches enable row level security;
alter table public.reports enable row level security;

drop policy if exists "branches read" on public.branches;
drop policy if exists "branches write" on public.branches;
drop policy if exists "reports read" on public.reports;
drop policy if exists "reports write" on public.reports;

create policy "branches read" on public.branches for select using (true);
create policy "branches write" on public.branches for all using (true) with check (true);
create policy "reports read" on public.reports for select using (true);
create policy "reports write" on public.reports for insert with check (true);

-- ─────────────────────────────────────────────────────────────
--  Seed — סניפים לדוגמה (אפשר למחוק/לערוך)
-- ─────────────────────────────────────────────────────────────
insert into public.branches (name, region)
select * from (values
  ('מרכז', 'מחוז מרכז'),
  ('צפון', 'מחוז צפון'),
  ('דרום', 'מחוז דרום'),
  ('ירושלים', 'מחוז ירושלים'),
  ('יהודה ושומרון', 'מחוז יו"ש'),
  ('שפלה', 'מחוז מרכז')
) as v(name, region)
where not exists (select 1 from public.branches);
