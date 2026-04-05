import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircleIcon as CheckCircleSolid } from '@heroicons/react/24/solid';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { propertyService } from '../../services/propertyService';

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

const TODAY = new Date().toISOString().slice(0, 10);

export default function EmiScheduleTab({ propertyId }) {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState(new Set()); // set of month numbers
  const [showAll, setShowAll]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSchedule(await propertyService.getSchedule(propertyId));
      setSelected(new Set());
    } catch (err) {
      if (err?.response?.status !== 404) toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  // Optimistically mark a single month paid in local state (no reload)
  const markLocalPaid = (month) =>
    setSchedule((prev) => prev.map((e) => e.month === month ? { ...e, paid: true } : e));

  const handleMarkPaid = async (month) => {
    markLocalPaid(month); // instant UI update
    try {
      await propertyService.markEmiPaid(propertyId, month, null);
    } catch {
      toast.error(`Failed to mark EMI #${month}`);
      load(); // revert on failure
    }
  };

  const toggleSelect = (month) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  };

  const selectAllPast = () => {
    const pastUnpaid = schedule
      .filter((e) => !e.paid && e.date <= TODAY)
      .map((e) => e.month);
    setSelected(new Set(pastUnpaid));
  };

  const clearSelection = () => setSelected(new Set());

  const handleBulkPay = async () => {
    if (selected.size === 0) return;
    setBulkBusy(true);
    const months = [...selected].sort((a, b) => a - b);
    // Optimistic update first
    setSchedule((prev) => prev.map((e) => selected.has(e.month) ? { ...e, paid: true } : e));
    setSelected(new Set());
    let failed = 0;
    await Promise.all(
      months.map((m) =>
        propertyService.markEmiPaid(propertyId, m, null).catch(() => { failed++; })
      )
    );
    if (failed > 0) {
      toast.error(`${failed} EMI(s) failed to save — reloading`);
      load();
    } else {
      toast.success(`${months.length} EMI(s) marked as paid`);
    }
    setBulkBusy(false);
  };

  if (loading) return <p className="text-sm text-gray-400 py-4">Loading…</p>;

  if (schedule.length === 0) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500 py-12 text-center">
        Add a loan with an EMI start date to see the amortization schedule.
      </p>
    );
  }

  const displayed = showAll ? schedule : schedule.slice(0, 24);
  const unpaidMonths = new Set(schedule.filter((e) => !e.paid).map((e) => e.month));
  const pastUnpaidCount = schedule.filter((e) => !e.paid && e.date <= TODAY).length;

  const paidCount     = schedule.filter((e) => e.paid).length;
  const totalInterest = schedule.reduce((s, e) => s + (e.interest || 0), 0);
  const paidInterest  = schedule.filter((e) => e.paid).reduce((s, e) => s + (e.interest || 0), 0);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Paid</p>
          <p className="font-semibold text-green-600 dark:text-green-400">{paidCount}/{schedule.length}</p>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Interest Paid</p>
          <p className="font-semibold text-gray-800 dark:text-gray-100">₹{fmt(paidInterest)}</p>
        </div>
        <div className="rounded-xl bg-gray-50 dark:bg-gray-700/40 p-3 text-center">
          <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">Total Interest</p>
          <p className="font-semibold text-red-500 dark:text-red-400">₹{fmt(totalInterest)}</p>
        </div>
      </div>

      {/* Bulk action bar */}
      <div className="flex flex-wrap items-center gap-2">
        {pastUnpaidCount > 0 && selected.size === 0 && (
          <button
            onClick={selectAllPast}
            className="text-xs px-3 py-1.5 rounded-lg border border-indigo-300 dark:border-indigo-700 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors font-medium"
          >
            Select past due ({pastUnpaidCount})
          </button>
        )}
        {selected.size > 0 && (
          <>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {selected.size} selected
            </span>
            <button
              onClick={handleBulkPay}
              disabled={bulkBusy}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors disabled:opacity-60"
            >
              {bulkBusy ? 'Saving…' : `Mark ${selected.size} as Paid`}
            </button>
            <button
              onClick={clearSelection}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
            >
              Clear
            </button>
          </>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="px-3 py-2 w-8"></th>
              {['#', 'Date', 'EMI', 'Principal', 'Interest', 'Balance', ''].map((h) => (
                <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
            {displayed.map((entry) => {
              const isSelected = selected.has(entry.month);
              return (
                <tr
                  key={entry.month}
                  className={`transition-colors ${
                    entry.paid
                      ? 'bg-green-50/60 dark:bg-green-900/10'
                      : isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/20'
                      : entry.prepaymentMonth
                      ? 'bg-primary-50/60 dark:bg-primary-900/10'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                  }`}
                >
                  {/* Checkbox for unpaid rows */}
                  <td className="px-3 py-2">
                    {!entry.paid && (
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(entry.month)}
                        className="rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                      />
                    )}
                  </td>
                  <td className="px-3 py-2 font-medium text-gray-700 dark:text-gray-300">
                    {entry.month}
                    {entry.prepaymentMonth && (
                      <span className="ml-1 text-xs text-primary-600 dark:text-primary-400">↓</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400 whitespace-nowrap">{entry.date}</td>
                  <td className="px-3 py-2 text-gray-900 dark:text-gray-100">₹{fmt(entry.emi)}</td>
                  <td className="px-3 py-2 text-gray-700 dark:text-gray-300">₹{fmt(entry.principal)}</td>
                  <td className="px-3 py-2 text-red-500 dark:text-red-400">₹{fmt(entry.interest)}</td>
                  <td className="px-3 py-2 text-gray-600 dark:text-gray-400">₹{fmt(entry.balance)}</td>
                  <td className="px-3 py-2">
                    {entry.paid ? (
                      <CheckCircleSolid className="h-5 w-5 text-green-500" />
                    ) : (
                      <button
                        onClick={() => handleMarkPaid(entry.month)}
                        className="text-xs px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-green-100 dark:hover:bg-green-900/30 hover:text-green-700 dark:hover:text-green-400 transition-colors"
                      >
                        Pay
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {schedule.length > 24 && (
        <button
          onClick={() => setShowAll((v) => !v)}
          className="w-full text-center text-sm text-primary-600 dark:text-primary-400 hover:underline py-1"
        >
          {showAll ? 'Show less' : `Show all ${schedule.length} months`}
        </button>
      )}
    </div>
  );
}
