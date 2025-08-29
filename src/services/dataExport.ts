import { db } from './database';
import { useAuthStore } from '../stores/authStore';
import type { ExportConfig, ExportData, ImportResult, ImportConflict } from '../types/export';
import type { Workout, ExerciseType, Goal } from '../types/workout';

export class DataExportService {
  
  /**
   * Export user data based on configuration
   */
  static async exportData(config: ExportConfig): Promise<string> {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User not authenticated');

    const exportData: ExportData = {
      metadata: {
        exportDate: new Date(),
        version: '1.0.0',
        userInfo: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        }
      },
      workouts: [],
      templates: [],
      goals: [],
      personalRecords: [],
      exerciseTypes: []
    };

    // Export workouts within date range
    const workouts = await db.workouts
      .where('userId').equals(user.id)
      .and(w => w.date >= config.dateRange.start && w.date <= config.dateRange.end)
      .and(w => !w.isTemplate)
      .toArray();

    exportData.workouts = workouts;

    // Export templates if requested
    if (config.includeTemplates) {
      const templates = await db.workouts
        .where('userId').equals(user.id)
        .and(w => w.isTemplate === true)
        .toArray();
      
      exportData.templates = templates;
    }

    // Export goals if requested
    if (config.includeGoals) {
      const goals = await db.goals
        .where('userId').equals(user.id)
        .toArray();
      
      exportData.goals = goals;
    }

    // Export exercise types (including custom ones)
    const exerciseTypes = await db.exerciseTypes.toArray();
    exportData.exerciseTypes = exerciseTypes;

    // Export personal records if requested
    if (config.includePersonalRecords) {
      // Calculate personal records from workouts
      exportData.personalRecords = this.calculatePersonalRecords(workouts, exerciseTypes);
    }

