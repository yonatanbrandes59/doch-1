import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User } from 'lucide-react';
import { useAuth } from '@/store/useAuth';
import { useData } from '@/store/useData';
import { Logo } from '@/components/Logo';
import { storage } from '@/lib/storage';
import { cx } from '@/lib/utils';

type Tab = 'coordinator' | 'haml';

export default function Login() {
  const navigate = useNavigate();
  const isCloud = storage.mode === 'supabase';

  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-b from-slate-950 to-slate-900 p-4">
      <div className="w-full max-w-md animate-fade-in">
        <div className="mb-6 text-center">
          <Logo size={72} className="mx-auto mb-3" />
          <h1 className="text-2xl font-bold">חמ"ל דיווחים</h1>
          <p className="text-sm text-slate-400">תנועת הנוער של האיחוד החקלאי</p>
        </div>

        {isCloud ? <CloudLogin navigate={navigate} /> : <LocalLogin navigate={navigate} />}

        <p className="mt-5 text-center text-xs text-slate-500">
          בכניסה למערכת הינך מאשר/ת את{' '}
          <Link to="/privacy" className="text-blue-400 hover:underline">
            מדיניות הפרטיות
          </Link>
          .
        </p>
      </div>
    </div>
  );
}

/** התחברות פרודקשן: אימייל + סיסמה עם טאבים הרשמה/כניסה. */
function CloudLogin({ navigate }: { navigate: (to: string) => void }) {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  return (
    <>
      <div className="card p-1.5 mb-4">
        <div className="grid grid-cols-2 gap-1.5">
          <TabButton active={tab === 'login'} onClick={() => setTab('login')}>
            כניסה
          </TabButton>
          <TabButton active={tab === 'register'} onClick={() => setTab('register')}>
            הרשמה
          </TabButton>
        </div>
      </div>
      {tab === 'login' ? <CloudLoginForm navigate={navigate} /> : <CloudRegisterForm navigate={navigate} />}
    </>
  );
}

function CloudLoginForm({ navigate }: { navigate: (to: string) => void }) {
  const { signIn } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submitPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim()) {
      setError('יש להקליד מספר טלפון');
      return;
    }
    setBusy(true);
    try {
      const err = await signIn(phone);
      if (err) {
        setError(err);
        return;
      }
      setStep('otp');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('יש להקליד את הקוד');
      return;
    }
    setBusy(true);
    try {
      const err = await signIn(phone, code);
      if (err) {
        setError(err);
        return;
      }
      const role = useAuth.getState().session?.role;
      navigate(role === 'haml' ? '/haml' : '/report');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="card p-6">
        <form onSubmit={submitOtp} className="space-y-4">
          <p className="text-sm text-slate-300">שלחנו קוד SMS למספר {phone}</p>
          <div>
            <label className="label">קוד אימות</label>
            <input
              className="input text-center tracking-[0.5em] text-lg"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              maxLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('phone')} className="btn-secondary flex-1">
              חזור
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? 'בדיקה…' : 'כניסה'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <form onSubmit={submitPhone} className="space-y-4">
        <div>
          <label className="label">מספר טלפון</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972512345678"
            dir="ltr"
            autoFocus
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'שליחה…' : 'שלח קוד'}
        </button>
      </form>
    </div>
  );
}

function CloudRegisterForm({ navigate }: { navigate: (to: string) => void }) {
  const { register } = useAuth();
  const { branches, init } = useData();
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => init(), [init]);

  const submitDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!phone.trim() || !name.trim() || !branchId) {
      setError('יש למלא את כל השדות ולבחור סניף');
      return;
    }
    setBusy(true);
    try {
      const err = await register(phone, name, branchId);
      if (err) {
        setError(err);
        return;
      }
      setStep('otp');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!code.trim()) {
      setError('יש להקליד את הקוד');
      return;
    }
    setBusy(true);
    try {
      const err = await register(phone, name, branchId, code);
      if (err) {
        setError(err);
        return;
      }
      navigate('/report');
    } finally {
      setBusy(false);
    }
  };

  if (step === 'otp') {
    return (
      <div className="card p-6">
        <form onSubmit={submitOtp} className="space-y-4">
          <p className="text-sm text-slate-300">שלחנו קוד SMS למספר {phone}</p>
          <div>
            <label className="label">קוד אימות</label>
            <input
              className="input text-center tracking-[0.5em] text-lg"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
              inputMode="numeric"
              autoFocus
              maxLength={6}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={() => setStep('details')} className="btn-secondary flex-1">
              חזור
            </button>
            <button type="submit" className="btn-primary flex-1" disabled={busy}>
              {busy ? 'בדיקה…' : 'אימות'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <form onSubmit={submitDetails} className="space-y-4">
        <div>
          <label className="label">שם מלא</label>
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="לדוגמה: דנה כהן"
            autoFocus
          />
        </div>
        <div>
          <label className="label">מספר טלפון</label>
          <input
            className="input"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+972512345678"
            dir="ltr"
          />
        </div>
        <div>
          <label className="label">סניף</label>
          <select className="input" value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">בחר/י סניף…</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} · {b.camp || b.region}
              </option>
            ))}
          </select>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'שליחה…' : 'שלח קוד'}
        </button>
      </form>
    </div>
  );
}

/** התחברות מקומית (dev): רכז (שם+סניף) או חמ"ל (קוד). */
function LocalLogin({ navigate }: { navigate: (to: string) => void }) {
  const { loginCoordinator, loginHaml } = useAuth();
  const { branches, init } = useData();
  const [tab, setTab] = useState<Tab>('coordinator');

  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState('');
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
    <>
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
      <p className="mt-3 text-center text-xs text-slate-600">מצב פיתוח מקומי — נתונים נשמרים בדפדפן</p>
    </>
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
  icon?: React.ReactNode;
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
