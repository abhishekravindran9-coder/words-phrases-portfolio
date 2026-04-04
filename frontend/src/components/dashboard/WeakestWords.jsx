import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

/**
 * Shows the 5 hardest words (lowest ease factor) so the user knows
 * which ones need extra attention.
 */
export default function WeakestWords({ words = [], overdueCount = 0 }) {
  if (words.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">😓</span>
          <p className="text-sm font-semibold text-gray-700">Needs Work</p>
        </div>
        {overdueCount > 0 && (
          <span className="flex items-center gap-1 text-xs font-semibold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
            <ExclamationTriangleIcon className="h-3.5 w-3.5" />
            {overdueCount} overdue
          </span>
        )}
      </div>

      <ul className="space-y-2">
        {words.map((w) => {
          const ef = typeof w.easeFactor === 'number' ? w.easeFactor.toFixed(2) : '—';
          const hardness = w.easeFactor <= 1.5 ? 'text-red-500' : w.easeFactor <= 2.0 ? 'text-orange-500' : 'text-yellow-500';

          return (
            <li key={w.id} className="flex items-center gap-3 py-1.5 border-b border-gray-50 last:border-0">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{w.word}</p>
                {w.categoryName && (
                  <span className="text-xs text-gray-400">{w.categoryName}</span>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                <p className={`text-xs font-bold ${hardness}`}>EF {ef}</p>
                <p className="text-[10px] text-gray-400">{w.repetitions} reps</p>
              </div>
            </li>
          );
        })}
      </ul>

      <Link to="/review" className="mt-4 block text-center text-xs font-semibold text-primary-600 hover:text-primary-800 transition-colors">
        Review these words →
      </Link>
    </div>
  );
}
