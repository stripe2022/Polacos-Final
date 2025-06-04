const CACHE_NAME = 'polacos-gym-v2';
const FILES_TO_CACHE = [
  '/Polacos-Final/',
  '/Polacos-Final/index.html',
  '/Polacos-Final/manifest.json',
  '/Polacos-Final/style.css',
  '/Polacos-Final/app.js',
  '/Polacos-Final/db.js',
  '/Polacos-Final/icons/icon-192.png',
  '/Polacos-Final/icons/pic.png',
  '/Polacos-Final/polacos-gym-banner.jpg'
];

// Cachear archivos al instalar
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES_TO_CACHE))
  );
  self.skipWaiting();
});

// Eliminar caches viejos al activar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      }))
    )
  );
  self.clients.claim();
});

// Servir desde cache
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/Polacos-Final/index.html').then(response =>
        response || fetch(event.request)
      )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then(response =>
        response || fetch(event.request)
      )
    );
  }
});

// Permitir actualización inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
