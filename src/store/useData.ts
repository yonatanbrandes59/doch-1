import { create } from 'zustand';
import { storage } from '@/lib/storage';
import type { Branch, NewBranch, NewReport, Report } from '@/types';

interface DataState {
  branches: Branch[];
  reports: Report[];
  loading: boolean;
  error: string | null;
  initialized: boolean;

  /** טעינה ראשונית + הרשמה לעדכוני realtime. מחזיר פונקציית ניקוי. */
  init: () => () => void;
  refresh: () => Promise<void>;

  addBranch: (input: NewBranch) => Promise<void>;
  editBranch: (id: string, patch: Partial<NewBranch>) => Promise<void>;
  removeBranch: (id: string) => Promise<void>;
  addReport: (input: NewReport) => Promise<void>;
}

export const useData = create<DataState>((set, get) => ({
  branches: [],
  reports: [],
  loading: false,
  error: null,
  initialized: false,

  refresh: async () => {
    try {
      const [branches, reports] = await Promise.all([
        storage.listBranches(),
        storage.listReports(),
      ]);
      set({ branches, reports, error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : 'שגיאה בטעינת הנתונים' });
    }
  },

  init: () => {
    set({ loading: true });
    void get()
      .refresh()
      .finally(() => set({ loading: false, initialized: true }));
    return storage.subscribe(() => {
      void get().refresh();
    });
  },

  addBranch: async (input) => {
    await storage.createBranch(input);
    await get().refresh();
  },
  editBranch: async (id, patch) => {
    await storage.updateBranch(id, patch);
    await get().refresh();
  },
  removeBranch: async (id) => {
    await storage.deleteBranch(id);
    await get().refresh();
  },
  addReport: async (input) => {
    await storage.createReport(input);
    await get().refresh();
  },
}));
