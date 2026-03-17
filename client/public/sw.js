const CACHE_NAME = 'costa-brava-v1';
const RUNTIME_CACHE = 'costa-brava-runtime';

// Cache size limits and age-based eviction
const CACHE_LIMITS = {
  'api-cache': { maxEntries: 50, maxAge: 24 * 60 * 60 * 1000 },
  'image-cache': { maxEntries: 100, maxAge: 7 * 24 * 60 * 60 * 1000 },
  'page-cache': { maxEntries: 30, maxAge: 24 * 60 * 60 * 1000 },
};
const MAX_RESPONSE_SIZE = 5 * 1024 * 1024; // 5MB

// Trim a cache to its configured maxEntries limit (evicts oldest first)
async function trimCache(cacheName) {
  const limits = CACHE_LIMITS[cacheName];
  if (!limits) return;
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > limits.maxEntries) {
    for (let i = 0; i < keys.length - limits.maxEntries; i++) {
      await cache.delete(keys[i]);
    }
  }
}

// Evict entries older than maxAge from all limited caches
async function evictExpiredEntries() {
  const now = Date.now();
  for (const [cacheName, limits] of Object.entries(CACHE_LIMITS)) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    for (const key of keys) {
      const response = await cache.match(key);
      if (response) {
        const dateHeader = response.headers.get('date');
        if (dateHeader) {
          const age = now - new Date(dateHeader).getTime();
          if (age > limits.maxAge) {
            await cache.delete(key);
          }
        }
      }
    }
  }
}

// Put a response into cache only if it is within the size limit, then trim
async function cachePut(cacheName, request, response) {
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_SIZE) {
    return;
  }
  // If no Content-Length header, check actual blob size
  if (!contentLength) {
    const blob = await response.clone().blob();
    if (blob.size > MAX_RESPONSE_SIZE) {
      return;
    }
  }
  const cache = await caches.open(cacheName);
  await cache.put(request, response);
  trimCache(cacheName);
}

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// All known cache names that should not be deleted on activate
const KNOWN_CACHES = new Set([
  CACHE_NAME,
  RUNTIME_CACHE,
  ...Object.keys(CACHE_LIMITS),
]);

// Activate event - clean up old caches, evict expired entries, and take control
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => !KNOWN_CACHES.has(name))
            .map(name => caches.delete(name))
        );
      })
      .then(() => evictExpiredEntries())
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

  // Skip Vite dev server requests (HMR, source files)
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.search.includes('t=')
  ) {
    return;
  }

  // API requests - network first
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          cachePut('api-cache', request, response.clone());
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Static assets - cache first with network fallback (only production hashed assets)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request)
        .then(cached => {
          if (cached) return cached;

          return fetch(request)
            .then(response => {
              if (!response || response.status !== 200) {
                return response;
              }

              cachePut('image-cache', request, response.clone());

              return response;
            });
        })
    );
    return;
  }

  // HTML navigation - network first with cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          cachePut('page-cache', request, response.clone());
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
});
