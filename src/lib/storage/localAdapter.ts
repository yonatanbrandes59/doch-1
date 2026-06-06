import type { Branch, NewBranch, NewReport, Report } from '@/types';
import type { StorageAdapter } from './types';

const BRANCHES_KEY = 'doch1.branches';
const REPORTS_KEY = 'doch1.reports';
const CHANNEL = 'doch1.sync';

function uid(): string {
  return crypto.randomUUID();
}

function read<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch {
    return [];
  }
}

function write<T>(key: string, value: T[]): void {
  localStorage.setItem(key, JSON.stringify(value));
}

/** סניפים לדוגמה — נטענים בפעם הראשונה בלבד כדי שהדמו לא יהיה ריק. */
const SEED_BRANCHES: NewBranch[] = [
  { name: 'מרכז', region: 'מחוז מרכז' },
  { name: 'צפון', region: 'מחוז צפון' },
  { name: 'דרום', region: 'מחוז דרום' },
  { name: 'ירושלים', region: 'מחוז ירושלים' },
  { name: 'יהודה ושומרון', region: 'מחוז יו"ש' },
  { name: 'שפלה', region: 'מחוז מרכז' },
];

/**
 * מימוש אחסון מקומי מבוסס localStorage.
 * סנכרון בזמן אמת בין טאבים נעשה דרך BroadcastChannel (+ נפילה לאירוע storage).
 */
export class LocalAdapter implements StorageAdapter {
  readonly mode = 'local' as const;
  private channel: BroadcastChannel | null =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;

  constructor() {
    if (read<Branch>(BRANCHES_KEY).length === 0) {
      const seeded: Branch[] = SEED_BRANCHES.map((b) => ({
        ...b,
        id: uid(),
        createdAt: new Date().toISOString(),
      }));
      write(BRANCHES_KEY, seeded);
    }
  }

  private notify(): void {
    this.channel?.postMessage('changed');
  }

  async listBranches(): Promise<Branch[]> {
    return read<Branch>(BRANCHES_KEY).sort((a, b) => a.name.localeCompare(b.name, 'he'));
  }

  async createBranch(input: NewBranch): Promise<Branch> {
    const branches = read<Branch>(BRANCHES_KEY);
    const branch: Branch = { ...input, id: uid(), createdAt: new Date().toISOString() };
    branches.push(branch);
    write(BRANCHES_KEY, branches);
    this.notify();
    return branch;
  }

  async updateBranch(id: string, patch: Partial<NewBranch>): Promise<Branch> {
    const branches = read<Branch>(BRANCHES_KEY);
    const idx = branches.findIndex((b) => b.id === id);
    if (idx === -1) throw new Error('סניף לא נמצא');
    branches[idx] = { ...branches[idx], ...patch };
    write(BRANCHES_KEY, branches);
    this.notify();
    return branches[idx];
  }

  async deleteBranch(id: string): Promise<void> {
    write(
      BRANCHES_KEY,
      read<Branch>(BRANCHES_KEY).filter((b) => b.id !== id),
    );
    write(
      REPORTS_KEY,
      read<Report>(REPORTS_KEY).filter((r) => r.branchId !== id),
    );
    this.notify();
  }

  async listReports(): Promise<Report[]> {
    return read<Report>(REPORTS_KEY).sort(
      (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
    );
  }

  async createReport(input: NewReport): Promise<Report> {
    const reports = read<Report>(REPORTS_KEY);
    const report: Report = { ...input, id: uid(), createdAt: new Date().toISOString() };
    reports.push(report);
    write(REPORTS_KEY, reports);
    this.notify();
    return report;
  }

  subscribe(onChange: () => void): () => void {
    const handler = () => onChange();
    this.channel?.addEventListener('message', handler);
    // נפילת ביטחון: אירוע storage נורה בטאבים אחרים גם ללא BroadcastChannel.
    const storageHandler = (e: StorageEvent) => {
      if (e.key === BRANCHES_KEY || e.key === REPORTS_KEY) onChange();
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      this.channel?.removeEventListener('message', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }
}
