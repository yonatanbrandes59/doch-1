# 🚀 הקמת חמ"ל דיווחים - גדולים

## שלב 1: Supabase בענן ✅ (כבר מוגדר)

URL: https://rkbqpkahtqbnbqmpvdxd.supabase.co
Key: `sb_publishable_KA5w7V0luQChlAo_ss2xUQ_-N5xvcYF`

כל זה בקובץ `.env.local`

---

## שלב 2: יצירת משתמשים בSupabase Dashboard

### יצור משתמשי בדיקה:

1. פתח: https://app.supabase.com
2. בחר את הפרויקט שלך
3. עבור ל- **Authentication** → **Users**
4. לחץ **Add user** וליצור 4 משתמשים:

#### משתמש 1 - רכז
- **Email**: coordinator1@kibbutz.org
- **Password**: SecurePass123!
- לאחר יצירה, עדכן את הטבלה `profiles`:
  ```sql
  INSERT INTO profiles (id, role, name, branch_id)
  SELECT u.id, 'coordinator', 'רמי כהן', b.id
  FROM auth.users u, branches b
  WHERE u.email = 'coordinator1@kibbutz.org' AND b.name = 'חובב'
  LIMIT 1;
  ```

#### משתמש 2 - רכז
- **Email**: coordinator2@kibbutz.org
- **Password**: SecurePass123!
- קשור לסניף "גנץ"

#### משתמש 3 - רכז
- **Email**: coordinator3@kibbutz.org
- **Password**: SecurePass123!
- קשור לסניף "תל יצחק"

#### משתמש 4 - חמ"ל (אדמין)
- **Email**: admin@kibbutz.org
- **Password**: AdminPass123!
- תפקיד: `haml` (אין סניף ספציפי)

---

## שלב 3: הפעל את האפליקציה

```bash
npm run dev
```

פתח: http://localhost:5173

---

## שלב 4: בדוק את הזרימות

### כרכז:
1. בחר "רכז סניף"
2. הכנס: `coordinator1@kibbutz.org` / `SecurePass123!`
3. יצא דוח עם נוכחות והערות
4. בדוק שהדוח מופיע בלוח האחרונים

### חמ"ל:
1. בחר "חמ"ל"
2. הכנס: `admin@kibbutz.org` / `AdminPass123!`
3. בדוק שאתה רואה את כל הסניפים
4. בדוק את הדוחות מכל הרכזים
5. ייצא CSV

---

## 🛡️ RLS Security (כבר מוגדר)

- **רכזים** רואים רק את הסניף שלהם
- **חמ"ל** רואה הכל
- לא ניתן לעקוף דרך הלקוח

---

## 📦 הפצה ל-Production

```bash
git push origin main
```

GitHub Actions יפרוס אוטומטית ל:
https://yonatanbrandes59.github.io/doch-1/

---

## 🆘 בעיות נפוצות

**שגיאה: "Database connection failed"**
- וודא ש-.env.local עם הנתונים הנכונים
- בדוק אם Supabase Project חי

**חמ"ל לא רואה דיווחים**
- וודא שהרכזים שידרו בעוד שחמ"ל מחובר
- Realtime עלול להיות מושבת - חדש את הדף

**RLS דחה את השאילתה**
- זה בעדכון! RLS מגן עלינו
- בדוק שהמשתמש יש profile עם role ו-branch_id

---

## 📞 Support

צור issue ב-GitHub עם:
- Error message
- Browser console logs
- Supabase Logs (Dashboard → Logs)

