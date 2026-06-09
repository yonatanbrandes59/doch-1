# הקמת Supabase לפרודקשן

## דעים כלליים

מערכת זו מוטסה על Supabase - בסיס נתונים PostgreSQL מנוהל עם אימות מובנה ו-RLS (Row Level Security).

- **Project**: rkbqpkahtqbnbqmpvdxd
- **URL**: https://rkbqpkahtqbnbqmpvdxd.supabase.co
- **Anon Key**: `sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF`

## צעדים

### צעד 1: הרץ את SQL setup

**A. דרך Supabase Dashboard (המלצה)**

1. פתח https://supabase.com/dashboard
2. בחר את Project `doch-1` (או צור חדש אם צריך)
3. בחר **SQL Editor** בתפריט הצד
4. הדבק את הקוד מ-`supabase/SETUP_ALL.sql`
5. לחץ **Run** 🎯

**B. דרך Supabase CLI (advanced)**

```bash
# התקן CLI אם עדיין לא
npm install -g supabase

# התחבר
supabase login

# הרץ migrations
supabase db push
```

### צעד 2: צור משתמשי בדיקה

**אפשרות א: אוטומטי (מומלץ)**

```bash
# התקן dependencies
pip install supabase

# הרץ סקריפט
cd supabase
python3 setup_users.py
```

פלט:
```
✓ משתמש coordinator1@doch.local נוצר
✓ משתמש coordinator2@doch.local נוצר
✓ משתמש coordinator3@doch.local נוצר
✓ משתמש admin@doch.local נוצר
```

**אפשרות ב: ידנית דרך Dashboard**

1. עבור ל-**Authentication → Users**
2. הקלקם **Add user** עבור כל אימייל בתבנית למטה
3. בצע את צעדים החמו 2 ב-`supabase/SETUP_MANUAL.md`

### צעד 3: עדכן .env.local

בדוק שיש לך בקובץ `.env.local`:

```env
VITE_SUPABASE_URL=https://rkbqpkahtqbnbqmpvdxd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF
```

### צעד 4: הרץ את התפוקה

```bash
npm run dev
```

פתח http://localhost:5173 בדפדפן

### צעד 5: בדיקת התחברות

**כ-רכז:**
- אימייל: `coordinator1@doch.local`
- סיסמה: `Test@12345`
- תראה: טופס דיווח עבור סניף הברנז"ל בלבד
- בצע דיווח עם headcount = 25

**כ-מנהל (חמ"ל):**
- אימייל: `admin@doch.local`
- סיסמה: `Test@12345`
- תראה: Dashboard עם כל הדיווחים
- יכול לנתח נוכחות וליצור דוחות

---

## משתמשי בדיקה

| אימייל | סיסמה | שם | תפקיד | סניף |
|--------|-------|-----|--------|------|
| coordinator1@doch.local | Test@12345 | הברנז"ל | coordinator | הברנז"ל |
| coordinator2@doch.local | Test@12345 | אביחיל | coordinator | אביחיל |
| coordinator3@doch.local | Test@12345 | גן יאשיה | coordinator | גן יאשיה |
| admin@doch.local | Test@12345 | מנהל חמ"ל | haml | כל הסניפים |

---

## בדיקת RLS

```bash
# כשאתה מחובר כ-coordinator
# SELECT * FROM reports - תראה רק של הסניף שלך

# כשאתה מחובר כ-admin
# SELECT * FROM reports - תראה את כל הדיווחים
```

---

## אישור סיום

✅ טבלות קיימות (branches, reports, profiles, settings)
✅ משתמשים נוצרו
✅ RLS מוגן (רכז רואה רק שלו, חמ"ל רואה הכל)
✅ התפוקה רצה ב-localhost
✅ התחברות עובדת

---

## ממשך עזרה

- Docs: `supabase/SETUP_MANUAL.md`
- SQL Migrations: `supabase/migrations/`
- Setup Script: `supabase/SETUP_ALL.sql`

