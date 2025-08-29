import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../common/Button';
import useSound from 'use-sound';

interface TimerProps {
  initialTime: number; // in seconds
  type: 'rest' | 'exercise' | 'workout';
  isActive: boolean;
  onComplete?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
  title?: string;
  autoStart?: boolean;
  showControls?: boolean;
}

interface TimerState {
  timeRemaining: number;
  isRunning: boolean;
  isPaused: boolean;
  hasStarted: boolean;
}

export const Timer: React.FC<TimerProps> = ({
  initialTime,
  type,
  isActive,
  onComplete,
  onPause,
  onResume,
  onReset,
  title,
  autoStart = false,
  showControls = true
}) => {
  const [state, setState] = useState<TimerState>({
    timeRemaining: initialTime,
    isRunning: autoStart && isActive,
    isPaused: false,
    hasStarted: autoStart
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const notificationRef = useRef<Notification | null>(null);

  // Sound effects
  const [playRestComplete] = useSound('/sounds/rest-complete.mp3', { volume: 0.7 });
  const [playExerciseTransition] = useSound('/sounds/exercise-transition.mp3', { volume: 0.7 });
  const [playWorkoutComplete] = useSound('/sounds/workout-complete.mp3', { volume: 0.7 });
  const [playTick] = useSound('/sounds/tick.mp3', { volume: 0.3 });

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Main timer effect
  useEffect(() => {
    if (state.isRunning && isActive && state.timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setState(prev => {
          const newTime = prev.timeRemaining - 1;
          
          // Play tick sound for last 10 seconds
          if (newTime <= 10 && newTime > 0) {
            try {
              playTick();
            } catch (error) {
              console.warn('Failed to play tick sound:', error);
            }
          }

          if (newTime <= 0) {
            return {
              ...prev,
              timeRemaining: 0,
              isRunning: false
            };
          }

          return {
            ...prev,
            timeRemaining: newTime
          };
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, isActive, state.timeRemaining, playTick]);

  // Handle timer completion
  useEffect(() => {
    if (state.timeRemaining === 0 && state.hasStarted) {
      handleTimerComplete();
    }
  }, [state.timeRemaining, state.hasStarted]);

  // Reset timer when initialTime changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      timeRemaining: initialTime,
      isRunning: autoStart && isActive,
      isPaused: false,
      hasStarted: autoStart
    }));
  }, [initialTime, autoStart, isActive]);

  const handleTimerComplete = () => {
    // Play completion sound
    try {
      switch (type) {
        case 'rest':
          playRestComplete();
          break;
        case 'exercise':
          playExerciseTransition();
          break;
        case 'workout':
          playWorkoutComplete();
          break;
      }
    } catch (error) {
      console.warn('Failed to play completion sound:', error);
    }

    // Show browser notification
    showNotification();

    // Vibrate if supported (mobile)
    if ('vibrator' in navigator || 'webkitVibrate' in navigator) {
      try {
        navigator.vibrate?.(type === 'workout' ? [200, 100, 200] : [200]);
      } catch (error) {
        console.warn('Vibration failed:', error);
      }
    }

    // Call completion callback
    onComplete?.();
  };

  const showNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const messages = {
        rest: 'Rest period complete! Ready for your next set.',
        exercise: 'Exercise complete! Time for your next exercise.',
        workout: 'Workout complete! Great job!'
      };

      try {
        notificationRef.current = new Notification('Kettlebell Workout Timer', {
          body: messages[type],
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'workout-timer',
          requireInteraction: type === 'workout'
        });

        // Auto-close notification after 5 seconds (except workout completion)
        if (type !== 'workout') {
          setTimeout(() => {
            notificationRef.current?.close();
          }, 5000);
        }
      } catch (error) {
        console.warn('Failed to show notification:', error);
      }
    }
  };

  const handleStart = () => {
    setState(prev => ({
      ...prev,
      isRunning: true,
      isPaused: false,
      hasStarted: true
    }));
    onResume?.();
  };

  const handlePause = () => {
    setState(prev => ({
      ...prev,
      isRunning: false,
      isPaused: true
    }));
    onPause?.();
  };

  const handleReset = () => {
    setState({
      timeRemaining: initialTime,
      isRunning: false,
      isPaused: false,
      hasStarted: false
    });
    onReset?.();
  };

  const handleAddTime = (seconds: number) => {
    setState(prev => ({
      ...prev,
      timeRemaining: Math.max(0, prev.timeRemaining + seconds)
    }));
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getProgressPercentage = (): number => {
    if (initialTime === 0) return 100;
    return ((initialTime - state.timeRemaining) / initialTime) * 100;
  };

  const getTimerColor = (): string => {
    if (state.timeRemaining <= 10 && state.isRunning) {
      return 'text-red-500'; // Warning color for last 10 seconds
    }
    
    switch (type) {
      case 'rest':
        return 'text-blue-500';
      case 'exercise':
        return 'text-green-500';
      case 'workout':
        return 'text-purple-500';
      default:
        return 'text-gray-900 dark:text-white';
    }
  };

  const getProgressColor = (): string => {
    switch (type) {
      case 'rest':
        return 'stroke-blue-500';
      case 'exercise':
        return 'stroke-green-500';
      case 'workout':
        return 'stroke-purple-500';
      default:
        return 'stroke-primary-500';
    }
  };

  return (
    <div className="flex flex-col items-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center">
          {title}
        </h3>
      )}

      {/* Circular Progress Timer */}
      <div className="relative">
        <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            className="text-gray-200 dark:text-gray-700"
          />
          {/* Progress circle */}
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 45}`}
            strokeDashoffset={`${2 * Math.PI * 45 * (1 - getProgressPercentage() / 100)}`}
            className={getProgressColor()}
            style={{
              transition: state.isRunning ? 'stroke-dashoffset 1s linear' : 'none'
            }}
          />
        </svg>
        
        {/* Timer display */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className={`text-2xl font-bold ${getTimerColor()}`}>
              {formatTime(state.timeRemaining)}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {type}
            </div>
          </div>
        </div>
      </div>

      {/* Timer Status */}
      <div className="text-center">
        {state.timeRemaining === 0 && state.hasStarted ? (
          <div className="text-green-600 dark:text-green-400 font-medium">
            Complete! 🎉
          </div>
        ) : state.isPaused ? (
          <div className="text-yellow-600 dark:text-yellow-400 font-medium">
            Paused
          </div>
        ) : state.isRunning ? (
          <div className="text-primary-600 dark:text-primary-400 font-medium">
            Running...
          </div>
        ) : (
          <div className="text-gray-600 dark:text-gray-400 font-medium">
            Ready to start
          </div>
        )}
      </div>

      {/* Controls */}
      {showControls && (
        <div className="flex items-center space-x-2">
          {/* Quick time adjustment buttons */}
          <div className="flex space-x-1">
            <button
              onClick={() => handleAddTime(-10)}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              -10s
            </button>
            <button
              onClick={() => handleAddTime(10)}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              +10s
            </button>
          </div>

          {/* Main controls */}
          {!state.hasStarted || (state.isPaused && state.timeRemaining > 0) ? (
            <Button size="sm" onClick={handleStart}>
              {state.hasStarted ? 'Resume' : 'Start'}
            </Button>
          ) : state.isRunning ? (
            <Button size="sm" variant="outline" onClick={handlePause}>
              Pause
            </Button>
          ) : null}

          <Button size="sm" variant="outline" onClick={handleReset}>
            Reset
          </Button>
        </div>
      )}

      {/* Custom time input */}
      {!state.isRunning && (
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600 dark:text-gray-400">Set time:</span>
          <input
            type="number"
            min="1"
            max="3600"
            value={Math.floor(state.timeRemaining / 60)}
            onChange={(e) => {
              const minutes = parseInt(e.target.value) || 0;
              setState(prev => ({
                ...prev,
                timeRemaining: minutes * 60
              }));
            }}
            className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-center"
          />
          <span className="text-gray-600 dark:text-gray-400">min</span>
        </div>
      )}
    </div>
  );
};