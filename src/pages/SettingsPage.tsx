import React from 'react';
import { ProfileForm } from '../components/auth/ProfileForm';

export const SettingsPage: React.FC = () => {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage your account settings and preferences.
        </p>
      </div>
      
      <ProfileForm />
    </div>
  );
};