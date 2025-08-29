import { useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/common/Layout';
import { AuthPage } from './pages/AuthPage';
import { PWAPrompt, OfflineIndicator } from './components/common/PWAPrompt';
import { useUiStore } from './stores/uiStore';
import { initializeTheme } from './utils/theme';

// Lazy load components for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(module => ({ default: module.DashboardPage })));
const WorkoutPage = lazy(() => import('./pages/WorkoutPage').then(module => ({ default: module.WorkoutPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then(module => ({ default: module.AnalyticsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(module => ({ default: module.SettingsPage })));
const AdminPage = lazy(() => import('./pages/AdminPage').then(module => ({ default: module.AdminPage })));

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

function App() {
  const { theme, setTheme } = useUiStore();
  
  useEffect(() => {
    // Initialize theme on app start
    const initialTheme = initializeTheme();
    if (initialTheme && initialTheme !== theme) {
      setTheme(initialTheme);
    }
    
    // Register service worker for PWA functionality
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      window.addEventListener('load', async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/'
          });
          
          console.log('Service Worker registered successfully:', registration);
          
          // Check for updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New update available
                  console.log('New service worker available');
                }
              });
            }
          });
        } catch (error) {
          console.error('Service Worker registration failed:', error);
        }
      });
    }
  }, [setTheme, theme]);
  
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
        <OfflineIndicator />
        
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <Suspense fallback={<LoadingSpinner />}>
                <DashboardPage />
              </Suspense>
            } />
            <Route path="workouts" element={
              <Suspense fallback={<LoadingSpinner />}>
                <WorkoutPage />
              </Suspense>
            } />
            <Route path="analytics" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AnalyticsPage />
              </Suspense>
            } />
            <Route path="settings" element={
              <Suspense fallback={<LoadingSpinner />}>
                <SettingsPage />
              </Suspense>
            } />
            <Route path="admin" element={
              <Suspense fallback={<LoadingSpinner />}>
                <AdminPage />
              </Suspense>
            } />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        
        <PWAPrompt />
        
        <Toaster
          position="top-right"
          toastOptions={{
            className: 'dark:bg-gray-800 dark:text-white',
            duration: 4000,
          }}
        />
      </div>
    </Router>
  );
}

export default App;
