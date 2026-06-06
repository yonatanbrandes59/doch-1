import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

/**
 * לקוח Supabase יחיד. null כאשר Supabase אינו מוגדר (מצב localStorage).
 */
export const supabase: SupabaseClient | null = config.supabase.enabled
  ? createClient(config.supabase.url, config.supabase.anonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
      realtime: { params: { eventsPerSecond: 5 } },
    })
  : null;
