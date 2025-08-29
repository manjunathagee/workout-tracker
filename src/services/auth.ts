import { v4 as uuidv4 } from 'uuid';
import type { User, LoginCredentials, RegisterData } from '../types/auth';
import { db } from './database';
import { validateEmail, validatePassword, sanitizeInput } from '../utils/validators';
import { DEFAULT_USER_PREFERENCES, STORAGE_KEYS } from '../utils/constants';

class AuthService {
  private async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    
    // Use PBKDF2 with 100,000 iterations
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );
    
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: encoder.encode(salt),
        iterations: 100000,
        hash: 'SHA-256'
      },
      key,
      256
    );
    
    return Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private generateSalt(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  private async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password, salt);
    return computedHash === hash;
  }
  
  async register(userData: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate input
      const email = sanitizeInput(userData.email.toLowerCase());
      const firstName = sanitizeInput(userData.firstName);
      const lastName = sanitizeInput(userData.lastName);
      
      if (!validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }
      
      const passwordValidation = validatePassword(userData.password);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }
      
      // Check if user already exists
      const existingUser = await db.users.where('email').equals(email).first();
      if (existingUser) {
        return { success: false, error: 'Email already registered' };
      }
      
      // Hash password
      const salt = this.generateSalt();
      const hashedPassword = await this.hashPassword(userData.password, salt);
      
      // Create user
      const newUser: User = {
        id: uuidv4(),
        email,
        password: `${salt}:${hashedPassword}`,
        firstName,
        lastName,
        role: 'user',
        preferences: { ...DEFAULT_USER_PREFERENCES },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.users.add(newUser);
      
      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = newUser;
      
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: 'Registration failed' };
    }
  }
  
  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const email = sanitizeInput(credentials.email.toLowerCase());
      
      if (!validateEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }
      
      // Find user
      const user = await db.users.where('email').equals(email).first();
      if (!user) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Verify password
      const [salt, hash] = user.password.split(':');
      const isValidPassword = await this.verifyPassword(credentials.password, hash, salt);
      
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email or password' };
      }
      
      // Store auth info
      localStorage.setItem(STORAGE_KEYS.USER_ID, user.id);
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, this.generateSessionToken());
      
      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      
      return { success: true, user: userWithoutPassword as User };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }
  
  async getCurrentUser(): Promise<User | null> {
    try {
      const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      
      if (!userId || !token) {
        return null;
      }
      
      const user = await db.users.get(userId);
      if (!user) {
        this.logout();
        return null;
      }
      
      // Remove password from returned user object
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  }
  
  logout(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_ID);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }
  
  isAuthenticated(): boolean {
    const userId = localStorage.getItem(STORAGE_KEYS.USER_ID);
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    return !!(userId && token);
  }
  
  private generateSessionToken(): string {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
  
  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await db.users.get(userId);
      if (!user) {
        return { success: false, error: 'User not found' };
      }
      
      // Verify current password
      const [salt, hash] = user.password.split(':');
      const isValidPassword = await this.verifyPassword(currentPassword, hash, salt);
      
      if (!isValidPassword) {
        return { success: false, error: 'Current password is incorrect' };
      }
      
      // Validate new password
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return { success: false, error: passwordValidation.errors.join(', ') };
      }
      
      // Hash new password
      const newSalt = this.generateSalt();
      const newHashedPassword = await this.hashPassword(newPassword, newSalt);
      
      // Update user
      await db.users.update(userId, {
        password: `${newSalt}:${newHashedPassword}`,
        updatedAt: new Date()
      });
      
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }
}

export const authService = new AuthService();