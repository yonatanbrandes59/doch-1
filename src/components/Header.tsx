import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Cloud, HardDrive, LogOut, ShieldCheck, User } from 'lucide-react';
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

  const isCloud = storage.mode === 'supabase';

  return (
    <header className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        {/* לוגו + כותרת */}
        <div className="flex items-center gap-3">
          <Logo size={40} className="rounded-xl" />
          <div>
            <h1 className="text-lg font-bold leading-tight tracking-tight">חמ"ל דוח 1</h1>
            <p className="text-xs text-slate-500 leading-tight">תנועת הנוער של האיחוד החקלאי</p>
          </div>
        </div>

        {/* צד שמאל: מצב + כפתורים */}
        <div className="flex items-center gap-2">
          {/* אינדיקטור מצב */}
          <span className={`hidden items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs sm:flex ${
            isCloud
              ? 'border-brand-500/30 bg-brand-600/10 text-brand-400'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-400'
          }`}>
            {isCloud ? <Cloud size={13} /> : <HardDrive size={13} />}
            {isCloud ? 'ענן' : 'דמו'}
          </span>

          {session && (
            <>
              <span className="hidden items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-sm sm:flex">
                {session.role === 'haml' ? (
                  <>
                    <ShieldCheck size={16} className="text-brand-400" /> חמ"ל
                  </>
                ) : (
                  <>
                    <User size={16} className="text-brand-400" /> {session.name}
                  </>
                )}
              </span>
              <button
                onClick={() => toggleReminders(!enabled)}
                className="btn-ghost !px-3 !py-2"
                title={enabled ? 'תזכורות מופעלות' : 'תזכורות מושבתות'}
              >
                {enabled ? <Bell size={18} /> : <BellOff size={18} className="text-slate-600" />}
              </button>
              <button onClick={handleLogout} className="btn-ghost !px-3 !py-2" title="התנתקות">
                <LogOut size={18} />
                <span className="hidden sm:inline">יציאה</span>
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
