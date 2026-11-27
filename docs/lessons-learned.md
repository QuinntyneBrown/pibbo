# Lessons learned

One entry per journey, newest last. Before a journey, read these and apply the ones that fit.

## Journey 1: Scaffold the workspace

**What slowed it**

- `ng add angular-eslint` installed the packages but wrote no config in a workspace with no
  default project; `ng g angular-eslint:add-eslint-to-project <project>` per project did.
- In a multi-project workspace `ng build` with no project name builds every library; the scripts
  name `pibbo` explicitly.
- `ng test <library>` fails when the library has no spec files, so `tools/verify/unit-tests.mjs`
  runs only the projects that have specs.
- A long multi-file heredoc in Git Bash failed to parse as a whole and wrote nothing; separate
  writes are safer.

**New lessons**

1. Fake browser APIs (`HTMLMediaElement.play`, `Math.random`, `page.clock`) in the e2e fixture
   rather than swapping Angular bindings: the production bundle stays free of test hooks and the
   real bindings are exercised (ADR 0004).
2. Run e2e against the production build with the deployed headers. It caught nothing yet, but it
   is the only way a CSP regression (an inline script, a third-party font) shows up in a spec.
3. Keep the security headers in one JSON file read by both the e2e server and the deploy docs.
4. Turn off Angular's font inlining and critical-CSS inlining: the first calls Google Fonts at
   build time, the second needs an inline script the CSP forbids.
5. `components` imports `@pibbo/api` for types only: `@typescript-eslint/no-restricted-imports`
   with `allowTypeImports` enforces exactly that.

**Earlier lessons applied:** none; this is the first journey.

## Journey 2: Home: choose an activity

**What slowed it**

- The Home mock was the prototype's, unreconciled with `AGENTS.md` (child's name, stars, 21
  games). It had to be redrawn before any code (ADR 0006).
- Long heredocs in Git Bash failed again, apparently on non-ASCII text (a tick, an em dash);
  the Write tool is reliable for new files.
- The stand-in audio player recorded `currentSrc`, which keeps the previous recording until
  the (faked) load runs; it now records `src` first.
- Playwright's `locator.tap()` throws without `hasTouch`; the page object taps on a coarse
  pointer and clicks otherwise.
- CDP touch sessions keep their own touch state: a `touchEnd` from a new session fails with
  "Must send a TouchStart first". Keep one session per gesture.

**New lessons**

1. Read the mock against `AGENTS.md` before the slice plan; a mock that breaks *Children's
   privacy and safety* is redrawn first, and the departure goes in `docs/mocks/README.md`.
2. Drive palms, second fingers and long presses with `Input.dispatchTouchEvent` (with
   `radiusX`/`radiusY`) and advance time with `page.clock.runFor`: `performance.now()` follows
   the fake clock, so a long press needs no real wait.
3. Prove a rule-based spec bites by breaking the rule once (the long-press spec failed with the
   threshold raised).
4. Lazy routes still grow the initial chunk: framework code they use (linkedSignal, control
   flow) is hoisted into it. Expect a few kB per new feature and budget for it explicitly.

**Earlier lessons applied**

- Faking browser APIs, not bindings (J1 #1): worked; the palm and long-press specs exercise the
  real `pbTap` with no test hook in the bundle.
- E2E against the production build with headers (J1 #2): worked; no CSP issue arose.
- Types-only imports from `api` in `components` (J1 #5): worked; the new components import
  `Activity` and `ActivityGroup` as types.
