## Purpose

> Pibbo helps young children learn to count and to sound out words. A child opens it on
> whatever screen is to hand, picks an activity, and plays: counting the things in front of
> them, and saying each sound of a word and blending the sounds into the word.

**What it is for.** A child who cannot yet read picks up a phone or a tablet, or sits at a
computer with a grown-up, and practises two things: counting, and sounding out words. Pibbo is a
responsive web application, used on a phone, a tablet, a desktop and a large screen. The child
is the one using it; a grown-up is beside them or nearby, and is never needed to make it work.

**Direction.** One question decides everything: does this help a child count, or sound out a
word? The whole app is two activities and a way to choose between them, and it stays that small:

1. **Home**: the child chooses an activity. Two choices, each a picture that says what it is
   and is spoken when touched. Nothing here needs reading.
2. **Count**: the child counts. Things appear, the child touches each one, and Pibbo says the
   number as it is touched: "one, two, three". Then the child says how many there are by
   choosing the numeral.
3. **Sound Out**: the child sounds out a word. A short word appears with its picture. The child
   touches each letter to hear its sound, then blends the sounds to hear the word: "c", "a",
   "t", "cat".

- **A child who cannot read can use all of it.** Every instruction is spoken and shown by a
  picture or by motion. Text is never the only way a child learns what to do, what happened or
  what comes next.
- **A letter makes its sound, not its name.** In Sound Out the letter m says "mmm", never
  "em". Each sound is a recording of that sound alone, with no vowel added after a consonant
  ("mmm", never "muh").
- **Counting is one touch, one number.** Each thing is counted once: touching it says the next
  number and marks it as counted, and touching it again does not count it twice.
- **A wrong answer is a chance to try again.** Nothing is lost, taken away or shamed. Pibbo
  shows or says the way forward, and the child tries again. There is no timer, no lives and no
  losing.
- **Praise is for the child's effort and is brief.** It never interrupts the next thing the
  child wants to do.

Pibbo has no adverts, no purchases, no links that leave the app, no chat, no accounts for
children, no leaderboards or comparison between children, no streaks, no timers or countdowns,
no notifications, and nothing that tracks a child. It asks a child for nothing about
themselves: no name, no age, no photo, no voice recording, no location. Before adding or
changing anything, ask how it helps a child count or sound out a word; if it does not, do not
build it, and if a request works against it, say so.

These things are not decided yet, and none is built before its requirement and its design
exist: which numbers Count covers and in what order; which sounds and words Sound Out covers and
in what order; whether Pibbo remembers what a child has practised, and where; whether a grown-up
has a screen of their own; and which languages and accents Pibbo speaks. Do not decide any of
them in code.

The requirements go in `docs/specs/L1.md` (what Pibbo must do) and `docs/specs/L2.md` (each
behaviour with its acceptance criteria). An acceptance test names the L2 requirements it covers
in a header comment (`// Traces to: L2-012`).

The detailed designs go in `docs/detailed-designs/`, one folder per subsystem and one per
feature inside it; its `README.md` lists them with the L2 requirements each realises.

The mission, Pibbo's single L0 requirement, is not written yet. When it is, it goes in
`docs/specs/L0.md` and this section quotes it word for word; everything then points back to it.
Do not invent a mission in its place.

## Design

The design does not exist yet. There is no prototype, no brand, no wordmark, no colour and no
type. Do not invent them in code: the design is drawn first, and the code follows it.

When the design exists, the mocks in `docs/mocks/` are the design and the ultimate source of
truth: every screen in every state, with `docs/mocks/manifest.json` listing them. If the design
is drawn in a prototype first, the mocks are transcribed from it before any screen is built;
when the prototype changes, the mocks are transcribed again, and `docs/mocks/README.md` says
where they depart from it, and why. Everything else follows the mocks: `docs/design-system/`,
which is extracted from them and which they render through, `docs/specs/`, the ADRs,
`docs/detailed-designs/`, these instructions and the code. Where any of those disagrees with a
mock, the mock is right and the other is brought in line. When a mock changes, the design
system, the requirement, the ADR it touches and the detailed design are brought in line with it
in that order, before any code.

