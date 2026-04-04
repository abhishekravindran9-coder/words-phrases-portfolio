import React from 'react';

const MILESTONES = [25, 50, 75, 100];

/**
 * Full-width gradient mastery progress bar with milestone markers.
 */
export default function MasteryProgressBar({ mastered = 0, total = 0 }) {
  const pct = total > 0 ? Math.min(100, Math.round((mastered / total) * 100)) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-end justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-800">Mastery Journey</h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {mastered} of {total} {total === 1 ? 'word' : 'words'} mastered
          </p>
        </div>
        <span
          className={`text-3xl font-extrabold tabular-nums ${
            pct >= 75 ? 'text-green-600' :
            pct >= 40 ? 'text-primary-600' :
            'text-amber-500'
          }`}
        >
          {pct}%
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-5 bg-gray-100 rounded-full overflow-visible">
        {/* Gradient fill */}
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${pct}%`,
            background: pct >= 75
              ? 'linear-gradient(90deg,#6366f1,#10b981)'
              : pct >= 40
              ? 'linear-gradient(90deg,#6366f1,#818cf8)'
              : 'linear-gradient(90deg,#f59e0b,#6366f1)',
          }}
        />

        {/* Milestone markers */}
        {MILESTONES.map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 flex flex-col items-center"
            style={{ left: `${m}%`, transform: 'translateX(-50%)' }}
          >
            <div
              className={`w-0.5 h-full ${pct >= m ? 'bg-white/60' : 'bg-gray-300'}`}
            />
            <span
              className={`absolute -bottom-5 text-[10px] font-semibold ${
                pct >= m ? 'text-primary-600' : 'text-gray-400'
              }`}
            >
              {m}%
            </span>
          </div>
        ))}
      </div>

      {/* Milestone labels row */}
      <div className="mt-7 flex justify-between text-[10px] text-gray-400">
        <span>Beginner</span>
        <span>Learning</span>
        <span>Proficient</span>
        <span>Expert</span>
        <span>Master</span>
      </div>
    </div>
  );
}
