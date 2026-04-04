import React, { useState, useEffect, useCallback } from 'react';
import { wordService } from '../services/wordService';
import QuizSetup     from '../components/quiz/QuizSetup';
import QuizQuestion  from '../components/quiz/QuizQuestion';
import QuizResults   from '../components/quiz/QuizResults';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ReviewProgress from '../components/review/ReviewProgress';

// ── Helpers ────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a single question object for the given word.
 * Returns null if the word doesn't have enough data for any question type.
 */
function buildQuestion(word, allWords) {
  const available = [];

  if (word.definition && word.definition.trim()) {
    available.push('MULTIPLE_CHOICE');
    available.push('FILL_BLANK_WORD');
  }

  if (word.exampleSentence) {
    const sentences = word.exampleSentence.split('\n\n').filter(Boolean);
    const hasSentence = sentences.some((s) =>
      s.toLowerCase().includes(word.word.toLowerCase())
    );
    if (hasSentence) available.push('FILL_BLANK_SENTENCE');
  }

  if (available.length === 0) return null;

  const type = available[Math.floor(Math.random() * available.length)];

  if (type === 'MULTIPLE_CHOICE') {
    const pool = allWords.filter(
      (w) =>
        w.id !== word.id &&
        w.definition &&
        w.definition.trim() &&
        w.definition !== word.definition
    );
    if (pool.length < 3) return null;
    const distractors = shuffle(pool).slice(0, 3).map((w) => w.definition);
    const options = shuffle([word.definition, ...distractors]);
    return { type, word, options, correctAnswer: word.definition };
  }

  if (type === 'FILL_BLANK_WORD') {
    return { type, word, prompt: word.definition, correctAnswer: word.word };
  }

  if (type === 'FILL_BLANK_SENTENCE') {
    const sentences = word.exampleSentence.split('\n\n').filter(Boolean);
    const sentence  = sentences.find((s) =>
      s.toLowerCase().includes(word.word.toLowerCase())
    );
    // Escape special regex chars in the word before blanking
    const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const blanked  = sentence.replace(new RegExp(escaped, 'gi'), '____');
    return { type, word, sentence: blanked, correctAnswer: word.word };
  }
}

/**
 * Build a randomised quiz of up to `length` questions from the word pool.
 */
function buildQuiz(allWords, length) {
  const pool      = shuffle(allWords.filter((w) => w.definition && w.definition.trim()));
  const questions = [];

  for (const word of pool) {
    if (questions.length >= length) break;
    const q = buildQuestion(word, allWords);
    if (q) questions.push(q);
  }

  return questions;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function QuizPage() {
  const [loadingWords,  setLoadingWords]  = useState(true);
  const [allWords,      setAllWords]      = useState([]);
  const [phase,         setPhase]         = useState('setup');   // 'setup' | 'quiz' | 'results'
  const [questions,     setQuestions]     = useState([]);
  const [currentIndex,  setCurrentIndex]  = useState(0);
  const [answers,       setAnswers]       = useState([]);
  const [quizLength,    setQuizLength]    = useState(10);
  const [startTime,     setStartTime]     = useState(null);
  const [elapsed,       setElapsed]       = useState(0);

  // Fetch word pool once on mount
  useEffect(() => {
    wordService
      .getWords({ size: 200 })
      .then((data) => setAllWords(data.content || []))
      .finally(() => setLoadingWords(false));
  }, []);

  // Tick the timer while a quiz is active
  useEffect(() => {
    if (phase !== 'quiz') return;
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [phase, startTime]);

  const startQuiz = useCallback(
    (length) => {
      const qs = buildQuiz(allWords, length);
      setQuestions(qs);
      setCurrentIndex(0);
      setAnswers([]);
      setQuizLength(length);
      setStartTime(Date.now());
      setElapsed(0);
      setPhase('quiz');
    },
    [allWords]
  );

  const handleAnswer = (isCorrect, userAnswer) => {
    setAnswers((prev) => [...prev, { isCorrect, userAnswer }]);
  };

  const handleNext = () => {
    if (currentIndex + 1 >= questions.length) {
      setPhase('results');
    } else {
      setCurrentIndex((i) => i + 1);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────────────

  if (loadingWords) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // ── Setup screen ─────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <QuizSetup
        wordCount={allWords.length}
        wordsWithDefinitions={allWords.filter((w) => w.definition && w.definition.trim()).length}
        onStart={startQuiz}
      />
    );
  }

  // ── Results screen ───────────────────────────────────────────────────────

  if (phase === 'results') {
    return (
      <QuizResults
        questions={questions}
        answers={answers}
        elapsed={elapsed}
        onRetry={() => startQuiz(quizLength)}
        onSetup={() => setPhase('setup')}
      />
    );
  }

  // ── Active quiz ──────────────────────────────────────────────────────────

  const mm  = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss  = String(elapsed % 60).padStart(2, '0');

  return (
    <div className="max-w-lg mx-auto space-y-4">

      {/* Header row */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">Quiz</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 font-mono tabular-nums">⏱ {mm}:{ss}</span>
          <span className="text-sm font-semibold text-gray-500">
            {currentIndex + 1} / {questions.length}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <ReviewProgress current={currentIndex} total={questions.length} />

      {/* Current question */}
      <QuizQuestion
        key={currentIndex}
        question={questions[currentIndex]}
        onAnswer={handleAnswer}
        onNext={handleNext}
        isLast={currentIndex + 1 >= questions.length}
      />
    </div>
  );
}
