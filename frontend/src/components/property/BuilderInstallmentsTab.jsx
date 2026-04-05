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
      {/* Summary bar */}
      {installments.length > 0 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700/40 rounded-xl space-y-3">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total</p>
              <p className="font-semibold text-gray-800 dark:text-gray-100">₹{fmt(total)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Paid</p>
              <p className="font-semibold text-green-600 dark:text-green-400">₹{fmt(paid)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Remaining</p>
              <p className="font-semibold text-amber-600 dark:text-amber-400">₹{fmt(total - paid)}</p>
            </div>
          </div>
          {(paidViaBank > 0 || paidViaSelf > 0) && (
            <div className="flex gap-3 justify-center pt-1 border-t border-gray-200 dark:border-gray-600">
              {paidViaBank > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  🏦 Bank ₹{fmt(paidViaBank)}
                </span>
              )}
              {paidViaSelf > 0 && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  👤 Self ₹{fmt(paidViaSelf)}
                </span>
              )}
            </div>
          )}
        </div>
      )}

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

      {/* Installment list */}
      {installments.length === 0 ? (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">No installments added yet</p>
      ) : (
        <div className="space-y-2">
          {installments.map((inst) => (
            <div
              key={inst.id}
              className={`rounded-xl border p-4 transition-colors ${
                inst.paid
                  ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                  : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
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
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-3">
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
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 space-y-2">
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
