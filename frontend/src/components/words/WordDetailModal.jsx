import React, { useEffect } from 'react';
import {
  XMarkIcon, CheckBadgeIcon, CalendarDaysIcon,
  ArrowPathIcon, BoltIcon, PencilIcon,
} from '@heroicons/react/24/outline';

/**
 * Full-detail slide-over for a single word / phrase.
 * Slides in from the right on desktop; full-screen sheet on mobile.
 */
export default function WordDetailModal({ word, onClose, onEdit }) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  if (!word) return null;

  const isPhrase = word.entryType === 'PHRASE';

  const sentences = (word.exampleSentence || '')
    .split('\n\n')
    .filter(Boolean);

  const efColor =
    word.easeFactor <= 1.5 ? 'text-red-600' :
    word.easeFactor <= 2.0 ? 'text-orange-500' :
    'text-green-600';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel — full-screen mobile, side sheet desktop */}
      <div
        role="dialog"
        aria-modal="true"
        className="fixed inset-0 sm:inset-y-0 sm:right-0 sm:left-auto z-50
                   w-full sm:w-[480px] bg-white dark:bg-gray-800 flex flex-col
                   shadow-2xl overflow-hidden
                   animate-slide-in-right"
      >
        {/* ── Header ── */}
        <div className="flex items-start justify-between px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
          <div className="flex-1 min-w-0 pr-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide
                ${isPhrase
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-blue-100 text-blue-700'}`}>
                {isPhrase ? '💬 Phrase' : '📖 Word'}
              </span>
              {word.mastered && (
                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 uppercase tracking-wide">
                  <CheckBadgeIcon className="h-3 w-3" /> Mastered
                </span>
              )}
            </div>
            <h2 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-gray-100 break-words leading-tight">
              {word.word}
            </h2>
            {word.categoryName && (
              <span
                className="mt-1 inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
                  color: word.categoryColor || '#4f46e5',
                }}
              >
                {word.categoryName}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {onEdit && (
              <button
                onClick={() => { onClose(); onEdit(word); }}
                className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Edit"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              aria-label="Close"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">

          {/* Definition */}
          {word.definition ? (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Definition
              </h3>
              <p className="text-gray-800 dark:text-gray-200 leading-relaxed text-sm whitespace-pre-wrap">
                {word.definition}
              </p>
            </section>
          ) : (
            <p className="text-sm text-gray-400 italic">No definition added yet.</p>
          )}

          {/* Example sentences */}
          {sentences.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                {sentences.length === 1 ? 'Example' : 'Examples'}
              </h3>
              <ul className="space-y-3">
                {sentences.map((s, i) => (
                  <li
                    key={i}
                    className="relative pl-4 text-sm text-gray-700 dark:text-gray-300 italic leading-relaxed
                               before:absolute before:left-0 before:top-1 before:h-3/4
                               before:w-0.5 before:bg-primary-300 before:rounded-full"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Notes */}
          {word.notes && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Notes
              </h3>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap">
                {word.notes}
              </p>
            </section>
          )}

          {/* SM-2 stats */}
          <section>
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Review Stats
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <StatPill
                icon={<CalendarDaysIcon className="h-4 w-4" />}
                label="Next Review"
                value={word.nextReviewDate || '—'}
              />
              <StatPill
                icon={<ArrowPathIcon className="h-4 w-4" />}
                label="Interval"
                value={`${word.intervalDays}d`}
              />
              <StatPill
                icon={<BoltIcon className="h-4 w-4" />}
                label="Reps"
                value={word.repetitions}
              />
              <StatPill
                icon={<span className="text-xs font-bold">EF</span>}
                label="Ease Factor"
                value={
                  <span className={`font-bold ${efColor}`}>
                    {Number(word.easeFactor).toFixed(2)}
                  </span>
                }
              />
            </div>
          </section>

          {/* Added date */}
          {word.createdAt && (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center pb-2">
              Added on {new Date(word.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          )}
        </div>
      </div>
    </>
  );
}

function StatPill({ icon, label, value }) {
  return (
    <div className="flex items-center gap-2.5 bg-gray-50 dark:bg-gray-700 rounded-xl px-3 py-2.5">
      <span className="text-gray-400 dark:text-gray-500 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{value}</p>
      </div>
    </div>
  );
}
