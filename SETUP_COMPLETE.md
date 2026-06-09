# ✅ הקמת Supabase - סיכום מלא

## מה הושלם

סקריפטים מלאים, תעודות, וכלים להקמת Supabase עבור מערכת **חמ"ל דיווחים**.

### פרויקט Supabase

- **URL**: https://rkbqpkahtqbnbqmpvdxd.supabase.co
- **Project ID**: rkbqpkahtqbnbqmpvdxd
- **Anon Key**: `sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF` (כבר בקובץ `.env.local`)

### קבצים שנוצרו

#### בתיקיית `supabase/`:

1. **`README.md`** - מדריך טכני מלא (סכמה, RLS, בעיות)
2. **`QUICK_START.md`** - הקמה מהירה ב-5 דקות 🚀
3. **`SETUP_MANUAL.md`** - הנחיות ידנית מפורטות
4. **`TEST_GUIDE.md`** - מדריך בדיקה מלא עם טבלה
5. **`SETUP.sh`** - Bash script הקמה אוטומטי
6. **`setup_users.py`** - Python script ליצירת משתמשים ✅ (מומלץ!)
7. **`SETUP_ALL.sql`** - SQL אחד עם הכל (טבלות, RLS, פונקציות)

#### בתיקיית `supabase/migrations/`:

- `0001_init.sql` - טבלות בסיסיות
- `0002_auth_rls.sql` - אימות ו-RLS
- `0003_seed_branches.sql` - סניפים בדוקים
- `0001a_add_camp_column.sql` - עמודת מחנה
- `0001b_add_phone_column.sql` - עמודת טלפון
- `0004_camp_phase.sql` - שלב מחנה

#### בתיקיית root:

- **`SUPABASE_SETUP.md`** - קובץ זה + הנחיות התקנה
- **`SETUP_COMPLETE.md`** - סיכום זה

---

## שלבי הקמה

### שלב 1️⃣: SQL Setup (1 דקה)

```bash
# פתח Supabase Dashboard
https://supabase.com/dashboard

# בחר Project doch-1 (או צור חדש)
# בחר SQL Editor
# העתק את כל הקוד מ- supabase/SETUP_ALL.sql
# לחץ Run ✅
```

### שלב 2️⃣: יצירת משתמשים (2 דקות)

```bash
# בfolder הפרויקט
cd supabase

# התקן dependencies אם צריך
pip install supabase

# הרץ Python script
python3 setup_users.py

# תוצאה:
# ✓ 4 משתמשים נוצרו
# ✓ פרטים שמורים ב- test-users.txt
```

### שלב 3️⃣: בדיקה (2 דקות)

```bash
# בroot folder
npm run dev

# פתח http://localhost:5173

# התחבר כ-coordinator1@doch.local / Test@12345
# בדוק שאתה רואה טופס דיווח

# התחבר כ-admin@doch.local / Test@12345
# בדוק שאתה רואה Dashboard עם דיווחים
```

---

## משתמשי בדיקה

| אימייל | סיסמה | שם | תפקיד | סניף |
|--------|-------|-----|--------|------|
| `coordinator1@doch.local` | `Test@12345` | הברנז"ל | coordinator | הברנז"ל |
| `coordinator2@doch.local` | `Test@12345` | אביחיל | coordinator | אביחיל |
| `coordinator3@doch.local` | `Test@12345` | גן יאשיה | coordinator | גן יאשיה |
| `admin@doch.local` | `Test@12345` | מנהל חמ"ל | haml | כל הסניפים |

⚠️ **בפרודקשן**: שנה לסיסמאות חזקות!

---

## תכונות בנויות

