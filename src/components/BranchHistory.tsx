import { X, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import type { Branch, Report } from '@/types';
import { cx, fullDate, attendanceDelta, reportSlot } from '@/lib/utils';

interface Props {
  branch: Branch;
  reports: Report[];
  onClose: () => void;
}

export function BranchHistory({ branch, reports, onClose }: Props) {
  // ישן → חדש לצורך חישוב דלתות; מוצג הפוך (חדש ראשון)
  const sorted = [...reports].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col card animate-fade-in shadow-2xl">
        {/* כותרת */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="font-bold text-lg">{branch.name}</h2>
            <p className="text-xs text-zinc-500">{branch.camp ?? branch.region}</p>
          </div>
          <button onClick={onClose} className="btn-ghost !p-2">
            <X size={18} />
          </button>
        </div>

        {/* ציר זמן */}
        <div className="overflow-y-auto px-5 py-4 space-y-3 flex-1">
          {sorted.length === 0 && (
            <p className="text-center text-sm text-zinc-500 py-8">אין דיווחים לסניף זה</p>
          )}
          {[...sorted].reverse().map((report, idx) => {
            // prev הוא הדיווח שקדם לנוכחי בציר הזמן (sorted ישן-לחדש)
            const prevInTime = sorted[sorted.length - 1 - idx - 1];
            const delta = attendanceDelta(report.attendance, prevInTime?.attendance);
            const hasDelta = prevInTime !== undefined && Object.keys(delta).length > 0;
            const slot = reportSlot(report.createdAt);
            const totalDelta =
              hasDelta
                ? Object.values(delta).reduce((s, v) => s + v, 0)
                : null;

            return (
              <div key={report.id} className="rounded-xl border border-zinc-800 bg-zinc-800/30 p-4">
                {/* שורת כותרת */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{slot.emoji}</span>
                    <span className="text-sm font-semibold text-zinc-200">{slot.label}</span>
                    <span className="text-xs text-zinc-500">{fullDate(report.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {report.headcount != null && (
                      <span className="text-sm font-bold tabular-nums text-zinc-100">
                        {report.headcount}
                        {totalDelta !== null && totalDelta !== 0 && (
                          <DeltaBadge value={totalDelta} />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* נוכחות לפי שכבה */}
                {report.attendance && (
                  <div className="flex flex-wrap gap-1.5 mb-2">
                    {Object.entries(report.attendance)
                      .sort(([a], [b]) => a.localeCompare(b, 'he', { numeric: true }))
                      .map(([grade, n]) => (
                        <div
                          key={grade}
                          className="flex flex-col items-center rounded-lg border border-zinc-700 bg-zinc-800 px-2 py-1 min-w-[48px]"
                        >
                          <span className="text-[10px] text-zinc-500">שכ׳ {grade}</span>
                          <span className="text-sm font-bold tabular-nums text-zinc-200">{n}</span>
                          {hasDelta && delta[grade] !== undefined && delta[grade] !== 0 && (
                            <DeltaBadge value={delta[grade]} small />
                          )}
                        </div>
                      ))}
                  </div>
                )}

                {/* הערות */}
                {report.message && (
                  <p className="text-xs text-zinc-400 leading-relaxed">{report.message}</p>
                )}

                {/* שם רכז */}
                <p className="mt-1 text-xs text-zinc-600">{report.coordinatorName}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DeltaBadge({ value, small = false }: { value: number; small?: boolean }) {
  const positive = value > 0;
  return (
    <span
      className={cx(
        'inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums',
        small ? 'text-[10px] px-1 py-0' : 'text-xs px-1.5 py-0.5 mr-1',
        positive
          ? 'text-emerald-300 bg-emerald-500/15'
          : 'text-red-300 bg-red-500/15',
      )}
    >
      {positive ? <TrendingUp size={small ? 9 : 11} /> : <TrendingDown size={small ? 9 : 11} />}
      {positive ? '+' : ''}{value}
    </span>
  );
}

/** השוואת שני דיווחים זה לצד זה — מוצגת במסך הרכז. */
export function ReportComparison({ current, previous }: { current: Report; previous: Report }) {
  const delta = attendanceDelta(current.attendance, previous.attendance);
  const hasDelta = Object.keys(delta).length > 0;
  const totalDelta = hasDelta
    ? Object.values(delta).reduce((s, v) => s + v, 0)
    : null;

  const currSlot = reportSlot(current.createdAt);
  const prevSlot = reportSlot(previous.createdAt);

  return (
    <div className="card p-4 mt-3 animate-fade-in">
      <h4 className="text-xs font-semibold text-zinc-400 mb-3 flex items-center gap-1.5">
        <Minus size={12} />
        השוואה לדיווח הקודם
      </h4>
      <div className="grid grid-cols-2 gap-3">
        {/* קודם */}
        <div className="rounded-lg bg-zinc-800/50 p-3 border border-zinc-700">
          <div className="flex items-center gap-1.5 mb-2">
            <span>{prevSlot.emoji}</span>
            <span className="text-xs font-medium text-zinc-400">{prevSlot.label}</span>
            <span className="text-[10px] text-zinc-600 mr-auto">{fullDate(previous.createdAt)}</span>
          </div>
          {previous.attendance ? (
            <GradeCells attendance={previous.attendance} />
          ) : (
            <span className="text-xs text-zinc-500">ללא נוכחות לפי שכבה</span>
          )}
          {previous.headcount != null && (
            <p className="mt-1.5 text-xs text-zinc-400">סה"כ: {previous.headcount}</p>
          )}
        </div>
        {/* נוכחי */}
        <div className="rounded-lg bg-zinc-800/50 p-3 border border-blue-500/30">
          <div className="flex items-center gap-1.5 mb-2">
            <span>{currSlot.emoji}</span>
            <span className="text-xs font-medium text-zinc-200">{currSlot.label}</span>
            <span className="text-[10px] text-zinc-500 mr-auto">{fullDate(current.createdAt)}</span>
          </div>
          {current.attendance ? (
            <GradeCells attendance={current.attendance} delta={hasDelta ? delta : undefined} />
          ) : (
            <span className="text-xs text-zinc-500">ללא נוכחות לפי שכבה</span>
          )}
          {current.headcount != null && (
            <p className="mt-1.5 text-xs text-zinc-400">
              סה"כ: {current.headcount}
              {totalDelta !== null && totalDelta !== 0 && (
                <span className={cx('mr-1.5 font-semibold', totalDelta > 0 ? 'text-emerald-400' : 'text-red-400')}>
                  ({totalDelta > 0 ? '+' : ''}{totalDelta})
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function GradeCells({
  attendance,
  delta,
}: {
  attendance: Record<string, number>;
  delta?: Record<string, number>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {Object.entries(attendance)
        .sort(([a], [b]) => a.localeCompare(b, 'he', { numeric: true }))
        .map(([grade, n]) => {
          const d = delta?.[grade] ?? 0;
          return (
            <div
              key={grade}
              className={cx(
                'flex flex-col items-center rounded-md border px-1.5 py-0.5 min-w-[34px]',
                d > 0
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : d < 0
                  ? 'border-red-500/40 bg-red-500/10'
                  : 'border-zinc-700 bg-zinc-800',
              )}
            >
              <span className="text-[9px] text-zinc-500">{grade}</span>
              <span className="text-xs font-bold tabular-nums text-zinc-200">{n}</span>
              {d !== 0 && (
                <span className={cx('text-[9px] font-bold', d > 0 ? 'text-emerald-400' : 'text-red-400')}>
                  {d > 0 ? '+' : ''}{d}
                </span>
              )}
            </div>
          );
        })}
    </div>
  );
}
