const CACHE_NAME = 'mtalotekniikka-v11';
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/styles.min.css',
  '/script.min.js',
  '/beforeafter.min.js',
  '/manifest.webmanifest',
  '/offline.html',
  '/images/hero-home.svg',
  '/images/hero-generic.svg',
  '/images/600x400.svg',
  '/images/900x600.svg',
  '/images/900x300.svg',
  '/images/logo.svg',
  '/favicon.ico',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.mode === 'navigate' || request.destination === 'document') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          return resp;
        })
        .catch(() => caches.match(request).then((cached) => cached || caches.match('/offline.html')))
    );
    return;
  }

  if (request.destination === 'style' || request.destination === 'script') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          const copy = resp.clone();
          if (url.origin === self.location.origin && resp.ok) {
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return resp;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  if (request.destination === 'image') {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((resp) => {
        const copy = resp.clone();
        if (url.origin === self.location.origin && resp.ok) {
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return resp;
      }))
    );
  }
});
