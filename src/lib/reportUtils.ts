/**
 * לוגיקת סלוטים, דד-ליינים ומצבי דיווח.
 * כל הפונקציות כאן הן טהורות — הן מחשבות ערכים מ-createdAt בלבד, ללא גישה ל-DB.
 */

import { format } from 'date-fns';
import type { Branch, BranchReportState, ComparisonResult, Report, ReportSlot, RiskLevel } from '@/types';

/** חישוב דלתא של נוכחות (עותק מקומי למניעת תלות מעגלית עם utils). */
function _attendanceDelta(
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

/** מחזיר 'morning' אם השעה לפני 12:00, 'evening' אחרת. */
export function getReportSlot(iso: string): ReportSlot {
  const h = new Date(iso).getHours();
  return h < 12 ? 'morning' : 'evening';
}

/** מחזיר תאריך בפורמט 'YYYY-MM-DD'. */
export function getReportDate(iso: string): string {
  return format(new Date(iso), 'yyyy-MM-dd');
}

/** הדד-ליין לסלוט נתון: בוקר = 08:00, ערב = 20:00. */
export function getDeadlineAt(date: string, slot: ReportSlot): Date {
  const [y, m, d] = date.split('-').map(Number);
  const hour = slot === 'morning' ? 8 : 20;
  return new Date(y, m - 1, d, hour, 0, 0, 0);
}

/**
 * מחזיר true אם הדיווח הוגש אחרי הדד-ליין של הסלוט שלו.
 * הסלוט נגזר מה-createdAt עצמו.
 */
export function isLate(report: Report): boolean {
  const slot = getReportSlot(report.createdAt);
  const date = getReportDate(report.createdAt);
  const deadline = getDeadlineAt(date, slot);
  return new Date(report.createdAt) > deadline;
}

/** מצב הדיווח עבור דיווח קיים: on_time / late. */
export function getReportState(report: Report): 'on_time' | 'late' {
  return isLate(report) ? 'late' : 'on_time';
}

/**
 * מצב הדיווח המורחב של סניף עבור תאריך + סלוט נתונים.
 * @param report  — הדיווח (אם קיים) שנרשם עבור אותו סניף, תאריך וסלוט.
 * @param date    — 'YYYY-MM-DD'
 * @param slot    — 'morning' | 'evening'
 * @param now     — זמן הבדיקה (ברירת מחדל: עכשיו)
 */
export function getBranchReportState(
  report: Report | null,
  date: string,
  slot: ReportSlot,
  now: Date = new Date(),
): BranchReportState {
  const deadline = getDeadlineAt(date, slot);
  if (report) {
    return isLate(report) ? 'reported_late' : 'reported_on_time';
  }
  return now > deadline ? 'missing_after' : 'missing_before';
}

/** מחזיר את הדיווח של הסניף עבור תאריך + סלוט (או null אם לא קיים). */
export function findReportForSlot(
  reports: Report[],
  branchId: string,
  date: string,
  slot: ReportSlot,
): Report | null {
  return (
    reports.find(
      (r) =>
        r.branchId === branchId &&
        getReportDate(r.createdAt) === date &&
        getReportSlot(r.createdAt) === slot,
    ) ?? null
  );
}

/** מחשב רמת סיכון על פי שינוי הנוכחות. */
export function calculateRiskLevel(
  reportA: Report | null,
  reportB: Report | null,
  totalDelta: number,
  deltaPercent: number | null,
): RiskLevel {
  if (!reportA || !reportB) return 'missing_report';
  const absDelta = Math.abs(totalDelta);
  const absPct = deltaPercent !== null ? Math.abs(deltaPercent) : 0;
  if (absPct > 15 || absDelta > 5) return 'critical';
  if (absPct > 5 || absDelta > 2) return 'attention';
  return 'normal';
}

/**
 * בונה רשימת השוואות לפי שני סלוטים עוקבים.
 * slotA → slotB (למשל: בוקר→ערב, או ערב→בוקר-שאחרי).
 *
 * @param branches  — רשימת הסניפים
 * @param reports   — כל הדיווחים
 * @param dateA     — תאריך הסלוט הראשון ('YYYY-MM-DD')
 * @param slotA     — בוקר/ערב
 * @param dateB     — תאריך הסלוט השני
 * @param slotB     — בוקר/ערב
 */
export function compareSlots(
  branches: Branch[],
  reports: Report[],
  dateA: string,
  slotA: ReportSlot,
  dateB: string,
  slotB: ReportSlot,
): ComparisonResult[] {
  const results: ComparisonResult[] = branches.map((branch) => {
    const rA = findReportForSlot(reports, branch.id, dateA, slotA);
    const rB = findReportForSlot(reports, branch.id, dateB, slotB);

    const delta = _attendanceDelta(rB?.attendance, rA?.attendance);
    const totalDelta = Object.values(delta).reduce((s, v) => s + v, 0);
    const totalA = rA?.headcount ?? null;
    const deltaPercent = totalA != null && totalA > 0 ? (totalDelta / totalA) * 100 : null;
    const riskLevel = calculateRiskLevel(rA, rB, totalDelta, deltaPercent);

    return {
      branchId: branch.id,
      branchName: branch.name,
      slotA,
      slotB,
      reportA: rA,
      reportB: rB,
      delta,
      totalDelta,
      deltaPercent,
      riskLevel,
    };
  });

  // מיון: critical → attention → missing_report → normal
  const order: RiskLevel[] = ['critical', 'attention', 'missing_report', 'normal'];
  return results.sort((a, b) => order.indexOf(a.riskLevel) - order.indexOf(b.riskLevel));
}

/** הודעת WhatsApp לתזכורת לפי סניף וסלוט. */
export function formatReminderMessage(branchName: string, slot: ReportSlot): string {
  const deadline = slot === 'morning' ? '08:00' : '20:00';
  const slotHe = slot === 'morning' ? 'בוקר' : 'ערב';
  return `שלום, תזכורת לשליחת דוח 1 ${slotHe} עבור סניף ${branchName} עד ${deadline}`;
}
