// Production monitoring and error tracking utilities

interface ErrorInfo {
  message: string;
  stack?: string;
  componentStack?: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  userId?: string;
  timestamp: Date;
  userAgent: string;
  buildVersion: string;
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: Date;
  userId?: string;
  sessionId: string;
}

class MonitoringService {
  private sessionId: string;
  private buildVersion: string;
  private isDevelopment: boolean;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.buildVersion = import.meta.env.VITE_BUILD_VERSION || '1.0.0';
    this.isDevelopment = import.meta.env.DEV;
    
    this.initializeErrorTracking();
    this.initializePerformanceTracking();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeErrorTracking(): void {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        lineNumber: event.lineno,
        columnNumber: event.colno,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        buildVersion: this.buildVersion
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        buildVersion: this.buildVersion
      });
    });
  }

  private initializePerformanceTracking(): void {
    // Track Core Web Vitals
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.trackCoreWebVitals();
      this.trackResourceTimings();
      this.trackNavigationTimings();
    }
  }

  private trackCoreWebVitals(): void {
    try {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.trackPerformance('FCP', entry.startTime);
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.trackPerformance('LCP', lastEntry.startTime);
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.trackPerformance('FID', (entry as any).processingStart - entry.startTime);
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value;
          }
        }
        this.trackPerformance('CLS', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
    } catch (error) {
      console.warn('Performance tracking not available:', error);
    }
  }

  private trackResourceTimings(): void {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const resource = entry as PerformanceResourceTiming;
        if (resource.transferSize > 1024) { // Only track resources > 1KB
          this.trackPerformance(`Resource-${resource.initiatorType}`, resource.duration);
        }
      }
    }).observe({ entryTypes: ['resource'] });
  }

  private trackNavigationTimings(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        
        if (navigation) {
          this.trackPerformance('DNS-Lookup', navigation.domainLookupEnd - navigation.domainLookupStart);
          this.trackPerformance('TCP-Connection', navigation.connectEnd - navigation.connectStart);
          this.trackPerformance('Request-Response', navigation.responseEnd - navigation.requestStart);
          this.trackPerformance('DOM-Processing', navigation.domContentLoadedEventEnd - navigation.responseEnd);
          this.trackPerformance('Load-Complete', navigation.loadEventEnd - navigation.loadEventStart);
          this.trackPerformance('Total-Load-Time', navigation.loadEventEnd - navigation.fetchStart);
        }
      }, 0);
    });
  }

  public trackError(errorInfo: ErrorInfo): void {
    if (this.isDevelopment) {
      console.error('Error tracked:', errorInfo);
      return;
    }

    // In production, send to monitoring service
    this.sendToMonitoringService('error', {
      ...errorInfo,
      sessionId: this.sessionId,
      type: 'error'
    });
  }

  public trackPerformance(name: string, value: number): void {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    if (this.isDevelopment) {
      console.log(`Performance metric: ${name} = ${value.toFixed(2)}ms`);
      return;
    }

    this.sendToMonitoringService('performance', metric);
  }

  public trackUserAction(action: string, details?: Record<string, any>): void {
    if (this.isDevelopment) {
      console.log(`User action: ${action}`, details);
      return;
    }

    this.sendToMonitoringService('user-action', {
      action,
      details,
      sessionId: this.sessionId,
      timestamp: new Date()
    });
  }

  public trackWorkoutEvent(event: string, workoutData?: Record<string, any>): void {
    this.trackUserAction(`workout-${event}`, workoutData);
  }

  private async sendToMonitoringService(type: string, data: any): Promise<void> {
    try {
      // In a real application, this would send to your monitoring service
      // Examples: Sentry, DataDog, New Relic, Custom analytics endpoint
      
      const payload = {
        type,
        data,
        timestamp: new Date().toISOString(),
        buildVersion: this.buildVersion,
        userAgent: navigator.userAgent,
        url: window.location.href
      };

      // Store in localStorage as fallback for offline scenarios
      this.storeOfflineMetric(payload);

      // Send to monitoring endpoint
      if ('navigator' in window && 'sendBeacon' in navigator) {
        navigator.sendBeacon('/api/analytics', JSON.stringify(payload));
      } else {
        fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true
        }).catch(() => {
          // Fail silently to avoid affecting user experience
        });
      }
    } catch (error) {
      // Silently fail to avoid disrupting user experience
      console.warn('Failed to send monitoring data:', error);
    }
  }

  private storeOfflineMetric(payload: any): void {
    try {
      const stored = localStorage.getItem('workout-tracker-metrics') || '[]';
      const metrics = JSON.parse(stored);
      metrics.push(payload);
      
      // Keep only last 100 metrics to avoid storage bloat
      if (metrics.length > 100) {
        metrics.splice(0, metrics.length - 100);
      }
      
      localStorage.setItem('workout-tracker-metrics', JSON.stringify(metrics));
    } catch (error) {
      // Storage might be full or unavailable
    }
  }

  public async sendOfflineMetrics(): Promise<void> {
    try {
      const stored = localStorage.getItem('workout-tracker-metrics');
      if (!stored) return;

      const metrics = JSON.parse(stored);
      if (metrics.length === 0) return;

      for (const metric of metrics) {
        await fetch('/api/analytics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(metric)
        });
      }

      // Clear sent metrics
      localStorage.removeItem('workout-tracker-metrics');
    } catch (error) {
      console.warn('Failed to send offline metrics:', error);
    }
  }

  public getSessionInfo(): { sessionId: string; buildVersion: string } {
    return {
      sessionId: this.sessionId,
      buildVersion: this.buildVersion
    };
  }
}

// Export singleton instance
export const monitoring = new MonitoringService();

// React Error Boundary integration
export class ErrorBoundary extends Error {
  constructor(message: string, public componentStack?: string) {
    super(message);
    this.name = 'ErrorBoundary';
  }
}

export const trackErrorBoundary = (error: Error, errorInfo: any) => {
  monitoring.trackError({
    message: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    timestamp: new Date(),
    userAgent: navigator.userAgent,
    buildVersion: monitoring.getSessionInfo().buildVersion
  });
};

// Utility functions for common tracking scenarios
export const trackPageView = (pageName: string) => {
  monitoring.trackUserAction('page-view', { pageName });
};

export const trackFeatureUsage = (feature: string, metadata?: Record<string, any>) => {
  monitoring.trackUserAction('feature-usage', { feature, ...metadata });
};

export const trackConversion = (event: string, value?: number) => {
  monitoring.trackUserAction('conversion', { event, value });
};

// Initialize offline metric sending when app comes online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    monitoring.sendOfflineMetrics();
  });
}