// Golestan's service worker: keeps the garden available offline.
// Pages and code: served from the cache, refreshed in the background.
// Recordings and fonts: from the cache once fetched.
// Shirin's AI (Anthropic) and the optional server API: always the network.

const CACHE = "golestan-offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      try {
        const res = await fetch("files.json", { cache: "no-cache" });
        const { files } = await res.json();
        await cache.addAll(files.filter((f) => !f.startsWith("vendor/")));
      } catch {
        // install anyway; pages get cached as they're visited
      }
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const isFont = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!sameOrigin && !isFont) return; // Anthropic API and anything else: straight to the network
  if (sameOrigin && url.pathname.includes("/api/")) return;

  const cacheFirst = isFont || url.pathname.endsWith(".mp3");
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req, { ignoreSearch: true });
      const refresh = fetch(req)
        .then((res) => {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (cached) {
        if (!cacheFirst) event.waitUntil(refresh);
        return cached;
      }
      const res = await refresh;
      if (res) return res;
      if (req.mode === "navigate") return (await cache.match("index.html")) || Response.error();
      return Response.error();
    })(),
  );
});
