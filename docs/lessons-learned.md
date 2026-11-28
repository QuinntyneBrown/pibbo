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

## Journey 3: Count a set

**What slowed it**

- The prototype's retry state cleared the stamps, against `L2-002` #2 and the purpose; its toy
  spots overlapped and were under 60 px on a phone. Both were redrawn before code (ADR 0007).
- Chromium still fetches a recording when `src` is set, even with `load()` faked. A recording
  cut short by the next one (one sound at a time) aborts that fetch, and the network guard
  failed the spec on `net::ERR_ABORTED`, only now and then and only on the phone. The guard
  now allows an aborted media request.
- A `\s` inside a template literal passed to `new RegExp` loses its backslash; write `\\s`.
- Heredocs in Git Bash failed again on a long multi-file command; the Write tool is reliable.
- Another agent edited this checkout's tokens and component styles mid-journey. Commits were
  staged from the index (`git update-index --cacheinfo`) so only this journey's changes went in.

**New lessons**

1. Model a round as a pure state machine in `domain` (a `phase` plus immutable transitions):
   the page only plays recordings and sets timers, and the tricky cases (two fingers, a touch
   after counting, the third wrong answer) are unit tests.
2. Sequence speech by awaiting `PlayOutcome`: speak the next line only when the last one was
   not `stopped`, and only if the round is still the same value. That gives one sound at a time
   and lets any touch or a hidden tab cut a sequence short with no flags.
3. Put timers behind `CLOCK.after`: Playwright's `page.clock.runFor` then drives praise in a
   spec with no real wait.
4. A fixture option (`test.use({ sound: 'off' })`) is the simplest way to prove a round works
   muted.
5. A spec that passes before the slice (the muted round) is a regression guard, not a failing
   acceptance test; say so rather than pretend it failed.

**Earlier lessons applied**

