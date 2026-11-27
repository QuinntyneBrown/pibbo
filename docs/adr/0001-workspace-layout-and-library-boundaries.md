# 0001: Workspace layout and library boundaries

**Status:** Accepted (journey 1)

## Context

`AGENTS.md` asks for an Angular multi-project workspace with the libraries `api`, `domain` and
`components` and the application `pibbo`, with a fixed dependency direction enforced by ESLint.

## Decision

- `frontend/` is an Angular CLI workspace (Angular 22) with `projects/pibbo` (application) and
  `projects/api`, `projects/domain` and `projects/components` (libraries).
- Libraries are imported as `@pibbo/<library>` through `tsconfig.json` `paths` that point at each
  library's `src/public-api.ts`, so the app compiles them from source with no pre-build.
- The direction (`pibbo` → `components`, `api`, `domain`; `domain` → `api`; `components` → `api`
  for types only; `api` → nothing) is enforced by `@typescript-eslint/no-restricted-imports` in
  each project's `eslint.config.js`. `components` may only `import type` from `@pibbo/api`, may
  not import the router, and may not call `Math.random()` or `new Date()`.
- The root ESLint config requires `OnPush`, forbids inline templates and styles, and forbids
  `ViewEncapsulation.None`.
- The browser implementations of the `api` contracts (`BrowserClock`, `BrowserRandomSource`,
  `BrowserAudioPlayer`) live in `pibbo/src/app/browser/` for now and are bound in
  `app.config.ts`. They move to a `browser` library when a second consumer needs them.
- `angular.json` budgets: the initial bundle warns at 220 kB and fails at 250 kB raw (`L2-032`
  allows 250 KB gzipped, so this is far tighter); a component style warns at 2 kB and fails at 4 kB.
- Every route uses `loadComponent`; Home is lazy too.

## Consequences

A wrong import fails `npm run lint`, and so CI. The empty shell's initial bundle is about 210 kB
raw (58 kB transferred), almost all Angular and the router; a raise needs a reason in the change.
