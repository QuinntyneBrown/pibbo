# 0003: Self-hosted fonts and assets, and the security headers

**Status:** Accepted (journey 1)

## Decision

- Fredoka and Andika are bundled from `docs/mocks/assets/fonts/` into
  `frontend/projects/pibbo/public/fonts/` and declared with `@font-face` in the global styles.
  Nothing is loaded from a CDN. The fonts are TrueType, as the mocks ship them; converting them to
  WOFF2 is a later optimisation.
- Angular's font inlining (`optimization.fonts`) is off, because it fetches Google Fonts at build time.
- Critical-CSS inlining is off, because it adds an inline `onload` handler that a CSP without
  `unsafe-inline` script blocks.
- The static host sends the headers in
  [`frontend/deploy/security-headers.json`](../../frontend/deploy/security-headers.json) (see
  [`docs/deploy.md`](../deploy.md)): a Content-Security-Policy allowing only `'self'`, with
  `frame-ancestors 'none'` and no `unsafe-inline` script, plus `nosniff`, `no-referrer`, a
  Permissions-Policy that turns off the camera, microphone and location, and HSTS. This is the
  frontend part of `L2-030`; its CORS and rate-limit criteria wait for a backend.
- `style-src` allows `'unsafe-inline'`: Angular injects component styles as `<style>` elements at
  run time, and a static host cannot issue the per-response nonce (`ngCspNonce`) that would avoid
  it. `L2-030` forbids only inline script.
- The favicon is `frontend/projects/pibbo/public/favicon.ico`, served from Pibbo's own origin: the
  app icon as `docs/mocks/pages/brand/default.html` draws it (Pibbo on the Count blue tile), at
  16, 32, 48, 64, 128 and 256 px. It replaces the empty `data:,` icon used until the design drew one.

## Consequences

The e2e network guard fails any spec that makes a request off localhost, and reports CSP
violations as console errors, so a CDN or an inline script cannot creep in.
