import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuthStore } from '../../stores/authStore';
import { db } from '../../services/database';
import toast from 'react-hot-toast';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  theme: 'light' | 'dark';
  units: 'metric' | 'imperial';
  defaultRestTime: number;
}

interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ProfileForm: React.FC = () => {
  const { user, updatePassword, getCurrentUser } = useAuthStore();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  
  const profileForm = useForm<ProfileFormData>();
  const passwordForm = useForm<PasswordChangeData>();
  
  useEffect(() => {
    if (user) {
      profileForm.reset({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        theme: user.preferences.theme,
        units: user.preferences.units,
        defaultRestTime: user.preferences.defaultRestTime
      });
    }
  }, [user, profileForm]);
  
  const onProfileSubmit = async (data: ProfileFormData) => {
    if (!user) return;
    
    setProfileLoading(true);
    
    try {
      const updatedUser = {
        ...user,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email.toLowerCase(),
        preferences: {
          theme: data.theme,
          units: data.units,
          defaultRestTime: data.defaultRestTime
        },
        updatedAt: new Date()
      };
      
      await db.users.update(user.id, updatedUser);
      await getCurrentUser(); // Refresh user data
      
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };
  
  const onPasswordSubmit = async (data: PasswordChangeData) => {
    setPasswordLoading(true);
    
    try {
      const success = await updatePassword(data.currentPassword, data.newPassword);
      
      if (success) {
        toast.success('Password updated successfully');
        passwordForm.reset();
        setIsChangingPassword(false);
      }
    } catch (error) {
      console.error('Password update error:', error);
    } finally {
      setPasswordLoading(false);
    }
  };
  
  if (!user) {
    return <div>Loading...</div>;
  }
  
  return (
    <div className="space-y-8">
      {/* Profile Information */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
          Profile Information
        </h2>
        
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="First name"
              error={profileForm.formState.errors.firstName?.message}
              {...profileForm.register('firstName', {
                required: 'First name is required',
                minLength: { value: 2, message: 'First name must be at least 2 characters' }
              })}
            />
            
            <Input
              label="Last name"
              error={profileForm.formState.errors.lastName?.message}
              {...profileForm.register('lastName', {
                required: 'Last name is required',
                minLength: { value: 2, message: 'Last name must be at least 2 characters' }
              })}
            />
          </div>
          
          <Input
            label="Email address"
            type="email"
            error={profileForm.formState.errors.email?.message}
            {...profileForm.register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Please enter a valid email address'
              }
            })}
          />
          
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 cursor-pointer"
                {...profileForm.register('theme')}
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Units
              </label>
              <select
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600 cursor-pointer"
                {...profileForm.register('units')}
              >
                <option value="metric">Metric (kg)</option>
                <option value="imperial">Imperial (lbs)</option>
              </select>
            </div>
          </div>
          
          <Input
            label="Default rest time (seconds)"
            type="number"
            min="15"
            max="600"
            error={profileForm.formState.errors.defaultRestTime?.message}
            {...profileForm.register('defaultRestTime', {
              required: 'Default rest time is required',
              min: { value: 15, message: 'Rest time must be at least 15 seconds' },
              max: { value: 600, message: 'Rest time cannot exceed 10 minutes' }
            })}
          />
          
          <div className="flex justify-end">
            <Button type="submit" loading={profileLoading}>
              Update Profile
            </Button>
          </div>
        </form>
      </div>
      
      {/* Password Change */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">
            Change Password
          </h2>
          {!isChangingPassword && (
            <Button
              variant="secondary"
              onClick={() => setIsChangingPassword(true)}
            >
              Change Password
            </Button>
          )}
        </div>
        
        {isChangingPassword && (
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current password"
              type="password"
              error={passwordForm.formState.errors.currentPassword?.message}
              {...passwordForm.register('currentPassword', {
                required: 'Current password is required'
              })}
            />
            
            <Input
              label="New password"
              type="password"
              hint="Must be at least 8 characters with uppercase, lowercase, and number"
              error={passwordForm.formState.errors.newPassword?.message}
              {...passwordForm.register('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Password must contain uppercase, lowercase, and number'
                }
              })}
            />
            
            <Input
              label="Confirm new password"
              type="password"
              error={passwordForm.formState.errors.confirmPassword?.message}
              {...passwordForm.register('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (value) =>
                  value === passwordForm.watch('newPassword') || 'Passwords do not match'
              })}
            />
            
            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setIsChangingPassword(false);
                  passwordForm.reset();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" loading={passwordLoading}>
                Update Password
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};