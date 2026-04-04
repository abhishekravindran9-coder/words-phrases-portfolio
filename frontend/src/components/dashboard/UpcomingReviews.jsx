import React from 'react';
import { Link } from 'react-router-dom';
import { formatDate } from '../../utils/helpers';
import Button from '../common/Button';

/**
 * Displays the next few words due for review on the dashboard.
 */
export default function UpcomingReviews({ words = [] }) {
  if (!words.length) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-gray-600 font-medium">All caught up!</p>
        <p className="text-sm text-gray-400 mt-1">No reviews due right now.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Upcoming Reviews</h3>
        <Link to="/review">
          <Button size="sm" variant="ghost">Start All →</Button>
        </Link>
      </div>
      <ul className="divide-y divide-gray-50">
        {words.map((w) => (
          <li key={w.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
            <div>
              <p className="font-medium text-gray-900 text-sm">{w.word}</p>
              <p className="text-xs text-gray-400 truncate max-w-xs">{w.definition}</p>
            </div>
            {w.categoryName && (
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium"
                style={{
                  backgroundColor: w.categoryColor ? `${w.categoryColor}20` : '#e0e7ff',
                  color: w.categoryColor || '#4f46e5',
                }}
              >
                {w.categoryName}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
