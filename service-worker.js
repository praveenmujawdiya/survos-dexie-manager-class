self.addEventListener('install', function(event) {
    self.skipWaiting();
});

self.addEventListener('activate', function(event) {
    clients.claim();
});

self.addEventListener('fetch', function(event) {
    event.respondWith(fetch(event.request));
});