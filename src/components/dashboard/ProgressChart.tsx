import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import type { WeeklyStats } from '../../utils/analytics';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface ProgressChartProps {
  weeklyStats: WeeklyStats[];
  selectedTimeRange: '7d' | '30d' | '90d' | 'all';
}

type ChartType = 'volume' | 'workouts' | 'duration';

export const ProgressChart: React.FC<ProgressChartProps> = ({
  weeklyStats,
  selectedTimeRange
}) => {
  // Use selectedTimeRange for chart configuration
  const [activeChart, setActiveChart] = React.useState<ChartType>('volume');

  const chartData = useMemo(() => {
    const labels = weeklyStats.map(stat => stat.week);
    
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          mode: 'index' as const,
          intersect: false,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          titleColor: 'white',
          bodyColor: 'white',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: 'rgb(156, 163, 175)' // gray-400
          }
        },
        y: {
          grid: {
            color: 'rgba(156, 163, 175, 0.1)' // gray-400 with opacity
          },
          ticks: {
            color: 'rgb(156, 163, 175)' // gray-400
          }
        }
      },
      interaction: {
        mode: 'nearest' as const,
        axis: 'x' as const,
        intersect: false
      }
    };

    switch (activeChart) {
      case 'volume':
        return {
          type: 'line' as const,
          data: {
            labels,
            datasets: [
              {
                label: 'Total Volume (kg)',
                data: weeklyStats.map(stat => Math.round(stat.totalVolume)),
                borderColor: 'rgb(59, 130, 246)', // blue-500
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgb(59, 130, 246)',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              tooltip: {
                ...baseOptions.plugins.tooltip,
                callbacks: {
                  label: (context: any) => `Volume: ${context.parsed.y}kg`
                }
              }
            },
            scales: {
              ...baseOptions.scales,
              y: {
                ...baseOptions.scales.y,
                title: {
                  display: true,
                  text: 'Volume (kg)',
                  color: 'rgb(156, 163, 175)'
                }
              }
            }
          }
        };

      case 'workouts':
        return {
          type: 'bar' as const,
          data: {
            labels,
            datasets: [
              {
                label: 'Workouts',
                data: weeklyStats.map(stat => stat.workoutCount),
                backgroundColor: 'rgba(16, 185, 129, 0.8)', // emerald-500
                borderColor: 'rgb(16, 185, 129)',
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false
              }
            ]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              tooltip: {
                ...baseOptions.plugins.tooltip,
                callbacks: {
                  label: (context: any) => `Workouts: ${context.parsed.y}`
                }
              }
            },
            scales: {
              ...baseOptions.scales,
              y: {
                ...baseOptions.scales.y,
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Workouts',
                  color: 'rgb(156, 163, 175)'
                },
                ticks: {
                  ...baseOptions.scales.y.ticks,
                  stepSize: 1
                }
              }
            }
          }
        };

      case 'duration':
        return {
          type: 'line' as const,
          data: {
            labels,
            datasets: [
              {
                label: 'Average Duration (min)',
                data: weeklyStats.map(stat => Math.round(stat.averageDuration)),
                borderColor: 'rgb(245, 158, 11)', // amber-500
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.3,
                fill: true,
                pointBackgroundColor: 'rgb(245, 158, 11)',
                pointBorderColor: 'white',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6
              }
            ]
          },
          options: {
            ...baseOptions,
            plugins: {
              ...baseOptions.plugins,
              tooltip: {
                ...baseOptions.plugins.tooltip,
                callbacks: {
                  label: (context: any) => `Duration: ${context.parsed.y} min`
                }
              }
            },
            scales: {
              ...baseOptions.scales,
              y: {
                ...baseOptions.scales.y,
                title: {
                  display: true,
                  text: 'Duration (minutes)',
                  color: 'rgb(156, 163, 175)'
                }
              }
            }
          }
        };

      default:
        return null;
    }
  }, [weeklyStats, activeChart]);

  if (!chartData || weeklyStats.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
        <div className="text-center">
          <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p>No data available for {selectedTimeRange === 'all' ? 'all time' : `the last ${selectedTimeRange}`}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Chart Type Selector */}
      <div className="flex space-x-2">
        {[
          { key: 'volume', label: 'Volume', color: 'text-blue-600 dark:text-blue-400' },
          { key: 'workouts', label: 'Workouts', color: 'text-emerald-600 dark:text-emerald-400' },
          { key: 'duration', label: 'Duration', color: 'text-amber-600 dark:text-amber-400' }
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setActiveChart(key as ChartType)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeChart === key
                ? `${color} bg-gray-100 dark:bg-gray-700`
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Chart Container */}
      <div className="h-64 w-full">
        {chartData.type === 'line' ? (
          <Line data={chartData.data} options={chartData.options} />
        ) : (
          <Bar data={chartData.data} options={chartData.options} />
        )}
      </div>

      {/* Chart Summary */}
      <div className="grid grid-cols-3 gap-4 text-center text-sm">
        <div>
          <div className="text-blue-600 dark:text-blue-400 font-semibold">
            {Math.round(weeklyStats.reduce((sum, stat) => sum + stat.totalVolume, 0))}kg
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Volume</div>
        </div>
        <div>
          <div className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {weeklyStats.reduce((sum, stat) => sum + stat.workoutCount, 0)}
          </div>
          <div className="text-gray-600 dark:text-gray-400">Total Workouts</div>
        </div>
        <div>
          <div className="text-amber-600 dark:text-amber-400 font-semibold">
            {weeklyStats.length > 0 
              ? Math.round(weeklyStats.reduce((sum, stat) => sum + stat.averageDuration, 0) / weeklyStats.length)
              : 0
            }min
          </div>
          <div className="text-gray-600 dark:text-gray-400">Avg Duration</div>
        </div>
      </div>
    </div>
  );
};