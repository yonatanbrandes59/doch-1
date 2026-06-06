-- הוסף עמודת מחנה לטבלת סניפים
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS camp text;

-- אינדקס לביצועים
CREATE INDEX IF NOT EXISTS branches_camp_idx ON public.branches (camp);
