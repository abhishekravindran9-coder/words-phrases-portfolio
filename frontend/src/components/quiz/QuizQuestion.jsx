import React, { useState, useRef, useEffect } from 'react';
import Button from '../common/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

/** Normalise for loose comparison: lowercase, trim, collapse internal spaces */
function normalise(s) {
  return (s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function QuizQuestion({ question, onAnswer, onNext, isLast }) {
  const [answered,  setAnswered]  = useState(false);
  const [selected,  setSelected]  = useState(null);   // MC: chosen option string
  const [typed,     setTyped]     = useState('');      // fill-in: typed answer
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus text input for fill-in questions
  useEffect(() => {
    if (question.type !== 'MULTIPLE_CHOICE' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [question.type]);

  const commit = (answer) => {
    if (answered) return;
    const correct = normalise(answer) === normalise(question.correctAnswer);
    setIsCorrect(correct);
    setAnswered(true);
    onAnswer(correct, answer);
  };

  const handleMC = (opt) => {
    if (answered) return;
    setSelected(opt);
    commit(opt);
  };

  const handleTypedSubmit = (e) => {
    e.preventDefault();
    if (!typed.trim()) return;
    commit(typed);
  };

  const { type, word, options, prompt, sentence, correctAnswer } = question;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Question card */}
      <div
        className={`rounded-2xl shadow-sm p-6 transition-colors duration-300
          ${answered
            ? isCorrect
              ? 'bg-emerald-50 border-2 border-emerald-300'
              : 'bg-red-50   border-2 border-red-300'
            : 'bg-white border border-gray-100'}`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
            {type === 'MULTIPLE_CHOICE' ? '🔤 Multiple Choice'
             : type === 'FILL_BLANK_WORD' ? '✏️ Type the Word'
             : '📝 Fill in the Blank'}
          </span>
          {answered && (
            <span className={`flex items-center gap-1 text-xs font-bold
              ${isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
              {isCorrect
                ? <><CheckCircleIcon className="h-4 w-4" /> Correct!</>
                : <><XCircleIcon    className="h-4 w-4" /> Incorrect</>}
            </span>
          )}
        </div>

        {/* ── Multiple choice prompt ── */}
        {type === 'MULTIPLE_CHOICE' && (
          <div className="text-center mb-6">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-3">
              What does this mean?
            </p>
            <p className="text-4xl font-extrabold text-gray-900 break-words">{word.word}</p>
            {word.categoryName && (
              <span
                className="mt-3 inline-block text-xs px-3 py-0.5 rounded-full font-semibold"
                style={{
                  backgroundColor: word.categoryColor ? `${word.categoryColor}20` : '#e0e7ff',
                  color: word.categoryColor || '#4f46e5',
                }}
              >
                {word.categoryName}
              </span>
            )}
          </div>
        )}

        {/* ── Type-the-word prompt ── */}
        {type === 'FILL_BLANK_WORD' && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Which word fits this definition?
            </p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4">
              {prompt}
            </p>
          </div>
        )}

        {/* ── Fill-in-the-blank sentence prompt ── */}
        {type === 'FILL_BLANK_SENTENCE' && (
          <div className="mb-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">
              Complete the sentence
            </p>
            <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded-xl p-4 italic">
              "{sentence}"
            </p>
          </div>
        )}

        {/* ── MC options ── */}
        {type === 'MULTIPLE_CHOICE' && (
          <div className="space-y-2">
            {options.map((opt, i) => {
              const isThis  = opt === selected;
              const isRight = opt === correctAnswer;
              let cls = 'w-full text-left px-4 py-3 rounded-xl border-2 text-sm transition-all ';
              if (!answered) {
                cls += 'border-gray-200 bg-white hover:border-primary-400 hover:bg-primary-50 cursor-pointer';
              } else if (isRight) {
                cls += 'border-emerald-400 bg-emerald-50 text-emerald-800 font-semibold';
              } else if (isThis) {
                cls += 'border-red-300 bg-red-50 text-red-700';
              } else {
                cls += 'border-gray-100 bg-white text-gray-400';
              }
              return (
                <button
                  key={i}
                  className={cls}
                  onClick={() => handleMC(opt)}
                  disabled={answered}
                >
                  <span className="mr-2 font-bold text-gray-400">
                    {String.fromCharCode(65 + i)}.
                  </span>
                  {opt}
                  {answered && isRight && (
                    <CheckCircleIcon className="inline h-4 w-4 ml-1.5 text-emerald-500" />
                  )}
                  {answered && isThis && !isRight && (
                    <XCircleIcon className="inline h-4 w-4 ml-1.5 text-red-400" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Fill-in input ── */}
        {(type === 'FILL_BLANK_WORD' || type === 'FILL_BLANK_SENTENCE') && (
          <form onSubmit={handleTypedSubmit} className="space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={answered}
              placeholder="Type your answer…"
              className={`w-full px-4 py-3 rounded-xl border-2 text-sm font-medium
                transition-all outline-none
                ${answered
                  ? isCorrect
                    ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
                    : 'border-red-300   bg-red-50   text-red-700'
                  : 'border-gray-200 focus:border-primary-400 focus:bg-primary-50/30'}`}
            />
            {!answered && (
              <Button type="submit" className="w-full" disabled={!typed.trim()}>
                Submit Answer
              </Button>
            )}
          </form>
        )}

        {/* Wrong answer reveal */}
        {answered && !isCorrect && (
          <div className="mt-4 p-3 bg-white rounded-xl border border-emerald-200">
            <p className="text-xs text-gray-400 font-medium mb-1">Correct answer</p>
            <p className="text-sm font-bold text-emerald-700">{correctAnswer}</p>
          </div>
        )}
      </div>

      {/* Proceed button — appears after answering */}
      {answered && (
        <Button className="w-full animate-slide-up" onClick={onNext}>
          {isLast ? 'See Results 🎉' : 'Next Question →'}
        </Button>
      )}
    </div>
  );
}
