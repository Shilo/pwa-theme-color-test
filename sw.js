// Minimal service worker to pass PWA install criteria
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('pwa-theme-color-store-v2').then((cache) => cache.addAll([
            './',
            'index.html',
            'manifest.json',
            'icon.png',
            'icon-192.png'
        ])),
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((response) => response || fetch(e.request)),
    );
});
