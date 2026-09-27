import React from 'react';
import { truncate } from '../../utils/helpers';
import { PencilIcon, TrashIcon, CheckBadgeIcon, EyeIcon, SpeakerWaveIcon } from '@heroicons/react/24/outline';
import { useSpeech } from '../../hooks/useSpeech';

function getReviewStatus(date) {
  if (!date) return { label: 'Not scheduled', tone: 'neutral' };
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (date < todayKey) {
    const days = Math.max(1, Math.floor((Date.parse(`${todayKey}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86400000));
    return { label: `Overdue ${days}d`, tone: 'overdue' };
  }
  if (date === todayKey) return { label: 'Due today', tone: 'today' };
  const days = Math.ceil((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${todayKey}T00:00:00Z`)) / 86400000);
  return { label: `In ${days}d`, tone: 'upcoming' };
}

function getDifficulty(easeFactor) {
  if (easeFactor <= 1.5) return { label: 'Challenging', classes: 'bg-rose-50 text-rose-700 ring-rose-200 dark:bg-rose-900/25 dark:text-rose-300 dark:ring-rose-800' };
  if (easeFactor <= 2) return { label: 'Building', classes: 'bg-amber-50 text-amber-700 ring-amber-200 dark:bg-amber-900/25 dark:text-amber-300 dark:ring-amber-800' };
  return { label: 'Steady', classes: 'bg-teal-50 text-teal-700 ring-teal-200 dark:bg-teal-900/25 dark:text-teal-300 dark:ring-teal-800' };
}

/**
 * Card component representing a single vocabulary word or phrase.
 * `compact` – renders a slim single-row list item (for List view mode).
 */
export default function WordCard({ word, onEdit, onDelete, onView, compact = false }) {
  const isPhrase = word.entryType === 'PHRASE';
  const { speak, speaking, supported: speechSupported } = useSpeech();
  const reviewStatus = getReviewStatus(word.nextReviewDate);
  const difficulty = getDifficulty(Number(word.easeFactor ?? 2.5));
  const repetitions = Number(word.repetitions ?? 0);
  const masteryProgress = Math.min(100, Math.max(0, (repetitions / 5) * 100));

  // ── Compact list-row variant ──────────────────────────────────────────────
  if (compact) {
    return (
      <div
        className="flex min-w-0 flex-wrap items-center gap-2 overflow-hidden rounded-xl border border-gray-200/80 bg-white px-3 py-3 shadow-sm transition-all hover:border-primary-200 hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
        onClick={() => onView && onView(word)}
      >
        {/* Type badge */}
        <span className={`flex-shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold uppercase tracking-wide
          ${isPhrase ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'}`}>
          {isPhrase ? '💬' : '📖'}
        </span>

        <span aria-label={`Difficulty: ${difficulty.label}`} title={`Difficulty: ${difficulty.label}`} className={`hidden h-2 w-2 flex-shrink-0 rounded-full sm:block ${difficulty.label === 'Challenging' ? 'bg-rose-500' : difficulty.label === 'Building' ? 'bg-amber-500' : 'bg-teal-500'}`} />

        {/* Word — truncates if too long */}
        <span className="min-w-0 max-w-[120px] truncate text-sm font-bold text-gray-900 dark:text-gray-100 sm:max-w-none">
          {word.word}
        </span>

        {word.mastered && (
          <CheckBadgeIcon className="h-4 w-4 text-green-500 flex-shrink-0" title="Mastered" />
        )}

        {/* Category pill — hidden on mobile */}
        {word.categoryName && (
          <span
            className="hidden flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-medium sm:inline"
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
          <span className="hidden min-w-0 flex-1 truncate text-xs text-gray-500 dark:text-gray-400 sm:block">
            {truncate(word.definition, 80)}
          </span>
        )}

        {/* Next review — desktop only */}
          <span className={`hidden flex-shrink-0 rounded-full px-2 py-1 text-[10px] font-bold sm:inline-flex ${reviewStatus.tone === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300' : reviewStatus.tone === 'today' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-300' : reviewStatus.tone === 'upcoming' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-300'}`} title={`Next review ${word.nextReviewDate || 'not scheduled'} · ${word.intervalDays ?? 1} day interval · ${repetitions} successful repetitions`}>
            {reviewStatus.label}
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
      className={`group bg-white dark:bg-gray-800 rounded-2xl border border-gray-200/80 dark:border-gray-700 shadow-sm p-5 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-900/5 transition-all duration-200 animate-fade-in cursor-pointer flex flex-col gap-3 ${word.mastered ? 'ring-1 ring-emerald-100 dark:ring-emerald-900/50' : ''}`}
      onClick={() => onView && onView(word)}
    >
      {/* ── Top row: type badge + mastered + category + actions ── */}
      <div className="flex items-center gap-2 min-w-0">
        {/* Type badge */}
        <span className={`inline-flex min-h-7 items-center text-[10px] font-bold px-2 rounded-lg uppercase tracking-wide flex-shrink-0
          ${isPhrase ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300' : 'bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300'}`}>
          {isPhrase ? '💬 Phrase' : '📖 Word'}
        </span>

        <span className={`inline-flex min-h-7 items-center gap-1 rounded-lg px-2 text-[10px] font-bold ring-1 ring-inset ${difficulty.classes}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />{difficulty.label}
        </span>

        {word.mastered && <span className="inline-flex min-h-7 items-center gap-1 rounded-lg bg-emerald-50 px-2 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"><CheckBadgeIcon className="h-3.5 w-3.5" />Mastered</span>}

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
      <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 leading-snug">
        {word.word}
      </h3>

      {/* ── Definition ── */}
      {word.definition && (
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
          {truncate(word.definition, 140)}
        </p>
      )}

      {/* ── Example sentences ── */}
      {sentences.length > 0 && (
        <ul className="space-y-0.5">
          {sentences.map((s, i) => (
            <li key={i} className="flex gap-2 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              <span className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary-400" aria-hidden="true" />
              <span className="italic">“{truncate(s, 100)}”</span>
            </li>
          ))}
        </ul>
      )}

      {/* ── SM-2 metadata footer ── */}
      <div className="mt-auto rounded-xl border border-gray-100 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-900/40">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className={`inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-bold ${reviewStatus.tone === 'overdue' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/35 dark:text-rose-300' : reviewStatus.tone === 'today' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-300' : reviewStatus.tone === 'upcoming' ? 'bg-sky-100 text-sky-700 dark:bg-sky-900/35 dark:text-sky-300' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
            {reviewStatus.label}{word.nextReviewDate ? ` · ${word.nextReviewDate}` : ''}
          </span>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">{word.intervalDays ?? 1} day interval</span>
        </div>
        <div className="mt-2.5 flex items-center gap-2.5">
          <span className="w-20 flex-shrink-0 text-[10px] font-semibold text-gray-500 dark:text-gray-400">Recall strength</span>
          <div
            className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700"
            role="progressbar"
            aria-label={`Successful repetitions toward mastery: ${repetitions} of 5`}
            aria-valuemin={0}
            aria-valuemax={5}
            aria-valuenow={Math.min(5, repetitions)}
          >
            <div className={`h-full rounded-full transition-all ${word.mastered ? 'bg-emerald-500' : 'bg-gradient-to-r from-primary-400 to-primary-600'}`} style={{ width: `${word.mastered ? 100 : masteryProgress}%` }} />
          </div>
          <span className="flex-shrink-0 text-[10px] font-bold tabular-nums text-gray-600 dark:text-gray-300">{word.mastered ? '5+' : `${Math.min(5, repetitions)}/5`}</span>
        </div>
      </div>
    </div>
  );
}

