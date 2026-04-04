import React from 'react';

/**
 * Circular SVG progress ring showing today's reviews vs daily goal.
 */
export default function DailyGoalRing({ reviewed = 0, goal = 10 }) {
  const pct    = Math.min(reviewed / Math.max(goal, 1), 1);
  const r      = 44;
  const circ   = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const done   = reviewed >= goal;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-3">
      <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Daily Goal</p>

      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
          {/* Track */}
          <circle cx="50" cy="50" r={r} fill="none" stroke="#e5e7eb" strokeWidth="10" />
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
          <span className={`text-xl font-extrabold ${done ? 'text-green-500' : 'text-primary-700'}`}>
            {reviewed}
          </span>
          <span className="text-[10px] text-gray-400 font-medium">/ {goal}</span>
        </div>
      </div>

      <p className={`text-xs font-semibold ${done ? 'text-green-500' : 'text-gray-400'}`}>
        {done ? '🎉 Goal reached!' : `${goal - reviewed} more to go`}
      </p>
    </div>
  );
}
