import { create } from 'zustand';
import { STORAGE_KEYS } from '../utils/constants';

interface UiStore {
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  
  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

const getInitialTheme = (): 'light' | 'dark' => {
  if (typeof window === 'undefined') return 'light';
  
  const stored = localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark' | null;
  if (stored) return stored;
  
  // Check system preference
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  
  return 'light';
};

export const useUiStore = create<UiStore>((set, get) => ({
  theme: getInitialTheme(),
  sidebarOpen: false,
  
  setTheme: (theme: 'light' | 'dark') => {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
    
    // Update document class for Tailwind dark mode
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    
    set({ theme });
  },
  
  toggleTheme: () => {
    const { theme } = get();
    const newTheme = theme === 'light' ? 'dark' : 'light';
    get().setTheme(newTheme);
  },
  
  setSidebarOpen: (open: boolean) => {
    set({ sidebarOpen: open });
  },
  
  toggleSidebar: () => {
    const { sidebarOpen } = get();
    set({ sidebarOpen: !sidebarOpen });
  }
}));