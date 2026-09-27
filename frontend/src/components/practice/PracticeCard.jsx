import React, { useEffect, useRef, useState } from 'react';
import { BookOpenIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon, SparklesIcon, XCircleIcon } from '@heroicons/react/24/outline';
import Button from '../common/Button';

const GRADE_META = {
  1: { label: 'Again', className: 'bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300' },
  3: { label: 'Good', className: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300' },
  5: { label: 'Easy', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
};

const formatLabel = {
  RECALL: 'Recall',
  MULTIPLE_CHOICE: 'Multiple choice',
  FILL_BLANK_WORD: 'Type the word',
  FILL_BLANK_SENTENCE: 'Complete the sentence',
};

function secondsSince(timestamp) {
  return Math.max(0, Math.round((Date.now() - timestamp) / 1000));
}

export default function PracticeCard({ item, index, total, onSubmitGrade, onNext }) {
  const [revealed, setRevealed] = useState(false);
  const [selected, setSelected] = useState('');
  const [typed, setTyped] = useState('');
  const [graded, setGraded] = useState(null);
  const [gradeError, setGradeError] = useState('');
  const shownAt = useRef(Date.now());
  const inputRef = useRef(null);
  const { word, type } = item;
  const hasPromptAnswer = type !== 'RECALL';

  useEffect(() => {
    shownAt.current = Date.now();
    if ((type === 'FILL_BLANK_WORD' || type === 'FILL_BLANK_SENTENCE') && inputRef.current) inputRef.current.focus();
  }, [word.id, type]);

  useEffect(() => {
    const onKeyDown = (event) => {
      if (graded || event.repeat) return;
      if (type === 'RECALL' && !revealed && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault();
        setRevealed(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [graded, revealed, type]);

  const submitGrade = async (quality, correct, answer = '') => {
    if (graded) return;
    setGradeError('');
    try {
      const review = await onSubmitGrade({
        wordId: word.id,
        quality,
        correct,
        format: type,
        timeTakenSeconds: secondsSince(shownAt.current),
      });
      setGraded({ quality, correct, answer, review });
    } catch {
      setGradeError('Could not save this practice result. Please try again.');
    }
  };

  const checkAnswer = (event) => {
    event.preventDefault();
    const answer = type === 'MULTIPLE_CHOICE' ? selected : typed.trim();
    if (!answer) return;
    const correct = answer.trim().toLowerCase().replace(/\s+/g, ' ') === item.correctAnswer.trim().toLowerCase().replace(/\s+/g, ' ');
    const elapsed = secondsSince(shownAt.current);
    // Recognition is a Good; fast successful recall by typing earns Easy.
    const quality = !correct ? 1 : type === 'FILL_BLANK_WORD' && elapsed <= 5 ? 5 : 3;
    submitGrade(quality, correct, answer);
  };

  const sentenceParts = item.sentence?.split('____') || [];
  const gradeMeta = graded ? GRADE_META[graded.quality] : null;

  return (
    <section aria-labelledby="practice-card-word" className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-700 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
            {type === 'RECALL' ? <BookOpenIcon className="h-4 w-4" /> : <SparklesIcon className="h-4 w-4" />}
          </span>
          <span className="truncate text-xs font-bold text-gray-600 dark:text-gray-300">{formatLabel[type]}</span>
          {word.categoryName && <span className="hidden truncate rounded-full bg-gray-100 px-2 py-1 text-[10px] font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300 sm:inline-block">{word.categoryName}</span>}
        </div>
        <div className="flex flex-shrink-0 items-center gap-1.5 text-xs font-medium tabular-nums text-gray-500 dark:text-gray-400">
          <ClockIcon className="h-4 w-4" />{index + 1} / {total}
        </div>
      </div>

      <div className="p-5 sm:p-8">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-primary-600 dark:text-primary-400">
          {type === 'MULTIPLE_CHOICE' ? 'Choose the meaning' : type === 'FILL_BLANK_WORD' ? 'Recall the word' : type === 'FILL_BLANK_SENTENCE' ? 'Use it in context' : revealed ? 'Check your recall' : 'Recall the meaning'}
        </p>
        <h2 id="practice-card-word" className="mt-3 break-words text-center text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
          {type === 'FILL_BLANK_WORD' ? 'Which word fits?' : word.word}
        </h2>

        {type === 'MULTIPLE_CHOICE' && (
          <div className="mt-6 grid gap-2.5">
            {item.options.map((option, optionIndex) => {
              const isSelected = selected === option;
              const isCorrectOption = graded && option === item.correctAnswer;
              const isWrongSelection = graded && isSelected && !graded.correct;
              return (
                <button
                  key={`${optionIndex}-${option}`}
                  type="button"
                  disabled={Boolean(graded)}
                  onClick={() => setSelected(option)}
                  className={`flex min-h-12 w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${isCorrectOption ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-200' : isWrongSelection ? 'border-rose-300 bg-rose-50 text-rose-900 dark:border-rose-800 dark:bg-rose-900/25 dark:text-rose-200' : isSelected ? 'border-primary-400 bg-primary-50 text-primary-900 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-100' : 'border-gray-200 bg-white text-gray-700 hover:border-primary-300 hover:bg-primary-50/50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'}`}
                >
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-gray-100 text-[11px] font-bold text-gray-500 dark:bg-gray-700 dark:text-gray-300">{String.fromCharCode(65 + optionIndex)}</span>
                  <span className="flex-1">{option}</span>
                  {isCorrectOption && <CheckCircleIcon className="h-5 w-5 flex-shrink-0 text-emerald-600" />}
                  {isWrongSelection && <XCircleIcon className="h-5 w-5 flex-shrink-0 text-rose-600" />}
                </button>
              );
            })}
            {!graded && <Button onClick={checkAnswer} disabled={!selected} className="mt-2 min-h-11 w-full">Check answer</Button>}
          </div>
        )}

        {type === 'FILL_BLANK_WORD' && (
          <form onSubmit={checkAnswer} className="mt-6 space-y-4">
            <p className="rounded-xl bg-gray-50 p-4 text-sm leading-relaxed text-gray-700 dark:bg-gray-900/50 dark:text-gray-200">{item.prompt}</p>
            <input ref={inputRef} value={typed} onChange={(event) => setTyped(event.target.value)} disabled={Boolean(graded)} autoComplete="off" placeholder="Type the word…" aria-label="Your answer" className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 disabled:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-900/40 dark:disabled:bg-gray-900" />
            {!graded && <Button type="submit" disabled={!typed.trim()} className="min-h-11 w-full">Check answer</Button>}
          </form>
        )}

        {type === 'FILL_BLANK_SENTENCE' && (
          <form onSubmit={checkAnswer} className="mt-6 space-y-4">
            <p className="rounded-xl bg-gray-50 p-4 text-base leading-relaxed text-gray-700 dark:bg-gray-900/50 dark:text-gray-200">
              {sentenceParts.map((part, partIndex) => <React.Fragment key={partIndex}>{part}{partIndex < sentenceParts.length - 1 && <span className="mx-1 inline-block min-w-16 border-b-2 border-primary-400 text-center text-primary-700 dark:text-primary-300">{graded?.correct ? item.correctAnswer : '____'}</span>}</React.Fragment>)}
            </p>
            {!graded && <>
              <input ref={inputRef} value={typed} onChange={(event) => setTyped(event.target.value)} disabled={Boolean(graded)} autoComplete="off" placeholder="Type the missing word…" aria-label="Missing word" className="min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-primary-400 focus:ring-2 focus:ring-primary-100 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:ring-primary-900/40" />
              <Button type="submit" disabled={!typed.trim()} className="min-h-11 w-full">Check answer</Button>
            </>}
          </form>
        )}

        {type === 'RECALL' && (
          <div className="mt-6">
            {!revealed ? (
              <button type="button" onClick={() => setRevealed(true)} className="min-h-32 w-full rounded-2xl border-2 border-dashed border-primary-200 bg-primary-50/50 p-6 text-center text-sm font-semibold text-primary-700 transition-colors hover:border-primary-400 hover:bg-primary-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:border-primary-800 dark:bg-primary-900/10 dark:text-primary-300">
                Reveal meaning <span className="mt-1 block text-xs font-normal text-gray-500 dark:text-gray-400">Press Space or tap to reveal</span>
              </button>
            ) : (
              <div className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5 dark:border-primary-900 dark:bg-primary-900/15">
                <p className="text-xs font-bold uppercase tracking-wider text-primary-700 dark:text-primary-300">Meaning</p>
                <p className="mt-2 text-sm leading-relaxed text-gray-800 dark:text-gray-200">{word.definition || 'No definition saved yet.'}</p>
                {word.exampleSentence && <p className="mt-4 border-l-2 border-primary-300 pl-3 text-xs italic leading-relaxed text-gray-600 dark:text-gray-400">{word.exampleSentence.split('\n\n')[0]}</p>}
              </div>
            )}
            {revealed && !graded && <GradeChoices onChoose={(quality) => submitGrade(quality, quality >= 3, '')} />}
          </div>
        )}

        {graded && (
          <div role="status" className={`mt-5 flex items-start gap-3 rounded-xl border p-4 ${graded.correct ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-900/20' : 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-900/20'}`}>
            {graded.correct ? <CheckCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-600" /> : <XCircleIcon className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-600" />}
            <div className="min-w-0">
              <p className={`text-sm font-bold ${graded.correct ? 'text-emerald-800 dark:text-emerald-300' : 'text-rose-800 dark:text-rose-300'}`}>{graded.correct ? 'Correct' : 'Not quite'} · graded {GRADE_META[graded.quality].label}</p>
              {!graded.correct && <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Answer: <strong>{item.correctAnswer}</strong></p>}
              {graded.review?.nextReviewDate && <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">Next review {graded.review.nextReviewDate}</p>}
            </div>
          </div>
        )}

        {gradeError && <p role="alert" className="mt-3 text-sm font-medium text-rose-600 dark:text-rose-400">{gradeError}</p>}
        {graded && <Button onClick={onNext} className="mt-5 min-h-11 w-full">{index + 1 === total ? 'Finish practice' : 'Next card'} <span aria-hidden="true">→</span></Button>}
      </div>
    </section>
  );
}

function GradeChoices({ onChoose }) {
  return (
    <div className="mt-4 grid grid-cols-3 gap-2">
      {[
        { quality: 1, label: 'Again', hint: 'Forgot', style: 'border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900 dark:bg-rose-900/20 dark:text-rose-300' },
        { quality: 3, label: 'Good', hint: 'Recalled', style: 'border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300' },
        { quality: 5, label: 'Easy', hint: 'Instant', style: 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-900/20 dark:text-emerald-300' },
      ].map(({ quality, label, hint, style }) => (
        <button key={quality} type="button" onClick={() => onChoose(quality)} className={`min-h-16 rounded-xl border px-2 py-2 text-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${style}`}>
          <span className="block text-sm font-bold">{label}</span>
          <span className="mt-0.5 block text-[10px] opacity-75">{hint}</span>
        </button>
      ))}
    </div>
  );
}
