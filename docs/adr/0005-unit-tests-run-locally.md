# 0005: Unit tests run locally, not in CI

**Status:** Accepted (journey 1); open for the repository owner

## Context

`L2-039` criterion 1 asks CI to run unit tests, acceptance tests, lint, axe checks and bundle-size
checks. `AGENTS.md` says unit tests run locally and never in CI, and that CI runs only lint,
build and one critical acceptance path per feature, in under 5 minutes.

## Decision

Follow `AGENTS.md`. `node tools/verify/verify.mjs` runs the format check, lint, build (with the
bundle budgets), unit tests and the behaviour e2e locally. CI (`.github/workflows/ci.yml`) runs
the format check, lint, `npm audit` (high and above), the build with its budgets and the
behaviour e2e. Axe sweeps run only when a person asks. The .NET parts of `L2-039` wait for the
backend ADR (journey 27).

## Consequences

`L2-039` #1 is met only in part. The repository owner should amend either `L2-039` or this rule.
