# 0032: A content backend that holds nothing about a child

**Status:** Accepted (journey 27). The repository owner agreed on 2026-11-28 ("Create backend,
no OIDC, keep everything simple and local for MVP, Acceptance test the backend only"), then
asked for a database, MediatR, Serilog and FluentValidation, and for everything left open to
be built.

## Context

`L1-024` and `L2-027` ask for a .NET backend that serves the activity content, and `L2-028` #4
asks that an ADR records that it serves content only and holds nothing about a child. `L2-030`,
`L2-031`, `L2-038` and `L2-039` harden, administer, observe and deploy it.

Until now Pibbo was a static site with no backend. Words, sounds and numbers are data in
`@pibbo/domain`, checked at build; pictures and recordings are bundled and served from Pibbo's
own origin (ADR 0003, ADR 0008). The browser makes only GET requests to that origin, and the
e2e network guard fails a spec on anything else (ADR 0004, `L2-029`). No child-facing behaviour
waits for a backend.

A backend is the first part of Pibbo that receives requests it could keep, the first with a
sign-in, and the first with a store that changes without a build. Each bears on children's
privacy and safety, so the decision was the repository owner's.

## Decision

1. **What it holds.** Content only: content versions with their activities and lessons, the
   pictures and recordings, and which staff id (or the content file) published each version.
2. **What it never holds.** Nothing about a child or a device: no progress, answers, names,
   ages, accounts, identifiers, cookies or sessions on public endpoints, and no analytics. Public
   endpoints accept GET and HEAD only and answer 405 to a write (`L2-028` #1); no response sets
   a cookie (#3). Progress, where Pibbo keeps any, stays on the device (ADR 0026, ADR 0028).
3. **What it logs.** Serilog, one line of JSON per event: timestamp, method, route template,
   status, duration and trace id (`L2-038` #2). No path, query string, header, cookie, user
   agent or address: the client IP is omitted, not truncated, the stricter reading of `L2-028`
   #2. What ASP.NET Core's request scope adds is taken off every event, and a caller's trace id
   is never adopted. The rate limit (`L2-030` #4) counts by address in memory only. Metrics
   (`/metrics`, Prometheus format) are labelled by method, route template and status.
4. **Same origin.** The API and its pictures and recordings can be served from Pibbo's own
   origin, so the frontend's `default-src 'self'` and the network guard stay as they are. CORS
   allows only the configured frontend origin (`L2-030` #3) and by default none.
5. **Only staff write**, under `/api/v1/admin`, with a bearer token carrying the
   `content-editor` role (`L2-031` #1–#2). For the MVP there is no OIDC provider: tokens are
   signed with locally configured keys (`dotnet user-jwts` in development). Pointing
   `Authentication:Schemes:Bearer:Authority` at an OIDC provider later is configuration, not
   code. With nothing configured no token is trusted. A grown-up at home has no account, and no
   screen a child uses carries a token.
6. **Every version is checked before it is served**, whether it came from the reviewed
   `content.json` or from an editor: one FluentValidation validator for ids, text from an
   allow-list of letters, digits, spaces and `' ’ - ? ! . , + _ ♪` and at most 80 characters
   (`L2-031` #4), and pictures and recordings that exist. A version that fails is not published
   and the last good one stays served. A published version is never rewritten.
7. **Uploads are sniffed and capped** (`L2-031` #3): MP3 or Ogg recordings up to 1 MB, WebP or
   SVG pictures up to 2 MB, the SVG stored sanitised; anything else is 415 or 413, and nothing
   past 2 MB is read.
8. **Shape.** `backend/` holds `Pibbo.Domain`, `Pibbo.Application` (MediatR queries and
   commands, FluentValidation in a pipeline behaviour), `Pibbo.Infrastructure` (EF Core with
   SQLite and its migrations, the file asset store) and `Pibbo.Api`, dependencies pointing
   inward, with `Pibbo.Api.AcceptanceTests` hosting the API in memory and calling it over HTTP.
   MediatR is pinned to 12.x, the last Apache-licensed line.
9. **Contracts.** The public contract is committed as `backend/openapi/v1.json` and the staff
   one as `backend/openapi/admin.json`; a test fails when either drifts. The frontend's types in
   `@pibbo/api` (`content-api.ts`) are generated from the public one by
   `tools/content-api/generate-client.mjs`, and every frontend build fails if they drift
   (`L2-027` #5). The generator needs no dependency: `openapi-typescript` requires TypeScript 5.
10. **The frontend does not call the backend yet.** It still bundles its content. Which content
   moves to the backend, and when, is the owner's to decide.
11. **Deployment** (`L2-039` #2–#3): one container image, non-root, on base images pinned by
   digest, deployed by digest as a Docker Swarm stack (`backend/deploy/`). A release starts
   beside the running one, gets traffic only once its readiness probe passes, and rolls back
   on its own if it never does. The image has no shell, so the probe is the app itself
   (`dotnet Pibbo.Api.dll probe`).
12. **CI** (`L2-039` #1, `L2-031` #5) builds the backend, checks its format, runs NuGet audit and
   `dotnet list package --vulnerable` (high or critical fails), and one critical acceptance path
   per feature (ADR 0016); it builds the image and checks it runs read-only, non-root and ready.
   Every backend acceptance test runs in `node tools/verify/verify.mjs`.

## Open for the repository owner

- **`AGENTS.md`** says nothing of `backend/`. Its dependency rules, file-per-type rules and
  "Words, sounds and numbers are data in `domain`" are the frontend's. The backend's own rules
  are in `backend/README.md`. Whether `AGENTS.md` should name the backend is the owner's call.
- **`L2-031` #2 names an OIDC token.** The MVP signs tokens locally; an OIDC provider, and which
  one, is open.
- **`L2-031` #3 allows MP3, Ogg, WebP and SVG**, but the bundled content uses WAV recordings and
  JPEG pictures. Content may name them, and they are served, but they cannot be uploaded.
- **`L2-039` #1** asks CI to run unit tests and axe checks; ADR 0005 and ADR 0016 keep CI to
  one critical path per feature and axe sweeps on request.
- **The deployment platform** for production, and who reviews content before it is published.
- **Load testing** of the content API (`L2-032` #4) is now possible and is not built.

## Consequences

Pibbo has a server to run, patch and watch, and content that must be reviewed as carefully as a
build is checked. Until the frontend reads from it, the activity list lives in two places:
`@pibbo/domain` and `backend/content/content.json`. In development, uploads land in
`frontend/projects/pibbo/public`, where the bundled recordings are served from.
