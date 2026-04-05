import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeftIcon, MapPinIcon, BuildingOfficeIcon,
  CalendarDaysIcon, CurrencyRupeeIcon, CheckCircleIcon,
  ClockIcon, BanknotesIcon, ChartBarIcon, ArrowRightIcon,
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
  { id: 'overview',      label: 'Overview' },
  { id: 'installments',  label: 'Builder Payments' },
  { id: 'loan',          label: 'Loan' },
  { id: 'emi',           label: 'EMI Schedule' },
  { id: 'prepayments',   label: 'Prepayments' },
  { id: 'insights',      label: 'Insights' },
];

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function fmtCr(v) {
  if (!v && v !== 0) return '—';
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${fmt(v)}`;
}

function MetricCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 flex gap-3 items-start">
      <div className={`p-2 rounded-xl shrink-0 ${accent || 'bg-primary-50 dark:bg-primary-900/30'}`}>
        <Icon className={`h-5 w-5 ${accent ? 'text-current' : 'text-primary-600 dark:text-primary-400'}`} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export default function PropertyDetailPage() {
  const { id }        = useParams();
  const navigate      = useNavigate();
  const [property, setProperty] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('overview');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProperty(await propertyService.get(id));
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

  const selfPct = property.totalCost
    ? ((property.selfContributionPlanned / property.totalCost) * 100).toFixed(0)
    : 0;
  const loanPct = property.totalCost
    ? ((property.loanAmountPlanned / property.totalCost) * 100).toFixed(0)
    : 0;
  const progressPct = Math.min(100, property.percentComplete || 0);
  const remaining = (property.totalInstallmentAmount || 0) - (property.paidInstallmentAmount || 0);

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
      <div className="flex gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 pb-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? 'border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div>
        {tab === 'overview' && (
          <div className="space-y-5">

            {/* ── 4 metric cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <MetricCard
                icon={CurrencyRupeeIcon}
                label="Total Cost"
                value={fmtCr(property.totalCost)}
                sub={`₹${fmt(property.totalCost)}`}
                accent="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
              />
              <MetricCard
                icon={BanknotesIcon}
                label="Self Contribution"
                value={fmtCr(property.selfContributionPlanned)}
                sub={`${selfPct}% of total`}
                accent="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
              />
              <MetricCard
                icon={ChartBarIcon}
                label="Loan Planned"
                value={fmtCr(property.loanAmountPlanned)}
                sub={`${loanPct}% of total`}
                accent="bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400"
              />
              <MetricCard
                icon={CheckCircleIcon}
                label="Progress"
                value={`${progressPct.toFixed(0)}%`}
                sub={`${property.paidInstallments} of ${property.totalInstallments} paid`}
                accent="bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400"
              />
            </div>

            {/* ── Funding split visual ── */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Funding Split</p>
              <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
                <div className="bg-emerald-400 rounded-l-full transition-all" style={{ width: `${selfPct}%` }} title={`Self: ${selfPct}%`} />
                <div className="bg-amber-400 rounded-r-full transition-all" style={{ width: `${loanPct}%` }} title={`Loan: ${loanPct}%`} />
              </div>
              <div className="flex gap-4 text-xs text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400" />Self ({selfPct}%)</span>
                <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />Loan ({loanPct}%)</span>
              </div>
            </div>

            {/* ── Installments + Loan panels ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <ClockIcon className="h-4 w-4 text-primary-500" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Installments</p>
                </div>
                <p className="text-xl font-extrabold text-gray-900 dark:text-white">
                  {property.paidInstallments} <span className="text-gray-400 font-normal text-base">of {property.totalInstallments}</span>
                </p>
                <div className="mt-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Paid</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">₹{fmt(property.paidInstallmentAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 dark:text-gray-400">Remaining</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">₹{fmt(remaining)}</span>
                  </div>
                </div>
                <button onClick={() => setTab('installments')}
                  className="mt-4 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  View all installments <ArrowRightIcon className="h-3 w-3" />
                </button>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BanknotesIcon className="h-4 w-4 text-amber-500" />
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Loan</p>
                </div>
                {property.hasLoan ? (
                  <>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="space-y-1 text-sm">
                      {property.loanOutstanding != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Outstanding</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">{fmtCr(property.loanOutstanding)}</span>
                        </div>
                      )}
                      {property.loanEmi != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Monthly EMI</span>
                          <span className="font-semibold text-gray-800 dark:text-gray-200">₹{fmt(property.loanEmi)}</span>
                        </div>
                      )}
                      {property.loanPercentRepaid != null && (
                        <div className="flex justify-between">
                          <span className="text-gray-500 dark:text-gray-400">Repaid</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{property.loanPercentRepaid.toFixed(1)}%</span>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500 text-sm">No loan added yet.</p>
                )}
                <button onClick={() => setTab('loan')}
                  className="mt-4 flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  {property.hasLoan ? 'View loan details' : 'Add a loan'} <ArrowRightIcon className="h-3 w-3" />
                </button>
              </div>
            </div>

            {/* ── Next installment callout ── */}
            {property.nextInstallmentAmount > 0 && (
              <div className="flex items-center gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-5 py-4">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-xl shrink-0">
                  <ClockIcon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-semibold uppercase tracking-wide">Next Due</p>
                  <p className="text-base font-extrabold text-amber-800 dark:text-amber-200">{fmtCr(property.nextInstallmentAmount)}</p>
                  {property.nextInstallmentDescription && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 truncate">{property.nextInstallmentDescription}</p>
                  )}
                </div>
                {property.nextInstallmentDate && (
                  <div className="ml-auto text-right shrink-0">
                    <p className="text-xs text-amber-500">Due date</p>
                    <p className="text-sm font-bold text-amber-800 dark:text-amber-200">{property.nextInstallmentDate}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── Quick nav links ── */}
            <div className="flex gap-3 flex-wrap pt-1">
              <button onClick={() => setTab('installments')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                View Installments →
              </button>
              <button onClick={() => setTab('insights')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                View Insights →
              </button>
              {property.hasLoan && (
                <button onClick={() => setTab('emi')}
                  className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
                  EMI Schedule →
                </button>
              )}
            </div>
          </div>
        )}

        {tab === 'installments' && <BuilderInstallmentsTab propertyId={id} />}
        {tab === 'loan'         && <LoanTab propertyId={id} />}
        {tab === 'emi'          && <EmiScheduleTab propertyId={id} />}
        {tab === 'prepayments'  && <PrepaymentTab propertyId={id} />}
        {tab === 'insights'     && <InsightsTab propertyId={id} />}
      </div>
    </div>
  );
}
