import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '@/store/useAuth';
import type { Role } from '@/types';
import Login from '@/pages/Login';
import CoordinatorReport from '@/pages/CoordinatorReport';
import HamlDashboard from '@/pages/HamlDashboard';
import BranchesAdmin from '@/pages/BranchesAdmin';
import Privacy from '@/pages/Privacy';

/** הגנת מסלול לפי תפקיד. מפנה לכניסה אם אין הרשאה. */
function Protected({ role, children }: { role: Role; children: React.ReactNode }) {
  const session = useAuth((s) => s.session);
  if (!session) return <Navigate to="/" replace />;
  if (session.role !== role) {
    return <Navigate to={session.role === 'haml' ? '/haml' : '/report'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const session = useAuth((s) => s.session);
  const ready = useAuth((s) => s.ready);
  const init = useAuth((s) => s.init);

  useEffect(() => init(), [init]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-950 text-slate-400">
        <div className="animate-pulse text-sm">טוען…</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/privacy" element={<Privacy />} />
      <Route
        path="/"
        element={
          session ? (
            <Navigate to={session.role === 'haml' ? '/haml' : '/report'} replace />
          ) : (
            <Login />
          )
        }
      />
      <Route
        path="/report"
        element={
          <Protected role="coordinator">
            <CoordinatorReport />
          </Protected>
        }
      />
      <Route
        path="/haml"
        element={
          <Protected role="haml">
            <HamlDashboard />
          </Protected>
        }
      />
      <Route
        path="/branches"
        element={
          <Protected role="haml">
            <BranchesAdmin />
          </Protected>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
