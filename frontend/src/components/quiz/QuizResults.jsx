import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';
import { TrophyIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';

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

const TYPE_LABELS = {
  MULTIPLE_CHOICE:    '🔤 Multiple Choice',
  FILL_BLANK_WORD:    '✏️ Type the Word',
  FILL_BLANK_SENTENCE:'📝 Fill in the Blank',
};

export default function QuizResults({ questions, answers, elapsed, onRetry, onSetup, sessionSaved, quizStats }) {
  const correct = answers.filter((a) => a.isCorrect).length;
  const total   = questions.length;
  const pct     = total > 0 ? Math.round((correct / total) * 100) : 0;
  const g       = grade(pct);

  const wrongOnes = questions
    .map((q, i) => ({ q, a: answers[i] }))
    .filter(({ a }) => a && !a.isCorrect);

  // Compute per-type accuracy for this session
  const typeMap = {};
  questions.forEach((q, i) => {
    const type = q.type;
    if (!typeMap[type]) typeMap[type] = { correct: 0, total: 0 };
    typeMap[type].total++;
    if (answers[i]?.isCorrect) typeMap[type].correct++;
  });

  // Comparison with lifetime average
  const avgScore = quizStats?.averageScore;
  const vsAvg    = avgScore != null ? pct - Math.round(avgScore) : null;

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-fade-in">

      {/* ── Score hero card ── */}
      <div className={`rounded-2xl border-2 p-8 text-center ${g.bg}`}>
        <p className="text-5xl mb-3">{g.emoji}</p>
        <p className={`text-7xl font-extrabold leading-none ${g.color}`}>{g.letter}</p>
        <p className="text-3xl font-bold text-gray-900 mt-2">{pct}%</p>
        <p className="text-gray-500 mt-1 text-sm">{correct} of {total} correct</p>
        <p className="text-xs text-gray-400 mt-1">⏱ {fmtTime(elapsed)}</p>

        {/* Saved indicator */}
        {sessionSaved && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/70 rounded-full px-3 py-1 text-xs font-semibold text-emerald-700">
            <CheckBadgeIcon className="h-4 w-4" />
            Result saved
          </div>
        )}
      </div>

      {/* ── Comparison to average ── */}
      {vsAvg !== null && (
        <div className={`rounded-xl border px-4 py-3 flex items-center gap-3 text-sm
          ${vsAvg >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'}`}>
          <span className="text-lg">{vsAvg >= 0 ? '📈' : '📉'}</span>
          <div>
            <span className={`font-bold ${vsAvg >= 0 ? 'text-emerald-700' : 'text-orange-700'}`}>
              {vsAvg >= 0 ? `+${vsAvg}%` : `${vsAvg}%`} vs your average
            </span>
            <span className="text-gray-500 ml-2">
              (lifetime avg: {Math.round(avgScore)}%)
            </span>
          </div>
        </div>
      )}

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

      {/* ── This session by question type ── */}
      {Object.keys(typeMap).length > 1 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Accuracy by type
          </p>
          <div className="space-y-2">
            {Object.entries(typeMap).map(([type, stat]) => {
              const typePct = Math.round((stat.correct / stat.total) * 100);
              return (
                <div key={type} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-40 flex-shrink-0">
                    {TYPE_LABELS[type] || type}
                  </span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full bg-primary-500 transition-all"
                      style={{ width: `${typePct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{typePct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

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
