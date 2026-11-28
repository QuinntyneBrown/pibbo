## Purpose

> Pibbo helps young children learn to count and to sound out words. A child opens it on
> whatever screen is to hand, picks an activity, and plays: counting the things in front of
> them, and saying each sound of a word and blending the sounds into the word.

The child cannot yet read; a grown-up is nearby and is never needed to make Pibbo work. Before
adding or changing anything, ask how it helps a child count or sound out a word: if it does
not, do not build it, and if a request works against it, say so. The app stays this small:

- **Home**: the child chooses an activity. Two pictures, each spoken when touched.
- **Count**: the child touches each thing and Pibbo says the number ("one, two, three"), then
  chooses the numeral for how many. One touch, one number: a second touch never counts twice.
- **Sound Out**: the child touches each letter of a short word to hear its sound, then blends
  them: "c", "a", "t", "cat". A letter makes its sound, never its name and with no vowel added
  ("mmm", never "em" or "muh").
- A wrong answer is a chance to try again: nothing is lost, taken away or shamed. Praise is
  for effort, is brief and never interrupts. No timers, lives, streaks, leaderboards, adverts,
  purchases, chat, accounts or notifications.

Not decided yet, and never decided in code: which numbers, sounds and words the activities
cover and in what order; whether Pibbo remembers what a child has practised; whether a grown-up
has a screen; which languages and accents it speaks. The mission (`docs/specs/L0.md`) is not
written: do not invent one. When it is, this section quotes it word for word.


## Design

The mocks in `docs/mocks/` (listed in `manifest.json`) are the design and the source of truth;
`docs/design-system/` is extracted from them. Never invent brand, colour or type in code. Where
anything disagrees with a mock, the mock is right. A screen's states are drawn before it is
built or changed, and when a mock changes, the design system, requirement, ADR and detailed
design follow in that order, before any code. Sample words and pictures are the cast, not rules.

- **Big, few and far apart.** Touch targets are at least 60 × 60 px, clear of their neighbours.
- **One thing at a time.** Nothing scrolls during an activity or sits under the fold.
- **Touch is a tap.** No double tap, long press, pinch, precise drag or hover; a stray finger
  or resting palm breaks nothing.
- **Said and shown.** Whatever Pibbo says is also shown and whatever it shows is also said;
  text is never the only instruction and colour never the only carrier of a state.
- **Letters as a child writes them.** Lowercase, single-storey a and g; b/d/p/q, I/l/1 distinct.
- **Calm.** No flashing, sudden sound or clutter. Motion shows what happened, then stops;
  reduced motion removes every animation that is not the answer itself.
- **Every width.** From the narrowest phone to the widest desktop, upright or on its side:
  more room, not more things. On a desktop, mouse and keyboard both work.
- **The way out is for a grown-up**, where a child will not land on it by accident.

## Frontend

`frontend/projects/` holds the libraries `api` (contracts, types, tokens), `domain` (rules:
`counting/`, `sounds/`, `rounds/`, `storage/`) and `components` (presentation), and the app
`pibbo`. Add a focused library when a concern earns one; another app needs an ADR.

- **Dependency direction**, enforced by ESLint: `pibbo` → `components`, `api`, `domain`;
  `domain` → `api`; `components` → `api` for types only; `api` → nothing. A new library joins
  this rule and the ESLint boundaries in the same change. `app.config.ts` binds every token
  except those a lazy route binds.
- **Rules live in `domain`** as pure functions with unit tests, never in a component. Random
  choices and time are injected: no `Math.random()`, no `new Date()`.
- **Words, sounds and numbers are data** in `domain`, checked at build: every word has a
  picture and a recording, every sound a recording. The browser never synthesises a sound.
- **Sound follows a touch**: the first touch on Home unlocks it. One sound at a time: a new
  recording stops the last. One that cannot play never blocks a round; its words are shown.
- Current Angular: standalone, signals, `OnPush`, zoneless; Prettier and angular-eslint own
  format and lint. Selectors are `pb-*`; imports are `@pibbo/<library>`.
- **Presentation lives in `components`**: inputs and outputs, no service, token or router.
  Orchestrating pages and dialogs stay in the app. Each service has a contract and token in
  `api`; logic with many cases lives in a service or helper with unit tests.
- **File per type**: `name.ts`, `name.html`, `name.scss`; no inline `template`, `styles` or
  `style`. One encapsulated BEM stylesheet per component, the block named as in the design
  system, never styling another block. States are ARIA attributes (`aria-pressed`,
  `disabled`) and styled through them. Keep the mocks' BEM classes: e2e locators use them.
- Global styles are foundations only (tokens, `@font-face`, reset); read tokens by role, not hex.
- **Declare each `ng-content` slot once**, in one `<ng-template>` shared by an `<a>`/`<button>`
  pair; a consumer wraps each `[slot=…]` node in its own `@if` (NG8011).
- **A child never types and never sees an error message.** Grown-up edits open a CDK Dialog or
  a screen, never a hand-rolled modal. A contract refuses with an error `code` the screen
  branches on; the screen stays usable or offers one large way back to Home.
- Stored values are checked before use and rendered as text; a damaged one counts as absent.
- Everything spoken and every meaningful picture has a text alternative; a screen reader hears
  a round in the order a child meets it.

## Lazy loading and memory (the top frontend priority)

Second only to privacy: a change that grows the initial bundle or leaks memory is not done.

- **Load only what is needed now**: every route uses `loadComponent`/`loadChildren`, heavy UI
  uses `@defer`, and an activity's code, pictures and recordings load when it is chosen.
  Raising an `angular.json` budget needs a reason in the change.
- **A touch answers at once**: a round's recordings and pictures are ready before it is shown,
  and the next round's are fetched during this one.
- **Release everything you acquire** when its owner is destroyed: subscriptions, timers,
  listeners, observers, `AbortController`s, audio elements, buffers and context, object URLs,
  pending requests.
- **Bound what grows and scope state to its use**: caches have a fixed size, services are
  provided at the route that needs them, and an activity's state goes when the child leaves.
- **It rests**: sound and animation stop while the tab is hidden, and nothing plays on return
  until the child touches the screen.

## Tests and CI

- **ATDD is mandatory for product code.** Each change needs a requirement, a detailed design
  and a mock first. Invoke `implementing-incrementally`: per slice, write Given-When-Then
  criteria and the acceptance test, watch it fail for the expected reason, implement only that
  slice, then run the regression checks. No bulk implementation, tests added afterwards or
  weakened tests. Mocks, designs, docs and test-only changes are exempt.
- **Playwright, Chromium only**, with page objects owning every selector and `test`/`expect`
  from the shared fixture. Fixtures fix the clock and random order, record which recordings
  were asked for, and fail a spec on a page error or a request off localhost.
- Tests never sleep or wait for a recording: they advance a fake clock.
- Only behaviour specs run by default. Visual, responsive, accessibility and heap sweeps run,
  and baselines update, only when a person asks.
- Never write architecture tests (structure, naming, banned-API, traceability).
- **CI** is always green and under 5 minutes: lint, build and one critical acceptance path per
  feature. Unit tests run locally only. A flaky or slow check is fixed or removed, not retried.


