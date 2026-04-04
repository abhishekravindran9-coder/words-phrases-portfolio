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

  const getColor = (count) => {
    if (count === 0) return 'bg-gray-100';
    const intensity = count / max;
    if (intensity < 0.25) return 'bg-primary-200';
    if (intensity < 0.5)  return 'bg-primary-400';
    if (intensity < 0.75) return 'bg-primary-600';
    return 'bg-primary-800';
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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-gray-700">Review Activity</p>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <span>Less</span>
          {['bg-gray-100','bg-primary-200','bg-primary-400','bg-primary-600','bg-primary-800'].map((c) => (
            <span key={c} className={`inline-block h-3 w-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </div>

      <div className="flex gap-0.5 overflow-x-auto pb-1">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-0.5">
            {week.map(({ date, count }) => (
              <div
                key={date}
                className={`h-3 w-3 rounded-sm cursor-pointer transition-opacity hover:opacity-70 ${getColor(count)}`}
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

      <p className="mt-2 text-xs text-gray-400 text-right">Last 90 days</p>
    </div>
  );
}
