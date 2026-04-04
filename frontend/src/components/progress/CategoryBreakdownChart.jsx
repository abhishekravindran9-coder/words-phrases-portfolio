import React from 'react';

/**
 * Horizontal stacked bar chart showing mastered vs in-progress per category.
 * Pure CSS — no Chart.js needed for this simple layout.
 */
export default function CategoryBreakdownChart({ categories = [] }) {
  if (!categories.length) return null;

  const maxWords = Math.max(...categories.map((c) => c.wordCount), 1);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-semibold text-gray-800">Category Breakdown</h3>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full bg-emerald-400" /> Mastered
          </span>
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-4 rounded-full bg-primary-300" /> In Progress
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {categories.map((cat) => {
          const mastered    = Number(cat.masteredCount   ?? 0);
          const total       = Number(cat.wordCount       ?? 0);
          const inProgress  = total - mastered;
          const pct         = total > 0 ? Math.round((mastered / total) * 100) : 0;
          const mastPct     = total > 0 ? (mastered / maxWords) * 100 : 0;
          const progPct     = total > 0 ? (inProgress / maxWords) * 100 : 0;

          return (
            <div key={cat.categoryId}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="h-2.5 w-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: cat.categoryColor || '#6366f1' }}
                  />
                  <span className="text-sm font-medium text-gray-700 truncate">
                    {cat.categoryName}
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                  <span className="text-xs text-gray-400">{total} words</span>
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                      pct >= 80 ? 'bg-emerald-100 text-emerald-700' :
                      pct >= 40 ? 'bg-primary-100 text-primary-700' :
                      'bg-gray-100 text-gray-500'
                    }`}
                  >
                    {pct}%
                  </span>
                </div>
              </div>

              {/* Stacked bar */}
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden flex">
                {mastered > 0 && (
                  <div
                    className="h-full bg-emerald-400 transition-all duration-700 ease-out"
                    style={{ width: `${mastPct}%` }}
                    title={`${mastered} mastered`}
                  />
                )}
                {inProgress > 0 && (
                  <div
                    className="h-full bg-primary-300 transition-all duration-700 ease-out"
                    style={{ width: `${progPct}%` }}
                    title={`${inProgress} in progress`}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
