# Deploying Pibbo

Pibbo's app is a static site: `cd frontend && npm ci && npm run build` writes it to
`frontend/dist/pibbo/browser/`. It does not call the content service, which is deployed on its
own: see [`backend/README.md`](../backend/README.md) for its settings and
[`backend/deploy/`](../backend/deploy/) for the stack and the script that deploys it with a
readiness gate and automatic rollback ([ADR 0032](adr/0032-content-backend.md)).

## What the host must do

- Serve `dist/pibbo/browser/` over HTTPS only, redirecting HTTP to HTTPS.
- Answer any path without a file extension with `index.html` (the app's routes), and a missing
  file with 404.
- Send, on every response, the headers in
  [`frontend/deploy/security-headers.json`](../frontend/deploy/security-headers.json). It is the
  single source: the e2e server (`frontend/e2e/serve.mjs`) sends the same file, and
  `frontend/e2e/specs/security-headers.spec.ts` checks them. If the host takes another format
  (an nginx `add_header` list, a `_headers` file), generate it from that JSON.
- Load nothing from any other origin; the app needs none.

No other setting is needed.
