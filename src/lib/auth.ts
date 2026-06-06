import { supabase } from './supabase';
import type { Role, Session } from '@/types';

/**
 * שכבת אימות מול Supabase Auth.
 * משמשת רק במצב Supabase; במצב מקומי משתמשים בזרימת הקוד שב-useAuth.
 */

/** שולף את המשתמש המחובר ואת הפרופיל שלו (תפקיד + סניף). */
export async function fetchSessionUser(): Promise<Session | null> {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role, full_name, branch_id')
    .eq('id', user.id)
    .single();
  if (error || !profile) return null;

  return {
    role: profile.role as Role,
    name: (profile.full_name as string) || undefined,
    branchId: (profile.branch_id as string | null) || undefined,
  };
}


/** שליחת OTP למספר טלפון. */
export async function sendPhoneOtp(phone: string): Promise<string | null> {
  if (!supabase) return 'Supabase אינו מוגדר';

  const { error } = await supabase.auth.signInWithOtp({
    phone: phone.trim(),
  });

  return error ? 'שגיאה בשליחת OTP: ' + error.message : null;
}

/** אימות OTP וכניסה. */
export async function verifyPhoneOtp(
  phone: string,
  token: string,
): Promise<string | null> {
  if (!supabase) return 'Supabase אינו מוגדר';

  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone.trim(),
    token: token.trim(),
    type: 'sms',
  });

  if (error) return 'קוד שגוי או פג תוקף: ' + error.message;
  if (!data.user) return 'שגיאה בהתחברות';

  return null;
}

/** יצירת פרופיל אחרי אימות OTP. */
export async function createProfileAfterAuth(
  fullName: string,
  role: 'coordinator' | 'haml',
  branchId?: string,
): Promise<string | null> {
  if (!supabase) return 'Supabase אינו מוגדר';

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 'לא מחובר';

  const { error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      full_name: fullName.trim(),
      role,
      branch_id: branchId || null,
    });

  return error ? 'שגיאה בעדכון פרופיל: ' + error.message : null;
}


export async function signOutSupabase(): Promise<void> {
  await supabase?.auth.signOut();
}

/** הרשמה לשינויי מצב התחברות (התחברות/ניתוק מטאב אחר וכו'). */
export function onAuthChange(cb: (user: Session | null) => void): () => void {
  if (!supabase) return () => {};
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    if (!session) {
      cb(null);
      return;
    }
    void fetchSessionUser().then(cb);
  });
  return () => data.subscription.unsubscribe();
}
