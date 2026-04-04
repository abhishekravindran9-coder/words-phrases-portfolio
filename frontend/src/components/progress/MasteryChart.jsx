import React from 'react';
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * Doughnut chart showing mastered vs in-progress words.
 */
export default function MasteryChart({ masteredWords = 0, wordsInProgress = 0 }) {
  const total = masteredWords + wordsInProgress;

  const chartData = {
    labels: ['Mastered', 'In Progress'],
    datasets: [
      {
        data: [masteredWords, wordsInProgress],
        backgroundColor: ['#10b981', '#6366f1'],
        borderWidth: 0,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: { font: { size: 13 }, padding: 16 },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Mastery Overview</h3>
      <div className="relative h-52">
        {total > 0 ? (
          <>
            <Doughnut data={chartData} options={options} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900">
                  {total > 0 ? Math.round((masteredWords / total) * 100) : 0}%
                </p>
                <p className="text-xs text-gray-400">mastered</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-center text-gray-400 mt-16">Add some words to see mastery data.</p>
        )}
      </div>
    </div>
  );
}
