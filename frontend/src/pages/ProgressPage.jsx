import React, { useState, useEffect } from 'react';
import { progressService } from '../services/progressService';
import { quizService } from '../services/quizService';
import ReviewChart from '../components/progress/ReviewChart';
import MasteryChart from '../components/progress/MasteryChart';
import MasteryProgressBar from '../components/progress/MasteryProgressBar';
import RecallQualityGauge from '../components/progress/RecallQualityGauge';
import CategoryBreakdownChart from '../components/progress/CategoryBreakdownChart';
import QuizStatsSection from '../components/progress/QuizStatsSection';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Link } from 'react-router-dom';
import {
  FireIcon, StarIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
  TrophyIcon, BoltIcon, ChatBubbleLeftRightIcon, ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

function StatBadge({ label, value, icon: Icon, color, sub }) {
  const C = {
    green:   'text-green-600   bg-green-50',
    primary: 'text-primary-600 bg-primary-50',
    yellow:  'text-yellow-600  bg-yellow-50',
    red:     'text-red-600     bg-red-50',
    purple:  'text-purple-600  bg-purple-50',
    teal:    'text-teal-600    bg-teal-50',
  };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl flex-shrink-0 ${C[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 truncate">{value ?? '—'}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function RecordCard({ icon: Icon, label, value, color }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl p-4 ${color}`}>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <div>
        <p className="text-xs font-medium opacity-70">{label}</p>
        <p className="text-xl font-extrabold">{value ?? '—'}</p>
      </div>
    </div>
  );
}

/**
 * Progress page – visual charts and aggregated statistics.
 */
export default function ProgressPage() {
  const [data,       setData]       = useState(null);
  const [quizStats,  setQuizStats]  = useState(null);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      progressService.getProgress(),
      quizService.getStats().catch(() => null),
    ]).then(([progress, quiz]) => {
      setData(progress);
      setQuizStats(quiz);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
  );

  const totalWords   = data?.totalWords   ?? 0;
  const mastered     = data?.masteredWords ?? 0;
  const totalPhrases = data?.totalPhrases  ?? 0;
  const totalRegular = totalWords - totalPhrases;

  return (
    <div className="max-w-5xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Your Progress</h1>
        <p className="text-sm text-gray-400 mt-1">A deep look at your learning journey.</p>
      </div>

      {/* ── Needs attention banner ── */}
      {(data?.dueReviews ?? 0) > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
          <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{data.dueReviews} {data.dueReviews === 1 ? 'word is' : 'words are'} due for review.</span>{' '}
            <Link to="/review" className="underline font-medium">Start now →</Link>
          </p>
        </div>
      )}

      {/* ── Top stat badges ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBadge
          label="Total Entries"  value={totalWords}
          icon={BookOpenIcon}   color="primary"
          sub={`${totalRegular} words · ${totalPhrases} phrases`}
        />
        <StatBadge
          label="Mastered"       value={mastered}
          icon={StarIcon}        color="green"
          sub={totalWords > 0 ? `${Math.round((mastered / totalWords) * 100)}% of total` : undefined}
        />
        <StatBadge
          label="Total Reviews"  value={data?.totalReviews}
          icon={ClipboardDocumentCheckIcon} color="yellow"
        />
        <StatBadge
          label="Current Streak" value={`${data?.currentStreakDays ?? 0}d`}
          icon={FireIcon}        color="red"
          sub={data?.bestStreakDays ? `Best: ${data.bestStreakDays}d` : undefined}
        />
      </div>

      {/* ── Mastery progress bar ── */}
      <MasteryProgressBar mastered={mastered} total={totalWords} />

      {/* ── Review chart + Mastery doughnut ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReviewChart reviewsPerDay={data?.reviewsPerDay || {}} />
        </div>
        <MasteryChart
          masteredWords={mastered}
          wordsInProgress={data?.wordsInProgress || 0}
        />
      </div>

      {/* ── Recall quality gauge ── */}
      {(data?.averageQuality ?? 0) > 0 && (
        <RecallQualityGauge quality={data.averageQuality} />
      )}

      {/* ── Personal records ── */}
      {((data?.bestStreakDays ?? 0) > 0 || (data?.mostReviewsInDay ?? 0) > 0) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Personal Records</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <RecordCard
              icon={TrophyIcon}
              label="Best Streak"
              value={`${data?.bestStreakDays ?? 0}d`}
              color="bg-amber-50 text-amber-700"
            />
            <RecordCard
              icon={BoltIcon}
              label="Best Day"
              value={`${data?.mostReviewsInDay ?? 0} reviews`}
              color="bg-primary-50 text-primary-700"
            />
            <RecordCard
              icon={BookOpenIcon}
              label="Words Added"
              value={totalRegular}
              color="bg-blue-50 text-blue-700"
            />
            <RecordCard
              icon={ChatBubbleLeftRightIcon}
              label="Phrases Added"
              value={totalPhrases}
              color="bg-purple-50 text-purple-700"
            />
          </div>
        </div>
      )}

      {/* ── Category breakdown ── */}
      {(data?.topCategories?.length ?? 0) > 0 && (
        <CategoryBreakdownChart categories={data.topCategories} />
      )}

      {/* ── Quiz performance ── */}
      <div className="pt-2">
        <QuizStatsSection stats={quizStats} />
      </div>

    </div>
  );
}
