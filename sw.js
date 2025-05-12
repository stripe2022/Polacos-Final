const CACHE_NAME = 'polacos-gym-v1';
const FILES_TO_CACHE = [
  '/Polacos-Final/',
  '/Polacos-Final/manifest.json',
  '/Polacos-Final/index.html',
  '/Polacos-Final/styles.css',
  '/Polacos-Final/app.js',
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

// Interceptar solicitudes y servir desde el cache o desde la red
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response || 
        fetch(event.request).catch(() => caches.match('/offline.html')) // Si no hay conexión, mostrar offline.html
      );
    })
  );
});

// Función para sincronizar con Supabase cuando haya conexión
self.addEventListener('sync', (event) => {
  if (event.tag === 'sincronizarConSupabase') {
    event.waitUntil(syncClientesConSupabase());
  }
});

// Sincronización de los clientes pendientes (utilizando la lógica de IndexedDB y Supabase)
async function syncClientesConSupabase() {
  const clientesPendientes = await getClientesPendientes();

  for (const cliente of clientesPendientes) {
    try {
      const { error } = await fetch('https://TUSUPABASEURL.supabase.co/rest/v1/clientes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer TU_CLAVE_PUBLICA`
        },
        body: JSON.stringify(cliente)
      });

      if (!error) {
        cliente.sincronizado = true; // Marcar como sincronizado
        await guardarCliente(cliente); // Guarda el cliente actualizado en IndexedDB
      } else {
        console.error("Error al sincronizar cliente:", error);
      }
    } catch (err) {
      console.error("Error de conexión:", err);
    }
  }
}

// Función para obtener los clientes pendientes desde IndexedDB
async function getClientesPendientes() {
  const db = await abrirDB();
  const tx = db.transaction('clientes', 'readonly');
  const store = tx.objectStore('clientes');
  const allClientes = await store.getAll();

  return allClientes.filter(cliente => !cliente.sincronizado);
}
