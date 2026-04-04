import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { progressService } from '../services/progressService';
import StatsCard from '../components/dashboard/StatsCard';
import UpcomingReviews from '../components/dashboard/UpcomingReviews';
import DailyHighlight from '../components/dashboard/DailyHighlight';
import StreakCard from '../components/dashboard/StreakCard';
import DailyGoalRing from '../components/dashboard/DailyGoalRing';
import ActivityHeatmap from '../components/dashboard/ActivityHeatmap';
import WeakestWords from '../components/dashboard/WeakestWords';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  BookOpenIcon, CheckBadgeIcon, ClipboardDocumentCheckIcon,
  CalendarDaysIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';
import Button from '../components/common/Button';

export default function DashboardPage() {
  const { user }              = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,  setError]    = useState(null);

  useEffect(() => {
    progressService.getDashboard()
      .then(setData)
      .catch(() => setError('Failed to load dashboard. Please refresh.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
  );
  if (error) return (
    <div className="text-center py-20 text-red-500">{error}</div>
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const masteryPct = data?.totalWords
    ? Math.round((data.masteredWords / data.totalWords) * 100)
    : 0;

  // Compute "this week" reviews from reviewActivity map
  const weekReviews = useMemo(() => {
    if (!data?.reviewActivity) return 0;
    const today = new Date();
    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      total += Number(data.reviewActivity[key] || 0);
    }
    return total;
  }, [data]);

  // Last 7 days bar chart data
  const weekBars = useMemo(() => {
    if (!data?.reviewActivity) return [];
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key = d.toISOString().slice(0, 10);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      return { label, count: Number(data.reviewActivity[key] || 0) };
    });
  }, [data]);

  const weekBarMax = useMemo(() => Math.max(...weekBars.map((b) => b.count), 1), [weekBars]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {greeting()}, {user?.displayName || user?.username}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your learning overview for today.</p>
        </div>
        <Link to="/review">
          <Button size="md">
            {data?.dueToday > 0
              ? `Start Review (${data.dueToday} due)`
              : 'Start Review'}
          </Button>
        </Link>
      </div>

      {/* ── Overdue alert ── */}
      {(data?.overdueCount ?? 0) > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              You have {data.overdueCount} overdue {data.overdueCount === 1 ? 'word' : 'words'}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              These words were due for review in the past but haven't been reviewed yet.{' '}
              <Link to="/review" className="underline font-medium">Review now →</Link>
            </p>
          </div>
        </div>
      )}

      {/* ── Empty / onboarding state ── */}
      {(data?.totalWords ?? 0) === 0 ? (
        <div className="bg-gradient-to-br from-primary-50 to-indigo-50 border border-primary-100 rounded-2xl p-8 text-center">
          <p className="text-5xl mb-4">📚</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Welcome! Let's get started.</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            Add your first word or phrase to begin tracking your vocabulary and building a daily learning habit.
          </p>
          <Link to="/words">
            <Button size="md">Add Your First Word</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── Top stats row ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard label="Total Words"  value={data?.totalWords}    icon={BookOpenIcon}               color="primary" />
            <StatsCard label="Mastered"     value={`${data?.masteredWords} (${masteryPct}%)`} icon={CheckBadgeIcon} color="green" />
            <StatsCard label="Due Today"    value={data?.dueToday}      icon={ClipboardDocumentCheckIcon} color="yellow" />
            <StatsCard label="This Week"    value={weekReviews}          icon={CalendarDaysIcon}            color="primary" />
          </div>

          {/* ── Streak + Goal ring + Weekly trend row ── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StreakCard streak={data?.currentStreakDays ?? 0} />
            <DailyGoalRing reviewed={data?.reviewedToday ?? 0} goal={data?.dailyGoal ?? 10} />

            {/* Weekly trend mini-chart */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-sm font-semibold text-gray-700 mb-3">Last 7 Days</p>
              <div className="flex items-end gap-1 h-16">
                {weekBars.map(({ label, count }) => (
                  <div key={label} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t-sm bg-primary-400 transition-all duration-500"
                      style={{ height: weekBarMax > 0 ? `${(count / weekBarMax) * 100}%` : '4px',
                               minHeight: '4px',
                               opacity: count === 0 ? 0.2 : 1 }}
                      title={`${count} reviews`}
                    />
                    <span className="text-[9px] text-gray-400">{label}</span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                {weekReviews} reviews this week
              </p>
            </div>
          </div>

          {/* ── Activity heatmap ── */}
          <ActivityHeatmap activity={data?.reviewActivity || {}} />

          {/* ── Main content: upcoming + highlight + weakest ── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <UpcomingReviews words={data?.upcomingReviews || []} />
            </div>
            <div className="lg:col-span-1">
              <WeakestWords words={data?.weakestWords || []} overdueCount={data?.overdueCount ?? 0} />
            </div>
            <div className="lg:col-span-1">
              <DailyHighlight word={data?.dailyHighlight} />
            </div>
          </div>
        </>
      )}

    </div>
  );
}

