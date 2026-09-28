import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BarElement, CategoryScale, Chart as ChartJS, LinearScale, Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import {
  ArrowRightIcon, BookOpenIcon, CalendarDaysIcon, CheckCircleIcon,
  ClockIcon, FireIcon, InformationCircleIcon, SparklesIcon,
} from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PageHeader from '../components/common/PageHeader';
import { progressService } from '../services/progressService';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const ranges = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
  { value: '365d', label: '1 year' },
  { value: 'all', label: 'All time' },
];

const stageColors = {
  NEW: 'bg-slate-300',
  LEARNING: 'bg-sky-500',
  YOUNG: 'bg-teal-500',
  MATURE: 'bg-emerald-600',
  MASTERED: 'bg-amber-400',
};

function MetricInfo({ children }) {
  return (
    <details className="group relative inline-flex align-middle">
      <summary className="flex h-5 w-5 cursor-pointer list-none items-center justify-center rounded-full text-gray-400 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 dark:text-gray-500 dark:hover:text-gray-200" aria-label="About this metric">
        <InformationCircleIcon className="h-4 w-4" />
      </summary>
      <span className="absolute right-0 top-7 z-20 w-64 rounded-lg border border-gray-200 bg-white p-3 text-xs font-normal leading-relaxed text-gray-600 shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
        {children}
      </span>
    </details>
  );
}

function Metric({ label, value, note, icon: Icon, tone = 'teal', info }) {
  const tones = {
    teal: 'bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    coral: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
    amber: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    sky: 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  };
  return (
    <article className="border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
        <span>{label}</span>
        {info && <MetricInfo>{info}</MetricInfo>}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="text-3xl font-bold tabular-nums text-gray-900 dark:text-white">{value}</p>
      </div>
      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{note}</p>
    </article>
  );
}

function SectionHeading({ title, detail, action }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
        {detail && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{detail}</p>}
      </div>
      {action}
    </div>
  );
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function formatAccuracy(groups = []) {
  if (!groups.length) return 'No prompt-format data yet';
  return groups.map((group) => `${group.label}: ${group.accuracy == null ? '—' : `${group.accuracy}%`}`).join(' · ');
}

