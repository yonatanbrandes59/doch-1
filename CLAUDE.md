# CLAUDE.md

הקשר לשימוש Claude Code בפרויקט הזה.

## מה זה
מערכת **חמ"ל דיווחים** לתנועת הנוער של האיחוד החקלאי. רכזי סניפים מדווחים
סטטוס (תקין / דורש תשומת לב / חירום), נוכחות והערות. החמ"ל רואה תמונת מצב
חיה, מסנן, מנתח בגרפים ומייצא CSV.

## סטאק
- React 18 + TypeScript + Vite
- TailwindCSS (RTL, עברית, ערכת נושא כהה)
- Zustand (state), React Router (ניתוב), Recharts (גרפים), lucide-react (אייקונים)
- אחסון מתחלף: localStorage (דמו) או Supabase (פרודקשן, Realtime)

## עקרון מפתח: שכבת אחסון מבודדת
כל גישה לנתונים עוברת דרך הממשק `StorageAdapter` (`src/lib/storage/types.ts`).
שני מימושים: `LocalAdapter` ו-`SupabaseAdapter`. הבחירה ב-`src/lib/storage/index.ts`
לפי קיום משתני `VITE_SUPABASE_*`. **אין לגשת ל-localStorage או ל-supabase ישירות
מחוץ לשכבה הזו.**

## מוסכמות
- כל המחרוזות בעברית, ממשק RTL.
- טיפוסי דומיין ב-`src/types.ts` (`Branch`, `Report`, `BranchStatus`, `Session`).
- DB ב-snake_case, אפליקציה ב-camelCase. ההמרה ב-`supabaseAdapter.ts`.
- מחלקות Tailwind משותפות (`card`, `btn-*`, `input`, `label`) ב-`src/index.css`.
- alias `@/` → `src/`.

## פקודות
- `npm run dev` — פיתוח
- `npm run build` — בנייה (כולל `tsc -b`)
- `npm run lint` / `npm run typecheck` — בדיקות (חייבות לעבור לפני commit)

## ברירות מחדל
- קוד חמ"ל: `1948` (משתנה `VITE_HAML_CODE`).
- ללא `.env` → מצב מקומי עם סניפי דמו.

## כשמוסיפים פיצ'ר
1. אם נדרש שדה נתונים חדש — עדכן `src/types.ts`, את שני ה-adapters, ואת
   מיגרציית ה-SQL (`supabase/migrations/`).
2. שמור על הפרדת השכבות. UI מדבר עם `store/`, ה-store מדבר עם `storage/`.
3. ודא `npm run typecheck && npm run lint && npm run build` עוברים.
