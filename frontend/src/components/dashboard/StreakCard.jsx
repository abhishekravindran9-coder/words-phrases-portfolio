import React, { useState } from 'react';

const MILESTONES = [7, 30, 100, 365];

function getMilestone(streak) {
  return MILESTONES.find((m) => streak === m) || null;
}

/**
 * Streak flame card with milestone celebration banner.
 */
export default function StreakCard({ streak = 0 }) {
  const milestone = getMilestone(streak);
  const nextMilestone = MILESTONES.find((m) => m > streak) || null;

  // Flame intensity
  const flame = streak === 0 ? '🩶' : streak < 7 ? '🔥' : streak < 30 ? '🔥🔥' : '🔥🔥🔥';

  return (
    <div className={`rounded-2xl border shadow-sm p-5 flex flex-col gap-2
      ${milestone
        ? 'bg-gradient-to-br from-amber-400 to-orange-500 border-orange-400 text-white'
        : 'bg-white border-gray-100'}`}>

      {milestone && (
        <div className="text-xs font-bold uppercase tracking-widest opacity-80 mb-1">
          🏆 Milestone reached!
        </div>
      )}

      <div className="flex items-center gap-3">
        <span className="text-4xl leading-none">{flame}</span>
        <div>
          <p className={`text-3xl font-extrabold leading-none ${milestone ? 'text-white' : 'text-gray-900'}`}>
            {streak}
            <span className={`text-base font-semibold ml-1 ${milestone ? 'text-white/80' : 'text-gray-400'}`}>days</span>
          </p>
          <p className={`text-xs mt-0.5 font-medium ${milestone ? 'text-white/80' : 'text-gray-500'}`}>
            Current streak
          </p>
        </div>
      </div>

      {/* Progress to next milestone */}
      {nextMilestone && !milestone && (
        <div className="mt-2">
          <div className="flex justify-between text-xs text-gray-400 mb-1">
            <span>{streak} days</span>
            <span>Next: {nextMilestone}d 🏆</span>
          </div>
          <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-orange-400 transition-all duration-700"
              style={{ width: `${(streak / nextMilestone) * 100}%` }}
            />
          </div>
        </div>
      )}

      {milestone && (
        <p className="text-xs font-semibold text-white/90">
          You hit {milestone} days — amazing dedication! 🎊
        </p>
      )}

      {streak === 0 && (
        <p className="text-xs text-gray-400">Complete a review to start your streak!</p>
      )}
    </div>
  );
}
