import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlusIcon, BuildingOffice2Icon, TrashIcon, PencilSquareIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { propertyService } from '../services/propertyService';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function fmtShort(n) {
  if (n == null) return '—';
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n)}`;
}

const BORDER = {
  neutral:  'border-l-gray-300 dark:border-l-gray-600',
  past:     'border-l-gray-400 dark:border-l-gray-500',
  critical: 'border-l-red-500',
  warning:  'border-l-amber-500',
  ok:       'border-l-teal-500',
};
const CHIP = {
  neutral:  'bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300',
  past:     'bg-gray-100 dark:bg-gray-700/60 text-gray-400 dark:text-gray-500',
  critical: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  warning:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  ok:       'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400',
};

const EMPTY = {
  name: '', builderName: '', totalCost: '', location: '',
  possessionDate: '', selfContributionPlanned: '', loanAmountPlanned: '',
};

export default function PropertyTrackerPage() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState(null); // property being edited
  const [form, setForm]             = useState(EMPTY);
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(null);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProperties(await propertyService.getAll());
    } catch {
      toast.error('Failed to load properties');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowForm(true); };
  const openEdit   = (p, e) => {
    e.stopPropagation();
    setEditing(p);
    setForm({
      name: p.name || '',
      builderName: p.builderName || '',
      totalCost: p.totalCost ?? '',
      location: p.location || '',
      possessionDate: p.possessionDate || '',
      selfContributionPlanned: p.selfContributionPlanned ?? '',
      loanAmountPlanned: p.loanAmountPlanned ?? '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Property name is required');
    if (!form.totalCost)   return toast.error('Total cost is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        totalCost: parseFloat(form.totalCost),
        selfContributionPlanned: form.selfContributionPlanned ? parseFloat(form.selfContributionPlanned) : 0,
        loanAmountPlanned: form.loanAmountPlanned ? parseFloat(form.loanAmountPlanned) : 0,
        possessionDate: form.possessionDate || null,
      };
      if (editing) {
        await propertyService.update(editing.id, payload);
        toast.success('Property updated');
      } else {
        await propertyService.create(payload);
        toast.success('Property added');
      }
      setShowForm(false);
      load();
    } catch {
      toast.error('Failed to save property');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p, e) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${p.name}"? This will also delete all installments and loan data.`)) return;
    setDeleting(p.id);
    try {
      await propertyService.delete(p.id);
      toast.success('Property deleted');
      load();
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(null);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BuildingOffice2Icon className="h-6 w-6 sm:h-7 sm:w-7 text-primary-600 shrink-0" />
            Property Tracker
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track installments, loans &amp; EMIs
          </p>
        </div>
        <button
          onClick={openCreate}
          className="shrink-0 flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-sm font-semibold transition-colors shadow-sm"
        >
          <PlusIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Add Property</span>
          <span className="sm:hidden">Add</span>
        </button>
      </div>

      {/* Property cards */}
      {properties.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <BuildingOffice2Icon className="h-14 w-14 mx-auto mb-3 opacity-20" />
          <p className="font-semibold text-gray-500 dark:text-gray-400 text-base">No properties yet</p>
          <p className="text-sm mt-1">Click "Add Property" to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {properties.map((p) => {
            const urg = p.daysToPoassession == null ? 'neutral'
              : p.daysToPoassession < 0  ? 'past'
              : p.daysToPoassession <= 30 ? 'critical'
              : p.daysToPoassession <= 90 ? 'warning'
              : 'ok';
            const nextDate = p.nextInstallmentDate ? new Date(p.nextInstallmentDate) : null;
            const nextDays = nextDate
              ? Math.round((nextDate.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
              : null;

            return (
              <div
                key={p.id}
                onClick={() => navigate(`/property-tracker/${p.id}`)}
                className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 border-l-4 ${BORDER[urg]} p-4 sm:p-5 cursor-pointer hover:shadow-lg transition-all space-y-3.5 overflow-hidden min-w-0 w-full`}
              >
                {/* ── Header ─────────────────────────────────────────── */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-gray-900 dark:text-white text-base sm:text-lg leading-snug truncate">
                      {p.name}
                    </h2>
                    {p.builderName && (
                      <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{p.builderName}</p>
                    )}
                    {p.location && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">
                        📍 {p.location}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      onClick={(e) => openEdit(p, e)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(p, e)}
                      disabled={deleting === p.id}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* ── Possession countdown ────────────────────────────── */}
                {p.daysToPoassession != null && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full font-semibold ${CHIP[urg]}`}>
                      📅{' '}
                      {p.daysToPoassession < 0
                        ? `${Math.abs(p.daysToPoassession)}d since possession`
                        : p.daysToPoassession === 0
                          ? 'Possession today!'
                          : `${p.daysToPoassession}d to possession`}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-gray-500">{p.possessionDate}</span>
                  </div>
                )}

                {/* ── Key stats ───────────────────────────────────────── */}
                <div className="grid grid-cols-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 overflow-hidden min-w-0">
                  {[
                    {
                      label: 'Total Cost',
                      value: fmtShort(p.totalCost),
                      cls: '',
                    },
                    {
                      label: p.hasLoan ? 'EMI / mo' : 'Self Fund',
                      value: p.hasLoan
                        ? (p.loanEmi ? fmtShort(p.loanEmi) : '—')
                        : (p.selfContributionPlanned ? fmtShort(p.selfContributionPlanned) : '—'),
                      cls: '',
                    },
                    {
                      label: p.hasLoan ? 'Outstanding' : 'Loan Plan',
                      value: p.hasLoan && p.loanOutstanding != null
                        ? fmtShort(p.loanOutstanding)
                        : (p.loanAmountPlanned ? fmtShort(p.loanAmountPlanned) : '—'),
                      cls: p.hasLoan ? 'text-amber-600 dark:text-amber-400' : 'text-gray-400 dark:text-gray-500',
                    },
                  ].map((s, i) => (
                    <div key={s.label} className={`py-2.5 px-1.5 sm:px-3 text-center min-w-0 ${i > 0 ? 'border-l border-gray-200 dark:border-gray-600' : ''}`}>
                      <p className="text-[9px] uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5 truncate">{s.label}</p>
                      <p className={`font-bold text-xs sm:text-sm truncate ${s.cls || 'text-gray-800 dark:text-gray-100'}`}>{s.value}</p>
                    </div>
                  ))}
                </div>

                {/* ── Progress bars ───────────────────────────────────── */}
                <div className="space-y-2.5">
                  {p.totalInstallments > 0 && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-500 dark:text-gray-400">Builder Payments</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-300 shrink-0 ml-2">
                          {p.paidInstallments}/{p.totalInstallments}
                          <span className="hidden sm:inline">{p.paidInstallmentAmount > 0 && ` · ${fmtShort(p.paidInstallmentAmount)}`}</span>
                          {' '}· {(p.percentComplete || 0).toFixed(0)}%
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary-600 to-primary-400 transition-all"
                          style={{ width: `${Math.min(100, p.percentComplete || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {p.hasLoan && p.loanPaidCount != null && (
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-medium text-gray-500 dark:text-gray-400">Loan Repayment</span>
                        <span className="font-semibold text-gray-600 dark:text-gray-300 shrink-0 ml-2">
                          {p.loanPaidCount}/{p.loanTotalMonths} mo · {(p.loanPercentRepaid || 0).toFixed(1)}%
                        </span>
                      </div>
                      <div className="relative h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-400 transition-all"
                          style={{ width: `${Math.min(100, p.loanPercentRepaid || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* ── Next installment callout ─────────────────────────── */}
                {nextDate != null && (() => {
                  const urgent = nextDays != null && nextDays <= 7;
                  const warn   = nextDays != null && nextDays > 7 && nextDays <= 30;
                  const over   = nextDays != null && nextDays < 0;
                  const style  = over || urgent
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : warn
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                      : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-700';
                  const textCls = over || urgent
                    ? 'text-red-700 dark:text-red-400'
                    : warn
                      ? 'text-amber-700 dark:text-amber-400'
                      : 'text-gray-600 dark:text-gray-400';
                  const icon = over ? '🔴' : urgent ? '⚡' : warn ? '⏰' : '📅';
                  const dayLabel = nextDays == null ? '' : nextDays < 0 ? `${Math.abs(nextDays)}d overdue` : nextDays === 0 ? 'due today' : `in ${nextDays}d`;
                  return (
                    <div className={`px-3 py-2.5 rounded-xl text-xs border ${style} ${textCls}`}>
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-bold text-sm">{icon} ₹{fmt(p.nextInstallmentAmount)}</span>
                        {dayLabel && <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          over || urgent ? 'bg-red-100 dark:bg-red-900/40' : warn ? 'bg-amber-100 dark:bg-amber-900/40' : 'bg-gray-100 dark:bg-gray-700'
                        }`}>{dayLabel}</span>}
                      </div>
                      {p.nextInstallmentDescription && (
                        <p className="opacity-80 truncate">{p.nextInstallmentDescription}</p>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
                {editing ? 'Edit Property' : 'Add Property'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Property Name *
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. Prestige Lakeside Habitat"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Builder</label>
                    <input
                      type="text"
                      value={form.builderName}
                      onChange={(e) => setForm({ ...form, builderName: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Builder name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Location</label>
                    <input
                      type="text"
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="City / Area"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Total Cost (₹) *
                    </label>
                    <input
                      type="number"
                      value={form.totalCost}
                      onChange={(e) => setForm({ ...form, totalCost: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="e.g. 8500000"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Possession Date
                    </label>
                    <input
                      type="date"
                      value={form.possessionDate}
                      onChange={(e) => setForm({ ...form, possessionDate: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Self Contribution (₹)
                    </label>
                    <input
                      type="number"
                      value={form.selfContributionPlanned}
                      onChange={(e) => setForm({ ...form, selfContributionPlanned: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Loan Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={form.loanAmountPlanned}
                      onChange={(e) => setForm({ ...form, loanAmountPlanned: e.target.value })}
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="secondary" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" loading={saving}>
                    {editing ? 'Save Changes' : 'Add Property'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
