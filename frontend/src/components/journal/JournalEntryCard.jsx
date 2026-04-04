import React from 'react';
import { formatDate, truncate } from '../../utils/helpers';
import { PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

const MOOD_EMOJI = {
  excited:    '🤩',
  happy:      '😊',
  motivated:  '💪',
  neutral:    '😐',
  challenged: '🤔',
  tired:      '😴',
};

/**
 * Card displaying a single journal entry with edit/delete actions.
 */
export default function JournalEntryCard({ entry, onEdit, onDelete }) {
  return (
    <article className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {entry.mood && (
              <span className="text-xl" aria-label={entry.mood}>
                {MOOD_EMOJI[entry.mood] || '📝'}
              </span>
            )}
            <h3 className="font-bold text-gray-900 truncate">{entry.title}</h3>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">{formatDate(entry.createdAt)}</p>
        </div>

        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(entry)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Edit entry"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(entry.id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete entry"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      <p className="mt-3 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {truncate(entry.content, 200)}
      </p>

      {entry.usedWords?.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {entry.usedWords.map((w) => (
            <span
              key={w.id}
              className="text-xs bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full"
            >
              {w.word}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}
