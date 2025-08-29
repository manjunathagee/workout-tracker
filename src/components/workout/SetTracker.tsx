import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import type { Set } from '../../types/workout';

interface SetTrackerProps {
  set: Set;
  onComplete: (actualReps: number, actualWeight: number) => void;
  disabled?: boolean;
}

export const SetTracker: React.FC<SetTrackerProps> = ({
  set,
  onComplete,
  disabled = false
}) => {
  const [actualReps, setActualReps] = useState(set.actualReps || set.targetReps);
  const [actualWeight, setActualWeight] = useState(set.actualWeight || set.targetWeight);
  const [isCompleting, setIsCompleting] = useState(false);

  // Reset values when set changes
  useEffect(() => {
    setActualReps(set.actualReps || set.targetReps);
    setActualWeight(set.actualWeight || set.targetWeight);
  }, [set.id, set.targetReps, set.targetWeight, set.actualReps, set.actualWeight]);

  const handleComplete = async () => {
    if (actualReps <= 0 || actualWeight < 0) {
      return;
    }

    setIsCompleting(true);
    try {
      await onComplete(actualReps, actualWeight);
    } finally {
      setIsCompleting(false);
    }
  };

  const adjustValue = (
    value: number,
    setter: (value: number) => void,
    adjustment: number,
    min = 0
  ) => {
    setter(Math.max(min, value + adjustment));
  };

  const getPerformanceComparison = () => {
    const repsDiff = actualReps - set.targetReps;
    const weightDiff = actualWeight - set.targetWeight;

    let status = 'on-target';
    let message = 'On target';
    let color = 'text-green-600 dark:text-green-400';

    if (repsDiff > 0 || weightDiff > 0) {
      status = 'exceeded';
      message = 'Exceeded target!';
      color = 'text-blue-600 dark:text-blue-400';
    } else if (repsDiff < 0 && Math.abs(repsDiff) > 2) {
      status = 'below';
      message = 'Below target';
      color = 'text-yellow-600 dark:text-yellow-400';
    } else if (weightDiff < -2) {
      status = 'below';
      message = 'Below target weight';
      color = 'text-yellow-600 dark:text-yellow-400';
    }

    return { status, message, color };
  };

  const performance = getPerformanceComparison();

  return (
    <div className="space-y-6">
      {/* Target vs Actual Comparison */}
      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Current Set
        </h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Target</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {set.targetReps} reps @ {set.targetWeight}kg
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Actual</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {actualReps} reps @ {actualWeight}kg
            </div>
          </div>
        </div>

        <div className={`text-center text-sm font-medium ${performance.color}`}>
          {performance.message}
        </div>
      </div>

      {/* Reps Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Reps Completed
        </label>
        
        <div className="flex items-center space-x-3">
          {/* Quick adjustment buttons */}
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => adjustValue(actualReps, setActualReps, 1, 1)}
              disabled={disabled}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => adjustValue(actualReps, setActualReps, -1, 1)}
              disabled={disabled}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              -
            </button>
          </div>

          {/* Main input */}
          <div className="flex-1">
            <Input
              type="number"
              min="1"
              value={actualReps}
              onChange={(e) => setActualReps(Math.max(1, parseInt(e.target.value) || 1))}
              disabled={disabled}
              className="text-center text-2xl font-bold"
            />
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-col space-y-1">
            {[set.targetReps - 2, set.targetReps, set.targetReps + 2].filter(val => val > 0).map(presetReps => (
              <button
                key={presetReps}
                type="button"
                onClick={() => setActualReps(presetReps)}
                disabled={disabled}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  actualReps === presetReps
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {presetReps}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Weight Input */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          Weight Used (kg)
        </label>
        
        <div className="flex items-center space-x-3">
          {/* Quick adjustment buttons */}
          <div className="flex flex-col space-y-1">
            <button
              type="button"
              onClick={() => adjustValue(actualWeight, setActualWeight, 2)}
              disabled={disabled}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              +
            </button>
            <button
              type="button"
              onClick={() => adjustValue(actualWeight, setActualWeight, -2)}
              disabled={disabled}
              className="w-8 h-8 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded flex items-center justify-center text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              -
            </button>
          </div>

          {/* Main input */}
          <div className="flex-1">
            <Input
              type="number"
              min="0"
              step="0.5"
              value={actualWeight}
              onChange={(e) => setActualWeight(Math.max(0, parseFloat(e.target.value) || 0))}
              disabled={disabled}
              className="text-center text-2xl font-bold"
            />
          </div>

          {/* Quick preset buttons - common kettlebell weights */}
          <div className="flex flex-col space-y-1">
            {[8, 12, 16, 20, 24, 28, 32].filter(weight => 
              Math.abs(weight - set.targetWeight) <= 8
            ).slice(0, 3).map(presetWeight => (
              <button
                key={presetWeight}
                type="button"
                onClick={() => setActualWeight(presetWeight)}
                disabled={disabled}
                className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
                  actualWeight === presetWeight
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {presetWeight}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Rest Time Display */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-700 dark:text-blue-300">
            Rest Time After This Set:
          </span>
          <span className="text-lg font-semibold text-blue-900 dark:text-blue-200">
            {Math.floor(set.restTime / 60)}:{(set.restTime % 60).toString().padStart(2, '0')}
          </span>
        </div>
      </div>

      {/* Complete Set Button */}
      <div className="pt-4">
        <Button
          onClick={handleComplete}
          loading={isCompleting}
          disabled={disabled || actualReps <= 0 || actualWeight < 0}
          className="w-full"
          size="lg"
        >
          {set.completed ? 'Update Set' : 'Complete Set'}
        </Button>
      </div>

      {/* Performance Tips */}
      {performance.status !== 'on-target' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
          <div className="text-sm text-yellow-800 dark:text-yellow-200">
            {performance.status === 'exceeded' ? (
              <>
                <strong>Great work!</strong> You exceeded your target. Consider increasing the target for next time.
              </>
            ) : (
              <>
                <strong>No worries!</strong> Form is more important than hitting exact numbers. Focus on quality reps.
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};