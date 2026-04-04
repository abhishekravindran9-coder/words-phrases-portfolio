import React, { useState, useEffect } from 'react';
import { progressService } from '../services/progressService';
import ReviewChart from '../components/progress/ReviewChart';
import MasteryChart from '../components/progress/MasteryChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { FireIcon, StarIcon, BookOpenIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';

function StatBadge({ label, value, icon: Icon, color }) {
  const C = { green: 'text-green-600 bg-green-50', primary: 'text-primary-600 bg-primary-50', yellow: 'text-yellow-600 bg-yellow-50', red: 'text-red-600 bg-red-50' };
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${C[color]}`}><Icon className="h-6 w-6" /></div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value ?? '—'}</p>
      </div>
    </div>
  );
}

/**
 * Progress page – visual charts and aggregated statistics.
 */
export default function ProgressPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    progressService.getProgress()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Your Progress</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBadge label="Total Words"    value={data?.totalWords}    icon={BookOpenIcon}              color="primary" />
        <StatBadge label="Mastered"       value={data?.masteredWords} icon={StarIcon}                  color="green"   />
        <StatBadge label="Total Reviews"  value={data?.totalReviews}  icon={ClipboardDocumentCheckIcon} color="yellow"  />
        <StatBadge label="Day Streak"     value={`${data?.currentStreakDays ?? 0}d 🔥`} icon={FireIcon} color="red"   />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ReviewChart reviewsPerDay={data?.reviewsPerDay || {}} />
        </div>
        <MasteryChart
          masteredWords={data?.masteredWords || 0}
          wordsInProgress={data?.wordsInProgress || 0}
        />
      </div>

      {/* Category breakdown */}
      {data?.topCategories?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Top Categories</h3>
          <div className="divide-y divide-gray-50">
            {data.topCategories.map((cat) => {
              const pct = cat.wordCount > 0 ? Math.round((cat.masteredCount / cat.wordCount) * 100) : 0;
              return (
                <div key={cat.categoryId} className="py-3 flex items-center gap-4">
                  <span
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.categoryColor || '#4f46e5' }}
                  />
                  <span className="text-sm font-medium text-gray-800 flex-1">{cat.categoryName}</span>
                  <span className="text-xs text-gray-500">{cat.wordCount} words</span>
                  <div className="w-24 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-1.5 rounded-full bg-green-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Average quality */}
      {data?.averageQuality != null && data.averageQuality > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
          <div>
            <p className="text-xs text-gray-500">Avg. Recall Quality (last 30 days)</p>
            <p className="text-3xl font-bold text-primary-600">
              {data.averageQuality.toFixed(1)} <span className="text-lg text-gray-400">/ 5</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