Whatever the design becomes, it keeps to these, because the person using it is a small child:

- **Big, few and far apart.** A screen offers a child a small number of things to touch, each
  one large and well clear of the next. Anything a child touches is at least 60 × 60 px, with
  space between it and its neighbour.
- **One thing at a time.** A screen asks one thing of the child. Nothing scrolls during an
  activity, and nothing the child needs is under the fold.
- **Touch is a tap.** Nothing a child must do needs a double tap, a long press, a pinch, a
  precise drag or a hover. A stray second finger or a resting palm does not break a screen.
- **Sound carries the meaning, and is never the only carrier.** Whatever Pibbo says is also
  shown, so it works with the sound off and for a child who cannot hear it; whatever it shows
  is also said, for a child who cannot read it. Colour is never the only carrier of a state.
- **Letters are drawn the way a child is taught to write them.** Lowercase first, with a
  single-storey a and g, and letters that are easily confused (b, d, p, q; I, l, 1) clearly
  told apart. Numerals are equally plain.
- **Calm.** No flashing, no sudden loud sound, no clutter and nothing moving that the child is
  not meant to look at. Motion shows what happened and then stops.
- **Phone:** one column, held in either hand, upright or on its side.
- **Tablet and desktop:** the same activity with more room, not more things. On a desktop every
  activity works with a mouse and with the keyboard.
- **Motion.** Reduced motion removes every animation that is not the answer itself, and the
  activity still makes sense without it.
- **The way out is for a grown-up.** Anything that is not for the child (settings, anything
  about Pibbo itself) sits where a child will not land on it by accident, and is never between
  the child and an activity.

Before a screen is built or changed, its states are drawn in `docs/mocks/`. The sample words,
numbers and pictures in a prototype or a mock are the cast, not rules.

## Where things are

- **The frontend is what a child uses.** `frontend/` is an Angular workspace and holds every
  screen: Home, Count and Sound Out, with the pictures and the recorded sounds they play.
- **There is no backend.** Pibbo runs in the browser, and nothing a child does leaves the
  device. If a requirement ever needs a backend, an ADR decides what it holds before it is
  added, and it follows *Backend* below.
- Before building a feature, read its requirement (`docs/specs/`, `docs/journeys.md`), its
  detailed design (`docs/detailed-designs/`) and its mocks (`docs/mocks/`, the source of truth
  for the UI; `docs/design-system/` is extracted from them).
- Read the relevant ADRs in `docs/adr/` before changing the areas they cover.
- Where a rule below names something that does not exist yet (a project, a command, a fixture,
  a helper, a folder, a document), the first change that needs it adds it. The repository starts
  with these instructions and the skills, and nothing else.
- Run npm commands from `frontend/`. `node tools/verify/verify.mjs` runs every CI check and the
  unit tests locally; run it before pushing.

Use the words the specs use in code, docs and UI; no synonyms. The person Pibbo is for is a
"child", and the adult with them is a "grown-up". What a child chooses on Home is an
"activity": "Count" or "Sound Out". One turn of an activity, from what is asked to the child's
answer, is a "round". In Count a child counts "things" and answers with a "number", written as
a "numeral". In Sound Out a "word" is made of "letters", each letter or group of letters makes
a "sound", and putting the sounds together is "blending". What Pibbo says aloud is "spoken",
and comes from a "recording".

## Prefer best practice

Choose the platform's established best practice (Angular, Playwright, WCAG, and .NET if a
backend is added) over the expedient way. A departure needs an ADR giving its reason. If a rule
here or in an ADR conflicts with best practice, say so and propose the correction; do not work
around it silently.

## Children's privacy and safety

These rules outrank convenience and any other rule they conflict with.

