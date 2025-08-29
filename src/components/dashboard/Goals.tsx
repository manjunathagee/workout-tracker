import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { db } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import type { ExerciseType } from '../../types/workout';
import type { Goal } from '../../types/goals';
import toast from 'react-hot-toast';

interface GoalFormData {
  title: string;
  type: 'weight' | 'reps' | 'frequency' | 'duration';
  exerciseId?: string;
  targetValue: number;
  targetDate: string;
  description?: string;
}

export const Goals: React.FC = () => {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    type: 'weight',
    targetValue: 0,
    targetDate: '',
    description: ''
  });

  useEffect(() => {
    if (user) {
      loadGoals();
    }
  }, [user]);

  const loadGoals = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      // Load goals and exercise types
      const [goalsData, exerciseTypesData] = await Promise.all([
        db.goals.where('userId').equals(user.id).toArray(),
        db.exerciseTypes.toArray()
      ]);

      setGoals(goalsData);
      setExerciseTypes(exerciseTypesData);
    } catch (error) {
      console.error('Failed to load goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const newGoal: Goal = {
        id: crypto.randomUUID(),
        userId: user.id,
        type: formData.type,
        exerciseId: formData.exerciseId,
        targetValue: formData.targetValue,
        currentValue: 0,
        targetDate: new Date(formData.targetDate),
        isCompleted: false,
        createdAt: new Date(),
        title: formData.title,
        description: formData.description
      };

      // Add to database
      await db.goals.add(newGoal);
      
      setGoals(prev => [...prev, newGoal]);
      setShowForm(false);
      setFormData({
        title: '',
        type: 'weight',
        targetValue: 0,
        targetDate: '',
        description: ''
      });
      
      toast.success('Goal created successfully!');
    } catch (error) {
      console.error('Failed to create goal:', error);
      toast.error('Failed to create goal');
    }
  };

  const updateGoalProgress = async (goalId: string, newValue: number) => {
    try {
      await db.goals.update(goalId, { 
        currentValue: newValue,
        isCompleted: newValue >= (goals.find(g => g.id === goalId)?.targetValue || 0)
      });
      
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, currentValue: newValue, isCompleted: newValue >= goal.targetValue }
          : goal
      ));

      toast.success('Goal progress updated!');
    } catch (error) {
      console.error('Failed to update goal:', error);
      toast.error('Failed to update goal');
    }
  };

  const deleteGoal = async (goalId: string) => {
    if (!confirm('Are you sure you want to delete this goal?')) return;

    try {
      await db.goals.delete(goalId);
      setGoals(prev => prev.filter(g => g.id !== goalId));
      toast.success('Goal deleted');
    } catch (error) {
      console.error('Failed to delete goal:', error);
      toast.error('Failed to delete goal');
    }
  };

  const getProgressPercentage = (goal: Goal): number => {
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  const getExerciseName = (exerciseId?: string): string => {
    if (!exerciseId) return '';
    return exerciseTypes.find(et => et.id === exerciseId)?.name || 'Unknown Exercise';
  };

  const getDaysUntilTarget = (targetDate: Date): number => {
    const today = new Date();
    const target = new Date(targetDate);
    return Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));
  };

  // Remove unused function - keeping for potential future use
  // const getGoalTypeLabel = (type: Goal['type']): string => {
  //   switch (type) {
  //     case 'weight': return 'Max Weight';
  //     case 'reps': return 'Max Reps';
  //     case 'frequency': return 'Workout Frequency';
  //     case 'duration': return 'Workout Duration';
  //     default: return type;
  //   }
  // };

  const formatGoalValue = (goal: Goal): string => {
    switch (goal.type) {
      case 'weight':
        return `${goal.currentValue}/${goal.targetValue}kg`;
      case 'reps':
        return `${goal.currentValue}/${goal.targetValue} reps`;
      case 'frequency':
        return `${goal.currentValue}/${goal.targetValue} per week`;
      case 'duration':
        return `${goal.currentValue}/${goal.targetValue} min`;
      default:
        return `${goal.currentValue}/${goal.targetValue}`;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {goals.length} active goal{goals.length !== 1 ? 's' : ''}
        </span>
        <Button
          size="sm"
          onClick={() => setShowForm(true)}
        >
          Add Goal
        </Button>
      </div>

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No goals set
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Set your first fitness goal to stay motivated.
          </p>
          <Button onClick={() => setShowForm(true)}>
            Create Your First Goal
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map(goal => {
            const progress = getProgressPercentage(goal);
            const daysLeft = getDaysUntilTarget(goal.targetDate);
            
            return (
              <div
                key={goal.id}
                className={`p-4 rounded-lg border ${
                  goal.isCompleted
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {goal.title}
                    </h4>
                    {goal.exerciseId && (
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {getExerciseName(goal.exerciseId)}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!goal.isCompleted && (
                      <button
                        onClick={() => {
                          const newValue = prompt(
                            `Update progress for "${goal.title}":`,
                            goal.currentValue.toString()
                          );
                          if (newValue !== null) {
                            updateGoalProgress(goal.id, parseFloat(newValue) || 0);
                          }
                        }}
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs"
                      >
                        Update
                      </button>
                    )}
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-xs"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">
                      {formatGoalValue(goal)}
                    </span>
                    <span className={`font-medium ${
                      goal.isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : daysLeft < 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {goal.isCompleted
                        ? '✓ Completed!'
                        : daysLeft < 0
                        ? `${Math.abs(daysLeft)} days overdue`
                        : `${daysLeft} days left`
                      }
                    </span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        goal.isCompleted
                          ? 'bg-green-500'
                          : progress > 75
                          ? 'bg-blue-500'
                          : progress > 50
                          ? 'bg-yellow-500'
                          : 'bg-gray-400'
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {progress}% complete
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goal Creation Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Create New Goal
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Goal Title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="e.g., Press 24kg kettlebell"
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Goal Type
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="weight">Max Weight</option>
                  <option value="reps">Max Reps</option>
                  <option value="frequency">Workout Frequency</option>
                  <option value="duration">Workout Duration</option>
                </select>
              </div>

              {(formData.type === 'weight' || formData.type === 'reps') && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Exercise (Optional)
                  </label>
                  <select
                    value={formData.exerciseId || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, exerciseId: e.target.value || undefined }))}
                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="">General Goal</option>
                    {exerciseTypes.map(exercise => (
                      <option key={exercise.id} value={exercise.id}>
                        {exercise.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <Input
                label="Target Value"
                type="number"
                min="1"
                value={formData.targetValue}
                onChange={(e) => setFormData(prev => ({ ...prev, targetValue: parseFloat(e.target.value) || 0 }))}
                required
                placeholder={
                  formData.type === 'weight' ? '24' :
                  formData.type === 'reps' ? '10' :
                  formData.type === 'frequency' ? '3' : '45'
                }
              />

              <Input
                label="Target Date"
                type="date"
                value={formData.targetDate}
                onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                required
                min={new Date().toISOString().split('T')[0]}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={2}
                  className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="Additional details about your goal..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Goal
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};