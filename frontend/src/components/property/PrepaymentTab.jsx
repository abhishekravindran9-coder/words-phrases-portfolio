import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { propertyService } from '../../services/propertyService';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const EMPTY = { amount: '', prepaymentDate: '', prepaymentType: 'REDUCE_TENURE' };

export default function PrepaymentTab({ propertyId }) {
  const [prepayments, setPrepayments]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [form, setForm]                 = useState(EMPTY);
  const [saving, setSaving]             = useState(false);
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
      setPrepayments(await propertyService.getPrepayments(propertyId));
    } catch (err) {
      if (err?.response?.status !== 404) toast.error('Failed to load prepayments');
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
      const result = await propertyService.simulate(propertyId, payload);
      setSimulation(result);
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

  const total = prepayments.reduce((s, p) => s + (p.amount || 0), 0);

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  return (
    <div className="space-y-6">
      {/* Prepayment List */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-700 dark:text-gray-300">
            Prepayments
            {total > 0 && <span className="ml-2 text-sm text-primary-600 dark:text-primary-400">₹{fmt(total)} total</span>}
          </h3>
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <PlusIcon className="h-4 w-4" /> Add
          </Button>
        </div>

        {showAdd && (
          <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                  placeholder="e.g. 200000"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date</label>
                <input
                  type="date"
                  value={form.prepaymentDate}
                  onChange={(e) => setForm({ ...form, prepaymentDate: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select
                  value={form.prepaymentType}
                  onChange={(e) => setForm({ ...form, prepaymentType: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                >
                  <option value="REDUCE_TENURE">Reduce Tenure</option>
                  <option value="REDUCE_EMI">Reduce EMI</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
              <Button type="submit" size="sm" loading={saving}>Save</Button>
            </div>
          </form>
        )}

        {prepayments.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-6 text-center">No prepayments recorded yet</p>
        ) : (
          <div className="space-y-2">
            {prepayments.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">₹{fmt(p.amount)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{p.prepaymentDate} · {p.prepaymentType === 'REDUCE_EMI' ? 'Reduce EMI' : 'Reduce Tenure'}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prepayment Simulator */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
        <h3 className="font-medium text-gray-700 dark:text-gray-300 mb-3">Prepayment Simulator</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Simulate one or more prepayments together — see the combined impact on interest and tenure without recording them.
        </p>
        <form onSubmit={handleSimulate} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-3">
          {simEntries.map((en, i) => (
            // Mobile: card per entry  |  sm+: inline row
            <div key={i} className="bg-white dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600 p-3 space-y-2 sm:space-y-0 sm:bg-transparent sm:dark:bg-transparent sm:border-0 sm:p-0 sm:grid sm:grid-cols-[1fr_1fr_1fr_auto] sm:gap-2 sm:items-center">
              {/* Row 1 on mobile: Amount + remove button */}
              <div className="flex items-center gap-2 sm:contents">
                <div className="flex-1 sm:contents">
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 sm:hidden">Amount (₹) *</label>
                  <input
                    type="number"
                    value={en.amount}
                    onChange={(e) => updateSimEntry(i, 'amount', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
                    placeholder="e.g. 500000"
                  />
                </div>
                {/* Remove button — visible on mobile inside card header */}
                <button
                  type="button"
                  onClick={() => simEntries.length > 1 && removeSimEntry(i)}
                  className={`sm:hidden p-1.5 rounded-lg shrink-0 transition-colors ${
                    simEntries.length > 1
                      ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                      : 'text-gray-200 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>

              {/* Row 2 on mobile: Date + Type side by side */}
              <div className="grid grid-cols-2 gap-2 sm:contents">
                <div className="sm:contents">
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 sm:hidden">Date</label>
                  <input
                    type="date"
                    value={en.prepaymentDate}
                    onChange={(e) => updateSimEntry(i, 'prepaymentDate', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:contents">
                  <label className="block text-xs font-medium text-gray-400 dark:text-gray-500 mb-1 sm:hidden">Type</label>
                  <select
                    value={en.prepaymentType}
                    onChange={(e) => updateSimEntry(i, 'prepaymentType', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white px-3 py-2 text-sm"
                  >
                    <option value="REDUCE_TENURE">Reduce Tenure</option>
                    <option value="REDUCE_EMI">Reduce EMI</option>
                  </select>
                </div>
              </div>

              {/* Remove button — desktop only (in grid column) */}
              <button
                type="button"
                onClick={() => simEntries.length > 1 && removeSimEntry(i)}
                className={`hidden sm:block p-1.5 rounded-lg transition-colors ${
                  simEntries.length > 1
                    ? 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                    : 'text-gray-200 dark:text-gray-700 cursor-not-allowed'
                }`}
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={addSimEntry}
              className="flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
            >
              <PlusIcon className="h-4 w-4" /> Add another prepayment
            </button>
            <Button type="submit" variant="secondary" size="sm" loading={simulating} className="w-full sm:w-auto">Run Simulation</Button>
          </div>
        </form>

        {simulation && (() => {
          const isReduceEmi = simulation.monthlyEmiSaving != null && simulation.monthlyEmiSaving > 0;
          return (
            <div className="mt-5 space-y-4">

              {/* ── 1. Current Loan Snapshot ─────────────────────────────── */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
                <p className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wide mb-3">
                  Current Loan Snapshot
                </p>

                {/* Progress bar */}
                {simulation.originalTenureMonths > 0 && (
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-sm text-indigo-800 dark:text-indigo-300 whitespace-nowrap">
                      <span className="font-bold">{simulation.monthsElapsed}</span> of {simulation.originalTenureMonths} EMIs paid
                    </span>
                    <div className="flex-1 h-1.5 bg-indigo-200 dark:bg-indigo-900 rounded-full">
                      <div
                        className="h-1.5 bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round(simulation.monthsElapsed / simulation.originalTenureMonths * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 whitespace-nowrap">
                      {Math.round(simulation.monthsElapsed / simulation.originalTenureMonths * 100)}%
                    </span>
                  </div>
                )}

                {/* 3 stat boxes */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {[
                    { label: 'Balance', value: `₹${fmt(simulation.currentOutstanding)}` },
                    { label: 'Interest Pd.', value: `₹${fmt(simulation.interestAlreadyPaid)}` },
                    { label: 'Principal Pd.', value: `₹${fmt(simulation.principalAlreadyPaid)}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="bg-white dark:bg-indigo-900/30 rounded-lg p-2 text-center">
                      <p className="text-[10px] leading-tight text-indigo-500 dark:text-indigo-400 mb-0.5">{label}</p>
                      <p className="font-bold text-indigo-800 dark:text-indigo-200 text-xs sm:text-sm break-all">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Prepayment impact summary */}
                <div className="text-sm text-indigo-700 dark:text-indigo-300 bg-white/60 dark:bg-indigo-900/40 rounded-lg px-3 py-2">
                  Simulating{' '}
                  <span className="font-bold">₹{fmt(simulation.totalPrepaymentAmount)}</span>
                  {' '}in prepayments → outstanding drops to{' '}
                  <span className="font-bold">~₹{fmt(simulation.principalAfterPrepayments)}</span>
                </div>
              </div>

              {/* ── 2. Before vs After ───────────────────────────────────── */}
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Header row */}
                <div className="grid grid-cols-3 bg-gray-50 dark:bg-gray-700/50 px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide"></span>
                  <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide text-right">Without</span>
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 uppercase tracking-wide text-right">With Prepayment</span>
                </div>

                {/* Rows */}
                {[
                  {
                    label: 'Monthly EMI',
                    before: `₹${fmt(simulation.originalEmi)}`,
                    after: `₹${fmt(simulation.newEmi)}`,
                    badge: isReduceEmi && simulation.monthlyEmiSaving > 0 ? `↓₹${fmt(simulation.monthlyEmiSaving)}` : null,
                    green: isReduceEmi && simulation.monthlyEmiSaving > 0,
                  },
                  {
                    label: 'Months left',
                    before: `${simulation.originalMonthsRemaining} mo`,
                    after: `${simulation.newMonthsRemaining} mo`,
                    badge: simulation.monthsSaved > 0 ? `↓${simulation.monthsSaved}` : null,
                    green: simulation.monthsSaved > 0,
                  },
                  {
                    label: 'Closes on',
                    before: simulation.originalClosureDate,
                    after: simulation.newClosureDate,
                    green: simulation.monthsSaved > 0,
                  },
                  {
                    label: 'Future interest',
                    before: `₹${fmt(simulation.originalTotalInterest)}`,
                    after: `₹${fmt(simulation.newTotalInterest)}`,
                    redBefore: true,
                    green: true,
                  },
                  {
                    label: 'Total outflow',
                    sublabel: 'principal + interest',
                    before: `₹${fmt(simulation.originalTotalOutflow)}`,
                    after: `₹${fmt(simulation.newTotalOutflow)}`,
                    bold: true,
                    green: true,
                  },
                ].map(({ label, sublabel, before, after, badge, green, redBefore, bold }, idx) => (
                  <div
                    key={label}
                    className={`grid grid-cols-3 px-3 py-2.5 gap-1 items-start ${idx % 2 === 0 ? '' : 'bg-gray-50/50 dark:bg-gray-700/20'} border-b border-gray-100 dark:border-gray-700/50 last:border-0`}
                  >
                    <div className="min-w-0">
                      <p className={`text-xs text-gray-600 dark:text-gray-400 leading-snug ${bold ? 'font-semibold' : ''}`}>{label}</p>
                      {sublabel && <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{sublabel}</p>}
                    </div>
                    <p className={`text-xs text-right ${bold ? 'font-bold' : 'font-semibold'} ${redBefore ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'} break-all`}>
                      {before}
                    </p>
                    <div className="text-right">
                      <span className={`text-xs ${bold ? 'font-bold' : 'font-semibold'} ${green ? 'text-green-600 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'} break-all`}>
                        {after}
                      </span>
                      {badge && (
                        <span className="block text-[10px] font-medium text-green-500 dark:text-green-400">{badge}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ── 3. Savings Breakdown ─────────────────────────────────── */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide">Your Savings</p>

                {isReduceEmi && simulation.monthlyEmiSaving > 0 && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-sm text-green-700 dark:text-green-300">Monthly EMI reduction</span>
                      <span className="text-sm font-bold text-green-700 dark:text-green-300">−₹{fmt(simulation.monthlyEmiSaving)}/mo</span>
                    </div>
                    {simulation.newMonthsRemaining > 0 && (
                      <div className="flex justify-between">
                        <span className="text-sm text-green-700 dark:text-green-300">
                          Total EMI savings ({simulation.newMonthsRemaining} remaining mo)
                        </span>
                        <span className="text-sm font-bold text-green-700 dark:text-green-300">
                          −₹{fmt(simulation.monthlyEmiSaving * simulation.newMonthsRemaining)}
                        </span>
                      </div>
                    )}
                  </>
                )}

                {simulation.monthsSaved > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-green-700 dark:text-green-300">Loan closes earlier</span>
                    <span className="text-sm font-bold text-green-700 dark:text-green-300">{simulation.monthsSaved} months sooner</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span className="text-sm text-green-700 dark:text-green-300">Total outflow reduction</span>
                  <span className="text-sm font-bold text-green-700 dark:text-green-300">
                    −₹{fmt(simulation.originalTotalOutflow - simulation.newTotalOutflow)}
                  </span>
                </div>

                <div className="flex justify-between border-t border-green-200 dark:border-green-700 pt-2 mt-1">
                  <div>
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">Interest saved</span>
                    {simulation.originalTotalInterest > 0 && (
                      <span className="ml-2 text-xs bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-300 rounded-full px-2 py-0.5">
                        {Math.round(simulation.interestSaved / simulation.originalTotalInterest * 100)}% of total interest
                      </span>
                    )}
                  </div>
                  <span className="text-base font-bold text-green-700 dark:text-green-300">₹{fmt(simulation.interestSaved)}</span>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
