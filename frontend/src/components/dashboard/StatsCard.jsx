import React from 'react';

/**
 * A stat card for the dashboard – displays an icon, a label, and a primary value.
 */
export default function StatsCard({ label, value, icon: Icon, color = 'primary', trend }) {
  const COLOR_MAP = {
    primary: 'bg-primary-50 text-primary-600',
    green:   'bg-green-50 text-green-600',
    yellow:  'bg-yellow-50 text-yellow-600',
    red:     'bg-red-50 text-red-600',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl ${COLOR_MAP[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5">{value ?? '—'}</p>
        {trend != null && (
          <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  );
}
