import React from 'react';
import { formatDate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, BookOpenIcon, ClockIcon } from '@heroicons/react/24/outline';

const MOOD_META = {
  excited:    { emoji: '🤩', bar: 'bg-amber-400',  badge: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',     label: 'Excited' },
  happy:      { emoji: '😊', bar: 'bg-yellow-400', badge: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', label: 'Happy' },
  motivated:  { emoji: '💪', bar: 'bg-green-400',  badge: 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',     label: 'Motivated' },
  neutral:    { emoji: '😐', bar: 'bg-gray-300',   badge: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',           label: 'Neutral' },
  challenged: { emoji: '🤔', bar: 'bg-blue-400',   badge: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',         label: 'Challenged' },
  tired:      { emoji: '😴', bar: 'bg-purple-400', badge: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', label: 'Tired' },
};

function wc(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

function readTime(text) {
  return Math.max(1, Math.ceil(wc(text) / 200));
}

/**
 * Rich card for a single journal entry.
 * Clicking the card body opens the full entry viewer.
 * Edit/delete buttons appear on hover.
 */
export default function JournalEntryCard({ entry, onEdit, onDelete, onView }) {
  const mood       = MOOD_META[entry.mood];
  const vocabCount = entry.usedWords?.length ?? 0;
  const words      = wc(entry.content);
  const mins       = readTime(entry.content);

  return (
    <article
      className="group relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700
                 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
      onClick={() => onView?.(entry)}
    >
      {/* Mood colour strip on the left edge */}
      {mood && (
        <div className={`absolute left-0 top-0 bottom-0 w-1 ${mood.bar}`} />
      )}

      <div className="pl-5 pr-4 pt-4 pb-4">
        {/* Top row: mood badge + date + actions */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {mood ? (
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${mood.badge}`}>
                {mood.emoji} {mood.label}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-400 flex-shrink-0">
                📓 Journal
              </span>
            )}
            <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
              {formatDate(entry.createdAt)}
            </span>
          </div>

          {/* Actions — revealed on hover */}
          <div className="flex gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50
                         dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Edit"
            >
              <PencilIcon className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(entry.id); }}
              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50
                         dark:hover:bg-red-900/30 rounded-lg transition-colors"
              aria-label="Delete"
            >
              <TrashIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 dark:text-gray-100 leading-snug mb-2 line-clamp-1">
          {entry.title}
        </h3>

        {/* Content preview */}
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed line-clamp-3 mb-4">
          {entry.content}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between gap-2 pt-3 border-t border-gray-50 dark:border-gray-700/60">
          <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-gray-500">
            <span className="flex items-center gap-1">
              <ClockIcon className="h-3 w-3" />
              {mins} min read
            </span>
            <span className="opacity-30">·</span>
            <span>{words.toLocaleString()} words</span>
          </div>

          {vocabCount > 0 && (
            <div className="flex items-center gap-1">
              <BookOpenIcon className="h-3 w-3 text-primary-400 flex-shrink-0" />
              <div className="flex items-center gap-1">
                {entry.usedWords.slice(0, 2).map((w) => (
                  <span
                    key={w.id}
                    className="text-[10px] bg-primary-50 dark:bg-primary-900/25
                               text-primary-700 dark:text-primary-400 px-1.5 py-0.5 rounded-full font-medium"
                  >
                    {w.word}
                  </span>
                ))}
                {vocabCount > 2 && (
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
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
