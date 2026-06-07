import type { Branch, CampPhase, NewBranch, NewReport, Report } from '@/types';
import type { StorageAdapter } from './types';

const BRANCHES_KEY = 'doch1.branches';
const REPORTS_KEY = 'doch1.reports';
const CAMP_PHASE_KEY = 'doch1.campPhase';
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

/** סניפים 2026 — סבב א (5 מחנונים) וסבב ב (4 מחנונים). נטענים בפעם הראשונה בלבד. */
const SEED_BRANCHES: NewBranch[] = [
  // סבב א - מחנון 1
  { name: 'חובב', region: 'מרכז', camp: 'סבב א - מחנון 1' },
  { name: 'גנץ', region: 'מרכז', camp: 'סבב א - מחנון 1' },
  { name: 'תל יצחק', region: 'מרכז', camp: 'סבב א - מחנון 1' },
  { name: 'עין עירון', region: 'מרכז צפוני', camp: 'סבב א - מחנון 1' },
  { name: 'תלמי אלעזר', region: 'מרכז צפוני', camp: 'סבב א - מחנון 1' },
  { name: 'בטחה', region: 'מרחבים', camp: 'סבב א - מחנון 1' },
  { name: 'מרחבים', region: 'מרחבים', camp: 'סבב א - מחנון 1' },
  { name: 'שדה צבי', region: 'מרחבים', camp: 'סבב א - מחנון 1' },
  { name: 'בחן', region: 'עמק מעיין', camp: 'סבב א - מחנון 1' },

  // סבב א - מחנון 2
  { name: 'שדה ורבורג', region: 'מרכז', camp: 'סבב א - מחנון 2' },
  { name: 'גוש ויתקין', region: 'עמק ים', camp: 'סבב א - מחנון 2' },
  { name: 'שערי תקווה', region: 'מרכז', camp: 'סבב א - מחנון 2' },
  { name: 'גילון', region: 'צפון', camp: 'סבב א - מחנון 2' },
  { name: 'צורית', region: 'צפון', camp: 'סבב א - מחנון 2' },
  { name: 'גן יאשיה', region: 'עמק מעיין', camp: 'סבב א - מחנון 2' },
  { name: 'אלישיב', region: 'עמק מעיין', camp: 'סבב א - מחנון 2' },
  { name: 'עין איילה', region: 'מרכז צפוני', camp: 'סבב א - מחנון 2' },

  // סבב א - מחנון 3
  { name: 'בית יצחק', region: 'עמק מעיין', camp: 'סבב א - מחנון 3' },
  { name: 'אמץ', region: 'עמק מעיין', camp: 'סבב א - מחנון 3' },
  { name: 'אביחיל', region: 'עמק ים', camp: 'סבב א - מחנון 3' },
  { name: 'כפר מונש', region: 'עמק ים', camp: 'סבב א - מחנון 3' },
  { name: 'פטיש', region: 'מרחבים', camp: 'סבב א - מחנון 3' },
  { name: 'רנן', region: 'מרחבים', camp: 'סבב א - מחנון 3' },
  { name: 'פדויים', region: 'מרחבים', camp: 'סבב א - מחנון 3' },
  { name: 'מורן', region: 'צפון', camp: 'סבב א - מחנון 3' },
  { name: 'מנוף', region: 'צפון', camp: 'סבב א - מחנון 3' },
  { name: 'שורשים', region: 'צפון', camp: 'סבב א - מחנון 3' },

  // סבב א - מחנון 4
  { name: 'מגשימים', region: 'מרכז', camp: 'סבב א - מחנון 4' },
  { name: 'גוש חיה', region: 'עמק ים', camp: 'סבב א - מחנון 4' },
  { name: 'חבצושה', region: 'עמק ים', camp: 'סבב א - מחנון 4' },
  { name: 'גן שומרון', region: 'מרכז צפוני', camp: 'סבב א - מחנון 4' },
  { name: 'תובל', region: 'צפון', camp: 'סבב א - מחנון 4' },
  { name: 'בית קשת', region: 'צפון', camp: 'סבב א - מחנון 4' },
  { name: 'חגלה', region: 'עמק מעיין', camp: 'סבב א - מחנון 4' },
  { name: 'לביא גבעת חיים מאוחד', region: 'עמק מעיין', camp: 'סבב א - מחנון 4' },
  { name: 'בן נון', region: 'שפלה', camp: 'סבב א - מחנון 4' },

  // סבב א - מחנון 5
  { name: 'רמות השבים', region: 'מרכז', camp: 'סבב א - מחנון 5' },
  { name: 'קלחים', region: 'מרחבים', camp: 'סבב א - מחנון 5' },
  { name: 'גילת', region: 'מרחבים', camp: 'סבב א - מחנון 5' },
  { name: 'מסלול', region: 'מרחבים', camp: 'סבב א - מחנון 5' },
  { name: 'בית חנניה', region: 'מרכז צפוני', camp: 'סבב א - מחנון 5' },
  { name: 'שקד-ריחן', region: 'מרכז צפוני', camp: 'סבב א - מחנון 5' },
  { name: 'אבטליון', region: 'צפון', camp: 'סבב א - מחנון 5' },
  { name: 'יעד', region: 'צפון', camp: 'סבב א - מחנון 5' },
  { name: 'לבון', region: 'צפון', camp: 'סבב א - מחנון 5' },
  { name: 'יד חנה', region: 'עמק מעיין', camp: 'סבב א - מחנון 5' },

  // סבב ב - מחנון 6
  { name: 'השלושה', region: 'מרכז', camp: 'סבב ב - מחנון 6' },
  { name: 'קיבוץ אייל', region: 'מרכז', camp: 'סבב ב - מחנון 6' },
  { name: 'שילת', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 6' },
  { name: 'בית נחמיה', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 6' },
  { name: 'כפר טרומן', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 6' },
  { name: 'מכמורת/מבואות ים', region: 'עמק ים', camp: 'סבב ב - מחנון 6' },
  { name: 'בר חן', region: 'עמק ים', camp: 'סבב ב - מחנון 6' },
  { name: 'יסוד המעלה', region: 'צפון', camp: 'סבב ב - מחנון 6' },
  { name: 'דקל', region: 'אשכול', camp: 'סבב ב - מחנון 6' },
  { name: 'ישע', region: 'אשכול', camp: 'סבב ב - מחנון 6' },

  // סבב ב - מחנון 7
  { name: 'עינת', region: 'מרכז', camp: 'סבב ב - מחנון 7' },
  { name: 'אחיטוב', region: 'עמק מעיין', camp: 'סבב ב - מחנון 7' },
  { name: 'משמר השרון', region: 'עמק מעיין', camp: 'סבב ב - מחנון 7' },
  { name: 'מזור', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 7' },
  { name: 'כפר דניאל', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 7' },
  { name: 'בני עטרות', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 7' },
  { name: 'בית הלוי', region: 'עמק ים', camp: 'סבב ב - מחנון 7' },
  { name: 'עולותיים', region: 'עמק ים', camp: 'סבב ב - מחנון 7' },
  { name: 'יבול', region: 'אשכול', camp: 'סבב ב - מחנון 7' },
  { name: 'שדה ניצן', region: 'אשכול', camp: 'סבב ב - מחנון 7' },

  // סבב ב - מחנון 8
  { name: 'מתן', region: 'מרכז', camp: 'סבב ב - מחנון 8' },
  { name: 'ניר אליהו', region: 'מרכז', camp: 'סבב ב - מחנון 8' },
  { name: 'בן שמן', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 8' },
  { name: 'גבעת כח', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 8' },
  { name: 'מגדל העמק', region: 'מרכז צפוני', camp: 'סבב ב - מחנון 8' },
  { name: 'תימורים', region: 'שפלה', camp: 'סבב ב - מחנון 8' },
  { name: 'סגולה', region: 'שפלה', camp: 'סבב ב - מחנון 8' },
  { name: 'כפר הרי"ף', region: 'שפלה', camp: 'סבב ב - מחנון 8' },
  { name: 'יתד', region: 'אשכול', camp: 'סבב ב - מחנון 8' },

  // סבב ב - מחנון 9
  { name: 'כפר אורנים', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 9' },
  { name: 'גינתון', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 9' },
  { name: 'חלחץ', region: 'עמק מעיין', camp: 'סבב ב - מחנון 9' },
  { name: 'גבעת חיים איחוד', region: 'עמק מעיין', camp: 'סבב ב - מחנון 9' },
  { name: 'הר עמשא', region: 'תמר', camp: 'סבב ב - מחנון 9' },
  { name: 'ככר סדום', region: 'תמר', camp: 'סבב ב - מחנון 9' },
  { name: 'עין גדי', region: 'תמר', camp: 'סבב ב - מחנון 9' },
  { name: 'אוהד', region: 'אשכול', camp: 'סבב ב - מחנון 9' },
  { name: 'עין הבשור', region: 'אשכול', camp: 'סבב ב - מחנון 9' },
  { name: 'פנתר', region: 'חבל מודיעין', camp: 'סבב ב - מחנון 9' },

  // סניף דמו לבדיקה
  { name: 'סניף דמו', region: 'מרכז', camp: 'דמו', phone: '905011111111' },
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

      // דיווחי דמו לדוגמה — כדי שהלוח ייראה חי בכניסה ראשונה.
      if (read<Report>(REPORTS_KEY).length === 0) {
        const byName = (name: string) => seeded.find((b) => b.name === name);
        const now = Date.now();
        const min = 60 * 1000;
        const demoReports: Array<{
          name: string;
          coordinatorName: string;
          headcount: number | null;
          message: string;
          agoMin: number;
        }> = [
          { name: 'סניף דמו', coordinatorName: 'יונתן (דמו)', headcount: 38, message: 'הכל תקין, הפעילות מתנהלת כסדרה.', agoMin: 4 },
          { name: 'חובב', coordinatorName: 'דנה כהן', headcount: 25, message: 'צוות הדרכה מלא, נוכחות טובה.', agoMin: 22 },
          { name: 'גנץ', coordinatorName: 'אורי לוי', headcount: 41, message: 'נוכחות מלאה.', agoMin: 47 },
          { name: 'מתן', coordinatorName: 'נועה ברק', headcount: 30, message: 'כל הדיווחים התקבלו בהצלחה.', agoMin: 9 },
        ];

        const reports: Report[] = demoReports
          .map((r) => {
            const branch = byName(r.name);
            if (!branch) return null;
            return {
              id: uid(),
              branchId: branch.id,
              coordinatorName: r.coordinatorName,
              headcount: r.headcount,
              message: r.message,
              createdAt: new Date(now - r.agoMin * min).toISOString(),
            } satisfies Report;
          })
          .filter((r): r is Report => r !== null);

        write(REPORTS_KEY, reports);
      }
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

  async getCampPhase(): Promise<CampPhase> {
    const v = localStorage.getItem(CAMP_PHASE_KEY);
    return v === 'shachbatz' ? 'shachbatz' : 'shachbag';
  }

  async setCampPhase(phase: CampPhase): Promise<void> {
    localStorage.setItem(CAMP_PHASE_KEY, phase);
    this.notify();
  }

  subscribe(onChange: () => void): () => void {
    const handler = () => onChange();
    this.channel?.addEventListener('message', handler);
    // נפילת ביטחון: אירוע storage נורה בטאבים אחרים גם ללא BroadcastChannel.
    const storageHandler = (e: StorageEvent) => {
      if (e.key === BRANCHES_KEY || e.key === REPORTS_KEY || e.key === CAMP_PHASE_KEY) onChange();
    };
    window.addEventListener('storage', storageHandler);
    return () => {
      this.channel?.removeEventListener('message', handler);
      window.removeEventListener('storage', storageHandler);
    };
  }
}
