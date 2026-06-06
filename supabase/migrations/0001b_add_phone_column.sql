-- הוסף עמודת טלפון לטבלת סניפים לשיתוף WhatsApp reminders
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS phone text;

-- אינדקס לביצועים
CREATE INDEX IF NOT EXISTS branches_phone_idx ON public.branches (phone);
