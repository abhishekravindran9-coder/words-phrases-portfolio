import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { practiceService } from '../services/practiceService';
import { quizService } from '../services/quizService';
import PracticeCard from '../components/practice/PracticeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import {
  ArrowPathIcon, ArrowRightIcon, BookOpenIcon, CheckBadgeIcon,
  CheckCircleIcon, ClipboardDocumentCheckIcon, ClockIcon, FireIcon, SparklesIcon,
  TrophyIcon,
} from '@heroicons/react/24/outline';

const SESSION_LENGTHS = [5, 10, 20];
const FORMAT_OPTIONS = [
  { value: 'MIXED', label: 'Mixed practice', description: 'Recall, choices, typing & context' },
  { value: 'FLASHCARDS', label: 'Recall cards', description: 'Reveal, remember, then self-grade' },
];

function shuffle(items) {
  const output = [...items];
  for (let index = output.length - 1; index > 0; index--) {
    const target = Math.floor(Math.random() * (index + 1));
    [output[index], output[target]] = [output[target], output[index]];
  }
  return output;
}

function buildPracticeItems(words, format) {
  return words.map((word) => {
    if (format === 'FLASHCARDS') return { word, type: 'RECALL' };

    const formats = ['RECALL'];
    if (word.definition?.trim()) formats.push('FILL_BLANK_WORD');
    const examples = (word.exampleSentence || '').split('\n\n').filter(Boolean);
    const matchingSentence = examples.find((sentence) => sentence.toLowerCase().includes(word.word.toLowerCase()));
    if (matchingSentence) formats.push('FILL_BLANK_SENTENCE');

    const distractors = shuffle(words.filter((candidate) =>
      candidate.id !== word.id && candidate.definition?.trim() && candidate.definition !== word.definition
    ));
    if (word.definition?.trim() && distractors.length >= 3) formats.push('MULTIPLE_CHOICE');

    const type = formats[Math.floor(Math.random() * formats.length)];
    if (type === 'MULTIPLE_CHOICE') {
      return {
        word,
        type,
        correctAnswer: word.definition,
        options: shuffle([word.definition, ...distractors.slice(0, 3).map((candidate) => candidate.definition)]),
      };
    }
    if (type === 'FILL_BLANK_WORD') return { word, type, prompt: word.definition, correctAnswer: word.word };
    if (type === 'FILL_BLANK_SENTENCE') {
      const escaped = word.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      return { word, type, sentence: matchingSentence.replace(new RegExp(escaped, 'gi'), '____'), correctAnswer: word.word };
    }
    return { word, type: 'RECALL' };
  });
}

