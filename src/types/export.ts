export interface ExportConfig {
  format: 'json' | 'csv';
  dateRange: { start: Date; end: Date };
  includePersonalRecords: boolean;
  includeGoals: boolean;
  includeTemplates: boolean;
  includeUserData: boolean;
}

export interface ExportData {
  metadata: {
    exportDate: Date;
    version: string;
    userInfo: {
      id: string;
      email: string;
      firstName: string;
      lastName: string;
    };
  };
  workouts: any[];
  templates: any[];
  goals: any[];
  personalRecords: any[];
  exerciseTypes: any[];
}

export interface ImportResult {
  success: boolean;
  errors: string[];
  warnings: string[];
  imported: {
    workouts: number;
    templates: number;
    goals: number;
    exerciseTypes: number;
  };
  skipped: {
    workouts: number;
    templates: number;
    goals: number;
    exerciseTypes: number;
  };
}

export interface ImportConflict {
  type: 'workout' | 'template' | 'goal' | 'exerciseType';
  existingId: string;
  newData: any;
  existingData: any;
  resolution: 'skip' | 'replace' | 'merge';
}