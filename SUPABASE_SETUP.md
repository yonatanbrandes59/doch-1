# הגדרת Supabase עבור חמ"ל דיווחים

## מטרה
חיבור המערכת ל-Supabase כדי שהחמ"ל וכל הרכזים יוכלו לעבוד באותו זמן עם סנכרון בזמן אמת.

---

## שלב 1: יצירת Project ב-Supabase

1. כנס ל- https://supabase.com
2. התחבר עם החשבון שלך
3. לחץ על **"New Project"** / **"+ New Project"**
4. בטופס שיופיע:
   - **Name**: בחר שם למשל `doch-reports` או `haml-2026`
   - **Password**: הגדר סיסמה חזקה ל-database (שמור אותה!)
   - **Region**: בחר **"Europe (Ireland)"** כדי שיהיה קרוב ישראל
5. לחץ **"Create new project"**
6. המתן 2-3 דקות עד שה-project יוקם

---

## שלב 2: הרצת Migrations (יצירת טבלות וקבצים)

### חלק א: הכנה

1. בעמוד Supabase, לחץ על **"SQL Editor"** (בעמודה שמאל)
2. לחץ על **"New Query"** (או **"+ New"**)

### חלק ב: הריץ כל migration בסדר

**Migration 1: 0001_init.sql**
- צפה בקובץ: `/supabase/migrations/0001_init.sql`
- העתק את כל התוכן
- דביק ב-SQL Editor
- לחץ **"Run"** (או Ctrl+Enter)
- המתן עד שיסתיים (✓ ירוק = הצליח)

**Migration 2: 0001a_add_camp_column.sql**
- צפה בקובץ: `/supabase/migrations/0001a_add_camp_column.sql`
- העתק את כל התוכן
- דביק ב-SQL Editor החדש
- לחץ **"Run"**

**Migration 3: 0002_auth_rls.sql**
- צפה בקובץ: `/supabase/migrations/0002_auth_rls.sql`
- העתק את כל התוכן
- דביק ב-SQL Editor החדש
- לחץ **"Run"**

**Migration 4: 0003_seed_branches.sql**
- צפה בקובץ: `/supabase/migrations/0003_seed_branches.sql`
- העתק את כל התוכן
- דביק ב-SQL Editor החדש
- לחץ **"Run"**

✅ **אם הכל הצליח** - תראה ✓ ירוק בכל query

---

## שלב 3: קבלת Credentials (URL ו-API Key)

1. בעמוד ה-Project ב-Supabase, לחץ **"Settings"** (בעמודה שמאל, למעלה)
2. לחץ על **"API"** (בתת-תפריט)
3. בעמוד הAPI, תראה שני דברים:

**A) Project URL**
- חפש את השם "Project URL"
- זה יהיה משהו כמו: `https://xxxxxxxxxxxxx.supabase.co`
- **העתק את כל הקו**

**B) API Key**
- חפש "anon public"
- זה key ארוך (כ-100 תווים)
- **העתק גם זה**

---

## שלב 4: הוספת Credentials ל-Vercel

1. היכנס ל- https://vercel.com/dashboard
2. בחר את ה-project שלך (doch-1 או שם אחר)
3. לחץ **"Settings"** (בעמודה עליונה)
4. לחץ **"Environment Variables"** (בתפריט שמאל)
5. לחץ **"Add New"** (כפתור כחול)

**משתנה 1:**
- **Name**: `VITE_SUPABASE_URL`
- **Value**: דביק את ה-Project URL מ-Supabase
- **Environments**: בחר "Production" (default)
- לחץ **"Save"**

**משתנה 2:**
- לחץ **"Add New"** שוב
- **Name**: `VITE_SUPABASE_ANON_KEY`
- **Value**: דביק את ה-API Key מ-Supabase
- **Environments**: בחר "Production"
- לחץ **"Save"**

---

## שלב 5: Redeploy ב-Vercel

1. אחרי שהוספת את המשתנים, בחזור לעמוד ה-Project
2. לחץ **"Deployments"** (בעמודה עליונה)
3. בחר את ה-Deployment האחרון (בחלק העליון)
4. לחץ **"Redeploy"** (כפתור כחול בצד ימין)
5. המתן עד שה-deployment יסתיים (בדיקה בעמוד Deployments)

---

## שלב 6: בדיקה

1. היכנס לאפליקציה ב-Vercel (https://your-vercel-url.vercel.app/)
2. בחלק העליון (Header) תראה: **"מחובר לענן · סנכרון בזמן אמת"** ✅
3. עכשיו אתה יכול:
   - להתחבר עם email + password (עבור רכזים אמיתיים)
   - החמ"ל יכול להשתמש בקוד 1948 (עדיין עובד)

---

## בעיות נפוצות

**"לא מחובר לענן"**
- בדוק שהוספת את VITE_SUPABASE_URL ו-VITE_SUPABASE_ANON_KEY
- בדוק שאין רווחים בתחילה/סוף
- בדוק שעשית Redeploy

**Migration נכשל**
- בדוק שהעתקת את כל התוכן (כולל הערות)
- הריץ אחד אחד בסדר

**הכל נתקע?**
- בדוק את Logs ב-Vercel (Deployments → בחר deployment → Logs)
- בדוק את ה-Browser Console (F12 בדפדפן)

---

## סיכום

- ✅ Supabase Project יוקם
- ✅ טבלות יוקמו (branches, reports, profiles)
- ✅ RLS יעבוד (רכזים רואים רק שלהם)
- ✅ Realtime יפעל (סנכרון בזמן אמת)
- ✅ 100+ רכזים יוכלו לעבוד באותו זמן
