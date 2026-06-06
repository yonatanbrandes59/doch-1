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

/** סניפים 2026 — חלוקה לפי מחנונים וסניפים. נטענים בפעם הראשונה בלבד. */
const SEED_BRANCHES: NewBranch[] = [
  // מחנה א' (בית חליפה)
  { name: 'אלישיב', region: 'בצפון', camp: 'מחנה א' },
  { name: 'מכמורת', region: 'בצפון', camp: 'מחנה א' },
  { name: 'לבון', region: 'בצפון', camp: 'מחנה א' },
  { name: 'גנץ', region: 'בצפון', camp: 'מחנה א' },
  { name: 'בית ישראל', region: 'בצפון', camp: 'מחנה א' },
  { name: 'גוש חלחול', region: 'בצפון', camp: 'מחנה א' },
  { name: 'דקל', region: 'בצפון', camp: 'מחנה א' },
  { name: 'השלושה', region: 'בצפון', camp: 'מחנה א' },
  { name: 'חלחול', region: 'בצפון', camp: 'מחנה א' },
  { name: 'יסוד העמק', region: 'בצפון', camp: 'מחנה א' },
  { name: 'מחנים', region: 'בצפון', camp: 'מחנה א' },
  { name: 'קיבוץ איל', region: 'בצפון', camp: 'מחנה א' },
  { name: 'עין השרון', region: 'בצפון', camp: 'מחנה א' },
  { name: 'תלמי אליהו', region: 'בצפון', camp: 'מחנה א' },
  { name: 'עין בדי', region: 'בצפון', camp: 'מחנה א' },
  { name: 'פנחר', region: 'בצפון', camp: 'מחנה א' },

  // מחנה ב' - אליוויזיה 1
  { name: 'ביתנה', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 1' },
  { name: 'אמץ', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 1' },
  { name: 'גוש חיים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 1' },
  { name: 'נגב', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 1' },
  { name: 'מסלול', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 1' },
  { name: 'קלחים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 1' },

  // מחנה ב' - אליוויזיה 2
  { name: 'אנקלין', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 2' },
  { name: 'בית קסת', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 2' },
  { name: 'שוש חיים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 2' },
  { name: 'עוף', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 2' },
  { name: 'בן נון', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 2' },

  // מחנה ב' - אליוויזיה 3
  { name: 'אבתחיל', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 3' },
  { name: 'בית יצחק', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 3' },
  { name: 'מונור', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 3' },
  { name: 'רנן', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 3' },
  { name: 'שדה צבי', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 3' },
  { name: 'פצים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 3' },

  // מחנה ב' - אליוויזיה 4
  { name: 'בית חנניה', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },
  { name: 'בית מוצא', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },
  { name: 'שדה בוקר', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },
  { name: 'שדה ריחון', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },
  { name: 'צוריט', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },
  { name: 'חבוצל', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },
  { name: 'תחבוצה', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 4' },

  // מחנה ב' - אליוויזיה 5
  { name: 'כפר שבכיל', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 5' },
  { name: 'חורשים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 5' },
  { name: 'שופרים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 5' },
  { name: 'רמות שבים', region: 'במרכז', camp: 'מחנה ב׳ - אליוויזיה 5' },

  // מחנה ג'
  { name: 'בית קסת', region: 'במרכז', camp: 'מחנה ג' },
  { name: 'נגב', region: 'במרכז', camp: 'מחנה ג' },

  // מחנה ד'
  { name: 'בית נחמיה', region: 'בדרום', camp: 'מחנה ד' },
  { name: 'השלוד', region: 'בדרום', camp: 'מחנה ד' },
  { name: 'יחזקאל', region: 'בדרום', camp: 'מחנה ד' },
  { name: 'דקלי', region: 'בדרום', camp: 'מחנה ד' },

  // מחנה ה'
  { name: 'חיווה', region: 'בדרום', camp: 'מחנה ה' },
  { name: 'חבצלת', region: 'בדרום', camp: 'מחנה ה' },
  { name: 'יד חנה', region: 'בדרום', camp: 'מחנה ה' },
  { name: 'גילון', region: 'בדרום', camp: 'מחנה ה' },
  { name: 'לימון', region: 'בדרום', camp: 'מחנה ה' },

  // מחנה ו'
  { name: 'בית קדוש', region: 'בדרום', camp: 'מחנה ו' },
  { name: 'אולים', region: 'בדרום', camp: 'מחנה ו' },
  { name: 'דשן', region: 'בדרום', camp: 'מחנה ו' },
  { name: 'מידו', region: 'בדרום', camp: 'מחנה ו' },
  { name: 'שולתיים', region: 'בדרום', camp: 'מחנה ו' },
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
