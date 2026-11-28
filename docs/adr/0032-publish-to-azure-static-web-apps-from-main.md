# 0032: Every commit to main is published to Azure Static Web Apps

**Status:** Accepted (asked for by the repository owner)

## Context

The repository owner asked for every commit to main to be published to Azure. Pibbo is a static
site with no backend, and [`docs/deploy.md`](../deploy.md) lists what its host must do: HTTPS
only, `index.html` for any path without a file extension, a 404 for a missing file, and the
headers in `frontend/deploy/security-headers.json` on every response. The build-and-deploy design
left the platform `<TO SUPPLY>`.

## Decision

1. **The host is Azure Static Web Apps**, `swa-pibbo` in resource group `rg-pibbo` (East US 2),
   on the Standard plan: the subscription has no Free Static Web App left. It serves HTTPS only,
   redirects HTTP, and reads its routing and headers from `staticwebapp.config.json`. The live
   site is <https://blue-ocean-09e66a70f.8.azurestaticapps.net>.
2. **The host's settings are generated, not written by hand.**
   `tools/deploy/static-web-app-config.mjs` writes `staticwebapp.config.json` into the build:
   `globalHeaders` is `security-headers.json` as it is, and the `index.html` fallback leaves out
   every file extension the build ships, so a missing file stays a 404. The headers keep one
   source (ADR 0003).
3. **CI deploys what it checked.** In `.github/workflows/ci.yml` the `frontend` job builds,
   generates the settings and runs the critical paths; on a push to main it uploads the build,
   and a `deploy` job that needs it uploads that build unchanged with
   `Azure/static-web-apps-deploy` (no second build). Pull requests are checked, never deployed.
4. **Every commit to main runs to the end.** Concurrency cancels an older run only for a pull
   request, so commits to main deploy one after another and a deployment is never cut off.
5. **The deployment token is the repository secret `AZURE_STATIC_WEB_APPS_API_TOKEN`**. To
   replace it: `az staticwebapp secrets reset-api-key -n swa-pibbo -g rg-pibbo`, then
   `az staticwebapp secrets list -n swa-pibbo -g rg-pibbo --query properties.apiKey -o tsv | gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN`.

## Consequences

The `frontend` job keeps its 5-minute limit; deployment is a separate job after it, so a deploy
never slows the checks a pull request waits for. A failed check on main publishes nothing, and
the site stays on the last commit that passed. `L2-039` #2 and #3 (container image, readiness
and rollback) still wait for a backend; a Static Web Apps deployment swaps the whole site at
once, so a half-published site cannot be served.
