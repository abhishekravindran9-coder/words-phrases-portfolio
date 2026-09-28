import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  XMarkIcon, CheckBadgeIcon, CalendarDaysIcon,
  ArrowPathIcon, BoltIcon, PencilIcon, SpeakerWaveIcon, PauseIcon, StopIcon,
} from '@heroicons/react/24/outline';
import { useSpeech } from '../../hooks/useSpeech';
import { reviewService } from '../../services/reviewService';

function cleanNotes(value) {
  return (value || '').replace(/\*\*/g, '').replace(/__/g, '').replace(/\*/g, '•');
}

/**
 * Full-detail slide-over for a single word / phrase.
 * Slides in from the right on desktop; full-screen sheet on mobile.
 */
export default function WordDetailModal({ word, onClose, onEdit }) {
  const { speak, stop, pause, resume, speaking, paused, supported: speechSupported } = useSpeech();
  const [history, setHistory] = useState([]);

  // Build the read-aloud text: word + definition + first example sentence
  const readText = [
    word.word,
    word.definition ? `Definition: ${word.definition}` : '',
    word.exampleSentence?.split('\n\n')[0]
      ? `Example: ${word.exampleSentence.split('\n\n')[0]}`
      : '',
  ].filter(Boolean).join('. ');

  // Close on Escape, stop speech
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') { stop(); onClose(); } };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, stop]);

  // Prevent body scroll while open; cancel speech on unmount
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    reviewService.getHistory(word.id).then(setHistory).catch(() => setHistory([]));
  }, [word.id]);

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
            <h2 className="mv-display mt-1 text-3xl text-[var(--mv-ink)] break-words leading-tight">
              {word.word}
            </h2>
            {(word.pronunciation || word.partOfSpeech) && <p className="mt-1 text-sm italic text-[var(--mv-ink-soft)]">{word.pronunciation}{word.pronunciation && word.partOfSpeech ? ' · ' : ''}{word.partOfSpeech}</p>}
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

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {speechSupported && (
              <>
                {!speaking ? (
                  <button
                    onClick={() => speak(readText)}
                    title="Read aloud"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg
                               text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700
                               hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                  >
                    <SpeakerWaveIcon className="h-4 w-4" />
                    Read
                  </button>
                ) : (
                  <>
                    <button
                      onClick={paused ? resume : pause}
                      title={paused ? 'Resume' : 'Pause'}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                                 text-white bg-primary-600 hover:bg-primary-700
                                 shadow-sm shadow-primary-200 dark:shadow-primary-900/40
                                 active:scale-95 transition-all"
                    >
                      {paused
                        ? <SpeakerWaveIcon className="h-4 w-4" />
                        : <PauseIcon className="h-4 w-4" />}
                      {paused ? 'Resume' : 'Pause'}
                    </button>
                    <button
                      onClick={stop}
                      title="Stop"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg
                                 text-white bg-red-500 hover:bg-red-600
                                 shadow-sm shadow-red-200 dark:shadow-red-900/40
                                 active:scale-95 transition-all"
                    >
                      <StopIcon className="h-4 w-4" />
                      Stop
                    </button>
                  </>
                )}
              </>
            )}
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
              <p className="text-[var(--mv-ink)] leading-relaxed text-sm whitespace-pre-wrap">
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

          {word.mnemonic && <section className="rounded-[var(--mv-radius-md)] border border-[var(--mv-gold)]/30 bg-amber-50 p-4 dark:bg-amber-900/20"><h3 className="mv-eyebrow mb-2">Memory hook</h3><p className="text-sm leading-relaxed text-[var(--mv-ink)]">{word.mnemonic}</p></section>}

          {word.usageNote && <section><h3 className="mv-eyebrow mb-2">Usage note</h3><p className="text-sm leading-relaxed text-[var(--mv-ink-soft)]">{word.usageNote}</p></section>}

          {/* Notes */}
          {word.notes && (
            <section>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Notes
              </h3>
              <p className="text-sm text-[var(--mv-ink-soft)] bg-[var(--mv-paper-deep)] border border-[var(--mv-line)] rounded-xl px-4 py-3 leading-relaxed whitespace-pre-wrap">
                {cleanNotes(word.notes)}
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
                label="Memory strength"
                value={word.mastered ? 'Mastered' : `${Math.round(Number(word.easeFactor || 2.5) * 40)}%`}
              />
              <StatPill
                icon={<BoltIcon className="h-4 w-4" />}
                label="Times recalled"
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

          {history.length > 0 && <section><h3 className="mv-eyebrow mb-3">Review history</h3><div className="space-y-2">{history.slice(0, 8).map((review) => <div key={review.reviewId} className="flex items-center justify-between border-l-2 border-[var(--mv-moss)] pl-3 text-xs"><span className="text-[var(--mv-ink-soft)]">{review.reviewDate}</span><span className={review.quality >= 3 ? 'font-bold text-[var(--mv-moss)]' : 'font-bold text-[var(--mv-terracotta)]'}>{review.quality >= 3 ? 'Recalled' : 'Needs another pass'}</span></div>)}</div></section>}

          <Link to={`/practice?wordId=${word.id}`} onClick={onClose} className="flex min-h-11 items-center justify-center rounded-[var(--mv-radius-sm)] bg-[var(--mv-moss)] px-4 text-sm font-bold text-white hover:bg-[var(--mv-moss-dark)]">Practice this word</Link>

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
