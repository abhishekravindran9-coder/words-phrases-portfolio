import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
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

function StatBox({ label, value, sub, colored }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-xl font-bold mt-1 ${colored || 'text-gray-900 dark:text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{sub}</p>}
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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-5">
      {/* Back + header */}
      <div>
        <Link
          to="/property-tracker"
          className="inline-flex items-center gap-1 text-sm text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 mb-3"
        >
          <ArrowLeftIcon className="h-4 w-4" /> All Properties
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{property.name}</h1>
            {property.builderName && (
              <p className="text-sm text-gray-500 dark:text-gray-400">{property.builderName}</p>
            )}
            {property.location && (
              <p className="text-xs text-gray-400 dark:text-gray-500">{property.location}</p>
            )}
          </div>
          {property.possessionDate && (
            <div className="text-right shrink-0">
              <p className="text-xs text-gray-400 dark:text-gray-500">Possession</p>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{property.possessionDate}</p>
            </div>
          )}
        </div>
      </div>

      {/* Tab nav */}
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

      {/* Tab content */}
      <div>
        {tab === 'overview' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatBox label="Total Cost"   value={`₹${fmt(property.totalCost)}`} />
              <StatBox label="Self Contrib" value={`₹${fmt(property.selfContributionPlanned)}`} sub={`${selfPct}% of total`} />
              <StatBox label="Loan Planned" value={`₹${fmt(property.loanAmountPlanned)}`} sub={`${loanPct}% of total`} />
              <StatBox label="Progress"     value={`${property.percentComplete?.toFixed(0) ?? 0}%`}
                sub={`${property.paidInstallments}/${property.totalInstallments} paid`}
                colored="text-primary-600 dark:text-primary-400" />
            </div>

            {/* Progress bar */}
            {property.totalInstallments > 0 && (
              <div>
                <div className="flex justify-between text-sm text-gray-500 dark:text-gray-400 mb-1">
                  <span>Installment progress</span>
                  <span>₹{fmt(property.paidInstallmentAmount)} / ₹{fmt(property.totalInstallmentAmount)}</span>
                </div>
                <div className="h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${Math.min(100, property.percentComplete || 0)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Installments</p>
                <p className="font-semibold text-gray-800 dark:text-gray-100">
                  {property.paidInstallments} of {property.totalInstallments} paid
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">₹{fmt(property.paidInstallmentAmount)} paid</p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  ₹{fmt((property.totalInstallmentAmount || 0) - (property.paidInstallmentAmount || 0))} remaining
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700/40 rounded-xl p-4">
                <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Loan</p>
                {property.hasLoan ? (
                  <p className="font-semibold text-primary-600 dark:text-primary-400">Loan tracked</p>
                ) : (
                  <p className="text-gray-400 dark:text-gray-500">No loan added</p>
                )}
                <button
                  onClick={() => setTab('loan')}
                  className="mt-1 text-xs text-primary-600 dark:text-primary-400 hover:underline"
                >
                  {property.hasLoan ? 'View loan →' : 'Add loan →'}
                </button>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              <button onClick={() => setTab('installments')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                View Installments →
              </button>
              <button onClick={() => setTab('insights')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
                View Insights →
              </button>
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
