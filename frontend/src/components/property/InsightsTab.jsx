import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  ExclamationTriangleIcon,
  LightBulbIcon,
  CalendarDaysIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import { ExclamationCircleIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import { propertyService } from '../../services/propertyService';
import { useTheme } from '../../context/ThemeContext';

ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, ArcElement, Title, Tooltip, Legend, Filler,
);

function fmt(n) {
  if (n == null) return '—';
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}
function fmtL(n) {
  if (n == null) return '—';
  if (n >= 10_00_000) return `₹${(n / 10_00_000).toFixed(1)}L`;
  if (n >= 1_00_000)  return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_000)     return `₹${(n / 1_000).toFixed(0)}K`;
  return `₹${n}`;
}

const METRIC_ICONS = {
  'EMI':                            '💳',
  'EMIs Paid':                      '✅',
  'Principal Repaid':               '🏦',
  'Interest Burden':                '⚖️',
  'Total Interest':                 '📈',
  'Interest Saved via Prepayments': '💰',
  'Loan Closure':                   '🏁',
  'Years Remaining':                '⏳',
  'Builder Progress':               '🏗️',
  'Builder Paid':                   '✅',
  'Builder Remaining':              '🔲',
};

export default function InsightsTab({ propertyId }) {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading]   = useState(true);
  const { theme } = useTheme();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setInsights(await propertyService.getInsights(propertyId));
    } catch (err) {
      if (err?.response?.status !== 404) toast.error('Failed to load insights');
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => { load(); }, [load]);

  // ── Shared chart colours ──────────────────────────────────────────────────────
  const C = useMemo(() => {
    const dk = theme === 'dark';
    return {
      text:         dk ? '#d1d5db' : '#374151',
      subText:      dk ? '#9ca3af' : '#6b7280',
      grid:         dk ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
      balance:      dk ? 'rgba(45,212,191,0.9)'  : 'rgba(13,148,136,0.9)',
      balanceFill:  dk ? 'rgba(45,212,191,0.12)' : 'rgba(13,148,136,0.08)',
      todayDot:     '#f97316',
      principal:    'rgba(99,102,241,0.85)',
      principalBg:  'rgba(99,102,241,0.15)',
      interest:     'rgba(239,68,68,0.85)',
      interestBg:   'rgba(239,68,68,0.15)',
      pPaid:   '#22c55e', pRem:  '#3b82f6',
      iPaid:   '#f97316', iRem:  '#ef4444',
      bPaid:   '#34d399', bRem:  dk ? '#4b5563' : '#d1d5db',
    };
  }, [theme]);

  // ── Axis / layout helpers ─────────────────────────────────────────────────────
  const axesOpts = useMemo(() => ({
    x: {
      ticks: { color: C.subText, maxTicksLimit: 14, maxRotation: 45 },
      grid:  { color: C.grid },
    },
    y: {
      ticks: { color: C.subText, callback: (v) => fmtL(v) },
      grid:  { color: C.grid },
    },
  }), [C]);

  const tooltipOpts = useMemo(() => ({
    backgroundColor: theme === 'dark' ? '#1f2937' : '#fff',
    titleColor:      C.text,
    bodyColor:       C.text,
    borderColor:     theme === 'dark' ? '#374151' : '#e5e7eb',
    borderWidth:     1,
    callbacks: {
      label: (ctx) => ` ${ctx.dataset.label}: ${fmtL(ctx.parsed.y ?? ctx.parsed)}`,
    },
  }), [C, theme]);

  if (loading) return (
    <div className="flex items-center gap-2 py-8 text-gray-400">
      <ArrowPathIcon className="h-4 w-4 animate-spin" />
      <span className="text-sm">Analysing your property…</span>
    </div>
  );

  if (!insights) {
    return <p className="text-sm text-gray-400 dark:text-gray-500 py-12 text-center">No insights available yet.</p>;
  }

  const { alerts = [], suggestions = [], upcomingPayments = [], metrics = {}, chartData } = insights;
  const metricEntries = Object.entries(metrics);

  // ── Chart datasets ────────────────────────────────────────────────────────────
  const balanceLineData = chartData ? {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Outstanding Balance',
        data: chartData.balance,
        borderColor: C.balance,
        backgroundColor: C.balanceFill,
        fill: true,
        tension: 0.4,
        pointRadius: chartData.balance.map((_, i) => i === chartData.todayIndex ? 6 : 0),
        pointHoverRadius: 5,
        pointBackgroundColor: chartData.balance.map((_, i) =>
          i === chartData.todayIndex ? C.todayDot : C.balance),
        pointBorderColor: chartData.balance.map((_, i) =>
          i === chartData.todayIndex ? '#fff' : C.balance),
        pointBorderWidth: chartData.balance.map((_, i) => i === chartData.todayIndex ? 2 : 0),
      },
    ],
  } : null;

  const emiBreakdownData = chartData ? {
    labels: chartData.yearLabels,
    datasets: [
      {
        label: 'Principal',
        data: chartData.yearlyPrincipal,
        backgroundColor: C.principal,
        borderRadius: 4,
        stack: 'emi',
      },
      {
        label: 'Interest',
        data: chartData.yearlyInterest,
        backgroundColor: C.interest,
        borderRadius: 4,
        stack: 'emi',
      },
    ],
  } : null;

  const loanDonutData = chartData ? {
    labels: ['Principal Paid', 'Principal Remaining', 'Interest Paid', 'Interest Remaining'],
    datasets: [{
      data: [
        chartData.principalPaid,
        chartData.principalRemaining,
        chartData.interestPaid,
        chartData.interestRemaining,
      ],
      backgroundColor: [C.pPaid, C.pRem, C.iPaid, C.iRem],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  } : null;

  const builderDonutData = chartData?.builderPaid != null ? {
    labels: ['Paid', 'Remaining'],
    datasets: [{
      data: [chartData.builderPaid, chartData.builderRemaining],
      backgroundColor: [C.bPaid, C.bRem],
      borderWidth: 0,
      hoverOffset: 6,
    }],
  } : null;

  const donutOpts = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '68%',
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipOpts,
        callbacks: { label: (ctx) => ` ${ctx.label}: ₹${fmt(ctx.parsed)}` },
      },
    },
  };

  return (
    <div className="space-y-6">

      {/* ── Financial Snapshot ─────────────────────────────────────────────── */}
      {metricEntries.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <ChartBarIcon className="h-4 w-4" />
            Financial Snapshot
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {metricEntries.map(([key, value]) => (
              <div key={key} className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-1 flex items-center gap-1">
                  <span>{METRIC_ICONS[key] ?? '📊'}</span>{key}
                </p>
                <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm leading-snug">{value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Charts ─────────────────────────────────────────────────────────── */}
      {chartData && (
        <div className="space-y-4">
          <h3 className="flex items-center gap-1.5 font-semibold text-gray-700 dark:text-gray-300">
            <ChartBarIcon className="h-4 w-4" />
            Visual Breakdown
          </h3>

          {/* Row 1: Two donuts ─────────────────────────────────────────────── */}
          <div className={`grid gap-4 ${builderDonutData ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2'}`}>

            {/* Loan Cost Donut */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Loan Cost Breakdown</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                Total outflow: <span className="font-medium text-gray-600 dark:text-gray-300">
                  ₹{fmt((chartData.principalPaid || 0) + (chartData.principalRemaining || 0) +
                       (chartData.interestPaid || 0) + (chartData.interestRemaining || 0))}
                </span>
              </p>
              {/* Mobile: donut centered above legend | sm+: side by side */}
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                <div className="h-36 w-36 shrink-0">
                  <Doughnut data={loanDonutData} options={donutOpts} />
                </div>
                {/* Legend: 2-col grid on mobile, single col on sm+ */}
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-x-4 gap-y-2 w-full sm:w-auto">
                  {[
                    { color: C.pPaid, label: 'Principal Paid',      val: chartData.principalPaid },
                    { color: C.pRem,  label: 'Principal Remaining',  val: chartData.principalRemaining },
                    { color: C.iPaid, label: 'Interest Paid',        val: chartData.interestPaid },
                    { color: C.iRem,  label: 'Interest Remaining',   val: chartData.interestRemaining },
                  ].map(({ color, label, val }) => (
                    <div key={label}>
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{label}</span>
                      </div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 pl-3.5">₹{fmt(val)}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Builder Progress Donut */}
            {builderDonutData && (
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-0.5">Builder Payments</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  Total: <span className="font-medium text-gray-600 dark:text-gray-300">
                    ₹{fmt((chartData.builderPaid || 0) + (chartData.builderRemaining || 0))}
                  </span>
                </p>
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center">
                  <div className="relative h-36 w-36 shrink-0">
                    <Doughnut data={builderDonutData} options={{
                      ...donutOpts,
                      plugins: {
                        ...donutOpts.plugins,
                        tooltip: {
                          ...tooltipOpts,
                          callbacks: { label: (ctx) => ` ${ctx.label}: ₹${fmt(ctx.parsed)}` },
                        },
                      },
                    }} />
                    {/* Centre % */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xl font-bold text-gray-800 dark:text-gray-100">
                        {Math.round((chartData.builderPaid / ((chartData.builderPaid || 0) + (chartData.builderRemaining || 0))) * 100)}%
                      </span>
                      <span className="text-xs text-gray-400 dark:text-gray-500">paid</span>
                    </div>
                  </div>
                  <div className="w-full sm:w-auto space-y-3">
                    {[
                      { color: C.bPaid, label: 'Paid',      val: chartData.builderPaid },
                      { color: C.bRem,  label: 'Remaining', val: chartData.builderRemaining },
                    ].map(({ color, label, val }) => (
                      <div key={label}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                          <span className="text-[11px] text-gray-500 dark:text-gray-400">{label}</span>
                        </div>
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 pl-3.5">₹{fmt(val)}</p>
                      </div>
                    ))}
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.round((chartData.builderPaid / ((chartData.builderPaid || 0) + (chartData.builderRemaining || 0))) * 100)}%`,
                          background: C.bPaid,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Row 2: Outstanding Balance Line ──────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="mb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Outstanding Balance Over Time</p>
                <span className="text-xs bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400 rounded-full px-2 py-0.5 font-medium shrink-0">
                  ₹{fmt(chartData.balance[chartData.todayIndex] ?? chartData.balance[0])} now
                </span>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                Principal declines month by month
                {chartData.todayIndex >= 0 && (
                  <span className="ml-1">· <span className="inline-block h-2 w-2 rounded-full bg-orange-400 mr-0.5 align-middle" />= today</span>
                )}
              </p>
            </div>
            <div className="h-56">
              <Line
                data={balanceLineData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      ...tooltipOpts,
                      callbacks: {
                        label: (ctx) => ` Balance: ₹${fmt(ctx.parsed.y)}`,
                      },
                    },
                  },
                  scales: axesOpts,
                  elements: { line: { borderWidth: 2 } },
                }}
              />
            </div>
          </div>

          {/* Row 3: Yearly Stacked Bar ─────────────────────────────────────── */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
            <div className="mb-3">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Annual EMI Breakdown</p>
                <div className="flex items-center gap-3 text-xs shrink-0">
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.principal }} />
                    <span className="text-gray-500 dark:text-gray-400">Principal</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2.5 w-2.5 rounded-sm" style={{ background: C.interest }} />
                    <span className="text-gray-500 dark:text-gray-400">Interest</span>
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Early years are interest-heavy</p>
            </div>
            <div className="h-56">
              <Bar
                data={emiBreakdownData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  interaction: { mode: 'index', intersect: false },
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      ...tooltipOpts,
                      callbacks: {
                        label: (ctx) => ` ${ctx.dataset.label}: ₹${fmt(ctx.parsed.y)}`,
                      },
                    },
                  },
                  scales: {
                    x: { ...axesOpts.x, stacked: true },
                    y: { ...axesOpts.y, stacked: true },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ── Alerts ─────────────────────────────────────────────────────────── */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 font-semibold text-red-600 dark:text-red-400">
            <ExclamationTriangleIcon className="h-4 w-4" />
            Alerts ({alerts.length})
          </h3>
          {alerts.map((alert, i) => (
            <div key={i} className="flex gap-3 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <ExclamationCircleIcon className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300 leading-relaxed">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Upcoming Payments ──────────────────────────────────────────────── */}
      {upcomingPayments.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
            <CalendarDaysIcon className="h-4 w-4" />
            Upcoming & Overdue Payments
          </h3>
          {upcomingPayments.map((p, i) => (
            <div key={i} className={`flex items-center justify-between p-3.5 rounded-xl border ${
              p.overdue
                ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700'
            }`}>
              <div className="flex items-center gap-3">
                <ClockIcon className={`h-4 w-4 shrink-0 ${p.overdue ? 'text-red-500' : 'text-amber-500'}`} />
                <div>
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-semibold ${p.overdue ? 'text-red-700 dark:text-red-300' : 'text-amber-700 dark:text-amber-300'}`}>
                      {p.label}
                    </p>
                    {p.overdue && (
                      <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-red-200 dark:bg-red-800 text-red-700 dark:text-red-200">OVERDUE</span>
                    )}
                    <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      p.type === 'EMI'
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                        : 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                    }`}>
                      {p.type === 'EMI' ? 'EMI' : 'Builder'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Due: {p.dueDate}</p>
                </div>
              </div>
              <p className={`font-bold text-sm shrink-0 ${p.overdue ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}`}>
                ₹{fmt(p.amount)}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Suggestions ────────────────────────────────────────────────────── */}
      {suggestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400">
            <LightBulbIcon className="h-4 w-4" />
            Smart Suggestions
          </h3>
          {suggestions.map((s, i) => (
            <div key={i} className="flex gap-3 p-3.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl">
              <LightBulbIcon className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
              <p className="text-sm text-indigo-700 dark:text-indigo-300 leading-relaxed">{s}</p>
            </div>
          ))}
        </div>
      )}

      {alerts.length === 0 && upcomingPayments.length === 0 && suggestions.length === 0 && metricEntries.length === 0 && (
        <p className="text-sm text-gray-400 dark:text-gray-500 py-8 text-center">
          Add loan details and installments to generate insights.
        </p>
      )}
    </div>
  );
}
