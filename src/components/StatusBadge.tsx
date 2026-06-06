import { STATUS_META, type BranchStatus } from '@/types';
import { cx } from '@/lib/utils';

export function StatusBadge({ status, className }: { status: BranchStatus; className?: string }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        meta.color,
        className,
      )}
    >
      <span className={cx('h-2 w-2 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}
