import React, { useState } from 'react';
import { Button } from '../common/Button';
import type { Workout, ExerciseType } from '../../types/workout';
import { formatDistanceToNow } from 'date-fns';

interface WorkoutHistoryProps {
  workouts: Workout[];
  exerciseTypes: ExerciseType[];
  showAll?: boolean;
  onEditWorkout?: (workout: Workout) => void;
}

export const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({
  workouts,
  exerciseTypes,
  showAll = false,
  onEditWorkout
}) => {
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(new Set());

  const displayWorkouts = showAll ? workouts : workouts.slice(0, 5);

  const toggleWorkoutExpanded = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const getExerciseTypeName = (exerciseTypeId: string) => {
    return exerciseTypes.find(et => et.id === exerciseTypeId)?.name || 'Unknown Exercise';
  };

  const calculateWorkoutVolume = (workout: Workout): number => {
    return workout.exercises.reduce((sum, exercise) => {
      return sum + exercise.sets.reduce((setSum, set) => {
        const weight = set.actualWeight || set.targetWeight;
        const reps = set.actualReps || set.targetReps;
        return setSum + (weight * reps);
      }, 0);
    }, 0);
  };

  const getWorkoutSummary = (workout: Workout): string => {
    const exerciseNames = workout.exercises.map(ex => getExerciseTypeName(ex.exerciseType));
    const uniqueExercises = Array.from(new Set(exerciseNames));
    
    if (uniqueExercises.length <= 2) {
      return uniqueExercises.join(', ');
    } else {
      return `${uniqueExercises.slice(0, 2).join(', ')} +${uniqueExercises.length - 2} more`;
    }
  };

  if (workouts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-400 dark:text-gray-500 mb-4">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No workouts yet
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete your first workout to see your history here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayWorkouts.map(workout => {
        const isExpanded = expandedWorkouts.has(workout.id);
        const workoutVolume = calculateWorkoutVolume(workout);
        const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
        
        return (
          <div 
            key={workout.id}
            className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Workout Header */}
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <div>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {workout.templateName || 'Custom Workout'}
                    </h3>
                    <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      <span>{formatDistanceToNow(workout.date)} ago</span>
                      <span>•</span>
                      <span>{workout.duration}min</span>
                      <span>•</span>
                      <span>{workout.exercises.length} exercises</span>
                      <span>•</span>
                      <span>{totalSets} sets</span>
                      <span>•</span>
                      <span>{Math.round(workoutVolume)}kg volume</span>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {getWorkoutSummary(workout)}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {onEditWorkout && (
                  <button
                    onClick={() => onEditWorkout(workout)}
                    className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Edit workout"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => toggleWorkoutExpanded(workout.id)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg 
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Expanded Content */}
            {isExpanded && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-4">
                {workout.exercises.map((exercise, exerciseIndex) => (
                  <div key={exercise.id} className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                      {exerciseIndex + 1}. {getExerciseTypeName(exercise.exerciseType)}
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {exercise.sets.map((set, setIndex) => (
                        <div 
                          key={set.id}
                          className={`p-2 rounded border text-xs ${
                            set.completed 
                              ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20' 
                              : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800'
                          }`}
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-gray-700 dark:text-gray-300">
                              Set {setIndex + 1}
                            </span>
                            {set.completed && (
                              <svg className="w-3 h-3 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="text-gray-600 dark:text-gray-400 mt-1">
                            <div>
                              Target: {set.targetReps} reps @ {set.targetWeight}kg
                            </div>
                            {set.completed && (set.actualReps !== undefined && set.actualWeight !== undefined) && (
                              <div className={`${
                                (set.actualReps >= set.targetReps && set.actualWeight >= set.targetWeight) 
                                  ? 'text-green-600 dark:text-green-400' 
                                  : 'text-yellow-600 dark:text-yellow-400'
                              }`}>
                                Actual: {set.actualReps} reps @ {set.actualWeight}kg
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {workout.notes && (
                  <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{workout.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {!showAll && workouts.length > 5 && (
        <div className="text-center pt-4">
          <Button variant="outline" size="sm">
            View All Workouts
          </Button>
        </div>
      )}
    </div>
  );
};