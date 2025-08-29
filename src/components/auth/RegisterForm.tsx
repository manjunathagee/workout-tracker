import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuthStore } from '../../stores/authStore';
import type { RegisterData } from '../../types/auth';
import { validatePassword } from '../../utils/validators';

interface RegisterFormData extends RegisterData {
  confirmPassword: string;
}

interface RegisterFormProps {
  onSwitchToLogin?: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, loading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>();
  
  const watchPassword = watch('password');
  
  const onSubmit = async (data: RegisterFormData) => {
    const { confirmPassword: _, ...userData } = data;
    await registerUser(userData);
  };
  
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Create your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Join us to start tracking your kettlebell workouts
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name"
            autoComplete="given-name"
            error={errors.firstName?.message}
            {...register('firstName', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'First name must be at least 2 characters'
              }
            })}
          />
          
          <Input
            label="Last name"
            autoComplete="family-name"
            error={errors.lastName?.message}
            {...register('lastName', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Last name must be at least 2 characters'
              }
            })}
          />
        </div>
        
        <Input
          label="Email address"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Please enter a valid email address'
            }
          })}
        />
        
        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            error={errors.password?.message}
            hint="Must be at least 8 characters with uppercase, lowercase, and number"
            {...register('password', {
              required: 'Password is required',
              validate: (value) => {
                const validation = validatePassword(value);
                return validation.isValid || validation.errors[0];
              }
            })}
          />
          <button
            type="button"
            className="absolute right-3 top-8 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
        
        <Input
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword', {
            required: 'Please confirm your password',
            validate: (value) =>
              value === watchPassword || 'Passwords do not match'
          })}
        />
        
        {error && (
          <div className="rounded-md bg-red-50 border border-red-200 p-3 dark:bg-red-900/20 dark:border-red-800">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        
        <Button
          type="submit"
          className="w-full"
          loading={loading}
        >
          Create account
        </Button>
      </form>
      
      {onSwitchToLogin && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Already have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToLogin}
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 cursor-pointer"
          >
            Sign in
          </button>
        </p>
      )}
    </div>
  );
};