const VERSION = "v2";
const PAGES = `masjid-pages-${VERSION}`;
const STATIC = `masjid-static-${VERSION}`;
const ASSETS = `masjid-assets-${VERSION}`;
const API = `masjid-api-${VERSION}`;
const KEEP = [PAGES, STATIC, ASSETS, API];

const PRECACHE = [
  "/",
  "/offline",
  "/fee",
  "/pay",
  "/payment",
  "/signin",
  "/adminSignin",
  "/profile",
  "/addUser",
  "/dashboard/home",
  "/dashboard/payment-requests",
  "/dashboard/messages",
  "/dashboard/inbox",
  "/dashboard/link-visits",
  "/dashboard/accounts",
  "/dashboard/accounts/report",
  "/dashboard/ledger",
  "/dashboard/rent",
  "/dashboard/addUser",
];

// data that must never be kept
const API_SKIP = [
  "/api/auth/login",
  "/api/auth/logout",
  "/api/health",
  "/api/whatsapp",
  "/api/sms-db",
  "/api/notices/files",
];
const API_MAX_ENTRIES = 300;

// ---- helpers ---------------------------------------------------------------
const safeDecode = (p) => {
  try {
    return decodeURI(p);
  } catch {
    return p;
  }
};
// one cache key per URL ("[id]" and "%5Bid%5D" are the same file)
const keyFor = (url) =>
  new Request(url.origin + safeDecode(url.pathname) + url.search);
const okRes = (res) =>
  !!res && res.ok && !res.redirected && res.type !== "opaqueredirect";

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
}

// network first; if it is slow (ms) or fails, use the saved copy
async function networkFirst(request, cacheName, ms) {
  const cache = await caches.open(cacheName);
  const key = keyFor(new URL(request.url));
  const net = fetch(request).then((res) => {
    if (okRes(res)) cache.put(key, res.clone()).catch(() => {});
    else if (cacheName === API && (res.status === 401 || res.status === 403))
      caches.delete(API).catch(() => {});
    return res;
  });
  net.catch(() => {}); // no "unhandled rejection" noise when the saved copy won
  const slow = new Promise((resolve) =>
    setTimeout(() => cache.match(key).then(resolve), ms),
  );
  try {
    const first = await Promise.race([net, slow]);
    return first || (await net); // slow and nothing saved: keep waiting for the network
  } catch (err) {
    const hit = await cache.match(key);
    if (hit) return hit;
    throw err;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const key = keyFor(new URL(request.url));
  const hit = await cache.match(key);
  if (hit) return hit;
  const res = await fetch(request);
  if (okRes(res)) cache.put(key, res.clone()).catch(() => {});
  return res;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const key = keyFor(new URL(request.url));
  const hit = await cache.match(key);
  const update = fetch(request)
    .then((res) => {
      if (okRes(res)) cache.put(key, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  return hit || (await update) || Response.error();
}

// ---- warm up: save pages and the scripts / styles they use ------------------------
function discoverChunks(html) {
  // paths may contain ( ) [ ] (route groups like app/(main)/... and dynamic routes like [number])
  const re =
    /(?:\/_next\/)?static\/(?:chunks|css|media)\/[^"'\s\\<>]+?\.(?:js|css|woff2|woff|ttf)(?=["'\s\\)<>?]|$)/g;
  const out = new Set();
  for (const m of html.match(re) || []) out.add(m.replace(/^\/_next\//, ""));
  return [...out];
}

async function inPool(items, size, fn) {
  const q = [...items];
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (q.length) {
        try {
          await fn(q.shift());
        } catch {}
      }
    }),
  );
}

async function warm(urls) {
  const pages = await caches.open(PAGES);
  const stat = await caches.open(STATIC);
  const chunks = new Set();

  await inPool(urls, 3, async (u) => {
    const res = await fetch(u, {
      headers: { Accept: "text/html" },
      cache: "reload",
    });
    if (!okRes(res)) return;
    const html = await res.clone().text();
    await pages.put(keyFor(new URL(u, self.location.origin)), res);
    discoverChunks(html).forEach((c) => chunks.add(c));
  });

  await inPool([...chunks], 4, async (rel) => {
    const url = new URL("/_next/" + rel, self.location.origin);
    const key = keyFor(url);
    if (await stat.match(key)) return;
    const res = await fetch(url.href);
    if (okRes(res)) await stat.put(key, res);
  });
}

// ---- lifecycle ---------------------------------------------------------------
self.addEventListener("install", (event) => {
  event.waitUntil(Promise.all([warm(PRECACHE), self.skipWaiting()]));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name.startsWith("masjid-") && !KEEP.includes(name))
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = event.data && event.data.type;
  if (type === "WARM") event.waitUntil(warm(PRECACHE));
  else if (type === "CLEAR_API")
    event.waitUntil(caches.delete(API)); // on logout
  else if (type === "SKIP_WAITING") self.skipWaiting();
});

// ---- requests ------------------------------------------------------------------
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return; // saving data is done by the app
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.headers.get("RSC") || url.searchParams.has("_rsc")) return;

  if (url.pathname.startsWith("/api/")) {
    if (API_SKIP.some((p) => url.pathname.startsWith(p))) return;
    event.respondWith(
      networkFirst(request, API, 6000)
        .then((res) => {
          trim(API, API_MAX_ENTRIES);
          return res;
        })
        .catch(
          () =>
            new Response(
              JSON.stringify({ offline: true, message: "ইন্টারনেট নেই" }),
              {
                status: 503,
                headers: { "Content-Type": "application/json" },
              },
            ),
        ),
    );
    return;
  }

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      cacheFirst(request, STATIC).catch(() => Response.error()),
    );
    return;
  }

  if (
    url.pathname.startsWith("/_next/image") ||
    url.pathname.startsWith("/pwa/") ||
    /\.(?:png|jpe?g|webp|svg|ico|gif|avif)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, ASSETS));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      networkFirst(request, PAGES, 4500).catch(async () => {
        const pages = await caches.open(PAGES);
        const sameNoSearch = await pages.match(
          keyFor(new URL(url.pathname, url.origin)),
        );
        return (
          sameNoSearch ||
          (await pages.match(keyFor(new URL("/offline", url.origin)))) ||
          new Response("ইন্টারনেট নেই", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
  }
});
