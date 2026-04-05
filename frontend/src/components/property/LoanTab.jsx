import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { propertyService } from '../../services/propertyService';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const EMPTY = {
  sanctionedAmount: '',
  interestRate: '',
  interestType: 'FIXED',
  tenureMonths: '',
  emiStartDate: '',
};

export default function LoanTab({ propertyId }) {
  const [loan, setLoan]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm]     = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await propertyService.getLoan(propertyId);
      setLoan(data);
      setForm({
        sanctionedAmount: data.sanctionedAmount ?? '',
        interestRate: data.interestRate ?? '',
        interestType: data.interestType ?? 'FIXED',
        tenureMonths: data.tenureMonths ?? '',
        emiStartDate: data.emiStartDate ?? '',
      });
    } catch (err) {
      // 404 = no loan yet, that's fine
      if (err?.response?.status !== 404) {
        toast.error('Failed to load loan');
      }
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
        interestRate: parseFloat(form.interestRate),
        interestType: form.interestType,
        tenureMonths: parseInt(form.tenureMonths, 10),
        emiStartDate: form.emiStartDate || null,
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

  return (
    <div className="space-y-5">
      {!loan ? (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">No loan added for this property yet.</p>
          <Button onClick={() => setShowForm(true)}>Add Loan</Button>
        </div>
      ) : (
        <>
          {/* Loan summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Principal', value: `₹${fmt(loan.sanctionedAmount)}` },
              { label: 'EMI', value: `₹${fmt(loan.computedEmi)}` },
              { label: 'Rate', value: `${loan.interestRate}% p.a.` },
              { label: 'Tenure', value: `${loan.tenureMonths} mo` },
            ].map((c) => (
              <div key={c.label} className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-4 text-center">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{c.label}</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mt-1">{c.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { label: 'Total Interest', value: `₹${fmt(loan.totalInterest)}`, cls: 'text-red-600 dark:text-red-400' },
              { label: 'Total Payment', value: `₹${fmt(loan.totalPayment)}`, cls: '' },
              { label: 'Outstanding', value: `₹${fmt(loan.outstandingBalance)}`, cls: 'text-amber-600 dark:text-amber-400' },
              { label: 'EMIs Paid', value: loan.paidEmiCount, cls: 'text-green-600 dark:text-green-400' },
              { label: 'EMIs Left', value: loan.remainingEmiCount, cls: '' },
              { label: 'Prepaid', value: `₹${fmt(loan.totalPrepaid)}`, cls: 'text-primary-600 dark:text-primary-400' },
            ].map((c) => (
              <div key={c.label} className="rounded-xl border border-gray-200 dark:border-gray-700 p-3">
                <p className="text-xs text-gray-400 dark:text-gray-500">{c.label}</p>
                <p className={`font-semibold mt-0.5 ${c.cls || 'text-gray-800 dark:text-gray-100'}`}>{c.value}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {loan.interestType} rate · starts {loan.emiStartDate || '—'}
            </div>
            <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>Edit Loan</Button>
          </div>
        </>
      )}

      {/* Loan Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                {loan ? 'Edit Loan' : 'Add Loan'}
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Sanctioned Amount (₹) *
                  </label>
                  <input
                    type="number"
                    value={form.sanctionedAmount}
                    onChange={(e) => setForm({ ...form, sanctionedAmount: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                    placeholder="e.g. 6000000"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Interest Rate (% p.a.) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={form.interestRate}
                      onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                      placeholder="e.g. 8.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Type
                    </label>
                    <select
                      value={form.interestType}
                      onChange={(e) => setForm({ ...form, interestType: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                    >
                      <option value="FIXED">Fixed</option>
                      <option value="FLOATING">Floating</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tenure (months) *
                    </label>
                    <input
                      type="number"
                      value={form.tenureMonths}
                      onChange={(e) => setForm({ ...form, tenureMonths: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                      placeholder="e.g. 240"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      EMI Start Date
                    </label>
                    <input
                      type="date"
                      value={form.emiStartDate}
                      onChange={(e) => setForm({ ...form, emiStartDate: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>Cancel</Button>
                  <Button type="submit" loading={saving}>Save Loan</Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
