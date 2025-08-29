import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import { Timer } from './Timer';
import { SetTracker } from './SetTracker';
import { db } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import type { Workout, Exercise, Set, ExerciseType } from '../../types/workout';
import toast from 'react-hot-toast';

interface WorkoutSession {
  id: string;
  workoutId: string;
  startTime: Date;
  currentExerciseIndex: number;
  currentSetIndex: number;
  isPaused: boolean;
  totalRestTime: number;
  completedSets: Set[];
  notes: string;
}

interface WorkoutExecutorProps {
  workoutId: string;
  onComplete: () => void;
  onExit: () => void;
}

export const WorkoutExecutor: React.FC<WorkoutExecutorProps> = ({
  workoutId,
  onComplete,
  onExit
}) => {
  const { user } = useAuthStore(); // Used for session management
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [session, setSession] = useState<WorkoutSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTimer, setCurrentTimer] = useState<'rest' | 'exercise' | null>(null);
  const [restTime, setRestTime] = useState(0);
  const [isWorkoutPaused, setIsWorkoutPaused] = useState(false);

  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    loadWorkout();
    
    // Setup auto-save every 30 seconds
    autoSaveIntervalRef.current = setInterval(() => {
      if (session) {
        saveProgress();
      }
    }, 30000);

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [workoutId]);

  useEffect(() => {
    // Save progress when session updates
    if (session) {
      saveProgress();
    }
  }, [session]);

  const loadWorkout = async () => {
    if (!user) {
      toast.error('User not authenticated');
      onExit();
      return;
    }

    try {
      setIsLoading(true);
      
      const [workoutData, exerciseTypesData] = await Promise.all([
        db.workouts.get(workoutId),
        db.exerciseTypes.toArray()
      ]);

      if (!workoutData) {
        toast.error('Workout not found');
        onExit();
        return;
      }

      setWorkout(workoutData);
      setExerciseTypes(exerciseTypesData);

      // Initialize or restore session
      const existingSession = localStorage.getItem(`workout_session_${workoutId}`);
      if (existingSession) {
        try {
          const parsedSession = JSON.parse(existingSession);
          setSession({
            ...parsedSession,
            startTime: new Date(parsedSession.startTime)
          });
        } catch (error) {
          console.warn('Failed to restore session:', error);
          initializeSession(workoutData);
        }
      } else {
        initializeSession(workoutData);
      }
    } catch (error) {
      console.error('Failed to load workout:', error);
      toast.error('Failed to load workout');
      onExit();
    } finally {
      setIsLoading(false);
    }
  };

  const initializeSession = (workout: Workout) => {
    const newSession: WorkoutSession = {
      id: crypto.randomUUID(),
      workoutId: workout.id,
      startTime: new Date(),
      currentExerciseIndex: 0,
      currentSetIndex: 0,
      isPaused: false,
      totalRestTime: 0,
      completedSets: [],
      notes: ''
    };

    setSession(newSession);
  };

  const saveProgress = async () => {
    if (!session || !workout) return;

    try {
      // Save to localStorage for recovery
      localStorage.setItem(`workout_session_${workoutId}`, JSON.stringify(session));

      // Update workout in database
      const updatedExercises = workout.exercises.map(exercise => ({
        ...exercise,
        sets: exercise.sets.map(set => {
          const completedSet = session.completedSets.find(cs => cs.id === set.id);
          return completedSet ? completedSet : set;
        })
      }));

      await db.workouts.update(workoutId, {
        exercises: updatedExercises,
        notes: session.notes,
        updatedAt: new Date()
      });
    } catch (error) {
      console.warn('Auto-save failed:', error);
    }
  };

  const getCurrentExercise = (): Exercise | null => {
    if (!workout || !session) return null;
    return workout.exercises[session.currentExerciseIndex] || null;
  };

  const getCurrentSet = (): Set | null => {
    const exercise = getCurrentExercise();
    if (!exercise || !session) return null;
    return exercise.sets[session.currentSetIndex] || null;
  };

  const getCurrentExerciseType = (): ExerciseType | null => {
    const exercise = getCurrentExercise();
    if (!exercise) return null;
    return exerciseTypes.find(et => et.id === exercise.exerciseType) || null;
  };

  const completeSet = async (actualReps: number, actualWeight: number) => {
    if (!session || !workout) return;

    const currentSet = getCurrentSet();
    if (!currentSet) return;

    const completedSet: Set = {
      ...currentSet,
      actualReps,
      actualWeight,
      completed: true,
      endTime: new Date()
    };

    const updatedCompletedSets = [
      ...session.completedSets.filter(cs => cs.id !== currentSet.id),
      completedSet
    ];

    setSession(prev => prev ? {
      ...prev,
      completedSets: updatedCompletedSets
    } : null);

    // Start rest timer if not the last set of the exercise
    const exercise = getCurrentExercise();
    if (exercise && session.currentSetIndex < exercise.sets.length - 1) {
      setRestTime(currentSet.restTime);
      setCurrentTimer('rest');
    } else {
      // Move to next exercise or complete workout
      moveToNextExercise();
    }

    toast.success('Set completed!');
  };

  const moveToNextSet = () => {
    if (!session || !workout) return;

    const exercise = getCurrentExercise();
    if (!exercise) return;

    if (session.currentSetIndex < exercise.sets.length - 1) {
      setSession(prev => prev ? {
        ...prev,
        currentSetIndex: prev.currentSetIndex + 1
      } : null);
    } else {
      moveToNextExercise();
    }

    setCurrentTimer(null);
  };

  const moveToNextExercise = () => {
    if (!session || !workout) return;

    if (session.currentExerciseIndex < workout.exercises.length - 1) {
      setSession(prev => prev ? {
        ...prev,
        currentExerciseIndex: prev.currentExerciseIndex + 1,
        currentSetIndex: 0
      } : null);
      setCurrentTimer(null);
      toast.success('Moving to next exercise');
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = async () => {
    if (!session || !workout) return;

    try {
      const endTime = new Date();
      const duration = Math.round((endTime.getTime() - session.startTime.getTime()) / 1000 / 60); // minutes

      await db.workouts.update(workoutId, {
        duration,
        completedAt: endTime,
        notes: session.notes,
        updatedAt: endTime
      });

      // Clear session storage
      localStorage.removeItem(`workout_session_${workoutId}`);

      toast.success('Workout completed! 🎉');
      onComplete();
    } catch (error) {
      console.error('Failed to complete workout:', error);
      toast.error('Failed to save workout completion');
    }
  };

  const pauseWorkout = () => {
    setIsWorkoutPaused(true);
    setSession(prev => prev ? { ...prev, isPaused: true } : null);
  };

  const resumeWorkout = () => {
    setIsWorkoutPaused(false);
    setSession(prev => prev ? { ...prev, isPaused: false } : null);
  };

  const handleRestComplete = () => {
    setCurrentTimer(null);
    moveToNextSet();
  };

  const skipRest = () => {
    setCurrentTimer(null);
    moveToNextSet();
  };

  const getWorkoutProgress = (): { completed: number; total: number } => {
    if (!workout || !session) return { completed: 0, total: 0 };

    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const completedSets = session.completedSets.filter(cs => cs.completed).length;

    return { completed: completedSets, total: totalSets };
  };

  const getExerciseProgress = (): { completed: number; total: number } => {
    if (!workout || !session) return { completed: 0, total: 0 };

    return {
      completed: session.currentExerciseIndex + 1,
      total: workout.exercises.length
    };
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading workout...</p>
        </div>
      </div>
    );
  }

  if (!workout || !session) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 dark:text-red-400 mb-4">Failed to load workout</p>
          <Button onClick={onExit}>Return to Dashboard</Button>
        </div>
      </div>
    );
  }

  const currentExercise = getCurrentExercise();
  const currentSet = getCurrentSet();
  const currentExerciseType = getCurrentExerciseType();
  const workoutProgress = getWorkoutProgress();
  const exerciseProgress = getExerciseProgress();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {workout.templateName || 'Workout Session'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Started {session.startTime.toLocaleTimeString()}
              </p>
            </div>
            <div className="flex space-x-2">
              {!isWorkoutPaused ? (
                <Button variant="outline" onClick={pauseWorkout}>
                  Pause
                </Button>
              ) : (
                <Button onClick={resumeWorkout}>
                  Resume
                </Button>
              )}
              <Button variant="outline" onClick={onExit}>
                Exit
              </Button>
            </div>
          </div>

          {/* Progress Bars */}
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Workout Progress</span>
                <span>{workoutProgress.completed}/{workoutProgress.total} sets</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(workoutProgress.completed / workoutProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Exercise Progress</span>
                <span>{exerciseProgress.completed}/{exerciseProgress.total} exercises</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(exerciseProgress.completed / exerciseProgress.total) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Current Exercise */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            {currentExercise && currentExerciseType && currentSet && (
              <>
                <div className="mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {currentExerciseType.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {currentExerciseType.description}
                  </p>
                  
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Set {session.currentSetIndex + 1} of {currentExercise.sets.length}
                  </div>

                  {/* Exercise Instructions */}
                  {currentExerciseType.instructions.length > 0 && (
                    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
                      <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Instructions:
                      </h3>
                      <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                        {currentExerciseType.instructions.map((instruction, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-primary-500 mr-2">•</span>
                            {instruction}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <SetTracker
                  set={currentSet}
                  onComplete={completeSet}
                  disabled={isWorkoutPaused || currentTimer === 'rest'}
                />
              </>
            )}
          </div>

          {/* Timer Section */}
          <div className="space-y-6">
            {currentTimer === 'rest' && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Timer
                  initialTime={restTime}
                  type="rest"
                  isActive={!isWorkoutPaused}
                  onComplete={handleRestComplete}
                  title="Rest Period"
                  autoStart={true}
                />
                <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                  <Button
                    variant="outline"
                    onClick={skipRest}
                    className="w-full"
                  >
                    Skip Rest
                  </Button>
                </div>
              </div>
            )}

            {/* Workout Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Session Summary
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Duration:</span>
                  <span className="text-gray-900 dark:text-white">
                    {Math.round((new Date().getTime() - session.startTime.getTime()) / 1000 / 60)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sets Completed:</span>
                  <span className="text-gray-900 dark:text-white">
                    {session.completedSets.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Current Exercise:</span>
                  <span className="text-gray-900 dark:text-white">
                    {session.currentExerciseIndex + 1} of {workout.exercises.length}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Notes:
                </label>
                <textarea
                  value={session.notes}
                  onChange={(e) => setSession(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="Add notes about your workout..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  rows={3}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Workout Complete Button */}
        {workoutProgress.completed === workoutProgress.total && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
            <h2 className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
              🎉 Workout Complete!
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Congratulations on completing your workout!
            </p>
            <Button onClick={completeWorkout} size="lg">
              Finish Workout
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};