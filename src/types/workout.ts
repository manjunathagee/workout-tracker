export interface ExerciseType {
  id: string;
  name: string;
  category: 'swing' | 'press' | 'squat' | 'deadlift' | 'carry' | 'other';
  description: string;
  instructions: string[];
  muscles: string[];
  isCustom: boolean;
  createdBy?: string;
}

export interface Exercise {
  id: string;
  workoutId: string;
  exerciseType: string;
  sets: Set[];
  notes?: string;
  order: number;
}

export interface Set {
  id: string;
  exerciseId: string;
  targetReps: number;
  actualReps?: number;
  targetWeight: number;
  actualWeight?: number;
  restTime: number; // seconds
  completed: boolean;
  order: number;
  startTime?: Date;
  endTime?: Date;
}

export interface Workout {
  id: string;
  userId: string;
  date: Date;
  duration: number; // minutes
  notes?: string;
  exercises: Exercise[];
  isTemplate: boolean;
  templateName?: string;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}