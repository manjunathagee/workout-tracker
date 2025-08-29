import type { Workout, ExerciseType } from '../types/workout';

export interface PersonalRecord {
  exerciseId: string;
  exerciseName: string;
  type: 'maxWeight' | 'maxReps' | 'maxVolume';
  value: number;
  date: Date;
  workoutId: string;
}

export interface WeeklyStats {
  week: string;
  totalVolume: number;
  workoutCount: number;
  averageDuration: number;
  date: Date;
}

export interface DashboardStats {
  totalWorkouts: number;
  totalVolume: number;
  averageWorkoutDuration: number;
  currentStreak: number;
  personalRecords: PersonalRecord[];
  recentWorkouts: Workout[];
  weeklyProgress: WeeklyStats[];
}

export function calculateDashboardStats(
  workouts: Workout[],
  exerciseTypes: ExerciseType[]
): DashboardStats {
  // Sort workouts by date (most recent first)
  const sortedWorkouts = workouts.sort((a, b) => b.date.getTime() - a.date.getTime());
  
  // Basic statistics
  const totalWorkouts = workouts.length;
  const totalDuration = workouts.reduce((sum, w) => sum + (w.duration || 0), 0);
  const averageWorkoutDuration = totalWorkouts > 0 ? totalDuration / totalWorkouts : 0;
  
  // Calculate total volume (weight × reps)
  const totalVolume = workouts.reduce((sum, workout) => {
    return sum + workout.exercises.reduce((exerciseSum, exercise) => {
      return exerciseSum + exercise.sets.reduce((setSum, set) => {
        const weight = set.actualWeight || set.targetWeight;
        const reps = set.actualReps || set.targetReps;
        return setSum + (weight * reps);
      }, 0);
    }, 0);
  }, 0);

  // Calculate current workout streak
  const currentStreak = calculateWorkoutStreak(sortedWorkouts);

  // Get recent workouts (last 5)
  const recentWorkouts = sortedWorkouts.slice(0, 5);

  // Calculate personal records
  const personalRecords = calculatePersonalRecords(workouts, exerciseTypes);

  // Calculate weekly progress
  const weeklyProgress = calculateWeeklyProgress(workouts);

  return {
    totalWorkouts,
    totalVolume,
    averageWorkoutDuration,
    currentStreak,
    personalRecords,
    recentWorkouts,
    weeklyProgress
  };
}

