import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  Download,
  Search,
  Settings,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Header } from '@/components/Header';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { useData } from '@/store/useData';
import { STATUS_META, STATUS_ORDER, type Branch, type BranchStatus, type Report } from '@/types';
import { cx, downloadCsv, fullDate, reportsToCsv, timeAgo } from '@/lib/utils';

type BranchView = {
  branch: Branch;
  latest: Report | null;
  status: BranchStatus | 'none';
};

export default function HamlDashboard() {
  const { branches, reports, init } = useData();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<BranchStatus | 'all' | 'none'>('all');

  useEffect(() => init(), [init]);

  /** הסטטוס העדכני ביותר לכל סניף. */
  const branchViews: BranchView[] = useMemo(() => {
    return branches.map((branch) => {
      const latest = reports.find((r) => r.branchId === branch.id) ?? null;
      return { branch, latest, status: latest?.status ?? 'none' };
    });
  }, [branches, reports]);

  const counts = useMemo(() => {
    const c = { ok: 0, attention: 0, emergency: 0, none: 0 };
    for (const v of branchViews) c[v.status]++;
    return c;
  }, [branchViews]);

  const reported = branches.length - counts.none;

  const pieData = STATUS_ORDER.map((s) => ({
    name: STATUS_META[s].label,
    value: counts[s],
    key: s,
  })).filter((d) => d.value > 0);

  const PIE_COLORS: Record<BranchStatus, string> = {
    ok: '#10b981',
    attention: '#f59e0b',
    emergency: '#ef4444',
  };

  const filtered = useMemo(() => {
    return branchViews
      .filter((v) => (filter === 'all' ? true : v.status === filter))
      .filter((v) =>
        query.trim() === ''
          ? true
          : (v.branch.name + (v.branch.camp ?? '') + (v.latest?.coordinatorName ?? ''))
              .toLowerCase()
              .includes(query.trim().toLowerCase()),
      )
      .sort((a, b) => {
        const oa = a.status === 'none' ? 99 : STATUS_META[a.status].order;
        const ob = b.status === 'none' ? 99 : STATUS_META[b.status].order;
        return oa - ob;
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
              onClick={() => downloadCsv(`reports-${Date.now()}.csv`, reportsToCsv(reports, branches))}
              className="btn-ghost"
              disabled={reports.length === 0}
            >
              <Download size={18} /> ייצוא CSV
            </button>
            <Link to="/branches" className="btn-ghost">
              <Settings size={18} /> ניהול סניפים
            </Link>
          </div>
        </div>

        {/* כרטיסי סיכום */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          <StatCard label="סניפים" value={branches.length} icon={<Building2 size={28} />} />
          <StatCard label="דיווחו" value={`${reported}/${branches.length}`} icon={<Users size={28} />} />
          <StatCard label="תקין" value={counts.ok} tone="ok" />
          <StatCard label="דורש תשומת לב" value={counts.attention} tone="attention" />
          <StatCard label="חירום" value={counts.emergency} tone="emergency" />
        </div>

        {/* התראת חירום */}
        {counts.emergency > 0 && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-red-200 animate-pulse-ring">
            <ShieldAlert size={22} />
            <span className="font-medium">
              {counts.emergency} סניפים במצב חירום — נדרש טיפול מיידי
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
                      <Cell key={d.key} fill={PIE_COLORS[d.key as BranchStatus]} />
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
              {reports.slice(0, 12).map((r) => {
                const b = branches.find((x) => x.id === r.branchId);
                return (
                  <li key={r.id} className="flex items-center justify-between gap-3 rounded-lg bg-slate-800/40 px-3 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <StatusBadge status={r.status} />
                      <span className="truncate text-sm">
                        <span className="font-medium">{b?.name ?? '—'}</span>
                        <span className="text-slate-500"> · {r.coordinatorName}</span>
                      </span>
                    </div>
                    <time className="shrink-0 text-xs text-slate-500" title={fullDate(r.createdAt)}>
                      {timeAgo(r.createdAt)}
                    </time>
                  </li>
                );
              })}
              {reports.length === 0 && (
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
              {STATUS_ORDER.map((s) => (
                <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)}>
                  {STATUS_META[s].label}
                </FilterChip>
              ))}
              <FilterChip active={filter === 'none'} onClick={() => setFilter('none')}>
                לא דיווחו
              </FilterChip>
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
                </tr>
              </thead>
              <tbody>
                {filtered.map(({ branch, latest, status }) => (
                  <tr key={branch.id} className="border-b border-slate-800/60 hover:bg-slate-800/30">
                    <td className="px-3 py-2.5 font-medium">{branch.name}</td>
                    <td className="px-3 py-2.5 text-slate-400">{branch.camp ?? '—'}</td>
                    <td className="px-3 py-2.5">
                      {status === 'none' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
                          <AlertTriangle size={14} /> לא דיווח
                        </span>
                      ) : (
                        <StatusBadge status={status} />
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{latest?.coordinatorName ?? '—'}</td>
                    <td className="px-3 py-2.5 tabular-nums text-slate-300">{latest?.headcount ?? '—'}</td>
                    <td className="px-3 py-2.5 text-slate-500" title={latest ? fullDate(latest.createdAt) : ''}>
                      {latest ? timeAgo(latest.createdAt) : '—'}
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
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
