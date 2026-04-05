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
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BuildingOffice2Icon className="h-7 w-7 text-primary-600" />
            Property Tracker
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track builder installments, loans and EMIs
          </p>
        </div>
        <Button onClick={openCreate} size="md">
          <PlusIcon className="h-4 w-4" /> Add Property
        </Button>
      </div>

      {/* Property cards */}
      {properties.length === 0 ? (
        <div className="text-center py-20 text-gray-400 dark:text-gray-500">
          <BuildingOffice2Icon className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium text-gray-500 dark:text-gray-400">No properties yet</p>
          <p className="text-sm mt-1">Click "Add Property" to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {properties.map((p) => (
            <div
              key={p.id}
              onClick={() => navigate(`/property-tracker/${p.id}`)}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 cursor-pointer hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 dark:text-white truncate">{p.name}</h2>
                  {p.builderName && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{p.builderName}</p>
                  )}
                  {p.location && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate mt-0.5">{p.location}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Cost</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">₹{fmt(p.totalCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Installments</p>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">
                    {p.paidInstallments}/{p.totalInstallments} paid
                  </p>
                </div>
                {p.possessionDate && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Possession</p>
                    <p className="font-medium text-gray-700 dark:text-gray-300">{p.possessionDate}</p>
                  </div>
                )}
                {p.hasLoan && (
                  <div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Loan</p>
                    <p className="text-xs font-medium text-primary-600 dark:text-primary-400">Active</p>
                  </div>
                )}
              </div>

              {p.totalInstallments > 0 && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500 mb-1">
                    <span>Installment progress</span>
                    <span>{p.percentComplete?.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, p.percentComplete || 0)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
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
