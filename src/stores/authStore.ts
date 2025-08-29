import { create } from 'zustand';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import { authService } from '../services/auth';

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<boolean>;
  logout: () => void;
  getCurrentUser: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  
  login: async (credentials: LoginCredentials) => {
    set({ loading: true, error: null });
    
    try {
      const result = await authService.login(credentials);
      
      if (result.success && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return true;
      } else {
        set({
          loading: false,
          error: result.error || 'Login failed'
        });
        return false;
      }
    } catch (_error) {
      set({
        loading: false,
        error: 'An unexpected error occurred'
      });
      return false;
    }
  },
  
  register: async (userData: RegisterData) => {
    set({ loading: true, error: null });
    
    try {
      const result = await authService.register(userData);
      
      if (result.success && result.user) {
        set({
          user: result.user,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        return true;
      } else {
        set({
          loading: false,
          error: result.error || 'Registration failed'
        });
        return false;
      }
    } catch (_error) {
      set({
        loading: false,
        error: 'An unexpected error occurred'
      });
      return false;
    }
  },
  
  logout: () => {
    authService.logout();
    set({
      user: null,
      isAuthenticated: false,
      error: null
    });
  },
  
  getCurrentUser: async () => {
    set({ loading: true });
    
    try {
      const user = await authService.getCurrentUser();
      
      if (user) {
        set({
          user,
          isAuthenticated: true,
          loading: false
        });
      } else {
        set({
          user: null,
          isAuthenticated: false,
          loading: false
        });
      }
    } catch (_error) {
      set({
        user: null,
        isAuthenticated: false,
        loading: false,
        error: 'Failed to get current user'
      });
    }
  },
  
  updatePassword: async (currentPassword: string, newPassword: string) => {
    const { user } = get();
    if (!user) return false;
    
    set({ loading: true, error: null });
    
    try {
      const result = await authService.updatePassword(user.id, currentPassword, newPassword);
      
      if (result.success) {
        set({ loading: false });
        return true;
      } else {
        set({
          loading: false,
          error: result.error || 'Failed to update password'
        });
        return false;
      }
    } catch (_error) {
      set({
        loading: false,
        error: 'An unexpected error occurred'
      });
      return false;
    }
  },
  
  clearError: () => {
    set({ error: null });
  }
}));