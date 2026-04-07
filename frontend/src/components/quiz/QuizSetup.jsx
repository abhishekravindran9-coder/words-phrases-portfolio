import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import {
  AcademicCapIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
  FireIcon, TrophyIcon, ChartBarIcon,
} from '@heroicons/react/24/outline';

const LENGTHS = [
  { n: 5,  sub: '~2 min' },
  { n: 10, sub: '~4 min' },
  { n: 20, sub: '~8 min' },
];

const TYPE_LABELS = {
  MULTIPLE_CHOICE:    '🔤 Multiple Choice',
  FILL_BLANK_WORD:    '✏️ Type the Word',
  FILL_BLANK_SENTENCE:'📝 Fill in the Blank',
};

function ScoreBar({ label, value, color = 'bg-primary-500' }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 w-36 flex-shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-9 text-right">{Math.round(value)}%</span>
    </div>
  );
}

export default function QuizSetup({ wordCount, wordsWithDefinitions, onStart, quizStats }) {
  const [selected, setSelected] = useState(10);

  const canQuiz   = wordsWithDefinitions >= 4;
  const maxLength = Math.min(20, wordsWithDefinitions);

  return (
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">

      {/* Hero */}
      <div className="text-center pt-4">
        <p className="text-6xl mb-3">🎯</p>
        <h1 className="text-2xl font-extrabold text-gray-900">Quick Quiz</h1>
        <p className="text-gray-500 text-sm mt-1">
          Test yourself across all your vocabulary
        </p>
      </div>

      {!canQuiz ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center">
          <p className="text-amber-800 font-semibold mb-1">Not enough words yet</p>
          <p className="text-amber-600 text-sm mb-4">
            You need at least 4 words with definitions to start a quiz.
            You currently have <strong>{wordsWithDefinitions}</strong> quiz-ready words.
          </p>
          <Link to="/words"><Button size="sm">Add More Words</Button></Link>
        </div>
      ) : (
        <>
          {/* Stats row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="p-2 bg-primary-50 rounded-lg">
                <BookOpenIcon className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Total entries</p>
                <p className="text-xl font-bold text-gray-900">{wordCount}</p>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <ClipboardDocumentCheckIcon className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Quiz-ready</p>
                <p className="text-xl font-bold text-gray-900">{wordsWithDefinitions}</p>
              </div>
            </div>
          </div>

          {/* Question types */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Mixed question types</h3>
            <ul className="space-y-2.5 text-sm text-gray-500">
              <li className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">🔤</span>
                <span>
                  <strong className="text-gray-700">Multiple choice</strong> — see the word, pick
                  the right definition from 4 options
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">✏️</span>
                <span>
                  <strong className="text-gray-700">Type the word</strong> — see the definition,
                  type which word it describes
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-base leading-none mt-0.5">📝</span>
                <span>
                  <strong className="text-gray-700">Fill in the blank</strong> — complete the
                  example sentence with the missing word
                </span>
              </li>
            </ul>
          </div>

          {/* Length selector */}
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-3">How many questions?</p>
            <div className="grid grid-cols-3 gap-3">
              {LENGTHS.map(({ n, sub }) => {
                const disabled = n > maxLength;
                const active   = selected === n && !disabled;
                return (
                  <button
                    key={n}
                    onClick={() => !disabled && setSelected(n)}
                    disabled={disabled}
                    className={`rounded-xl border-2 p-4 text-center transition-all
                      ${active
                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-300 ring-offset-1'
                        : disabled
                        ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                        : 'border-gray-200 bg-white hover:border-primary-300 cursor-pointer'}`}
                  >
                    <p className={`text-2xl font-extrabold ${active ? 'text-primary-700' : 'text-gray-700'}`}>
                      {n}
                    </p>
                    <p className={`text-xs mt-0.5 font-medium ${active ? 'text-primary-500' : 'text-gray-400'}`}>
                      {sub}
                    </p>
                    {disabled && (
                      <p className="text-[10px] text-gray-400 mt-1">need more words</p>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <Button className="w-full" size="lg" onClick={() => onStart(selected)}>
            <AcademicCapIcon className="h-5 w-5" />
            Start {selected}-question Quiz
          </Button>

          {/* ── Lifetime stats ── */}
          {quizStats && quizStats.totalQuizzesTaken > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <ChartBarIcon className="h-4 w-4 text-primary-500" />
                Your Quiz Stats
              </h3>

              {/* Top numbers */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-primary-600">{quizStats.totalQuizzesTaken}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Total quizzes</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-emerald-600">{quizStats.averageScore}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">Average score</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-yellow-500">{quizStats.bestScore}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">Best score</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-2xl font-extrabold text-orange-500">{quizStats.overallAccuracy}%</p>
                  <p className="text-xs text-gray-400 mt-0.5">Overall accuracy</p>
                </div>
              </div>

              {/* Streak */}
              {quizStats.currentPassingStreak > 0 && (
                <div className="flex items-center gap-2 bg-orange-50 rounded-xl px-3 py-2">
                  <FireIcon className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-semibold text-orange-700">
                    {quizStats.currentPassingStreak}-day passing streak
                  </span>
                  {quizStats.currentPassingStreak === quizStats.longestPassingStreak && (
                    <span className="ml-auto text-xs text-orange-500">🏅 Personal best</span>
                  )}
                </div>
              )}

              {/* Accuracy by type */}
              {quizStats.accuracyByType && Object.keys(quizStats.accuracyByType).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Accuracy by type
                  </p>
                  <div className="space-y-2">
                    {Object.entries(quizStats.accuracyByType).map(([type, stat]) => (
                      <ScoreBar
                        key={type}
                        label={TYPE_LABELS[type] || type}
                        value={stat.accuracy}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Most missed */}
              {quizStats.mostMissedWords && quizStats.mostMissedWords.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Words to focus on
                  </p>
                  <div className="space-y-1.5">
                    {quizStats.mostMissedWords.slice(0, 5).map((w) => (
                      <div key={w.wordId} className="flex items-center justify-between text-sm">
                        <span className="font-medium text-gray-700">{w.word}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-red-500">
                            {w.wrongCount} miss{w.wrongCount !== 1 ? 'es' : ''}
                          </span>
                          <span className="text-xs text-gray-400">
                            {Math.round(w.accuracy)}% acc
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent sessions */}
              {quizStats.recentSessions && quizStats.recentSessions.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                    Recent sessions
                  </p>
                  <div className="flex gap-1.5 flex-wrap">
                    {quizStats.recentSessions.slice(0, 8).reverse().map((s) => {
                      const bg = s.scorePercent >= 90 ? 'bg-emerald-500'
                               : s.scorePercent >= 60 ? 'bg-primary-500'
                               : 'bg-red-400';
                      return (
                        <div
                          key={s.sessionId}
                          title={`${Math.round(s.scorePercent)}% · ${s.correctCount}/${s.questionCount}`}
                          className={`${bg} text-white text-xs font-bold rounded-lg px-2.5 py-1`}
                        >
                          {Math.round(s.scorePercent)}%
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
