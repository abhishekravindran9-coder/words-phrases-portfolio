import React from 'react';
import { FireIcon } from '@heroicons/react/24/solid';

/**
 * Review session progress bar with:
 * - "X / Y" counter + streak fire badge
 * - Main gradient progress bar
 * - Mini dot-map (one dot per card, color-coded by grade) for sessions ≤ 30 cards
 */
export default function ReviewProgress({ current, total, streak = 0, sessionLog = [] }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      {/* Counter row */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300">
            {current}
            <span className="text-gray-400 dark:text-gray-500 font-normal"> / {total}</span>
          </span>
          {streak >= 2 && (
            <span className="flex items-center gap-0.5 text-orange-500 font-bold text-xs animate-pulse">
              <FireIcon className="h-3.5 w-3.5" />
              {streak}
            </span>
          )}
        </div>
        <span className="font-bold text-primary-600 dark:text-primary-400 text-sm">{pct}%</span>
      </div>

      {/* Main gradient bar */}
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Dot map — visible for sessions ≤ 30 cards */}
      {total <= 30 && (
        <div className="flex gap-0.5">
          {Array.from({ length: total }, (_, i) => {
            const log = sessionLog[i];
            const state =
              i < current
                ? log?.quality >= 3 ? 'correct' : 'wrong'
                : i === current ? 'active' : 'pending';
            return (
              <div
                key={i}
                title={log ? `${log.word.word} — q${log.quality}` : undefined}
                className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                  state === 'correct' ? 'bg-green-400 dark:bg-green-500' :
                  state === 'wrong'   ? 'bg-red-400 dark:bg-red-500' :
                  state === 'active'  ? 'bg-primary-400 opacity-70' :
                                        'bg-gray-200 dark:bg-gray-600'
                }`}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

