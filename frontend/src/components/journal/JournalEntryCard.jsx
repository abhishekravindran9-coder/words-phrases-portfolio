import React from 'react';
import { formatDate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, BookOpenIcon } from '@heroicons/react/24/outline';

const MOOD_META = {
  excited:    { emoji: '🤩', bar: 'bg-amber-400 dark:bg-amber-500' },
  happy:      { emoji: '😊', bar: 'bg-yellow-400 dark:bg-yellow-500' },
  motivated:  { emoji: '💪', bar: 'bg-green-400 dark:bg-green-500' },
  neutral:    { emoji: '😐', bar: 'bg-gray-300 dark:bg-gray-500' },
  challenged: { emoji: '🤔', bar: 'bg-blue-400 dark:bg-blue-500' },
  tired:      { emoji: '😴', bar: 'bg-purple-400 dark:bg-purple-500' },
};

function wc(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

function readTime(text) {
  return `${Math.max(1, Math.ceil(wc(text) / 200))} min`;
}

/**
 * Rich card for a single journal entry.
 * Clicking the card body opens the full entry viewer.
 * Edit/delete buttons appear on hover.
 */
export default function JournalEntryCard({ entry, onEdit, onDelete, onView }) {
  const mood       = MOOD_META[entry.mood];
  const vocabCount = entry.usedWords?.length ?? 0;

  return (
    <article
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                 shadow-sm hover:shadow-lg transition-all duration-200 animate-fade-in overflow-hidden cursor-pointer"
      onClick={() => onView?.(entry)}
    >
      {/* Mood colour strip on the left edge */}
      {mood && (
        <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${mood.bar}`} />
      )}

      <div className="pl-5 pr-4 py-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              {mood && <span className="text-xl leading-none">{mood.emoji}</span>}
              <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-snug truncate">
                {entry.title}
              </h3>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {formatDate(entry.createdAt)}
            </p>
          </div>

          {/* Actions — revealed on hover */}
          <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50
                         dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Edit"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50
                         dark:hover:bg-red-900/30 rounded-lg transition-colors"
              aria-label="Delete"
            >
              <TrashIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Content preview — 3-line clamp */}
        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-3">
          {entry.content}
        </p>

        {/* Footer strip */}
        <div className="mt-4 pt-3 border-t border-gray-50 dark:border-gray-700/60
                        flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-gray-500">
            <span>⏱ {readTime(entry.content)}</span>
            <span className="opacity-30">·</span>
            <span>{wc(entry.content).toLocaleString()} words</span>
          </div>

          {vocabCount > 0 && (
            <div className="flex items-center gap-1.5">
              <BookOpenIcon className="h-3 w-3 text-primary-400" />
              <div className="flex items-center gap-1">
                {entry.usedWords.slice(0, 2).map((w) => (
                  <span
                    key={w.id}
                    className="text-[10px] bg-primary-50 dark:bg-primary-900/25
                               text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full"
                  >
                    {w.word}
                  </span>
                ))}
                {vocabCount > 2 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500">
                    +{vocabCount - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

