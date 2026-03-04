const CACHE_NAME = 'pwa-theme-color-store-v12';
const ASSETS = [
    './',
    'index.html',
    'manifest.json',
    'icon.png',
    'icon-192.png'
];

self.addEventListener('install', (e) => {
    // Force the waiting service worker to become the active service worker.
    self.skipWaiting();

    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

self.addEventListener('activate', (e) => {
    // Claim clients to take control immediately without a page refresh
    e.waitUntil(clients.claim());

    // Delete any old caches that don't match the current CACHE_NAME
    e.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        // Network-First Strategy
        fetch(e.request)
            .then((response) => {
                // If we get a valid response, maybe update the cache for next time
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(e.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // If network fails (offline), fall back to cache
                return caches.match(e.request);
            })
    );
});
