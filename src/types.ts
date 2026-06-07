/** טיפוסי הליבה של המערכת. */

/** סטטוס דיווח: האם סניף דיווח או לא. */
export type ReportStatus = 'reported' | 'missing';

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

/** תפקיד המשתמש המחובר. */
export type Role = 'haml' | 'coordinator';

export interface Session {
  role: Role;
  /** שם הרכז (כשהתפקיד coordinator). */
  name?: string;
  /** הסניף שאליו משויך הרכז. */
  branchId?: string;
}
