import Dexie, { type Table } from 'dexie';
import type { User } from '../types/auth';
import type { Workout, Exercise, Set, ExerciseType } from '../types/workout';
import type { Goal } from '../types/goals';

export class WorkoutDatabase extends Dexie {
  users!: Table<User, string>;
  workouts!: Table<Workout, string>;
  exercises!: Table<Exercise, string>;
  sets!: Table<Set, string>;
  exerciseTypes!: Table<ExerciseType, string>;
  goals!: Table<Goal, string>;

  constructor() {
    super('WorkoutTrackerDB');
    
    this.version(2).stores({
      users: 'id, email, role, createdAt',
      workouts: 'id, userId, date, createdAt, isTemplate',
      exercises: 'id, workoutId, exerciseType',
      sets: 'id, exerciseId',
      exerciseTypes: 'id, name, category, isCustom',
      goals: 'id, userId, type, isCompleted, targetDate'
    });

    this.on('ready', this.seedData);
  }

  private seedData = async () => {
    // Check if exercise types are already seeded
    const count = await this.exerciseTypes.count();
    if (count > 0) return;

    // Seed default kettlebell exercises
    const defaultExercises: ExerciseType[] = [
      // Swings
      {
        id: 'kb-swing',
        name: 'Kettlebell Swing',
        category: 'swing',
        description: 'A hip-hinge movement that develops power and endurance',
        instructions: [
          'Stand with feet slightly wider than shoulder-width',
          'Hold kettlebell with both hands in front of you',
          'Hinge at hips and swing kettlebell between legs',
          'Drive hips forward explosively to swing kettlebell to chest height'
        ],
        muscles: ['glutes', 'hamstrings', 'core', 'shoulders'],
        isCustom: false
      },
      {
        id: 'single-arm-swing',
        name: 'Single Arm Swing',
        category: 'swing',
        description: 'Unilateral swing variation for core stability',
        instructions: [
          'Similar to regular swing but with one arm',
          'Keep free arm extended for balance',
          'Switch arms between sets'
        ],
        muscles: ['glutes', 'hamstrings', 'core', 'shoulders'],
        isCustom: false
      },
      // Presses
      {
        id: 'military-press',
        name: 'Military Press',
        category: 'press',
        description: 'Strict overhead pressing movement',
        instructions: [
          'Hold kettlebell at shoulder level',
          'Keep core tight and legs straight',
          'Press kettlebell straight overhead',
          'Lower with control'
        ],
        muscles: ['shoulders', 'triceps', 'core'],
        isCustom: false
      },
      {
        id: 'push-press',
        name: 'Push Press',
        category: 'press',
        description: 'Overhead press with leg drive',
        instructions: [
          'Start in military press position',
          'Slight knee bend and hip drive',
          'Use momentum to press overhead',
          'Lower with control'
        ],
        muscles: ['shoulders', 'triceps', 'legs', 'core'],
        isCustom: false
      },
      {
        id: 'turkish-get-up',
        name: 'Turkish Get-Up',
        category: 'other',
        description: 'Complex full-body movement',
        instructions: [
          'Start lying down with kettlebell overhead',
          'Follow the 7-step sequence to standing',
          'Reverse the sequence to return to floor'
        ],
        muscles: ['full body', 'core', 'shoulders'],
        isCustom: false
      },
      // Squats
      {
        id: 'goblet-squat',
        name: 'Goblet Squat',
        category: 'squat',
        description: 'Front-loaded squat variation',
        instructions: [
          'Hold kettlebell at chest level',
          'Feet shoulder-width apart',
          'Squat down keeping chest up',
          'Drive through heels to stand'
        ],
        muscles: ['quads', 'glutes', 'core'],
        isCustom: false
      },
      {
        id: 'front-squat',
        name: 'Front Squat',
        category: 'squat',
        description: 'Kettlebell held in front rack position',
        instructions: [
          'Hold kettlebell in front rack position',
          'Keep elbow up and core tight',
          'Squat down maintaining upright torso',
          'Drive up through heels'
        ],
        muscles: ['quads', 'glutes', 'core'],
        isCustom: false
      },
      // Deadlifts
      {
        id: 'sumo-deadlift',
        name: 'Sumo Deadlift',
        category: 'deadlift',
        description: 'Wide-stance deadlift variation',
        instructions: [
          'Wide stance with toes pointed out',
          'Kettlebell between legs',
          'Keep back straight and chest up',
          'Drive through heels and hips'
        ],
        muscles: ['glutes', 'hamstrings', 'quads'],
        isCustom: false
      },
      {
        id: 'single-leg-deadlift',
        name: 'Single Leg Deadlift',
        category: 'deadlift',
        description: 'Unilateral hip-hinge movement',
        instructions: [
          'Stand on one leg with kettlebell in opposite hand',
          'Hinge at hip and extend free leg back',
          'Keep back straight throughout movement',
          'Return to standing position'
        ],
        muscles: ['glutes', 'hamstrings', 'core'],
        isCustom: false
      },
      // Carries
      {
        id: 'farmers-walk',
        name: "Farmer's Walk",
        category: 'carry',
        description: 'Loaded carry for grip and core strength',
        instructions: [
          'Hold kettlebell in each hand',
          'Walk with good posture',
          'Keep shoulders back and core tight',
          'Take controlled steps'
        ],
        muscles: ['forearms', 'traps', 'core', 'legs'],
        isCustom: false
      },
      {
        id: 'suitcase-carry',
        name: 'Suitcase Carry',
        category: 'carry',
        description: 'Single-sided carry for anti-lateral flexion',
        instructions: [
          'Hold kettlebell in one hand only',
          'Walk maintaining upright posture',
          'Resist leaning to loaded side',
          'Switch sides between sets'
        ],
        muscles: ['core', 'shoulders', 'forearms'],
        isCustom: false
      },
      {
        id: 'overhead-carry',
        name: 'Overhead Carry',
        category: 'carry',
        description: 'Overhead loaded carry for shoulder stability',
        instructions: [
          'Press kettlebell overhead',
          'Lock out arm completely',
          'Walk with kettlebell overhead',
          'Keep core engaged'
        ],
        muscles: ['shoulders', 'core', 'forearms'],
        isCustom: false
      }
    ];

    await this.exerciseTypes.bulkAdd(defaultExercises);
  };
}

export const db = new WorkoutDatabase();