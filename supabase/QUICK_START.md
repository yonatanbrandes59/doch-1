# הקמה מהירה - 5 דקות

## מה זה

מערכת דיווחים בזמן אמת לתנועת הנוער של האיחוד החקלאי, מחוברת ל-Supabase.

## דרישות

- Supabase account (חינם): https://supabase.com
- Node.js + npm (כבר מותקן)
- Python 3 (כדי להריץ את setup_users.py)

## דקות 0-1: SQL Setup

1. פתח https://supabase.com/dashboard
2. בחר Project `doch-1` (או צור חדש)
3. בחר **SQL Editor**
4. העתק את כל קוד `supabase/SETUP_ALL.sql`
5. הדבק לSQL Editor
6. לחץ **Run** ✅

## דקות 1-3: יצירת משתמשים

```bash
# בfolder הפרויקט
cd supabase

# התקן dependency אם צריך
pip install supabase

# הרץ setup
python3 setup_users.py

# פלט:
# ✓ משתמש coordinator1@doch.local נוצר
# ✓ משתמש coordinator2@doch.local נוצר
# ✓ משתמש coordinator3@doch.local נוצר
# ✓ משתמש admin@doch.local נוצר
```

פרטים שמורים ב- `test-users.txt`

## דקות 3-5: הרץ את התפוקה

```bash
# בroot folder
npm run dev

# פתח http://localhost:5173 בדפדפן
```

## בדיקה

```
כ-רכז:
- אימייל: coordinator1@doch.local
- סיסמה: Test@12345
- תראה: טופס דיווח עבור הברנז"ל בלבד

כ-מנהל:
- אימייל: admin@doch.local
- סיסמה: Test@12345
- תראה: Dashboard עם כל הדיווחים
```

## טבלה בדיקה מהירה

| שלב | פעולה | בדיקה |
|-----|--------|--------|
| ✓ 1 | SQL setup בDashboard | טבלות קיימות |
| ✓ 2 | python3 setup_users.py | 4 משתמשים נוצרו |
| ✓ 3 | npm run dev | אפליקציה רצה ב-localhost:5173 |
| ✓ 4 | התחברות כ-coordinator1 | ניתן להגיש דיווח |
| ✓ 5 | התחברות כ-admin | ניתן לראות את כל הדיווחים |

## סיום

✅ מערכת מוכנה!

צעדים הבאים:
- ראה `TEST_GUIDE.md` לבדיקה מלאה
- ראה `SETUP_MANUAL.md` להנחיות מפורטות
- ראה `README.md` לרקע טכני