- **Pibbo collects nothing about a child.** No name, age, photo, voice, location, contact or
  identifier is asked for, recorded or sent. There are no analytics, no tracking, no
  fingerprinting and no advertising or third-party SDK of any kind.
- **The browser calls only Pibbo's own origin.** Fonts, pictures, recordings and scripts are
  bundled and self-hosted. Nothing is loaded from a CDN or any third party, so no third party
  learns that a child is using Pibbo.
- **The microphone and the camera are never used.** No permission prompt of any kind is shown to
  a child.
- **Nothing leads out.** No link, button or embed takes a child off Pibbo, and nothing asks for
  money or for a grown-up's details.
- **Anything kept is kept on the device**, holds nothing that says who the child is, and can be
  cleared by a grown-up. What is kept, if anything, is decided by a requirement and an ADR
  first.
- **Content is fixed and reviewed.** Every word, picture and recording a child meets is in the
  repository and was chosen for a young child. Nothing a child sees or hears is generated at
  run time or fetched from an outside source.
- A change that would loosen any of these needs an ADR and the repository owner's agreement
  before any code.

## Frontend

A multi-project workspace under `frontend/projects/`. The baseline is three libraries, `api`
(contracts, types and injection tokens), `domain` (the rules of the activities: `counting/`,
`sounds/`, `rounds/`, `storage/`) and `components` (presentation), and one application,
`pibbo`.

That baseline is where the organisation starts, not a limit on it. When a concern earns its own
library (an `audio` project for playing recordings, a `browser` project for browser-only
implementations, and so on), add it. A smaller, focused library that can be lazy-loaded on its
own is better than one that keeps growing. A further application needs its own ADR.

- **Dependency direction.** `pibbo` → `components`, `api`, `domain`; `domain` → `api`;
  `components` → `api` for types only; `api` → nothing. No library imports an app. `pibbo`'s
  `app.config.ts` is the composition root and binds every token, except those a lazy route
  brings, which that route binds so their code stays out of the initial bundle. ESLint enforces
  it. A new library takes its place in this direction, and the same change adds it to this rule
  and to the ESLint boundaries; it never depends on `pibbo`, and `api` still depends on nothing.
- The rules of an activity (what a round asks, what counts as counted, which sounds make a
  word, whether an answer is right, what comes next) live in `domain` only, as pure functions
  with their unit tests, never in a component. Anything random (which things, which word, what
  order) comes from a source that is injected, never from `Math.random()` in a component, and
  anything timed from a clock that is injected, never from `new Date()`.
- **Words, sounds and numbers are data.** The words Sound Out teaches, the sounds each is made
  of, and the recording and picture for each are data in `domain`, checked when the app is
  built: every word has a picture and a recording, and every sound it uses has a recording. A
  sound is never synthesised by the browser's speech engine; how a child hears a letter is too
  important to leave to the device.
- **Sound follows a touch.** A browser plays sound only after a touch, so the first touch on
  Home unlocks it. A recording that cannot play (the sound is off, the file failed) never
  blocks a round: what it would have said is shown.
- **One sound at a time.** A new recording stops the one before it; sounds never pile up when a
  child taps quickly.
- Prettier and angular-eslint own formatting and lint; CI fails on either.
- Current Angular: standalone components, signals for state, `OnPush` everywhere, zoneless.
- **Responsive at every width.** Every screen works from the narrowest phone to the widest
  desktop, upright and on its side, as the mocks draw it; no screen is built for one form
  factor and patched for the rest.
- **Lazy loading and memory management come first.** They outrank convenience and any other
  frontend rule they conflict with, except *Children's privacy and safety*; see *Lazy loading
  and memory* below.
- Selectors are `pb-*`; class, file and folder names omit the prefix. Libraries are imported
  as `@pibbo/<library>`.
- **Presentation lives in `components`.** A presentation component takes inputs, emits outputs
  and injects no app service, token or router. Pages and dialogs that orchestrate stay in the
  app.
- **File per type.** A component is `name.ts` + `name.html` + `name.scss` with
  `templateUrl`/`styleUrl`, never inline `template`/`styles`. No inline `style` in templates.
