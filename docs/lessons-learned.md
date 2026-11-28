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


## Journey 8: Skip-count by twos, fives and tens

**What slowed it**

- The first agent on this journey hung for about 40 minutes and was stopped. It had aligned the
  requirement, design and mocks (ADR 0012) and written most of the code, but nothing past that
  first commit, plus two throwaway layout specs. A second agent reviewed the uncommitted work,
  kept it, deleted the throwaway specs and finished. Playwright ran with `--reporter=line` and
  every long command had a timeout.
- The acceptance spec passed with the Home entry and the route stashed. The specs run against
  `dist/pibbo/browser`, which still held the first agent's build. After a rebuild the spec
  failed for the expected reason: no Skip-count card on Home.
- The domain rules and the whole feature landed as two commits, not one per slice, because the
  code already existed when the second agent started.
- Two rows of targets (the step switch and the choices) overflowed a phone on its side. The mock
  gained a `max-height: 30rem` rule first, and `round-shell` followed it.

**New lessons**

1. The e2e server serves the last production build. Run `npm run build` before a spec meant to
   prove a failure, or it may pass against stale code.
2. When an agent is stopped partway through, commit what is green before going on, so the next
   agent starts from reviewed commits rather than a pile of uncommitted files.
3. Run Playwright with `--reporter=line` and give long commands a timeout. The HTML reporter
   starts a server and waits.

**Earlier lessons applied**

