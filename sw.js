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
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(FILES_TO_CACHE);
    }).then(() => {
      // Enviar mensaje al cliente cuando termine de cachear
      self.skipWaiting();
    })
  );
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
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Si el recurso está en caché, lo devolvemos
      if (cachedResponse) {
        return cachedResponse;
      }

      // Si no está en caché, intentamos hacer fetch
      return fetch(event.request).catch(() => {
        // Si falla (ej. estamos offline) y es una navegación (HTML),
        // devolvemos el index.html cacheado
        if (event.request.mode === 'navigate') {
          return caches.match('/Polacos-Final/index.html');
        }
      });
    })
  );
});


// Permitir actualización inmediata
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
