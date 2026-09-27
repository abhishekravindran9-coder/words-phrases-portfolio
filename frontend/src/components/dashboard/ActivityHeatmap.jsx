import React, { useMemo } from 'react';

/**
 * GitHub-style activity heatmap for the last 90 days.
 * `activity` is a map of "YYYY-MM-DD" -> count.
 */
export default function ActivityHeatmap({ activity = {} }) {
  const cells = useMemo(() => {
    return Object.entries(activity).map(([date, count]) => ({ date, count: Number(count) }));
  }, [activity]);

  const max = useMemo(() => Math.max(...cells.map((c) => c.count), 1), [cells]);
  const totalReviews = useMemo(() => cells.reduce((sum, cell) => sum + cell.count, 0), [cells]);
  const activeDays = useMemo(() => cells.filter((cell) => cell.count > 0).length, [cells]);

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-gray-700';
    const intensity = count / max;
    if (intensity < 0.25) return 'bg-primary-200 dark:bg-primary-900';
    if (intensity < 0.5)  return 'bg-primary-400 dark:bg-primary-700';
    if (intensity < 0.75) return 'bg-primary-600 dark:bg-primary-500';
    return 'bg-primary-800 dark:bg-primary-400';
  };

  // Group into weeks (columns of 7)
  const weeks = useMemo(() => {
    const chunks = [];
    for (let i = 0; i < cells.length; i += 7) {
      chunks.push(cells.slice(i, i + 7));
    }
    return chunks;
  }, [cells]);

  const [tooltip, setTooltip] = React.useState(null);

  return (
    <section aria-labelledby="review-activity-heading" className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 id="review-activity-heading" className="text-sm font-bold text-gray-900 dark:text-gray-100">Review activity</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{totalReviews.toLocaleString()} reviews across {activeDays} active days · last 90 days</p>
        </div>
        <div aria-label="Review activity intensity: less to more" className="hidden items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400 sm:flex">
          <span>Less</span>
          {['bg-gray-100 dark:bg-gray-700','bg-primary-200 dark:bg-primary-900','bg-primary-400 dark:bg-primary-700','bg-primary-600 dark:bg-primary-500','bg-primary-800 dark:bg-primary-400'].map((c) => (
            <span key={c} className={`inline-block h-3 w-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      {totalReviews === 0 && (
        <p className="mb-3 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-600 dark:bg-gray-900/50 dark:text-gray-300">
          Your activity map is ready. Complete a review and your learning rhythm will appear here.
        </p>
      )}

      <div className="flex gap-0.5 overflow-x-auto pb-1" aria-label="Daily review counts; focus a day to see its total">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(({ date, count }) => (
              <div
                key={date}
                role="img"
                aria-label={`${date}: ${count} review${count !== 1 ? 's' : ''}`}
                className={`h-3 w-3 flex-shrink-0 rounded-sm cursor-pointer transition-opacity hover:opacity-70 ${getColor(count)}`}
                onMouseEnter={() => setTooltip({ date, count })}
                onMouseLeave={() => setTooltip(null)}
                title={`${date}: ${count} review${count !== 1 ? 's' : ''}`}
              />
            ))}
          </div>
        ))}
      </div>

      {tooltip && (
        <p className="mt-2 text-xs text-gray-500 text-center">
          <strong>{tooltip.date}</strong>: {tooltip.count} review{tooltip.count !== 1 ? 's' : ''}
        </p>
      )}

    </section>
  );
}
