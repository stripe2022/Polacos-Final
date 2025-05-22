const CACHE_NAME = 'polacos-gym-v1';
const FILES_TO_CACHE = [
  '/Polacos-Final/',
  '/Polacos-Final/manifest.json',
  '/Polacos-Final/index.html',
  '/Polacos-Final/style.css',
  '/Polacos-Final/app.js',
  '/Polacos-Final/icons/icon-192.png',
  '/Polacos-Final/icons/pic.png',
  '/Polacos-Final/db.js', // Si necesitas cachear db.js
  '/Polacos-Final/polacos-gym-banner.jpg', // Una página de offline personalizada
];

// Instalar el Service Worker y cachear archivos iniciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(FILES_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activar el SW inmediatamente
});

// Activar el Service Worker y eliminar versiones anteriores del cache
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
  self.clients.claim(); // Asegura que la aplicación use este SW desde el primer momento
});


self.addEventListener('fetch', (event) => {
  // Si es navegación (abrir la app), servimos index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('/Polacos-Final/index.html').then((response) =>
        response || fetch(event.request).catch(() =>
          caches.match('/Polacos-Final/offline.html') // solo si tienes offline.html
        )
      )
    );
  } else {
    // Para CSS, JS, imágenes, etc.
    event.respondWith(
      caches.match(event.request).then((response) =>
        response || fetch(event.request)
      )
    );
  }
});


// Función para obtener los clientes pendientes desde IndexedDB
async function getClientesPendientes() {
  const db = await abrirDB();
  const tx = db.transaction('clientes', 'readonly');
  const store = tx.objectStore('clientes');
  const allClientes = await store.getAll();

  return allClientes.filter(cliente => !cliente.sincronizado);
}
