import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { useData } from '@/store/useData';
import { Logo } from '@/components/Logo';
import { cx } from '@/lib/utils';

type Tab = 'coordinator' | 'haml';

export default function Login() {
  const navigate = useNavigate();
  const { loginCoordinator, loginHaml } = useAuth();
  const { branches, init } = useData();
  const [tab, setTab] = useState<Tab>('coordinator');

  // רכז
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  // חמ"ל
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => init(), [init]);

  const submitCoordinator = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || !branchId) {
      setError('יש למלא שם ולבחור סניף');
      return;
    }
    loginCoordinator(name, branchId);
    navigate('/report');
  };

  const submitHaml = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!loginHaml(code)) {
      setError('קוד שגוי');
      return;
    }
    navigate('/haml');
  };

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <Logo size={72} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">חמ"ל דיווחים</h1>
          <p className="text-sm text-slate-400">תנועת הנוער של האיחוד החקלאי</p>
        </div>

        <div className="card p-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <TabButton active={tab === 'coordinator'} onClick={() => setTab('coordinator')} icon={<User size={18} />}>
              רכז סניף
            </TabButton>
            <TabButton active={tab === 'haml'} onClick={() => setTab('haml')} icon={<ShieldCheck size={18} />}>
              חמ"ל
            </TabButton>
          </div>
        </div>

        <div className="card mt-4 p-6">
          {tab === 'coordinator' ? (
            <form onSubmit={submitCoordinator} className="space-y-4">
              <div>
                <label className="label">שם הרכז</label>
                <input
                  className="input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="לדוגמה: דנה כהן"
                  autoFocus
                />
              </div>
              <div>
                <label className="label">סניף</label>
                <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                  <option value="">בחר/י סניף…</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} · {b.region}
                    </option>
                  ))}
                </select>
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                כניסה לדיווח
              </button>
            </form>
          ) : (
            <form onSubmit={submitHaml} className="space-y-4">
              <div>
                <label className="label">קוד כניסה לחמ"ל</label>
                <input
                  className="input text-center tracking-[0.5em] text-lg"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="••••"
                  inputMode="numeric"
                  autoFocus
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button type="submit" className="btn-primary w-full">
                כניסה ללוח הבקרה
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors',
        active ? 'bg-blue-600 text-white' : 'text-slate-400 hover:bg-slate-800',
      )}
    >
      {icon}
      {children}
    </button>
  );
}