function Metric({ icon: Icon, label, value, detail, accent = 'indigo' }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
    emerald: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  };
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${colors[accent]}`}><Icon className="h-4.5 w-4.5" /></span>
      <p className="mt-3 text-2xl font-extrabold tabular-nums text-gray-900 dark:text-white">{value}</p>
      <p className="mt-0.5 text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      {detail && <p className="mt-1 text-[11px] leading-relaxed text-gray-500 dark:text-gray-400">{detail}</p>}
    </div>
  );
}

export default function PracticePage() {
  const [overview, setOverview] = useState(null);
  const [legacyQuizStats, setLegacyQuizStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [mode, setMode] = useState('DUE');
  const [customLength, setCustomLength] = useState(10);
  const [format, setFormat] = useState('MIXED');
  const [items, setItems] = useState([]);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [phase, setPhase] = useState('setup');
  const [saveError, setSaveError] = useState('');

  const refreshOverview = useCallback(async () => {
    const result = await practiceService.getOverview();
    setOverview(result);
    return result;
  }, []);

  useEffect(() => {
    Promise.allSettled([practiceService.getOverview(), quizService.getStats()])
      .then(([practiceResult, quizResult]) => {
        if (practiceResult.status === 'fulfilled') setOverview(practiceResult.value);
        else setSaveError('Could not load Practice statistics. Refresh to retry.');
        if (quizResult.status === 'fulfilled') setLegacyQuizStats(quizResult.value);
      })
      .finally(() => setLoading(false));
  }, []);

  const startSession = async () => {
    setStarting(true);
    setSaveError('');
    try {
      const queue = await practiceService.getQueue({ mode, size: customLength });
      if (!queue.words?.length) {
        toast(mode === 'DUE' ? 'You are all caught up—no cards are due right now.' : 'Add vocabulary entries to start a custom session.');
        return;
      }
      setItems(buildPracticeItems(queue.words, format));
      setAnswers([]);
      setIndex(0);
      setPhase('session');
    } catch {
      toast.error('Could not start Practice. Please try again.');
    } finally {
      setStarting(false);
    }
  };

  const submitGrade = async (answer) => {
    setSaveError('');
    const result = await practiceService.submitAnswer(answer);
    setAnswers((previous) => [...previous, { ...answer, word: items[index].word, result }]);
    // Refresh aggregate stats in the background. A stats refresh failure must not
    // cause the already-persisted SRS answer to be submitted twice on retry.
    refreshOverview().catch(() => {});
    return result;
  };

  const nextCard = () => {
    if (index + 1 >= items.length) setPhase('complete');
    else setIndex((previous) => previous + 1);
  };

  const sessionCorrect = answers.filter((answer) => answer.quality >= 3).length;
  const sessionAccuracy = answers.length ? Math.round((sessionCorrect / answers.length) * 100) : 0;
  const sessionMastered = answers.filter((answer) => answer.result?.mastered).length;
  const sessionStreak = useMemo(() => {
    let best = 0;
    let current = 0;
    answers.forEach((answer) => {
      current = answer.quality >= 3 ? current + 1 : 0;
      best = Math.max(best, current);
    });
    return best;
  }, [answers]);

  if (loading) return <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>;

  const dueCount = overview?.dueCards ?? 0;
  const cardCount = overview?.totalCards ?? 0;
  const masteredCount = overview?.masteredCards ?? 0;

  return (
    <main className="mx-auto max-w-5xl space-y-6 pb-8">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary-600 dark:text-primary-400">Recall, reinforce, grow</p>
          <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl">Practice</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">One practice rhythm for every word and every question style.</p>
        </div>
        {phase === 'session' && <button type="button" onClick={() => { if (window.confirm('Leave this session? Answers already submitted are saved.')) setPhase('setup'); }} className="min-h-10 self-start rounded-lg px-3 text-sm font-semibold text-gray-500 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 sm:self-auto">Exit session</button>}
      </header>

      {saveError && <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-900/20 dark:text-amber-300">{saveError}</p>}

      {phase === 'setup' && (
        <>
          <section aria-label="Unified practice statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Metric icon={BookOpenIcon} label="Vocabulary" value={cardCount} detail={`${masteredCount} mastered`} />
            <Metric icon={ClockIcon} label="Due now" value={dueCount} detail={dueCount ? 'Ready for SRS review' : 'Nothing waiting'} accent={dueCount ? 'amber' : 'emerald'} />
            <Metric icon={CheckCircleIcon} label="SRS recall" value={overview?.totalReviews ? `${overview.recallRate}%` : '—'} detail={overview?.totalReviews ? `${overview.successfulReviews} successful of ${overview.totalReviews} reviews` : 'Build a baseline with a session'} accent="emerald" />
            <Metric icon={FireIcon} label="Review streak" value={`${overview?.currentStreakDays ?? 0}d`} detail="Consecutive active days" accent="amber" />
            <Metric icon={TrophyIcon} label="Quiz history" value={legacyQuizStats?.totalQuizzesTaken ?? 0} detail={legacyQuizStats?.totalQuizzesTaken ? `Past quiz average ${Math.round(legacyQuizStats.averageScore)}% · before Practice` : 'Legacy quizzes are kept separate'} accent="violet" />
          </section>

          <section className="grid gap-5 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-7 lg:grid-cols-[minmax(0,1fr)_minmax(300px,0.8fr)]">
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"><SparklesIcon className="h-5 w-5" /></span>
                <div>
                  <h2 className="text-base font-bold text-gray-900 dark:text-white">Build a session</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Every answer updates the same review schedule.</p>
                </div>
              </div>

              <div className="mt-5">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Choose your queue</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button type="button" aria-pressed={mode === 'DUE'} onClick={() => setMode('DUE')} className={`rounded-xl border p-3 text-left transition-colors ${mode === 'DUE' ? 'border-primary-300 bg-primary-50/70 ring-1 ring-primary-100 dark:border-primary-700 dark:bg-primary-900/20 dark:ring-primary-900' : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'}`}>
                    <span className="flex items-center justify-between gap-2"><span className="text-sm font-bold text-gray-900 dark:text-white">Due words</span><span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">{dueCount} due</span></span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">Work through cards scheduled for today.</span>
                  </button>
                  <button type="button" aria-pressed={mode === 'CUSTOM'} onClick={() => setMode('CUSTOM')} className={`rounded-xl border p-3 text-left transition-colors ${mode === 'CUSTOM' ? 'border-primary-300 bg-primary-50/70 ring-1 ring-primary-100 dark:border-primary-700 dark:bg-primary-900/20 dark:ring-primary-900' : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'}`}>
                    <span className="block text-sm font-bold text-gray-900 dark:text-white">Custom session</span>
                    <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">A random set from your full vocabulary.</span>
                  </button>
                </div>
              </div>

              {mode === 'CUSTOM' && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Session length</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SESSION_LENGTHS.map((length) => (
                      <button key={length} type="button" aria-pressed={customLength === length} onClick={() => setCustomLength(length)} className={`min-h-11 rounded-xl border text-sm font-bold transition-colors ${customLength === length ? 'border-primary-500 bg-primary-50 text-primary-700 dark:border-primary-600 dark:bg-primary-900/30 dark:text-primary-300' : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'}`}>{length} cards</button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Question style</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {FORMAT_OPTIONS.map((option) => (
                    <button key={option.value} type="button" aria-pressed={format === option.value} onClick={() => setFormat(option.value)} className={`rounded-xl border p-3 text-left transition-colors ${format === option.value ? 'border-primary-300 bg-primary-50/70 dark:border-primary-700 dark:bg-primary-900/20' : 'border-gray-200 hover:border-gray-300 dark:border-gray-600 dark:hover:border-gray-500'}`}>
                      <span className="block text-sm font-bold text-gray-900 dark:text-white">{option.label}</span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{option.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={startSession} loading={starting} disabled={mode === 'DUE' && dueCount === 0 || mode === 'CUSTOM' && cardCount === 0} size="lg" className="mt-5 min-h-12 w-full justify-center">
                <SparklesIcon className="h-5 w-5" />{mode === 'DUE' ? `Start due practice · ${dueCount}` : `Start ${customLength}-card practice`}
              </Button>
            </div>

            <aside className="rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 p-5 dark:from-indigo-950/50 dark:to-violet-950/30">
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-indigo-700 dark:text-indigo-300">One grade, one schedule</p>
              <h3 className="mt-2 text-lg font-extrabold text-gray-900 dark:text-white">Different ways to recall. One way to grow.</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">Mixed sessions vary the prompt. Recall cards let you reveal and self-grade. Either way, Again, Good, or Easy feeds your spaced-repetition schedule.</p>
              <div className="mt-5 space-y-2">
                {[
                  ['Again', 'Forgot it or answered incorrectly'],
                  ['Good', 'Recognized or recalled with effort'],
                  ['Easy', 'Recalled quickly without a hint'],
                ].map(([grade, description], gradeIndex) => <div key={grade} className="flex items-center gap-2 text-xs"><span className={`w-12 rounded-full px-2 py-1 text-center font-bold ${gradeIndex === 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' : gradeIndex === 1 ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>{grade}</span><span className="text-gray-600 dark:text-gray-300">{description}</span></div>)}
              </div>
            </aside>
          </section>

          {legacyQuizStats?.totalQuizzesTaken > 0 && (
            <details className="rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
              <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:text-gray-200 sm:px-5">
                Previous quiz history <span className="ml-1 text-xs font-normal text-gray-500">(before unified Practice)</span>
              </summary>
              <div className="grid grid-cols-2 gap-3 border-t border-gray-100 p-4 dark:border-gray-700 sm:grid-cols-4 sm:px-5">
                <LegacyMetric label="Quizzes" value={legacyQuizStats.totalQuizzesTaken} />
                <LegacyMetric label="Average score" value={`${Math.round(legacyQuizStats.averageScore)}%`} />
                <LegacyMetric label="Best score" value={`${Math.round(legacyQuizStats.bestScore)}%`} />
                <LegacyMetric label="Questions" value={legacyQuizStats.totalQuestionsAnswered} />
              </div>
            </details>
          )}
        </>
      )}

      {phase === 'session' && items[index] && (
        <PracticeSession
          items={items}
          index={index}
          answers={answers}
          onSubmitGrade={submitGrade}
          onNext={nextCard}
        />
      )}

      {phase === 'complete' && (
        <section className="mx-auto max-w-2xl rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-teal-50 p-6 text-center shadow-sm dark:border-emerald-900 dark:from-gray-800 dark:via-gray-800 dark:to-emerald-950/30 sm:p-9">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"><TrophyIcon className="h-7 w-7" /></span>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Practice complete</p>
          <h2 className="mt-1 text-2xl font-extrabold text-gray-900 dark:text-white">Nice work showing up.</h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Your answers are saved to the same spaced-repetition system, no matter which prompt format you used.</p>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <CompletionMetric label="Practised" value={answers.length} />
            <CompletionMetric label="Recall" value={`${sessionAccuracy}%`} />
            <CompletionMetric label="Mastered" value={sessionMastered} />
            <CompletionMetric label="Best run" value={sessionStreak} />
          </div>
          <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
            <Button onClick={() => { setPhase('setup'); refreshOverview().catch(() => {}); }} className="min-h-11"><ArrowPathIcon className="h-4 w-4" />Practice again</Button>
            <Link to="/dashboard"><Button variant="secondary" className="min-h-11">Back to dashboard</Button></Link>
          </div>
        </section>
      )}
    </main>
  );
}

function PracticeSession({ items, index, answers, onSubmitGrade, onNext }) {
  const currentStreak = useMemo(() => {
    let count = 0;
    for (let cursor = answers.length - 1; cursor >= 0 && answers[cursor].quality >= 3; cursor--) count++;
    return count;
  }, [answers]);
  const progress = Math.round((index / items.length) * 100);
  return (
    <section className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400">Unified Practice</p>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Card {index + 1} of {items.length}</h2>
        </div>
        {currentStreak >= 2 && <span className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-2.5 py-1 text-xs font-bold text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"><FireIcon className="h-4 w-4" />{currentStreak} in a row</span>}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700" role="progressbar" aria-label="Practice session progress" aria-valuemin={0} aria-valuemax={items.length} aria-valuenow={index}>
        <div className="h-full rounded-full bg-gradient-to-r from-primary-500 to-violet-500 transition-all" style={{ width: `${progress}%` }} />
      </div>
      <PracticeCard key={`${items[index].word.id}-${index}`} item={items[index]} index={index} total={items.length} onSubmitGrade={onSubmitGrade} onNext={onNext} />
    </section>
  );
}

function CompletionMetric({ label, value }) {
  return <div className="rounded-xl border border-white bg-white/80 p-3 dark:border-gray-700 dark:bg-gray-800/80"><p className="text-xl font-extrabold tabular-nums text-gray-900 dark:text-white">{value}</p><p className="mt-0.5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">{label}</p></div>;
}

function LegacyMetric({ label, value }) {
  return <div><p className="text-lg font-bold tabular-nums text-gray-900 dark:text-white">{value}</p><p className="text-xs text-gray-500 dark:text-gray-400">{label}</p></div>;
}
