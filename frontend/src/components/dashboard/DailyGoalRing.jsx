import React from 'react';

/**
 * Circular SVG progress ring showing today's reviews vs daily goal.
 */
export default function DailyGoalRing({ reviewed = 0, goal = 10, compact = false }) {
  const pct    = Math.min(reviewed / Math.max(goal, 1), 1);
  const r      = 44;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const done   = reviewed >= goal;

  return (
    <div className={compact ? 'flex items-center gap-4' : 'flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800'}>
      {!compact && <p className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Daily Goal</p>}

      <div className={`relative flex-shrink-0 ${compact ? 'h-20 w-20' : 'h-28 w-28'}`}>
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth="10" />
          {/* Progress */}
          <circle
            cx="50" cy="50" r={r}
            fill="none"
            stroke={done ? '#22c55e' : '#4f46e5'}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${compact ? 'text-lg' : 'text-xl'} font-extrabold ${done ? 'text-green-500' : 'text-primary-700 dark:text-primary-300'}`}>
            {reviewed}
          </span>
          <span className="text-[10px] font-medium text-gray-500 dark:text-gray-400">/ {goal}</span>
        </div>
      </div>

      {!compact && <p className={`text-xs font-semibold ${done ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
        {done ? '🎉 Goal reached!' : `${goal - reviewed} more to go`}
      </p>}
    </div>
  );
}
