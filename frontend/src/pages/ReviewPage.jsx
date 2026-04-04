import React, { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/reviewService';
import Flashcard from '../components/review/Flashcard';
import ReviewProgress from '../components/review/ReviewProgress';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FireIcon, TrophyIcon } from '@heroicons/react/24/solid';

/** Grade label + colour config used both during session and in completion breakdown */
const GRADE_META = {
  1: { label: 'Again', light: 'bg-red-50 text-red-600',    dark: 'dark:bg-red-900/20 dark:text-red-400' },
  3: { label: 'Good',  light: 'bg-amber-50 text-amber-600', dark: 'dark:bg-amber-900/20 dark:text-amber-400' },
  5: { label: 'Easy',  light: 'bg-green-50 text-green-600', dark: 'dark:bg-green-900/20 dark:text-green-400' },
};

const dotColor = (quality) =>
  quality >= 4 ? 'bg-green-400' : quality >= 3 ? 'bg-amber-400' : 'bg-red-400';

/**
 * Review page — presents due flashcards, tracks live session stats,
 * and shows a detailed completion summary.
 */
export default function ReviewPage() {
  const [queue,      setQueue]      = useState([]);
  const [index,      setIndex]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [saving,     setSaving]     = useState(false);
  const [done,       setDone]       = useState(false);
  const [sessionLog, setSessionLog] = useState([]);   // {word, quality, nextDays, mastered}
  const [streak,     setStreak]     = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const navigate = useNavigate();

  const loadDue = useCallback(async () => {
    setLoading(true);
    try {
      const words = await reviewService.getDueWords();
      setQueue(words);
      setDone(words.length === 0);
    } catch {
      toast.error('Failed to load review queue');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDue(); }, [loadDue]);

  const handleGrade = async ({ wordId, quality, timeTakenSeconds }) => {
    setSaving(true);
    try {
      const result = await reviewService.submitReview({ wordId, quality, timeTakenSeconds });
      const correct    = quality >= 3;
      const newStreak  = correct ? streak + 1 : 0;
      setStreak(newStreak);
      setBestStreak((prev) => Math.max(prev, newStreak));

      setSessionLog((log) => [...log, {
        word:     queue[index],
        quality,
        nextDays: result?.newIntervalDays ?? null,
        mastered: result?.mastered ?? false,
      }]);

      if (result?.mastered) {
        toast.success(`🏆 "${queue[index].word}" mastered!`, { duration: 3500 });
      } else if (newStreak === 3 || newStreak === 5 || (newStreak >= 10 && newStreak % 5 === 0)) {
        toast(`🔥 ${newStreak} in a row!`);
      }

      if (index + 1 >= queue.length) {
        setDone(true);
      } else {
        setIndex((i) => i + 1);
      }
    } catch {
      toast.error('Failed to save review result');
    } finally {
      setSaving(false);
    }
  };

  // ── Derived stats ─────────────────────────────────────
  const reviewed     = sessionLog.length;
  const correct      = sessionLog.filter((l) => l.quality >= 3).length;
  const accuracy     = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;
  const masteredCount = sessionLog.filter((l) => l.mastered).length;

  // ── Loading ───────────────────────────────────────────
  if (loading) return (
    <div className="flex h-64 items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

  // ── All caught up (no cards due) ──────────────────────
  if (done && reviewed === 0) return (
    <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
      <p className="text-6xl mb-4">😴</p>
      <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">
        All caught up!
      </h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-8">
        No words are due for review right now. Come back later!
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/dashboard"><Button variant="secondary">Dashboard</Button></Link>
        <Link to="/words"><Button>Add More Words</Button></Link>
      </div>
    </div>
  );

  // ── Session complete ──────────────────────────────────
  if (done) return (
    <div className="max-w-lg mx-auto py-10 animate-fade-in">
      {/* Hero */}
      <div className="text-center mb-8">
        <p className="text-6xl mb-3">🎉</p>
        <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">
          Session Complete!
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
          You reviewed <strong className="text-gray-700 dark:text-gray-300">{reviewed}</strong>{' '}
          word{reviewed !== 1 ? 's' : ''} today
        </p>
      </div>

      {/* Stats tiles */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <StatTile
          value={`${accuracy}%`}
          label="Accuracy"
          valueClass="text-primary-600 dark:text-primary-400"
        />
        <StatTile
          value={bestStreak > 0 ? bestStreak : '—'}
          label="Best Streak"
          valueClass="text-orange-500"
          icon={bestStreak > 0 ? <FireIcon className="h-5 w-5 text-orange-400" /> : null}
        />
        <StatTile
          value={masteredCount}
          label="Mastered"
          valueClass="text-green-600 dark:text-green-400"
          icon={masteredCount > 0 ? <TrophyIcon className="h-5 w-5 text-yellow-400" /> : null}
        />
      </div>

      {/* Word-by-word breakdown */}
      <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                      rounded-2xl overflow-hidden shadow-sm mb-8">
        <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Word Breakdown</h3>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            {correct}/{reviewed} correct
          </span>
        </div>
        <ul className="divide-y divide-gray-50 dark:divide-gray-700/60 max-h-72 overflow-y-auto">
          {sessionLog.map(({ word, quality, nextDays, mastered }, i) => {
            const meta = GRADE_META[quality] ?? GRADE_META[5];
            return (
              <li key={i} className="flex items-center justify-between px-5 py-3 gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`h-2 w-2 rounded-full flex-shrink-0 ${dotColor(quality)}`} />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {word.word}
                  </span>
                  {mastered && <TrophyIcon className="h-3.5 w-3.5 text-yellow-400 flex-shrink-0" />}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${meta.light} ${meta.dark}`}>
                    {meta.label}
                  </span>
                  {nextDays != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:block">
                      +{nextDays}d
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex justify-center gap-3">
        <Link to="/dashboard"><Button variant="secondary">Dashboard</Button></Link>
        <Link to="/words"><Button>Add More Words</Button></Link>
      </div>
    </div>
  );

  // ── Active session ────────────────────────────────────
  const current = queue[index];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Session header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">
            Review Session
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1.5">
            <span>Card {index + 1} of {queue.length}</span>
            {reviewed > 0 && (
              <>
                <span className="opacity-30">·</span>
                <span>{accuracy}% correct</span>
              </>
            )}
            {streak >= 2 && (
              <>
                <span className="opacity-30">·</span>
                <span className="flex items-center gap-0.5 text-orange-500 font-semibold">
                  <FireIcon className="h-3.5 w-3.5" />
                  {streak}
                </span>
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => {
            if (reviewed === 0 || window.confirm('Exit session? Progress so far is saved.')) {
              navigate('/dashboard');
            }
          }}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
                     hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
          aria-label="Exit session"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      <ReviewProgress
        current={index}
        total={queue.length}
        streak={streak}
        sessionLog={sessionLog}
      />

      {current && (
        <Flashcard key={current.id} word={current} onGrade={handleGrade} loading={saving} />
      )}
    </div>
  );
}

/** Small stat tile for the completion screen */
function StatTile({ value, label, valueClass, icon }) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700
                    rounded-2xl p-4 text-center shadow-sm">
      <div className="flex items-center justify-center gap-1 mb-1">
        {icon}
        <p className={`text-2xl font-extrabold ${valueClass}`}>{value}</p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">{label}</p>
    </div>
  );
}

