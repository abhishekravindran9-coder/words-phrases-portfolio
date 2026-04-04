import React, { useState, useEffect } from 'react';
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

      {/* ── Top stats row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatsCard label="Total Words"  value={data?.totalWords}    icon={BookOpenIcon}               color="primary" />
        <StatsCard label="Mastered"     value={`${data?.masteredWords} (${masteryPct}%)`} icon={CheckBadgeIcon} color="green" />
        <StatsCard label="Due Today"    value={data?.dueToday}      icon={ClipboardDocumentCheckIcon} color="yellow" />
      </div>

      {/* ── Streak + Goal ring row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StreakCard streak={data?.currentStreakDays ?? 0} />
        <DailyGoalRing reviewed={data?.reviewedToday ?? 0} goal={data?.dailyGoal ?? 10} />
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

    </div>
  );
}

