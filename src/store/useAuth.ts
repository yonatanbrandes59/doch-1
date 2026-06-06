import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { config } from '@/lib/config';
import type { Session } from '@/types';

interface AuthState {
  session: Session | null;
  /** כניסת חמ"ל בעזרת קוד גישה. מחזיר true אם הצליח. */
  loginHaml: (code: string) => boolean;
  /** כניסת רכז: שם + סניף. */
  loginCoordinator: (name: string, branchId: string) => void;
  logout: () => void;
}

export const useAuth = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      loginHaml: (code) => {
        if (code.trim() !== config.hamlCode) return false;
        set({ session: { role: 'haml' } });
        return true;
      },
      loginCoordinator: (name, branchId) => {
        set({ session: { role: 'coordinator', name: name.trim(), branchId } });
      },
      logout: () => set({ session: null }),
    }),
    { name: 'doch1.auth' },
  ),
);
