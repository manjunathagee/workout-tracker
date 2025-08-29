export interface Goal {
  id: string;
  userId: string;
  type: 'weight' | 'reps' | 'frequency' | 'duration';
  exerciseId?: string;
  targetValue: number;
  currentValue: number;
  targetDate: Date;
  isCompleted: boolean;
  createdAt: Date;
  title: string;
  description?: string;
}