const CACHE_NAME = 'polacos-gym-v3';
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
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // Forzar que el nuevo SW se active de inmediato
});

// Eliminar caches viejos al activar
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim(); // Forzar control inmediato por el nuevo SW
});

// Interceptar navegación y recursos
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Interceptar navegación (F5, abrir app, escribir URL)
  if (req.mode === 'navigate') {
    event.respondWith(
      caches.match('/Polacos-Final/index.html').then(cached => {
        return cached;
      })
    );
    return;
  }

  // Interceptar archivos (CSS, JS, imágenes)
  event.respondWith(
    caches.match(req).then(cached => {
      return cached || fetch(req);
    })
  );
});

// Permitir actualización inmediata desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
