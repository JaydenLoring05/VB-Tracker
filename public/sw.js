/* NextRep service worker.
 *
 * SECURITY RULE: this worker only ever stores things that are identical for every
 * visitor, so nothing can leak between accounts on a shared device:
 *   1. Build assets under /_next/static/ (content-hashed, same for everyone)
 *   2. Brand icons under /icons/
 *   3. The static /offline fallback page (contains no user data)
 * It NEVER stores HTML documents of any other route (dashboard, coach, /auth/*,
 * /login ...), RSC/flight payloads, API responses, or cross-origin requests such as
 * Supabase (*.supabase.co). Navigations are network-first and are only answered
 * from the cache with the /offline page when the network is unreachable. Every
 * other request is left to the browser untouched (we simply do not call respondWith).
 * If you add a new cache rule, it must keep this property.
 */

const CACHE_VERSION = "v1";
const CACHE_PREFIX = "nextrep-";
const STATIC_CACHE = `${CACHE_PREFIX}static-${CACHE_VERSION}`;
const OFFLINE_URL = "/offline";

async function cacheOfflinePage() {
  const cache = await caches.open(STATIC_CACHE);
  // "reload" bypasses the HTTP cache so we store the current build's page.
  const response = await fetch(new Request(OFFLINE_URL, { cache: "reload" }));
  const isHtml = (response.headers.get("content-type") || "").includes("text/html");
  // Refuse redirects (e.g. to /login or /dashboard) so a user-specific response can never be stored.
  if (response.ok && !response.redirected && isHtml) {
    await cache.put(OFFLINE_URL, response);
  }
}

self.addEventListener("install", (event) => {
  // Install must not fail just because the offline page fetch failed.
  event.waitUntil(cacheOfflinePage().catch(() => undefined).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith(CACHE_PREFIX) && name !== STATIC_CACHE)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

function isCacheableStaticPath(pathname) {
  return pathname.startsWith("/_next/static/") || pathname.startsWith("/icons/");
}

async function cacheFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok && response.type === "basic") {
    // Fire and forget: do not delay the response on the cache write.
    cache.put(request, response.clone()).catch(() => undefined);
  }
  return response;
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  // Same-origin only. Supabase and any other third party bypass the worker entirely.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Network-first. The response is returned as-is and never stored.
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(STATIC_CACHE);
        const offline = await cache.match(OFFLINE_URL);
        return (
          offline ||
          new Response("You are offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" }
          })
        );
      })
    );
    return;
  }

  if (isCacheableStaticPath(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});
