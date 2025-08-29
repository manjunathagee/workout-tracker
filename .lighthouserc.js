module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:3000'],
      startServerCommand: 'npm run preview',
      startServerReadyPattern: 'ready in',
      startServerReadyTimeout: 30000,
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        // Performance thresholds
        'categories:performance': ['error', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['error', { minScore: 0.8 }],
        'categories:pwa': ['error', { minScore: 0.8 }],
        
        // Specific metrics
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.15 }],
        'total-blocking-time': ['error', { maxNumericValue: 500 }],
        
        // PWA requirements
        'installable-manifest': 'error',
        'service-worker': 'error',
        'offline-start-url': 'error',
        'apple-touch-icon': 'error',
        'maskable-icon': 'error',
        
        // Accessibility
        'color-contrast': 'error',
        'heading-order': 'error',
        'label': 'error',
        'link-name': 'error',
        
        // Best practices
        'uses-https': 'error',
        'is-on-https': 'error',
        'uses-text-compression': 'error',
        'uses-responsive-images': 'error',
        'efficient-animated-content': 'error',
        
        // Bundle size warnings
        'unused-javascript': ['warn', { maxLength: 3 }],
        'unminified-javascript': 'error',
        'unminified-css': 'error'
      }
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};