import React, { useState, useEffect, useCallback } from 'react';
import { PlusIcon, CheckCircleIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import Button from '../common/Button';
import { propertyService } from '../../services/propertyService';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const EMPTY_INST = { amount: '', dueDate: '', description: '' };
const EMPTY_PAID = { paidViaLoan: '', paidViaSelf: '', paidDate: '' };

export default function BuilderInstallmentsTab({ propertyId }) {
  const [installments, setInstallments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [showAdd, setShowAdd]           = useState(false);
  const [form, setForm]                 = useState(EMPTY_INST);
  const [saving, setSaving]             = useState(false);
  const [payingId, setPayingId]         = useState(null);
  const [payForm, setPayForm]           = useState(EMPTY_PAID);
  const [editingId, setEditingId]       = useState(null);
  const [editForm, setEditForm]         = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInstallments(await propertyService.getInstallments(propertyId));
    } catch {
      toast.error('Failed to load installments');
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
      await propertyService.addInstallment(propertyId, {
        amount: parseFloat(form.amount),
        dueDate: form.dueDate || null,
        description: form.description || null,
      });
      toast.success('Installment added');
      setShowAdd(false);
      setForm(EMPTY_INST);
      load();
    } catch {
      toast.error('Failed to add installment');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async (instId) => {
    setSaving(true);
    try {
      await propertyService.markInstallmentPaid(propertyId, instId, {
        paidViaLoan: payForm.paidViaLoan ? parseFloat(payForm.paidViaLoan) : 0,
        paidViaSelf: payForm.paidViaSelf ? parseFloat(payForm.paidViaSelf) : 0,
        paidDate: payForm.paidDate || null,
      });
      toast.success('Marked as paid');
      setPayingId(null);
      setPayForm(EMPTY_PAID);
      load();
    } catch {
      toast.error('Failed to mark paid');
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (inst) => {
    setEditingId(inst.id);
    setPayingId(null);
    setEditForm({
      amount:      inst.amount ?? '',
      dueDate:     inst.dueDate ?? '',
      description: inst.description ?? '',
      paidViaLoan: inst.paidViaLoan ?? '',
      paidViaSelf: inst.paidViaSelf ?? '',
      paidDate:    inst.paidDate ?? '',
    });
  };

  const handleEdit = async (inst) => {
    if (!editForm.amount) return toast.error('Amount required');
    setSaving(true);
    try {
      await propertyService.updateInstallment(propertyId, inst.id, {
        amount:      parseFloat(editForm.amount),
        dueDate:     editForm.dueDate || null,
        description: editForm.description || null,
      });
      // If paid, also update payment split if changed
      if (inst.paid) {
        await propertyService.markInstallmentPaid(propertyId, inst.id, {
          paidViaLoan: editForm.paidViaLoan ? parseFloat(editForm.paidViaLoan) : 0,
          paidViaSelf: editForm.paidViaSelf ? parseFloat(editForm.paidViaSelf) : 0,
          paidDate:    editForm.paidDate || inst.paidDate || null,
        });
      }
      toast.success('Installment updated');
      setEditingId(null);
      load();
    } catch {
      toast.error('Failed to update installment');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (instId) => {
    if (!window.confirm('Delete this installment?')) return;
    try {
      await propertyService.deleteInstallment(propertyId, instId);
      toast.success('Deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const total       = installments.reduce((s, i) => s + (i.amount || 0), 0);
  const paid        = installments.filter((i) => i.paid).reduce((s, i) => s + (i.amount || 0), 0);
  const paidViaBank = installments.filter((i) => i.paid).reduce((s, i) => s + (i.paidViaLoan || 0), 0);
  const paidViaSelf = installments.filter((i) => i.paid).reduce((s, i) => s + (i.paidViaSelf || 0), 0);

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  return (
    <div className="space-y-4">
      {/* ── Rich Summary Banner ── */}
      {installments.length > 0 && (() => {
        const paidPct = total > 0 ? (paid / total) * 100 : 0;
        const bankPct = (paidViaBank + paidViaSelf) > 0 ? (paidViaBank / (paidViaBank + paidViaSelf)) * 100 : 0;
        return (
          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-primary-50 dark:from-indigo-900/20 dark:to-primary-900/20 border border-indigo-200 dark:border-indigo-800/50 p-4 space-y-3">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <div>
                  <p className="text-sm font-bold text-indigo-800 dark:text-indigo-300">₹{fmt(paid)} paid</p>
                  <p className="text-xs text-indigo-600 dark:text-indigo-400">of ₹{fmt(total)} total</p>
                </div>
              </div>
              <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-700">
                {paidPct.toFixed(0)}%
              </span>
            </div>

            {/* Progress bar */}
            <div>
              <div className="h-2.5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-400 to-primary-500 rounded-full transition-all"
                  style={{ width: `${paidPct}%` }} />
              </div>
            </div>

            {/* 3 stats */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Total',     value: `₹${fmt(total)}`,        color: 'text-indigo-700 dark:text-indigo-400' },
                { label: 'Paid',      value: `₹${fmt(paid)}`,         color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Remaining', value: `₹${fmt(total - paid)}`, color: 'text-amber-600 dark:text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white/70 dark:bg-gray-800/50 rounded-xl p-2 text-center">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
                  <p className={`text-sm font-bold mt-0.5 ${color}`}>{value}</p>
                </div>
              ))}
            </div>

            {/* Payment source breakdown */}
            {(paidViaBank > 0 || paidViaSelf > 0) && (
              <div className="pt-1 border-t border-indigo-100 dark:border-indigo-800/40 space-y-2">
                <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium uppercase tracking-wide">Payment source</p>
                {(paidViaBank + paidViaSelf) > 0 && (
                  <div>
                    <div className="flex h-2 rounded-full overflow-hidden mb-1.5">
                      <div className="bg-blue-400 transition-all" style={{ width: `${bankPct}%` }} />
                      <div className="bg-purple-400 transition-all" style={{ width: `${100 - bankPct}%` }} />
                    </div>
                    <div className="flex gap-3 flex-wrap text-xs">
                      {paidViaBank > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">🏦 Bank <span className="font-semibold text-blue-700 dark:text-blue-400">₹{fmt(paidViaBank)}</span></span>
                        </span>
                      )}
                      {paidViaSelf > 0 && (
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-purple-400 shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400">👤 Self <span className="font-semibold text-purple-700 dark:text-purple-400">₹{fmt(paidViaSelf)}</span></span>
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Milestone dots timeline */}
            <div className="pt-1 border-t border-indigo-100 dark:border-indigo-800/40">
              <p className="text-[11px] text-indigo-500 dark:text-indigo-400 font-medium uppercase tracking-wide mb-2">
                Payment journey
              </p>
              <div className="flex items-center gap-1 flex-wrap">
                {installments.map((inst, idx) => (
                  <div
                    key={inst.id}
                    title={`#${idx + 1}: ₹${fmt(inst.amount)}${inst.description ? ` — ${inst.description}` : ''}${inst.paid ? ' ✓' : ''}`}
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-colors ${
                      inst.paid
                        ? 'bg-emerald-400 border-emerald-500 text-white shadow-sm'
                        : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-500 text-gray-400 dark:text-gray-500'
                    }`}>
                    {idx + 1}
                  </div>
                ))}
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium ml-1">
                  {installments.filter(i => i.paid).length}/{installments.length} done
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex justify-between items-center">
        <h3 className="font-medium text-gray-700 dark:text-gray-300">
          Installments ({installments.length})
        </h3>
        <Button size="sm" onClick={() => setShowAdd(true)}>
          <PlusIcon className="h-4 w-4" /> Add
        </Button>
      </div>

      {/* Add form */}
      {showAdd && (
        <form onSubmit={handleAdd} className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Amount (₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                placeholder="e.g. 500000"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-1.5 text-sm"
                placeholder="e.g. Foundation stage"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="secondary" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button type="submit" size="sm" loading={saving}>Add</Button>
          </div>
        </form>
      )}

      {installments.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl">
          <p className="text-2xl mb-2">📋</p>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No installments added yet</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Add installments to track your builder payment schedule.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {installments.map((inst) => (
            <div
              key={inst.id}
              className={`rounded-2xl border transition-colors ${
                inst.paid
                  ? 'bg-emerald-50/60 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800/50'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3 p-4">
                <div className="flex items-start gap-3 min-w-0">
                  {inst.paid
                    ? <CheckCircleSolid className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                    : <CheckCircleIcon className="h-5 w-5 text-gray-300 dark:text-gray-600 mt-0.5 shrink-0" />
                  }
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 dark:text-gray-100">₹{fmt(inst.amount)}</p>
                    {inst.description && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">{inst.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1.5 items-center">
                      {inst.dueDate && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Due: {inst.dueDate}</span>
                      )}
                      {inst.paid && inst.paidDate && (
                        <span className="text-xs text-gray-400 dark:text-gray-500">Paid: {inst.paidDate}</span>
                      )}
                    </div>
                    {inst.paid && (inst.paidViaLoan > 0 || inst.paidViaSelf > 0) && (
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {inst.paidViaLoan > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            🏦 Bank ₹{fmt(inst.paidViaLoan)}
                          </span>
                        )}
                        {inst.paidViaSelf > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                            👤 Self ₹{fmt(inst.paidViaSelf)}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {!inst.paid && (
                    <button
                      onClick={() => { setPayingId(inst.id); setEditingId(null); setPayForm({ ...EMPTY_PAID, paidViaSelf: inst.amount }); }}
                      className="text-xs px-2.5 py-1 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 font-medium transition-colors"
                    >
                      Mark Paid
                    </button>
                  )}
                  <button
                    onClick={() => { startEdit(inst); setPayingId(null); }}
                    className="p-1 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    title="Edit"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(inst.id)}
                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Delete"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Edit form inline */}
              {editingId === inst.id && (
                <div className="px-4 pb-4 pt-0 space-y-3 border-t border-gray-200 dark:border-gray-600">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Edit Installment</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Amount (₹) *</label>
                      <input
                        type="number"
                        value={editForm.amount}
                        onChange={(e) => setEditForm({ ...editForm, amount: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Due Date</label>
                      <input
                        type="date"
                        value={editForm.dueDate}
                        onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Description</label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                        placeholder="e.g. Foundation stage"
                      />
                    </div>
                  </div>
                  {inst.paid && (
                    <>
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Payment Details</p>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Via Bank (₹)</label>
                          <input
                            type="number"
                            value={editForm.paidViaLoan}
                            onChange={(e) => setEditForm({ ...editForm, paidViaLoan: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Via Self (₹)</label>
                          <input
                            type="number"
                            value={editForm.paidViaSelf}
                            onChange={(e) => setEditForm({ ...editForm, paidViaSelf: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Paid Date</label>
                          <input
                            type="date"
                            value={editForm.paidDate}
                            onChange={(e) => setEditForm({ ...editForm, paidDate: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                          />
                        </div>
                      </div>
                    </>
                  )}
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setEditingId(null)}>Cancel</Button>
                    <Button size="sm" loading={saving} onClick={() => handleEdit(inst)}>Save</Button>
                  </div>
                </div>
              )}

              {/* Pay form inline */}
              {payingId === inst.id && (
                <div className="px-4 pb-4 pt-3 space-y-2 border-t border-gray-200 dark:border-gray-600">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Via Loan (₹)</label>
                      <input
                        type="number"
                        value={payForm.paidViaLoan}
                        onChange={(e) => setPayForm({ ...payForm, paidViaLoan: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Via Self (₹)</label>
                      <input
                        type="number"
                        value={payForm.paidViaSelf}
                        onChange={(e) => setPayForm({ ...payForm, paidViaSelf: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 dark:text-gray-400 mb-0.5">Date</label>
                      <input
                        type="date"
                        value={payForm.paidDate}
                        onChange={(e) => setPayForm({ ...payForm, paidDate: e.target.value })}
                        className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1 text-sm"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button type="button" variant="secondary" size="sm" onClick={() => setPayingId(null)}>Cancel</Button>
                    <Button size="sm" loading={saving} onClick={() => handleMarkPaid(inst.id)}>Confirm</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
