import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { progressService } from '../services/progressService';
import DailyGoalRing from '../components/dashboard/DailyGoalRing';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import WeakestWords from '../components/dashboard/WeakestWords';
import DailyHighlight from '../components/dashboard/DailyHighlight';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import {
  ArrowDownRightIcon, ArrowRightIcon, ArrowUpRightIcon, BookOpenIcon,
  CheckCircleIcon, ChevronRightIcon, ClockIcon,
  ExclamationTriangleIcon, FireIcon, MinusIcon, PencilSquareIcon, SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const localDateKey = (date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, '0'),
  String(date.getDate()).padStart(2, '0'),
].join('-');

const formatReviewDate = (value) => {
  if (!value) return 'Date not set';
  const date = new Date(`${value}T00:00:00`);
  return date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
};

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function getReviewTrend(current = 0, previous = 0) {
  if (previous === 0) return current > 0 ? { label: 'A fresh start this week', direction: 'up' } : { label: 'No reviews last week', direction: 'flat' };
  const change = Math.round(((current - previous) / previous) * 100);
  if (change > 0) return { label: `${change}% more than last week`, direction: 'up' };
  if (change < 0) return { label: `${Math.abs(change)}% fewer than last week`, direction: 'down' };
  return { label: 'Steady with last week', direction: 'flat' };
}

