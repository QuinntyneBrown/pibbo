# 0032: Offline after first use: a small service worker of Pibbo's own, bounded to Pibbo's files

**Status:** Accepted (journey 25)

## Context

`L2-033` asks that an activity opened once while online plays fully offline, recordings
included; that an activity never opened greys with a no-network symbol and does not open when
touched offline; and that a new content version arrives in the background without interrupting
a round. Only a service worker can answer a page load and its requests with no network, so this
is an architectural choice. The design named Angular's `@angular/service-worker`
(`ngsw-config.json`, `SwUpdate`) and an `ActivityAvailability` service.

What bounds the choice:

- *Children's privacy and safety*: no third-party call, nothing about a child kept or sent.
- *Lazy loading and memory*: the initial bundle on `main` is 243.09 kB raw (64.10 kB gzipped),
  already over its 240 kB warning, under the 245 kB error (ADR 0030);
  an activity's code, pictures and recordings load when it is chosen; caches have a fixed size.
- The CSP (`frontend/deploy/security-headers.json`) allows scripts, workers and fetches from
  `'self'` only, and must still hold.

## Decision

1. **Pibbo's own service worker, not `@angular/service-worker`.** `ngsw` adds a dependency, a
   provider in `app.config.ts` and `SwUpdate` code to the initial bundle, and its update flow is
   built for prompting a reload, which `L2-033` #3 rules out. Pibbo's worker is about a hundred
   lines: `tools/service-worker/sw-template.js`, written to `dist/pibbo/browser/sw.js` by
   `tools/service-worker/write-service-worker.mjs` at the end of `npm run build`, with the
   build's version (a hash of every file served), its shell and the list of every file. The
   page registers it in `main.ts` after the app starts, in production builds only; a browser
   that refuses changes nothing.
2. **Only Pibbo's own files, only GET.** The worker answers a GET for Pibbo's origin and a file
   the build listed; it never touches any other request, never posts, never reads storage. What
   it holds are copies of Pibbo's own files; nothing about a child, and nothing a child did,
   is cached or sent. The CSP is unchanged: `worker-src` falls back to `script-src 'self'`.
3. **What is cached, and when.** On install: the shell (`index.html`, the scripts and styles it
   loads, the fonts the styles name, and Home's code and what it imports, found from Home's route
   in the main script: Home is the first screen, and on a first visit it loads before the worker
   answers the page). Everything else when first used: an activity's code when
   it is opened, a picture or recording when fetched; the first recording or picture fetched
   from a content folder (`recordings/count/`, `pictures/words/`, …) also caches the rest of
   that folder in the background, so every round of an activity opened once has its recordings
   offline. A page load tries the network first, so a new version is seen, then the cached shell.
4. **Bounded.** One cache, `pibbo-<version>`, of at most 400 files (Pibbo serves 253); the
   oldest non-shell files go first. The build fails if Pibbo ever serves more files than that,
   so the bound is raised with a reason, as a budget is.
5. **Updates never interrupt a round.** A new version installs in the background, refetches the
   files the old cache held that still exist, and then waits. There is no `skipWaiting` and no
   reload: it takes over the next time Pibbo is opened with no other page of it open, and
   deletes the old cache then. A round in progress keeps the code it started with.
6. **Offline and never opened.** Home opens an activity as before. If its code cannot load (the
   device is offline and the activity was never opened), Home greys that picture and draws the
   no-network symbol (`aria-disabled="true"` on the button, the symbol, and "needs the internet"
   for a screen reader; drawn in `docs/mocks/pages/home/offline.html`) and stays. The picture is
   shown as usual again when the device is back online. Home knows nothing in advance and keeps
   no list of what was opened: the cache is the only record, and it is of files, not of a child.
7. **Tests.** The shared fixture blocks service workers by default, so every other spec runs
   as before; `offline.spec.ts` allows them, and the fixture's `network` lets a spec go offline
   and come back, and name a failure the spec expects while offline (the uncached activity's
   code). The e2e server can serve a second version of `sw.js` on request
   (`POST /__e2e/next-version`), so the update spec installs a real new version mid-round.

## Consequences

- The initial bundle grows by the registration only: 243.09 kB to 243.24 kB raw, 64.10 kB to
  64.15 kB gzipped. No budget changes.
- An activity's code is cached once it is opened; after an update, its new code is cached the
  next time it is opened online. Until then, offline, it greys as a never-opened one does
  (`L2-033` #2). Precaching every activity's code on update would fetch code a child may never
  open; it waits for a measured need.
- The greyed picture is shown and named, but no recording says "needs the internet": no such
  recording exists, and the browser never synthesises speech. The activity's own name is
  spoken as on any touch. A recording for it is open for the repository owner (which words, in
  which voice).
- A deployed host must serve `sw.js` from the site root with the same headers as every file
  (`docs/deploy.md`).
