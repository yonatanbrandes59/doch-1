import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { Header } from '@/components/Header';
import { useData } from '@/store/useData';
import type { Branch } from '@/types';

export default function BranchesAdmin() {
  const { branches, reports, addBranch, editBranch, removeBranch, init } = useData();
  const [name, setName] = useState('');
  const [camp, setCamp] = useState('');
  const [phone, setPhone] = useState('');
  const [editing, setEditing] = useState<Branch | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => init(), [init]);

  const reportCount = (id: string) => reports.filter((r) => r.branchId === id).length;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !camp.trim()) return;
    setBusy(true);
    try {
      if (editing) {
        await editBranch(editing.id, { name: name.trim(), region: editing.region, camp: camp.trim(), phone: phone.trim() || undefined });
      } else {
        await addBranch({ name: name.trim(), region: 'אחר', camp: camp.trim(), phone: phone.trim() || undefined });
      }
      reset();
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setName('');
    setCamp('');
    setPhone('');
    setEditing(null);
  };

  const startEdit = (b: Branch) => {
    setEditing(b);
    setName(b.name);
    setCamp(b.camp ?? '');
    setPhone(b.phone ?? '');
  };

  const handleDelete = async (b: Branch) => {
    const n = reportCount(b.id);
    const msg =
      n > 0
        ? `למחוק את הסניף "${b.name}"? פעולה זו תמחק גם ${n} דיווחים.`
        : `למחוק את הסניף "${b.name}"?`;
    if (confirm(msg)) await removeBranch(b.id);
  };

  return (
    <div className="min-h-screen">
      <Header />
      <main className="mx-auto max-w-4xl px-4 py-6">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">ניהול סניפים</h2>
            <p className="text-sm text-slate-400">{branches.length} סניפים רשומים</p>
          </div>
          <Link to="/haml" className="btn-ghost">
            <ArrowRight size={18} /> חזרה ללוח
          </Link>
        </div>

        {/* טופס הוספה/עריכה */}
        <form onSubmit={submit} className="card mb-5 p-5 animate-fade-in">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-300">
            {editing ? <Pencil size={16} /> : <Plus size={16} />}
            {editing ? 'עריכת סניף' : 'הוספת סניף'}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">שם הסניף</label>
              <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="לדוגמה: כפר סבא" />
            </div>
            <div>
              <label className="label">מחנון</label>
              <input className="input" value={camp} onChange={(e) => setCamp(e.target.value)} placeholder="לדוגמה: מחנה א'" />
            </div>
            <div className="sm:col-span-2">
              <label className="label">מספר טלפון רכז (אופציונלי)</label>
              <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="לדוגמה: 0501234567" />
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button type="submit" className="btn-primary" disabled={busy}>
              {editing ? 'שמירה' : 'הוספה'}
            </button>
            {editing && (
              <button type="button" onClick={reset} className="btn-ghost">
                <X size={18} /> ביטול
              </button>
            )}
          </div>
        </form>

        {/* רשימת סניפים */}
        <div className="card divide-y divide-slate-800">
          {branches.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-3 p-4">
              <div className="flex items-center gap-3">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-800 text-slate-400">
                  <Building2 size={18} />
                </div>
                <div>
                  <div className="font-medium">{b.name}</div>
                  <div className="text-xs text-slate-500">
                    {b.camp ?? b.region} · {reportCount(b.id)} דיווחים
                  </div>
                </div>
              </div>
              <div className="flex gap-1.5">
                <button onClick={() => startEdit(b)} className="btn-ghost !px-2.5 !py-2" title="עריכה">
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(b)} className="btn-danger !px-2.5 !py-2" title="מחיקה">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {branches.length === 0 && (
            <div className="py-10 text-center text-sm text-slate-500">אין סניפים. הוסף/י סניף ראשון למעלה.</div>
          )}
        </div>
      </main>
    </div>
  );
}
