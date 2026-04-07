import React from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';
import {
  TrophyIcon, FireIcon, AcademicCapIcon, BoltIcon,
  ClockIcon, ChartBarIcon, ExclamationCircleIcon,
  CheckCircleIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

ChartJS.register(
  CategoryScale, LinearScale, BarElement, LineElement,
  PointElement, Title, Tooltip, Legend, Filler
);

const TYPE_LABELS = {
  MULTIPLE_CHOICE:     'Multiple Choice',
  FILL_BLANK_WORD:     'Type the Word',
  FILL_BLANK_SENTENCE: 'Fill in the Blank',
};

const TYPE_ICONS = {
  MULTIPLE_CHOICE:     '🔤',
  FILL_BLANK_WORD:     '✏️',
  FILL_BLANK_SENTENCE: '📝',
};

function fmtTime(secs) {
  if (!secs) return '—';
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

function gradeColor(pct) {
  if (pct >= 90) return { text: 'text-emerald-600', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  if (pct >= 75) return { text: 'text-green-600',   bg: 'bg-green-500',   light: 'bg-green-50   text-green-700   border-green-200' };
  if (pct >= 60) return { text: 'text-primary-600', bg: 'bg-primary-500', light: 'bg-primary-50 text-primary-700 border-primary-200' };
  if (pct >= 40) return { text: 'text-orange-600',  bg: 'bg-orange-400',  light: 'bg-orange-50  text-orange-700  border-orange-200' };
  return              { text: 'text-red-500',      bg: 'bg-red-400',     light: 'bg-red-50     text-red-700     border-red-200' };
}

/** Small stat card consistent with ProgressPage's StatBadge */
function StatCard({ icon: Icon, iconBg, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-xl flex-shrink-0 ${iconBg}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium leading-tight">{label}</p>
        <p className="text-xl font-extrabold text-gray-900 truncate leading-snug">{value ?? '—'}</p>
        {sub && <p className="text-[11px] text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

/** Horizontal accuracy bar row */
function AccuracyBar({ icon, label, accuracy, total, correct }) {
  const pct   = Math.round(accuracy ?? 0);
  const c     = gradeColor(pct);
  return (
    <div className="flex items-center gap-3">
      <span className="text-base flex-shrink-0 w-6 text-center">{icon}</span>
      <span className="text-sm text-gray-600 w-36 flex-shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full ${c.bg} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-col items-end flex-shrink-0 w-24 text-right">
        <span className={`text-sm font-extrabold ${c.text}`}>{pct}%</span>
        <span className="text-[10px] text-gray-400">{correct}/{total} correct</span>
      </div>
    </div>
  );
}

export default function QuizStatsSection({ stats }) {
  if (!stats || stats.totalQuizzesTaken === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
        <AcademicCapIcon className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <p className="font-semibold text-gray-600">No quiz sessions yet</p>
        <p className="text-sm text-gray-400 mt-1 mb-5">
          Complete your first quiz to see detailed stats here.
        </p>
        <Link
          to="/quiz"
          className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
        >
          <AcademicCapIcon className="h-4 w-4" /> Take a Quiz
        </Link>
      </div>
    );
  }

  const {
    totalQuizzesTaken, totalQuestionsAnswered, totalCorrect,
    overallAccuracy, averageScore, bestScore, averageTimePerQuestion,
    accuracyByType = {}, recentSessions = [], mostMissedWords = [],
    currentPassingStreak, longestPassingStreak,
    quizzesToday, questionsToday,
  } = stats;

  // ── Score trend chart (last 10 sessions, chronological order) ────────────
  const chronoSessions = [...recentSessions].reverse();
  const trendLabels = chronoSessions.map((_, i) => `#${i + 1}`);
  const trendData   = chronoSessions.map((s) => Math.round(s.scorePercent));
  const trendColors = trendData.map((v) => gradeColor(v).bg.replace('bg-', ''));

  const trendChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Score %',
        data: trendData,
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointHoverRadius: 7,
        borderColor:           'rgba(99, 102, 241, 1)',
        backgroundColor:       'rgba(99, 102, 241, 0.12)',
        pointBackgroundColor:  trendData.map((v) =>
          v >= 90 ? '#10b981' : v >= 60 ? '#6366f1' : '#f87171'),
        borderWidth: 2,
      },
    ],
  };

  const trendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.raw}%`,
          afterLabel: (ctx) => {
            const s = chronoSessions[ctx.dataIndex];
            return `  ${s.correctCount}/${s.questionCount} correct · ${fmtTime(s.totalTimeSeconds)}`;
          },
        },
      },
    },
    scales: {
      y: {
        min: 0, max: 100,
        ticks: { callback: (v) => `${v}%`, stepSize: 20 },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: { grid: { display: false } },
    },
  };

  // ── Accuracy by type chart ────────────────────────────────────────────────
  const typeEntries = Object.entries(accuracyByType);
  const typeBarData = {
    labels: typeEntries.map(([t]) => TYPE_LABELS[t] || t),
    datasets: [
      {
        label: 'Accuracy %',
        data:  typeEntries.map(([, s]) => Math.round(s.accuracy)),
        backgroundColor: ['rgba(99,102,241,0.7)', 'rgba(16,185,129,0.7)', 'rgba(251,191,36,0.7)'],
        borderColor:     ['rgba(99,102,241,1)',   'rgba(16,185,129,1)',   'rgba(251,191,36,1)'],
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const typeBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: { legend: { display: false } },
    scales: {
      x: {
        min: 0, max: 100,
        ticks: { callback: (v) => `${v}%` },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      y: { grid: { display: false } },
    },
  };

  return (
    <div className="space-y-6">

      {/* ── Section header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ChartBarIcon className="h-5 w-5 text-primary-500" />
          <h2 className="text-lg font-extrabold text-gray-900">Quiz Performance</h2>
        </div>
        <Link
          to="/quiz"
          className="text-sm font-semibold text-primary-600 hover:text-primary-800 flex items-center gap-1"
        >
          <AcademicCapIcon className="h-4 w-4" /> Take a quiz →
        </Link>
      </div>

      {/* ── Today banner ── */}
      {quizzesToday > 0 && (
        <div className="flex items-center gap-3 bg-primary-50 border border-primary-200 rounded-xl px-4 py-3">
          <BoltIcon className="h-5 w-5 text-primary-500 flex-shrink-0" />
          <p className="text-sm text-primary-800">
            <span className="font-semibold">Today:</span>{' '}
            {quizzesToday} {quizzesToday === 1 ? 'quiz' : 'quizzes'} completed,{' '}
            {questionsToday} questions answered.
          </p>
        </div>
      )}

      {/* ── 6-stat grid ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <StatCard
          icon={AcademicCapIcon} iconBg="text-primary-600 bg-primary-50"
          label="Total Quizzes" value={totalQuizzesTaken}
          sub={`${totalQuestionsAnswered} questions answered`}
        />
        <StatCard
          icon={CheckCircleIcon} iconBg="text-emerald-600 bg-emerald-50"
          label="Overall Accuracy" value={`${overallAccuracy}%`}
          sub={`${totalCorrect} of ${totalQuestionsAnswered} correct`}
        />
        <StatCard
          icon={ArrowTrendingUpIcon} iconBg="text-blue-600 bg-blue-50"
          label="Average Score" value={`${averageScore}%`}
          sub="per session"
        />
        <StatCard
          icon={TrophyIcon} iconBg="text-yellow-600 bg-yellow-50"
          label="Best Score" value={`${bestScore}%`}
          sub="single session"
        />
        <StatCard
          icon={FireIcon} iconBg="text-orange-600 bg-orange-50"
          label="Passing Streak" value={`${currentPassingStreak}d`}
          sub={longestPassingStreak > 0 ? `Best: ${longestPassingStreak}d` : undefined}
        />
        <StatCard
          icon={ClockIcon} iconBg="text-purple-600 bg-purple-50"
          label="Avg Time / Question" value={`${averageTimePerQuestion}s`}
          sub="across all attempts"
        />
      </div>

      {/* ── Score trend + Type accuracy side by side on lg ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

        {/* Score trend chart */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-800">Score Trend</h3>
            <span className="text-xs text-gray-400">Last {chronoSessions.length} sessions</span>
          </div>
          {chronoSessions.length > 1
            ? <div className="h-48"><Line data={trendChartData} options={trendOptions} /></div>
            : <div className="h-48 flex items-center justify-center text-sm text-gray-400">
                Complete at least 2 sessions to see a trend.
              </div>
          }
          {/* Score chips row below chart */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {chronoSessions.map((s) => {
              const pct = Math.round(s.scorePercent);
              const c   = gradeColor(pct);
              return (
                <div
                  key={s.sessionId}
                  title={`${s.correctCount}/${s.questionCount} · ${fmtTime(s.totalTimeSeconds)}`}
                  className={`${c.bg} text-white text-xs font-bold rounded-lg px-2 py-0.5 cursor-default`}
                >
                  {pct}%
                </div>
              );
            })}
          </div>
        </div>

        {/* Accuracy by type */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Accuracy by Type</h3>
          {typeEntries.length > 0
            ? (
              <div className="space-y-3">
                {typeEntries.map(([type, stat]) => (
                  <AccuracyBar
                    key={type}
                    icon={TYPE_ICONS[type] || '❓'}
                    label={TYPE_LABELS[type] || type}
                    accuracy={stat.accuracy}
                    total={stat.total}
                    correct={stat.correct}
                  />
                ))}
                {/* Helpful tip for weakest type */}
                {(() => {
                  const weakest = typeEntries.reduce((a, b) => b[1].accuracy < a[1].accuracy ? b : a);
                  const wAcc = Math.round(weakest[1].accuracy);
                  if (wAcc < 70) return (
                    <p className="text-xs text-orange-600 bg-orange-50 rounded-lg px-3 py-2 mt-1">
                      💡 Focus on <strong>{TYPE_LABELS[weakest[0]] || weakest[0]}</strong> — only {wAcc}% accuracy.
                    </p>
                  );
                  return null;
                })()}
              </div>
            )
            : <p className="text-sm text-gray-400 mt-8 text-center">No data yet.</p>
          }
        </div>
      </div>

      {/* ── Most missed words ── */}
      {mostMissedWords.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <h3 className="font-semibold text-gray-800">Words to Focus On</h3>
            <span className="ml-auto text-xs text-gray-400">sorted by miss frequency</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100">
                  <th className="text-left pb-2 pr-4">#</th>
                  <th className="text-left pb-2 pr-4">Word</th>
                  <th className="text-right pb-2 pr-4">Attempts</th>
                  <th className="text-right pb-2 pr-4">Misses</th>
                  <th className="text-right pb-2 pr-8">Accuracy</th>
                  <th className="pb-2 w-32">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {mostMissedWords.map((w, i) => {
                  const acc = Math.round(w.accuracy);
                  const c   = gradeColor(acc);
                  return (
                    <tr key={w.wordId} className="group hover:bg-gray-50 transition-colors">
                      <td className="py-3 pr-4 text-gray-300 font-mono text-xs">{i + 1}</td>
                      <td className="py-3 pr-4">
                        <span className="font-semibold text-gray-800">{w.word}</span>
                      </td>
                      <td className="py-3 pr-4 text-right text-gray-500">{w.totalAttempts}</td>
                      <td className="py-3 pr-4 text-right">
                        <span className="font-semibold text-red-500">{w.wrongCount}</span>
                      </td>
                      <td className="py-3 pr-8 text-right">
                        <span className={`font-extrabold ${c.text}`}>{acc}%</span>
                      </td>
                      <td className="py-3">
                        <div className="w-28 bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-2 rounded-full ${c.bg} transition-all`}
                            style={{ width: `${acc}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
            <span>Top {mostMissedWords.length} most-missed words across all sessions</span>
            <Link to="/quiz" className="text-primary-500 font-semibold hover:text-primary-700">
              Practice these →
            </Link>
          </div>
        </div>
      )}

      {/* ── Streak card ── */}
      {longestPassingStreak > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-5 flex items-center gap-5">
          <div className="text-4xl flex-shrink-0">🔥</div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-900">Passing Streak (≥60%)</p>
            <div className="flex items-end gap-4 mt-1 flex-wrap">
              <div>
                <p className="text-3xl font-extrabold text-orange-600">{currentPassingStreak}</p>
                <p className="text-xs text-orange-500 -mt-0.5">current days</p>
              </div>
              <div className="text-gray-300">·</div>
              <div>
                <p className="text-3xl font-extrabold text-yellow-600">{longestPassingStreak}</p>
                <p className="text-xs text-yellow-600 -mt-0.5">best ever</p>
              </div>
            </div>
          </div>
          {currentPassingStreak === longestPassingStreak && currentPassingStreak > 0 && (
            <div className="flex-shrink-0">
              <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-700 text-xs font-bold px-3 py-1.5 rounded-full border border-yellow-200">
                <TrophyIcon className="h-4 w-4" /> Personal best!
              </span>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
