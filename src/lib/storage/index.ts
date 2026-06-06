import { supabase } from '@/lib/supabase';
import { storageMode } from '@/lib/config';
import { LocalAdapter } from './localAdapter';
import { SupabaseAdapter } from './supabaseAdapter';
import type { StorageAdapter } from './types';

/**
 * בחירת מימוש האחסון לפי הסביבה:
 *   - אם Supabase מוגדר → SupabaseAdapter (סנכרון אמיתי בין כל הרכזים).
 *   - אחרת → LocalAdapter (localStorage, מתאים לפיתוח/דמו).
 *
 * כדי לעבור בין השניים אין צורך לגעת בשום מקום אחר בקוד — רק להגדיר משתני סביבה.
 */
export const storage: StorageAdapter =
  storageMode === 'supabase' && supabase
    ? new SupabaseAdapter(supabase)
    : new LocalAdapter();

export type { StorageAdapter } from './types';
