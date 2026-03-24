const CACHE = 'snow-os-v1';

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon.svg',
  './icons/icon-maskable.svg',
  './src/app.js',
  './src/data.js',
  './src/auth.js',
  './src/ui.js',
  './src/views/login.js',
  './src/views/guest.js',
  './src/views/instructor.js',
  './src/views/supervisor.js',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(SHELL))
      .catch(() => {}) // don't block install if a file is missing
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

  // Navigation → always serve index.html (SPA with hash routing)
  if (request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then((r) => r || fetch(request))
    );
    return;
  }

  // Cache-first, fall back to network and cache the response
  e.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE).then((c) => c.put(request, clone));
        return response;
      }).catch(() => cached);
    })
  );
});
