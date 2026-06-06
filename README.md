# חמ"ל דיווחים — תנועת הנוער של האיחוד החקלאי

מערכת דיווח סטטוס סניפים בזמן אמת. רכזי הסניפים מדווחים מצב, נוכחות והערות;
החמ"ל רואה תמונת מצב חיה של כלל הסניפים, עם סינון, גרפים וייצוא.

בנוי ב-**React + TypeScript + Vite + TailwindCSS**, עם שכבת אחסון מתחלפת:
**localStorage** לפיתוח/דמו ו-**Supabase** לסנכרון אמיתי בין כל הרכזים.

---

## הפעלה מהירה (מצב מקומי)

```bash
npm install
npm run dev
```

הדפדפן ייפתח בכתובת `http://localhost:5173`. במצב הזה הנתונים נשמרים ב-localStorage
של הדפדפן (סנכרון בין טאבים באותו מחשב בלבד) — מצוין לבדיקה והדגמה.

### כניסה
- **רכז סניף:** שם + בחירת סניף.
- **חמ"ל:** קוד גישה. ברירת מחדל **`1948`** (ניתן לשינוי דרך `VITE_HAML_CODE`).

---

## מעבר לפרודקשן עם Supabase (סנכרון 100+ רכזים)

1. צור פרויקט ב-[supabase.com](https://supabase.com).
2. ב-**SQL Editor** הרץ לפי הסדר את `supabase/migrations/0001_init.sql` ואז
   `supabase/migrations/0002_auth_rls.sql`.
3. העתק `.env.example` ל-`.env` ומלא את `VITE_SUPABASE_URL` ו-`VITE_SUPABASE_ANON_KEY`.
4. **צור משתמשים** ב-Authentication → Users, ושייך לכל אחד פרופיל (תפקיד + סניף)
   בטבלת `profiles` — ראה דוגמת ה-`insert` בסוף `0002_auth_rls.sql`.
5. `npm run dev` (או `npm run build`). המערכת מזהה את Supabase אוטומטית, עוברת
   לסנכרון אמת ולמסך התחברות אימייל/סיסמה — **ללא שינוי קוד**.

### אבטחה והגנת פרט (פרודקשן)
- **אימות אמיתי:** Supabase Auth (אימייל+סיסמה). התפקיד והסניף נקבעים מטבלת `profiles`.
- **RLS לפי תפקיד וסניף:** רכז קורא/כותב רק את הסניף שלו; חמ"ל רואה הכל. נאכף
  במסד הנתונים (`0002_auth_rls.sql`), לא בצד הלקוח.
- **מזעור מידע:** נאספים שם, סניף, סטטוס, נוכחות והערות בלבד.
- **הגבלת שמירה:** הפונקציה `delete_old_reports(days)` מוחקת דיווחים ישנים
  (ברירת מחדל 180 יום); ניתן לתזמן עם pg_cron.
- **מדיניות פרטיות:** מוצגת במסך הכניסה ובמסלול `/privacy`.

> מצב מקומי (ללא Supabase) משתמש בקוד-גישה ו-localStorage — לפיתוח/דמו בלבד,
> אינו מיועד לאחסון מידע אישי אמיתי.

---

## פריסה (Vercel)

הפרויקט כולל `vercel.json`. חבר את הריפו ל-Vercel, הגדר את משתני הסביבה
(`VITE_*`) ב-Project Settings, ופרוס. ה-`build` מריץ `tsc` + `vite build`.

---

## מבנה הפרויקט

```
src/
  lib/
    config.ts            תצורת סביבה מרוכזת
    supabase.ts          לקוח Supabase (null במצב מקומי)
    utils.ts             עזרי תאריך, CSV, מחלקות
    storage/
      types.ts           חוזה שכבת האחסון (StorageAdapter)
      localAdapter.ts    מימוש localStorage + סנכרון בין-טאבים
      supabaseAdapter.ts מימוש Supabase + Realtime
      index.ts           בחירת המימוש לפי הסביבה
  store/
    useAuth.ts           ניהול הזדהות (zustand, נשמר)
    useData.ts           נתונים + הרשמה ל-realtime
  components/            Header, Logo, StatusBadge, StatCard
  pages/
    Login.tsx            כניסת רכז / חמ"ל
    CoordinatorReport.tsx טופס דיווח לרכז
    HamlDashboard.tsx    לוח הבקרה של החמ"ל
    BranchesAdmin.tsx    ניהול סניפים
  App.tsx                ניתוב + הגנת מסלולים
supabase/migrations/     סכמת ה-DB
```

### החלפת שכבת האחסון
כל הלוגיקה מדברת מול הממשק `StorageAdapter` בלבד. כדי להוסיף מקור נתונים אחר
(Firebase, REST משלך) — מממשים את אותו ממשק ומחברים ב-`storage/index.ts`.
שאר הקוד לא נוגע.

---

## הסמל

הקומפוננטה `Logo` טוענת אוטומטית את `public/logo.png` אם הוא קיים, ואחרת נופלת
לאמבלם המעוצב `public/logo.svg`. **להצגת הסמל הרשמי:** שים את קובץ הלוגו בשם
`logo.png` בתיקיית `public/`.

---

## פקודות

| פקודה | פעולה |
|-------|-------|
| `npm run dev` | שרת פיתוח |
| `npm run build` | בנייה לפרודקשן |
| `npm run preview` | תצוגה מקדימה של ה-build |
| `npm run lint` | בדיקת ESLint |
| `npm run typecheck` | בדיקת טיפוסים |
