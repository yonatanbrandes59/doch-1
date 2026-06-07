import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Download,
  MessageCircle,
  Search,
  Settings,
  Users,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useData } from '@/store/useData';
import {
  CAMP_META,
  CAMP_ORDER,
  REPORT_STATUS_META,
  REPORT_STATUS_ORDER,
  type Branch,
  type ReportStatus,
  type Report,
} from '@/types';
import { cx, downloadCsv, fullDate, reportsToCsv, timeAgo } from '@/lib/utils';

type BranchView = {
  branch: Branch;
  latest: Report | null;
  reportStatus: ReportStatus;
};

type Round = 'all' | 'א' | 'ב';

/** מזהה את הסבב מתוך שם המחנון. */
function roundOf(camp?: string): 'א' | 'ב' | 'other' {
  if (!camp) return 'other';
  if (camp.includes('סבב א')) return 'א';
  if (camp.includes('סבב ב')) return 'ב';
  return 'other';
}

/** תווית מקוצרת למחנון: "סבב א - מחנון 1" → "מחנון 1". */
function campShort(camp: string): string {
  const idx = camp.indexOf('מחנון');
  return idx >= 0 ? camp.slice(idx) : camp;
}

export default function HamlDashboard() {
  const { branches, reports, campPhase, setCampPhase, init } = useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
  const [round, setRound] = useState<Round>('all');
  const [camp, setCamp] = useState<string>('all');

  useEffect(() => init(), [init]);

  /** בעת החלפת סבב — איפוס בחירת המחנון. */
  const selectRound = (r: Round) => {
    setRound(r);
    setCamp('all');
  };

  /** סניפים מסוננים לפי הסבב הנבחר. */
  const roundBranches = useMemo(
    () => (round === 'all' ? branches : branches.filter((b) => roundOf(b.camp) === round)),
    [branches, round],
  );

  /** רשימת המחנונים הזמינים בסבב הנבחר. */
  const campOptions = useMemo(() => {
    const set = new Set<string>();
    for (const b of roundBranches) if (b.camp) set.add(b.camp);
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'he', { numeric: true }));
  }, [roundBranches]);

  /** סניפים מסוננים לפי הסבב והמחנון הנבחרים. */
  const scopedBranches = useMemo(
    () => (camp === 'all' ? roundBranches : roundBranches.filter((b) => b.camp === camp)),
    [roundBranches, camp],
  );

  /** הדיווח האחרון לכל סניף (בתוך הסבב/מחנון הנבחר). */
  const branchViews: BranchView[] = useMemo(() => {
    return scopedBranches.map((branch) => {
      const latest = reports.find((r) => r.branchId === branch.id) ?? null;
      return { branch, latest, reportStatus: latest ? 'reported' : 'missing' };
    });
  }, [scopedBranches, reports]);

  const counts = useMemo(() => {
    const c = { reported: 0, missing: 0 };
    for (const v of branchViews) c[v.reportStatus]++;
    return c;
  }, [branchViews]);

  /** סיכום נוכחות לפי שכבה — מסכם את הדיווח האחרון של כל סניף בטווח. */
  const gradeTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const v of branchViews) {
      const att = v.latest?.attendance;
      if (!att) continue;
      for (const [grade, n] of Object.entries(att)) {
        totals[grade] = (totals[grade] ?? 0) + (Number(n) || 0);
      }
    }
    return totals;
  }, [branchViews]);

  const gradeTotalSum = useMemo(
    () => Object.values(gradeTotals).reduce((a, b) => a + b, 0),
    [gradeTotals],
  );

  /** דיווחים בתוך הסבב/מחנון הנבחר (לפיד ולייצוא). */
  const scopedReports = useMemo(() => {
    if (round === 'all' && camp === 'all') return reports;
    const ids = new Set(scopedBranches.map((b) => b.id));
    return reports.filter((r) => ids.has(r.branchId));
  }, [reports, scopedBranches, round, camp]);

  const pieData = REPORT_STATUS_ORDER.map((s) => ({
    name: REPORT_STATUS_META[s].label,
    value: counts[s],
    key: s,
  })).filter((d) => d.value > 0);

  const PIE_COLORS: Record<ReportStatus, string> = {
    reported: '#10b981',
    missing: '#94a3b8',
  };

  const filtered = useMemo(() => {
    return branchViews
      .filter((v) => (filter === 'all' ? true : v.reportStatus === filter))
      .filter((v) =>
        query.trim() === ''
          ? true
          : (v.branch.name + (v.branch.camp ?? '') + (v.latest?.coordinatorName ?? ''))
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
      )
      .sort((a, b) => {
        const aOrder = a.reportStatus === 'reported' ? 0 : 1;
        const bOrder = b.reportStatus === 'reported' ? 0 : 1;
        return aOrder - bOrder;
      });
  }, [branchViews, filter, query]);

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold">לוח בקרה — חמ"ל</h2>
            <p className="text-sm text-slate-400">תמונת מצב חיה של כלל הסניפים</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => downloadCsv(`reports-${Date.now()}.csv`, reportsToCsv(scopedReports, branches))}
              className="btn-ghost"
              disabled={scopedReports.length === 0}
            >
              <Download size={18} /> ייצוא CSV
            </button>
            <Link to="/branches" className="btn-ghost">
              <Settings size={18} /> ניהול סניפים
            </Link>
          </div>
        </div>

        {/* בורר סבב */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">סבב:</span>
          <RoundChip active={round === 'all'} onClick={() => selectRound('all')}>
            הכל
          </RoundChip>
          <RoundChip active={round === 'א'} onClick={() => selectRound('א')}>
            סבב א
          </RoundChip>
          <RoundChip active={round === 'ב'} onClick={() => selectRound('ב')}>
            סבב ב
          </RoundChip>
        </div>

        {/* בורר מחנון */}
        {campOptions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">מחנון:</span>
            <RoundChip active={camp === 'all'} onClick={() => setCamp('all')}>
              הכל
            </RoundChip>
            {campOptions.map((c) => (
              <RoundChip key={c} active={camp === c} onClick={() => setCamp(c)}>
                {campShort(c)}
              </RoundChip>
            ))}
          </div>
        )}

        {/* כפתור מחנה פעיל — קובע את טופס הדיווח של הרכזים */}
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">מחנה פעיל:</span>
          {CAMP_ORDER.map((p) => (
            <RoundChip key={p} active={campPhase === p} onClick={() => void setCampPhase(p)}>
              {CAMP_META[p].label}
            </RoundChip>
          ))}
          <span className="text-xs text-slate-500">
            (שכבות {CAMP_META[campPhase].grades[0]}–{CAMP_META[campPhase].grades.at(-1)})
          </span>
        </div>

        {/* כרטיסי סיכום */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="סניפים" value={scopedBranches.length} icon={<Building2 size={28} />} tone="default" />
          <StatCard label="דיווחו" value={counts.reported} tone="ok" icon={<Users size={28} />} />
          <StatCard
            label="לא דיווחו"
            value={counts.missing}
            tone={counts.missing > 0 ? 'attention' : 'ok'}
            icon={<AlertTriangle size={28} />}
          />
          <StatCard
            label="אחוז השלמה"
            value={`${scopedBranches.length > 0 ? Math.round((counts.reported / scopedBranches.length) * 100) : 0}%`}
            tone="ok"
          />
        </div>

        {/* התקדמות לפי מחנון */}
        {camp !== 'all' && (
          <div className="card mt-4 p-5">
            <h3 className="mb-4 text-sm font-semibold text-slate-300">התקדמות דיווחים</h3>
            <div className="space-y-3">
              {campOptions.map((c) => {
                const campBranches = roundBranches.filter((b) => b.camp === c);
                const campReported = campBranches.filter((b) => reports.some((r) => r.branchId === b.id)).length;
                const percentage = campBranches.length > 0 ? Math.round((campReported / campBranches.length) * 100) : 0;
                return (
                  <div key={c}>
                    <div className="mb-1.5 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-300">{campShort(c)}</span>
                      <span className="text-xs text-slate-400">
                        {campReported}/{campBranches.length}
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* סיכום נוכחות לפי שכבה */}
        {gradeTotalSum > 0 && (
          <div className="card mt-4 p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">
              נוכחות לפי שכבה <span className="text-slate-500">· סה"כ {gradeTotalSum}</span>
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(gradeTotals)
                .sort((a, b) =>
                  a[0].localeCompare(b[0], 'he', { numeric: true }),
                )
                .map(([grade, n]) => (
                  <div
                    key={grade}
                    className="flex min-w-[72px] flex-col items-center rounded-xl border border-slate-700 bg-slate-800/50 px-3 py-2"
                  >
                    <span className="text-xs text-slate-400">שכבה {grade}</span>
                    <span className="text-lg font-bold tabular-nums text-slate-100">{n}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* התראה על סניפים שלא דיווחו */}
        {counts.missing > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
            <AlertTriangle size={22} />
            <span className="font-medium">
              {counts.missing} סניפים עדיין לא דיווחו — נדרשת תגבורת
            </span>
          </div>
        )}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          {/* גרף */}
          <div className="card p-5 lg:col-span-1">
            <h3 className="mb-2 text-sm font-semibold text-slate-300">התפלגות סטטוס</h3>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                    {pieData.map((d) => (
                      <Cell key={d.key} fill={PIE_COLORS[d.key as ReportStatus]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-[220px] place-items-center text-sm text-slate-500">
                אין דיווחים עדיין
              </div>
            )}
          </div>

          {/* פיד דיווחים אחרונים */}
          <div className="card p-5 lg:col-span-2">
            <h3 className="mb-3 text-sm font-semibold text-slate-300">דיווחים אחרונים</h3>
            <ul className="max-h-[220px] space-y-2 overflow-y-auto pl-1">
              {scopedReports.slice(0, 12).map((r) => {
                const b = branches.find((x) => x.id === r.branchId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800/40 px-3 py-2">
                    <span className="truncate text-sm">
                      <span className="font-medium">{b?.name ?? '—'}</span>
                      <span className="text-slate-500"> · {r.coordinatorName}</span>
                    </span>
                    <time className="shrink-0 text-xs text-slate-500" title={fullDate(r.createdAt)}>
                      {timeAgo(r.createdAt)}
                    </time>
                  </li>
                );
              })}
              {scopedReports.length === 0 && (
                <li className="py-8 text-center text-sm text-slate-500">אין דיווחים עדיין</li>
              )}
            </ul>
          </div>
        </div>

        {/* סינון + טבלת סניפים */}
        <div className="mt-4 card p-5">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                className="input pr-10"
                placeholder="חיפוש סניף / רכז…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <FilterChip active={filter === 'all'} onClick={() => setFilter('all')}>
                הכל
              </FilterChip>
              {REPORT_STATUS_ORDER.map((s) => (
                <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                  {REPORT_STATUS_META[s].label}
                </FilterChip>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400">
                  <th className="px-3 py-2 font-medium">סניף</th>
                  <th className="px-3 py-2 font-medium">מחנון</th>
                  <th className="px-3 py-2 font-medium">סטטוס</th>
                  <th className="px-3 py-2 font-medium">רכז מדווח</th>
                  <th className="px-3 py-2 font-medium">נוכחות</th>
                  <th className="px-3 py-2 font-medium">עדכון אחרון</th>
                  <th className="px-3 py-2 font-medium">פעולות</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ branch, latest, reportStatus }) => (
                  <tr key={branch.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-3 py-2.5 font-medium">{branch.name}</td>
                    <td className="px-3 py-2.5 text-slate-400">{branch.camp ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={reportStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{latest?.coordinatorName ?? '—'}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-300">{latest?.headcount ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500" title={latest ? fullDate(latest.createdAt) : ''}>
                      {latest ? timeAgo(latest.createdAt) : '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      {reportStatus === 'missing' && branch.phone ? (
                        <a
                          href={`https://wa.me/${branch.phone.replace(/\D/g, '')}?text=שלום%2C%20זו%20תזכורת%20לדיווח%20על%20סטטוס%20הסניף%20${encodeURIComponent(branch.name)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                          title="שלח הודעה דרך WhatsApp"
                        >
                          <MessageCircle size={14} /> ווצפ
                        </a>
                      ) : reportStatus === 'missing' ? (
                        <span className="text-xs text-slate-600">אין מספר</span>
                      ) : (
                        '—'
                      )}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500">
                      לא נמצאו סניפים תואמים
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-lg px-3 py-2 text-xs font-medium transition-colors',
        active ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
      )}
    >
      {children}
    </button>
  );
}

function RoundChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded-lg border px-4 py-2 text-sm font-semibold transition-colors',
        active
          ? 'border-blue-500 bg-blue-600 text-white'
          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800',
      )}
    >
      {children}
    </button>
  );
}
