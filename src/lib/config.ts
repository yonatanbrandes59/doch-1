/**
 * תצורת סביבה מרוכזת.
 * כל קריאה ל-import.meta.env עוברת דרך כאן כדי שיהיה מקור אמת אחד.
 */

const url = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

export const config = {
  supabase: {
    url,
    anonKey,
    /** האם Supabase מוגדר ופעיל. אם לא — נעבוד מול localStorage. */
    enabled: Boolean(url && anonKey),
  },
  /** קוד כניסה לחמ"ל. ברירת מחדל 1948. */
  hamlCode: import.meta.env.VITE_HAML_CODE?.trim() || '1948',
} as const;

export const storageMode: 'supabase' | 'local' = config.supabase.enabled
  ? 'supabase'
  : 'local';
