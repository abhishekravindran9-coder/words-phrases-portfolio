import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { propertyService } from '../../services/propertyService';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  return dt.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
}

const EMPTY = {
  sanctionedAmount: '',
  interestRate: '',
  interestType: 'FIXED',
  tenureMonths: '',
  emiStartDate: '',
  bankName: '',
  accountNumber: '',
};

export default function LoanTab({ propertyId }) {
  const [loan, setLoan]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]       = useState(EMPTY);
  const [saving, setSaving]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyService.getLoan(propertyId);
      setLoan(data);
      setForm({
        sanctionedAmount: data.sanctionedAmount ?? '',
        interestRate:     data.interestRate ?? '',
        interestType:     data.interestType ?? 'FIXED',
        tenureMonths:     data.tenureMonths ?? '',
        emiStartDate:     data.emiStartDate ?? '',
        bankName:         data.bankName ?? '',
        accountNumber:    data.accountNumber ?? '',
      });
    } catch (err) {
      if (err?.response?.status !== 404) toast.error('Failed to load loan');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.sanctionedAmount || !form.interestRate || !form.tenureMonths) {
      return toast.error('Sanctioned amount, interest rate and tenure are required');
    }
    setSaving(true);
    try {
      await propertyService.saveLoan(propertyId, {
        sanctionedAmount: parseFloat(form.sanctionedAmount),
        interestRate:     parseFloat(form.interestRate),
        interestType:     form.interestType,
        tenureMonths:     parseInt(form.tenureMonths, 10),
        emiStartDate:     form.emiStartDate || null,
        bankName:         form.bankName     || null,
        accountNumber:    form.accountNumber || null,
      });
      toast.success('Loan saved');
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to save loan');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  if (!loan) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No loan added yet.</p>
        <Button onClick={() => setShowForm(true)}>Add Loan</Button>
        {showForm && <LoanForm form={form} setForm={setForm} onSave={handleSave} onCancel={() => setShowForm(false)} saving={saving} isNew />}
      </div>
    );
  }

  const pct          = loan.percentComplete  ?? 0;   // principal-repaid % (correct)
  const timelinePct   = loan.timelinePercent  ?? 0;   // EMIs paid as % of tenure
  const yearsLeft     = loan.remainingEmiCount != null ? (loan.remainingEmiCount / 12).toFixed(1) : null;
  const daysLeft      = loan.daysUntilNextEmi;
  const interestPct   = loan.computedEmi ? Math.round((loan.currentMonthInterest / loan.computedEmi) * 100) : 0;
  const principalPct  = 100 - interestPct;
  const hasPrepayments = (loan.totalPrepaid ?? 0) > 0;
  const interestSavingPct = (loan.originalTotalInterest ?? 0) > 0
    ? Math.round((loan.interestSaved / loan.originalTotalInterest) * 100)
    : 0;

  const dueChipColor =
    daysLeft == null ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
    : daysLeft <= 3   ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    : daysLeft <= 10  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400';

  return (
    <div className="space-y-5">

      {/* ── Bank header ────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-0.5">Home Loan</p>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-100">
            {loan.bankName || 'Your Loan'}
          </p>
          {loan.accountNumber && (
            <p className="text-xs text-gray-400 dark:text-gray-500 font-mono mt-0.5">
              A/C ····{loan.accountNumber.slice(-4)}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
            loan.interestType === 'FLOATING'
              ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
          }`}>
            {loan.interestType}
          </span>
          {loan.emiStartDate && (
            <p className="text-xs text-gray-400 dark:text-gray-500">Since {loan.emiStartDate}</p>
          )}
        </div>
      </div>

      {/* ── Progress band ──────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border border-indigo-100 dark:border-indigo-800/40 rounded-2xl p-4 space-y-3">
        {/* Big % + principal cleared */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">{pct.toFixed(1)}%</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">of loan repaid</p>
          </div>
          <div className="text-right">
            <p className="text-base font-bold text-gray-700 dark:text-gray-300">₹{fmt(loan.principalRepaid)}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">principal cleared</p>
          </div>
        </div>

        {/* Principal repaid bar */}
        <div>
          <div className="h-3 bg-white/60 dark:bg-gray-700/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-blue-400 transition-all"
              style={{ width: `${Math.min(100, pct)}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
            <span>₹0</span>
            <span>₹{fmt(loan.sanctionedAmount)}</span>
          </div>
        </div>

        {/* EMI timeline secondary bar */}
        <div className="bg-white/50 dark:bg-gray-800/50 rounded-xl px-3 py-2 space-y-1.5">
          <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
            <span className="font-medium">EMI Timeline</span>
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              {loan.paidEmiCount} / {loan.tenureMonths} paid
              <span className="font-normal text-gray-400 ml-1">({timelinePct.toFixed(1)}%)</span>
            </span>
          </div>
          <div className="h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gray-400 dark:bg-gray-400 transition-all"
              style={{ width: `${Math.min(100, timelinePct)}%` }}
            />
          </div>
          <p className="text-[10px] text-gray-400 dark:text-gray-500">{loan.remainingEmiCount} EMIs remaining</p>
        </div>

        {/* Chips */}
        <div className="flex flex-wrap gap-2">
          {(loan.actualClosureDate || loan.closureDate) && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full px-3 py-1 font-medium text-gray-700 dark:text-gray-300">
              🎯 Closes {fmtDate(loan.actualClosureDate || loan.closureDate)}
              {yearsLeft && <span className="text-gray-400 dark:text-gray-500 font-normal">· {yearsLeft} yrs left</span>}
            </span>
          )}
          {loan.nextEmiDueDate && (
            <span className={`inline-flex items-center gap-1.5 text-xs rounded-full px-3 py-1 font-medium ${dueChipColor}`}>
              📅 {daysLeft === 0 ? 'EMI due today' : daysLeft < 0 ? `EMI overdue by ${Math.abs(daysLeft)}d` : `Due in ${daysLeft}d`}
              {' '}· ₹{fmt(loan.computedEmi)}
            </span>
          )}
          {hasPrepayments && (loan.monthsSaved ?? 0) > 0 && (
            <span className="inline-flex items-center gap-1.5 text-xs bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 rounded-full px-3 py-1 font-medium text-emerald-700 dark:text-emerald-400">
              ⚡ {loan.monthsSaved}mo early thanks to prepayments
            </span>
          )}
        </div>
      </div>

      {/* ── Core 4 stats ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Principal',  value: `₹${fmt(loan.sanctionedAmount)}` },
          { label: 'EMI',        value: `₹${fmt(loan.computedEmi)}` },
          { label: 'Rate',       value: `${loan.interestRate}% p.a.` },
          { label: 'Tenure',     value: `${loan.tenureMonths} mo` },
        ].map((c) => (
          <div key={c.label} className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 sm:p-4 text-center">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{c.label}</p>
            <p className="font-bold text-gray-800 dark:text-gray-100 mt-1 text-sm sm:text-base">{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── 6 financial metric cards ───────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { label: 'Total Interest',  value: `₹${fmt(loan.totalInterest)}`,     cls: 'text-red-600 dark:text-red-400' },
          { label: 'Total Payment',   value: `₹${fmt(loan.totalPayment)}`,       cls: '' },
          { label: 'Outstanding',     value: `₹${fmt(loan.outstandingBalance)}`, cls: 'text-amber-600 dark:text-amber-400' },
          { label: 'EMIs Paid',       value: loan.paidEmiCount,                  cls: 'text-green-600 dark:text-green-400' },
          { label: 'EMIs Left',       value: loan.remainingEmiCount,             cls: '' },
          { label: 'Total Prepaid',   value: `₹${fmt(loan.totalPrepaid)}`,       cls: 'text-indigo-600 dark:text-indigo-400' },
        ].map((c) => (
          <div key={c.label} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
            <p className="text-xs text-gray-400 dark:text-gray-500">{c.label}</p>
            <p className={`font-bold mt-0.5 text-sm sm:text-base ${c.cls || 'text-gray-800 dark:text-gray-100'}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── Prepayment Impact ──────────────────────────────────────────── */}
      {hasPrepayments && (
        <div className="rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">💰</span>
              <div>
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">Prepayment Impact</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400">
                  ₹{fmt(loan.totalPrepaid)} across {loan.prepaymentCount} {loan.prepaymentCount === 1 ? 'prepayment' : 'prepayments'}
                </p>
              </div>
            </div>
            {interestSavingPct > 0 && (
              <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-700">
                {interestSavingPct}% interest cut
              </span>
            )}
          </div>

          {/* 4 impact stats */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Interest Saved</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{fmt(loan.interestSaved)}</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Months Saved</p>
              <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {(loan.monthsSaved ?? 0) > 0 ? `${loan.monthsSaved} mo` : '—'}
              </p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Interest Paid So Far</p>
              <p className="text-lg font-extrabold text-gray-700 dark:text-gray-200 mt-0.5">₹{fmt(loan.interestPaidTillNow)}</p>
            </div>
            <div className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-3">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">Interest Still Owed</p>
              <p className="text-lg font-extrabold text-amber-600 dark:text-amber-400 mt-0.5">
                ₹{fmt((loan.totalInterest ?? 0) - (loan.interestPaidTillNow ?? 0))}
              </p>
            </div>
          </div>

          {/* Interest comparison bar — with vs without prepayments */}
          {(loan.originalTotalInterest ?? 0) > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Interest Comparison</p>
              <div className="space-y-1.5">
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-red-500 dark:text-red-400 font-medium">Without prepayments</span>
                    <span className="text-red-500 dark:text-red-400 font-semibold">₹{fmt(loan.originalTotalInterest)}</span>
                  </div>
                  <div className="h-2.5 bg-red-100 dark:bg-red-900/30 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-400 to-red-500 rounded-full" style={{ width: '100%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-emerald-600 dark:text-emerald-400 font-medium">With your prepayments</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">₹{fmt(loan.totalInterest)}</span>
                  </div>
                  <div className="h-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${loan.originalTotalInterest > 0 ? Math.round((loan.totalInterest / loan.originalTotalInterest) * 100) : 100}%` }}
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium text-center">
                You are paying {interestSavingPct}% less interest than without prepayments
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Current EMI split ──────────────────────────────────────────── */}
      {loan.currentMonthInterest != null && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">This Month's EMI Split</p>
          <div className="space-y-3">
            {/* Interest bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-orange-600 dark:text-orange-400 font-medium">Interest ({interestPct}%)</span>
                <span className="text-orange-600 dark:text-orange-400 font-semibold">₹{fmt(loan.currentMonthInterest)}</span>
              </div>
              <div className="h-2.5 bg-orange-100 dark:bg-orange-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full"
                     style={{ width: `${interestPct}%` }} />
              </div>
            </div>
            {/* Principal bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-green-600 dark:text-green-400 font-medium">Principal ({principalPct}%)</span>
                <span className="text-green-600 dark:text-green-400 font-semibold">₹{fmt(loan.currentMonthPrincipal)}</span>
              </div>
              <div className="h-2.5 bg-green-100 dark:bg-green-900/30 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full"
                     style={{ width: `${principalPct}%` }} />
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-3 text-center">
            Only ₹{fmt(loan.currentMonthPrincipal)} of your ₹{fmt(loan.computedEmi)} EMI reduces your debt this month
          </p>
        </div>
      )}

      {/* ── Interest overhead callout ──────────────────────────────────── */}
      {loan.interestCostRatio != null && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl mt-0.5">💸</span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-red-500 dark:text-red-400 uppercase tracking-wide">Interest Overhead</p>
              <p className="text-2xl font-extrabold text-red-600 dark:text-red-400 mt-0.5">
                {loan.interestCostRatio.toFixed(1)}%
              </p>
              <p className="text-xs text-red-500/80 dark:text-red-400/80 mt-1 leading-relaxed">
                You pay <span className="font-semibold">₹{fmt(loan.totalInterest)}</span> in interest
                on a <span className="font-semibold">₹{fmt(loan.sanctionedAmount)}</span> loan —
                effectively ₹{(1 + loan.interestCostRatio / 100).toFixed(2)} per ₹1 borrowed.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center pt-1">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          {loan.interestType} rate{loan.emiStartDate ? ` · starts ${loan.emiStartDate}` : ''}
        </p>
        <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>Edit Loan</Button>
      </div>

      {/* ── Loan form modal ────────────────────────────────────────────── */}
      {showForm && (
        <LoanForm
          form={form} setForm={setForm}
          onSave={handleSave} onCancel={() => setShowForm(false)}
          saving={saving} isNew={!loan}
        />
      )}
    </div>
  );
}

function LoanForm({ form, setForm, onSave, onCancel, saving, isNew }) {
  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm({ ...form, [key]: e.target.value }),
    className: 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
            {isNew ? 'Add Loan' : 'Edit Loan'}
          </h3>
          <form onSubmit={onSave} className="space-y-4">

            {/* Bank details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bank / Lender</label>
                <input type="text" placeholder="e.g. HDFC Bank" {...field('bankName')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account No.</label>
                <input type="text" placeholder="Loan account number" {...field('accountNumber')} />
              </div>
            </div>

            {/* Core fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sanctioned Amount (₹) *
              </label>
              <input type="number" placeholder="e.g. 6000000" {...field('sanctionedAmount')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (% p.a.) *</label>
                <input type="number" step="0.01" placeholder="e.g. 8.5" {...field('interestRate')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select {...field('interestType')}>
                  <option value="FIXED">Fixed</option>
                  <option value="FLOATING">Floating</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tenure (months) *</label>
                <input type="number" placeholder="e.g. 240" {...field('tenureMonths')} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">EMI Start Date</label>
                <input type="date" {...field('emiStartDate')} />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
              <Button type="submit" loading={saving}>Save Loan</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}


