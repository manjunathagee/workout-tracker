import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { useAuthStore } from '../../stores/authStore';
import type { LoginCredentials } from '../../types/auth';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuthStore();
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginCredentials>();
  
  const onSubmit = async (data: LoginCredentials) => {
    await login(data);
  };
  
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Welcome back! Please sign in to continue.
        </p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
            autoComplete="current-password"
            error={errors.password?.message}
            {...register('password', {
              required: 'Password is required'
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
          Sign in
        </Button>
      </form>
      
      {onSwitchToRegister && (
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 cursor-pointer"
          >
            Sign up
          </button>
        </p>
      )}
    </div>
  );
};