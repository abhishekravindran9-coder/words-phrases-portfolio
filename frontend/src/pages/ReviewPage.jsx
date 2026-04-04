import React, { useState, useEffect, useCallback } from 'react';
import { reviewService } from '../services/reviewService';
import Flashcard from '../components/review/Flashcard';
import ReviewProgress from '../components/review/ReviewProgress';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';

/**
 * Review page – presents words due for review one at a time using the flashcard UI.
 * Submits SM-2 quality ratings to the backend after each card.
 */
export default function ReviewPage() {
  const [queue,    setQueue]    = useState([]);
  const [index,    setIndex]    = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [done,     setDone]     = useState(false);
  const [stats,    setStats]    = useState({ reviewed: 0, correct: 0 });

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
      await reviewService.submitReview({ wordId, quality, timeTakenSeconds });
      setStats((s) => ({
        reviewed: s.reviewed + 1,
        correct:  s.correct + (quality >= 3 ? 1 : 0),
      }));

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

  if (loading) return (
    <div className="flex h-64 items-center justify-center"><LoadingSpinner size="lg" /></div>
  );

  if (done) return (
    <div className="max-w-md mx-auto text-center py-20 animate-fade-in">
      <p className="text-6xl mb-4">{stats.reviewed > 0 ? '🎉' : '😴'}</p>
      <h2 className="text-2xl font-extrabold text-gray-900 mb-2">
        {stats.reviewed > 0 ? 'Session complete!' : 'All caught up!'}
      </h2>
      {stats.reviewed > 0 && (
        <p className="text-gray-500 mb-1">
          Reviewed <strong>{stats.reviewed}</strong> word{stats.reviewed !== 1 ? 's' : ''} —{' '}
          <strong>{stats.correct}</strong> correct. 
        </p>
      )}
      <p className="text-gray-400 text-sm mb-8">
        {stats.reviewed === 0
          ? 'No words are due for review right now. Come back later!'
          : 'Great work! Keep up the streak.'}
      </p>
      <div className="flex justify-center gap-3">
        <Link to="/dashboard"><Button variant="secondary">Dashboard</Button></Link>
        <Link to="/words"><Button>Add More Words</Button></Link>
      </div>
    </div>
  );

  const current = queue[index];

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-extrabold text-gray-900">Review Session</h1>
        <span className="text-sm text-gray-400 font-medium">{queue.length} cards</span>
      </div>

      <ReviewProgress current={index} total={queue.length} />

      {current && (
        <Flashcard key={current.id} word={current} onGrade={handleGrade} loading={saving} />
      )}
    </div>
  );
}
