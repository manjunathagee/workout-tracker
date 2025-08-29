import { STORAGE_KEYS } from './constants';

export const initializeTheme = () => {
  if (typeof window === 'undefined') return;

  const stored = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
  let theme: 'light' | 'dark';

  if (stored) {
    theme = stored;
  } else {
    // Check system preference
    theme = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }

  // Apply theme class immediately
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  return theme;
};