import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { TrophyIcon } from '@heroicons/react/24/outline';

function grade(pct) {
  if (pct >= 90) return { letter: 'A', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', emoji: '🏆' };
  if (pct >= 75) return { letter: 'B', color: 'text-green-600',   bg: 'bg-green-50   border-green-200',   emoji: '🎉' };
  if (pct >= 60) return { letter: 'C', color: 'text-yellow-600',  bg: 'bg-yellow-50  border-yellow-200',  emoji: '👍' };
  if (pct >= 40) return { letter: 'D', color: 'text-orange-600',  bg: 'bg-orange-50  border-orange-200',  emoji: '💪' };
  return              { letter: 'F', color: 'text-red-600',      bg: 'bg-red-50     border-red-200',      emoji: '📚' };
}

function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function QuizResults({ questions, answers, elapsed, onRetry, onSetup }) {
  const correct = answers.filter((a) => a.isCorrect).length;
  const total   = questions.length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const g       = grade(pct);

  const wrongOnes = questions
    .map((q, i) => ({ q, a: answers[i] }))
    .filter(({ a }) => a && !a.isCorrect);

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">

      {/* ── Score hero card ── */}
      <div className={`rounded-2xl border-2 p-8 text-center ${g.bg}`}>
        <p className="text-5xl mb-3">{g.emoji}</p>
        <p className={`text-7xl font-extrabold leading-none ${g.color}`}>{g.letter}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{pct}%</p>
        <p className="text-gray-500 mt-1 text-sm">{correct} of {total} correct</p>
        <p className="text-xs text-gray-400 mt-1">⏱ {fmtTime(elapsed)}</p>
      </div>

      {/* ── Mini stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-extrabold text-emerald-600">{correct}</p>
          <p className="text-xs text-gray-400 mt-0.5">Correct</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-2xl font-extrabold text-red-500">{total - correct}</p>
          <p className="text-xs text-gray-400 mt-0.5">Wrong</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-3 text-center">
          <p className="text-lg font-extrabold text-primary-600">{fmtTime(elapsed)}</p>
          <p className="text-xs text-gray-400 mt-0.5">Time</p>
        </div>
      </div>

      {/* ── Perfect score ── */}
      {wrongOnes.length === 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center">
          <TrophyIcon className="h-9 w-9 text-emerald-500 mx-auto mb-2" />
          <p className="font-bold text-emerald-800 text-lg">Perfect score! 🎉</p>
          <p className="text-sm text-emerald-600 mt-1">You got every single question right.</p>
        </div>
      )}

      {/* ── Mistakes review ── */}
      {wrongOnes.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <XCircleIcon className="h-5 w-5 text-red-400" />
            Review Mistakes ({wrongOnes.length})
          </h3>
          <div className="space-y-4">
            {wrongOnes.map(({ q, a }, i) => {
              const qNum = questions.indexOf(q) + 1;
              return (
                <div key={i} className="border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <span className="text-xs font-bold text-gray-300 flex-shrink-0 mt-0.5">
                      #{qNum}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900">{q.word.word}</p>

                      {/* Show the context depending on question type */}
                      {q.type === 'MULTIPLE_CHOICE' && (
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          Definition: {q.correctAnswer}
                        </p>
                      )}
                      {q.type === 'FILL_BLANK_WORD' && (
                        <p className="text-xs text-gray-400 mt-0.5 italic truncate">
                          "{q.prompt}"
                        </p>
                      )}
                      {q.type === 'FILL_BLANK_SENTENCE' && (
                        <p className="text-xs text-gray-400 mt-0.5 italic truncate">
                          "{q.sentence}"
                        </p>
                      )}

                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-0.5">
                        <span className="text-xs text-red-500">
                          Your answer:{' '}
                          <span className="font-semibold">{a.userAnswer || '(blank)'}</span>
                        </span>
                        <span className="text-xs text-emerald-600">
                          Correct:{' '}
                          <span className="font-semibold">{q.correctAnswer}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      <div className="flex gap-3">
        <Button className="flex-1" onClick={onRetry}>
          Try Again
        </Button>
        <Button className="flex-1" variant="secondary" onClick={onSetup}>
          Change Settings
        </Button>
      </div>
      <div className="text-center pb-4">
        <Link to="/dashboard" className="text-sm text-gray-400 hover:text-gray-600 underline">
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
