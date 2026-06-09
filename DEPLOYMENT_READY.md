# ✅ חמ"ל דיווחים — מוכן להפצה

## 📦 Status: PRODUCTION READY

כל הקוד, העיצוב, ההוראות וההגדרות מוכנים לשימוש.

---

## 🎯 3 שלבים כדי להתחיל

### 1. הקם Supabase (5 דקות)

```bash
# בSeupbase Dashboard (https://app.supabase.com):
1. בחר את הפרויקט
2. עבור ל- SQL Editor
3. הדבק את תוכן supabase/SETUP_ALL.sql
4. לחץ RUN
```

### 2. צור משתמשים (5 דקות)

בDashboard → Authentication → Users:
- `coordinator1@kibbutz.org` / `SecurePass123!` → הברנז"ל
- `coordinator2@kibbutz.org` / `SecurePass123!` → אביחיל  
- `coordinator3@kibbutz.org` / `SecurePass123!` → גן יאשיה
- `admin@kibbutz.org` / `AdminPass123!` → חמ"ל

ראה `SETUP_PRODUCTION.md` להוראות מפורטות.

### 3. העלה ל-Production (1 דקה)

```bash
git push origin main
```

GitHub Actions יפרוס אוטומטית ל-GitHub Pages.

---

## 📊 תכונות שנוכחות

✅ **דיווחים מלאים**
- סלוטים: בוקר (לפני 12:00) / ערב (12:00+)
- דדליינים: 08:00 בוקר, 20:00 ערב
- נוכחות לפי שכבה
- הערות טקסט

✅ **לוח חמ"ל**
- תמונת מצב חיה של כל הסניפים
- השוואות בין סלוטים (בוקר↔ערב)
- רמות סיכון: תקין, תשומת לב, קריטי
- ייצוא CSV

✅ **עיצוב**
- Premium dark theme (zinc + ירוק חקלאי)
- RTL עברית מלאה
- ניידות: מובילים, טאבלטים, שולחנות
- 32KB gzip — מהיר מאד

✅ **אבטחה**
- RLS policies: רכז רואה רק את הסניף שלו
- אימות אמיתי עם Supabase Auth
- סיסמאות בטוחות בשרת

---

## 📁 Files Important

| File | Purpose |
|------|---------|
| `.env.local` | Supabase credentials |
| `SETUP_PRODUCTION.md` | שלב-אחר-שלב הגדרה |
| `supabase/SETUP_ALL.sql` | Schema + RLS |
| `.github/workflows/deploy.yml` | Automatic deployment |

---

## 🌐 URLs

| Environment | URL |
|---|---|
| Development | http://localhost:5173 (אחרי `npm run dev`) |
| Production | https://yonatanbrandes59.github.io/doch-1/ |
| Supabase | https://rkbqpkahtqbnbqmpvdxd.supabase.co |

---

## 💡 Support

- בעיות Supabase? ראה `SETUP_PRODUCTION.md` troubleshooting
- בעיות Code? בדוק `npm run typecheck && npm run lint`
- בעיות Deploy? בדוק GitHub Actions

---

## ✨ המה הבא

- הוסף more branches לפי הצורך
- אפשר custom logo (קובץ: `public/logo.svg`)
- אפשר whitelist emails (מצב פיתוח → קוד הרשמה)

---

**זה הכל! מוכן להשקה!** 🚀