- **One encapsulated BEM stylesheet per component.** Default encapsulation, never
  `ViewEncapsulation.None`. The component is the block, named as in the design system;
  `block__element`, `block--modifier`; a state assistive technology must know is an attribute
  (`aria-current`, `aria-invalid`, `aria-pressed`, `disabled`) and is styled through it. Never
  style another component's block. Keep the mocks' BEM classes: e2e locators depend on them.
- Global styles are foundations only (tokens, `@font-face`, reset, utilities). Read tokens by
  role, never hex. Fonts are bundled and self-hosted, never loaded from a CDN.
- **Declare each `ng-content` slot once.** A component rendering `<a>` or `<button>` by
  condition puts its slots in one `<ng-template>` rendered with `ngTemplateOutlet` in both
  branches. A consumer `@if` wrapping several `[slot=…]` nodes loses the slot (NG8011): one `@if`
  per node.
- Logic with many cases (a store, a tracker, a pure helper) lives in a service or helper with
  its unit tests, never in a component.
- Each service has a contract and an injection token in `api`; components depend on the token.
- **No inline forms, and no forms for a child.** A child never types. Anything a grown-up edits
  opens a CDK Dialog or navigates to a screen. Never hand-roll modals.
- A contract refuses with an error whose `code` a screen branches on. A child is never shown an
  error message: the screen stays usable, or offers one large way back to Home.
- Anything read from storage is data, rendered as text, never as HTML, and is checked before it
  is used: a stored value that is missing, old or damaged is treated as not there.
- Every interaction works by touch on a phone and a tablet, and by mouse and keyboard on a
  desktop. Everything spoken has a text alternative, every picture that carries meaning has
  one too, and a screen reader hears a round in the order a child would meet it.

## Backend

Pibbo has no backend. This section applies only if an ADR adds one.

Clean architecture, strict dependency direction: `Pibbo.Domain` (entities, zero deps) ←
`Pibbo.Application` (MediatR handlers, validators, DTOs, `IAppDbContext`) ←
`Pibbo.Infrastructure` (EF Core, migrations) ← `Pibbo.Api` (controllers).

- Business rules live in handlers and domain services. A controller checks nothing itself and
  sends one MediatR request.
- The API does not apply migrations on startup; a CLI command does. Seed data is idempotent.
- Errors are ProblemDetails with a `code` extension where a client branches on them.
- It holds nothing that says who a child is, and *Children's privacy and safety* binds it as it
  binds the frontend. No log, metric or span carries anything a child did, a token, a query
  string or a body; a route is recorded as its template.
- Anything that depends on the time reads `TimeProvider`.
- Tests use no real database and no network (EF Core InMemory, one store per fixture, and
  fakes for anything outside), and never sleep: they advance `FakeTimeProvider` or await an
  event with a timeout.
- A setting a deployed system needs is documented in the same change.

## E2E (Playwright)

- **No real clock, no real randomness and no network beyond localhost.** A fixture sets the
  time and the order of anything random, so a round asks the same thing on every run. An
  unanswered request, a request off localhost or a page error fails the spec.
- **A spec proves what was said as well as what was shown.** A fixture stands in for the audio
  player and records which recordings were asked for, in order; a spec never listens to real
  sound and never waits for a recording's length.
- Page Object Model: one page object per screen or dialog owns the selectors. Never put a
  selector in a test. Specs import `test`/`expect` from the shared fixture.
- Only behaviour specs run by default. Visual, responsive and accessibility sweeps are written
  and kept current but run only when a person asks; no agent runs them or updates baselines
  unprompted. Update baselines only for intentional design changes, after changing the mock.
- Chromium only; never configure or run another browser. Touch is emulated in Chromium.
- In unit tests, time-driven rules (a recording finishing before the next begins, praise that
  dismisses itself, a hint that appears when a child waits) advance a fake clock; never sleep.

## CI (GitHub Actions)