    if (config.format === 'json') {
      return JSON.stringify(exportData, null, 2);
    } else {
      return this.convertToCSV(exportData);
    }
  }

  /**
   * Import data from JSON or CSV format
   */
  static async importData(
    fileContent: string, 
    format: 'json' | 'csv',
    conflictResolution: 'skip' | 'replace' | 'merge' = 'skip'
  ): Promise<ImportResult> {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error('User not authenticated');

    const result: ImportResult = {
      success: false,
      errors: [],
      warnings: [],
      imported: { workouts: 0, templates: 0, goals: 0, exerciseTypes: 0 },
      skipped: { workouts: 0, templates: 0, goals: 0, exerciseTypes: 0 }
    };

    try {
      let importData: ExportData;
      
      if (format === 'json') {
        importData = JSON.parse(fileContent);
      } else {
        importData = this.parseCSV(fileContent);
      }

      // Validate import data structure
      if (!this.validateImportData(importData)) {
        result.errors.push('Invalid data format or structure');
        return result;
      }

      // Start transaction for atomic import
      await db.transaction('rw', [db.workouts, db.goals, db.exerciseTypes], async () => {
        // Import exercise types first
        for (const exerciseType of importData.exerciseTypes || []) {
          try {
            const existing = await db.exerciseTypes.get(exerciseType.id);
            if (existing) {
              if (conflictResolution === 'replace') {
                await db.exerciseTypes.put({ ...exerciseType, updatedAt: new Date() });
                result.imported.exerciseTypes++;
              } else {
                result.skipped.exerciseTypes++;
              }
            } else {
              await db.exerciseTypes.add(exerciseType);
              result.imported.exerciseTypes++;
            }
          } catch (error) {
            result.errors.push(`Failed to import exercise type ${exerciseType.name}: ${error}`);
          }
        }

        // Import workouts
        for (const workout of importData.workouts || []) {
          try {
            const existing = await db.workouts.get(workout.id);
            workout.userId = user.id; // Ensure ownership

            if (existing) {
              if (conflictResolution === 'replace') {
                await db.workouts.put({ ...workout, updatedAt: new Date() });
                result.imported.workouts++;
              } else if (conflictResolution === 'merge') {
                // Merge logic - preserve user modifications but update from import
                const merged = { ...existing, ...workout, updatedAt: new Date() };
                await db.workouts.put(merged);
                result.imported.workouts++;
              } else {
                result.skipped.workouts++;
              }
            } else {
              await db.workouts.add(workout);
              result.imported.workouts++;
            }
          } catch (error) {
            result.errors.push(`Failed to import workout: ${error}`);
          }
        }

        // Import templates
        for (const template of importData.templates || []) {
          try {
            const existing = await db.workouts.get(template.id);
            template.userId = user.id; // Ensure ownership
            template.isTemplate = true;

            if (existing) {
              if (conflictResolution === 'replace') {
                await db.workouts.put({ ...template, updatedAt: new Date() });
                result.imported.templates++;
              } else {
                result.skipped.templates++;
              }
            } else {
              await db.workouts.add(template);
              result.imported.templates++;
            }
          } catch (error) {
            result.errors.push(`Failed to import template: ${error}`);
          }
        }

        // Import goals
        for (const goal of importData.goals || []) {
          try {
            const existing = await db.goals.get(goal.id);
            goal.userId = user.id; // Ensure ownership

            if (existing) {
              if (conflictResolution === 'replace') {
                await db.goals.put({ ...goal, updatedAt: new Date() });
                result.imported.goals++;
              } else {
                result.skipped.goals++;
              }
            } else {
              await db.goals.add(goal);
              result.imported.goals++;
            }
          } catch (error) {
            result.errors.push(`Failed to import goal: ${error}`);
          }
        }
      });

      result.success = result.errors.length === 0;
      
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
      result.success = false;
    }

    return result;
  }

  /**
   * Create full backup of user data
   */
  static async createBackup(): Promise<string> {
    const config: ExportConfig = {
      format: 'json',
      dateRange: {
        start: new Date(0), // All time
        end: new Date()
      },
      includePersonalRecords: true,
      includeGoals: true,
      includeTemplates: true,
      includeUserData: true
    };

    return this.exportData(config);
  }

  /**
   * Restore from full backup
   */
  static async restoreBackup(backupContent: string): Promise<ImportResult> {
    return this.importData(backupContent, 'json', 'replace');
  }

  /**
   * Download data as file
   */
  static downloadData(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Calculate personal records from workouts
   */
  private static calculatePersonalRecords(workouts: Workout[], exerciseTypes: ExerciseType[]) {
    const records: any[] = [];
    const exerciseRecords = new Map<string, any>();

    workouts.forEach(workout => {
      workout.exercises?.forEach(exercise => {
        const exerciseType = exerciseTypes.find(et => et.id === exercise.exerciseType);
        if (!exerciseType) return;

        const current = exerciseRecords.get(exercise.exerciseType) || {
          maxWeight: 0,
          maxReps: 0,
          maxVolume: 0
        };

        exercise.sets?.forEach(set => {
          const weight = set.actualWeight || set.targetWeight || 0;
          const reps = set.actualReps || set.targetReps || 0;
          const volume = weight * reps;

          if (weight > current.maxWeight) {
            current.maxWeight = weight;
            current.maxWeightDate = workout.date;
            current.maxWeightWorkout = workout.id;
          }

          if (reps > current.maxReps) {
            current.maxReps = reps;
            current.maxRepsDate = workout.date;
            current.maxRepsWorkout = workout.id;
          }

          if (volume > current.maxVolume) {
            current.maxVolume = volume;
            current.maxVolumeDate = workout.date;
            current.maxVolumeWorkout = workout.id;
          }
        });

        exerciseRecords.set(exercise.exerciseType, current);
      });
    });

    // Convert to array format
    exerciseRecords.forEach((record, exerciseId) => {
      const exerciseType = exerciseTypes.find(et => et.id === exerciseId);
      if (exerciseType && record.maxWeight > 0) {
        records.push({
          exerciseId,
          exerciseName: exerciseType.name,
          maxWeight: record.maxWeight,
          maxWeightDate: record.maxWeightDate,
          maxReps: record.maxReps,
          maxRepsDate: record.maxRepsDate,
          maxVolume: record.maxVolume,
          maxVolumeDate: record.maxVolumeDate
        });
      }
    });

    return records;
  }

  /**
   * Convert export data to CSV format
   */
  private static convertToCSV(data: ExportData): string {
    const csvSections: string[] = [];

    // Workouts CSV
    if (data.workouts.length > 0) {
      csvSections.push('WORKOUTS');
      const headers = ['ID', 'Date', 'Duration', 'Notes', 'Exercises Count', 'Completed'];
      csvSections.push(headers.join(','));
      
      data.workouts.forEach(workout => {
        const row = [
          workout.id,
          workout.date,
          workout.duration || 0,
          `"${workout.notes || ''}"`,
          workout.exercises?.length || 0,
          workout.completedAt ? 'Yes' : 'No'
        ];
        csvSections.push(row.join(','));
      });
      csvSections.push('');
    }

    // Goals CSV
    if (data.goals.length > 0) {
      csvSections.push('GOALS');
      const headers = ['ID', 'Type', 'Target Value', 'Current Value', 'Target Date', 'Completed'];
      csvSections.push(headers.join(','));
      
      data.goals.forEach(goal => {
        const row = [
          goal.id,
          goal.type,
          goal.targetValue,
          goal.currentValue || 0,
          goal.targetDate,
          goal.isCompleted ? 'Yes' : 'No'
        ];
        csvSections.push(row.join(','));
      });
    }

    return csvSections.join('\n');
  }

  /**
   * Parse CSV content (simplified implementation)
   */
  private static parseCSV(content: string): ExportData {
    // This is a simplified CSV parser
    // In production, you'd want to use a proper CSV parsing library
    const lines = content.split('\n');
    
    return {
      metadata: {
        exportDate: new Date(),
        version: '1.0.0',
        userInfo: { id: '', email: '', firstName: '', lastName: '' }
      },
      workouts: [],
      templates: [],
      goals: [],
      personalRecords: [],
      exerciseTypes: []
    };
  }

  /**
   * Validate import data structure
   */
  private static validateImportData(data: any): data is ExportData {
    if (!data || typeof data !== 'object') return false;
    if (!data.metadata || typeof data.metadata !== 'object') return false;
    if (!Array.isArray(data.workouts)) return false;
    
    return true;
  }
}