- Read the mock against `AGENTS.md` first (J2 #1): worked; it caught the cleared stamps and the
  overlapping spots before any code.
- Write tool over heredocs (J2): applied late; one long heredoc failed before it was.
- Fake browser APIs, not bindings (J1 #1): worked; the muted and resting specs fake
  `HTMLMediaElement` only.
- Budget for lazy routes (J2 #4): the initial bundle stayed under budget; `round-shell.scss`
  is over the 2 kB per-component warning (not the 4 kB error) and is a candidate to split.


## Journey 4: Sound out and blend a word

**What slowed it**

- The prototype's Sound it out cast was "ship", a digraph from a later journey, and `L2-012`
  disagreed with the mock on blend order and on when the picture appears. The mock won: it was
  redrawn with "map", and `L2-012` was brought in line (ADR 0008) before any code.
- On a phone, the browser's click after a tap landed on the pictures that replace the blend
  control under the finger and chose one. `pbTap` now cancels the touch's end.
- `startRound` already existed in `@pibbo/domain` for Count; the Sound Out one is
  `startSoundOutRound`, since the public API is flat.
- A spec read the next word from the page before Next had rendered it; it now waits for the
  progress bar first.

**New lessons**

1. A control that is replaced by other targets in the same place (blend, then pictures) needs
   the touch's synthetic click cancelled, or the new target is chosen by accident.
2. Keep content as JSON next to its typed accessor: a plain Node script checks it before
   `ng build` with no TypeScript tooling, and the app imports the same file.
3. Choose the next round when this one starts; preloading its assets is then one call, and
   the preloader, provided by the route, aborts everything when the child leaves.
4. After a touch that changes the round, wait for something the new round shows before
   reading the page.

**Earlier lessons applied**

- Read the mock against `AGENTS.md` and the requirement first (J2 #1): worked; it caught the
  digraph cast, the text-only bubble and the missing modelled state.
- A round as a pure state machine (J3 #1): worked; the page only plays recordings.
- Sequence speech by awaiting `PlayOutcome` (J3 #2): worked for blending and Try again.
- `CLOCK.after` and `sound: 'off'` (J3 #3, #4): reused unchanged for praise and the muted spec.
- Write tool over heredocs (J2): followed for long TypeScript; short heredocs were fine.

## Journey 5: Count and write to twenty

**What slowed it**

- The prototype's Count and write had no things to count (a number track) and a tracing pad,
  a precise drag that `AGENTS.md` forbids, and `L2-004` accepted the digits without the mock's
  Check. All six states were redrawn with ten-frames and a digit pad, and `L2-004` was brought
  in line (ADR 0009) before any code.
- A phone 360 px wide cannot fit five 60 px targets 16 px apart; the ten-frames and the digit
  pad use 6 px, recorded in ADR 0009.
- The hint lit each digit tile inside one task, because the stand-in audio player ends a
  recording on a microtask: the spec never saw a lit tile. Each lit tile now stays lit for at
  least 700 ms through `CLOCK.after`, which a muted child also needs.
- A spec that ended as praise was requested left `yes.wav` unanswered for the network guard;
  it now waits for the last recording it expects.
- Bash `node -e` with an apostrophe in the text failed to parse; the Write tool was used.

**New lessons**

1. A `seed` fixture option picks the round a spec needs (14 or 7) with no hook in the bundle;
   the first `Math.random` call of the mulberry32 stream decides it.
2. Something shown only while a recording plays needs a minimum time on the injected clock,
   or it is invisible when the sound is off or a recording is short.
3. To prove a fleeting state was shown, note it with a `MutationObserver` from the page object
   rather than racing it with a locator.
4. End a spec on what was last spoken (`expect.poll` on the recordings), so no media fetch is
   still pending when the guard checks the network.

**Earlier lessons applied**

- Read the mock against `AGENTS.md` and the requirement first (J2 #1): worked; it caught the
  drag and the missing things before any code.
- A round as a pure state machine (J3 #1): worked; `CountAndWriteRound` holds every rule and
  the page only plays recordings and sets timers.
- Sequence speech by awaiting `PlayOutcome` (J3 #2): reused for the count, the hint and the
  modelled answer.
- `CLOCK.after` and `sound: 'off'` (J3 #3, #4): reused for praise, the hint and the muted spec.
- A spec that passes before its slice is a regression guard (J3 #5): the muted spec passed
  before slice 3; it guards the round with the sound off.
- Wait for something the new round shows before reading the page (J4 #4): the Next spec
  waits for the progress bar.
- Write tool over heredocs (J2): followed for TypeScript; short heredocs were fine.

## Journey 6: Compare two numbers

**What slowed it**

- `L2-005` took the answer on the first touch and asked for the sets to be "lined up" after a
  wrong choice; the mock had Check and highlighted nothing. The mock won on Check, the `retry`
  mock gained `ten-frame__dot--extra`, and `L2-005` was brought in line (ADR 0010) first.
- `tryAgain` already existed in `@pibbo/domain` for Sound Out; the flat public API refused a
  second one at build time, so the Compare rule is `chooseAgain`.
- A card of 20 (two ten-frames) overflowed a 640 x 360 phone on its side and, with the taller
  retry bar, a 360 x 640 one. The specs' 6 and 9 never showed it; a throwaway layout spec with
  a 20 and 18 seed did, and short-height rules fixed it before commit.
- A screenshot taken straight after Check caught the card mid-transition and looked like a
  styling bug; waiting out the transition showed it was not.

**New lessons**

1. When a requirement decides a range, test the layout at its largest case, not only the
   spec's cast: find a seed for it by replaying mulberry32 in Node.
2. Before naming a domain function, grep `@pibbo/domain`'s public API: it is flat, and a clash
   only shows at build time.
3. Seed search is cheap: simulate the rule's random calls with the fixture's generator in Node
   and pick the first seed that gives the cast.

**Earlier lessons applied**

- Read the mock against `AGENTS.md` and the requirement first (J2 #1): worked; it caught Check
  and the missing extra dots before any code.
- A round as a pure state machine (J3 #1): worked; `CompareRound` holds every rule.
- Sequence speech by awaiting `PlayOutcome` (J3 #2): the comparison is three recordings and
  praise, stopped by any newer sound.
- `CLOCK.after` for praise (J3 #3): reused unchanged.
- The `seed` fixture option (J5 #1): gave 6 and 9 with no hook in the bundle.
- End a spec on what was last spoken (J5 #4): each spec polls for the last recording.
- Wait for something the new round shows (J4 #4): the Next spec waits for the progress bar.

## Journey 7: Count backward

**What slowed it**

- `L2-006` and the design had the child touch numbers on a number track and, after a wrong
  touch, the expected number highlighted; the mock had three numeral choices, a track that is
  only shown, and "Going down from 6… try again." The mock won (ADR 0011) before any code.
- The mock's layout (rocket under the numbers on a phone, 56 px track cells) overflowed a
  360 x 640 and a 640 x 360 phone at start 20. A throwaway spec with seed 36 (start 20) found it;
  the rocket now stands beside the numbers and the track cells are smaller on a phone.
- The rocket first used container query units (`cqh`) and vanished at 1280 x 720: the launch's
  stretched height did not reach the container. Percentages of an absolutely positioned box
  that fills the launch worked at every size.
- A Python string edit turned `\\s` into `\s` in a page object's `RegExp`, again: the choice
  locator matched nothing.
- The unit spec used `jasmine.objectContaining`; the runner is Vitest (`expect.objectContaining`).

**New lessons**

1. Edit a TypeScript regex with the Edit tool, never through a Python or sed string: both
   eat backslashes.
2. Unit tests run on Vitest: use `expect.objectContaining` and `toThrow`, not Jasmine helpers.
3. Size a picture that moves inside a box by percentages of an absolutely positioned layer that
   fills the box, not by container query units.
4. A screen with no Check (a right touch moves on) uses `AnswerBar` kind `none`: the bar keeps
   its height with the mock's `answer-bar__spacer`, so nothing jumps when Try again appears.

**Earlier lessons applied**

- Read the mock against `AGENTS.md` and the requirement first (J2 #1): worked; it caught the
  three choices and the retry line before any code.
- A round as a pure state machine (J3 #1): `CountdownRound` holds every rule, including where
  the rocket is.
- Sequence speech by awaiting `PlayOutcome` (J3 #2): the start, the retry line and blast off.
- `CLOCK.after` for praise (J3 #3): reused unchanged.
- The `seed` fixture option and a Node seed search (J5 #1, J6 #3): seed 24 gives start 10 and
  seed 36 start 20, found in one command.
- Test the layout at the largest case (J6 #1): it found the overflow.
- End a spec on what was last spoken (J5 #4): each spec polls for the last recording.
- Grep the flat domain API before naming (J6 #2): `countAgain`, not `tryAgain`.

