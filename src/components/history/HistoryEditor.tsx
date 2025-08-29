import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { WorkoutEditor } from './WorkoutEditor';
import { db } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import type { Workout, ExerciseType } from '../../types/workout';
import { formatDistanceToNow, format } from 'date-fns';
import toast from 'react-hot-toast';

interface HistoryEditorProps {
  onClose?: () => void;
}

type SortOption = 'date-desc' | 'date-asc' | 'duration-desc' | 'volume-desc';
type FilterOption = 'all' | 'completed' | 'templates';

export const HistoryEditor: React.FC<HistoryEditorProps> = ({ onClose }) => {
  const { user } = useAuthStore();
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [exerciseTypes, setExerciseTypes] = useState<ExerciseType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingWorkout, setEditingWorkout] = useState<Workout | null>(null);
  const [selectedWorkouts, setSelectedWorkouts] = useState<Set<string>>(new Set());
  
  // Filters and search
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });

  useEffect(() => {
    if (user) {
      loadWorkouts();
    }
  }, [user]);

  const loadWorkouts = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const [workoutsData, exerciseTypesData] = await Promise.all([
        db.workouts.where('userId').equals(user.id).toArray(),
        db.exerciseTypes.toArray()
      ]);

      setWorkouts(workoutsData);
      setExerciseTypes(exerciseTypesData);
    } catch (error) {
      console.error('Failed to load workouts:', error);
      toast.error('Failed to load workout history');
    } finally {
      setIsLoading(false);
    }
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

  const getExerciseTypeName = (exerciseTypeId: string): string => {
    return exerciseTypes.find(et => et.id === exerciseTypeId)?.name || 'Unknown Exercise';
  };

  const filteredAndSortedWorkouts = React.useMemo(() => {
    let filtered = workouts.filter(workout => {
      // Filter by type
      if (filterBy === 'completed' && workout.isTemplate) return false;
      if (filterBy === 'templates' && !workout.isTemplate) return false;
      
      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = workout.templateName?.toLowerCase().includes(searchLower);
        const matchesExercises = workout.exercises.some(ex => 
          getExerciseTypeName(ex.exerciseType).toLowerCase().includes(searchLower)
        );
        const matchesNotes = workout.notes?.toLowerCase().includes(searchLower);
        
        if (!matchesName && !matchesExercises && !matchesNotes) return false;
      }
      
      // Filter by date range
      if (dateRange.start && workout.date < new Date(dateRange.start)) return false;
      if (dateRange.end && workout.date > new Date(dateRange.end)) return false;
      
      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-desc':
          return b.date.getTime() - a.date.getTime();
        case 'date-asc':
          return a.date.getTime() - b.date.getTime();
        case 'duration-desc':
          return (b.duration || 0) - (a.duration || 0);
        case 'volume-desc':
          return calculateWorkoutVolume(b) - calculateWorkoutVolume(a);
        default:
          return 0;
      }
    });

    return filtered;
  }, [workouts, searchTerm, sortBy, filterBy, dateRange, exerciseTypes]);

  const handleSelectWorkout = (workoutId: string, checked: boolean) => {
    const newSelected = new Set(selectedWorkouts);
    if (checked) {
      newSelected.add(workoutId);
    } else {
      newSelected.delete(workoutId);
    }
    setSelectedWorkouts(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedWorkouts(new Set(filteredAndSortedWorkouts.map(w => w.id)));
    } else {
      setSelectedWorkouts(new Set());
    }
  };

  const handleBulkDelete = async () => {
    if (selectedWorkouts.size === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${selectedWorkouts.size} workout(s)? This action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      await db.workouts.bulkDelete(Array.from(selectedWorkouts));
      setWorkouts(prev => prev.filter(w => !selectedWorkouts.has(w.id)));
      setSelectedWorkouts(new Set());
      toast.success(`Deleted ${selectedWorkouts.size} workout(s)`);
    } catch (error) {
      console.error('Failed to delete workouts:', error);
      toast.error('Failed to delete workouts');
    }
  };

  const handleBulkDuplicate = async () => {
    if (selectedWorkouts.size === 0) return;

    try {
      const workoutsToDuplicate = workouts.filter(w => selectedWorkouts.has(w.id));
      const duplicatedWorkouts: Workout[] = [];

      for (const workout of workoutsToDuplicate) {
        const duplicated: Workout = {
          ...workout,
          id: crypto.randomUUID(),
          templateName: workout.templateName ? `${workout.templateName} (Copy)` : undefined,
          date: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          completedAt: undefined,
          exercises: workout.exercises.map(ex => ({
            ...ex,
            id: crypto.randomUUID(),
            workoutId: crypto.randomUUID(),
            sets: ex.sets.map(set => ({
              ...set,
              id: crypto.randomUUID(),
              exerciseId: crypto.randomUUID(),
              completed: false,
              actualReps: undefined,
              actualWeight: undefined,
              startTime: undefined,
              endTime: undefined
            }))
          }))
        };
        
        duplicatedWorkouts.push(duplicated);
      }

      await db.workouts.bulkAdd(duplicatedWorkouts);
      setWorkouts(prev => [...duplicatedWorkouts, ...prev]);
      setSelectedWorkouts(new Set());
      toast.success(`Duplicated ${duplicatedWorkouts.length} workout(s)`);
    } catch (error) {
      console.error('Failed to duplicate workouts:', error);
      toast.error('Failed to duplicate workouts');
    }
  };

  const handleDeleteWorkout = async (workoutId: string) => {
    const confirmed = confirm('Are you sure you want to delete this workout?');
    if (!confirmed) return;

    try {
      await db.workouts.delete(workoutId);
      setWorkouts(prev => prev.filter(w => w.id !== workoutId));
      toast.success('Workout deleted');
    } catch (error) {
      console.error('Failed to delete workout:', error);
      toast.error('Failed to delete workout');
    }
  };

  const handleWorkoutUpdated = (updatedWorkout: Workout) => {
    setWorkouts(prev => prev.map(w => w.id === updatedWorkout.id ? updatedWorkout : w));
    setEditingWorkout(null);
    toast.success('Workout updated');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 dark:text-gray-400">Loading workout history...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Workout History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            View and edit your workout history
          </p>
        </div>
        {onClose && (
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <Input
              placeholder="Search workouts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filter */}
          <div>
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as FilterOption)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All Workouts</option>
              <option value="completed">Completed Only</option>
              <option value="templates">Templates Only</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="duration-desc">Longest Duration</option>
              <option value="volume-desc">Highest Volume</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex space-x-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedWorkouts.size > 0 && (
          <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {selectedWorkouts.size} workout{selectedWorkouts.size !== 1 ? 's' : ''} selected
            </div>
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleBulkDuplicate}>
                Duplicate Selected
              </Button>
              <Button size="sm" variant="danger" onClick={handleBulkDelete}>
                Delete Selected
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results Summary */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredAndSortedWorkouts.length} of {workouts.length} workouts
      </div>

      {/* Workouts List */}
      {filteredAndSortedWorkouts.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No workouts found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your search criteria or create some workouts first.
          </p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {/* Table Header */}
          <div className="px-6 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={selectedWorkouts.size === filteredAndSortedWorkouts.length && filteredAndSortedWorkouts.length > 0}
                onChange={(e) => handleSelectAll(e.target.checked)}
                className="mr-4"
              />
              <div className="grid grid-cols-12 gap-4 w-full text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-3">Workout</div>
                <div className="col-span-2">Date</div>
                <div className="col-span-2">Duration</div>
                <div className="col-span-2">Exercises</div>
                <div className="col-span-2">Volume</div>
                <div className="col-span-1">Actions</div>
              </div>
            </div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredAndSortedWorkouts.map((workout) => {
              const workoutVolume = calculateWorkoutVolume(workout);
              const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
              
              return (
                <div key={workout.id} className="px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={selectedWorkouts.has(workout.id)}
                      onChange={(e) => handleSelectWorkout(workout.id, e.target.checked)}
                      className="mr-4"
                    />
                    <div className="grid grid-cols-12 gap-4 w-full text-sm">
                      <div className="col-span-3">
                        <div className="font-medium text-gray-900 dark:text-white">
                          {workout.templateName || 'Custom Workout'}
                        </div>
                        <div className="text-gray-500 dark:text-gray-400">
                          {workout.isTemplate ? 'Template' : 'Completed'}
                        </div>
                      </div>
                      <div className="col-span-2 text-gray-900 dark:text-white">
                        <div>{format(workout.date, 'MMM d, yyyy')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDistanceToNow(workout.date)} ago
                        </div>
                      </div>
                      <div className="col-span-2 text-gray-900 dark:text-white">
                        {workout.duration ? `${workout.duration}min` : 'N/A'}
                      </div>
                      <div className="col-span-2 text-gray-900 dark:text-white">
                        {workout.exercises.length} exercises, {totalSets} sets
                      </div>
                      <div className="col-span-2 text-gray-900 dark:text-white">
                        {Math.round(workoutVolume)}kg
                      </div>
                      <div className="col-span-1">
                        <div className="flex space-x-1">
                          <button
                            onClick={() => setEditingWorkout(workout)}
                            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteWorkout(workout.id)}
                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Workout Editor Modal */}
      {editingWorkout && (
        <WorkoutEditor
          workout={editingWorkout}
          exerciseTypes={exerciseTypes}
          onSave={handleWorkoutUpdated}
          onClose={() => setEditingWorkout(null)}
        />
      )}
    </div>
  );
};