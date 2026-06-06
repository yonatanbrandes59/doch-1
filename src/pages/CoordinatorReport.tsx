import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Clock, Send } from 'lucide-react';
import { Header } from '@/components/Header';
import { StatusBadge } from '@/components/StatusBadge';
import { useAuth } from '@/store/useAuth';
import { useData } from '@/store/useData';
import { STATUS_META, STATUS_ORDER, type BranchStatus } from '@/types';
import { cx, timeAgo } from '@/lib/utils';

export default function CoordinatorReport() {
  const { session } = useAuth();
  const { branches, reports, addReport, init } = useData();

  const [status, setStatus] = useState<BranchStatus>('ok');
  const [headcount, setHeadcount] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [justSent, setJustSent] = useState(false);

  useEffect(() => init(), [init]);

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
      await addReport({
        branchId: session.branchId,
        coordinatorName: session.name,
        status,
        headcount: headcount.trim() === '' ? null : Number(headcount),
        message: message.trim(),
      });
      setMessage('');
      setHeadcount('');
      setJustSent(true);
      setTimeout(() => setJustSent(false), 2500);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-6">
        <div className="mb-5">
          <h2 className="text-xl font-bold">דיווח סטטוס</h2>
          <p className="text-sm text-slate-400">
            סניף <span className="font-medium text-slate-200">{branch?.name ?? '—'}</span>
            {branch && <span className="text-slate-500"> · {branch.region}</span>}
          </p>
        </div>

        <form onSubmit={submit} className="card space-y-5 p-6 animate-fade-in">
          <div>
            <label className="label">מצב הסניף</label>
            <div className="grid grid-cols-3 gap-2">
              {STATUS_ORDER.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={cx(
                    'rounded-xl border px-3 py-3 text-sm font-medium transition-all',
                    status === s
                      ? STATUS_META[s].color + ' ring-2 ring-offset-2 ring-offset-slate-900 ' + STATUS_META[s].dot.replace('bg-', 'ring-')
                      : 'border-slate-700 bg-slate-800/50 text-slate-400 hover:bg-slate-800',
                  )}
                >
                  <span className={cx('mx-auto mb-1.5 block h-2.5 w-2.5 rounded-full', STATUS_META[s].dot)} />
                  {STATUS_META[s].label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">נוכחות (מספר אנשים) — אופציונלי</label>
            <input
              className="input"
              type="number"
              min={0}
              value={headcount}
              onChange={(e) => setHeadcount(e.target.value)}
              placeholder="לדוגמה: 42"
            />
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
                <CheckCircle2 size={18} /> נשלח בהצלחה
              </>
            ) : (
              <>
                <Send size={18} /> {sending ? 'שולח…' : 'שליחת דיווח'}
              </>
            )}
          </button>
        </form>

        {myReports.length > 0 && (
          <section className="mt-8">
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-400">
              <Clock size={16} /> הדיווחים האחרונים שלי
            </h3>
            <ul className="space-y-2">
              {myReports.map((r) => (
                <li key={r.id} className="card flex items-start justify-between gap-3 p-3.5 animate-fade-in">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={r.status} />
                      {r.headcount != null && (
                        <span className="text-xs text-slate-400">נוכחות: {r.headcount}</span>
                      )}
                    </div>
                    {r.message && <p className="mt-1.5 break-words text-sm text-slate-300">{r.message}</p>}
                  </div>
                  <time className="shrink-0 text-xs text-slate-500">{timeAgo(r.createdAt)}</time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
