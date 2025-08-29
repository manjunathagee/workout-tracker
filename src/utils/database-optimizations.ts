import { db } from '../services/database';
import type { Workout } from '../types/workout';

// Optimized database queries with proper indexing and pagination
export class DatabaseOptimizations {
  
  /**
   * Get paginated workouts for a user with efficient indexing
   */
  static async getWorkoutsPaginated(
    userId: string, 
    options: {
      page?: number;
      limit?: number;
      isTemplate?: boolean;
      startDate?: Date;
      endDate?: Date;
    } = {}
  ): Promise<{ workouts: Workout[]; total: number }> {
    const { page = 1, limit = 50, isTemplate, startDate, endDate } = options;
    const offset = (page - 1) * limit;

    let query = db.workouts.where('userId').equals(userId);

    // Apply template filter
    if (isTemplate !== undefined) {
      query = query.and(w => Boolean(w.isTemplate) === Boolean(isTemplate));
    }

    // Apply date range filter
    if (startDate || endDate) {
      query = query.and(w => {
        if (startDate && w.date < startDate) return false;
        if (endDate && w.date > endDate) return false;
        return true;
      });
    }

    // Get total count for pagination
    const total = await query.count();

    // Get paginated results sorted by date (most recent first)
    const workouts = await query
      .reverse() // Use reverse for descending order on indexed field
      .offset(offset)
      .limit(limit)
      .toArray();

    return { workouts, total };
  }

  /**
   * Get workouts for dashboard with optimized aggregation
   */
  static async getDashboardWorkouts(
    userId: string,
    timeRange: { start: Date; end?: Date }
  ): Promise<Workout[]> {
    return db.workouts
      .where('userId').equals(userId)
      .and(w => !w.isTemplate && !!w.completedAt && w.date >= timeRange.start)
      .and(w => !timeRange.end || w.date <= timeRange.end)
      .reverse() // Most recent first
      .toArray();
  }

  /**
   * Get user's personal records efficiently
   */
  static async getPersonalRecords(userId: string, exerciseTypeIds?: string[]) {
    const workouts = await db.workouts
      .where('userId').equals(userId)
      .and(w => !w.isTemplate && !!w.completedAt)
      .toArray();

    // Process in memory for better performance than multiple DB queries
    const records = new Map<string, { maxWeight: number; maxReps: number; maxVolume: number; workoutId: string; date: Date }>();

    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exerciseTypeIds && !exerciseTypeIds.includes(exercise.exerciseType)) return;

        const current = records.get(exercise.exerciseType) || {
          maxWeight: 0,
          maxReps: 0,
          maxVolume: 0,
          workoutId: workout.id,
          date: workout.date
        };

        exercise.sets.forEach(set => {
          const weight = set.actualWeight || set.targetWeight;
          const reps = set.actualReps || set.targetReps;
          const volume = weight * reps;

          if (weight > current.maxWeight) {
            current.maxWeight = weight;
            current.workoutId = workout.id;
            current.date = workout.date;
          }

          if (reps > current.maxReps) {
            current.maxReps = reps;
            current.workoutId = workout.id;
            current.date = workout.date;
          }

          if (volume > current.maxVolume) {
            current.maxVolume = volume;
            current.workoutId = workout.id;
            current.date = workout.date;
          }
        });

        records.set(exercise.exerciseType, current);
      });
    });

    return records;
  }

  /**
   * Bulk update workout completion status
   */
  static async bulkUpdateWorkoutStatus(workoutIds: string[], completed: boolean) {
    const updates = workoutIds.map(id => ({
      key: id,
      changes: {
        completedAt: completed ? new Date() : undefined,
        updatedAt: new Date()
      }
    }));

    return db.workouts.bulkUpdate(updates);
  }

  /**
   * Clean up old incomplete workouts (older than 7 days)
   */
  static async cleanupIncompleteWorkouts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const incompleteWorkouts = await db.workouts
      .where('completedAt').equals(null as any)
      .and(w => !w.isTemplate && w.createdAt < sevenDaysAgo)
      .primaryKeys();

    if (incompleteWorkouts.length > 0) {
      await db.workouts.bulkDelete(incompleteWorkouts);
      return incompleteWorkouts.length;
    }

    return 0;
  }

  /**
   * Get workout statistics with efficient aggregation
   */
  static async getWorkoutStats(userId: string, timeRange: { start: Date; end?: Date }) {
    const workouts = await this.getDashboardWorkouts(userId, timeRange);

    // Aggregate stats in memory for better performance
    const stats = workouts.reduce((acc, workout) => {
      acc.totalWorkouts++;
      acc.totalDuration += workout.duration || 0;
      
      workout.exercises.forEach(exercise => {
        exercise.sets.forEach(set => {
          const weight = set.actualWeight || set.targetWeight;
          const reps = set.actualReps || set.targetReps;
          acc.totalVolume += weight * reps;
          acc.totalSets++;
        });
      });

      return acc;
    }, {
      totalWorkouts: 0,
      totalDuration: 0,
      totalVolume: 0,
      totalSets: 0
    });

    return {
      ...stats,
      averageDuration: stats.totalWorkouts > 0 ? stats.totalDuration / stats.totalWorkouts : 0,
      averageVolume: stats.totalWorkouts > 0 ? stats.totalVolume / stats.totalWorkouts : 0
    };
  }

  /**
   * Search workouts with full-text search simulation
   */
  static async searchWorkouts(
    userId: string,
    searchTerm: string,
    options: { limit?: number } = {}
  ): Promise<Workout[]> {
    const { limit = 20 } = options;
    const searchLower = searchTerm.toLowerCase();

    const workouts = await db.workouts
      .where('userId').equals(userId)
      .toArray();

    // Filter and score results
    const scored = workouts
      .map(workout => {
        let score = 0;
        let matches = false;

        // Score by template name
        if (workout.templateName?.toLowerCase().includes(searchLower)) {
          score += 10;
          matches = true;
        }

        // Score by notes
        if (workout.notes?.toLowerCase().includes(searchLower)) {
          score += 5;
          matches = true;
        }

        // Score by exercise names (would need to join with exerciseTypes)
        // This is simplified - in production you'd want to optimize this join
        
        return matches ? { workout, score } : null;
      })
      .filter((item): item is { workout: Workout; score: number } => item !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.workout);

    return scored;
  }

  /**
   * Get exercise frequency statistics
   */
  static async getExerciseFrequency(userId: string, timeRange: { start: Date; end?: Date }) {
    const workouts = await this.getDashboardWorkouts(userId, timeRange);
    
    const frequency = new Map<string, number>();
    
    workouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const current = frequency.get(exercise.exerciseType) || 0;
        frequency.set(exercise.exerciseType, current + 1);
      });
    });

    return Array.from(frequency.entries())
      .map(([exerciseType, count]) => ({ exerciseType, count }))
      .sort((a, b) => b.count - a.count);
  }
}

// Memory cache for frequently accessed data
class QueryCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl = 5 * 60 * 1000; // 5 minutes TTL

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const queryCache = new QueryCache();

// Clean up cache every 10 minutes
setInterval(() => queryCache.cleanup(), 10 * 60 * 1000);