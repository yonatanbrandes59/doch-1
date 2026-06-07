import { formatDistanceToNow, format } from 'date-fns';
import { he } from 'date-fns/locale';
import type { Branch, Report } from '@/types';

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

/** ייצוא דיווחים ל-CSV עם תמיכת עברית (BOM). */
export function reportsToCsv(reports: Report[], branches: Branch[]): string {
  const branchName = (id: string) => branches.find((b) => b.id === id)?.name ?? '—';
  const statusLabel: Record<Report['status'], string> = {
    ok: 'תקין',
    attention: 'דורש תשומת לב',
    emergency: 'חירום',
  };
  const campLabel: Record<string, string> = {
    shachbag: 'שכב"ג',
    shachbatz: 'שכב"צ',
  };
  const attendanceStr = (att?: Record<string, number>) =>
    att ? Object.entries(att).map(([g, n]) => `${g}:${n}`).join(' ') : '';
  const header = ['תאריך', 'סניף', 'רכז', 'מחנה', 'סטטוס', 'נוכחות', 'נוכחות לפי שכבה', 'הערות'];
  const rows = reports.map((r) => [
    fullDate(r.createdAt),
    branchName(r.branchId),
    r.coordinatorName,
    r.campPhase ? campLabel[r.campPhase] ?? '' : '',
    statusLabel[r.status],
    r.headcount ?? '',
    attendanceStr(r.attendance),
    r.message.replace(/\n/g, ' '),
  ]);
  const escape = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const body = [header, ...rows].map((row) => row.map(escape).join(',')).join('\n');
  return '﻿' + body; // BOM לתצוגת עברית תקינה ב-Excel
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
