import React, { useState } from 'react';
import { WorkoutTemplates } from '../components/workout/WorkoutTemplates';
import { WorkoutExecutor } from '../components/workout/WorkoutExecutor';
import { NotificationSystem } from '../components/workout/NotificationSystem';

type WorkoutPageView = 'templates' | 'execution';

export const WorkoutPage: React.FC = () => {
  const [currentView, setCurrentView] = useState<WorkoutPageView>('templates');
  const [executingWorkoutId, setExecutingWorkoutId] = useState<string | null>(null);

  // Currently not used but keeping for future workout start functionality
  // const handleStartWorkout = (workoutId: string) => {
  //   setExecutingWorkoutId(workoutId);
  //   setCurrentView('execution');
  // };

  const handleWorkoutComplete = () => {
    setExecutingWorkoutId(null);
    setCurrentView('templates');
  };

  const handleExitWorkout = () => {
    setExecutingWorkoutId(null);
    setCurrentView('templates');
  };

  if (currentView === 'execution' && executingWorkoutId) {
    return (
      <WorkoutExecutor
        workoutId={executingWorkoutId}
        onComplete={handleWorkoutComplete}
        onExit={handleExitWorkout}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Workouts
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your workout templates and track your sessions
          </p>
        </div>
        
        {/* Notification Settings */}
        <div className="flex space-x-4">
          <NotificationSystem />
        </div>
      </div>

      {/* Main Content */}
      <WorkoutTemplates />
    </div>
  );
};