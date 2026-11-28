# 0016: CI runs one critical acceptance path per feature

**Status:** Accepted (journey 11)

## Context

`AGENTS.md` says CI runs lint, build and "one critical acceptance path each" per feature, and
finishes in under 5 minutes. Until journey 11 the workflow ran `npx playwright test`, every
behaviour spec on both projects (phone and desktop). By journey 10 CI took 3 min 15 s and grew
with every activity.

## Decision

1. **A critical path is tagged `@critical` in its test title**: one test per feature, the one a
   child would notice first if it broke (choosing an activity on Home, one round of each
   activity end to end, the security headers).
2. **CI runs `npx playwright test --grep @critical`**, on both projects. Everything else still
   runs locally through `node tools/verify/verify.mjs`, which runs every behaviour spec.
3. A new feature tags exactly one of its tests. A spec that is not tagged is not less
   important; it is checked before every push by `verify.mjs`.

## Consequences

CI time no longer grows with the number of tests, only with the number of features. A
regression outside the tagged paths is caught locally, not in CI, so running `verify.mjs`
before pushing matters more.
