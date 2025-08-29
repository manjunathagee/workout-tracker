import type { User } from './auth';
import type { Workout, Exercise, Set, ExerciseType } from './workout';

export interface DatabaseTables {
  users: User;
  workouts: Workout;
  exercises: Exercise;
  sets: Set;
  exerciseTypes: ExerciseType;
}