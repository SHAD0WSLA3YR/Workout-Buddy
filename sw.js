const CACHE_NAME = 'calisthenics-ai-cache-v2'; // Bumped version to ensure update
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://cdn.tailwindcss.com',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/hooks/useAppContext.tsx',
  '/hooks/useLocalStorage.ts',
  '/hooks/useOnlineStatus.ts',
  '/services/geminiService.ts',
  '/components/Layout.tsx',
  '/components/Onboarding.tsx',
  '/components/Button.tsx',
  '/components/icons/Icons.tsx',
  '/pages/Dashboard.tsx',
  '/pages/Performance.tsx',
  '/pages/Profile.tsx',
  '/pages/WorkoutSession.tsx'
];


// On install, pre-cache all app shell components and scripts.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('Opened cache and caching all app files');
      // Use addAll for atomic operation, but handle potential individual failures.
      return Promise.all(
        urlsToCache.map(url => {
          return cache.add(url).catch(err => {
            console.warn(`Failed to cache ${url}:`, err);
          });
        })
      );
    })
  );
});

// On fetch, use a stale-while-revalidate strategy.
self.addEventListener('fetch', event => {
  const { request } = event;

  // Ignore non-GET requests, chrome-extension URLs, and requests to the Gemini API.
  if (request.method !== 'GET' || request.url.startsWith('chrome-extension://') || request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  // For esm.sh dependencies, use cache-first strategy as they are versioned.
  if (request.url.startsWith('https://esm.sh/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache => {
        return cache.match(request).then(response => {
          return response || fetch(request).then(networkResponse => {
            if (networkResponse.ok) {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          });
        });
      })
    );
    return;
  }
  
  // For app files, use stale-while-revalidate.
  event.respondWith(
    caches.open(CACHE_NAME).then(cache => {
      return cache.match(request).then(cachedResponse => {
        const fetchPromise = fetch(request).then(networkResponse => {
          if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(error => {
          console.warn('Fetch failed; serving from cache if available.', request.url, error);
        });
        
        return cachedResponse || fetchPromise;
      });
    })
  );
});

// On activate, clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of open clients immediately
  );
});
