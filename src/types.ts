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

/** סניף. */
export interface Branch {
  id: string;
  name: string;
  region: string;
  camp?: string;
  createdAt: string;
}

/** דיווח בודד מסניף. */
export interface Report {
  id: string;
  branchId: string;
  coordinatorName: string;
  status: BranchStatus;
  headcount: number | null;
  message: string;
  createdAt: string;
}

export type NewBranch = Pick<Branch, 'name' | 'region'> & { camp?: string };
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
