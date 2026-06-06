import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900">
      <main className="mx-auto max-w-2xl px-4 py-10">
        <Link to="/" className="btn-ghost mb-6">
          <ArrowRight size={18} /> חזרה
        </Link>

        <div className="card p-7 animate-fade-in">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-blue-600/20 text-blue-400">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold">מדיניות פרטיות</h1>
              <p className="text-sm text-slate-400">חמ"ל דיווחים — תנועת הנוער של האיחוד החקלאי</p>
            </div>
          </div>

          <div className="space-y-5 text-sm leading-relaxed text-slate-300">
            <Section title="איזה מידע נאסף">
              שם הרכז המדווח, שיוך הסניף, סטטוס הסניף, מספר נוכחים (אופציונלי), הערות
              חופשיות ומועד הדיווח. אין איסוף של מספרי טלפון, כתובות או מספרי זהות.
            </Section>

            <Section title="מטרת השימוש">
              המידע משמש אך ורק לניהול תמונת מצב תפעולית של הסניפים עבור צוות החמ"ל.
              הוא אינו מועבר לצד שלישי ואינו משמש לשיווק.
            </Section>

            <Section title="מי נחשף למידע">
              רכז רואה אך ורק את הדיווחים של הסניף שלו. צוות החמ"ל רואה את כלל הדיווחים
              לצורך מילוי תפקידו. ההפרדה נאכפת ברמת מסד הנתונים (Row Level Security).
            </Section>

            <Section title="אבטחה">
              הגישה מותנית בהתחברות מאומתת. התעבורה מוצפנת (HTTPS). ההרשאות מבוססות
              תפקיד וסניף, כך שאין גישה רוחבית למידע שאינו רלוונטי למשתמש.
            </Section>

            <Section title="שמירת מידע">
              דיווחים נשמרים לפרק זמן תפעולי בלבד ונמחקים אוטומטית לאחר תקופת שמירה
              מוגדרת (ברירת מחדל 180 יום).
            </Section>

            <Section title="זכויותיך">
              לפי חוק הגנת הפרטיות, באפשרותך לפנות למנהל המערכת לעיון במידע אודותיך,
              לתיקונו או למחיקתו.
            </Section>
          </div>
        </div>
      </main>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-1 font-semibold text-slate-100">{title}</h2>
      <p>{children}</p>
    </section>
  );
}
