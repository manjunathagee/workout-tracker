import React, { useState } from 'react';
import type { ExerciseType } from '../../types/workout';
import type { PersonalRecord } from '../../utils/analytics';
import { formatDistanceToNow } from 'date-fns';
import { calculateOneRepMax } from '../../utils/analytics';

interface PersonalRecordsProps {
  records: PersonalRecord[];
  exerciseTypes: ExerciseType[];
}

type RecordFilter = 'all' | 'maxWeight' | 'maxReps' | 'maxVolume';

const recordTypeLabels = {
  maxWeight: 'Max Weight',
  maxReps: 'Max Reps',
  maxVolume: 'Max Volume'
};

const recordTypeColors = {
  maxWeight: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
  maxReps: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
  maxVolume: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
};

export const PersonalRecords: React.FC<PersonalRecordsProps> = ({
  records,
  exerciseTypes
}) => {
  const [filter, setFilter] = useState<RecordFilter>('all');
  const [showAll, setShowAll] = useState(false);

  const filteredRecords = records.filter(record => 
    filter === 'all' || record.type === filter
  );

  const displayRecords = showAll ? filteredRecords : filteredRecords.slice(0, 5);

  const formatRecordValue = (record: PersonalRecord): string => {
    switch (record.type) {
      case 'maxWeight':
        return `${record.value}kg`;
      case 'maxReps':
        return `${record.value} reps`;
      case 'maxVolume':
        return `${Math.round(record.value)}kg`;
      default:
        return record.value.toString();
    }
  };

  const getExerciseType = (exerciseId: string): ExerciseType | undefined => {
    return exerciseTypes.find(et => et.id === exerciseId);
  };

  if (records.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No records yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete more workouts to establish your personal records.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Records' },
          { key: 'maxWeight', label: 'Max Weight' },
          { key: 'maxReps', label: 'Max Reps' },
          { key: 'maxVolume', label: 'Max Volume' }
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key as RecordFilter)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filter === key
                ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Records List */}
      <div className="space-y-3">
        {displayRecords.map((record, index) => {
          const exerciseType = getExerciseType(record.exerciseId);
          const oneRepMax = record.type === 'maxWeight' && exerciseType
            ? calculateOneRepMax(record.value, 1) // Assume 1 rep for max weight records
            : null;

          return (
            <div 
              key={`${record.exerciseId}-${record.type}-${index}`}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                {/* Record Type Badge */}
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  recordTypeColors[record.type]
                }`}>
                  {recordTypeLabels[record.type]}
                </div>

                {/* Exercise Info */}
                <div>
                  <div className="font-medium text-gray-900 dark:text-white text-sm">
                    {record.exerciseName}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {formatDistanceToNow(record.date)} ago
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="font-semibold text-gray-900 dark:text-white">
                  {formatRecordValue(record)}
                </div>
                {oneRepMax && record.type === 'maxWeight' && (
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ~{oneRepMax}kg 1RM
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show More/Less Button */}
      {filteredRecords.length > 5 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium py-2"
        >
          {showAll ? 'Show Less' : `Show ${filteredRecords.length - 5} More Records`}
        </button>
      )}

      {/* Record Statistics */}
      {records.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
            Record Breakdown
          </h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            {Object.entries(recordTypeLabels).map(([type, label]) => {
              const count = records.filter(r => r.type === type).length;
              return (
                <div key={type} className="text-center">
                  <div className="text-lg font-semibold text-gray-900 dark:text-white">
                    {count}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent PR Alert */}
      {records.length > 0 && (() => {
        const recentRecord = records
          .sort((a, b) => b.date.getTime() - a.date.getTime())[0];
        const daysSinceLastPR = Math.floor(
          (new Date().getTime() - recentRecord.date.getTime()) / (24 * 60 * 60 * 1000)
        );

        if (daysSinceLastPR <= 7) {
          return (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-200">
                    Recent Personal Record!
                  </div>
                  <div className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {recentRecord.exerciseName} - {formatRecordValue(recentRecord)} ({daysSinceLastPR === 0 ? 'Today' : `${daysSinceLastPR} days ago`})
                  </div>
                </div>
              </div>
            </div>
          );
        }
        return null;
      })()}
    </div>
  );
};