- The pipeline is always green and finishes in under 5 minutes in total. A flaky or slow check is
  fixed or removed, never retried.
- It runs only the few highest-value tests per feature: lint, build and one critical acceptance
  path each. Unit tests run locally, never in CI.
- A setting a deployed system needs is documented in the same change.

## Lazy loading and memory (the top frontend priority)

Pibbo is opened on whatever is to hand: often an old phone or a hand-me-down tablet, on a slow
connection, by a child who will not wait. Home has to appear fast, a touch has to answer at
once, and a long play uses no more memory at its end than at its start. A change that grows the
initial bundle or leaks memory is not done, whatever else it achieves.

- **Load only what is needed now.** Every route uses `loadComponent`/`loadChildren`; heavy or
  below-the-fold UI uses `@defer`; an activity's code, pictures and recordings are loaded when
  the child chooses it, never from the initial chunk. Keep the initial bundle small and the
  `angular.json` budgets tight; raising a budget needs a reason in the change.
- **A touch answers at once.** The recordings and pictures a round needs are ready before the
  round is shown, so a child never touches a letter and waits for its sound. The next round's
  are fetched while the child plays this one.
- **Release everything you acquire.** Whatever a component or service creates, it tears down
  when its owner is destroyed: subscriptions (`takeUntilDestroyed`/`DestroyRef`), timers,
  intervals and `requestAnimationFrame` loops, event listeners, observers, `AbortController`s,
  audio elements, decoded audio buffers and the audio context, object URLs, and pending
  requests a child has navigated away from.
- **Bound what grows.** Recordings and pictures from rounds already played are dropped; a
  cache of them has a fixed size. Nothing accumulates without a limit for the length of a play.
- **Scope state to its use.** Provide services at the route or component that needs them, not
  in `root`, unless the whole app shares them. An activity's state goes when the child leaves
  it.
- **Prove it.** Leaving an activity returns its memory: an activity is checked for a stable
  heap across many rounds and across repeated enter and leave, and like the visual and
  accessibility sweeps, these heap checks run only when a person asks.
- **It rests.** Sound and animation stop while the tab is hidden or the screen is locked, and
  nothing plays on return until the child touches the screen.

## Incremental implementation and ATDD (mandatory for product code)

Every change to user-impacting product code (the app and its libraries, and a backend if one is
added) needs a requirement, a detailed design and a mock before implementation, and is built
incrementally. Mocks, designs, the design system, docs and test-only changes are exempt and get
no tests.

Before writing product code, invoke and follow the `implementing-incrementally` skill, with ATDD:
plan small slices and finish one at a time. For each, write Given-When-Then criteria, write the
acceptance test (Playwright with page objects; through the API for a backend), run it to prove
it fails for the expected reason, then implement only that slice, refactor green and run the
regression checks before the next. No bulk implementation, no tests added afterwards, no
weakening tests to pass. Keep requirement, design, mock, tests and code aligned throughout.

Never write architecture tests: no structure, layout, naming, banned-API or spec-traceability
tests. A test suite proves behaviour.

## Skills

The skills are in `.claude/skills/` and, as the same files, in `.agents/skills/`; a change to one
is made in both. They are used in this order as the product is built:
`engineering-requirements` (`docs/specs/`), `writing-html-mocks` (`docs/mocks/`),
`extracting-design-systems` (`docs/design-system/`),
`writing-software-design-documents` (`docs/detailed-designs/`), `estimating-designs`,
`writing-feature-prompts`, then `angular-new-app`, `angular-developer` and
`implementing-incrementally` for the code. `grilling` stress-tests a plan and `creating-videos`
films a finished slice.

## Lessons learned and progress

Before a slice of `docs/detailed-journeys.md`, read `docs/lessons-learned.md` and apply the lessons
that fit. When the slice finishes, before it merges, add its entry there (what slowed it, new
lessons, and how each earlier lesson it applied worked) and update **% complete** in
`docs/detailed-journeys.md` and `docs/journeys.md`.
