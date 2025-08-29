import React, { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { db } from '../../services/database';
import type { Workout, ExerciseType } from '../../types/workout';
import toast from 'react-hot-toast';

interface WorkoutEditorProps {
  workout: Workout;
  exerciseTypes: ExerciseType[];
  onSave: (workout: Workout) => void;
  onClose: () => void;
}

interface WorkoutFormData {
  templateName: string;
  date: string;
  duration: number;
  notes: string;
  exercises: Array<{
    exerciseType: string;
    sets: Array<{
      targetReps: number;
      targetWeight: number;
      actualReps?: number;
      actualWeight?: number;
      restTime: number;
      completed: boolean;
    }>;
  }>;
}

export const WorkoutEditor: React.FC<WorkoutEditorProps> = ({
  workout,
  exerciseTypes,
  onSave,
  onClose
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<WorkoutFormData>({
    defaultValues: {
      templateName: workout.templateName || '',
      date: workout.date.toISOString().split('T')[0],
      duration: workout.duration || 0,
      notes: workout.notes || '',
      exercises: workout.exercises.map(ex => ({
        exerciseType: ex.exerciseType,
        sets: ex.sets.map(set => ({
          targetReps: set.targetReps,
          targetWeight: set.targetWeight,
          actualReps: set.actualReps,
          actualWeight: set.actualWeight,
          restTime: set.restTime,
          completed: set.completed
        }))
      }))
    }
  });

  const { fields: exerciseFields, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercises'
  });
  // appendExercise removed as it's not needed in the editor

  const getExerciseTypeName = (exerciseTypeId: string): string => {
    return exerciseTypes.find(et => et.id === exerciseTypeId)?.name || 'Unknown Exercise';
  };

  const addSet = (exerciseIndex: number) => {
    const currentSets = watch(`exercises.${exerciseIndex}.sets`);
    const lastSet = currentSets[currentSets.length - 1];
    
    setValue(`exercises.${exerciseIndex}.sets`, [
      ...currentSets,
      {
        targetReps: lastSet?.targetReps || 10,
        targetWeight: lastSet?.targetWeight || 16,
        actualReps: undefined,
        actualWeight: undefined,
        restTime: lastSet?.restTime || 60,
        completed: false
      }
    ]);
  };

  const removeSet = (exerciseIndex: number, setIndex: number) => {
    const currentSets = watch(`exercises.${exerciseIndex}.sets`);
    if (currentSets.length > 1) {
      setValue(
        `exercises.${exerciseIndex}.sets`,
        currentSets.filter((_, index) => index !== setIndex)
      );
    }
  };

  const onSubmit = async (data: WorkoutFormData) => {
    setIsLoading(true);
    try {
      const updatedWorkout: Workout = {
        ...workout,
        templateName: data.templateName || undefined,
        date: new Date(data.date),
        duration: data.duration,
        notes: data.notes,
        updatedAt: new Date(),
        exercises: data.exercises.map((exerciseData, exerciseIndex) => {
          const originalExercise = workout.exercises[exerciseIndex];
          return {
            id: originalExercise?.id || crypto.randomUUID(),
            workoutId: workout.id,
            exerciseType: exerciseData.exerciseType,
            order: exerciseIndex + 1,
            sets: exerciseData.sets.map((setData, setIndex) => {
              const originalSet = originalExercise?.sets[setIndex];
              return {
                id: originalSet?.id || crypto.randomUUID(),
                exerciseId: originalExercise?.id || crypto.randomUUID(),
                targetReps: setData.targetReps,
                targetWeight: setData.targetWeight,
                actualReps: setData.actualReps,
                actualWeight: setData.actualWeight,
                restTime: setData.restTime,
                completed: setData.completed,
                order: setIndex + 1,
                startTime: originalSet?.startTime,
                endTime: originalSet?.endTime
              };
            })
          };
        })
      };

      await db.workouts.update(workout.id, {
        ...updatedWorkout,
        exercises: updatedWorkout.exercises
      });
      onSave(updatedWorkout);
      toast.success('Workout updated successfully');
    } catch (error) {
      console.error('Failed to update workout:', error);
      toast.error('Failed to update workout');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateWorkoutVolume = (): number => {
    const exercises = watch('exercises');
    return exercises.reduce((sum, exercise) => {
      return sum + exercise.sets.reduce((setSum, set) => {
        const weight = set.actualWeight || set.targetWeight;
        const reps = set.actualReps || set.targetReps;
        return setSum + (weight * reps);
      }, 0);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Workout
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Modify workout details and exercises
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Workout Name"
                placeholder="Enter workout name"
                error={errors.templateName?.message}
                {...register('templateName')}
              />
              <Input
                label="Date"
                type="date"
                error={errors.date?.message}
                {...register('date', { required: 'Date is required' })}
              />
              <Input
                label="Duration (minutes)"
                type="number"
                min="0"
                error={errors.duration?.message}
                {...register('duration', { 
                  valueAsNumber: true,
                  min: { value: 0, message: 'Duration must be positive' }
                })}
              />
            </div>

            {/* Workout Stats */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                Workout Statistics
              </h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Volume:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {Math.round(calculateWorkoutVolume())}kg
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Exercises:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {exerciseFields.length}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400">Total Sets:</span>
                  <span className="ml-2 font-medium text-gray-900 dark:text-white">
                    {exerciseFields.reduce((sum, _, exerciseIndex) => 
                      sum + (watch(`exercises.${exerciseIndex}.sets`)?.length || 0), 0
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Exercises
                </h3>
              </div>

              {exerciseFields.map((exercise, exerciseIndex) => (
                <div
                  key={exercise.id}
                  className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                      {exerciseIndex + 1}. {getExerciseTypeName(watch(`exercises.${exerciseIndex}.exerciseType`))}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeExercise(exerciseIndex)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm"
                    >
                      Remove Exercise
                    </button>
                  </div>

                  {/* Sets */}
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sets ({watch(`exercises.${exerciseIndex}.sets`)?.length || 0})
                    </div>
                    
                    {watch(`exercises.${exerciseIndex}.sets`)?.map((_, setIndex) => (
                      <div key={setIndex} className="grid grid-cols-6 gap-3 items-center p-3 bg-gray-50 dark:bg-gray-700 rounded">
                        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          Set {setIndex + 1}
                        </div>
                        
                        <Input
                          type="number"
                          placeholder="Target Reps"
                          min="1"
                          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.targetReps` as const, {
                            required: 'Required',
                            valueAsNumber: true,
                            min: { value: 1, message: 'Min 1' }
                          })}
                        />
                        
                        <Input
                          type="number"
                          placeholder="Target Weight"
                          min="0"
                          step="0.5"
                          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.targetWeight` as const, {
                            required: 'Required',
                            valueAsNumber: true,
                            min: { value: 0, message: 'Min 0' }
                          })}
                        />
                        
                        <Input
                          type="number"
                          placeholder="Actual Reps"
                          min="0"
                          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.actualReps` as const, {
                            valueAsNumber: true
                          })}
                        />
                        
                        <Input
                          type="number"
                          placeholder="Actual Weight"
                          min="0"
                          step="0.5"
                          {...register(`exercises.${exerciseIndex}.sets.${setIndex}.actualWeight` as const, {
                            valueAsNumber: true
                          })}
                        />

                        <div className="flex items-center space-x-2">
                          <label className="flex items-center space-x-1">
                            <input
                              type="checkbox"
                              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.completed` as const)}
                              className="rounded"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">Done</span>
                          </label>
                          
                          {watch(`exercises.${exerciseIndex}.sets`).length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeSet(exerciseIndex, setIndex)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => addSet(exerciseIndex)}
                    >
                      Add Set
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes
              </label>
              <textarea
                {...register('notes')}
                rows={3}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add notes about this workout..."
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};