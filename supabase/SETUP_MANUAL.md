# חמ"ל דיווחים - הנחיות הקמה ידנית ב-Supabase

## סקירה כללית

המערכת מערכת דיווחים בזמן אמת להנהלת סניפי תנועת הנוער של האיחוד החקלאי.

- **Supabase URL**: https://rkbqpkahtqbnbqmpvdxd.supabase.co
- **Anon Key**: `sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF`

## צעדים להקמה

### צעד 1: הרצת SQL setup

1. עבור ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט `doch-1`
3. בחר **SQL Editor** בתפריט הצד
4. אם אין כאן project זה, צור project חדש עם שם `doch-1` באזור הקרוב
5. **העתק את הטקסט המלא מ-`supabase/SETUP_ALL.sql`**
6. הדבק לחלון ה-SQL Editor
7. לחץ **Run** בפינה העליונה הימנית

✅ בודק: לאחר הרצה, אתה צריך לראות בכרטיסייה **Database** את הטבלות החדשות:
- `branches` (סניפים)
- `reports` (דיווחים)
- `profiles` (פרופילי משתמשים + תפקידים)
- `settings` (הגדרות גלובליות)

### צעד 2: יצירת משתמשי בדיקה

#### אפשרות א: ידנית דרך Supabase Dashboard

1. עבור ל-**Authentication → Users** בתפריט הצד
2. לחץ **Add user**
3. הזן אימייל וסיסמה עבור כל משתמש (ראה טבלה למטה)
4. לחץ **Send invite** או **Create user**

**שלב 3: צור פרופילים**

אחרי יצירת המשתמשים:
1. בחזור ל-**SQL Editor**
2. הרץ את הקוד הבא (בשני שלבים):

**שלב א: טען את ה-UUIDs של המשתמשים החדשים**

```sql
-- הדפס את UUIDs של כל המשתמשים החדשים
SELECT id, email FROM auth.users WHERE email LIKE '%@doch.local%' ORDER BY created_at DESC;
```

**שלב ב: צור פרופילים (עדכן עם ה-UUIDs בפועל)**

```sql
-- שלב 1: קבל את ה-branch IDs
SELECT id, name FROM public.branches LIMIT 10;

-- שלב 2: הוסף פרופילים (החלף את ה-UUIDs ואת branch_ids בערכים בפועל)
INSERT INTO public.profiles (id, full_name, role, branch_id) VALUES
  ('UUID-OF-COORDINATOR1', 'הברנז"ל', 'coordinator', (SELECT id FROM public.branches WHERE name = 'הברנז"ל' LIMIT 1)),
  ('UUID-OF-COORDINATOR2', 'אביחיל', 'coordinator', (SELECT id FROM public.branches WHERE name = 'אביחיל' LIMIT 1)),
  ('UUID-OF-COORDINATOR3', 'גן יאשיה', 'coordinator', (SELECT id FROM public.branches WHERE name = 'גן יאשיה' LIMIT 1)),
  ('UUID-OF-ADMIN', 'מנהל חמ"ל', 'haml', NULL);
```

#### אפשרות ב: ייצור אוטומטי (Python script)

```bash
cd /home/user/doch-1/supabase
python3 setup_users.py
```

(ראה קובץ `setup_users.py` להלן)

---

## משתמשי בדיקה

### רכז #1 - הברנז"ל
- **אימייל**: `coordinator1@doch.local`
- **סיסמה**: `Test@12345`
- **שם**: הברנז"ל
- **תפקיד**: coordinator (רכז סניף)
- **סניף**: הברנז"ל

### רכז #2 - אביחיל
- **אימייל**: `coordinator2@doch.local`
- **סיסמה**: `Test@12345`
- **שם**: אביחיל
- **תפקיד**: coordinator
- **סניף**: אביחיל

### רכז #3 - גן יאשיה
- **אימייל**: `coordinator3@doch.local`
- **סיסמה**: `Test@12345`
- **שם**: גן יאשיה
- **תפקיד**: coordinator
- **סניף**: גן יאשיה

### מנהל (חמ"ל)
- **אימייל**: `admin@doch.local`
- **סיסמה**: `Test@12345`
- **שם**: מנהל חמ"ל
- **תפקיד**: haml (administrator)
- **סניף**: כל הסניפים

---

## בדיקה מהירה

### בדוק התחברות
```bash
npm run dev
```

1. פתח `http://localhost:5173`
2. התחבר כ-`coordinator1@doch.local` / `Test@12345`
3. אתה תראה טופס דיווח עבור סניף הברנז"ל בלבד
4. התחבר כ-`admin@doch.local` / `Test@12345`
5. אתה תראה את ה-dashboard עם כל הדיווחים

### בדוק RLS (Row Level Security)
```sql
-- כשאתה מחובר כ-coordinator
SELECT * FROM public.reports;  -- יראה רק דיווחים של הסניף שלך

-- כשאתה מחובר כ-admin
SELECT * FROM public.reports;  -- יראה את כל הדיווחים
```

---

## בעיות נפוצות

### ❌ "Host not in allowlist"
**בעיה**: API REST מנעה גישה מחוץ ל-Supabase network.  
**פתרון**: 
- גשת לנתונים מ-localhost בלבד (התפקד הוא בפרוקסי)
- או הגדר CORS בהגדרות Supabase Project

### ❌ "User creation failed: User already exists"
**בעיה**: משתמש עם אימייל זה כבר קיים.  
**פתרון**: מחק את המשתמש הישן בـ Authentication → Users → Delete

### ❌ "profile doesn't exist"
**בעיה**: יצרת משתמש אך לא יצרת פרופיל.  
**פתרון**: הרץ את ה-INSERT שמופיע במדריך למעלה

### ❌ RLS Policy מונע גישה
**בעיה**: מחובר אך מקבל "permission denied".  
**פתרון**: 
- תקן את ה-RLS policies בהרצה של `SETUP_ALL.sql` שוב
- וודא שה-`profiles` row קיים עבור ה-user_id בפועל

---

## צעדים נוספים (אופציוני)

### הוסף WhatsApp reminders
עדכן את עמודת ה-`phone` בטבלת `branches`:

```sql
UPDATE public.branches 
SET phone = '+972XX1234567' 
WHERE name = 'הברנז"ל';
```

### הגדר פאזת מחנה פעילה
```sql
UPDATE public.settings 
SET value = 'shachbag' 
WHERE key = 'camp_phase';

-- שנה ל-'shachbatz' לפאזה השנייה
```

### הוריד דוח CSV
```bash
curl -s "https://rkbqpkahtqbnbqmpvdxd.supabase.co/rest/v1/reports?order=created_at.desc" \
  -H "apikey: sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF" \
  > reports.json

python3 -c "import json, csv; \
data = json.load(open('reports.json')); \
writer = csv.DictWriter(open('reports.csv', 'w'), fieldnames=data[0].keys() if data else []); \
writer.writeheader(); writer.writerows(data)"
```

---

## טיפול בתעודות (Secrets)

⚠️ **אזהרה**: 
- ה-Anon Key מודפסת כאן במטרות בדיקה בלבד
- בפרודקשן, הנח את ה-Anon Key בלבד בקוד הברק (REST API, RLS מוגן)
- לא תמלא שם Service Role Key בקוד ברור
- גשת ל-Secrets דרך environment variables בלבד

---

## עזרה נוספת

- [Supabase Documentation](https://supabase.com/docs)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [SQL Reference](https://supabase.com/docs/guides/database)

