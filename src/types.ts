/** טיפוסי הליבה של המערכת. */

/** סטטוס סניף: תקין / דורש תשומת לב / חירום. */
export type BranchStatus = 'ok' | 'attention' | 'emergency';

export const STATUS_META: Record<
  BranchStatus,
  { label: string; color: string; dot: string; order: number }
> = {
  emergency: { label: 'חירום', color: 'text-red-300 bg-red-500/15 border-red-500/40', dot: 'bg-red-500', order: 0 },
  attention: { label: 'דורש תשומת לב', color: 'text-amber-300 bg-amber-500/15 border-amber-500/40', dot: 'bg-amber-500', order: 1 },
  ok: { label: 'תקין', color: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40', dot: 'bg-emerald-500', order: 2 },
};

export const STATUS_ORDER: BranchStatus[] = ['emergency', 'attention', 'ok'];

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
  status: BranchStatus;
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
