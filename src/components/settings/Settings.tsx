import React, { useState } from 'react';
import { DataExport } from './DataExport';
import { DataImport } from './DataImport';
import { ProfileForm } from '../auth/ProfileForm';

type SettingsTab = 'profile' | 'export' | 'import' | 'privacy' | 'about';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const tabs = [
    { id: 'profile' as const, name: 'Profile', icon: '👤' },
    { id: 'export' as const, name: 'Export Data', icon: '📤' },
    { id: 'import' as const, name: 'Import Data', icon: '📥' },
    { id: 'privacy' as const, name: 'Privacy', icon: '🔒' },
    { id: 'about' as const, name: 'About', icon: 'ℹ️' }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return <ProfileForm />;
      case 'export':
        return <DataExport />;
      case 'import':
        return <DataImport />;
      case 'privacy':
        return <PrivacySettings />;
      case 'about':
        return <AboutSection />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage your account, data, and application preferences.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:w-64 flex-shrink-0">
          <nav className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center px-3 py-2 text-left text-sm font-medium rounded-md transition-colors ${
                  activeTab === tab.id
                    ? 'bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                <span className="mr-3 text-lg">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

const PrivacySettings: React.FC = () => {
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [crashReportsEnabled, setCrashReportsEnabled] = useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Privacy Settings
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
          Control how your data is used and what information is collected.
        </p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Usage Analytics
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Help improve the app by sharing anonymous usage statistics
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={analyticsEnabled}
              onChange={(e) => setAnalyticsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>

        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Crash Reports
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Automatically send crash reports to help fix issues
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={crashReportsEnabled}
              onChange={(e) => setCrashReportsEnabled(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
          </label>
        </div>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
          Data Storage
        </h4>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          All your workout data is stored locally on your device using IndexedDB. 
          No personal data is transmitted to external servers unless you explicitly 
          choose to export it. Your privacy is our priority.
        </p>
      </div>
    </div>
  );
};

const AboutSection: React.FC = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          About Workout Tracker
        </h3>
      </div>

      <div className="grid gap-6">
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 rounded-lg p-6">
          <h4 className="text-lg font-semibold text-primary-800 dark:text-primary-200 mb-2">
            Kettlebell Workout Tracker
          </h4>
          <p className="text-primary-700 dark:text-primary-300 mb-4">
            A comprehensive fitness tracking application designed specifically for kettlebell training.
            Track your workouts, monitor your progress, and achieve your fitness goals.
          </p>
          <div className="flex items-center text-sm text-primary-600 dark:text-primary-400">
            <span className="font-medium">Version:</span>
            <span className="ml-2">1.0.0</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">🏋️‍♀️ Features</h5>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Workout planning and execution</li>
              <li>• Progress tracking and analytics</li>
              <li>• Personal record monitoring</li>
              <li>• Goal setting and achievement</li>
              <li>• Data export and backup</li>
            </ul>
          </div>

          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 dark:text-white mb-2">🛠️ Technology</h5>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• React 18 + TypeScript</li>
              <li>• IndexedDB for local storage</li>
              <li>• PWA with offline support</li>
              <li>• Chart.js for visualizations</li>
              <li>• Tailwind CSS for styling</li>
            </ul>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h5 className="font-medium text-gray-900 dark:text-white mb-3">📊 System Information</h5>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Browser:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {navigator.userAgent.split(' ')[0]}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Platform:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {navigator.platform}
              </div>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Storage:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                IndexedDB Available
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h5 className="font-medium text-green-800 dark:text-green-200 mb-2">
            🎯 Open Source
          </h5>
          <p className="text-sm text-green-700 dark:text-green-300 mb-3">
            This application is open source and designed with privacy in mind. 
            All data is stored locally on your device.
          </p>
          <div className="flex items-center space-x-4 text-sm">
            <button className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium">
              View on GitHub
            </button>
            <button className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium">
              Report Issues
            </button>
            <button className="text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-200 font-medium">
              Documentation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};