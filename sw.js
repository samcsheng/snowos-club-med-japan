const CACHE = 'snow-os-v1';

const STATIC_ASSETS = [
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
];

// Pre-cache only truly static assets (icons, manifest)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;
  const url = new URL(request.url);

  // Icons and manifest: cache-first (they never change between deploys)
  if (STATIC_ASSETS.some((a) => url.pathname.endsWith(a.replace('./', '/')))) {
    e.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response && response.status === 200) {
          caches.open(CACHE).then((c) => c.put(request, response.clone()));
        }
        return response;
      }))
    );
    return;
  }

  // Everything else (HTML, JS): network-first so design changes show on refresh
  // Falls back to cache only when offline
  e.respondWith(
    fetch(request)
      .then((response) => {
        if (response && response.status === 200 && response.type !== 'opaque') {
          caches.open(CACHE).then((c) => c.put(request, response.clone()));
        }
        return response;
      })
      .catch(() => caches.match(request))
  );
});
