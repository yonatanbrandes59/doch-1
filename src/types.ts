/** טיפוסי הליבה של המערכת. */

/** סטטוס דיווח: האם סניף דיווח או לא. */
export type ReportStatus = 'reported' | 'missing';

/** סלוט דיווח: בוקר (לפני 12:00) / ערב (12:00 ואילך). */
export type ReportSlot = 'morning' | 'evening';

export const REPORT_SLOT_META: Record<ReportSlot, { label: string; emoji: string; deadline: string }> = {
  morning: { label: 'בוקר', emoji: '🌅', deadline: '08:00' },
  evening: { label: 'ערב', emoji: '🌙', deadline: '20:00' },
};

/**
 * מצב דיווח מפורט של סניף עבור סלוט נתון.
 * reported_on_time  — ירוק: דיווח התקבל לפני הדד-ליין.
 * reported_late     — צהוב: דיווח התקבל אחרי הדד-ליין.
 * missing_before    — אפור:  עדיין אין דיווח, הדד-ליין טרם עבר.
 * missing_after     — אדום:  אין דיווח והדד-ליין עבר.
 */
export type BranchReportState =
  | 'reported_on_time'
  | 'reported_late'
  | 'missing_before'
  | 'missing_after';

export const BRANCH_REPORT_STATE_META: Record<
  BranchReportState,
  { label: string; color: string; dot: string }
> = {
  reported_on_time: {
    label: 'דיווח בזמן',
    color: 'text-green-300 bg-green-600/15 border-green-500/40',
    dot: 'bg-green-500',
  },
  reported_late: {
    label: 'דיווח באיחור',
    color: 'text-amber-300 bg-amber-500/15 border-amber-500/40',
    dot: 'bg-amber-400',
  },
  missing_before: {
    label: 'טרם דיווח',
    color: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
    dot: 'bg-slate-500',
  },
  missing_after: {
    label: 'לא דיווח',
    color: 'text-red-300 bg-red-500/15 border-red-500/40',
    dot: 'bg-red-500',
  },
};

export const REPORT_STATUS_META: Record<
  ReportStatus,
  { label: string; color: string; dot: string }
> = {
  reported: { label: 'דיווח התקבל', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40', dot: 'bg-emerald-500' },
  missing: { label: 'לא דיווח', color: 'text-slate-400 bg-slate-500/10 border-slate-500/30', dot: 'bg-slate-500' },
};

export const REPORT_STATUS_ORDER: ReportStatus[] = ['reported', 'missing'];

/** שלב המחנה בתוך הסבב: שכב"ג (3 ימים ראשונים) / שכב"צ (3 ימים אחריהם). */
export type CampPhase = 'shachbag' | 'shachbatz';

export const CAMP_META: Record<CampPhase, { label: string; grades: string[] }> = {
  // שכב"ג — שכבות ט–י"ב
  shachbag: { label: 'מחנה שכב"ג', grades: ['ט', 'י', 'י"א', 'י"ב'] },
  // שכב"צ — שכבות ד–י"ב
  shachbatz: { label: 'מחנה שכב"צ', grades: ['ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'י"א', 'י"ב'] },
};

export const CAMP_ORDER: CampPhase[] = ['shachbag', 'shachbatz'];

/** סניף. */
export interface Branch {
  id: string;
  name: string;
  region: string;
  camp?: string;
  phone?: string;
  createdAt: string;
}

/** דיווח בודד מסניף. */
export interface Report {
  id: string;
  branchId: string;
  coordinatorName: string;
  headcount: number | null;
  /** שלב המחנה שאליו שייך הדיווח (שכב"ג / שכב"צ). */
  campPhase?: CampPhase;
  /** נוכחות מפורטת לפי שכבה: { 'ט': 12, 'י': 9, ... }. */
  attendance?: Record<string, number>;
  message: string;
  createdAt: string;
}

export type NewBranch = Pick<Branch, 'name' | 'region'> & { camp?: string; phone?: string };
export type NewReport = Omit<Report, 'id' | 'createdAt'>;

/** רמת סיכון בהשוואה בין סלוטים עוקבים. */
export type RiskLevel = 'normal' | 'attention' | 'critical' | 'missing_report';

/** תוצאת השוואת נוכחות בין שני סלוטים עוקבים עבור סניף אחד. */
export interface ComparisonResult {
  branchId: string;
  branchName: string;
  slotA: ReportSlot;
  slotB: ReportSlot;
  reportA: Report | null;
  reportB: Report | null;
  delta: Record<string, number>;
  totalDelta: number;
  deltaPercent: number | null;
  riskLevel: RiskLevel;
}

/** תפקיד המשתמש המחובר. */
export type Role = 'haml' | 'coordinator';

export interface Session {
  role: Role;
  /** שם הרכז (כשהתפקיד coordinator). */
  name?: string;
  /** הסניף שאליו משויך הרכז. */
  branchId?: string;
}
