export const STORAGE_KEYS = {
  AUTH_TOKEN: 'workout_tracker_auth_token',
  USER_ID: 'workout_tracker_user_id',
  THEME: 'workout_tracker_theme',
} as const;

export const DEFAULT_USER_PREFERENCES = {
  theme: 'light' as const,
  units: 'metric' as const,
  defaultRestTime: 60, // seconds
};

export const EXERCISE_CATEGORIES = [
  'swing',
  'press',
  'squat',
  'deadlift',
  'carry',
  'other',
] as const;

export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;