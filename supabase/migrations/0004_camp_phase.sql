-- ─────────────────────────────────────────────────────────────
--  שלב מחנה (שכב"ג / שכב"צ) + נוכחות לפי שכבה
--  הרצה אחרי 0002_auth_rls.sql
-- ─────────────────────────────────────────────────────────────

-- עמודות חדשות בטבלת הדיווחים
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS camp_phase text;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS attendance jsonb;

-- ── טבלת הגדרות גלובליות (key/value) ──
create table if not exists public.settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

-- ברירת מחדל: מחנה שכב"ג
insert into public.settings (key, value)
values ('camp_phase', 'shachbag')
on conflict (key) do nothing;

-- Realtime
alter publication supabase_realtime add table public.settings;

-- ── RLS: כל משתמש מאומת קורא; רק חמ"ל כותב ──
alter table public.settings enable row level security;

drop policy if exists "settings read" on public.settings;
create policy "settings read" on public.settings
  for select to authenticated using (true);

drop policy if exists "settings manage" on public.settings;
create policy "settings manage" on public.settings
  for all to authenticated using (public.is_haml()) with check (public.is_haml());
