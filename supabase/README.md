# Supabase הקמה וכלים

ספריה זו מכילה את כל הכלים וקבצי ההנחיות להקמת Supabase עבור מערכת חמ"ל דיווחים.

## קבצים בספריה

### תיעוד

- **`README.md`** ← אתה כאן
- **`SETUP_MANUAL.md`** - הנחיות הקמה מפורטות ידנית
- **`TEST_GUIDE.md`** - מדריך בדיקה מלא לאחר הקמה

### SQL

- **`SETUP_ALL.sql`** - SQL אחד המכיל את כל טבלות, RLS, פונקציות
  - תשתמש בזה בhashboard Supabase

- **`migrations/`** - קבצי migration בודדים (למרה, מתועדים)
  - `0001_init.sql` - טבלות בסיסיות
  - `0002_auth_rls.sql` - אימות ו-RLS מהודק
  - `0003_seed_branches.sql` - סניפים בדוקים
  - `0001a_add_camp_column.sql` - עמודה מחנה
  - `0001b_add_phone_column.sql` - עמודה טלפון
  - `0004_camp_phase.sql` - שלב מחנה ואימות לפי שכבה

### סקריפטים

- **`SETUP.sh`** - Bash script אוטומטי (עדיין דורש ריצה דרך Dashboard)
- **`setup_users.py`** - Python script ליצירת משתמשי בדיקה
  - **מומלץ**: השתמש בזה כדי ליצור משתמשים אוטומטית

## התקנה מהירה

### שלב 1: SQL Setup

```bash
# בדוק את הקובץ
cat SETUP_ALL.sql

# או עבור ל-Supabase Dashboard (המלצה):
# 1. פתח https://supabase.com/dashboard
# 2. בחר Project doch-1
# 3. SQL Editor → הדבק את SETUP_ALL.sql → Run
```

### שלב 2: יצירת משתמשים

```bash
# התקן dependencies
pip install supabase

# הרץ setup
python3 setup_users.py

# פלט:
# ✓ משתמש coordinator1@doch.local נוצר
# ✓ משתמש coordinator2@doch.local נוצר
# ✓ משתמש coordinator3@doch.local נוצר
# ✓ משתמש admin@doch.local נוצר
```

פרטים שמורים ב: `test-users.txt`

### שלב 3: בדיקה

```bash
# מ-root directory
npm run dev

# פתח http://localhost:5173
# התחבר עם:
#   - coordinator1@doch.local / Test@12345 (רכז)
#   - admin@doch.local / Test@12345 (מנהל)
```

ראה `TEST_GUIDE.md` להנחיות בדיקה מלאה.

## קונפיגורציה

### .env.local

```env
VITE_SUPABASE_URL=https://rkbqpkahtqbnbqmpvdxd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF
```

⚠️ **זהיר**: Anon Key אינו סודי (משמש בקוד צד לקוח), אך אל תשתף את Service Role Key.

## סכמת בסיס הנתונים

### טבלות

#### `branches` - סניפים
```sql
CREATE TABLE public.branches (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  camp TEXT,                    -- מחנה (שכב"ג/שכב"צ)
  phone TEXT,                   -- טלפון לwhatsapp reminders
  created_at TIMESTAMPTZ
);
```

#### `reports` - דיווחים
```sql
CREATE TABLE public.reports (
  id UUID PRIMARY KEY,
  branch_id UUID REFERENCES branches(id),
  coordinator_name TEXT NOT NULL,
  status ENUM ('ok', 'attention', 'emergency'),
  headcount INTEGER,
  camp_phase TEXT,              -- שלב מחנה (shachbag/shachbatz)
  attendance JSONB,             -- {'ט': 12, 'י': 9, ...}
  message TEXT,
  created_at TIMESTAMPTZ
);
```

#### `profiles` - פרופילי משתמשים
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  role ENUM ('coordinator', 'haml'),
  branch_id UUID REFERENCES branches(id),
  created_at TIMESTAMPTZ
);
```

#### `settings` - הגדרות גלובליות
```sql
CREATE TABLE public.settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMPTZ
);
```

### Row Level Security (RLS)

- **branches**: כל מאומת קורא; רק חמ"ל כותב
- **reports**: רכז רואה/כותב רק של הסניף שלו; חמ"ל רואה הכל
- **profiles**: כל אחד רואה את עצמו; חמ"ל רואה את כולם
- **settings**: כל מאומת קורא; רק חמ"ל כותב

## משתמשי בדיקה

| אימייל | סיסמה | תפקיד | סניף |
|--------|-------|--------|------|
| coordinator1@doch.local | Test@12345 | coordinator | הברנז"ל |
| coordinator2@doch.local | Test@12345 | coordinator | אביחיל |
| coordinator3@doch.local | Test@12345 | coordinator | גן יאשיה |
| admin@doch.local | Test@12345 | haml | (כל הסניפים) |

⚠️ **בפרודקשן**: שנה סיסמאות חזקות!

## בעיות נפוצות ופתרונות

### "User already exists"
```bash
# מחק בטבל ו- מנסה שוב
# או צור משתמש בשם אחר
python3 setup_users.py
```

### "permission denied" בגישה לדיווחים
- בדוק שיש `profiles` row עבור ה-user_id
- בדוק שה-`branch_id` בפרופיל תואם את `branch_id` של הדיווח

### Realtime לא מעדכן
- בדוק שהSQL setup הורץ בהצלחה
- אימות שטבלות addeda לפאבליקציה:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```

### "Schema already exists"
- SQL הוא idempotent (בטוח להרצה חוזרת), אבל אם יש בעיה:
  ```bash
  # בדוק טבלות קיימות
  # DELETE FROM branches WHERE ...  (אם צריך לנקות)
  ```

## סייעת נוספת

- **Supabase Docs**: https://supabase.com/docs
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **RLS Guide**: https://supabase.com/docs/guides/auth/row-level-security
- **Auth Guide**: https://supabase.com/docs/guides/auth

## בודקת אחרונה

```bash
# בדוק שהSupabase URL נכון
echo $VITE_SUPABASE_URL

# בדוק שהמיגרציות הורצו
# פתח SQL Editor בDashboard וריץ:
# SELECT COUNT(*) FROM public.branches;
```

## משימות שנותרו (אופציוני)

- [ ] הגדר Email Notifications לדיווחים חדשים
- [ ] הוסף custom domain (כ-supabase.doch.org.il)
- [ ] הגדר PaaS deployment (Vercel, Netlify, Railway)
- [ ] הגדר backups אוטומטיים
- [ ] בדוק GDPR compliance וערוך DPA (Data Processing Agreement)

---

**אחרון עודכן**: 2026-06-09

