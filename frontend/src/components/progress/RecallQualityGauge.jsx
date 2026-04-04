import React from 'react';

function getLevel(q) {
  if (q >= 4)   return { label: 'Excellent',  color: '#10b981', bg: 'bg-emerald-50',  text: 'text-emerald-700',  ring: 'ring-emerald-200',  emoji: '🎯' };
  if (q >= 3)   return { label: 'Good',        color: '#6366f1', bg: 'bg-primary-50',  text: 'text-primary-700',  ring: 'ring-primary-200',  emoji: '👍' };
  if (q >= 2)   return { label: 'Needs Work',  color: '#f59e0b', bg: 'bg-amber-50',    text: 'text-amber-700',    ring: 'ring-amber-200',    emoji: '💪' };
  return         { label: 'Struggling',        color: '#ef4444', bg: 'bg-red-50',       text: 'text-red-700',      ring: 'ring-red-200',      emoji: '📚' };
}

/**
 * Visual gauge for average recall quality (0–5 scale).
 */
export default function RecallQualityGauge({ quality = 0 }) {
  const q    = Math.min(5, Math.max(0, quality));
  const pct  = (q / 5) * 100;
  const lvl  = getLevel(q);

  // Arc SVG params
  const r   = 52;
  const cx  = 70;
  const cy  = 70;
  const circ = Math.PI * r;   // half-circle circumference

  const filled = (pct / 100) * circ;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-1">Recall Quality</h3>
      <p className="text-xs text-gray-400 mb-4">Average score over last 30 days</p>

      <div className="flex items-center gap-6">
        {/* SVG half-arc gauge */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="80" viewBox="0 0 140 80">
            {/* Track */}
            <path
              d={`M 18 70 A ${r} ${r} 0 0 1 122 70`}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="12"
              strokeLinecap="round"
            />
            {/* Filled arc */}
            <path
              d={`M 18 70 A ${r} ${r} 0 0 1 122 70`}
              fill="none"
              stroke={lvl.color}
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${filled} ${circ}`}
              style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
            />
            {/* Tick marks */}
            {[0, 1, 2, 3, 4, 5].map((v) => {
              const angle = Math.PI - (v / 5) * Math.PI;
              const ix = cx + (r + 10) * Math.cos(angle);
              const iy = cy - (r + 10) * Math.sin(angle);
              return (
                <text
                  key={v}
                  x={ix}
                  y={iy + 4}
                  textAnchor="middle"
                  fontSize="9"
                  fill={q >= v ? lvl.color : '#9ca3af'}
                  fontWeight="600"
                >
                  {v}
                </text>
              );
            })}
          </svg>
          {/* Center value */}
          <div className="absolute inset-0 flex items-end justify-center pb-0">
            <div className="text-center">
              <p className="text-2xl font-extrabold text-gray-900 leading-none">
                {q.toFixed(1)}
              </p>
              <p className="text-[10px] text-gray-400 mt-0.5">/ 5</p>
            </div>
          </div>
        </div>

        {/* Level badge + description */}
        <div className="flex-1">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold ring-1 ${lvl.bg} ${lvl.text} ${lvl.ring}`}>
            {lvl.emoji} {lvl.label}
          </span>
          <p className="mt-3 text-xs text-gray-500 leading-relaxed">
            {q >= 4
              ? 'Outstanding! Your recall is excellent. Keep up the momentum.'
              : q >= 3
              ? 'Solid progress. A few more reviews will lock these in.'
              : q >= 2
              ? 'Getting there. Focus on the harder words listed below.'
              : 'These words need more attention. Daily short reviews help most.'}
          </p>
          {/* Mini quality scale */}
          <div className="mt-3 flex gap-1">
            {[1,2,3,4,5].map((v) => (
              <div
                key={v}
                className="h-2 flex-1 rounded-full transition-all duration-500"
                style={{ backgroundColor: v <= Math.round(q) ? lvl.color : '#e5e7eb' }}
              />
            ))}
          </div>
          <div className="flex justify-between text-[9px] text-gray-400 mt-1">
            <span>Poor</span><span>Excellent</span>
          </div>
        </div>
      </div>
    </div>
  );
}
