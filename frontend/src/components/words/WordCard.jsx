import React from 'react';
import { truncate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

/**
 * Card component representing a single vocabulary word or phrase.
 */
export default function WordCard({ word, onEdit, onDelete }) {
  const isPhrase = word.entryType === 'PHRASE';

  // Example sentences are stored joined by double newline
  const sentences = (word.exampleSentence || '')
    .split('\n\n')
    .filter(Boolean)
    .slice(0, 3); // show at most 3 on the card

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow animate-fade-in">
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
          <button
            onClick={() => onEdit(word)}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(word.id)}
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
