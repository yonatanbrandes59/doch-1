import type { Branch, NewBranch, NewReport, Report } from '@/types';

/**
 * חוזה שכבת האחסון.
 *
 * זו נקודת ההפרדה המרכזית במערכת: כל שאר הקוד מדבר רק מול הממשק הזה.
 * מימוש מקומי (localStorage) ומימוש ענן (Supabase) מספקים אותו חוזה,
 * כך שמעבר בין השניים אינו דורש שינוי בלוגיקה או ב-UI.
 */
export interface StorageAdapter {
  /** שם המימוש (לדיבוג/תצוגה). */
  readonly mode: 'local' | 'supabase';

  listBranches(): Promise<Branch[]>;
  createBranch(input: NewBranch): Promise<Branch>;
  updateBranch(id: string, patch: Partial<NewBranch>): Promise<Branch>;
  deleteBranch(id: string): Promise<void>;

  listReports(): Promise<Report[]>;
  createReport(input: NewReport): Promise<Report>;

  /**
   * הרשמה לעדכונים בזמן אמת. הקולבק נקרא בכל שינוי בנתונים.
   * מחזיר פונקציית ביטול-הרשמה.
   */
  subscribe(onChange: () => void): () => void;
}
