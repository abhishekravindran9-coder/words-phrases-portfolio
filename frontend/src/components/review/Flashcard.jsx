import React, { useState, useEffect, useCallback, useRef } from 'react';

const GRADE_BUTTONS = [
  {
    quality: 1,
    label: 'Again',
    emoji: '❌',
    key: '1',
    hint: 'Forgot it',
    light: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100 active:scale-95',
    dark: 'dark:bg-red-900/20 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/40',
  },
  {
    quality: 3,
    label: 'Good',
    emoji: '😐',
    key: '2',
    hint: 'Took effort',
    light: 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 active:scale-95',
    dark: 'dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-900/40',
  },
  {
    quality: 5,
    label: 'Easy',
    emoji: '✅',
    key: '3',
    hint: 'Got it fast',
    light: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100 active:scale-95',
    dark: 'dark:bg-green-900/20 dark:border-green-800 dark:text-green-400 dark:hover:bg-green-900/40',
  },
];

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Flashcard component — front shows the word, back reveals definition.
 * Grading uses 3 intuitive buttons (Again / Good / Easy) with keyboard shortcuts.
 */
export default function Flashcard({ word, onGrade, loading }) {
  const [revealed, setReveal] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(Date.now());

  // Reset timer when a new card mounts
  useEffect(() => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setReveal(false);
  }, [word.id]);

  // Tick every second
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleGrade = useCallback(
    (quality) => {
      if (loading) return;
      const taken = Math.round((Date.now() - startTimeRef.current) / 1000);
      onGrade({ wordId: word.id, quality, timeTakenSeconds: taken });
    },
    [loading, onGrade, word.id],
  );

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.repeat || loading) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!revealed) setReveal(true);
      } else if (revealed) {
        if (e.key === '1') handleGrade(1);
        else if (e.key === '2') handleGrade(3);
        else if (e.key === '3') handleGrade(5);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [revealed, handleGrade, loading]);

  const isPhrase = word.entryType === 'PHRASE';
  const sentences = (word.exampleSentence || '').split('\n\n').filter(Boolean);

  return (
    <div className="flex flex-col gap-5">
      {/* ── Card ─────────────────────────────────────────── */}
      <div
        className="w-full cursor-pointer select-none"
        role="button"
        tabIndex={0}
        aria-label={revealed ? 'Card revealed' : 'Click to reveal answer'}
        onClick={() => !revealed && !loading && setReveal(true)}
        onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !revealed) { e.preventDefault(); setReveal(true); } }}
      >
        {/* FRONT */}
        {!revealed && (
          <div className="relative min-h-[300px] rounded-2xl shadow-xl overflow-hidden
                          bg-gradient-to-br from-primary-600 to-primary-800 text-white
                          hover:shadow-2xl transition-shadow duration-300 animate-fade-in">
            {/* Timer pill */}
            <div className="absolute top-4 right-4 text-xs font-mono bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg opacity-70">
              ⏱ {formatTime(elapsed)}
            </div>

            {/* Repetitions badge */}
            {word.repetitions > 0 && (
              <div className="absolute top-4 left-4 text-xs bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg opacity-60">
                #{word.repetitions}
              </div>
            )}

            <div className="absolute inset-0 flex flex-col items-center justify-center px-8 py-12">
              <p className="text-xs uppercase tracking-[0.2em] opacity-60 mb-5">Recall the meaning</p>

              <p className="text-4xl font-extrabold text-center leading-tight break-words max-w-full">
                {word.word}
              </p>

              {isPhrase && (
                <span className="mt-3 bg-white/15 text-xs px-2.5 py-1 rounded-full font-semibold">
                  💬 Phrase
                </span>
              )}

              {word.categoryName && (
                <span className="mt-2 bg-white/10 text-sm px-3 py-1 rounded-full opacity-80">
                  {word.categoryName}
                </span>
              )}

              <div className="mt-10 flex items-center gap-1.5 text-xs opacity-40">
                <kbd className="px-1.5 py-0.5 bg-white/10 rounded font-mono">Space</kbd>
                <span>or tap to reveal</span>
              </div>
            </div>
          </div>
        )}

        {/* BACK */}
        {revealed && (
          <div className="min-h-[300px] rounded-2xl shadow-xl overflow-hidden
                          bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700
                          animate-fade-in">
            {/* Word header */}
            <div className="px-6 pt-5 pb-4 border-b border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-wrap">
                {isPhrase && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded
                                   bg-purple-100 dark:bg-purple-900/30
                                   text-purple-700 dark:text-purple-400
                                   uppercase tracking-wide">
                    💬 Phrase
                  </span>
                )}
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 break-words">
                  {word.word}
                </h2>
              </div>
              {word.categoryName && (
                <span
                  className="mt-1.5 inline-block text-xs px-2.5 py-0.5 rounded-full font-semibold"
                  style={{
                    backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
                    color: word.categoryColor || '#4f46e5',
                  }}
                >
                  {word.categoryName}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-4">
              {word.definition ? (
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {word.definition}
                </p>
              ) : (
                <p className="text-gray-400 dark:text-gray-500 italic text-sm">No definition added.</p>
              )}

              {sentences.length > 0 && (
                <ul className="space-y-2">
                  {sentences.map((s, i) => (
                    <li
                      key={i}
                      className="text-sm text-gray-500 dark:text-gray-400 italic
                                 border-l-4 border-primary-200 dark:border-primary-700 pl-3"
                    >
                      "{s}"
                    </li>
                  ))}
                </ul>
              )}

              {word.notes && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide mb-1">
                    Note
                  </p>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    {word.notes}
                  </p>
                </div>
              )}

              {word.imageUrl && (
                <img
                  src={word.imageUrl}
                  alt={word.word}
                  className="rounded-xl max-h-36 object-cover w-full"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}

              {/* SM-2 meta strip */}
              <div className="flex items-center gap-2 pt-2 border-t border-gray-100 dark:border-gray-700
                              text-[11px] text-gray-400 dark:text-gray-500 flex-wrap">
                <span>Rep #{word.repetitions}</span>
                <span className="opacity-40">·</span>
                <span>Ease {Number(word.easeFactor).toFixed(1)}</span>
                <span className="opacity-40">·</span>
                <span>Last interval: {word.intervalDays}d</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Grade buttons ─────────────────────────────────── */}
      {revealed && (
        <div className="animate-slide-up space-y-3">
          <p className="text-xs text-center text-gray-400 dark:text-gray-500 font-medium">
            How well did you recall?{' '}
            <span className="opacity-50 font-mono">1 · 2 · 3</span>
          </p>
          <div className="grid grid-cols-3 gap-3">
            {GRADE_BUTTONS.map(({ quality, label, emoji, key, hint, light, dark }) => (
              <button
                key={quality}
                onClick={() => handleGrade(quality)}
                disabled={loading}
                className={`relative py-4 px-2 rounded-2xl text-sm font-bold border-2 transition-all
                            disabled:opacity-40 ${light} ${dark}`}
              >
                <span className="block text-xl mb-1">{emoji}</span>
                <span className="block font-bold">{label}</span>
                <span className="block text-[10px] opacity-60 font-normal mt-0.5">{hint}</span>
                <span className="absolute bottom-2 right-2.5 text-[10px] opacity-30 font-mono">
                  {key}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Prompt ────────────────────────────────────────── */}
      {!revealed && !loading && (
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Click the card or press{' '}
          <kbd className="inline-block px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700
                          rounded text-gray-500 dark:text-gray-400 font-mono text-[10px] mx-0.5">
            Space
          </kbd>{' '}
          to reveal the answer
        </p>
      )}
    </div>
  );
}
