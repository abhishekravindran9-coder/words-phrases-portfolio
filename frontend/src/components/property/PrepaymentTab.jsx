import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, XMarkIcon, TrashIcon, BoltIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { propertyService } from '../../services/propertyService';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  if (!d) return '—';
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const EMPTY = { amount: '', prepaymentDate: '', prepaymentType: 'REDUCE_TENURE' };

export default function PrepaymentTab({ propertyId }) {
  const [prepayments, setPrepayments]   = useState([]);
  const [loan, setLoan]                 = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
  const [deletingId, setDeletingId]     = useState(null);
  const [simulation, setSimulation]     = useState(null);
  const [simEntries, setSimEntries]     = useState([{ ...EMPTY }]);
  const [simulating, setSimulating]     = useState(false);

  const addSimEntry    = ()  => setSimEntries(prev => [...prev, { ...EMPTY }]);
  const removeSimEntry = (i) => setSimEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateSimEntry = (i, field, value) =>
    setSimEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: value } : e));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pp, ln] = await Promise.allSettled([
        propertyService.getPrepayments(propertyId),
        propertyService.getLoan(propertyId),
      ]);
      setPrepayments(pp.status === 'fulfilled' ? pp.value : []);
      setLoan(ln.status === 'fulfilled' ? ln.value : null);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.amount) return toast.error('Amount required');
    setSaving(true);
    try {
      await propertyService.addPrepayment(propertyId, {
        amount: parseFloat(form.amount),
        prepaymentDate: form.prepaymentDate || null,
        prepaymentType: form.prepaymentType,
      });
      toast.success('Prepayment recorded');
      setShowAdd(false);
      setForm(EMPTY);
      load();
    } catch {
      toast.error('Failed to save prepayment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this prepayment?')) return;
    setDeletingId(id);
    try {
      await propertyService.deletePrepayment(propertyId, id);
      toast.success('Prepayment deleted');
      load();
    } catch {
      toast.error('Failed to delete prepayment');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSimulate = async (e) => {
    e.preventDefault();
    if (simEntries.some(en => !en.amount)) return toast.error('Each entry needs an amount');
    setSimulating(true);
    try {
      const payload = simEntries.map(en => ({
        amount: parseFloat(en.amount),
        prepaymentDate: en.prepaymentDate || null,
        prepaymentType: en.prepaymentType,
      }));
      setSimulation(await propertyService.simulate(propertyId, payload));
    } catch (err) {
      if (err?.response?.status === 404) {
        toast.error('Add a loan first to run simulations');
      } else {
        toast.error('Simulation failed');
      }
    } finally {
      setSimulating(false);
    }
  };

  const total    = prepayments.reduce((s, p) => s + (p.amount || 0), 0);
  const sanctioned = loan?.sanctionedAmount ?? 0;
  const totalPct = sanctioned > 0 ? Math.min(100, (total / sanctioned) * 100) : 0;

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  return (
    <div className="space-y-6">

      {/* ── Summary banner (only when prepayments exist + loan loaded) ─────── */}
      {prepayments.length > 0 && loan && (
        <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800/50 p-4 space-y-3">
          {/* Top row: headline + badge */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  ₹{fmt(total)} prepaid
                </p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  across {prepayments.length} {prepayments.length === 1 ? 'prepayment' : 'prepayments'}
                </p>
              </div>
            </div>
            {sanctioned > 0 && (
              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                {totalPct.toFixed(1)}% of principal
              </span>
            )}
          </div>

          {/* Principal reduction bar */}
          {sanctioned > 0 && (
            <div>
              <div className="h-2 bg-emerald-100 dark:bg-emerald-900/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all"
                  style={{ width: `${totalPct}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-emerald-600 dark:text-emerald-500 mt-0.5">
                <span>₹0</span>
                <span>₹{fmt(sanctioned)} principal</span>
              </div>
            </div>
          )}

          {/* 3 impact stats */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Interest Saved',  value: `₹${fmt(loan.interestSaved)}`,  sub: loan.interestSaved > 0 ? `${Math.round((loan.interestSaved / loan.originalTotalInterest) * 100)}% cut` : null },
              { label: 'Months Saved',    value: loan.monthsSaved > 0 ? `${loan.monthsSaved} mo` : '—', sub: loan.actualClosureDate ? `Closes ${fmtDate(loan.actualClosureDate)}` : null },
              { label: 'Avg Prepayment',  value: `₹${fmt(Math.round(total / prepayments.length))}`, sub: 'per entry' },
            ].map(({ label, value, sub }) => (
              <div key={label} className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
                <p className="text-base font-extrabold text-emerald-700 dark:text-emerald-400 mt-0.5">{value}</p>
                {sub && <p className="text-[10px] text-emerald-600 dark:text-emerald-500 leading-tight">{sub}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Prepayment List ───────────────────────────────────────────────── */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold text-gray-700 dark:text-gray-300">
            Recorded Prepayments
          </h3>
          <Button size="sm" onClick={() => setShowAdd(v => !v)}>
            {showAdd ? <><XMarkIcon className="h-4 w-4" /> Cancel</> : <><PlusIcon className="h-4 w-4" /> Add</>}
          </Button>
        </div>

        {/* Add form */}
        {showAdd && (
          <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New Prepayment</p>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="e.g. 200000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={form.prepaymentDate}
                  onChange={(e) => setForm({ ...form, prepaymentDate: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Strategy</label>
                <select
                  value={form.prepaymentType}
                  onChange={(e) => setForm({ ...form, prepaymentType: e.target.value })}
                  className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                >
                  <option value="REDUCE_TENURE">Reduce Tenure</option>
                  <option value="REDUCE_EMI">Reduce EMI</option>
                </select>
              </div>
            </div>
            {form.prepaymentType === 'REDUCE_TENURE' && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg px-3 py-1.5">
                ⚡ Reduce Tenure keeps the EMI the same but shortens the loan — maximises interest savings.
              </p>
            )}
            {form.prepaymentType === 'REDUCE_EMI' && (
              <p className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded-lg px-3 py-1.5">
                📉 Reduce EMI lowers your monthly payment — useful if you need more cash flow each month.
              </p>
            )}
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => { setShowAdd(false); setForm(EMPTY); }}>Cancel</Button>
              <Button type="submit" size="sm" loading={saving}>Save Prepayment</Button>
            </div>
          </form>
        )}

        {prepayments.length === 0 ? (
          <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
            <p className="text-2xl mb-2">💳</p>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No prepayments recorded yet</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Prepaying reduces interest significantly — even one lump sum helps.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {prepayments.map((p, idx) => {
              const pct = sanctioned > 0 ? ((p.amount / sanctioned) * 100).toFixed(1) : null;
              const isReduceEmi = p.prepaymentType === 'REDUCE_EMI';
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3"
                >
                  {/* Serial */}
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">#{idx + 1}</span>
                  </div>

                  {/* Main info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-gray-800 dark:text-gray-100 text-base">₹{fmt(p.amount)}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        isReduceEmi
                          ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                          : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                      }`}>
                        {isReduceEmi ? '📉 Reduce EMI' : '⚡ Reduce Tenure'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-gray-400 dark:text-gray-500">{fmtDate(p.prepaymentDate)}</span>
                      {pct && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">{pct}% of principal</span>
                      )}
                    </div>
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                    className="p-1.5 rounded-lg text-gray-300 dark:text-gray-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-40"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Prepayment Simulator ──────────────────────────────────────────── */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BoltIcon className="h-4 w-4 text-primary-500" />
            <h3 className="font-semibold text-gray-700 dark:text-gray-300">Prepayment Simulator</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Simulate prepayments — see the impact on interest and tenure without recording them.
          </p>
        </div>

        <form onSubmit={handleSimulate} className="bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-2xl p-4 space-y-3">
          {simEntries.map((en, i) => (
            <div key={i} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-3 space-y-2 sm:space-y-0 sm:bg-transparent sm:dark:bg-transparent sm:border-0 sm:p-0 sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-2 sm:items-center">
              <div className="flex items-center gap-2 sm:contents">
                <div className="flex-1 sm:contents">
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 sm:hidden">Amount (₹) *</label>
                  <input
                    type="number"
                    value={en.amount}
                    onChange={(e) => updateSimEntry(i, 'amount', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    placeholder="e.g. 500000"
                  />
                </div>
                <button type="button" onClick={() => simEntries.length > 1 && removeSimEntry(i)}
                  className={`sm:hidden p-1.5 rounded-lg shrink-0 transition-colors ${simEntries.length > 1 ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-200 dark:text-gray-600 cursor-not-allowed'}`}>
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:contents">
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 sm:hidden">Date</label>
                  <input type="date" value={en.prepaymentDate} onChange={(e) => updateSimEntry(i, 'prepaymentDate', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                </div>
                <div className="sm:contents">
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 sm:hidden">Strategy</label>
                  <select value={en.prepaymentType} onChange={(e) => updateSimEntry(i, 'prepaymentType', e.target.value)}
                    className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                    <option value="REDUCE_TENURE">Reduce Tenure</option>
                    <option value="REDUCE_EMI">Reduce EMI</option>
                  </select>
                </div>
              </div>
              <button type="button" onClick={() => simEntries.length > 1 && removeSimEntry(i)}
                className={`hidden sm:block p-1.5 rounded-lg transition-colors ${simEntries.length > 1 ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-gray-200 dark:text-gray-700 cursor-not-allowed'}`}>
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <button type="button" onClick={addSimEntry}
              className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline">
              <PlusIcon className="h-4 w-4" /> Add another prepayment
            </button>
            <Button type="submit" variant="secondary" size="sm" loading={simulating} className="w-full sm:w-auto">Run Simulation</Button>
          </div>
        </form>

        {simulation && (() => {
          const isReduceEmi = simulation.monthlyEmiSaving != null && simulation.monthlyEmiSaving > 0;
          const roi = simulation.totalPrepaymentAmount > 0
            ? (simulation.interestSaved / simulation.totalPrepaymentAmount * 100).toFixed(0)
            : null;
          const roiPerRupee = simulation.totalPrepaymentAmount > 0
            ? (simulation.interestSaved / simulation.totalPrepaymentAmount).toFixed(2)
            : null;
          const totalSaved = simulation.originalTotalOutflow - simulation.newTotalOutflow;

          return (
            <div className="space-y-4">

              {/* ── Current Snapshot ── */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4">
                <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-3">Current Loan Snapshot</p>
                {simulation.originalTenureMonths > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-nowrap">
                      <span className="font-bold">{simulation.monthsElapsed}</span> of {simulation.originalTenureMonths} EMIs paid
                    </span>
                    <div className="flex-1 h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full">
                      <div className="h-1.5 bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round(simulation.monthsElapsed / simulation.originalTenureMonths * 100))}%` }} />
                    </div>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {Math.round(simulation.monthsElapsed / simulation.originalTenureMonths * 100)}%
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Balance',       value: `₹${fmt(simulation.currentOutstanding)}` },
                    { label: 'Interest Pd.', value: `₹${fmt(simulation.interestAlreadyPaid)}` },
                    { label: 'Principal Pd.', value: `₹${fmt(simulation.principalAlreadyPaid)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-indigo-900/30 rounded-xl p-2 text-center">
                      <p className="text-[10px] text-indigo-500 dark:text-indigo-400 mb-0.5">{label}</p>
                      <p className="font-bold text-indigo-800 dark:text-indigo-200 text-xs sm:text-sm break-all">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="text-sm text-indigo-700 dark:text-indigo-300 bg-white/60 dark:bg-indigo-900/40 rounded-xl px-3 py-2">
                  Simulating <span className="font-bold">₹{fmt(simulation.totalPrepaymentAmount)}</span> → outstanding drops to{' '}
                  <span className="font-bold">~₹{fmt(simulation.principalAfterPrepayments)}</span>
                </div>
              </div>

              {/* ── Before vs After table ── */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide"></span>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">Without</span>
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide text-right">With Prepayment</span>
                </div>
                {[
                  { label: 'Monthly EMI', before: `₹${fmt(simulation.originalEmi)}`, after: `₹${fmt(simulation.newEmi)}`, badge: isReduceEmi && simulation.monthlyEmiSaving > 0 ? `↓₹${fmt(simulation.monthlyEmiSaving)}` : null, green: isReduceEmi && simulation.monthlyEmiSaving > 0 },
                  { label: 'Months left', before: `${simulation.originalMonthsRemaining} mo`, after: `${simulation.newMonthsRemaining} mo`, badge: simulation.monthsSaved > 0 ? `↓${simulation.monthsSaved} mo` : null, green: simulation.monthsSaved > 0 },
                  { label: 'Closes on', before: simulation.originalClosureDate, after: simulation.newClosureDate, green: simulation.monthsSaved > 0 },
                  { label: 'Future interest', before: `₹${fmt(simulation.originalTotalInterest)}`, after: `₹${fmt(simulation.newTotalInterest)}`, redBefore: true, green: true },
                  { label: 'Total outflow', sublabel: 'principal + interest', before: `₹${fmt(simulation.originalTotalOutflow)}`, after: `₹${fmt(simulation.newTotalOutflow)}`, bold: true, green: true },
                ].map(({ label, sublabel, before, after, badge, green, redBefore, bold }, idx) => (
                  <div key={label} className={`grid grid-cols-3 px-3 py-2.5 gap-1 items-start ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-700/20'} border-b border-gray-100 dark:border-gray-700/50 last:border-0`}>
                    <div className="min-w-0">
                      <p className={`text-xs text-gray-600 dark:text-gray-400 leading-snug ${bold ? 'font-semibold' : ''}`}>{label}</p>
                      {sublabel && <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{sublabel}</p>}
                    </div>
                    <p className={`text-xs text-right ${bold ? 'font-bold' : 'font-semibold'} ${redBefore ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'} break-all`}>{before}</p>
                    <div className="text-right">
                      <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${green ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-700 dark:text-gray-300'} break-all`}>{after}</span>
                      {badge && <span className="block text-[10px] font-medium text-emerald-500 dark:text-emerald-400">{badge}</span>}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── Interest comparison bars ── */}
              {simulation.originalTotalInterest > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Interest Comparison</p>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-red-500 dark:text-red-400 font-medium">Without prepayment</span>
                        <span className="text-red-500 dark:text-red-400 font-semibold">₹{fmt(simulation.originalTotalInterest)}</span>
                      </div>
                      <div className="h-3 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">With prepayment</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{fmt(simulation.newTotalInterest)}</span>
                      </div>
                      <div className="h-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                          style={{ width: `${Math.round((simulation.newTotalInterest / simulation.originalTotalInterest) * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ── Savings callout ── */}
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-4 space-y-2">
                <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Your Savings</p>

                {isReduceEmi && simulation.monthlyEmiSaving > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">Monthly EMI reduction</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">−₹{fmt(simulation.monthlyEmiSaving)}/mo</span>
                  </div>
                )}
                {simulation.monthsSaved > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-emerald-700 dark:text-emerald-300">Loan closes earlier</span>
                    <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{simulation.monthsSaved} months sooner</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-emerald-700 dark:text-emerald-300">Total outflow reduction</span>
                  <span className="text-sm font-bold text-emerald-700 dark:text-emerald-300">−₹{fmt(totalSaved)}</span>
                </div>
                <div className="flex justify-between items-center border-t border-emerald-200 dark:border-emerald-700 pt-2 mt-1">
                  <div>
                    <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">Interest saved</span>
                    {simulation.originalTotalInterest > 0 && (
                      <span className="ml-2 text-xs bg-emerald-200 dark:bg-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-full px-2 py-0.5">
                        {Math.round(simulation.interestSaved / simulation.originalTotalInterest * 100)}% of total
                      </span>
                    )}
                  </div>
                  <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300">₹{fmt(simulation.interestSaved)}</span>
                </div>

                {/* ROI line */}
                {roi && (
                  <div className="bg-white/60 dark:bg-emerald-900/30 rounded-xl px-3 py-2 flex items-center justify-between mt-1">
                    <span className="text-xs text-emerald-700 dark:text-emerald-300">Return on prepayment</span>
                    <span className="text-sm font-bold text-emerald-800 dark:text-emerald-200">
                      {roi}% · ₹{roiPerRupee} saved per ₹1
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