function calculateWorkoutStreak(sortedWorkouts: Workout[]): number {
  if (sortedWorkouts.length === 0) return 0;

  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if we worked out today or yesterday
  const mostRecentWorkout = sortedWorkouts[0];
  const mostRecentDate = new Date(mostRecentWorkout.date);
  mostRecentDate.setHours(0, 0, 0, 0);

  const daysSinceLastWorkout = Math.floor((today.getTime() - mostRecentDate.getTime()) / (24 * 60 * 60 * 1000));
  
  // If it's been more than 1 day since last workout, streak is broken
  if (daysSinceLastWorkout > 1) {
    return 0;
  }

  // Count consecutive days with workouts
  const workoutDates = new Set(
    sortedWorkouts.map(w => {
      const date = new Date(w.date);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  );

  let currentDate = new Date(today);
  
  // If no workout today, start from yesterday
  if (!workoutDates.has(today.getTime())) {
    currentDate.setDate(currentDate.getDate() - 1);
  }

  while (workoutDates.has(currentDate.getTime())) {
    streak++;
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return streak;
}

function calculatePersonalRecords(
  workouts: Workout[],
  exerciseTypes: ExerciseType[]
): PersonalRecord[] {
  const records = new Map<string, { [K in PersonalRecord['type']]: PersonalRecord | null }>();

  // Initialize records map
  exerciseTypes.forEach(exerciseType => {
    records.set(exerciseType.id, {
      maxWeight: null,
      maxReps: null,
      maxVolume: null
    });
  });

  // Process all workouts to find records
  workouts.forEach(workout => {
    workout.exercises.forEach(exercise => {
      const exerciseType = exerciseTypes.find(et => et.id === exercise.exerciseType);
      if (!exerciseType) return;

      const exerciseRecords = records.get(exercise.exerciseType);
      if (!exerciseRecords) return;

      exercise.sets.forEach(set => {
        const weight = set.actualWeight || set.targetWeight;
        const reps = set.actualReps || set.targetReps;
        const volume = weight * reps;

        // Check max weight
        if (!exerciseRecords.maxWeight || weight > exerciseRecords.maxWeight.value) {
          exerciseRecords.maxWeight = {
            exerciseId: exercise.exerciseType,
            exerciseName: exerciseType.name,
            type: 'maxWeight',
            value: weight,
            date: workout.date,
            workoutId: workout.id
          };
        }

        // Check max reps
        if (!exerciseRecords.maxReps || reps > exerciseRecords.maxReps.value) {
          exerciseRecords.maxReps = {
            exerciseId: exercise.exerciseType,
            exerciseName: exerciseType.name,
            type: 'maxReps',
            value: reps,
            date: workout.date,
            workoutId: workout.id
          };
        }

        // Check max volume (single set)
        if (!exerciseRecords.maxVolume || volume > exerciseRecords.maxVolume.value) {
          exerciseRecords.maxVolume = {
            exerciseId: exercise.exerciseType,
            exerciseName: exerciseType.name,
            type: 'maxVolume',
            value: volume,
            date: workout.date,
            workoutId: workout.id
          };
        }
      });
    });
  });

  // Flatten records and return top records across all exercises
  const allRecords: PersonalRecord[] = [];
  records.forEach(exerciseRecords => {
    Object.values(exerciseRecords).forEach(record => {
      if (record) allRecords.push(record);
    });
  });

  // Sort by value and return top records
  return allRecords
    .sort((a, b) => b.value - a.value)
    .slice(0, 10); // Top 10 records
}

function calculateWeeklyProgress(workouts: Workout[]): WeeklyStats[] {
  const weeklyData = new Map<string, {
    totalVolume: number;
    workoutCount: number;
    totalDuration: number;
    date: Date;
  }>();

  workouts.forEach(workout => {
    const workoutDate = new Date(workout.date);
    const weekStart = getWeekStart(workoutDate);
    const weekKey = weekStart.toISOString().split('T')[0];

    if (!weeklyData.has(weekKey)) {
      weeklyData.set(weekKey, {
        totalVolume: 0,
        workoutCount: 0,
        totalDuration: 0,
        date: weekStart
      });
    }

    const weekData = weeklyData.get(weekKey)!;
    weekData.workoutCount++;
    weekData.totalDuration += workout.duration || 0;

    // Calculate workout volume
    const workoutVolume = workout.exercises.reduce((sum, exercise) => {
      return sum + exercise.sets.reduce((setSum, set) => {
        const weight = set.actualWeight || set.targetWeight;
        const reps = set.actualReps || set.targetReps;
        return setSum + (weight * reps);
      }, 0);
    }, 0);
    
    weekData.totalVolume += workoutVolume;
  });

  // Convert to WeeklyStats array and sort by date
  const weeklyStats: WeeklyStats[] = Array.from(weeklyData.entries()).map(([, data]) => ({
    week: formatWeekLabel(data.date),
    totalVolume: data.totalVolume,
    workoutCount: data.workoutCount,
    averageDuration: data.workoutCount > 0 ? data.totalDuration / data.workoutCount : 0,
    date: data.date
  }));

  return weeklyStats.sort((a, b) => a.date.getTime() - b.date.getTime());
}

function getWeekStart(date: Date): Date {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day; // Adjust to start on Sunday
  weekStart.setDate(diff);
  weekStart.setHours(0, 0, 0, 0);
  return weekStart;
}

function formatWeekLabel(weekStart: Date): string {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  
  const formatOptions: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  
  const startStr = weekStart.toLocaleDateString('en-US', formatOptions);
  const endStr = weekEnd.toLocaleDateString('en-US', formatOptions);
  
  return `${startStr} - ${endStr}`;
}

export function calculateOneRepMax(weight: number, reps: number): number {
  // Brzycki formula: 1RM = weight / (1.0278 - (0.0278 × reps))
  if (reps === 1) return weight;
  return Math.round(weight / (1.0278 - (0.0278 * reps)));
}

export function findPlateaus(weeklyStats: WeeklyStats[], metric: 'totalVolume' | 'workoutCount' | 'averageDuration'): boolean {
  if (weeklyStats.length < 4) return false;

  // Check last 4 weeks for plateau (less than 5% variation)
  const recentWeeks = weeklyStats.slice(-4);
  const values = recentWeeks.map(week => week[metric]);
  const average = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Calculate coefficient of variation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = average > 0 ? standardDeviation / average : 0;

  return coefficientOfVariation < 0.05; // Less than 5% variation indicates plateau
}