const CACHE_NAME = 'inventario-pwa-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/manifest.json',
  '/favicon.ico',
  '/trabajador/pos',
  '/trabajador/inventario',
  '/admin/productos'
];

// Install Event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching shell assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch Event (Cache First for /uploads/ and static, Network First for API)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache strategy for uploaded photos
  if (url.pathname.startsWith('/uploads/')) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async (cache) => {
        const cachedResponse = await cache.match(event.request);
        if (cachedResponse) return cachedResponse;
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch (err) {
          // Placeholder or cached fallback if available
          return cachedResponse || Response.error();
        }
      })
    );
    return;
  }

  // Network First with Cache Fallback for API & pages
  if (event.request.method === 'GET') {
    event.respondWith(
      fetch(event.request)
        .then(async (response) => {
          if (response.status === 200) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(event.request, response.clone());
          }
          return response;
        })
        .catch(() => {
          return caches.match(event.request);
        })
    );
  }
});
