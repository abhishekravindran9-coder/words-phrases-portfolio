import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon, MapPinIcon, BuildingOfficeIcon,
  CalendarDaysIcon, ArrowRightIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { propertyService } from '../services/propertyService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import BuilderInstallmentsTab from '../components/property/BuilderInstallmentsTab';
import LoanTab from '../components/property/LoanTab';
import EmiScheduleTab from '../components/property/EmiScheduleTab';
import PrepaymentTab from '../components/property/PrepaymentTab';
import InsightsTab from '../components/property/InsightsTab';

const TABS = [
  { id: 'overview',     label: 'Overview',        shortLabel: 'Home',    emoji: '🏠' },
  { id: 'installments', label: 'Builder Payments', shortLabel: 'Builder', emoji: '📋' },
  { id: 'loan',         label: 'Loan',             shortLabel: 'Loan',    emoji: '🏦' },
  { id: 'emi',          label: 'EMI Schedule',     shortLabel: 'EMI',     emoji: '📅' },
  { id: 'prepayments',  label: 'Prepayments',      shortLabel: 'Prepay',  emoji: '⚡' },
  { id: 'insights',     label: 'Insights',         shortLabel: 'Stats',   emoji: '📊' },
];

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function fmtCr(v) {
  if (v == null) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${fmt(v)}`;
}

function fmtDate(d) {
  if (!d) return '—';
  if (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) {
    const [y, m, day] = d.split('-').map(Number);
    return new Date(y, m - 1, day).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PropertyDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [property, setProperty] = useState(null);
  const [loan, setLoan]         = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const prop = await propertyService.get(id);
      setProperty(prop);
      if (prop.hasLoan) {
        try { setLoan(await propertyService.getLoan(id)); } catch { /* ok */ }
      }
    } catch {
      toast.error('Property not found');
      navigate('/property-tracker');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;
  if (!property) return null;

  const progressPct = Math.min(100, property.percentComplete || 0);

  const daysLeft = property.daysToPoassession;
  const urgency = daysLeft == null ? 'neutral'
    : daysLeft < 0    ? 'past'
    : daysLeft <= 90  ? 'critical'
    : daysLeft <= 180 ? 'warning'
    : 'ok';
  const countdownCls = {
    neutral:  'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
    past:     'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
    critical: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
    warning:  'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
    ok:       'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  }[urgency];
  const countdownLabel = daysLeft == null ? null
    : daysLeft < 0  ? '✅ Possessed'
    : daysLeft === 0 ? '🎉 Today!'
    : `${daysLeft} days to possession`;

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">

      {/* ── Back ── */}
      <Link
        to="/property-tracker"
        className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
      >
        <ArrowLeftIcon className="h-4 w-4" /> All Properties
      </Link>

      {/* ── Hero card ── */}
      <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
        {/* Top accent stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-primary-400 via-indigo-400 to-violet-400" />

        <div className="p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">

            {/* Left: name + meta */}
            <div className="space-y-2.5 min-w-0">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white leading-tight">
                  {property.name}
                </h1>
              </div>

              {property.builderName && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-900/30 shrink-0">
                    <BuildingOfficeIcon className="h-3.5 w-3.5 text-primary-600 dark:text-primary-400" />
                  </span>
                  <span className="font-medium">{property.builderName}</span>
                </div>
              )}

              {property.location && (
                <div className="flex items-start gap-2 text-gray-500 dark:text-gray-400 text-sm">
                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-lg bg-rose-50 dark:bg-rose-900/30 shrink-0 mt-0.5">
                    <MapPinIcon className="h-3.5 w-3.5 text-rose-500 dark:text-rose-400" />
                  </span>
                  <span className="leading-snug">{property.location}</span>
                </div>
              )}

              {countdownLabel && (
                <div className="pt-1">
                  <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${countdownCls}`}>
                    {countdownLabel}
                  </span>
                </div>
              )}
            </div>

            {/* Right: possession date card */}
            {property.possessionDate && (
              <div className="shrink-0 bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-100 dark:border-primary-800/40 rounded-2xl px-5 py-4 text-center min-w-[130px]">
                <div className="flex justify-center mb-1">
                  <CalendarDaysIcon className="h-5 w-5 text-primary-500 dark:text-primary-400" />
                </div>
                <p className="text-xs text-primary-500 dark:text-primary-400 font-semibold uppercase tracking-wide">Possession</p>
                <p className="text-base font-extrabold text-primary-700 dark:text-primary-300 mt-0.5">{property.possessionDate}</p>
                {daysLeft != null && daysLeft >= 0 && (
                  <p className="text-xs text-primary-400 dark:text-primary-500 mt-1">{daysLeft}d remaining</p>
                )}
              </div>
            )}
          </div>

          {/* Progress section */}
          {property.totalInstallments > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Builder Payments</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 dark:text-gray-500">{property.paidInstallments}/{property.totalInstallments} paid</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    progressPct >= 100 ? 'bg-emerald-100 text-emerald-700' :
                    progressPct >= 50  ? 'bg-primary-100 text-primary-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>{progressPct.toFixed(0)}%</span>
                </div>
              </div>
              <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary-400 to-indigo-500 rounded-full transition-all duration-700"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
              <div className="flex justify-between mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                <span>₹{fmt(property.paidInstallmentAmount)} paid</span>
                <span>₹{fmt(property.totalInstallmentAmount)} total</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Tab nav ── */}
      <div className="flex gap-0 overflow-x-auto border-b border-gray-200 dark:border-gray-700">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <span className="text-sm">{t.emoji}</span>
            <span className="hidden sm:inline">{t.label}</span>
            <span className="sm:hidden text-xs">{t.shortLabel}</span>
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div>
        {tab === 'overview'     && <OverviewTab property={property} loan={loan} setTab={setTab} />}
        {tab === 'installments' && <BuilderInstallmentsTab propertyId={id} />}
        {tab === 'loan'         && <LoanTab propertyId={id} />}
        {tab === 'emi'          && <EmiScheduleTab propertyId={id} />}
        {tab === 'prepayments'  && <PrepaymentTab propertyId={id} />}
        {tab === 'insights'     && <InsightsTab propertyId={id} />}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  Overview Tab                                                                */
