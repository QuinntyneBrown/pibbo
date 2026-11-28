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
- Load nothing from any other origin; the app needs none.

No other setting is needed.

## Where it is published

Every commit to main that passes CI is published to Azure Static Web Apps (`swa-pibbo`, resource
group `rg-pibbo`) at <https://blue-ocean-09e66a70f.8.azurestaticapps.net>; see
[ADR 0032](adr/0032-publish-to-azure-static-web-apps-from-main.md). The `deploy` job in
`.github/workflows/ci.yml` uploads the build the checks ran against. Its host settings,
`staticwebapp.config.json`, are generated into the build from `security-headers.json` by
`node tools/deploy/static-web-app-config.mjs`; never write that file by hand.