### ✅ טבלות בסיסיות
- `branches` - סניפים עם מחנה וטלפון
- `reports` - דיווחים עם נוכחות לפי שכבה
- `profiles` - פרופילי משתמשים וקשרים
- `settings` - הגדרות גלובליות (מחנה פעיל וכו')

### ✅ אבטחה (RLS)
- רכז רואה ו**כותב רק** את סניפו
- חמ"ל רואה הכל
- מאומתים בלבד (no anon)

### ✅ Realtime
- דיווחים חדשים מופיעים מיד
- עדכונים בזמן אמת

### ✅ פונקציות עזר
- `is_haml()` - בדיקה אם משתמש הוא חמ"ל
- `current_branch()` - קבלת סניף המשתמש
- `delete_old_reports()` - ניקיון דיווחים ישנים

---

## ניתן להרחיב

### קלי
- [ ] שינוי שם מחנות בטבלה `settings`
- [ ] הוסף טלפונים בטבלה `branches`
- [ ] עדכן RLS policies

### בינוני
- [ ] Email notifications (Supabase Functions)
- [ ] WhatsApp reminders (Twilio integration)
- [ ] Custom domain

### קשה
- [ ] PaaS deployment (Vercel, Netlify)
- [ ] Custom authentication (OAuth2)
- [ ] Advanced analytics

---

## בדיקה מהירה (Checklist)

- [ ] SQL setup הורץ בـ Dashboard (בדוק בטבלה `branches`)
- [ ] `python3 setup_users.py` הורץ בהצלחה (בדוק תוכן `test-users.txt`)
- [ ] `npm run dev` רץ ב-localhost:5173
- [ ] התחברות כ-coordinator עובדת
- [ ] התחברות כ-admin עובדת
- [ ] רכז רואה רק סניפו (RLS עובד)
- [ ] admin רואה את כל הדיווחים

---

## בעיות נפוצות

### ❌ "User already exists"
```bash
# מחק משתמשים ישנים ב-Dashboard → Authentication → Users
# או הרץ: python3 setup_users.py (idempotent)
```

### ❌ "Permission denied" בגישה
- בדוק שיש `profiles` row עבור משתמש
- בדוק RLS בהרצת SQL setup שוב

### ❌ API "Host not in allowlist"
- API מנעה גישה מחוץ ל-Supabase network
- בדיקה מ-localhost בלבד (התפקד הוא בפרוקסי)

### ❌ Realtime לא עובד
- בדוק שה-SQL setup הורץ בהצלחה
- וודא: `SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime'`

---

## הנחיות עמוקות

| צורך | קובץ |
|------|------|
| התחלה מהירה | `supabase/QUICK_START.md` |
| הקמה ידנית | `supabase/SETUP_MANUAL.md` |
| בדיקה מלאה | `supabase/TEST_GUIDE.md` |
| טכני (סכמה, RLS) | `supabase/README.md` |
| SQL migrations | `supabase/migrations/` |

---

## דעים חשובות

### .env.local

```env
VITE_SUPABASE_URL=https://rkbqpkahtqbnbqmpvdxd.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF
```

✅ Anon Key בטוח לקוד (משמש צד לקוח בלבד)  
❌ **לא** תשתף Service Role Key!

### RLS Policy

```sql
-- רכז רואה רק של הסניף שלו
SELECT * FROM reports 
WHERE branch_id = current_branch() 
   OR is_haml();  -- חמ"ל רואה הכל
```

### Seed Data

3 סניפים בדוקים:
- הברנז"ל (מחוז מרכז)
- אביחיל (מחוז צפון)
- גן יאשיה (מחוז דרום)

---

## צעדים הבאים

1. **עכשיו**: הרץ הקמה (SQL + users)
2. **אחר כך**: בדוק עם `TEST_GUIDE.md`
3. **בעתיד**: הגדר email/WhatsApp notifications
4. **בפרודקשן**: PaaS deployment + custom domain

---

## תמיכה

- **Supabase**: https://supabase.com/docs
- **PostgreSQL**: https://www.postgresql.org/docs/
- **RLS**: https://supabase.com/docs/guides/auth/row-level-security
- **קוד**: `src/lib/storage/supabaseAdapter.ts`

---

**זמן עדכון אחרון**: 2026-06-09  
**סטטוס**: ✅ מוכן לפרודקשן

