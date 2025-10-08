const CACHE_NAME = 'costa-brava-v1';
const RUNTIME_CACHE = 'costa-brava-runtime';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// Activate event - clean up old caches and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME && name !== RUNTIME_CACHE)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first for API, cache first for assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Only cache GET requests to avoid errors with POST/PATCH/DELETE
  if (request.method !== 'GET') {
    return;
  }
  
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return;
  }

  // API requests - network first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE)
            .then(cache => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - cache first with network fallback
  if (
    url.pathname.startsWith('/assets') ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|webp|svg|woff|woff2)$/)
  ) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;
          
          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              const responseClone = response.clone();
              caches.open(RUNTIME_CACHE)
                .then(cache => cache.put(request, responseClone));
              
              return response;
            });
        })
    );
    return;
  }

  // HTML - network first with cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE)
          .then(cache => cache.put(request, responseClone));
        return response;
      })
      .catch(() => caches.match(request))
  );
});
