import React, { useState, useEffect } from 'react';
import { Button } from '../common/Button';
import { useAuthStore } from '../../stores/authStore';

interface NotificationConfig {
  enabled: boolean;
  restComplete: boolean;
  exerciseTransition: boolean;
  workoutComplete: boolean;
  sounds: {
    restComplete: string;
    exerciseTransition: string;
    workoutComplete: string;
  };
  volume: number;
  vibration: boolean;
}

interface NotificationSystemProps {
  onConfigChange?: (config: NotificationConfig) => void;
  className?: string;
}

const DEFAULT_CONFIG: NotificationConfig = {
  enabled: true,
  restComplete: true,
  exerciseTransition: true,
  workoutComplete: true,
  sounds: {
    restComplete: '/sounds/rest-complete.mp3',
    exerciseTransition: '/sounds/exercise-transition.mp3',
    workoutComplete: '/sounds/workout-complete.mp3'
  },
  volume: 0.7,
  vibration: true
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  onConfigChange,
  className = ''
}) => {
  const { user } = useAuthStore();
  const [config, setConfig] = useState<NotificationConfig>(DEFAULT_CONFIG);
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermissionStatus(Notification.permission);
    }

    // Load user preferences from localStorage
    const savedConfig = localStorage.getItem(`notifications_${user?.id}`);
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...DEFAULT_CONFIG, ...parsedConfig });
      } catch (error) {
        console.warn('Failed to load notification config:', error);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    // Save config when it changes
    if (user?.id) {
      localStorage.setItem(`notifications_${user.id}`, JSON.stringify(config));
      onConfigChange?.(config);
    }
  }, [config, user?.id, onConfigChange]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setPermissionStatus(permission);
        
        if (permission === 'granted') {
          // Show a test notification
          new Notification('Notifications Enabled!', {
            body: 'You will now receive workout timer notifications.',
            icon: '/favicon.ico'
          });
        }
      } catch (error) {
        console.error('Failed to request notification permission:', error);
      }
    }
  };

  const testSound = (soundType: keyof NotificationConfig['sounds']) => {
    try {
      const audio = new Audio(config.sounds[soundType]);
      audio.volume = config.volume;
      audio.play().catch(error => {
        console.warn('Failed to play test sound:', error);
      });
    } catch (error) {
      console.warn('Failed to create audio element:', error);
    }
  };

  const testVibration = () => {
    if ('vibrator' in navigator || 'webkitVibrate' in navigator) {
      try {
        navigator.vibrate?.([200, 100, 200]);
      } catch (error) {
        console.warn('Vibration test failed:', error);
      }
    }
  };

  const updateConfig = (updates: Partial<NotificationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  // Remove unused function - keeping for potential future use
  // const updateSounds = (soundType: keyof NotificationConfig['sounds'], value: string) => {
  //   setConfig(prev => ({
  //     ...prev,
  //     sounds: {
  //       ...prev.sounds,
  //       [soundType]: value
  //     }
  //   }));
  // };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className={`inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 ${className}`}
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Notifications
      </button>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Notification Settings
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Browser Permissions */}
      <div className="space-y-3">
        <h4 className="text-md font-medium text-gray-900 dark:text-white">
          Browser Permissions
        </h4>
        
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div>
            <div className="text-sm font-medium text-gray-900 dark:text-white">
              Browser Notifications
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Status: {permissionStatus}
            </div>
          </div>
          
          {permissionStatus === 'default' && (
            <Button size="sm" onClick={requestNotificationPermission}>
              Enable
            </Button>
          )}
          
          {permissionStatus === 'denied' && (
            <div className="text-xs text-red-600 dark:text-red-400">
              Denied. Please enable in browser settings.
            </div>
          )}
          
          {permissionStatus === 'granted' && (
            <div className="text-xs text-green-600 dark:text-green-400">
              ✓ Enabled
            </div>
          )}
        </div>
      </div>

      {/* Master Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            Enable Notifications
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Master toggle for all notification types
          </div>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
        </label>
      </div>

      {config.enabled && (
        <>
          {/* Notification Types */}
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Notification Types
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Rest Period Complete
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Notify when rest timer finishes
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testSound('restComplete')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Test sound"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 8.464L12 12l-3.536 3.536M21 12H3" />
                    </svg>
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.restComplete}
                      onChange={(e) => updateConfig({ restComplete: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Exercise Transition
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Notify when moving to next exercise
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testSound('exerciseTransition')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Test sound"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 8.464L12 12l-3.536 3.536M21 12H3" />
                    </svg>
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.exerciseTransition}
                      onChange={(e) => updateConfig({ exerciseTransition: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-600 rounded-lg">
                <div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Workout Complete
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Notify when entire workout finishes
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => testSound('workoutComplete')}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Test sound"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 14.142M8.464 8.464L12 12l-3.536 3.536M21 12H3" />
                    </svg>
                  </button>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.workoutComplete}
                      onChange={(e) => updateConfig({ workoutComplete: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Volume Control */}
          <div className="space-y-3">
            <h4 className="text-md font-medium text-gray-900 dark:text-white">
              Sound Settings
            </h4>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
                Volume:
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={config.volume}
                onChange={(e) => updateConfig({ volume: parseFloat(e.target.value) })}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400 min-w-0 flex-shrink-0">
                {Math.round(config.volume * 100)}%
              </span>
            </div>
          </div>

          {/* Vibration */}
          {('vibrator' in navigator || 'webkitVibrate' in navigator) && (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Vibration
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Vibrate device on notifications (mobile)
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={testVibration}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  title="Test vibration"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </button>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.vibration}
                    onChange={(e) => updateConfig({ vibration: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                </label>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};