function InsightCard({ eyebrow, value, detail, icon: Icon, tone = 'indigo' }) {
  const toneClasses = {
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };
  return (
    <article className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">{eyebrow}</p>
          <p className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">{value}</p>
        </div>
        <span className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${toneClasses[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{detail}</p>
    </article>
  );
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    progressService.getDashboard()
      .then(setData)
      .catch(() => setError('Could not load your learning overview. Please refresh to try again.'))
      .finally(() => setLoading(false));
  }, []);

  const weekBars = useMemo(() => {
    if (!data?.reviewActivity) return [];
    const today = new Date();
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      const key = localDateKey(date);
      return {
        key,
        label: date.toLocaleDateString(undefined, { weekday: 'short' }),
        count: Number(data.reviewActivity[key] || 0),
        isToday: index === 6,
      };
    });
  }, [data]);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (error) return <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 p-5 text-center text-sm font-medium text-rose-700 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300">{error}</div>;

  const greeting = getGreeting();
  const mastered = data?.masteredWords ?? 0;
  const dueToday = data?.dueToday ?? 0;
  const overdue = data?.overdueCount ?? 0;
  const atRiskWords = data?.atRiskWords ?? [];
  const atRiskCount = data?.atRiskCount ?? atRiskWords.length;
  const reviewsThisWeek = data?.reviewsThisWeek ?? 0;
  const reviewsPreviousWeek = data?.reviewsPreviousWeek ?? 0;
  const trend = getReviewTrend(reviewsThisWeek, reviewsPreviousWeek);
  const goal = data?.dailyGoal ?? 10;
  const reviewedToday = data?.reviewedToday ?? 0;
  const recentReviewCount = data?.recentReviewCount ?? 0;
  const recentRecallRate = data?.recentRecallRate ?? 0;
  const nextMilestone = data?.nextMasteryMilestone ?? 10;
  const wordsToMilestone = data?.wordsToNextMasteryMilestone ?? Math.max(0, nextMilestone - mastered);
  const riskColor = (word) => (word.easeFactor ?? 2.5) <= 1.6 ? 'border-l-rose-500' : 'border-l-amber-400';
  const clearToday = dueToday === 0 && overdue === 0 && atRiskCount === 0;
  const totalWords = data?.totalWords ?? 0;
  const recallRate = data?.recentRecallRate ?? 0;
  const recallSignal = (data?.recentReviewCount ?? 0) === 0
    ? 'No recent review sample'
    : recallRate >= 80
      ? 'Strong recent recall'
      : recallRate >= 60
        ? 'Recall is holding steady'
        : 'Some cards need another pass';

  return (
    <main className="mx-auto max-w-6xl space-y-6 pb-8 sm:space-y-7">
      <header className="flex flex-col gap-4 px-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Your learning studio</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
            {greeting}, {user?.displayName || user?.username}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">A clear view of what to practise and how your recall is moving.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {dueToday > 0 && <Link to="/practice"><Button className="min-h-11"><CheckCircleIcon className="h-4 w-4" />Practice {dueToday} due</Button></Link>}
          <Link to="/practice"><Button variant="secondary" className="min-h-11"><SparklesIcon className="h-4 w-4" />Practice</Button></Link>
        </div>
      </header>

      {totalWords === 0 ? (
        <section className="rounded-3xl border border-primary-100 bg-gradient-to-br from-primary-50 via-white to-indigo-50 p-7 text-center dark:border-primary-900 dark:from-gray-800 dark:via-gray-800 dark:to-indigo-950/40 sm:p-10">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary-600 shadow-sm dark:bg-gray-700 dark:text-primary-300"><BookOpenIcon className="h-7 w-7" /></span>
          <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-white">Start with one new word</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-gray-600 dark:text-gray-300">Save a word or phrase you want to remember. We’ll help you practise it at the right time.</p>
          <Link to="/words" className="mt-5 inline-flex"><Button>Add your first entry <ArrowRightIcon className="h-4 w-4" /></Button></Link>
        </section>
      ) : (
        <>
          <section aria-labelledby="today-focus-heading" className={`overflow-hidden rounded-3xl border shadow-sm ${clearToday ? 'border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:border-emerald-900 dark:from-gray-800 dark:via-gray-800 dark:to-emerald-950/30' : overdue > 0 ? 'border-rose-200 bg-gradient-to-br from-rose-50 via-white to-amber-50 dark:border-rose-900 dark:from-gray-800 dark:via-gray-800 dark:to-rose-950/30' : 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 dark:border-amber-900 dark:from-gray-800 dark:via-gray-800 dark:to-amber-950/30'}`}>
            <div className="grid gap-6 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(250px,0.55fr)] lg:items-center">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${clearToday ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200' : overdue > 0 ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-200' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200'}`}>
                    {clearToday ? <CheckCircleIcon className="h-4 w-4" /> : <ClockIcon className="h-4 w-4" />}
                    {clearToday ? 'Clear for today' : 'Today’s focus'}
                  </span>
                  {overdue > 0 && <span className="text-xs font-semibold text-rose-700 dark:text-rose-300">{overdue} overdue</span>}
                </div>
                <h2 id="today-focus-heading" className="mt-3 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
                  {clearToday
                    ? 'You’re right on track.'
                    : overdue > 0
                      ? 'Bring your overdue words back.'
                      : dueToday > 0
                        ? `${dueToday} ${dueToday === 1 ? 'word' : 'words'} ready to review.`
                        : 'A few words are coming due soon.'}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                  {clearToday
                    ? `No reviews are due or approaching. You’ve completed ${reviewedToday} of ${goal} reviews toward today’s goal.`
                    : dueToday > 0
                      ? `${dueToday} due now${overdue > 0 ? `, including ${overdue} overdue` : ''}. A focused review session is the highest-value next step.`
                      : `${atRiskCount} ${atRiskCount === 1 ? 'card is' : 'cards are'} scheduled in the next three days. A quick preview can keep recall fresh.`}
                </p>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  {dueToday > 0 && <Link to="/practice"><Button className="min-h-11">Start practice <ArrowRightIcon className="h-4 w-4" /></Button></Link>}
                  {dueToday === 0 && atRiskCount > 0 && <Link to="/words"><Button className="min-h-11">Browse at-risk words <ArrowRightIcon className="h-4 w-4" /></Button></Link>}
                  <Link to="/words" className="inline-flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-gray-600 transition-colors hover:bg-white/70 hover:text-primary-700 dark:text-gray-300 dark:hover:bg-gray-700/70 dark:hover:text-primary-300">
                    Browse vocabulary <ChevronRightIcon className="h-4 w-4" />
                  </Link>
                </div>
              </div>
              <div className="flex items-center gap-4 rounded-2xl border border-white/80 bg-white/75 p-4 dark:border-gray-700 dark:bg-gray-800/75">
                <DailyGoalRing reviewed={reviewedToday} goal={goal} compact />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Daily goal</p>
                  <p className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">{Math.min(reviewedToday, goal)}<span className="text-sm font-semibold text-gray-400"> / {goal}</span></p>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{reviewedToday >= goal ? 'Done for today — lovely work.' : `${Math.max(0, goal - reviewedToday)} reviews to reach your goal`}</p>
                </div>
              </div>
            </div>
            {atRiskCount > 0 && atRiskWords.length > 0 && (
              <div className="border-t border-white/80 bg-white/45 px-5 py-4 dark:border-gray-700 dark:bg-gray-900/20 sm:px-7">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">At risk · due in the next 3 days</h3>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Prioritized by recall difficulty</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {atRiskWords.slice(0, 3).map((word) => (
                    <Link key={word.id} to="/words" className={`flex min-h-14 items-center justify-between gap-3 rounded-xl border border-gray-200 border-l-4 bg-white px-3 py-2.5 transition-colors hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 ${riskColor(word)}`}>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-bold text-gray-900 dark:text-gray-100">{word.word}</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Ease {Number(word.easeFactor ?? 2.5).toFixed(1)} · {word.repetitions ?? 0} successful reps</span>
                      </span>
                      <span className="flex-shrink-0 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">{formatReviewDate(word.nextReviewDate)}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </section>

          <section aria-label="Learning insights" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <InsightCard
              eyebrow="Review momentum · 7 days"
              value={reviewsThisWeek}
              detail={`${trend.label}. ${reviewsPreviousWeek} reviews in the previous seven days.`}
              icon={trend.direction === 'down' ? ArrowDownRightIcon : trend.direction === 'up' ? ArrowUpRightIcon : MinusIcon}
              tone={trend.direction === 'down' ? 'violet' : 'indigo'}
            />
            <InsightCard
              eyebrow="Recent recall · 30 days"
              value={recentReviewCount > 0 ? `${recallRate}%` : '—'}
              detail={`${recallSignal} · ${recentReviewCount} ${recentReviewCount === 1 ? 'review' : 'reviews'} measured.`}
              icon={CheckCircleIcon}
              tone="emerald"
            />
            <InsightCard
              eyebrow="Vocabulary used in journal · 7 days"
              value={data?.journalWordsPracticedThisWeek ?? 0}
              detail={`${data?.journalEntriesThisWeek ?? 0} journal ${data?.journalEntriesThisWeek === 1 ? 'entry' : 'entries'} this week. Writing with a word is another useful recall cue.`}
              icon={PencilSquareIcon}
              tone="violet"
            />
            <InsightCard
              eyebrow="Next mastery milestone"
              value={wordsToMilestone}
              detail={`${mastered} mastered so far · ${nextMilestone} unlocks the next milestone.`}
              icon={TrophyIcon}
              tone="indigo"
            />
          </section>

          <section className="grid gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(270px,0.7fr)]">
            <ActivityHeatmap activity={data?.reviewActivity || {}} />
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Consistency</p>
                  <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Your review rhythm</h2>
                </div>
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-xl dark:bg-orange-900/30" aria-hidden="true">🔥</span>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">{data?.currentStreakDays ?? 0}</span>
                <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">day current streak</span>
              </div>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Personal best: {data?.bestStreakDays ?? data?.currentStreakDays ?? 0} days</p>
              {(data?.currentStreakDays ?? 0) > 0 && data?.currentStreakDays === data?.bestStreakDays && (
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  <TrophyIcon className="h-3.5 w-3.5" /> You’re matching your personal best
                </p>
              )}
              <div className="mt-5 border-t border-gray-100 pt-4 dark:border-gray-700">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Reviews over the last week</p>
                  <span className="text-[11px] text-gray-400">{reviewsThisWeek} total</span>
                </div>
                <div className="flex h-16 items-end gap-2" role="img" aria-label={`Reviews over the last seven days: ${weekBars.map((bar) => `${bar.label} ${bar.count}`).join(', ')}`}>
                  {weekBars.map(({ key, label, count, isToday }) => {
                    const max = Math.max(...weekBars.map((bar) => bar.count), 1);
                    return (
                      <div key={key} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1">
                        <span className="text-[10px] font-semibold tabular-nums text-gray-500 dark:text-gray-400">{count || ''}</span>
                        <div className={`w-full max-w-8 rounded-t-md transition-all ${isToday ? 'bg-primary-600' : 'bg-primary-300 dark:bg-primary-700'}`} style={{ height: `${count > 0 ? Math.max(10, (count / max) * 38) : 3}px`, opacity: count > 0 ? 1 : 0.35 }} title={`${label}: ${count} reviews`} />
                        <span className={`text-[9px] ${isToday ? 'font-bold text-primary-700 dark:text-primary-300' : 'text-gray-400'}`}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </section>

          {(data?.weakestCategories?.length ?? 0) > 0 && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-6">
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Pattern to notice · last 30 days</p>
                  <h2 className="mt-1 text-lg font-bold text-gray-900 dark:text-white">Where recall needs a little help</h2>
                </div>
                <Link to="/progress" className="inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-primary-700 hover:bg-primary-50 dark:text-primary-300 dark:hover:bg-primary-900/30">More progress <ArrowRightIcon className="h-4 w-4" /></Link>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.weakestCategories.map((category) => (
                  <div key={category.categoryName} className="rounded-xl border border-gray-100 bg-gray-50/70 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-2 text-sm font-bold text-gray-800 dark:text-gray-100">
                        <span className="h-2.5 w-2.5 flex-shrink-0 rounded-full" style={{ backgroundColor: category.categoryColor || '#6366f1' }} />
                        <span className="truncate">{category.categoryName}</span>
                      </span>
                      <span className="text-lg font-extrabold tabular-nums text-amber-700 dark:text-amber-300">{category.recallRate}%</span>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700" role="progressbar" aria-label={`${category.categoryName} recall rate`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={category.recallRate}>
                      <div className="h-full rounded-full bg-amber-400" style={{ width: `${category.recallRate}%` }} />
                    </div>
                    <p className="mt-2 text-[11px] text-gray-500 dark:text-gray-400">{category.reviewCount} reviews · successful recalls</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="grid gap-4 lg:grid-cols-2">
            <WeakestWords words={data?.weakestWords || []} overdueCount={overdue} />
            <DailyHighlight word={data?.dailyHighlight} />
          </section>
        </>
      )}
    </main>
  );
}
