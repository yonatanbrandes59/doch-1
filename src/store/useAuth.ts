import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config, storageMode } from '@/lib/config';
import {
  fetchSessionUser,
  onAuthChange,
  signInWithPassword,
  signOutSupabase,
} from '@/lib/auth';
import type { Session } from '@/types';

interface AuthState {
  session: Session | null;
  /** האם שחזור ההתחברות הראשוני הסתיים (חשוב במצב Supabase שהוא אסינכרוני). */
  ready: boolean;
  mode: 'local' | 'supabase';

  /** שחזור התחברות + הרשמה לשינויים. נקרא פעם אחת בעליית האפליקציה. */
  init: () => void;

  // ── מצב Supabase ──
  signIn: (email: string, password: string) => Promise<string | null>;

  // ── מצב מקומי (dev) ──
  loginHaml: (code: string) => boolean;
  loginCoordinator: (name: string, branchId: string) => void;

  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      // במצב מקומי ה-state משוחזר סינכרונית מהאחסון → מוכן מיד.
      ready: storageMode === 'local',
      mode: storageMode,

      init: () => {
        if (storageMode === 'supabase') {
          void fetchSessionUser().then((s) => set({ session: s, ready: true }));
          onAuthChange((s) => set({ session: s }));
        } else {
          set({ ready: true });
        }
      },

      signIn: async (email, password) => {
        const error = await signInWithPassword(email, password);
        if (error) return error;
        set({ session: await fetchSessionUser() });
        return null;
      },

      loginHaml: (code) => {
        if (storageMode !== 'local') return false;
        if (code.trim() !== config.hamlCode) return false;
        set({ session: { role: 'haml' } });
        return true;
      },

      loginCoordinator: (name, branchId) => {
        set({ session: { role: 'coordinator', name: name.trim(), branchId } });
      },

      logout: async () => {
        if (storageMode === 'supabase') await signOutSupabase();
        set({ session: null });
      },
    }),
    {
      name: 'doch1.auth',
      // שמירה מקומית רק במצב dev. במצב Supabase ה-session מנוהל ע"י Supabase עצמו.
      partialize: (s) => (storageMode === 'local' ? { session: s.session } : {}),
    },
  ),
);
