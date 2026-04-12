import React, { useEffect, useMemo } from 'react';
import {
  XMarkIcon, PencilIcon, CalendarDaysIcon, BookOpenIcon,
  ClockIcon, DocumentTextIcon,
} from '@heroicons/react/24/outline';
import { formatDate } from '../../utils/helpers';

const MOOD_META = {
  excited:    { emoji: '🤩', label: 'Excited',    bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',    bar: 'bg-amber-400' },
  happy:      { emoji: '😊', label: 'Happy',      bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400', bar: 'bg-yellow-400' },
  motivated:  { emoji: '💪', label: 'Motivated',  bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',     bar: 'bg-green-400' },
  neutral:    { emoji: '😐', label: 'Neutral',    bg: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400',            bar: 'bg-gray-300' },
  challenged: { emoji: '🤔', label: 'Challenged', bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',         bar: 'bg-blue-400' },
  tired:      { emoji: '😴', label: 'Tired',      bg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400', bar: 'bg-purple-400' },
};

function wordCount(text) {
  return text?.trim().split(/\s+/).filter(Boolean).length ?? 0;
}

function readingTime(text) {
  return Math.max(1, Math.ceil(wordCount(text) / 200));
}

/**
 * Renders entry content with vocabulary words highlighted inline.
 * Hovering a highlight shows the word's definition as a tooltip.
 */
function HighlightedContent({ content, vocabWords }) {
  const nodes = useMemo(() => {
    if (!vocabWords?.length) return [content];
    const escaped = vocabWords.map((w) => w.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
    const parts   = content.split(pattern);
    return parts.map((part, i) => {
      const match = vocabWords.find((w) => w.word.toLowerCase() === part.toLowerCase());
      if (match) {
        return (
          <mark
            key={i}
            className="bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-300
                       rounded px-0.5 not-italic font-medium cursor-help"
            title={match.definition ? `${match.word}: ${match.definition}` : match.word}
          >
            {part}
          </mark>
        );
      }
      return part;
    });
  }, [content, vocabWords]);

  return (
    <p className="text-gray-800 dark:text-gray-200 leading-relaxed whitespace-pre-wrap text-sm">
      {nodes}
    </p>
  );
}

/**
 * Full-content slide-over for reading a journal entry.
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

  const mood      = MOOD_META[entry.mood];
  const wc        = wordCount(entry.content);
  const mins      = readingTime(entry.content);
  const chars     = entry.content?.length ?? 0;
  const sentences = (entry.content?.match(/[.!?]+/g) || []).length;

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
                   w-full sm:w-[560px] bg-white dark:bg-gray-800 flex flex-col
                   shadow-2xl overflow-hidden animate-slide-in-right"
      >
        {/* Mood colour top strip */}
        {mood && <div className={`h-1 w-full flex-shrink-0 ${mood.bar}`} />}

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700 flex-shrink-0">
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
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <CalendarDaysIcon className="h-3.5 w-3.5" />
                  {formatDate(entry.createdAt)}
                </span>
                <span className="text-gray-200 dark:text-gray-700">·</span>
                <span className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                  <ClockIcon className="h-3.5 w-3.5" />
                  {mins} min read
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {onEdit && (
                <button
                  onClick={() => { onClose(); onEdit(entry); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                             text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800
                             hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                >
                  <PencilIcon className="h-3.5 w-3.5" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 ml-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                           hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-5 px-6 py-2.5 bg-gray-50 dark:bg-gray-900/40
                        border-b border-gray-100 dark:border-gray-700 flex-shrink-0 flex-wrap">
          <span className="flex items-center gap-1 text-[11px] text-gray-400 dark:text-gray-500">
            <DocumentTextIcon className="h-3 w-3" />
            {wc.toLocaleString()} words
          </span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">{chars.toLocaleString()} chars</span>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            {sentences} sentence{sentences !== 1 ? 's' : ''}
          </span>
          {entry.usedWords?.length > 0 && (
            <span className="flex items-center gap-1 text-[11px] text-primary-500 dark:text-primary-400">
              <BookOpenIcon className="h-3 w-3" />
              {entry.usedWords.length} vocab word{entry.usedWords.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">

            {/* Content with vocab highlighted */}
            <HighlightedContent content={entry.content} vocabWords={entry.usedWords} />

            {/* Vocab word cards */}
            {entry.usedWords?.length > 0 && (
              <section className="border-t border-gray-100 dark:border-gray-700 pt-5">
                <h3 className="flex items-center gap-2 text-xs font-semibold text-gray-400 dark:text-gray-500
                               uppercase tracking-widest mb-3">
                  <BookOpenIcon className="h-3.5 w-3.5" />
                  Vocabulary used in this entry
                  <span className="ml-auto text-[10px] text-primary-400 dark:text-primary-500 normal-case tracking-normal font-normal italic">
                    highlighted above
                  </span>
                </h3>
                <div className="space-y-2">
                  {entry.usedWords.map((w) => (
                    <div
                      key={w.id}
                      className="flex gap-3 bg-primary-50 dark:bg-primary-900/15
                                 border border-primary-100 dark:border-primary-900/30 rounded-xl px-4 py-3"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-primary-800 dark:text-primary-300">{w.word}</p>
                        {w.definition && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                            {w.definition}
                          </p>
                        )}
                      </div>
                      {w.partOfSpeech && (
                        <span className="text-[10px] font-medium text-primary-500
                                         bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded self-start flex-shrink-0">
                          {w.partOfSpeech}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
