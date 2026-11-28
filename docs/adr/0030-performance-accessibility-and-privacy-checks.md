# 0030: Performance, accessibility and privacy: behaviour specs over every activity, and sweeps on request

**Status:** Accepted (journey 26)

## Context

`L2-029`, `L2-032` and `L2-036` hold across every activity. `AGENTS.md` runs only behaviour
specs by default, keeps visual, responsive, accessibility and heap sweeps for when a person
asks, forbids architecture tests, and keeps CI under five minutes with one critical path per
feature (ADR 0016). The designs named a `RoundAssetLoader`, a `WebAudioPlayer` over one
`AudioContext`, CDK `FocusKeyManager` roving focus, an `accessibleName` input on every
component and a load test of the content API.

## Decision

1. **Every activity, read from Home.** The specs find the activities the way a child does,
   screen by screen of each group on Home (`everyActivity`), so a new activity is covered the
   day it is listed, with no list to keep.
2. **Privacy is a behaviour spec** (`privacy.spec.ts`, `L2-029` #1 to #3): each activity is
   opened and played a little, then the check game and the grown-up area; every request must be
   a GET to Pibbo's origin with no query and no body, no permission (microphone, camera,
   location, notifications) may be asked for, and no script, link or frame on any screen may
   lead to another origin. The shared network guard already fails any spec on a request off
   localhost. `L2-029` #4 is the grown-up area's Clear progress spec (ADR 0029).
3. **Keyboard play is a behaviour spec** (`keyboard.spec.ts`, `L2-036` #2, #4), on a desktop:
   each activity is opened from Home with Tab and Enter or Space; every target in its round is
   reached in the order a child meets it (the way out and progress, the instruction, the game,
   the answer bar), shows the focus outline and has a name; Enter on the game's first target
   plays it. The check game and the gate are played the same way. Tab order is enough:
   roving focus with the CDK would grow the initial bundle (ADR 0029), so it is not used.
4. **A touch answers at once** (`performance.spec.ts`, `L2-032` #3): what each activity's first
   touch plays has already been fetched when the round shows. The seven counting activities now
   fetch every recording and picture their content names, and the numbers they can say, before
   the first touch, through the route-scoped `BrowserAssetPreloader` (`contentAssets`,
   `numberRecordings` in `@pibbo/domain/rounds`). Playback stays on one `<audio>` element; a
   Web Audio player waits until a measured need.
5. **Budgets.** The initial bundle is 239 kB raw, 64 kB gzipped, well under `L2-032` #1's
   250 KB gzipped; its `angular.json` budget tightens from a 230 kB warning and 250 kB error to
   240 kB and 245 kB, so a few kB of hoisted framework code is noticed at once.
6. **The sweeps are written and run only on request** (`e2e/sweeps`,
   `playwright.sweeps.config.ts`, `npm run sweep` or `sweep:a11y`, `sweep:heap`,
   `sweep:visual`, `sweep:load`): axe-core on every screen in light and dark, with and without
   reduced motion (`L2-036` #1, #3, #5); the heap after repeated visits to each activity; every
   screen at seven sizes against baselines that a person accepts, with no scroll; and Home's
   Largest Contentful Paint, script size and touch response on a throttled phone, with time
   passing (the fixture's `clock: 'real'`, `L2-032` #1, #2). `@axe-core/playwright` is a dev
   dependency.
7. **The critical paths** for CI are the privacy run over every activity and the preload run;
   keyboard play runs with the other behaviour specs locally.

## Consequences

`L2-032` #4 (the content API under load) is possible since the backend (ADR 0034) and is not built. `L2-036` #6 (a
shape as well as colour) and #5 (reduced motion) stay covered by each activity's own specs and
by the accessibility sweep. Names come from each component's own text and labels rather than
an `accessibleName` input. No sweep has been run or has a baseline yet: the first run, when a
person asks, sets the baselines and may find work.