- The mock first (J2 #1, J7): ADR 0012 aligned the requirement and design before any code.
- A round as a pure state machine (J3 #1): `SkipRound` with `counting`, `retry` and `done`.
- Sequence speech by awaiting `PlayOutcome` (J3 #2): "Count on 5 more from 10." is four
  recordings in turn.
- `CLOCK.after` for praise (J3 #3): reused unchanged.
- The `seed` fixture option (J5 #1, J6 #3): seed 1 counts by 5 and seed 7 counts by 2.
- End a spec on what was last spoken (J5 #4): every spec polls for the last recordings.
- Edit regexes with the Edit tool (J7 #1): the choice locator's `\s` survived.
- `AnswerBar` kind `none` (J7 #4): nothing jumps when Try again appears.


## Journey 9: Add two numbers together (pass and play)

**What slowed it**

- The prototype named the players "Maya" and "Dad". `L2-008` and *Children's privacy and
  safety* forbid names, so the mocks became a star and a moon before any code (ADR 0013).
- The mock's layout, + and − on both players and the two sets stacked on a phone, overflowed a
  360 × 640 phone by about 150 px once both sets held five ducks, and a phone on its side by
  more. The first fix shrank things and still failed at 360 × 640 and 640 × 360. What worked was
  to give + and − only to the player whose turn it is, beside the sum, and keep the two sets
  side by side at every width. The component changed first and the mock was redrawn straight
  after it, in the same commit: the wrong order, caught before the commit.
- `chooseAgain` already existed in the flat domain API (`compare-round`), so the build failed on
  an ambiguous export; the rule became `chooseTotalAgain`.
- A Python heredoc with a quote in a test name broke the shell; the files were written with the
  Write tool instead.

**New lessons**

1. Before building a screen, measure the mock at its largest case on 360 × 640 and 640 × 360
   with a throwaway spec that sets the viewport, and redraw the mock then, not after the
   component is written.
2. Controls that only one player may use are better absent than disabled for the other: fewer
   targets for a child, and the room they free keeps a screen from scrolling.
3. A `sed` that rewrites `content="..."` in a mock touches every `<meta>`: anchor it to the line
   or to `name="description"`.

**Earlier lessons applied**

- The mock first (J2 #1, J7, J8): names and the 44 px buttons were fixed in the mocks and ADR
  0013 before code. The layout redraw came late (new lesson 1).
- A round as a pure state machine (J3 #1): `AddRound` with `turn`, `choosing`, `retry`, `done`.
- Sequence speech by awaiting `PlayOutcome` (J3 #2): the count from 1 to 7 and the praise.
- `CLOCK.after` for praise (J3 #3): reused unchanged.
- Grep the flat domain API before naming (J6 #2): not done first, and it cost a build.
- Test the layout at the largest case (J6 #1): it found the overflow on both phone shapes.
- End a spec on what was last spoken (J5 #4): every spec polls for the last recordings.
- Build before proving a failure (J8 #1): the first run failed for the expected reason, no
  Add together on Home.
- `--reporter=line` and timeouts (J8 #3): no hang.

## Journey 10: Count to music

**What slowed it**

- Home's Count group already had six activities, the most `L2-024` allows on one screen, so
  Counting dance had nowhere to go. Home gained a second screen (five activities and a More
  picture) as its own slice, mock and `L2-024` first (ADR 0014), and Add together's page object
  now touches More.
- The prototype's speed switch was 44 px, 4 px apart, colour only; it became `.switch--speed`,
  the same as `.switch--step` (ADR 0014).
- The mock's layout (a 150 px Pibbo, a 144 px numeral, the row of ten and the controls) did
  not fit a 360 × 640 phone, and on a 640 × 360 one Start the music sat under the answer bar,
  where it could not be touched. A throwaway spec that logged the bubble, stage, controls and
  answer bar boxes found both; the mock gained phone and short-screen rules first.
- Pause and the hidden tab came with the beat scheduler in slice 2, so slice 3's specs passed
  on their first run. Breaking each rule once (no pause on hidden; sway under reduced motion)
  made them fail, so they bite.

**New lessons**

1. When a journey adds an activity, count the group's activities against `L2-024`'s 6 a
   screen before planning the slices.
2. "Nothing scrolls" is not enough for a layout check: a shell that clips its game area does
   not scroll even when a control is hidden under the answer bar. Compare the boxes of the
   last control and the answer bar.
3. A timed activity is easiest to drive one beat at a time: each beat schedules the next with
   `CLOCK.after`, and pause, a hidden tab and leaving cancel just that one timer. A component
   unit test with a hand-advanced fake clock then proves "nothing is due" after a pause.
4. One recording a beat (the number said over the rhythm) keeps one sound at a time with no
   mixing and nothing to pile up.

**Earlier lessons applied**

- The mock first (J2 #1, J7, J8, J9): the speed switch, Home's second screen and the phone
  layouts went into the mocks before the components.
- Measure the largest case on 360 × 640 and 640 × 360 (J9 #1, J6 #1): it found both
  overflows, after the component was written but before the commit.
- A round as a pure state machine (J3 #1): `DanceRound` with `ready`, `playing`, `paused`,
  `done`.
- `CLOCK.after` for timing (J3 #3): the beat and praise; `page.clock.runFor` drives the beat.
- `sound: 'off'` (J3 #4) and a spec that passes before its slice is a regression guard (J3
  #5): said so, and proved by breaking the rule.
- Grep the flat domain API before naming (J6 #2): done first; no clash.
- Build before proving a failure (J8 #1): the first runs failed for the expected reasons (six
  activities and no More; no route).
- `--reporter=line` and timeouts (J8 #3): no hang.

## Journey 11: Match letters to sounds

**What slowed it**

- `L2-010` described one sound and three letters; the mock is a pair match of four letters and
  their four sounds. The mock won: `L2-010`, the design and ADR 0015 were rewritten first, and the
  prototype's "small shake" for a wrong partner, which no class drew, became `.pair--miss` and a
  `miss` state.
- c's sound was shown "/c/" in the content while both reading mocks show "/k/"; fixing the data
  broke Sound it out's spec helper, which built `/${letter}/`.
- The mock's two columns of 80 px pairs ran under the answer bar on 360 × 640 (by 70 px) and
  640 × 360 (by 150 px). Upright took one try (two rows, the picture above each sound); on its
  side took four, because the game area there is only 100 px tall: two rows of 60 px targets
  cannot fit, so all eight make one row. Each attempt went into the mock CSS and the component.
- A bash heredoc with an unmatched quote in a comment silently wrote nothing; the files were
  written with the Write tool instead.
- CI took 3 min 15 s at journey 10. ADR 0016 tags one test per feature `@critical` and CI runs
  only those (`--grep @critical`); `verify.mjs` still runs every spec.

**New lessons**

1. On a phone on its side, measure the game area itself (`.shell__game`), not just the screen:
   it is about 100 px tall, so anything with two rows of targets must become one row there.
2. When content data changes how a sound is shown, grep the specs for helpers that rebuild the
   shown text from the letter.
3. A spec whose rule the domain already covers (matching arrived with `matchSound` in slice 2)
   passes before its slice; say so, and keep it as a regression guard.
4. Tag a feature's critical path in the same change that adds the feature, so CI cost grows by
   one test per feature, not by the feature's whole suite.

**Earlier lessons applied**

- The mock first (J2 #1, J7–J10): the pair match, the miss state and the phone layouts went
  into the mocks before or with the component, each in the same commit.
- Measure the largest case on 360 × 640 and 640 × 360 (J9 #1, J10 #2): a throwaway spec logged
  the last pair against the answer bar's top; it found both overflows before the commit.
- A round as a pure state machine (J3 #1): `LetterSoundsRound` with `matching`, `right`.
- `CLOCK.after` for timing (J3 #3): praise and the shake.
- Grep the flat domain API before naming (J6 #2): done first; `holdLetter` and `matchSound`
  avoid Sound it out's `touchLetter`.
- Build before proving a failure (J8 #1): the first run failed for the expected reason, no
  Letter sounds on Home.
- `--reporter=line` and timeouts (J8 #3): no hang; verify ran in the background once and was
  awaited with an `until` loop.
- Count the group against `L2-024` (J10 #1): Read has two activities; no second screen needed.

## Journey 12: Recognise uppercase and lowercase

**What slowed it**

- `L2-011` described one big letter, three small choices and a side-by-side hint; the mock is
  Letter sounds' four-pair match with Big and Small heads, and draws no wrong choice. The mock
  won: `L2-011`, the design and ADR 0017 were rewritten first, and a `miss` state was drawn with
  Letter sounds' shake.
- Reusing `Pairs` pushed `pairs.scss` 27 bytes over its 4 kB error budget. Sharing one rule for
  `.pairs` and `.pairs__heads` brought it under, but the first try put the heads' phone rule
  before the shared `display: grid`, which silently undid `display: none`.
- A Python script's assertion matched "Letter sounds (" in the new page's own comment and
  stopped the write; and a bash heredoc with a quote inside failed to parse (J11 again), so the
  ADR and design were written with the Write tool.

**New lessons**

1. When a new activity has the same shape as an earlier one, make the earlier rules generic
   (`LetterSoundsRound<P extends MatchPair>`) and give the component a `kind` input, instead of
   copying both; the whole feature then costs a content block, a page and its specs.
2. When two selectors share a rule, put any media query that overrides it after the shared
   rule; equal specificity means the later one wins.
3. When reuse makes every rule exist in the first slice, the later slices' specs pass on their
   first run; say so and keep them as regression guards, as J11 #3 said.

**Earlier lessons applied**

- The mock first (J2 #1, J7–J11): the `miss` state, the Home card and the phone rule for the
  heads went into the mocks in the first commit, before any code.
- Measure the game area on 360 × 640 and 640 × 360 (J11 #1, J9 #1): a throwaway spec logged
  the last pair's bottom against the answer bar (470 vs 550 upright, 241 vs 270 on its side);
  every target at least 60 × 60; nothing scrolls. Hiding the heads on a phone made it fit first
  time.
- Grep the specs for helpers that rebuild shown text (J11 #2): no spec rebuilds a letter's form.
- Tag the critical path in the same change (J11 #4): the praise-and-Next path is `@critical`.
- Build before proving a failure (J8 #1): the first run failed for the expected reason, no Big
  and small letters on Home.
- `--reporter=line` and timeouts (J8 #3): no hang.
- Avoid heredocs with quotes (J11): learned again; files with prose go through the Write tool.

## Journey 13: Spell a word by sound

**What slowed it**

- `L2-013` said a wrong letter never fills its slot; the mock lets any letter fill a box, takes
  a placed letter back out on a touch, and checks the whole word with Check. The mock won:
  `L2-013`, the design and ADR 0018 were rewritten first.
- The mock's speaker under each box is 40 px, under the 60 px rule, and on 360 × 640 and
  640 × 360 the letters fell behind the answer bar (634 vs 546 upright, 325 vs 266 on its side).
  The phone layouts were redrawn in the mock CSS: upright, the picture beside 60 px boxes;
  on its side, one row with the picture hidden; on both, no speakers, and an empty box says its
  own sound instead, so `L2-013` #3 holds on every screen.
- A spec read the boxes' text once, straight after a touch, and failed one run in ten; every
  read of shown text after a touch now goes through `expect.poll`.
- A page-object regex built in a template literal (`\s`) tripped `no-useless-escape`;
  `getByRole('button', { name, exact: true })` is simpler and exact.
- `count-and-write.spec.ts:193` failed once under verify's full load and passed 60 of 60 alone;
  it is an existing flake, not this journey's, and is noted here so the next journey watches it.

**New lessons**

1. When a mock's control is under 60 px, redraw it in the mock CSS and say so in the ADR; the
   size rule is not the mock's cast.
2. When a phone hides a control (Pairs' speakers, these speakers), give its job to a target
   that stays, so the requirement holds on every screen rather than only on a tablet.
3. Read shown text through `expect.poll` (or a retrying `toHaveText`) after any touch; a bare
   `allTextContents()` races the render.

**Earlier lessons applied**

- The mock first (J2 #1, J7–J12): the requirement, the Home card, the 60 px speaker and the
  phone layouts went into the mocks before the component, in the first two commits.
- Measure on 360 × 640 and 640 × 360 (J9 #1, J11 #1): a throwaway spec found both overflows
  before the first code commit; after the redraw, 532 vs 546 upright and 239 vs 266 on its side.
- Reuse the earlier content (J12 #1): the words and sounds are Sound it out's; the content check
  gained only the `spell` lines.
- Build before proving a failure (J8 #1): each slice's spec was committed first and failed for
  the expected reason (no Spell by sound on Home; letters do not fill; Check does nothing).
- Tag the critical path in the same change (J11 #4): the right check and Next is `@critical`.
- Avoid heredocs with quotes (J11, J12): prose went through Python or the Write tool.

## Journey 14: Letter groups that make one sound

**What slowed it**

- Adding words to Sound it out's content changed which word a seeded round shows, and the
  existing specs spelled the recordings from the word's characters (`[...word].map(sound)`),
  which breaks on "ship". The page object now reads each tile's letters (`tileLetters()`),
  and the specs map tiles, not characters, to recordings; that change went in with the
  failing spec, before the data.
- Spell by sound reads the same words and offers only single letters; a group word would have
  been unspellable. It now leaves out words with a letter group (ADR 0019).
- The night spec failed once with the network guard on the phone project and passed in 208
  further runs; the problem text was not captured. Under verify's full load, two other
  specs (letter sounds and Sound it out, sound off) each failed once with the guard reporting
  a recording "unanswered" (`/recordings/words/cat.wav`); both pass alone (100 of 100) and the
  third verify run was green. The guard keys pending requests by URL, and a recording is fetched
  twice (preloaded, then played); that is the likely cause and is left for a fixture fix.

**New lessons**

1. When a spec or page object derives tiles, boxes or recordings from a word's characters,
   derive them from what is shown instead; content will not stay one letter per sound.
2. A seed that picks a particular round is found offline from the fixture's mulberry32 and the
   content's word count; recompute it whenever the content grows.
3. When the components already carry a variant the requirement needs (`tile--wide`), the work is
   data and its check; plan the slices so the later ones are honest regression guards.

**Earlier lessons applied**

- The mock first (J2 #1, J7 to J13): the `groups` state went in the first commit.
- Build before proving a failure (J8 #1): slice 1 failed for the expected reason (seed 1 showed
  "sun", no [sh] tile). Slices 2 and 3 passed on their first run, as J12 #3 predicts; they are
  kept as guards and said so in their commit.
- Read shown text through `expect.poll` (J13 #3): tile letters and the last recording are polled.
- Tag the critical path in the same change (J11 #4): night's sound-out-and-blend is `@critical`.
- `--reporter=line` and timeouts (J8 #3): no hang.

## Journey 15: Adjacent consonants

**What slowed it**

- The prompt's slices (data, layout, blending) left out `L2-015` #2, the first-two-sounds
  question, which needed its own mock states, a phase in the round and a choice in
  `pb-word-tiles`. It was built as a fourth slice inside Sound it out (ADR 0020) rather than as
  the separate page the design named.
- A seventh word moved every seed: the letter-group seeds were recomputed offline (J14 #2) and
  committed with the first failing spec.
- A template literal ate the backslashes of a page object's `RegExp` (`\s` became `s`), so the
  choice locator matched nothing; the first run looked like a missing feature until the
  locator was checked.
- Heredocs holding Python with quotes failed in Git Bash again; the scripts went to the
  scratchpad through the Write tool.

**New lessons**

1. Read the requirement's acceptance criteria, not only the prompt's slices; a slice list can
   leave a criterion out.
2. When a page object helper walks a round (`soundAndBlend`), give it the new step in the same
   commit that adds the step, or every spec that plays several rounds fails on the new word.
3. In a page object, build a `RegExp` from a string with doubled backslashes, or match exact text
   another way.

**Earlier lessons applied**

- The mock first (J2 #1, J7 to J14): `clusters`, `first-two` and `first-two-retry` went in the
  first commit, with the narrow-tile rule in the mock CSS and the design system.
- Measure on 320 × 640, 360 × 640 and 640 × 360 (J9 #1, J11 #1): the layout spec failed first
  (two rows) and passed once `tiles--long` narrowed the tiles.
- Build before proving a failure (J8 #1): each of the three specs was committed failing for the
  expected reason (no stop; tiles wrap; no question after blending).
- Read shown text through `expect.poll` (J13 #3): spoken recordings are polled.
- Tag the critical path in the same change (J11 #4): choosing st is `@critical`.

## Journey 16: Silent-e words

**What slowed it**

- The work stopped half way and `main` moved under it twice: the mocks were aligned with the
  prototype, then redrawn responsively, both touching every Sound it out page. Each time the
  silent-e edits conflicted line for line, because a mock page is one long line of markup.
- The prompt's slices again left a criterion out (`L2-016` #3, the cap picture). The rules
  already offered the cap picture; no spec proved it, and the strip beside the tiles showed the
  cape picture while the child was asked to pick it.
- An eighth word moved the seeds again: the first-two choice order changed, and the page
  object read "cap" for "cape", so a five-round spec answered the wrong picture.
- The project pins a Playwright whose Chromium build was not the one installed.

**New lessons**

1. Reapply mock edits with a script over the other side's pages (take theirs, then replay the
   edit), and regenerate the gallery and coverage with `check_mocks.py --write`; never resolve
   the generated files by hand.
2. Keep a mock branch short-lived. A long-open branch that edits shared mock pages pays for
   every alignment on `main`.
3. Whatever is shown beside a question must not be its answer: check the picking state of a
   new kind of word, not only its sounding state.
4. A page object helper that names the word (`word()`) must name the word the round asks for,
   not only the letters drawn.

**Earlier lessons applied**

- Read the acceptance criteria, not only the slices (J15 #1): criterion 3 was found there.
- Give a round-walking helper the new step with the step (J15 #2): `soundAll` adds the e;
  `word()` was missed and fixed here.
- Measure on 320 × 640, 360 × 640 and 640 × 360 (J9 #1, J11 #1): the four tiles keep one row.
  At 320 × 568 Sound it out overlaps for every word, on `main` too; it is left to the
  responsive mocks and journey 26.
- Tag the critical path in the same change (J11 #4): adding the e is `@critical`.

## Journey 17: Read longer words by syllable

**What slowed it**

- The checkout had no `node_modules`; `npm run build` failed until `npm ci`.
- A ninth word and the new sound e moved the seeds again: the ship, stop and cape specs took
  new ones, found offline.
- The prompt's slices left out the narrow-width criterion (`L2-017` #3). Its spec passed the
  tiles on one line and nothing scrolling, yet Read it fast was under the answer bar: only the
  check against the answer bar's box found it. It appears only once the longer "Now say the
  sounds fast" prompt wraps, so a check of the opening state alone would have missed it.
- The fix needed the mocks' compact shell, which the app had never built. The same overlap
  is there for ordinary words ("boat" at 320 x 640 and 640 x 360) and is left unfixed.
- `round-shell.scss` is now 3.94 kB, 60 bytes under its 4 kB error budget.
- A stray `rm` of a temp path in a long shell command was blocked by the safety check, so
  none of the command ran.

**New lessons**

1. Check a layout in every phase of a round: a longer instruction moves the whole game down.
2. Keep the layout helper (`hiddenUnderAnswerBar`) in the page object and assert it wherever
   a spec asserts that nothing scrolls.
3. Split `round-shell.scss` before the next rule is added to it.
4. Keep a shell command to one job; one refused part stops the rest.

**Earlier lessons applied**

- The mock first (J2 #1, J7 to J16): its script settled that blending goes on to the pictures,
  which the requirement did not say.
- A last control against the answer bar, not only scrolling (J10 #2): it found the overlap.
- Recompute seeds offline (J14 #2): one command gave all of them.
- Whatever is shown beside a question must not be its answer (J16 #3): the picking state shows
  only the syllables and the rule.
- Read the acceptance criteria, not only the slices (J15 #1): criterion 3 was found there.
- Build before proving a failure (J8 #1): each slice's spec failed for the expected reason.
- Tag the critical path in the same change (J11 #4): reading the two syllables is `@critical`.

## Fix: the e2e network guard reported requests as unanswered now and then

**What slowed it**

- Full `verify.mjs` runs sometimes failed with "request unanswered" (for example `cat.wav`),
  while every affected spec passed alone. There were two causes. First, every checkout served
  on port 4300 with `reuseExistingServer`, so concurrent runs from other worktrees reused one
  another's server. That server served the wrong build and stopped mid-run when its owner
  finished. Second, the guard relied on `waitForLoadState('networkidle')`, which resolves at
  once when the page was idle earlier, so a preload still in flight at teardown counted as
  unanswered. It also tracked requests by URL.

**New lessons**

1. Give each checkout its own e2e port and never reuse a server you did not start. Parallel
   agents share one machine.
2. `networkidle` is a load state, not "idle now". To settle in-flight requests, track each
   `Request` object and wait for its finished or failed event, with a bound, so a request that
   is never answered still fails the spec.
- The network-guard flake (J11 to J14): "unanswered" came from requests still in flight when a
  spec ended, since the guard's `networkidle` wait returns at once on a page that reached it
  earlier. The guard now tracks each request object and waits, bounded at 5 s, for open ones to
  settle. Three full e2e runs in a row then passed (203 of 203 each). One earlier run had 2
  failures whose problem lines were not captured, and another run broke on
  `ERR_CONNECTION_REFUSED` / `ERR_INSUFFICIENT_RESOURCES`. That was most likely another
  worktree's Playwright run sharing port 4300 (`reuseExistingServer`). Give each worktree its
  own port when sessions run in parallel.

## Journey 18: Connect words to pictures

**What slowed it**

- `L2-018` asked for three words, a wrong pair that "speaks both", and a word's letters that
  sound out when touched; the mock draws four words as whole targets, lets the word go after a
  miss (`data-release-on-miss`) and drew only default and correct. The mock won: `L2-018`, the
  design and ADR 0023 were rewritten, and `held`, `miss` and the Home card drawn, before code.
  The mock's fourth word, sunset, needs journey 17's syllables, so the theme has three.
- At 320 px wide the shell's bubble left the instruction a 48 px column, 270 px tall, and the
  board fell under the answer bar. The fix was the mock's small-screen shell rules; journey 17
  landed the same rules on `main` as `shell--fit` while this branch was open, so the rebase kept
  theirs and the page opts in. Journey 17 also took ADR 0022; this one became 0023.
- A `git stash` to measure the base bundle rebuilt `dist` from the base; the next layout spec
  ran against it and timed out on a missing Home card.
- A screenshot path written in single quotes kept `${process.env.W}` literally.

**New lessons**

1. When an activity's layout fails on a small phone, measure the shell parts (top, ask, bubble
   text, game) before redesigning the board; the fault may be the shared shell lagging the
   mock (`shell--fit` now carries the mock's small-screen rules).
2. A page that plays a sequence (a word's sounds, then praise) should treat "the sequence was
   stopped" as the end: praise only when the last recording was not stopped, or a hidden tab
   brings praise on return with no touch.
3. After any `git stash` and build, rebuild before the next spec (J8 #1 again).
4. Number a new ADR when the branch is rebased, not when it is started: parallel journeys pick
   the same next number.

**Earlier lessons applied**

- The mock first (J2 #1, J7 to J16): states, Home card and requirement went in the first commit.
- Read the acceptance criteria, not only the slices (J15 #1): #2 (sounding out) became its own
  part of slice 2, and #4 (two touches) its own spec.
- Measure 320 × 568 to 1920 × 1080 with a throwaway spec (J9 #1, J11 #1), in the praise state
  too: it found the shell fault before any commit.
- Grep the flat domain API before naming (J6 #2): `holdWord`, `matchPicture`, `joinColour`.
- A spec that passes before its slice is a guard (J3 #5, J12 #3): reduced motion, said so.
- Tag the critical path in the same change (J11 #4): praise and Next is `@critical`.
- Build before proving a failure (J8 #1): each slice failed for the expected reason first.

## Journey 19: Recognise common words

**What slowed it**

- `L2-019` described three word choices and saved repetition state; the mock is a short story in
  which the child finds every "the", with no sound for a miss. The mock won: `L2-019`, the
  design and ADR 0023 were rewritten first, and the repetition stays in memory at route scope,
  since whether Pibbo remembers practice is not decided.
- Twenty-two 60 px words did not fit under the answer bar on any phone. The mock fits only by
  turning the whole shell into a grid (`.shell:has(.spot)`), which encapsulated components
  cannot copy. The shell gained a `layout="story"` input with named grid areas; the game's own
  parts take `find` and `story`, and the answer bar falls into the empty `answer` cell. It took
  five measure-and-adjust rounds, each fighting the 4 kB stylesheet budget.
- The project's Playwright wanted Chromium 1255 and the container had 1243. A scratch
  `PLAYWRIGHT_BROWSERS_PATH` with symlinks to the installed build worked without touching the
  repo; the variable must be set in every shell.
- The repetition spec passed with the rule broken: the seeded random order asked the missed
  word again anyway. A seed found offline (seed 7) makes only the rule bring it back.

**New lessons**

1. When a mock lays out the shell itself (`.shell:has(...)`), give `pb-round-shell` a layout
   with named grid areas; the game places its own parts, and nothing styles another block.
2. A rule about what comes back later needs a seed under which the random order alone would
   not bring it back; prove it by breaking the rule once.
3. Measure every state, not just the first: the praise bar is taller than the empty one.
4. Commit before a break-the-rule check, so restoring the code is a plain edit.

**Earlier lessons applied**

- The mock first (J2 #1 and on): the Home card and the requirement tags went into the mocks
  before code; the requirement and the design followed.
- Measure on 320 × 640, 360 × 640 and 640 × 360 (J9 #1, J11 #1): a throwaway spec found the
  overflow before the first code commit.
- Seed search offline with mulberry32 (J6 #3, J14 #2): seed 7, found in one command.
- Grep the flat domain API before naming (J6 #2): `numberRecording` already existed and was
  reused rather than redefined.
- Build before proving a failure (J8 #1) and tag the critical path (J11 #4): both slices failed
  first for the expected reason; the praise-and-Next path is `@critical`.