export default function ProgressInsightsPage() {
  const [range, setRange] = useState('30d');
  const [data, setData] = useState(null);
  const [narrative, setNarrative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    setLoading(true);
    setError('');
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    Promise.all([
      progressService.getInsights(range, timezone),
      progressService.getNarrative(timezone).catch(() => null),
    ])
      .then(([result, weeklyNarrative]) => {
        if (current) setData(result);
        if (current) setNarrative(weeklyNarrative);
      })
      .catch(() => { if (current) setError('Progress insights could not be loaded. Try again in a moment.'); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
  }, [range]);

  if (loading && !data) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error && !data) return <div role="alert" className="mx-auto max-w-xl rounded-xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>;

  const stages = data?.stages || [];
  const stageTotal = stages.reduce((total, stage) => total + Number(stage.count || 0), 0);
  const activity = data?.activity || [];
  const chartData = {
    labels: activity.map((point) => formatDate(point.date)),
    datasets: [{
      data: activity.map((point) => point.count),
      backgroundColor: activity.map((point) => point.count > 0 ? '#0f766e' : '#e5e7eb'),
      hoverBackgroundColor: '#0d9488',
      borderRadius: 3,
      maxBarThickness: 24,
    }],
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false }, tooltip: { displayColors: false } },
    scales: {
      x: { grid: { display: false }, ticks: { maxTicksLimit: 10, color: '#6b7280' }, border: { display: false } },
      y: { beginAtZero: true, ticks: { precision: 0, color: '#6b7280' }, grid: { color: 'rgba(148,163,184,.18)' }, border: { display: false } },
    },
  };
  const retention = data?.retention;

  return (
    <main className="mx-auto max-w-7xl space-y-8 pb-10">
      <PageHeader space="Learn" title="Progress" description="A clear view of what is sticking and what deserves another pass." action={<div className="flex flex-wrap gap-1 rounded-lg border border-[var(--mv-line)] bg-[var(--mv-paper)] p-1" role="group" aria-label="Progress date range">
          {ranges.map((option) => (
            <button key={option.value} type="button" onClick={() => setRange(option.value)} aria-pressed={range === option.value}
              className={`rounded-md px-3 py-2 text-xs font-semibold transition-colors ${range === option.value ? 'bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900' : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700'}`}>
              {option.label}
            </button>
          ))}
        </div>} />

      {error && <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-200">Showing the last loaded range. {error}</div>}

      {narrative?.text && (
        <section className="border-l-4 border-teal-600 bg-teal-50 px-5 py-4 dark:bg-teal-900/20" aria-label="Weekly learning note">
          <p className="text-xs font-bold uppercase tracking-wide text-teal-800 dark:text-teal-300">This week in your learning</p>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-teal-950 dark:text-teal-100">{narrative.text}</p>
        </section>
      )}

      <section className="grid gap-7 sm:grid-cols-2 xl:grid-cols-4" aria-label="Key progress metrics">
        <Metric label="Cards in your library" value={data?.totalCards ?? 0} note={`${data?.matureCards ?? 0} mature cards`} icon={BookOpenIcon} tone="sky"
          info="All vocabulary cards in your library. Mature means the scheduler interval has reached at least 21 days." />
        <Metric label="Due now" value={data?.dueNow ?? 0} note={data?.overdueBacklog ? `${data.overdueBacklog} overdue by more than one day` : 'No overdue backlog'} icon={CalendarDaysIcon} tone="coral"
          info="Non-mastered cards with no scheduled date or a date on or before today in your selected timezone." />
        <Metric label="Review streak" value={`${data?.currentStreak ?? 0} days`} note={`Personal best: ${data?.personalBestStreak ?? 0} days`} icon={FireIcon} tone="amber"
          info="Consecutive local review dates. Older reviews keep the date recorded at the time; they are not reassigned to your current timezone." />
        <Metric label="Reviews in range" value={data?.totalReviewEvents ?? 0} note={`${data?.totalQuizAnswers ?? 0} separate legacy quiz answers`} icon={CheckCircleIcon} tone="teal"
          info="SRS reviews and historical quiz answers are reported separately because they represent different kinds of practice events." />
      </section>

      <section className="grid gap-8 border-y border-gray-200 py-7 dark:border-gray-700 lg:grid-cols-[minmax(0,1.6fr)_minmax(260px,1fr)]">
        <div className="min-w-0">
          <SectionHeading title="Review rhythm" detail={`${data?.fromDate ? formatDate(data.fromDate) : ''} – ${data?.toDate ? formatDate(data.toDate) : ''} · local calendar days`} />
          {activity.length ? <div className="h-64"><Bar data={chartData} options={chartOptions} aria-label="Daily SRS reviews" /></div> : <p className="py-16 text-center text-sm text-gray-500">No reviews recorded in this range.</p>}
        </div>
        <div className="border-t border-gray-200 pt-6 dark:border-gray-700 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
          <SectionHeading title="Recall after spacing" detail="Only reviews of mature cards are included." />
          <p className="text-5xl font-bold tabular-nums text-gray-950 dark:text-white">{retention?.rate == null ? '—' : `${retention.rate}%`}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Target band: {retention?.target ?? 85}% recall</p>
          {retention?.rate == null ? (
            <div className="mt-5 border-l-2 border-amber-400 pl-3 text-sm text-gray-600 dark:text-gray-300">
              {retention?.sampleSize ?? 0} of 20 mature reviews so far. {retention?.reviewsUntilUnlock ?? 20} more needed to show a rate.
            </div>
          ) : <p className="mt-5 text-xs text-gray-500">Based on {retention.sampleSize} mature review events. This describes observed recall, not a prediction.</p>}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading title="Learning stages" detail="Cards are grouped by current scheduler interval and history." action={<Link to="/words" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-400">Browse cards <ArrowRightIcon className="h-4 w-4" /></Link>} />
          <div className="flex h-3 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="img" aria-label={`Learning stage distribution across ${stageTotal} cards`}>
            {stages.map((stage) => stageTotal > 0 && <span key={stage.stage} className={`${stageColors[stage.stage] || 'bg-gray-400'} h-full`} style={{ width: `${(stage.count / stageTotal) * 100}%` }} />)}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-x-5 gap-y-3 sm:grid-cols-3">
            {stages.map((stage) => (
              <li key={stage.stage} className="flex items-center gap-2 text-sm">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${stageColors[stage.stage] || 'bg-gray-400'}`} />
                <span className="text-gray-600 dark:text-gray-300">{stage.stage?.toLowerCase()}</span>
                <span className="ml-auto font-semibold tabular-nums text-gray-900 dark:text-white">{stage.count}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <SectionHeading title="Upcoming reviews" detail="Scheduled load for the next seven days." />
          <div className="space-y-3">
            {(data?.backlogForecast || []).map((point) => (
              <div key={point.date} className="flex items-center gap-3 text-sm">
                <span className="w-16 text-gray-500 dark:text-gray-400">{formatDate(point.date)}</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700"><div className="h-full rounded-full bg-teal-600" style={{ width: `${Math.min(100, point.count * 5)}%` }} /></div>
                <span className="w-8 text-right font-semibold tabular-nums text-gray-800 dark:text-gray-100">{point.count}</span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-gray-500 dark:text-gray-400">Suggested backlog pace: {data?.suggestedDailyPace ?? 0} cards per day{data?.backlogBurnDownDays ? ` · about ${data.backlogBurnDownDays} days to clear` : ''}</p>
        </div>
      </section>

      <section className="border-y border-gray-200 py-7 dark:border-gray-700">
        <SectionHeading title="Cards asking for attention" detail="Repeated misses in the selected range. These are candidates to rephrase or revisit." action={<Link to="/practice?mode=leeches" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-400">Practice these <ArrowRightIcon className="h-4 w-4" /></Link>} />
        {data?.leeches?.length ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {data.leeches.slice(0, 5).map((word) => (
              <Link key={word.wordId} to={`/words?wordId=${word.wordId}`} className="flex flex-wrap items-center justify-between gap-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-800/60">
                <span className="min-w-0"><span className="block truncate font-semibold text-gray-900 dark:text-white">{word.word}</span><span className="text-xs text-gray-500">{word.categoryName || word.entryType?.toLowerCase() || 'Card'} · {word.lapseCount} misses</span></span>
                <span className="shrink-0 text-sm text-gray-600 dark:text-gray-300">{word.recallRate == null ? '—' : `${word.recallRate}%`} observed recall</span>
              </Link>
            ))}
          </div>
        ) : <p className="py-7 text-sm text-gray-500">No repeated-miss cards in this range.</p>}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <SectionHeading title="Prompt formats" detail="New reviews only; older quiz events are not mixed into this rate." />
          <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{formatAccuracy(data?.byFormat)}</p>
        </div>
        <div>
          <SectionHeading title="Word and phrase recall" detail="Success means an SRS grade of 3 or higher." />
          <p className="text-sm leading-7 text-gray-700 dark:text-gray-300">{formatAccuracy(data?.byEntryType)}</p>
        </div>
      </section>

      {data?.weeklyGraduations?.length > 0 && (
        <section className="border-t border-gray-200 pt-7 dark:border-gray-700">
          <SectionHeading title="Matured cards" detail="Cards crossing the 21-day interval threshold each week." />
          <div className="flex flex-wrap gap-3">
            {data.weeklyGraduations.slice(-8).map((week) => (
              <div key={week.weekStart} className="min-w-[100px] border-l-2 border-emerald-500 pl-3">
                <p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-white">{week.graduated}</p>
                <p className="text-xs text-gray-500">week of {formatDate(week.weekStart)}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-gray-100 px-5 py-4 dark:bg-gray-800">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-teal-700 dark:bg-gray-700 dark:text-teal-300"><SparklesIcon className="h-5 w-5" /></span>
          <p className="text-sm text-gray-700 dark:text-gray-200">Daily target: {data?.dailyGoal ?? 10} reviews · {data?.reviewsUntilGoal ?? 0} to go today</p>
        </div>
        <Link to="/practice" className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800">Start practice <ArrowRightIcon className="h-4 w-4" /></Link>
      </footer>
    </main>
  );
}
