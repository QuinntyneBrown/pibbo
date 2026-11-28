# Deploying Pibbo

Pibbo is a static site: `cd frontend && npm ci && npm run build` writes it to
`frontend/dist/pibbo/browser/`. There is no backend.

## What the host must do

- Serve `dist/pibbo/browser/` over HTTPS only, redirecting HTTP to HTTPS.
- Answer any path without a file extension with `index.html` (the app's routes), and a missing
  file with 404.
- Send, on every response, the headers in
  [`frontend/deploy/security-headers.json`](../frontend/deploy/security-headers.json). It is the
  single source: the e2e server (`frontend/e2e/serve.mjs`) sends the same file, and
  `frontend/e2e/specs/security-headers.spec.ts` checks them. If the host takes another format
  (an nginx `add_header` list, a `_headers` file), generate it from that JSON.
- Serve `sw.js` (Pibbo's service worker, ADR 0032) from the site root with the same headers, and
  without long caching (`Cache-Control: no-cache`), so a new version is found on the next visit.
- Load nothing from any other origin; the app needs none.

No other setting is needed.
