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
2. ב-**SQL Editor** הדבק והרץ את `supabase/migrations/0001_init.sql`.
3. העתק `.env.example` ל-`.env` ומלא:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   VITE_HAML_CODE=1948
   ```
4. `npm run dev` (או `npm run build` לפריסה). המערכת תזהה אוטומטית את Supabase
   ותעבור לסנכרון אמת — **ללא שינוי קוד**.

> **אבטחה לפרודקשן:** הזרימה הנוכחית מבוססת קוד-גישה ו-RLS פתוח (anon).
> לפריסה רחבה מומלץ לעבור ל-Supabase Auth ולהדק את ה-policies לפי `auth.uid()`.
> שכבת האחסון מבודדת (`src/lib/storage/`) כך שהשינוי ממוקד.

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
