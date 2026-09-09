/* Travel Planner service worker — offline app shell.
 *
 * The app keeps all data in IndexedDB (Dexie) and does no server data
 * fetching, so "offline" just means serving the things the browser would
 * otherwise go to the network for:
 *
 *   1. /_next/static/*  — content-hashed JS/CSS. Cache-first, forever.
 *   2. HTML documents   — one per visited route. Network-first, fall back to
 *                         the cached copy for that path, then to the "/" shell.
 *   3. RSC payloads     — what <Link> navigations fetch. Next varies these by a
 *                         volatile "?_rsc=<hash>" query and by the RSC /
 *                         Next-Router-Prefetch headers, so they are cached and
 *                         matched by PATHNAME ONLY (see rscKey / ignoreVary).
 *                         Because Next prefetches every in-viewport <Link>,
 *                         opening a trip online warms all five tab payloads.
 *   4. Everything else same-origin (icons, manifest) — stale-while-revalidate.
 *
 * Bump CACHE_VERSION on any change here to discard old caches.
 */

const CACHE_VERSION = "v2";
const STATIC_CACHE = `travel-static-${CACHE_VERSION}`;
const DOC_CACHE = `travel-docs-${CACHE_VERSION}`;
const RSC_CACHE = `travel-rsc-${CACHE_VERSION}`;
const ASSET_CACHE = `travel-assets-${CACHE_VERSION}`;
const CURRENT_CACHES = new Set([
  STATIC_CACHE,
  DOC_CACHE,
  RSC_CACHE,
  ASSET_CACHE,
]);

// Static routes + assets safe to fetch up front. Client-rendered routes render
// an identical shell regardless of params, so "/" is enough to boot offline;
// visited trip routes are added to the caches as you go.
const PRECACHE_ROUTES = ["/", "/data", "/templates"];
const PRECACHE_ASSETS = [
  "/manifest.json",
  "/icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-512.png",
  "/icons/apple-touch-icon.png",
];

// Normalised cache keys: origin + pathname only, so a request keeps matching
// regardless of "?_rsc=" hashes or trailing query state.
function docKey(rawUrl) {
  const u = new URL(rawUrl, self.location.origin);
  return new Request(u.origin + u.pathname);
}
function rscKey(rawUrl) {
  const u = new URL(rawUrl, self.location.origin);
  return new Request(u.origin + u.pathname + "?__sw=rsc");
}

// cache.put() rejects a response whose `redirected` flag is set; rebuild it.
async function safePut(cache, key, response) {
  if (!response || !response.ok) return;
  const body = await response.clone().blob();
  const copy = new Response(body, {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
  await cache.put(key, copy);
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const docs = await caches.open(DOC_CACHE);
      const rsc = await caches.open(RSC_CACHE);
      const assets = await caches.open(ASSET_CACHE);

      await Promise.allSettled([
        ...PRECACHE_ROUTES.map(async (route) => {
          // The HTML document...
          try {
            const res = await fetch(route, { cache: "reload" });
            await safePut(docs, docKey(route), res);
          } catch {
            /* offline during install — runtime caching will fill in later */
          }
          // ...and the RSC payload the client router asks for on navigation.
          // Only store a genuine flight response — some hosts ignore the RSC
          // header at the edge and hand back HTML, which would poison the cache.
          try {
            const res = await fetch(route, {
              cache: "reload",
              headers: { RSC: "1" },
            });
            const type = res.headers.get("content-type") || "";
            if (type.includes("text/x-component")) {
              await safePut(rsc, rscKey(route), res);
            }
          } catch {
            /* ignore */
          }
        }),
        ...PRECACHE_ASSETS.map(async (path) => {
          try {
            const res = await fetch(path, { cache: "reload" });
            await safePut(assets, new Request(path), res);
          } catch {
            /* ignore */
          }
        }),
      ]);

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
          .filter((key) => !CURRENT_CACHES.has(key))
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
  if (url.origin !== self.location.origin) return; // leave cross-origin alone

  // 1. Immutable build assets.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // 3. RSC payloads — detect before navigations (these are also GETs).
  const isRSC =
    request.headers.get("RSC") === "1" || url.searchParams.has("_rsc");
  if (isRSC) {
    event.respondWith(handleRSC(request));
    return;
  }

  // 2. Page navigations.
  if (request.mode === "navigate") {
    event.respondWith(handleNavigate(request));
    return;
  }

  // 4. Other same-origin GETs.
  event.respondWith(staleWhileRevalidate(request, ASSET_CACHE));
});

async function handleRSC(request) {
  const cache = await caches.open(RSC_CACHE);
  const key = rscKey(request.url);
  try {
    const res = await fetch(request);
    await safePut(cache, key, res);
    return res;
  } catch {
    const hit = await cache.match(key, { ignoreVary: true });
    if (hit) return hit;
    // Serve the shell payload so the client router still renders the app frame
    // rather than the browser's offline error.
    const shell = await cache.match(rscKey("/"), { ignoreVary: true });
    if (shell) return shell;
    return new Response("", { status: 503, statusText: "Offline" });
  }
}

async function handleNavigate(request) {
  const cache = await caches.open(DOC_CACHE);
  const key = docKey(request.url);
  try {
    const res = await fetch(request);
    await safePut(cache, key, res);
    return res;
  } catch {
    const exact = await cache.match(key, { ignoreVary: true });
    if (exact) return exact;
    const shell = await cache.match(docKey("/"), { ignoreVary: true });
    if (shell) return shell;
    return new Response(
      "<!doctype html><meta charset=utf-8><title>Offline</title><body style=\"font:16px system-ui;padding:2rem\">You're offline and this page hasn't been opened before.",
      { status: 503, headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return cached || Response.error();
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.ok) cache.put(request, res.clone());
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}
