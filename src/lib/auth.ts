import { supabase } from './supabase';
import type { Role, Session } from '@/types';

/**
 * שכבת אימות מול Supabase Auth.
 * משמשת רק במצב Supabase; במצב מקומי משתמשים בזרימת הקוד שב-useAuth.
 */

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'אימייל או סיסמה שגויים';
  if (m.includes('email not confirmed')) return 'האימייל טרם אומת';
  if (m.includes('rate limit')) return 'יותר מדי ניסיונות, נסה/י שוב מאוחר יותר';
  return 'שגיאת התחברות, נסה/י שוב';
}

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

/** התחברות עם אימייל וסיסמה. מחזיר הודעת שגיאה או null בהצלחה. */
export async function signInWithPassword(
  email: string,
  password: string,
): Promise<string | null> {
  if (!supabase) return 'Supabase אינו מוגדר';
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return error ? translateAuthError(error.message) : null;
}

/** הרשמה - יצירת חשבון חדש. */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  role: 'coordinator' | 'haml',
  branchId?: string,
): Promise<string | null> {
  if (!supabase) return 'Supabase אינו מוגדר';

  // יצירת המשתמש
  const { data: authData, error: signUpError } = await supabase.auth.signUp({
    email: email.trim(),
    password,
  });

  if (signUpError) return translateAuthError(signUpError.message);
  if (!authData.user) return 'שגיאה ביצירת חשבון';

  // יצירת פרופיל
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      full_name: fullName.trim(),
      role,
      branch_id: branchId || null,
    });

  if (profileError) return 'שגיאה בעדכון פרופיל: ' + profileError.message;

  return null;
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
