import React, { useState } from 'react';


const QUALITY_BUTTONS = [
  { q: 0, label: '😶 Blackout', color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' },
  { q: 1, label: '😕 Wrong',    color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' },
  { q: 2, label: '🤔 Hard miss',color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-yellow-200' },
  { q: 3, label: '✓ Hard',      color: 'bg-lime-100 text-lime-700 hover:bg-lime-200 border-lime-200' },
  { q: 4, label: '✓ Good',      color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' },
  { q: 5, label: '✓✓ Easy',    color: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200' },
];

/**
 * Animated flashcard component. Front shows the word; back reveals the definition.
 * After flipping, the user grades their recall (SM-2 quality 0–5).
 */
export default function Flashcard({ word, onGrade, loading }) {
  const [revealed, setReveal] = useState(false);
  const [startTime] = useState(() => Date.now());

  const handleGrade = (quality) => {
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    onGrade({ wordId: word.id, quality, timeTakenSeconds: elapsed });
    setReveal(false);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Card */}
      <div
        className="perspective w-full cursor-pointer"
        onClick={() => !revealed && setReveal(true)}
      >
        <div
          className={`
            relative min-h-[280px] rounded-2xl shadow-xl transition-all duration-500
            ${revealed
              ? 'bg-white border border-primary-200'
              : 'bg-gradient-to-br from-primary-600 to-primary-800 text-white hover:shadow-2xl'}
          `}
        >
          {/* Front */}
          {!revealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 animate-fade-in">
              <p className="text-xs uppercase tracking-widest opacity-70 mb-4">Recall the meaning</p>
              <p className="text-4xl font-bold text-center">{word.word}</p>
              {word.categoryName && (
                <span className="mt-4 bg-white/20 text-sm px-3 py-1 rounded-full">
                  {word.categoryName}
                </span>
              )}
              <p className="mt-8 text-xs opacity-60">Tap to reveal →</p>
            </div>
          )}

          {/* Back */}
          {revealed && (
            <div className="p-8 animate-flip-in">
              <div className="flex items-center gap-2 mb-2">
                {word.entryType === 'PHRASE' && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 uppercase tracking-wide">
                    💬 Phrase
                  </span>
                )}
                <p className="text-lg font-bold text-gray-900">{word.word}</p>
              </div>
              {word.categoryName && (
                <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mb-3"
                  style={{
                    backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
                    color: word.categoryColor || '#4f46e5',
                  }}>
                  {word.categoryName}
                </span>
              )}
              {word.definition && (
                <p className="text-gray-700 leading-relaxed">{word.definition}</p>
              )}
              {word.exampleSentence && (() => {
                const sentences = word.exampleSentence.split('\n\n').filter(Boolean);
                return (
                  <ul className="mt-4 space-y-2">
                    {sentences.map((s, i) => (
                      <li key={i} className="text-sm text-gray-500 italic border-l-4 border-primary-200 pl-3">
                        "{s}"
                      </li>
                    ))}
                  </ul>
                );
              })()}
              {word.imageUrl && (
                <img
                  src={word.imageUrl}
                  alt={word.word}
                  className="mt-4 rounded-lg max-h-40 object-cover w-full"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grade buttons – only shown after reveal */}
      {revealed && (
        <div className="animate-slide-up">
          <p className="text-sm text-center text-gray-500 mb-3 font-medium">How well did you recall it?</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {QUALITY_BUTTONS.map(({ q, label, color }) => (
              <button
                key={q}
                onClick={() => handleGrade(q)}
                disabled={loading}
                className={`
                  py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all
                  disabled:opacity-50 ${color}
                `}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Skip */}
      {!revealed && (
        <p className="text-center text-xs text-gray-400">
          Click the card when you're ready to see the answer
        </p>
      )}
    </div>
  );
}
