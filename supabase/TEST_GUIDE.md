# מדריך בדיקה מלא - חמ"ל דיווחים

## סקירה

קובץ זה מתאר כיצד לבדוק את מערכת חמ"ל דיווחים כדי לוודא שהקמת Supabase הצליחה.

## סוגי בדיקות

### 1. בדיקת התחברות (Authentication)

#### 1.1 התחברות כ-רכז (Coordinator)

**צעדים:**
1. פתח http://localhost:5173
2. בחר **התחברות** או רד לדף התחברות
3. הזן:
   - אימייל: `coordinator1@doch.local`
   - סיסמה: `Test@12345`
4. לחץ **התחברות**

**תוצאה צפויה:**
- ✅ התחברות מוצלחת
- ✅ מופיע שם "הברנז"ל" בטופס/ממשק
- ✅ ניתן לראות טופס הגשת דיווח
- ❌ לא מופיע ה-dashboard של חמ"ל

**בדיקת RLS:**
- בעלת הדפדפן, פתח את **Console** (F12)
- הרץ:
  ```javascript
  // בדוק שאתה יכול לקרוא רק את סניף הברנז"ל
  const { data } = await supabase
    .from('reports')
    .select('*');
  console.log(data); // יראה רק דיווחים של הברנז"ל
  ```

#### 1.2 התחברות כ-מנהל (HAML)

**צעדים:**
1. התחבר כ-`admin@doch.local` / `Test@12345`
2. או כל הגשה בחזרה בעמוד הירחון

**תוצאה צפויה:**
- ✅ התחברות מוצלחת
- ✅ מופיע ה-dashboard עם כל הדיווחים
- ✅ ניתן לנתח נוכחות וצפות בגרפים
- ✅ ניתן לייצא CSV

**בדיקת RLS:**
- הרץ באותו באופן, יראה דיווחים מכל הסניפים

#### 1.3 בדיקת ניתוק

**צעדים:**
1. לחץ **התנתק** בממשק
2. נסה להכנס שוב עם אימייל כשונה

**תוצאה צפויה:**
- ✅ ניתוק מוצלח
- ✅ חזרה לדף התחברות/כניסה

---

### 2. בדיקת RLS (Row Level Security)

#### 2.1 בדיקה שרכז רואה רק את סניפו

**דרך SQL (Supabase Dashboard):**

1. פתח https://supabase.com/dashboard
2. בחר Project `doch-1`
3. עבור ל-**SQL Editor**
4. בדוק כמה דיווחים יש:
   ```sql
   SELECT COUNT(*) FROM public.reports;
   ```
5. כעת, בדוק ש-coordinator רואה רק שלו:
   ```sql
   -- בתור מעריץ (Admin)
   SELECT COUNT(*) FROM public.reports 
   WHERE branch_id = (SELECT id FROM public.branches WHERE name = 'הברנז"ל' LIMIT 1);
   ```

**דרך הממשק:**
1. התחבר כ-`coordinator1@doch.local`
2. בטופס ההגשה, בדוק שרק **הברנז"ל** מופיע כ-סניף (אין רשימה הנפתחת אחרת)
3. הגש דיווח

#### 2.2 בדיקה שחמ"ל רואה הכל

**דרך SQL:**
```sql
-- כשאתה מחובר כ-admin
SELECT id, branch_id, coordinator_name FROM public.reports ORDER BY created_at DESC LIMIT 5;
```

יראה דיווחים מכל הסניפים.

**דרך הממשק:**
1. התחבר כ-`admin@doch.local`
2. ה-dashboard יציג כל הדיווחים מכל הסניפים
3. ניתן לסנן ולנתח לפי סניף

---

### 3. בדיקת הגשת דיווח (Create Report)

#### 3.1 הגשה כ-רכז

**צעדים:**
1. התחבר כ-`coordinator1@doch.local`
2. מלא טופס עם:
   - **סניף**: הברנז"ל (ברירת מחדל)
   - **שם הרכז**: אני
   - **מספר נוכחים**: 25
   - **הערה**: בדיקה - הכל תקין
3. לחץ **הגש דיווח**

