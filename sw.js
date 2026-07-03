/* ----------------------------------------------------
   Skyflow Weather Dashboard - PWA Service Worker (sw.js)
   ---------------------------------------------------- */

const CACHE_NAME = 'skyflow-cache-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.json',
  './icon.svg',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=Inter:wght@300;400;500;600&display=swap',
  'https://unpkg.com/lucide@latest'
];

// 1. Install event: Cache essential shell elements
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching static shell assets');
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Force active service worker to take control immediately
  self.skipWaiting();
});

// 2. Activate event: Cleanup stale caches from previous builds
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache: ', key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch event: Cache-First, Network-Fallback strategy for assets
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Avoid intercepting API queries (e.g. Open-Meteo or OpenWeatherMap fetches)
  if (requestUrl.hostname.includes('open-meteo.com') || requestUrl.hostname.includes('openweathermap.org')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Return cached version of weather if possible, or just fail gracefully
        return caches.match(event.request);
      })
    );
    return;
  }

  // Intercept other requests (documents, stylesheets, scripts, icons, CDN links)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached version instantly, fetch updated version in background to refresh cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => { /* Ignore offline background refresh errors */ });
        
        return cachedResponse;
      }

      // If asset is not cached, execute normal network fetch
      return fetch(event.request).then((networkResponse) => {
        // Cache new dynamically requested assets on the fly (e.g., loaded fonts, script details)
        if (networkResponse.status === 200 && event.request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return networkResponse;
      });
    })
  );
});
