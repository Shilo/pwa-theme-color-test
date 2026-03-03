// Minimal service worker to pass PWA install criteria
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('pwa-theme-color-store').then((cache) => cache.addAll([
            '/',
            '/index.html',
        ])),
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request)),
    );
});
