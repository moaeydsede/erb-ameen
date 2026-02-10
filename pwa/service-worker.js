const CACHE_NAME = "erp-pro-cache-v1";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./css/style.css",
  "./js/config.js",
  "./js/firebase.js",
  "./js/login.js",
  "./js/dashboard.js",
  "./js/session.js",
  "./js/ui.js",
  "./pwa/manifest.json",
  "./pwa/icon-192.png",
  "./pwa/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(CORE_ASSETS);
    self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Network-first for HTML, cache-first for others
  const isHTML = req.headers.get("accept")?.includes("text/html");
  if (isHTML) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(CACHE_NAME);
        cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req);
        return cached || caches.match("./index.html");
      }
    })());
    return;
  }

  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;
    try {
      const fresh = await fetch(req);
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
      return fresh;
    } catch {
      return cached;
    }
  })());
});
