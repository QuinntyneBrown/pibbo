// Pibbo's service worker (ADR 0032). tools/service-worker/write-service-worker.mjs writes it
// to dist/pibbo/browser/sw.js after the build, with VERSION, SHELL, FILES and MAX_ENTRIES
// set above this line.
//
// - It only answers GET requests for Pibbo's own origin. Anything else is not touched, and it
//   never sends anything anywhere: it holds copies of Pibbo's own files and nothing about a child.
// - The app shell (index.html, the initial scripts and styles, the fonts, Home's code) is cached
//   on install.
// - Everything else (an activity's code, pictures and recordings) is cached when first used;
//   the first recording or picture fetched from a folder also caches the rest of that folder,
//   so an activity opened once plays every round offline.
// - The cache holds at most MAX_ENTRIES files; the oldest are let go first.
// - A new version installs in the background, refreshes what the old one had cached, and
//   waits: it takes over only when no page of Pibbo is open, so a round is never interrupted.

/* global VERSION, SHELL, FILES, MAX_ENTRIES */
const CACHE = `pibbo-${VERSION}`;
const ALL = new Set(FILES);
const SHELL_SET = new Set(SHELL);
const warmed = new Set();

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll(SHELL);
      // Refresh, in the background, what the last version had cached and still exists.
      for (const name of await caches.keys()) {
        if (name === CACHE || !name.startsWith("pibbo-")) continue;
        const old = await caches.open(name);
        for (const request of await old.keys()) {
          const path = new URL(request.url).pathname;
          if (ALL.has(path) && !SHELL_SET.has(path))
            await cache.add(path).catch(() => undefined);
        }
      }
      await bound(cache);
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (name !== CACHE && name.startsWith("pibbo-"))
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.mode === "navigate") {
    event.respondWith(navigate(request));
    return;
  }
  if (!ALL.has(url.pathname)) return;
  event.respondWith(fromCache(url.pathname, event));
});

/** A page: the network first, so a new version is seen; the cached shell when offline. */
async function navigate(request) {
  try {
    return await fetch(request);
  } catch {
    const cached = await caches.match("/index.html", { cacheName: CACHE });
    return cached ?? Response.error();
  }
}

/** One of Pibbo's files: the cached copy, or the network's, kept for next time. */
async function fromCache(path, event) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(path);
  if (cached) return cached;
  // A whole file, never a range of one, so the copy kept is complete.
  const response = await fetch(path);
  if (response.ok && response.status === 200) {
    await cache.put(path, response.clone());
    event.waitUntil(warm(cache, path).then(() => bound(cache)));
  }
  return response;
}

/** The rest of a recordings or pictures folder, fetched once in the background. */
async function warm(cache, path) {
  const folder = path.match(/^\/(recordings|pictures)\/[^/]+\//)?.[0];
  if (!folder || warmed.has(folder)) return;
  warmed.add(folder);
  for (const file of FILES) {
    if (!file.startsWith(folder) || (await cache.match(file))) continue;
    await cache.add(file).catch(() => undefined);
  }
}

/** Lets the oldest files go once the cache holds more than MAX_ENTRIES; the shell stays. */
async function bound(cache) {
  const keys = await cache.keys();
  let over = keys.length - MAX_ENTRIES;
  for (const request of keys) {
    if (over <= 0) break;
    if (SHELL_SET.has(new URL(request.url).pathname)) continue;
    await cache.delete(request);
    over--;
  }
}
