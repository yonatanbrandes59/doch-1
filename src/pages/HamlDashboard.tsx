import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Clock,
  Download,
  MessageCircle,
  Search,
  Settings,
  Users,
  CheckCircle2,
  XCircle,
  GitCompare,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { BranchHistory } from '@/components/BranchHistory';
import { useData } from '@/store/useData';
import { storage } from '@/lib/storage';
import {
  BRANCH_REPORT_STATE_META,
  CAMP_META,
  CAMP_ORDER,
  type Branch,
  type BranchReportState,
  type ComparisonResult,
  type Report,
  type ReportSlot,
} from '@/types';
import {
  compareSlots,
  findReportForSlot,
  formatReminderMessage,
  getBranchReportState,
  getReportDate,
} from '@/lib/reportUtils';
import { cx, comparisonsToCsv, downloadCsv, fullDate, reportsToCsv, timeAgo } from '@/lib/utils';

type BranchView = {
  branch: Branch;
  latest: Report | null;
  reportState: BranchReportState;
};

type Round = 'all' | 'א' | 'ב';
type SlotFilter = 'all' | 'morning' | 'evening';
type DashTab = 'overview' | 'comparison';
type ComparisonMode = 'morning_to_evening' | 'evening_to_morning';

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

/** פונקציית עזר לקבלת תאריך + סלוט "שאחרי" */
function nextSlotDate(date: string, slot: ReportSlot): { date: string; slot: ReportSlot } {
  if (slot === 'morning') return { date, slot: 'evening' };
  // ערב → בוקר של למחרת
  const d = new Date(date + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return {
    date: d.toISOString().slice(0, 10),
    slot: 'morning',
  };
}

const RISK_ORDER: ComparisonResult['riskLevel'][] = ['critical', 'attention', 'missing_report', 'normal'];

const RISK_META: Record<ComparisonResult['riskLevel'], { label: string; color: string }> = {
  critical: { label: 'קריטי', color: 'text-red-300 bg-red-500/15 border-red-500/40' },
  attention: { label: 'תשומת לב', color: 'text-amber-300 bg-amber-500/15 border-amber-500/40' },
  missing_report: { label: 'חסר דיווח', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30' },
  normal: { label: 'תקין', color: 'text-green-300 bg-green-600/15 border-green-500/40' },
};

export default function HamlDashboard() {
  const { branches, reports, campPhase, setCampPhase, init } = useData();
  const [query, setQuery] = useState('');
  const [stateFilter, setStateFilter] = useState<BranchReportState | 'all'>('all');
  const [round, setRound] = useState<Round>('all');
  const [camp, setCamp] = useState<string>('all');
  const [slotFilter, setSlotFilter] = useState<SlotFilter>('all');
  const [historyBranchId, setHistoryBranchId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('morning_to_evening');
  const [, setTick] = useState(0);

  useEffect(() => init(), [init]);

  // עדכון כל דקה (לחישוב מצב עדכני)
  useEffect(() => {
    const interval = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const now = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => getReportDate(now.toISOString()), [now]);

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

  /** הדיווח עבור כל סניף לפי פילטר הסלוט */
  const branchViews: BranchView[] = useMemo(() => {
    return scopedBranches.map((branch) => {
      let latest: Report | null = null;
      if (slotFilter === 'all') {
        latest = reports.find((r) => r.branchId === branch.id) ?? null;
      } else {
        latest = findReportForSlot(reports, branch.id, todayStr, slotFilter as ReportSlot);
      }
      const targetSlot: ReportSlot = slotFilter === 'all'
        ? (now.getHours() < 12 ? 'morning' : 'evening')
        : (slotFilter as ReportSlot);
      const reportState = getBranchReportState(latest, todayStr, targetSlot, now);
      return { branch, latest, reportState };
    });
  }, [scopedBranches, reports, slotFilter, todayStr, now]);

  const counts = useMemo(() => {
    const c = { reported_on_time: 0, reported_late: 0, missing_before: 0, missing_after: 0 };
    for (const v of branchViews) c[v.reportState]++;
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

  const totalReported = counts.reported_on_time + counts.reported_late;
  const totalMissing = counts.missing_before + counts.missing_after;

  const pieData = [
    { name: BRANCH_REPORT_STATE_META.reported_on_time.label, value: counts.reported_on_time, key: 'reported_on_time' },
    { name: BRANCH_REPORT_STATE_META.reported_late.label, value: counts.reported_late, key: 'reported_late' },
    { name: BRANCH_REPORT_STATE_META.missing_before.label, value: counts.missing_before, key: 'missing_before' },
    { name: BRANCH_REPORT_STATE_META.missing_after.label, value: counts.missing_after, key: 'missing_after' },
  ].filter((d) => d.value > 0);

  const PIE_COLORS: Record<string, string> = {
    reported_on_time: '#16a34a',
    reported_late: '#f59e0b',
    missing_before: '#64748b',
    missing_after: '#ef4444',
  };

  const filtered = useMemo(() => {
    return branchViews
      .filter((v) => (stateFilter === 'all' ? true : v.reportState === stateFilter))
      .filter((v) =>
        query.trim() === ''
          ? true
          : (v.branch.name + (v.branch.camp ?? '') + (v.latest?.coordinatorName ?? ''))
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
      )
      .sort((a, b) => {
        const stateOrder: BranchReportState[] = [
          'reported_on_time', 'reported_late', 'missing_before', 'missing_after',
        ];
        return stateOrder.indexOf(a.reportState) - stateOrder.indexOf(b.reportState);
      });
  }, [branchViews, stateFilter, query]);

  const historyBranch = historyBranchId ? branches.find((b) => b.id === historyBranchId) : null;
  const historyReports = historyBranchId
    ? reports.filter((r) => r.branchId === historyBranchId)
    : [];

  /** נתוני השוואה */
  const comparisonData = useMemo((): ComparisonResult[] => {
    if (activeTab !== 'comparison') return [];
    if (comparisonMode === 'morning_to_evening') {
      return compareSlots(scopedBranches, reports, todayStr, 'morning', todayStr, 'evening');
    } else {
      // ערב → בוקר של למחרת
      const { date: nextDate, slot: nextSlot } = nextSlotDate(todayStr, 'evening');
      return compareSlots(scopedBranches, reports, todayStr, 'evening', nextDate, nextSlot);
    }
  }, [activeTab, comparisonMode, scopedBranches, reports, todayStr]);

  return (
    <div className="min-h-screen">
      {/* באנר דמו */}
      {storage.mode === 'local' && (
        <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300">
          מצב דמו — הנתונים נשמרים רק בדפדפן הזה
        </div>
      )}
      {historyBranch && (
        <BranchHistory
          branch={historyBranch}
          reports={historyReports}
          onClose={() => setHistoryBranchId(null)}
        />
      )}
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

        {/* טאבים ראשיים */}
        <div className="mb-4 flex gap-1 rounded-xl bg-slate-800/50 p-1 w-fit">
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
            <Building2 size={15} /> סקירה כללית
          </TabButton>
          <TabButton active={activeTab === 'comparison'} onClick={() => setActiveTab('comparison')}>
            <GitCompare size={15} /> השוואת סלוטים
          </TabButton>
        </div>

        {/* בורר סבב */}
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-400">סבב:</span>
          <RoundChip active={round === 'all'} onClick={() => selectRound('all')}>הכל</RoundChip>
          <RoundChip active={round === 'א'} onClick={() => selectRound('א')}>סבב א</RoundChip>
          <RoundChip active={round === 'ב'} onClick={() => selectRound('ב')}>סבב ב</RoundChip>
        </div>

        {/* בורר מחנון */}
        {campOptions.length > 0 && (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">מחנון:</span>
            <RoundChip active={camp === 'all'} onClick={() => setCamp('all')}>הכל</RoundChip>
            {campOptions.map((c) => (
              <RoundChip key={c} active={camp === c} onClick={() => setCamp(c)}>
                {campShort(c)}
              </RoundChip>
            ))}
          </div>
        )}

        {/* כפתור מחנה פעיל */}
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

        {activeTab === 'overview' && (
          <>
            {/* בורר סלוט */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-slate-400">סלוט:</span>
              <RoundChip active={slotFilter === 'all'} onClick={() => setSlotFilter('all')}>כל היום</RoundChip>
              <RoundChip active={slotFilter === 'morning'} onClick={() => setSlotFilter('morning')}>🌅 בוקר</RoundChip>
              <RoundChip active={slotFilter === 'evening'} onClick={() => setSlotFilter('evening')}>🌙 ערב</RoundChip>
            </div>

            {/* כרטיסי KPI */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <StatCard label="סניפים" value={scopedBranches.length} icon={<Building2 size={28} />} tone="default" />
              <StatCard label="דיווחו בזמן" value={counts.reported_on_time} tone="ok" icon={<CheckCircle2 size={28} />} />
              <StatCard label="דיווחו באיחור" value={counts.reported_late} tone={counts.reported_late > 0 ? 'attention' : 'ok'} icon={<Clock size={28} />} />
              <StatCard
                label="לא דיווחו"
                value={totalMissing}
                tone={counts.missing_after > 0 ? 'emergency' : totalMissing > 0 ? 'attention' : 'ok'}
                icon={<AlertTriangle size={28} />}
              />
            </div>

            {/* שורת KPI שניה */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 mt-3">
              <StatCard
                label="עבר דדליין"
                value={counts.missing_after}
                tone={counts.missing_after > 0 ? 'emergency' : 'ok'}
                icon={<XCircle size={28} />}
              />
              <StatCard label="דיווחו סה״כ" value={totalReported} tone={totalReported > 0 ? 'ok' : 'default'} icon={<Users size={28} />} />
              <StatCard
                label="אחוז השלמה"
                value={`${scopedBranches.length > 0 ? Math.round((totalReported / scopedBranches.length) * 100) : 0}%`}
                tone="ok"
              />
              <StatCard
                label="בפילוס"
                value={counts.missing_before}
                tone={counts.missing_before > 0 ? 'attention' : 'ok'}
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
                          <span className="text-xs text-slate-400">{campReported}/{campBranches.length}</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-800">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all duration-300"
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
                    .sort((a, b) => a[0].localeCompare(b[0], 'he', { numeric: true }))
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

            {/* התראה על סניפים שעבר דדליין */}
            {counts.missing_after > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200">
                <XCircle size={22} />
                <span className="font-medium">
                  {counts.missing_after} סניפים לא דיווחו והדד-ליין עבר — נדרשת תגבורת דחופה
                </span>
              </div>
            )}
            {counts.missing_after === 0 && totalMissing > 0 && (
              <div className="mt-4 flex items-center gap-3 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-200">
                <AlertTriangle size={22} />
                <span className="font-medium">
                  {totalMissing} סניפים עדיין לא דיווחו
                </span>
              </div>
            )}

            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {/* גרף */}
              <div className="card p-5 lg:col-span-1">
                <h3 className="mb-2 text-sm font-semibold text-slate-300">התפלגות מצב דיווח</h3>
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={3}>
                        {pieData.map((d) => (
                          <Cell key={d.key} fill={PIE_COLORS[d.key] ?? '#64748b'} />
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
                  <FilterChip active={stateFilter === 'all'} onClick={() => setStateFilter('all')}>הכל</FilterChip>
                  {(['reported_on_time', 'reported_late', 'missing_before', 'missing_after'] as BranchReportState[]).map((s) => (
                    <FilterChip key={s} active={stateFilter === s} onClick={() => setStateFilter(s)}>
                      {BRANCH_REPORT_STATE_META[s].label}
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
                      <th className="px-3 py-2 font-medium">מצב דיווח</th>
                      <th className="px-3 py-2 font-medium">רכז מדווח</th>
                      <th className="px-3 py-2 font-medium">נוכחות</th>
                      <th className="px-3 py-2 font-medium">עדכון אחרון</th>
                      <th className="px-3 py-2 font-medium">פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(({ branch, latest, reportState }) => {
                      const branchReportCount = reports.filter((r) => r.branchId === branch.id).length;
                      const stateMeta = BRANCH_REPORT_STATE_META[reportState];
                      const isMissing = reportState === 'missing_before' || reportState === 'missing_after';
                      const targetSlot: ReportSlot = slotFilter === 'all'
                        ? (now.getHours() < 12 ? 'morning' : 'evening')
                        : (slotFilter as ReportSlot);
                      return (
                        <tr
                          key={branch.id}
                          className="border-b border-slate-800/60 hover:bg-slate-800/30 cursor-pointer"
                          onClick={() => setHistoryBranchId(branch.id)}
                          title="לחץ לצפייה בהיסטוריית הדיווחים"
                        >
                          <td className="px-3 py-2.5 font-medium">{branch.name}</td>
                          <td className="px-3 py-2.5 text-slate-400">{branch.camp ?? '—'}</td>
                          <td className="px-3 py-2.5">
                            <span className={cx(
                              'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
                              stateMeta.color,
                            )}>
                              <span className={cx('h-2 w-2 rounded-full', stateMeta.dot)} />
                              {stateMeta.label}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-slate-300">{latest?.coordinatorName ?? '—'}</td>
                          <td className="px-3 py-2.5 tabular-nums text-slate-300">
                            {latest?.headcount ?? '—'}
                            {branchReportCount > 1 && (
                              <span className="mr-1.5 text-[10px] text-slate-600">({branchReportCount})</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-slate-500" title={latest ? fullDate(latest.createdAt) : ''}>
                            {latest ? timeAgo(latest.createdAt) : '—'}
                          </td>
                          <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                            {isMissing && branch.phone ? (
                              <a
                                href={`https://wa.me/${branch.phone.replace(/\D/g, '')}?text=${encodeURIComponent(formatReminderMessage(branch.name, targetSlot))}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-brand-400 hover:text-brand-300"
                                title="שלח הודעה דרך WhatsApp"
                              >
                                <MessageCircle size={14} /> ווצפ
                              </a>
                            ) : isMissing ? (
                              <span className="text-xs text-slate-600">אין מספר</span>
                            ) : (
                              '—'
                            )}
                          </td>
                        </tr>
                      );
                    })}
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
          </>
        )}

        {activeTab === 'comparison' && (
          <ComparisonTab
            comparisonMode={comparisonMode}
            setComparisonMode={setComparisonMode}
            comparisonData={comparisonData}
          />
        )}
      </main>
    </div>
  );
}

/** טאב השוואת סלוטים */
function ComparisonTab({
  comparisonMode,
  setComparisonMode,
  comparisonData,
}: {
  comparisonMode: ComparisonMode;
  setComparisonMode: (m: ComparisonMode) => void;
  comparisonData: ComparisonResult[];
}) {
  const handleExport = () => {
    downloadCsv(`comparison-${Date.now()}.csv`, comparisonsToCsv(comparisonData));
  };

  return (
    <div className="card p-5 mt-4 animate-fade-in">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-slate-200">השוואת נוכחות בין סלוטים</h3>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="btn-ghost"
            disabled={comparisonData.length === 0}
          >
            <Download size={16} /> ייצוא CSV
          </button>
        </div>
      </div>

      {/* בורר מצב השוואה */}
      <div className="mb-4 flex gap-1 rounded-xl bg-slate-800/50 p-1 w-fit">
        <TabButton active={comparisonMode === 'morning_to_evening'} onClick={() => setComparisonMode('morning_to_evening')}>
          🌅 בוקר מול ערב
        </TabButton>
        <TabButton active={comparisonMode === 'evening_to_morning'} onClick={() => setComparisonMode('evening_to_morning')}>
          🌙 ערב מול בוקר שאחרי
        </TabButton>
      </div>

      {/* טבלת השוואה */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400">
              <th className="px-3 py-2 font-medium">סניף</th>
              <th className="px-3 py-2 font-medium">
                {comparisonMode === 'morning_to_evening' ? '🌅 בוקר' : '🌙 ערב'}
              </th>
              <th className="px-3 py-2 font-medium">
                {comparisonMode === 'morning_to_evening' ? '🌙 ערב' : '🌅 בוקר שאחרי'}
              </th>
              <th className="px-3 py-2 font-medium">דלתא</th>
              <th className="px-3 py-2 font-medium">%</th>
              <th className="px-3 py-2 font-medium">שכבות</th>
              <th className="px-3 py-2 font-medium">סיכון</th>
            </tr>
          </thead>
          <tbody>
            {comparisonData.map((c) => {
              const riskMeta = RISK_META[c.riskLevel];
              return (
                <tr key={c.branchId} className="border-b border-slate-800/60 hover:bg-slate-800/20">
                  <td className="px-3 py-2.5 font-medium">{c.branchName}</td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-300">
                    {c.reportA?.headcount ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-300">
                    {c.reportB?.headcount ?? <span className="text-slate-600">—</span>}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums font-semibold">
                    {c.reportA && c.reportB ? (
                      <span className={c.totalDelta > 0 ? 'text-green-400' : c.totalDelta < 0 ? 'text-red-400' : 'text-slate-400'}>
                        {c.totalDelta > 0 ? '+' : ''}{c.totalDelta}
                      </span>
                    ) : (
                      <span className="text-slate-600">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 tabular-nums text-slate-400">
                    {c.deltaPercent !== null ? `${c.deltaPercent.toFixed(1)}%` : '—'}
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(c.delta)
                        .filter(([, v]) => v !== 0)
                        .sort(([a], [b]) => a.localeCompare(b, 'he', { numeric: true }))
                        .slice(0, 4)
                        .map(([grade, d]) => (
                          <span
                            key={grade}
                            className={cx(
                              'rounded px-1 py-0.5 text-[10px] font-semibold',
                              d > 0 ? 'text-green-300 bg-green-500/15' : 'text-red-300 bg-red-500/15',
                            )}
                          >
                            {grade}: {d > 0 ? '+' : ''}{d}
                          </span>
                        ))}
                    </div>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cx(
                      'inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium',
                      riskMeta.color,
                    )}>
                      {riskMeta.label}
                    </span>
                  </td>
                </tr>
              );
            })}
            {comparisonData.length === 0 && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  אין נתונים להשוואה — יש להמתין לדיווחים
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* סיכום לפי רמת סיכון */}
      {comparisonData.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3">
          {RISK_ORDER.map((level) => {
            const count = comparisonData.filter((c) => c.riskLevel === level).length;
            if (count === 0) return null;
            const meta = RISK_META[level];
            return (
              <div key={level} className={cx('rounded-xl border px-4 py-2 text-sm font-semibold', meta.color)}>
                {meta.label}: {count}
              </div>
            );
          })}
        </div>
      )}
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
        active ? 'bg-brand-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700',
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
          ? 'border-brand-500 bg-brand-600 text-white'
          : 'border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-800',
      )}
    >
      {children}
    </button>
  );
}

function TabButton({
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
        'inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        active ? 'bg-brand-600 text-white' : 'text-slate-400 hover:bg-slate-800',
      )}
    >
      {children}
    </button>
  );
}
