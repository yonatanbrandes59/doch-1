import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, LogOut, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { useReminders } from '@/store/useReminders';
import { storage } from '@/lib/storage';
import { Logo } from './Logo';

export function Header() {
  const { session, logout } = useAuth();
  const { enabled, toggleReminders } = useReminders();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-3">
          <Logo size={40} className="rounded-xl" />
          <div>
            <h1 className="text-lg font-bold leading-tight">חמ"ל דיווחים</h1>
            <p className="text-xs text-zinc-500">
              {storage.mode === 'supabase' ? 'מחובר לענן · סנכרון בזמן אמת' : 'מצב מקומי · נתונים בדפדפן'}
            </p>
          </div>
        </div>

        {session && (
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-2 rounded-full bg-zinc-800 px-3 py-1.5 text-sm sm:flex">
              {session.role === 'haml' ? (
                <>
                  <ShieldCheck size={16} className="text-blue-400" /> חמ"ל
                </>
              ) : (
                <>
                  <User size={16} className="text-emerald-400" /> {session.name}
                </>
              )}
            </span>
            <button
              onClick={() => toggleReminders(!enabled)}
              className="btn-ghost !px-3 !py-2"
              title={enabled ? 'תזכורות מופעלות' : 'תזכורות מושבתות'}
            >
              {enabled ? <Bell size={18} /> : <BellOff size={18} className="text-zinc-600" />}
            </button>
            <button onClick={handleLogout} className="btn-ghost !px-3 !py-2" title="התנתקות">
              <LogOut size={18} />
              <span className="hidden sm:inline">יציאה</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
