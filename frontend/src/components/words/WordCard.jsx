import React from 'react';
import { truncate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, CheckBadgeIcon, EyeIcon } from '@heroicons/react/24/outline';

/**
 * Card component representing a single vocabulary word or phrase.
 * `compact` – renders a slim single-row list item (for List view mode).
 */
export default function WordCard({ word, onEdit, onDelete, onView, compact = false }) {
  const isPhrase = word.entryType === 'PHRASE';

  // ── Compact list-row variant ──────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3
                   hover:shadow-md transition-shadow animate-fade-in cursor-pointer
                   flex items-center gap-3"
        onClick={() => onView && onView(word)}
      >
        {/* Type badge */}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0
          ${isPhrase ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
          {isPhrase ? '💬' : '📖'}
        </span>

        {/* Word */}
        <span className="font-bold text-gray-900 text-sm flex-shrink-0">{word.word}</span>

        {word.mastered && (
          <CheckBadgeIcon className="h-4 w-4 text-green-500 flex-shrink-0" title="Mastered" />
        )}

        {/* Category pill */}
        {word.categoryName && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{
              backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
              color: word.categoryColor || '#4f46e5',
            }}
          >
            {word.categoryName}
          </span>
        )}

        {/* Definition preview */}
        {word.definition && (
          <span className="text-xs text-gray-400 truncate flex-1">
            {truncate(word.definition, 80)}
          </span>
        )}

        {/* Next review */}
        <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
          {word.nextReviewDate || '—'}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView(word); }}
              className="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="View"
            >
              <EyeIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(word); }}
            className="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    );
  }

  // ── Full card variant (default / grid view) ───────────────────────────────
  const sentences = (word.exampleSentence || '')
    .split('\n\n')
    .filter(Boolean)
    .slice(0, 3);

  return (
    <div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow animate-fade-in cursor-pointer"
      onClick={() => onView && onView(word)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Word / Phrase type badge */}
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide
              ${isPhrase
                ? 'bg-purple-100 text-purple-700'
                : 'bg-blue-100 text-blue-700'}`}>
              {isPhrase ? '💬 Phrase' : '📖 Word'}
            </span>
            <h3 className="text-lg font-bold text-gray-900">{word.word}</h3>
            {word.mastered && (
              <CheckBadgeIcon className="h-5 w-5 text-green-500 flex-shrink-0" title="Mastered" />
            )}
          </div>

          {word.categoryName && (
            <span
              className="mt-1 inline-block text-xs px-2 py-0.5 rounded-full font-medium"
              style={{
                backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
                color: word.categoryColor || '#4f46e5',
              }}
            >
              {word.categoryName}
            </span>
          )}

          {word.definition && (
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {truncate(word.definition, 120)}
            </p>
          )}

          {/* Multiple example sentences */}
          {sentences.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {sentences.map((s, i) => (
                <li key={i} className="text-xs text-gray-400 italic">
                  "{truncate(s, 100)}"
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView(word); }}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
              aria-label="View"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(word); }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            aria-label="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* SM-2 metadata footer */}
      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center gap-4 text-xs text-gray-400">
        <span>Next review: <strong className="text-gray-600">{word.nextReviewDate || '—'}</strong></span>
        <span>Interval: <strong className="text-gray-600">{word.intervalDays}d</strong></span>
        <span>Reps: <strong className="text-gray-600">{word.repetitions}</strong></span>
      </div>
    </div>
  );
}

