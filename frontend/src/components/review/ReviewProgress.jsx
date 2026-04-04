import React from 'react';

/**
 * Displays review session progress: "X of Y" with a progress bar.
 */
export default function ReviewProgress({ current, total }) {
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
        <span className="font-medium">{current} of {total} reviewed</span>
        <span className="font-semibold text-primary-600">{pct}%</span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="h-2.5 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
