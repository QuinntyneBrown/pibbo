# 0004: E2E fixtures

**Status:** Accepted (journey 1)

## Decision

Every spec imports `test` and `expect` from `frontend/e2e/fixtures/test.ts`, which:

- **Fixes the clock** with Playwright's `page.clock.install` at `2026-01-05T09:00:00Z`.
- **Seeds randomness** by replacing `Math.random` with a seeded generator (mulberry32) in an init
  script. `BrowserRandomSource` reads `Math.random`, so the app's `RANDOM_SOURCE` is seeded with
  no test code in the product.
- **Stands in for the audio player** by replacing `HTMLMediaElement.prototype.play`, `pause` and
  `load`: `play` records the requested recording's path, in order, and ends at once. Specs read
  it through the `spoken` fixture (`await spoken.recordings()`). No real sound plays and no spec
  waits for a recording's length.
- **Guards the network and the page**: any request off localhost is aborted and fails the spec,
  as does a request left unanswered, a failed local request, a page error or a console error
  (which includes CSP violations).

Specs run against the production build, served by `frontend/e2e/serve.mjs` with the deployed
security headers, in Chromium only, as a phone (Pixel 7, touch) and as a desktop. Page objects in
`frontend/e2e/pages/` own every selector.

## Why at the browser boundary

Swapping the Angular `AUDIO_PLAYER` binding would need a test hook in the production bundle.
Faking the browser APIs the bindings use keeps the product free of test code and still exercises
`BrowserAudioPlayer` and `BrowserRandomSource` end to end.
