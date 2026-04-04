import React from 'react';

/**
 * Highlights a random word from the user's collection as the "word of the day".
 */
export default function DailyHighlight({ word }) {
  if (!word) return null;

  return (
    <div className="bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-lg">
      <p className="text-xs uppercase tracking-wider font-semibold opacity-80 mb-3">✨ Word of the Day</p>
      <p className="text-3xl font-bold mb-2">{word.word}</p>
      {word.definition && (
        <p className="text-primary-100 text-sm leading-relaxed mb-3">{word.definition}</p>
      )}
      {word.exampleSentence && (
        <p className="text-primary-200 text-xs italic border-l-2 border-primary-400 pl-3">
          "{word.exampleSentence}"
        </p>
      )}
      {word.categoryName && (
        <span className="mt-4 inline-block bg-white/20 text-white text-xs px-2 py-0.5 rounded-full">
          {word.categoryName}
        </span>
      )}
    </div>
  );
}
