import React from 'react';
import { truncate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, CheckBadgeIcon, EyeIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useSpeech } from '../../hooks/useSpeech';

/**
 * Card component representing a single vocabulary word or phrase.
 * `compact` – renders a slim single-row list item (for List view mode).
 */
export default function WordCard({ word, onEdit, onDelete, onView, compact = false }) {
  const isPhrase = word.entryType === 'PHRASE';
  const { speak, speaking, supported: speechSupported } = useSpeech();

  // ── Compact list-row variant ──────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm px-3 py-3
                   hover:shadow-md transition-shadow animate-fade-in cursor-pointer
                   flex items-center gap-2 min-w-0 overflow-hidden"
        onClick={() => onView && onView(word)}
      >
        {/* Type badge */}
        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0
          ${isPhrase ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
          {isPhrase ? '💬' : '📖'}
        </span>

        {/* Word — truncates if too long */}
        <span className="font-bold text-gray-900 dark:text-gray-100 text-sm truncate min-w-0 max-w-[120px] sm:max-w-none">
          {word.word}
        </span>

        {word.mastered && (
          <CheckBadgeIcon className="h-4 w-4 text-green-500 flex-shrink-0" title="Mastered" />
        )}

        {/* Category pill — hidden on mobile */}
        {word.categoryName && (
          <span
            className="hidden sm:inline text-[10px] px-1.5 py-0.5 rounded-full font-medium flex-shrink-0"
            style={{
              backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
              color: word.categoryColor || '#4f46e5',
            }}
          >
            {word.categoryName}
          </span>
        )}

        {/* Definition preview — fills remaining space, hidden on mobile */}
        {word.definition && (
          <span className="hidden sm:block text-xs text-gray-400 dark:text-gray-500 truncate flex-1 min-w-0">
            {truncate(word.definition, 80)}
          </span>
        )}

        {/* Next review — desktop only */}
        <span className="text-xs text-gray-300 flex-shrink-0 hidden sm:block">
          {word.nextReviewDate || '—'}
        </span>

        {/* Actions */}
        <div className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
          {speechSupported && (
            <button
              onClick={(e) => { e.stopPropagation(); speak(word.word); }}
              className={`p-1.5 rounded-lg transition-colors ${
                speaking
                  ? 'text-primary-600 bg-primary-50 dark:bg-gray-700'
                  : 'text-gray-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Pronounce"
              title="Pronounce"
            >
              <SpeakerWaveIcon className="h-3.5 w-3.5" />
            </button>
          )}
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView(word); }}
              className="hidden sm:block p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="View"
            >
              <EyeIcon className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(word); }}
            className="p-1.5 text-gray-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
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
      className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm p-4 hover:shadow-md transition-shadow animate-fade-in cursor-pointer flex flex-col gap-2"
      onClick={() => onView && onView(word)}
    >
      {/* ── Top row: type badge + mastered + category + actions ── */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Type badge */}
        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide flex-shrink-0
          ${isPhrase ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
          {isPhrase ? '💬 Phrase' : '📖 Word'}
        </span>

        {word.mastered && (
          <CheckBadgeIcon className="h-4 w-4 text-green-500 flex-shrink-0" title="Mastered" />
        )}

        {word.categoryName && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full font-medium truncate"
            style={{
              backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
              color: word.categoryColor || '#4f46e5',
            }}
          >
            {word.categoryName}
          </span>
        )}

        {/* Actions — pushed to the right */}
        <div className="flex items-center gap-0.5 ml-auto flex-shrink-0">
          {speechSupported && (
            <button
              onClick={(e) => { e.stopPropagation(); speak(word.word); }}
              className={`p-1.5 rounded-lg transition-colors ${
                speaking
                  ? 'text-primary-600 bg-primary-50 dark:bg-gray-700'
                  : 'text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700'
              }`}
              aria-label="Pronounce"
            >
              <SpeakerWaveIcon className="h-4 w-4" />
            </button>
          )}
          {onView && (
            <button
              onClick={(e) => { e.stopPropagation(); onView(word); }}
              className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="View"
            >
              <EyeIcon className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(word); }}
            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
            aria-label="Edit"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(word.id); }}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
            aria-label="Delete"
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Word / Phrase headline ── */}
      <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
        {word.word}
      </h3>

      {/* ── Definition ── */}
      {word.definition && (
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
          {truncate(word.definition, 140)}
        </p>
      )}

      {/* ── Example sentences ── */}
      {sentences.length > 0 && (
        <ul className="space-y-0.5">
          {sentences.map((s, i) => (
            <li key={i} className="text-xs text-gray-400 italic">
              "{truncate(s, 100)}"
            </li>
          ))}
        </ul>
      )}

      {/* ── SM-2 metadata footer ── */}
      <div className="mt-auto pt-3 border-t border-gray-50 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-400">
        <span>Next review: <strong className="text-gray-600 dark:text-gray-400">{word.nextReviewDate || '—'}</strong></span>
        <span>Interval: <strong className="text-gray-600 dark:text-gray-400">{word.intervalDays}d</strong></span>
        <span>Reps: <strong className="text-gray-600 dark:text-gray-400">{word.repetitions}</strong></span>
      </div>
    </div>
  );
}

