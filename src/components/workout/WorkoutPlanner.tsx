import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { ExerciseSelector } from './ExerciseSelector';
import { db } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import type { Workout, Exercise, ExerciseType } from '../../types/workout';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

interface WorkoutPlannerForm {
  templateName: string;
  exercises: Array<{
    exerciseTypeId: string;
    sets: Array<{
      targetReps: number;
      targetWeight: number;
      restTime: number;
    }>;
  }>;
}

interface WorkoutPlannerProps {
  onClose: () => void;
  existingTemplate?: Workout;
}

export const WorkoutPlanner: React.FC<WorkoutPlannerProps> = ({ 
  onClose, 
  existingTemplate 
}) => {
  const { user } = useAuthStore();
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  // Remove unused state - keeping for potential future use
  // const [selectedExerciseType, setSelectedExerciseType] = useState<ExerciseType | null>(null);
  const [isExerciseSelectorOpen, setIsExerciseSelectorOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<WorkoutPlannerForm>({
    defaultValues: {
      templateName: existingTemplate?.templateName || '',
      exercises: existingTemplate?.exercises?.map(ex => ({
        exerciseTypeId: ex.exerciseType,
        sets: ex.sets.map(set => ({
          targetReps: set.targetReps,
          targetWeight: set.targetWeight,
          restTime: set.restTime
        }))
      })) || []
    }
  });

  const { fields: exerciseFields, append: appendExercise, remove: removeExercise } = useFieldArray({
    control,
    name: 'exercises'
  });

  useEffect(() => {
    loadExerciseTypes();
  }, []);

  const loadExerciseTypes = async () => {
    try {
      const types = await db.exerciseTypes.toArray();
      setExerciseTypes(types);
    } catch (error) {
      console.error('Failed to load exercise types:', error);
      toast.error('Failed to load exercises');
    }
  };

  const handleAddExercise = (exerciseType: ExerciseType) => {
    appendExercise({
      exerciseTypeId: exerciseType.id,
      sets: [{
        targetReps: 10,
        targetWeight: 16, // Default 16kg kettlebell
        restTime: 60
      }]
    });
    setIsExerciseSelectorOpen(false);
  };

  const handleAddSet = (exerciseIndex: number) => {
    // const currentExercise = exerciseFields[exerciseIndex]; // Not needed for current implementation
    const lastSet = watch(`exercises.${exerciseIndex}.sets`).slice(-1)[0];
    
    setValue(`exercises.${exerciseIndex}.sets`, [
      ...watch(`exercises.${exerciseIndex}.sets`),
      {
        targetReps: lastSet?.targetReps || 10,
        targetWeight: lastSet?.targetWeight || 16,
        restTime: lastSet?.restTime || 60
      }
    ]);
  };

  const handleRemoveSet = (exerciseIndex: number, setIndex: number) => {
    const currentSets = watch(`exercises.${exerciseIndex}.sets`);
    if (currentSets.length > 1) {
      setValue(
        `exercises.${exerciseIndex}.sets`,
        currentSets.filter((_, index) => index !== setIndex)
      );
    }
  };

  const onSubmit = async (data: WorkoutPlannerForm) => {
    if (!user) return;

    setIsLoading(true);
    try {
      const workoutId = existingTemplate?.id || uuidv4();
      
      const exercises: Exercise[] = data.exercises.map((exerciseData, index) => ({
        id: uuidv4(),
        workoutId,
        exerciseType: exerciseData.exerciseTypeId,
        order: index + 1,
        sets: exerciseData.sets.map((setData, setIndex) => ({
          id: uuidv4(),
          exerciseId: uuidv4(), // This will be updated after exercise is created
          targetReps: setData.targetReps,
          targetWeight: setData.targetWeight,
          restTime: setData.restTime,
          completed: false,
          order: setIndex + 1
        }))
      }));

      const workout: Workout = {
        id: workoutId,
        userId: user.id,
        date: new Date(),
        duration: 0,
        exercises,
        isTemplate: true,
        templateName: data.templateName,
        createdAt: existingTemplate?.createdAt || new Date(),
        updatedAt: new Date()
      };

      if (existingTemplate) {
        await db.workouts.update(workoutId, {
          ...workout,
          exercises: workout.exercises
        });
        toast.success('Template updated successfully');
      } else {
        await db.workouts.add(workout);
        toast.success('Template created successfully');
      }

      onClose();
    } catch (error) {
      console.error('Failed to save template:', error);
      toast.error('Failed to save template');
    } finally {
      setIsLoading(false);
    }
  };

  const getExerciseTypeName = (exerciseTypeId: string) => {
    const exerciseType = exerciseTypes.find(et => et.id === exerciseTypeId);
    return exerciseType?.name || 'Unknown Exercise';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {existingTemplate ? 'Edit Template' : 'Create Workout Template'}
            </h2>
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

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          <Input
            label="Template Name"
            placeholder="Enter template name"
            error={errors.templateName?.message}
            {...register('templateName', {
              required: 'Template name is required',
              minLength: {
                value: 2,
                message: 'Template name must be at least 2 characters'
              }
            })}
          />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Exercises
              </h3>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setIsExerciseSelectorOpen(true)}
              >
                Add Exercise
              </Button>
            </div>

            {exerciseFields.length === 0 ? (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                No exercises added yet. Click "Add Exercise" to get started.
              </div>
            ) : (
              <div className="space-y-6">
                {exerciseFields.map((exercise, exerciseIndex) => (
                  <div
                    key={exercise.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                        {getExerciseTypeName(watch(`exercises.${exerciseIndex}.exerciseTypeId`))}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeExercise(exerciseIndex)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>

                    <div className="space-y-3">
                      {watch(`exercises.${exerciseIndex}.sets`)?.map((_, setIndex) => (
                        <div key={setIndex} className="flex items-center space-x-3">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                            Set {setIndex + 1}
                          </span>
                          
                          <div className="flex-1 grid grid-cols-3 gap-3">
                            <Input
                              type="number"
                              placeholder="Reps"
                              label="Target Reps"
                              min="1"
                              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.targetReps` as const, {
                                required: 'Reps required',
                                min: { value: 1, message: 'Must be at least 1' },
                                valueAsNumber: true
                              })}
                            />
                            
                            <Input
                              type="number"
                              placeholder="Weight (kg)"
                              label="Weight (kg)"
                              min="0"
                              step="0.5"
                              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.targetWeight` as const, {
                                required: 'Weight required',
                                min: { value: 0, message: 'Must be at least 0' },
                                valueAsNumber: true
                              })}
                            />
                            
                            <Input
                              type="number"
                              placeholder="Rest (sec)"
                              label="Rest Time (sec)"
                              min="0"
                              {...register(`exercises.${exerciseIndex}.sets.${setIndex}.restTime` as const, {
                                required: 'Rest time required',
                                min: { value: 0, message: 'Must be at least 0' },
                                valueAsNumber: true
                              })}
                            />
                          </div>

                          {watch(`exercises.${exerciseIndex}.sets`).length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveSet(exerciseIndex, setIndex)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleAddSet(exerciseIndex)}
                      >
                        Add Set
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={isLoading}
              disabled={exerciseFields.length === 0}
            >
              {existingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </form>
      </div>

      {isExerciseSelectorOpen && (
        <ExerciseSelector
          exerciseTypes={exerciseTypes}
          onSelect={handleAddExercise}
          onClose={() => setIsExerciseSelectorOpen(false)}
        />
      )}
    </div>
  );
};