const CACHE_NAME = 'pwa-theme-color-store-v6';
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
        caches.match(e.request).then((response) => response || fetch(e.request))
    );
});
