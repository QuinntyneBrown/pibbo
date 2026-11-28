# 0032: A content backend that holds nothing about a child

**Status:** Proposed (journey 27); waits for the repository owner's agreement. Nothing of the
backend is built until this reads Accepted with that agreement recorded here.

## Context

`L1-024` and `L2-027` ask for a .NET backend that serves the activity content, and `L2-028` #4
asks that an ADR records that it serves content only and holds nothing about a child. `L2-030`,
`L2-031`, `L2-038` and `L2-039` harden, administer, observe and deploy it.

Pibbo today is a static site with no backend (`docs/deploy.md`). Words, sounds and numbers are
data in `@pibbo/domain`, checked at build; pictures and recordings are bundled and served from
Pibbo's own origin (ADR 0003, ADR 0008). The browser makes only GET requests to that origin, and
the e2e network guard fails a spec on anything else (ADR 0004, `L2-029`). Twenty-six journeys
were built this way, and no child-facing behaviour waits for a backend.

A backend is the first part of Pibbo that receives requests it could keep, the first with a
sign-in, and the first with a store that can change without a build. Each of these bears on
children's privacy and safety, so this decision is the repository owner's and not a journey's.

## Decision (proposed)

1. **What it holds.** Content only: words, letters, sounds, lessons, pictures, recordings, the
   manifest with its content version, and who of the staff published which version. Nothing
   else.
2. **What it never holds.** Nothing about a child or a device: no progress, answers, names,
   ages, accounts, identifiers, cookies or sessions on public endpoints, and no analytics. Public
   endpoints accept GET and HEAD only and answer 405 to a write (`L2-028` #1); no public response
   sets a cookie (#3). Progress, if Pibbo ever remembers any, stays on the device (`L2-029`).
3. **What it logs.** Timestamp, route template, status, duration and trace id (`L2-038` #2). No
   query string, cookie, user agent or device identifier, and the client IP is omitted, not
   truncated: the stricter reading of `L2-028` #2. The rate limit (`L2-030` #4) counts by IP in
   memory only and writes none down.
4. **Same origin.** The API and its pictures and recordings are served from Pibbo's own origin,
   so the frontend's `default-src 'self'` and the network guard stay as they are. CORS allows
   only the configured frontend origin (`L2-030` #3) and by default allows none.
5. **Staff only write.** Writes live under `/api/v1/admin` behind an OIDC token with the
   `content-editor` role (`L2-031`). The sign-in is for staff, on a staff screen, and is never
   reachable from a screen a child uses. A grown-up at home has no account.
6. **The build-time content check stays.** Content published through the backend passes the same
   rules as `@pibbo/domain`'s check (every word a picture and a recording, every sound a
   recording) before a version is published; an unreviewed or failing version is never served.
7. **A recording that cannot be fetched never blocks a round**, as now: the app keeps working
   from what it has, and the child never sees an error.
8. **Shape.** `backend/` holds `Pibbo.Domain`, `Pibbo.Application`, `Pibbo.Infrastructure` and
   `Pibbo.Api` (.NET 10), dependencies pointing inward, as the detailed designs draw.

## Open for the repository owner

These are not decided here and are not decided in code:

- **Whether to build it at all.** `AGENTS.md` asks of every change how it helps a child count
  or sound out a word. Bundled content already does that; a backend helps only if content must
  change without a release, or outgrow the bundle. If neither is wanted yet, the answer is to
  decline this ADR and retire `L1-024`, `L2-027`, `L2-028`, `L2-030` #3–#4, `L2-031`, `L2-038`
  and the .NET half of `L2-039`.
- **`AGENTS.md` no longer carries the rule** that Pibbo has no backend until an ADR adds one,
  nor the *Children's privacy and safety* section that journeys, `CONTRIBUTING.md` and the
  mocks' README cite; it says content is data in `domain`, checked at build. Accepting this ADR
  needs `AGENTS.md` to say where content lives and to add the backend to the dependency rules.
- **The OIDC provider** for staff. It is a third party for staff only; which one, and that no
  child-facing page ever loads from it.
- **The content store's technology** and **the deployment platform** (`<TO SUPPLY>` in the
  designs), and who reviews content before it is published.
- **Unit tests in CI** (`L2-039` #1 against ADR 0005) and whether a .NET build fits CI's five
  minutes.
- **The slice tests.** The journey's prompt asks for Playwright specs with page objects; an API
  with no screen is tested through HTTP (`WebApplicationFactory`, EF Core InMemory). The staff
  editing screen has no mock, and none is drawn until this is accepted.

## Consequences

If accepted: `AGENTS.md`, `docs/deploy.md`, ADR 0003's header list and ADR 0005 are amended
first, then the slices of journey 27 are built test-first. Pibbo gains a server to run, patch
and watch, and a store whose content must be reviewed as carefully as a build is checked. If
declined: Pibbo stays a static site, the requirements above are retired, and journey 27 closes
with nothing built.
