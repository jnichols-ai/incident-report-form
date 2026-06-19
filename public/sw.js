// Minimal service worker: caches the app shell for offline/installable PWA
// support. Network requests (especially /api/*) always go to the network.
//
// IMPORTANT: the HTML document ("/") must always be checked against the
// network first. If it's served cache-first like the hashed JS/CSS assets,
// a phone that already cached the page will keep running old app code
// forever, even after a new deploy — this caused a real bug where a stale
// cached page still submitted plain JSON instead of multipart FormData,
// which the (updated) API route rejected with a Content-Type error.
const CACHE_NAME = "incident-report-shell-v2";
const SHELL_URLS = ["/", "/manifest.json", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Never cache API calls — submissions must always hit the network.
  if (url.pathname.startsWith("/api/")) return;

  // The page document itself: network-first, so a deploy is picked up the
  // very next time the page loads (with internet access). Falls back to
  // whatever's cached only if the network request fails (offline).
  if (request.mode === "navigate" || request.destination === "document") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  // Hashed JS/CSS/image assets: safe to cache-first, since Next.js gives
  // every build's assets a new content-hashed filename — a stale cache
  // entry simply won't match the new deploy's URLs.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy)).catch(() => {});
          return response;
        })
        .catch(() => cached);
    })
  );
});
