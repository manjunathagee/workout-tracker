export interface User {
  id: string;
  email: string;
  password: string; // hashed with PBKDF2
  firstName: string;
  lastName: string;
  role: 'user' | 'admin';
  profilePicture?: string;
  preferences: {
    theme: 'light' | 'dark';
    units: 'metric' | 'imperial';
    defaultRestTime: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}