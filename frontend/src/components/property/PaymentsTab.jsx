import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, BanknotesIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { propertyService } from '../../services/propertyService';
import { isPrivacyMode, maskMoney, togglePrivacyMode } from '../../utils/privacy';
import BuilderInstallmentsTab from './BuilderInstallmentsTab';

const money = (value) => `₹${new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(value || 0)}`;
const dateLabel = (value) => value ? new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Date not set';
const installmentSource = (item) => {
  const sources = [
    item.paidViaLoan > 0 && `Bank ${money(item.paidViaLoan)}`,
    item.paidViaSelf > 0 && `Self ${money(item.paidViaSelf)}`,
  ].filter(Boolean);
  return sources.length ? sources.join(' · ') : 'Pending';
};

export default function PaymentsTab({ propertyId }) {
  const [installments, setInstallments] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [prepayments, setPrepayments] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [privateMode, setPrivateMode] = useState(isPrivacyMode());

  useEffect(() => {
    Promise.allSettled([
      propertyService.getInstallments(propertyId),
      propertyService.getSchedule(propertyId),
      propertyService.getPrepayments(propertyId),
    ]).then(([inst, emi, prep]) => {
      setInstallments(inst.status === 'fulfilled' ? inst.value : []);
      setSchedule(emi.status === 'fulfilled' ? emi.value : []);
      setPrepayments(prep.status === 'fulfilled' ? prep.value : []);
    }).finally(() => setLoading(false));
  }, [propertyId]);

  const rows = useMemo(() => [
    ...installments.map((item) => ({
      id: `installment-${item.id}`, kind: 'BUILDER', label: item.description || 'Builder installment',
      date: item.paidDate || item.dueDate, dueDate: item.dueDate, amount: item.amount,
      paid: item.paid, source: installmentSource(item),
    })),
    ...schedule.filter((item) => item.paid).map((item) => ({
      id: `emi-${item.month}`, kind: 'EMI', label: `EMI #${item.month}`, date: item.date,
      dueDate: item.date, amount: item.emi, paid: true, source: 'Bank',
    })),
    ...prepayments.map((item) => ({
      id: `prepayment-${item.id}`, kind: 'PREPAYMENT', label: 'Loan prepayment', date: item.prepaymentDate,
      dueDate: item.prepaymentDate, amount: item.amount, paid: true, source: item.prepaymentType === 'REDUCE_EMI' ? 'Reduce EMI' : 'Reduce tenure',
    })),
  ].sort((a, b) => new Date(b.date || b.dueDate || 0) - new Date(a.date || a.dueDate || 0)), [installments, schedule, prepayments]);

  const filtered = rows.filter((row) => filter === 'ALL' || (filter === 'PAID' ? row.paid : !row.paid));
  const exportCsv = () => {
    const csv = ['Type,Description,Date,Due date,Amount,Status,Source', ...filtered.map((row) => [row.kind, row.label, row.date || '', row.dueDate || '', row.amount || 0, row.paid ? 'Paid' : 'Pending', row.source].map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'property-payments.csv'; link.click(); URL.revokeObjectURL(url);
    toast.success('Payments exported');
  };
  const exportCalendar = () => {
    const events = rows.filter((row) => !row.paid && row.dueDate).map((row) => `BEGIN:VEVENT\nSUMMARY:${row.label}\nDTSTART;VALUE=DATE:${row.dueDate.replaceAll('-', '')}\nDESCRIPTION:${row.kind} obligation\nEND:VEVENT`).join('\n');
    const blob = new Blob([`BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//My Vault//Property//EN\n${events}\nEND:VCALENDAR`], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = 'property-obligations.ics'; link.click(); URL.revokeObjectURL(url);
  };

  if (loading) return <div className="py-10 text-sm text-[var(--mv-ink-soft)]">Loading payments…</div>;

  return <div className="space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mv-eyebrow">Cash ledger</p><h2 className="mv-display mt-1 text-2xl text-[var(--mv-ink)]">Payments</h2><p className="mt-1 text-sm text-[var(--mv-ink-soft)]">Installments, EMIs, and prepayments in one chronological view.</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => { const next = togglePrivacyMode(); setPrivateMode(next); }} className="min-h-11 rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] px-3 text-xs font-bold text-[var(--mv-ink-soft)]">{privateMode ? 'Show amounts' : 'Privacy mode'}</button><button type="button" onClick={exportCalendar} className="min-h-11 rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] px-3 text-xs font-bold text-[var(--mv-ink-soft)]">Calendar</button><button type="button" onClick={exportCsv} className="flex min-h-11 items-center gap-2 rounded-[var(--mv-radius-sm)] border border-[var(--mv-line)] px-3 text-sm font-bold text-[var(--mv-ink-soft)] hover:bg-[var(--mv-paper-deep)]"><ArrowDownTrayIcon className="h-4 w-4" /> CSV</button></div></div>
    <div className="flex gap-2 border-b border-[var(--mv-line)]"><button type="button" onClick={() => setFilter('ALL')} className={`min-h-11 border-b-2 px-3 text-sm font-bold ${filter === 'ALL' ? 'border-[var(--mv-moss)] text-[var(--mv-moss)]' : 'border-transparent text-[var(--mv-ink-soft)]'}`}>All {rows.length}</button><button type="button" onClick={() => setFilter('PAID')} className={`min-h-11 border-b-2 px-3 text-sm font-bold ${filter === 'PAID' ? 'border-[var(--mv-moss)] text-[var(--mv-moss)]' : 'border-transparent text-[var(--mv-ink-soft)]'}`}>Paid</button><button type="button" onClick={() => setFilter('PENDING')} className={`min-h-11 border-b-2 px-3 text-sm font-bold ${filter === 'PENDING' ? 'border-[var(--mv-moss)] text-[var(--mv-moss)]' : 'border-transparent text-[var(--mv-ink-soft)]'}`}>Pending</button></div>
    <div className="divide-y divide-[var(--mv-line)] rounded-[var(--mv-radius-lg)] border border-[var(--mv-line)] bg-[var(--mv-paper)]">{filtered.length === 0 ? <p className="p-8 text-center text-sm text-[var(--mv-ink-soft)]">No payments in this view.</p> : filtered.map((row) => <div key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-4"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--mv-paper-deep)] text-[var(--mv-moss)]">{row.paid ? <CheckCircleIcon className="h-5 w-5" /> : <ClockIcon className="h-5 w-5 text-[var(--mv-terracotta)]" />}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-bold text-[var(--mv-ink)]">{row.label}</p><p className="text-xs text-[var(--mv-ink-soft)]">{row.kind} · {dateLabel(row.date || row.dueDate)} · {row.source}</p></div><p className="font-bold text-[var(--mv-ink)]">{privateMode ? maskMoney(row.amount) : money(row.amount)}</p><span className={`text-xs font-bold ${row.paid ? 'text-[var(--mv-moss)]' : 'text-[var(--mv-terracotta)]'}`}>{row.paid ? 'Paid' : 'Pending'}</span></div>)}</div>
    <section className="border-t border-[var(--mv-line)] pt-6"><BuilderInstallmentsTab propertyId={propertyId} /></section>
  </div>;
}
