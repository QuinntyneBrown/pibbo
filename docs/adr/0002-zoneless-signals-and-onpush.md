# 0002: Zoneless, signals and OnPush

**Status:** Accepted (journey 1)

## Decision

Pibbo is zoneless (Angular 22's default; `zone.js` is not installed), uses standalone
components, keeps state in signals and uses `ChangeDetectionStrategy.OnPush` in every component.
The component schematics default to `OnPush`, and ESLint rejects a component without it.

## Why

It is the platform's current best practice, and it keeps the runtime small and the work per touch
low on an old phone (`L2-032`).
