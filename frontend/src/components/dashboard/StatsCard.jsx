import React from 'react';

/**
 * A stat card for the dashboard – displays an icon, a label, and a primary value.
 */
export default function StatsCard({ label, value, icon: Icon, color = 'primary', trend }) {
  const COLOR_MAP = {
    primary: 'bg-primary-50 text-primary-600 dark:bg-primary-900/40 dark:text-primary-300',
    green:   'bg-green-50  text-green-600  dark:bg-green-900/40  dark:text-green-300',
    yellow:  'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-300',
    red:     'bg-red-50    text-red-600    dark:bg-red-900/40    dark:text-red-300',
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-start gap-4 hover:shadow-md transition-shadow dark:bg-gray-800 dark:border-gray-700">
      <div className={`p-3 rounded-xl ${COLOR_MAP[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-500 font-medium dark:text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-0.5 dark:text-gray-100">{value ?? '—'}</p>
        {trend != null && (
          <p className={`text-xs mt-1 ${trend >= 0 ? 'text-green-600' : 'text-red-500'}`}>
            {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last week
          </p>
        )}
      </div>
    </div>
  );
}