/* ─────────────────────────────────────────────────────────────────────────── */
function OverviewTab({ property, loan, setTab }) {
  const totalCost        = property.totalCost || 0;
  const paidBuilder      = property.paidInstallmentAmount || 0;
  const remainingBuilder = (property.totalInstallmentAmount || 0) - paidBuilder;
  const progressPct      = Math.min(100, property.percentComplete || 0);
  const selfPct          = totalCost > 0 ? +((property.selfContributionPlanned / totalCost) * 100).toFixed(1) : 0;
  const loanPct          = totalCost > 0 ? +((property.loanAmountPlanned / totalCost) * 100).toFixed(1) : 0;

  // Loan enrichment — fall back to property-level stubs when full loan not yet loaded
  const loanPrincipalPct      = loan?.percentComplete      ?? property.loanPercentRepaid;
  const loanTimelinePct       = loan?.timelinePercent      ?? (property.loanPaidCount && property.loanTotalMonths ? (property.loanPaidCount / property.loanTotalMonths) * 100 : null);
  const loanInterestSaved     = loan?.interestSaved        ?? 0;
  const loanInterestCostRatio = loan?.interestCostRatio;
  const loanClosureDate       = loan?.actualClosureDate    || loan?.closureDate;
  const loanNextEmiDate       = loan?.nextEmiDueDate;
  const loanDaysUntilEmi      = loan?.daysUntilNextEmi;
  const loanTotalInterest     = loan?.totalInterest;
  const loanPaidCount         = property.loanPaidCount    || 0;
  const loanTotalMonths       = property.loanTotalMonths  || 0;

  return (
    <div className="space-y-4">

      {/* ── 4 Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            emoji: '🏷️', label: 'Total Cost',
            value: fmtCr(property.totalCost),
            sub: `₹${fmt(property.totalCost)}`,
            bg: 'bg-indigo-50 dark:bg-indigo-900/30',
            val: 'text-indigo-700 dark:text-indigo-400',
          },
          {
            emoji: '👤', label: 'Self Contribution',
            value: fmtCr(property.selfContributionPlanned),
            sub: `${selfPct}% of total`,
            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
            val: 'text-emerald-700 dark:text-emerald-400',
          },
          {
            emoji: '🏦', label: 'Loan Amount',
            value: fmtCr(property.loanAmountPlanned),
            sub: `${loanPct}% of total`,
            bg: 'bg-amber-50 dark:bg-amber-900/30',
            val: 'text-amber-700 dark:text-amber-400',
          },
          {
            emoji: '📈', label: 'Builder Progress',
            value: `${progressPct.toFixed(0)}%`,
            sub: `${property.paidInstallments} of ${property.totalInstallments} paid`,
            bg: 'bg-primary-50 dark:bg-primary-900/30',
            val: 'text-primary-700 dark:text-primary-400',
          },
        ].map(({ emoji, label, value, sub, bg, val }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center text-sm mb-2.5`}>{emoji}</div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium">{label}</p>
            <p className={`text-lg font-bold mt-0.5 ${val}`}>{value}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Funding Split ── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">💰 Funding Split</p>
        <div className="flex h-4 rounded-full overflow-hidden mb-4">
          <div className="bg-gradient-to-r from-emerald-400 to-emerald-500 transition-all duration-700"
            style={{ width: `${selfPct}%` }} title={`Self: ${selfPct}%`} />
          <div className="w-0.5 bg-white dark:bg-gray-800 shrink-0" />
          <div className="bg-gradient-to-r from-amber-400 to-amber-500 transition-all duration-700"
            style={{ width: `${loanPct}%` }} title={`Loan: ${loanPct}%`} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 border border-emerald-100 dark:border-emerald-800/30">
            <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Self</p>
              <p className="text-sm font-bold text-emerald-700 dark:text-emerald-300">{fmtCr(property.selfContributionPlanned)}</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-500">{selfPct}% of total</p>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl p-3 border border-amber-100 dark:border-amber-800/30">
            <span className="w-3 h-3 rounded-full bg-amber-400 shrink-0" />
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Loan</p>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-300">{fmtCr(property.loanAmountPlanned)}</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-500">{loanPct}% of total</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Builder Payments + Loan side by side ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        {/* Builder Payments Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">📋</span>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Builder Payments</p>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              progressPct >= 100 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' :
              'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
            }`}>{progressPct.toFixed(0)}%</span>
          </div>

          <div className="text-center py-2">
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white tabular-nums">
              {property.paidInstallments}
              <span className="text-gray-300 dark:text-gray-600 font-light"> / </span>
              <span className="text-xl text-gray-400 dark:text-gray-500 font-semibold">{property.totalInstallments}</span>
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide font-medium">installments paid</p>
          </div>

          <div className="space-y-1">
            <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary-400 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${progressPct}%` }} />
            </div>
            <div className="flex justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>₹{fmt(paidBuilder)}</span>
              <span>₹{fmt(property.totalInstallmentAmount)}</span>
            </div>
          </div>

          <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Paid</span>
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{fmt(paidBuilder)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Remaining</span>
              <span className="font-semibold text-amber-600 dark:text-amber-400">₹{fmt(remainingBuilder)}</span>
            </div>
          </div>

          <button onClick={() => setTab('installments')}
            className="mt-auto flex items-center justify-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium pt-2 border-t border-gray-100 dark:border-gray-700">
            View all installments <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>

        {/* Loan Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🏦</span>
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Loan</p>
            </div>
            {property.hasLoan && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2.5 py-1 rounded-full">Active</span>
            )}
          </div>

          {property.hasLoan ? (
            <>
              <div className="text-center py-2">
                <p className="text-4xl font-extrabold text-gray-900 dark:text-white">{fmtCr(property.loanOutstanding)}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 uppercase tracking-wide font-medium">outstanding balance</p>
              </div>

              {/* Principal repaid bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500 dark:text-gray-400">Principal repaid</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{(loanPrincipalPct || 0).toFixed(1)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700"
                    style={{ width: `${Math.min(100, loanPrincipalPct || 0)}%` }} />
                </div>
              </div>

              {/* Tenure progress bar */}
              {loanTotalMonths > 0 && (
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400">Tenure progress</span>
                    <span className="font-medium text-gray-600 dark:text-gray-400">
                      {loanPaidCount}/{loanTotalMonths} mo ({(loanTimelinePct ?? (loanPaidCount / loanTotalMonths * 100)).toFixed(0)}%)
                    </span>
                  </div>
                  <div className="h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, loanTimelinePct ?? (loanPaidCount / loanTotalMonths * 100))}%` }} />
                  </div>
                </div>
              )}

              <div className="space-y-1.5 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Monthly EMI</span>
                  <span className="font-semibold text-gray-800 dark:text-gray-200">₹{fmt(property.loanEmi)}</span>
                </div>
                {loanClosureDate && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Closes on</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-200">{fmtDate(loanClosureDate)}</span>
                  </div>
                )}
                {loanInterestSaved > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Interest saved</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{fmt(loanInterestSaved)}</span>
                  </div>
                )}
                {loanInterestCostRatio > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Interest overhead</span>
                    <span className="font-semibold text-orange-500 dark:text-orange-400">{loanInterestCostRatio.toFixed(1)}%</span>
                  </div>
                )}
                {loanTotalInterest != null && (
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Total interest</span>
                    <span className="font-semibold text-red-500 dark:text-red-400">₹{fmt(loanTotalInterest)}</span>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
              <p className="text-4xl mb-2">🏦</p>
              <p className="text-sm text-gray-400 dark:text-gray-500">No loan added yet</p>
              <p className="text-xs text-gray-300 dark:text-gray-600 mt-1">Track your home loan here</p>
            </div>
          )}

          <button onClick={() => setTab('loan')}
            className="mt-auto flex items-center justify-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium pt-2 border-t border-gray-100 dark:border-gray-700">
            {property.hasLoan ? 'View loan details' : 'Add a loan'} <ArrowRightIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* ── Upcoming Obligations ── */}
      {(property.nextInstallmentAmount > 0 || property.loanEmi) && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📅 Upcoming Obligations</p>
          <div className="space-y-2.5">

            {/* Next EMI */}
            {property.loanEmi && (
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 border ${
                loanDaysUntilEmi != null && loanDaysUntilEmi <= 3
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  : loanDaysUntilEmi != null && loanDaysUntilEmi <= 10
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
              }`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                  loanDaysUntilEmi != null && loanDaysUntilEmi <= 3
                    ? 'bg-red-100 dark:bg-red-900/40' : 'bg-blue-100 dark:bg-blue-900/40'
                }`}>💳</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">EMI Payment</p>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-100">₹{fmt(property.loanEmi)}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Monthly</p>
                </div>
                <div className="text-right shrink-0">
                  {loanNextEmiDate ? (
                    <>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Due</p>
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{fmtDate(loanNextEmiDate)}</p>
                      {loanDaysUntilEmi != null && loanDaysUntilEmi >= 0 && (
                        <p className={`text-xs font-semibold mt-0.5 ${
                          loanDaysUntilEmi <= 3 ? 'text-red-500' :
                          loanDaysUntilEmi <= 10 ? 'text-amber-500' : 'text-blue-500'
                        }`}>in {loanDaysUntilEmi}d</p>
                      )}
                    </>
                  ) : <p className="text-xs text-gray-400 dark:text-gray-500">Recurring</p>}
                </div>
              </div>
            )}

            {/* Next Builder Installment */}
            {property.nextInstallmentAmount > 0 && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-xl shrink-0">📋</div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Builder Installment</p>
                  <p className="text-base font-bold text-gray-800 dark:text-gray-100">{fmtCr(property.nextInstallmentAmount)}</p>
                  {property.nextInstallmentDescription && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{property.nextInstallmentDescription}</p>
                  )}
                </div>
                {property.nextInstallmentDate && (
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Due</p>
                    <p className="text-sm font-bold text-amber-700 dark:text-amber-400">{fmtDate(property.nextInstallmentDate)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Interest Cost Insight (only if loan loaded) ── */}
      {loan && loanTotalInterest != null && (
        <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/15 dark:to-red-900/15 border border-orange-200 dark:border-orange-800/40 rounded-2xl p-5">
          <p className="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide mb-3">💡 Interest Cost Insight</p>
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                label: 'Future Interest',
                value: `₹${fmt(loanTotalInterest)}`,
                sub: 'still to pay',
                color: 'text-red-600 dark:text-red-400',
              },
              {
                label: 'Overhead Rate',
                value: loanInterestCostRatio ? `${loanInterestCostRatio.toFixed(1)}%` : '—',
                sub: 'of total outflow',
                color: 'text-orange-600 dark:text-orange-400',
              },
              {
                label: 'Interest Saved',
                value: loanInterestSaved > 0 ? `₹${fmt(loanInterestSaved)}` : '—',
                sub: 'via prepayments',
                color: loanInterestSaved > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-400 dark:text-gray-500',
              },
            ].map(({ label, value, sub, color }) => (
              <div key={label} className="bg-white/60 dark:bg-gray-800/40 rounded-xl p-2.5 text-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase tracking-wide leading-tight">{label}</p>
                <p className={`text-base font-extrabold mt-1 ${color}`}>{value}</p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 leading-tight">{sub}</p>
              </div>
            ))}
          </div>
          {loanInterestSaved === 0 && (
            <p className="text-xs text-orange-600 dark:text-orange-400 mt-3 bg-orange-100/50 dark:bg-orange-900/20 rounded-xl px-3 py-2">
              ⚡ Even a small prepayment now significantly reduces lifetime interest. Try the Prepayment Simulator.
            </p>
          )}
        </div>
      )}

      {/* ── Quick Nav ── */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { tab: 'installments', label: 'Builder Payments', emoji: '📋' },
          { tab: 'insights',     label: 'Insights',         emoji: '📊' },
          { tab: property.hasLoan ? 'prepayments' : 'loan', label: property.hasLoan ? 'Prepayments' : 'Add Loan', emoji: property.hasLoan ? '⚡' : '🏦' },
        ].map(({ tab: t, label, emoji }) => (
          <button key={t} onClick={() => setTab(t)}
            className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border border-gray-100 dark:border-gray-700">
            <span className="text-xl">{emoji}</span>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-300 text-center leading-tight">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
