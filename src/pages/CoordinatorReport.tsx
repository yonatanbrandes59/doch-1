import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Send, Sun, Moon } from 'lucide-react';
import { Header } from '@/components/Header';
import { ReportComparison } from '@/components/BranchHistory';
import { useAuth } from '@/store/useAuth';
import { useData } from '@/store/useData';
import { CAMP_META, REPORT_SLOT_META } from '@/types';
import { timeAgo } from '@/lib/utils';
import { getReportSlot, getReportDate, getDeadlineAt } from '@/lib/reportUtils';
import { storage } from '@/lib/storage';

export default function CoordinatorReport() {
  const { session } = useAuth();
  const { branches, reports, campPhase, addReport, init } = useData();

  const [attendance, setAttendance] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => init(), [init]);

  // עדכון הזמן כל דקה (לעדכון תצוגת הסלוט/דד-ליין)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const currentSlot = getReportSlot(now.toISOString());
  const slotMeta = REPORT_SLOT_META[currentSlot];
  const todayStr = getReportDate(now.toISOString());
  const deadline = getDeadlineAt(todayStr, currentSlot);
  const isPastDeadline = now > deadline;

  const grades = CAMP_META[campPhase].grades;

  const totalHeadcount = useMemo(
    () => grades.reduce((sum, g) => sum + (Number(attendance[g]) || 0), 0),
    [grades, attendance],
  );

  const branch = useMemo(
    () => branches.find((b) => b.id === session?.branchId),
    [branches, session?.branchId],
  );

  const myReports = useMemo(
    () => reports.filter((r) => r.branchId === session?.branchId).slice(0, 5),
    [reports, session?.branchId],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.branchId || !session.name) return;
    setSending(true);
    try {
      // נוכחות לפי שכבה — רק שכבות שמולאו.
      const attendanceMap: Record<string, number> = {};
      for (const g of grades) {
        const v = Number(attendance[g]);
        if (attendance[g]?.trim() !== '' && !Number.isNaN(v)) attendanceMap[g] = v;
      }
      const hasAttendance = Object.keys(attendanceMap).length > 0;
      await addReport({
        branchId: session.branchId,
        coordinatorName: session.name,
        headcount: hasAttendance ? totalHeadcount : null,
        campPhase,
        attendance: hasAttendance ? attendanceMap : undefined,
        message: message.trim(),
      });
      setMessage('');
      setAttendance({});
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2500);
    } finally {
      setSending(false);
    }
  };

  const SlotIcon = currentSlot === 'morning' ? Sun : Moon;

  return (
    <div className="min-h-screen">
      {/* באנר דמו */}
      {storage.mode === 'local' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300">
          מצב דמו הנתונים נשמרים רק בדפדפן זה
        </div>
      )}
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <h2 className="text-2xl font-bold">דוח 1</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-600/20 border border-brand-500/30 px-3 py-1 text-sm font-semibold text-brand-300">
              <SlotIcon size={14} />
              {slotMeta.emoji} דוח {slotMeta.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            סניף <span className="font-medium text-slate-200">{branch?.name ?? '—'}</span>
            {branch && (
              <>
                <span className="text-slate-500"> · {branch.camp || branch.region}</span>
                {session?.name && <span className="text-slate-500"> · {session.name}</span>}
              </>
            )}
          </p>
          <p className={`mt-1.5 text-xs font-medium ${isPastDeadline ? 'text-red-400' : 'text-amber-400'}`}>
            {isPastDeadline
              ? `⚠️ הדד-ליין עבר — יש לשלוח בהקדם (היה עד ${slotMeta.deadline})`
              : `יש להגיש עד ${slotMeta.deadline}`}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-5 p-6 animate-fade-in">
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="label mb-0">
                נוכחות לפי שכבה — {CAMP_META[campPhase].label}
              </label>
              <span className="text-sm text-slate-400">
                סה"כ: <span className="font-semibold text-slate-200 tabular-nums">{totalHeadcount}</span>
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {grades.map((g) => (
                <div key={g}>
                  <label className="mb-1 block text-center text-xs text-slate-400">שכבה {g}</label>
                  <input
                    className="input text-center"
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={attendance[g] ?? ''}
                    onChange={(e) => setAttendance((prev) => ({ ...prev, [g]: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="label">הערות / פירוט</label>
            <textarea
              className="input min-h-[100px] resize-y"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="פרט/י את המצב, אירועים חריגים, צרכים…"
            />
          </div>

          <button type="submit" className="btn-primary w-full" disabled={sending}>
            {justSent ? (
              <>
                <CheckCircle2 size={18} /> דוח {slotMeta.emoji} {slotMeta.label} נשלח בהצלחה
              </>
            ) : (
              <>
                <Send size={18} /> {sending ? 'שולח…' : `שליחת דוח ${slotMeta.label}`}
              </>
            )}
          </button>
        </form>

        {myReports.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Clock size={16} /> הדיווחים האחרונים שלי
            </h3>

            {/* השוואה בין שני הדיווחים האחרונים */}
            {myReports.length >= 2 && (
              <ReportComparison current={myReports[0]} previous={myReports[1]} />
            )}

            <ul className="space-y-2 mt-3">
              {myReports.map((r) => {
                const rSlot = getReportSlot(r.createdAt);
                const rSlotMeta = REPORT_SLOT_META[rSlot];
                return (
                  <li key={r.id} className="card flex items-start justify-between gap-3 p-3.5 animate-fade-in">
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-xs font-medium text-slate-400">
                          {rSlotMeta.emoji} דוח {rSlotMeta.label}
                        </span>
                      </div>
                      {(r.headcount != null || r.message) && (
                        <div className="space-y-1.5">
                          {r.headcount != null && (
                            <p className="text-xs text-slate-400">נוכחות: {r.headcount}</p>
                          )}
                          {r.message && <p className="break-words text-sm text-slate-300">{r.message}</p>}
                        </div>
                      )}
                    </div>
                    <time className="shrink-0 text-xs text-slate-500">{timeAgo(r.createdAt)}</time>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
