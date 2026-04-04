import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  Title, Tooltip, Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

/**
 * Bar chart showing words reviewed per day over the past 30 days.
 */
export default function ReviewChart({ reviewsPerDay = {} }) {
  const entries = Object.entries(reviewsPerDay).slice(-30);
  const labels  = entries.map(([d]) => {
    const [y, m, day] = d.split('-');
    return `${Number(m)}/${Number(day)}`;
  });
  const data = entries.map(([, v]) => v);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Words Reviewed',
        data,
        backgroundColor: 'rgba(99, 102, 241, 0.6)',
        borderColor:     'rgba(99, 102, 241, 1)',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title:  { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 },
        grid: { color: 'rgba(0,0,0,0.04)' },
      },
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 15 },
      },
    },
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h3 className="font-semibold text-gray-800 mb-4">Reviews per Day (last 30 days)</h3>
      <div className="h-56">
        {entries.length > 0
          ? <Bar data={chartData} options={options} />
          : <p className="text-center text-gray-400 mt-16">No review data yet.</p>}
      </div>
    </div>
  );
}
