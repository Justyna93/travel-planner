/* Travel Planner service worker — offline app shell.
 *
 * The app stores everything in IndexedDB (Dexie) and does no server data
 * fetching, so "offline" just means: serve the HTML documents, the Next.js
 * build assets, icons and the manifest from a cache when the network is gone.
 *
 * Strategies:
 *   - /_next/static/*            cache-first  (content-hashed, immutable)
 *   - navigations + RSC payloads network-first, fall back to cache, then to "/"
 *   - everything else same-origin stale-while-revalidate
 *
 * Bump CACHE_VERSION on any change to this file to drop old caches.
 */

const CACHE_VERSION = "v1";
const PRECACHE = `travel-precache-${CACHE_VERSION}`;
const RUNTIME = `travel-runtime-${CACHE_VERSION}`;

// URLs safe to fetch and cache up front. Client-rendered routes render an
// identical shell regardless of params, so caching "/" is enough to boot
// offline; visited trip pages are added to the runtime cache as you go.
const PRECACHE_URLS = [
  "/",
  "/data",
  "/templates",
  "/manifest.json",
  "/icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      // {cache: "reload"} bypasses the HTTP cache so we precache fresh copies.
      await Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(new Request(url, { cache: "reload" })),
        ),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key !== PRECACHE && key !== RUNTIME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // leave cross-origin to the browser

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request));
    return;
  }

  const isNavigation = request.mode === "navigate";
  const isRSC =
    request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");

  if (isNavigation || isRSC) {
    event.respondWith(networkFirst(request, isNavigation));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function cacheFirst(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return cached || Response.error();
  }
}

async function networkFirst(request, isNavigation) {
  const cache = await caches.open(RUNTIME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (isNavigation) {
      const shell = await caches.match("/", { ignoreSearch: true });
      if (shell) return shell;
    }
    return Response.error();
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((response) => {
      if (response && response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}
