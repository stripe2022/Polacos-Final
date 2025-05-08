const CACHE_NAME = "polacos-gym-cache-v1";
const STATIC_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./db.js",
  "./manifest.json",
  "./polacos-gym-banner.jpg",
  "https://cdn.jsdelivr.net/npm/eruda",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

// INSTALAR SERVICE WORKER Y PRECACHE
self.addEventListener("install", event => {
  console.log("[SW] Instalando...");
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log("[SW] Cacheando archivos esenciales...");
        return cache.addAll(STATIC_ASSETS);
      })
  );
});

// ACTIVAR Y LIMPIAR CACHES ANTIGUAS
self.addEventListener("activate", event => {
  console.log("[SW] Activado.");
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      )
    )
  );
});

// FETCH Y FALLBACK OFFLINE
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then(res => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, res.clone());
          return res;
        });
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.headers.get("accept").includes("text/html")) {
            return caches.match("./index.html");
          }
        });
      })
  );
});