**תוצאה צפויה:**
- ✅ הודעת הצלחה
- ✅ הדיווח מופיע ב-database
- ✅ בקרות רכזים נוספים אינם יכולים לראות אותו (רק הברנז"ל)

#### 3.2 בדיקה שדיווח שמור ב-DB

**בודק SQL:**
```sql
SELECT id, branch_id, coordinator_name, headcount, message, created_at
FROM public.reports
WHERE coordinator_name = 'אני'
LIMIT 1;
```

תראה את הדיווח שהוגש.

---

### 4. בדיקת Dashboard וניתוח

#### 4.1 צפייה בדיווחים

**צעדים:**
1. התחבר כ-`admin@doch.local`
2. פתח את ה-dashboard
3. בדוק שמופיעים כל הדיווחים שהוגשו

**תוצאה צפויה:**
- ✅ רשימת דיווחים עם:
  - שם סניף
  - שם רכז
  - מספר נוכחים
  - זמן הגשה
  - הערה

#### 4.2 ניתוח וגרפים

**צעדים:**
1. פתח את קטע ה-**ניתוח** או **Dashboard**
2. בדוק שמופיעים גרפים של:
   - נוכחות לפי סניף
   - מגמות לאורך זמן
   - השוואה בין סלוטים

#### 4.3 ייצוא CSV

**צעדים:**
1. כשאתה בדאש-בורד, חפש כפתור **ייצוא** או **CSV**
2. לחץ עליו

**תוצאה צפויה:**
- ✅ קובץ CSV מוריד
- ✅ פתח בـ Excel/Sheets וודא שיש נתונים

---

### 5. בדיקת Realtime (עדכון בזמן אמת)

#### 5.1 עדכון ממחשב שני

**צעדים:**
1. פתח 2 טאבים של http://localhost:5173
2. בטאב 1: התחבר כ-`admin@doch.local`
3. בטאב 2: התחבר כ-`coordinator2@doch.local`
4. בטאב 2: הגש דיווח חדש
5. בטאב 1: בדוק שהדיווח החדש מופיע מיד (ללא Refresh)

**תוצאה צפויה:**
- ✅ הדיווח מופיע בטאב 1 מיד
- ✅ Realtime עובד

---

### 6. בדיקת סניפים

#### 6.1 בדיקה שסניפים קיימים

**דרך SQL:**
```sql
SELECT id, name, region, camp FROM public.branches LIMIT 10;
```

תראה:
- הברנז"ל
- אביחיל
- גן יאשיה

#### 6.2 בדיקה שרכז רואה הסניף שלו בלבד

**צעדים:**
1. התחבר כ-`coordinator1@doch.local`
2. בטופס הגשה, בדוק רשימה נפתחת של סניפים

**תוצאה צפויה:**
- ✅ רק "הברנז"ל" זמין (לא בחירה)
- ❌ אביחיל וגן יאשיה אינם מופיעים

---

## בדיקות שגיאה (Error Cases)

### 7.1 התחברות עם סיסמה שגויה

**צעדים:**
1. נסה להתחבר כ-`coordinator1@doch.local` / `wrong-password`

**תוצאה צפויה:**
- ✅ הודעת שגיאה: "אימייל או סיסמה שגויים"
- ❌ הכניסה לא מתבצעת

### 7.2 ניסיון גישה לנתונים של סניף אחר

**צעדים:**
1. התחבר כ-`coordinator1@doch.local`
2. פתח Console (F12)
3. נסה:
   ```javascript
   const { data, error } = await supabase
     .from('reports')
     .select('*')
     .eq('branch_id', 'ID-של-אביחיל'); // החלף עם ID בפועל
   console.log(error); // יראה "permission denied"
   ```

**תוצאה צפויה:**
- ✅ שגיאה: "permission denied" או דומה

### 7.3 רכז מנסה לכתוב דיווח עבור סניף אחר

**דרך SQL:**
```sql
-- בתור coordinator1, נסה לכתוב דיווח לאביחיל
INSERT INTO public.reports (branch_id, coordinator_name, headcount, message)
SELECT id, 'fake', 1, 'test' FROM public.branches WHERE name = 'אביחיל' LIMIT 1;
-- תוצאה: שגיאה RLS
```

**תוצאה צפויה:**
- ✅ שגיאה RLS: "new row violates row-level security policy"

---

## טבלת בדיקה מלאה

| מספר | בדיקה | משתמש | תוצאה צפויה | סטטוס |
|------|-------|--------|------------|--------|
| 1 | התחברות | coordinator1 | הצלחה | ☐ |
| 2 | התחברות | admin | הצלחה | ☐ |
| 3 | RLS - רכז רואה רק שלו | coordinator1 | 1 דיווח מהברנז"ל | ☐ |
| 4 | RLS - חמ"ל רואה הכל | admin | 3+ דיווחים | ☐ |
| 5 | הגשת דיווח | coordinator1 | הצלחה, שמור ב-DB | ☐ |
| 6 | Dashboard | admin | כל הדיווחים בתצוגה | ☐ |
| 7 | ניתוח גרפי | admin | גרפים עם נתונים | ☐ |
| 8 | CSV Export | admin | קובץ CSV מוריד | ☐ |
| 9 | Realtime | admin + coordinator | עדכון מיידי | ☐ |
| 10 | שגיאה בסיסמה | coordinator1 | הודעת שגיאה | ☐ |
| 11 | סיסוס אחד מסניף אחר | coordinator1 | permission denied | ☐ |

---

## פתרון בעיות

### ❌ "Host not in allowlist"
- **בעיה**: API REST מנעה גישה מחוץ ל-Supabase network
- **פתרון**: בודק מ-localhost בלבד, או עדכן CORS בהגדרות Supabase

### ❌ "User not found" בהתחברות
- **בעיה**: משתמש לא נוצר או סיסמה שגויה
- **פתרון**: הרץ `python3 setup_users.py` שוב

### ❌ "RLS policy violation"
- **בעיה**: RLS מונע כתיבה/קריאה
- **פתרון**: בדוק שיש פרופיל עם branch_id נכון, או הרץ SQL setup שוב

### ❌ Realtime לא מעדכן
- **בעיה**: Realtime אינו הופעל בטבלות
- **פתרון**: בדוק שה-SQL setup רץ בהצלחה, וודא:
  ```sql
  SELECT * FROM pg_publication_tables WHERE pubname = 'supabase_realtime';
  ```

---

## סיכום

כשכל הבדיקות עברו בהצלחה:

✅ SQL setup הורץ בהצלחה  
✅ משתמשים נוצרו  
✅ RLS מוגן  
✅ דיווחים עובדים  
✅ Dashboard עובד  
✅ Realtime עובד  

**המערכת מוכנה לפרודקשן!**

