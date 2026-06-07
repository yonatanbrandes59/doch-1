import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Branch, ComparisonResult, Report } from '@/types';
import {
  getReportSlot,
  getReportDate,
  getDeadlineAt,
  isLate,
  getReportState,
} from '@/lib/reportUtils';

/** "לפני 5 דקות" וכו'. */
export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: he });
}

/** תאריך מלא קריא. */
export function fullDate(iso: string): string {
  return format(new Date(iso), 'dd/MM/yyyy HH:mm', { locale: he });
}

/** מיזוג מחלקות Tailwind מותנות. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** תווית סלוט לתצוגה — עקבי עם getReportSlot (לפני 12 = בוקר). */
export function reportSlot(iso: string): { label: string; emoji: string } {
  const h = new Date(iso).getHours();
  return h < 12
    ? { label: 'בוקר', emoji: '🌅' }
    : { label: 'ערב', emoji: '🌙' };
}

/**
 * מחשב דלתא של נוכחות לפי שכבה בין שני דיווחים עוקבים.
 * מחזיר מפת שכבה → שינוי (חיובי / שלילי / 0).
 */
export function attendanceDelta(
  curr: Record<string, number> | undefined,
  prev: Record<string, number> | undefined,
): Record<string, number> {
  if (!curr && !prev) return {};
  const grades = new Set([...Object.keys(curr ?? {}), ...Object.keys(prev ?? {})]);
  const delta: Record<string, number> = {};
  for (const g of grades) {
    delta[g] = (curr?.[g] ?? 0) - (prev?.[g] ?? 0);
  }
  return delta;
}

/** ייצוא דיווחים ל-CSV עם תמיכת עברית (BOM). */
export function reportsToCsv(reports: Report[], branches: Branch[]): string {
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—';
  const campLabel: Record<string, string> = {
    shachbag: 'שכב"ג',
    shachbatz: 'שכב"צ',
  };
  const attendanceStr = (att?: Record<string, number>) =>
    att ? Object.entries(att).map(([g, n]) => `${g}:${n}`).join(' ') : '';
  const stateLabel: Record<string, string> = {
    on_time: 'בזמן',
    late: 'באיחור',
  };
  const slotLabelMap: Record<string, string> = {
    morning: 'בוקר',
    evening: 'ערב',
  };
  const header = [
    'תאריך', 'סלוט', 'תאריך_דיווח', 'דד-ליין', 'איחור', 'מצב_דיווח',
    'סניף', 'רכז', 'מחנה', 'נוכחות', 'נוכחות לפי שכבה', 'הערות',
  ];
  const rows = reports.map((r) => {
    const slot = getReportSlot(r.createdAt);
    const date = getReportDate(r.createdAt);
    const deadline = getDeadlineAt(date, slot);
    const late = isLate(r);
    const state = getReportState(r);
    return [
      fullDate(r.createdAt),
      slotLabelMap[slot] ?? slot,
      date,
      fullDate(deadline.toISOString()),
      late ? 'כן' : 'לא',
      stateLabel[state] ?? state,
      branchName(r.branchId),
      r.coordinatorName,
      r.campPhase ? campLabel[r.campPhase] ?? '' : '',
      r.headcount ?? '',
      attendanceStr(r.attendance),
      r.message.replace(/\n/g, ' '),
    ];
  });
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  return '﻿' + body; // BOM לתצוגת עברית תקינה ב-Excel
}

/** ייצוא תוצאות השוואה ל-CSV. */
export function comparisonsToCsv(comparisons: ComparisonResult[]): string {
  const slotLabelMap: Record<string, string> = { morning: 'בוקר', evening: 'ערב' };
  const riskLabel: Record<string, string> = {
    normal: 'תקין',
    attention: 'תשומת לב',
    critical: 'קריטי',
    missing_report: 'חסר דיווח',
  };
  const header = [
    'סניף', 'סלוט A', 'סלוט B',
    'נוכחות A', 'נוכחות B', 'דלתא_כולל', 'דלתא_%', 'רמת_סיכון',
    'דלתא_לפי_שכבה',
  ];
  const rows = comparisons.map((c) => [
    c.branchName,
    slotLabelMap[c.slotA] ?? c.slotA,
    slotLabelMap[c.slotB] ?? c.slotB,
    c.reportA?.headcount ?? '—',
    c.reportB?.headcount ?? '—',
    c.totalDelta,
    c.deltaPercent !== null ? `${c.deltaPercent.toFixed(1)}%` : '—',
    riskLabel[c.riskLevel] ?? c.riskLevel,
    Object.entries(c.delta).map(([g, v]) => `${g}:${v > 0 ? '+' : ''}${v}`).join(' '),
  ]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  return '﻿' + body;
}

export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
