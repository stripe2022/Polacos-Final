const CACHE_NAME = 'polacos-gym-v1';
const FILES_TO_CACHE = [
  '/Polacos-Final/',
  '/Polacos-Final/manifest.json',
  '/Polacos-Final/index.html',
  '/Polacos-Final/style.css',
  '/Polacos-Final/app.js',
  '/Polacos-Final/db.js',
  '/Polacos-Final/icons/icon-192.png',
  '/Polacos-Final/icons/pic.png',
  '/Polacos-Final/polacos-gym-banner.jpg'
  // '/Polacos-Final/offline.html' ← solo si usas una página offline personalizada
];

// Instalar y cachear archivos iniciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activa el SW inmediatamente
});

// Activar y eliminar cachés viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => 
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

// Interceptar solicitudes
self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/Polacos-Final/index.html').then((response) =>
        response || fetch(event.request)
      )
    );
  } else {
    event.respondWith(
      caches.match(event.request).then((response) =>
        response || fetch(event.request)
      )
    );
  }
});
