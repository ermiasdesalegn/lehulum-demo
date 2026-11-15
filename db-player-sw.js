// Lehulum Service Worker (F5) - Offline Cache for Accessible Learning Media
const CACHE_NAME = "lehulum-offline-v1";

const CORE_ASSETS = [
  "/module/lehulum.js",
  "/savanna/pages/lehulum-demo.html",
  "/demo/blank.html",
  "/demo/media/lesson-001.am.vtt",
  "/demo/media/lesson-001.en.vtt",
  "/demo/media/lesson-001-descriptions.vtt",
  "/demo/media/lesson-001-64k.opus",
  "/demo/exports/lesson-001.am.pdf",
  "/demo/exports/lesson-001.en.pdf"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        // Individual failures don't block install (e.g. cross-origin or optional)
        console.warn("Pre-caching assets:", err);
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only handle GET requests
  if (req.method !== "GET") return;

  // For media range requests, delegate to browser unless cached
  if (req.headers.has("range")) {
    event.respondWith(
      fetch(req).catch(() => caches.match(req))
    );
    return;
  }

  // Network-first with cache fallback
  event.respondWith(
    fetch(req)
      .then((networkRes) => {
        if (networkRes && networkRes.status === 200) {
          const resClone = networkRes.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, resClone));
        }
        return networkRes;
      })
      .catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        // Offline fallback for HTML navigation
        if (req.mode === "navigate") {
          return (await caches.match("/savanna/pages/lehulum-demo.html")) ||
                 (await caches.match("/demo/blank.html"));
        }
        return new Response("Offline (not in cache)", { status: 503, statusText: "Offline" });
      })
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data) return;
  if (data.action === "clear-cache") {
    caches.delete(CACHE_NAME).then(() => {
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ status: "cleared" });
    });
  } else if (data.action === "cache-urls" && Array.isArray(data.urls)) {
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all(data.urls.map((u) => fetch(u).then((res) => cache.put(u, res)).catch(() => {})));
    }).then(() => {
      if (event.ports && event.ports[0]) event.ports[0].postMessage({ status: "cached" });
    });
  }
});

