import { describe, it, expect, beforeEach } from 'vitest';
import { 
  calculateDashboardStats, 
  calculateOneRepMax, 
  findPlateaus 
} from '../analytics';
import type { Workout, ExerciseType } from '../../types/workout';

describe('Analytics Utils', () => {
  let mockWorkouts: Workout[];
  let mockExerciseTypes: ExerciseType[];

  beforeEach(() => {
    mockExerciseTypes = [
      {
        id: '1',
        name: 'Kettlebell Swing',
        category: 'swing',
        description: 'Two-handed kettlebell swing',
        instructions: ['Hinge at hips', 'Swing to shoulder height'],
        muscles: ['glutes', 'hamstrings', 'shoulders'],
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: '2',
        name: 'Turkish Get-Up',
        category: 'other',
        description: 'Full body movement',
        instructions: ['Start lying down', 'Stand up with kettlebell'],
        muscles: ['core', 'shoulders', 'legs'],
        isCustom: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockWorkouts = [
      {
        id: '1',
        userId: 'user1',
        date: new Date('2024-01-01'),
        duration: 45,
        exercises: [
          {
            id: 'ex1',
            workoutId: '1',
            exerciseType: '1',
            sets: [
              {
                id: 'set1',
                exerciseId: 'ex1',
                targetReps: 10,
                actualReps: 10,
                targetWeight: 16,
                actualWeight: 16,
                restTime: 60,
                completed: true,
                order: 1
              },
              {
                id: 'set2',
                exerciseId: 'ex1',
                targetReps: 10,
                actualReps: 8,
                targetWeight: 16,
                actualWeight: 16,
                restTime: 60,
                completed: true,
                order: 2
              }
            ],
            notes: '',
            order: 1
          }
        ],
        isTemplate: false,
        completedAt: new Date('2024-01-01'),
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        userId: 'user1',
        date: new Date('2024-01-02'),
        duration: 50,
        exercises: [
          {
            id: 'ex2',
            workoutId: '2',
            exerciseType: '1',
            sets: [
              {
                id: 'set3',
                exerciseId: 'ex2',
                targetReps: 12,
                actualReps: 12,
                targetWeight: 20,
                actualWeight: 20,
                restTime: 60,
                completed: true,
                order: 1
              }
            ],
            notes: '',
            order: 1
          }
        ],
        isTemplate: false,
        completedAt: new Date('2024-01-02'),
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];
  });

  describe('calculateDashboardStats', () => {
    it('should calculate basic statistics correctly', () => {
      const stats = calculateDashboardStats(mockWorkouts, mockExerciseTypes);

      expect(stats.totalWorkouts).toBe(2);
      expect(stats.averageWorkoutDuration).toBe(47.5);
      expect(stats.totalVolume).toBe(528); // (16*10 + 16*8) + (20*12)
    });

    it('should calculate personal records correctly', () => {
      const stats = calculateDashboardStats(mockWorkouts, mockExerciseTypes);

      expect(stats.personalRecords.length).toBeGreaterThan(0);
      const maxWeightRecord = stats.personalRecords.find(r => r.type === 'maxWeight');
      expect(maxWeightRecord?.value).toBe(20);
    });

    it('should handle empty workouts array', () => {
      const stats = calculateDashboardStats([], mockExerciseTypes);

      expect(stats.totalWorkouts).toBe(0);
      expect(stats.totalVolume).toBe(0);
      expect(stats.averageWorkoutDuration).toBe(0);
      expect(stats.personalRecords).toHaveLength(0);
    });

    it('should calculate streak correctly for consecutive days', () => {
      const consecutiveWorkouts = [
        { ...mockWorkouts[0], date: new Date() }, // Today
        { ...mockWorkouts[1], date: new Date(Date.now() - 86400000) } // Yesterday
      ];

      const stats = calculateDashboardStats(consecutiveWorkouts, mockExerciseTypes);
      expect(stats.currentStreak).toBeGreaterThanOrEqual(1);
    });
  });

  describe('calculateOneRepMax', () => {
    it('should return the weight itself for 1 rep', () => {
      expect(calculateOneRepMax(100, 1)).toBe(100);
    });

    it('should calculate 1RM using Brzycki formula', () => {
      const oneRM = calculateOneRepMax(80, 5);
      expect(oneRM).toBeCloseTo(90, 1); // Should be around 90kg
    });

    it('should handle zero weight', () => {
      expect(calculateOneRepMax(0, 5)).toBe(0);
    });

    it('should handle invalid rep counts', () => {
      // Formula still applies even for 0 reps, but result should be reasonable
      const result = calculateOneRepMax(100, 0);
      expect(result).toBeCloseTo(97, 1);
    });
  });

  describe('findPlateaus', () => {
    it('should detect plateau with consistent values', () => {
      const plateauStats = Array(5).fill(null).map((_, i) => ({
        week: `Week ${i + 1}`,
        totalVolume: 1000, // Same volume
        workoutCount: 3,
        averageDuration: 45,
        date: new Date()
      }));

      expect(findPlateaus(plateauStats, 'totalVolume')).toBe(true);
    });

    it('should not detect plateau with varying values', () => {
      const varyingStats = Array(5).fill(null).map((_, i) => ({
        week: `Week ${i + 1}`,
        totalVolume: 1000 + (i * 200), // Increasing volume
        workoutCount: 3,
        averageDuration: 45,
        date: new Date()
      }));

      expect(findPlateaus(varyingStats, 'totalVolume')).toBe(false);
    });

    it('should return false for insufficient data', () => {
      const shortStats = [
        {
          week: 'Week 1',
          totalVolume: 1000,
          workoutCount: 3,
          averageDuration: 45,
          date: new Date()
        }
      ];

      expect(findPlateaus(shortStats, 'totalVolume')).toBe(false);
    });
  });
});