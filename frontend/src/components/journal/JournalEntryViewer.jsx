import React, { useEffect } from 'react';
import {
  XMarkIcon, PencilIcon, CalendarDaysIcon, BookOpenIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const MOOD_META = {
  excited:    { emoji: '🤩', label: 'Excited',    bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' },
  happy:      { emoji: '😊', label: 'Happy',      bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
  motivated:  { emoji: '💪', label: 'Motivated',  bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
  neutral:    { emoji: '😐', label: 'Neutral',    bg: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400' },
  challenged: { emoji: '🤔', label: 'Challenged', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
  tired:      { emoji: '😴', label: 'Tired',      bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
};

function wordCount(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

function readingTime(text) {
  return `${Math.max(1, Math.ceil(wordCount(text) / 200))} min`;
}

/**
 * Full-content slide-over for reading a journal entry.
 * Patterned after WordDetailModal — slides in from the right.
 */
export default function JournalEntryViewer({ entry, onClose, onEdit }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!entry) return null;

  const mood = MOOD_META[entry.mood];
  const wc   = wordCount(entry.content);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50
                   w-full sm:w-[520px] bg-white dark:bg-gray-800 flex flex-col
                   shadow-2xl overflow-hidden animate-slide-in-right"
      >
        {/* ── Header ─────────────────────────────────── */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {mood && (
                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2 ${mood.bg}`}>
                  {mood.emoji} {mood.label}
                </span>
              )}
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 break-words leading-snug">
                {entry.title}
              </h2>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500 flex-wrap">
                <span className="flex items-center gap-1">
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  {formatDate(entry.createdAt)}
                </span>
                <span className="opacity-30">·</span>
                <span>⏱ {readingTime(entry.content)} read</span>
                <span className="opacity-30">·</span>
                <span>{wc} words</span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(entry); }}
                  className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50
                             dark:hover:bg-gray-700 rounded-lg transition-colors"
                  aria-label="Edit entry"
                >
                  <PencilIcon className="h-5 w-5" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Full content */}
          <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-sm">
            {entry.content}
          </p>

          {/* Vocabulary words */}
          {entry.usedWords?.length > 0 && (
            <section className="border-t border-gray-100 dark:border-gray-700 pt-5">
              <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">
                <BookOpenIcon className="h-3.5 w-3.5" />
                Vocabulary words used
              </h3>
              <div className="grid grid-cols-1 gap-2">
                {entry.usedWords.map((w) => (
                  <div
                    key={w.id}
                    className="bg-gray-50 dark:bg-gray-700/60 rounded-xl px-4 py-3"
                  >
                    <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{w.word}</p>
                    {w.definition && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                        {w.definition}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
