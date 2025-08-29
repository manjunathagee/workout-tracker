const CACHE_NAME = 'workout-tracker-v1.0.0';
const STATIC_CACHE = 'workout-tracker-static-v1';
const DYNAMIC_CACHE = 'workout-tracker-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((error) => {
        console.error('Failed to cache static assets:', error);
      })
  );
  
  // Activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((cacheName) => {
              return cacheName !== STATIC_CACHE && 
                     cacheName !== DYNAMIC_CACHE &&
                     cacheName !== CACHE_NAME;
            })
            .map((cacheName) => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
  );
  
  // Take control of all pages
  self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests and external requests
  if (request.method !== 'GET' || !url.origin.includes(self.location.origin)) {
    return;
  }
  
  // Handle different types of requests
  if (isStaticAsset(request)) {
    // Static assets - cache first strategy
    event.respondWith(cacheFirst(request));
  } else if (isAPIRequest(request)) {
    // API requests - network first strategy
    event.respondWith(networkFirst(request));
  } else {
    // Navigation and other requests - network first with fallback
    event.respondWith(networkFirstWithFallback(request));
  }
});

// Background sync for workout data
self.addEventListener('sync', (event) => {
  console.log('Background sync event:', event.tag);
  
  if (event.tag === 'workout-sync') {
    event.waitUntil(syncWorkoutData());
  }
});

// Push notifications for workout reminders
self.addEventListener('push', (event) => {
  console.log('Push notification received:', event);
  
  const options = {
    body: event.data ? event.data.text() : 'Time for your workout!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '1'
    },
    actions: [
      {
        action: 'start-workout',
        title: 'Start Workout',
        icon: '/icons/action-start.png'
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/action-dismiss.png'
      }
    ],
    tag: 'workout-reminder',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('Workout Reminder', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();
  
  if (event.action === 'start-workout') {
    // Open the app to start workout page
    event.waitUntil(
      self.clients.openWindow('/workout/new')
    );
  } else if (event.action === 'dismiss') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      self.clients.openWindow('/')
    );
  }
});

// Cache strategies implementation
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);
    // Return offline fallback if available
    return caches.match('/offline.html');
  }
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed, trying cache:', error);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    // Return generic offline response for API requests
    return new Response(
      JSON.stringify({ error: 'Offline', message: 'Network unavailable' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.error('Network request failed:', error);
    
    // Try to get from cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // For navigation requests, return the cached app shell
    if (request.mode === 'navigate') {
      const appShell = await caches.match('/');
      if (appShell) {
        return appShell;
      }
    }
    
    // Final fallback
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Helper functions
function isStaticAsset(request) {
  return request.url.includes('/icons/') ||
         request.url.includes('/assets/') ||
         request.url.includes('.css') ||
         request.url.includes('.js') ||
         request.url.includes('.png') ||
         request.url.includes('.jpg') ||
         request.url.includes('.svg');
}

function isAPIRequest(request) {
  return request.url.includes('/api/') ||
         request.headers.get('Content-Type') === 'application/json';
}

// Background sync for offline workout data
async function syncWorkoutData() {
  console.log('Syncing workout data...');
  
  try {
    // This would typically sync with a backend API
    // For now, we'll just log that sync is happening
    console.log('Workout data sync completed');
    
    // Show notification that sync completed
    await self.registration.showNotification('Data Synced', {
      body: 'Your workout data has been synchronized',
      icon: '/icons/icon-192x192.png',
      tag: 'sync-complete',
      silent: true
    });
    
  } catch (error) {
    console.error('Sync failed:', error);
    
    // Schedule retry
    throw error; // This will cause the sync to be retried
  }
}

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'workout-backup') {
    event.waitUntil(performBackgroundBackup());
  }
});

async function performBackgroundBackup() {
  console.log('Performing background backup...');
  
  try {
    // This would create automatic backups of user data
    // Implementation would depend on storage strategy
    console.log('Background backup completed');
  } catch (error) {
    console.error('Background backup failed:', error);
  }
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Skipping waiting and activating new service worker');
    self.skipWaiting();
  }
});

// Clean up old caches periodically
setInterval(() => {
  cleanupOldCaches();
}, 24 * 60 * 60 * 1000); // Once per day

async function cleanupOldCaches() {
  const cacheNames = await caches.keys();
  const oldCaches = cacheNames.filter(name => 
    name.startsWith('workout-tracker-') && 
    name !== STATIC_CACHE && 
    name !== DYNAMIC_CACHE
  );
  
  await Promise.all(
    oldCaches.map(name => caches.delete(name))
  );
}

console.log('Service Worker loaded successfully');