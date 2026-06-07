import type { ReactNode } from 'react';
import { cx } from '@/lib/utils';

export function StatCard({
  label,
  value,
  icon,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: 'default' | 'ok' | 'attention' | 'emergency';
}) {
  const tones: Record<string, string> = {
    default: 'text-zinc-100',
    ok: 'text-emerald-400',
    attention: 'text-amber-400',
    emergency: 'text-red-400',
  };
  return (
    <div className="card p-4 flex items-center gap-4 animate-fade-in">
      {icon && <div className="text-zinc-400">{icon}</div>}
      <div>
        <div className={cx('text-2xl font-bold tabular-nums', tones[tone])}>{value}</div>
        <div className="text-sm text-zinc-400">{label}</div>
      </div>
    </div>
  );
}
