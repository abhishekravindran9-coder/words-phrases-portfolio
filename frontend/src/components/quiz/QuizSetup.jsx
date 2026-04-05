import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Button from '../common/Button';
import {
  AcademicCapIcon, BookOpenIcon, ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';

const LENGTHS = [
  { n: 5,  sub: '~2 min' },
  { n: 10, sub: '~4 min' },
  { n: 20, sub: '~8 min' },
];

export default function QuizSetup({ wordCount, wordsWithDefinitions, onStart }) {
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
        </>
      )}
    </div>
  );
}
