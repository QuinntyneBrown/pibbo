# Feature: Count a set

**Status:** Complete (PR #3)

Journey 3 of 27 in `docs/journeys.md`. Requirements: L2-001, L2-002, L2-025, L2-026.

## Goal

A child chooses Count the toys on Home. Things appear. Each touch says the next number and marks the thing counted. Touching it again does not count it twice. Then the child chooses the numeral. A wrong answer is a chance to try again. Every instruction is spoken and shown.

Why now: It is the first activity in the purpose and it builds the shared round behaviour (instructions, retry and praise) that every later activity reuses.

## Finish the whole feature in one run. Do not stop. (CRITICAL)

- You are authorised to take this feature all the way: the doc phases below, test-first slices, green tests and a PR. Go through every phase and every slice in one continuous run. Do not pause between phases to report, ask for approval, or wait for "continue".
- Do not end your turn until the "Done means" list at the bottom is fully true. A partial result, a plan, or "the next steps would be..." is not done.
- Where the repo's instructions say "stop and ask", treat this prompt as the confirmation in advance for everything in scope here. Choose the simplest option that fits the existing architecture, record it (an ADR in `docs/adr/` or the design's open-questions section), and keep going. This never covers loosening *Children's privacy and safety*: that still needs an ADR and the repository owner's agreement.
- If a shared library, component or design asset lacks something, that is not a reason to stop. Update it first, as the repo's rules require (mock, then design system, then requirement, then ADR, then design, then code), then go on.
- When a test, build or command fails, find the root cause and fix it, then go on. Never weaken a test to make it pass, and never skip a step quietly.
- Only stop for a real blocker you cannot resolve yourself, such as missing credentials, or an action outside this repo that can't be undone, such as production deploys or data changes. If that happens, finish everything else first, then report the blocker clearly.
- Keep track of progress (a todo list), so that nothing gets left out after context is summarised.

## Rules (read first, binding)

- Read `AGENTS.md` first and follow it exactly, especially:
  - The mocks in `docs/mocks/` are the source of truth. Where anything disagrees with a mock, the mock wins.
  - *Children's privacy and safety* outranks everything: no data about a child, no third-party calls, no microphone or camera, nothing leads out.
  - Lazy loading and memory come next: lazy routes, assets loaded when the activity is chosen, everything released on destroy, bounded caches, state scoped to the route.
  - Rules live in `@pibbo/domain` as pure functions with unit tests. Randomness and time are injected. Sounds are recordings, never speech synthesis. One sound at a time.
  - Use the spec's words (child, grown-up, activity, round, thing, number, numeral, word, letter, sound, blending, spoken, recording). Use `pb-*` selectors, file-per-type components, encapsulated BEM, and keep the mocks' BEM classes.
  - Touch targets are at least 60 × 60 px. Nothing scrolls during an activity. Taps only. Everything spoken is also shown. Reduced motion is respected.
  - E2E: Chromium only, Page Object Model, the shared fixture (fake clock, seeded random source, recorded audio requests, a network guard). Only behaviour specs run by default. Never write architecture tests.
  - Undecided matters (which numbers, which words and sounds and in what order, languages) are not decided in code. The mock cast is not a rule.
- Work through the phases below **in order**, using the repo skill each phase names.
- Copy the house style of each folder. Read the existing neighbours before you write anything new.
- Before you start, read `docs/lessons-learned.md` (if it exists) and apply the lessons that fit.

## Phase 1: Read and align

- Requirements: `L2-001`, `L2-002`, `L2-025`, `L2-026` in `docs/specs/L2.md` and their parents in `docs/specs/L1.md`.
- Detailed designs: `docs/detailed-designs/count/count-a-set/README.md`, `docs/detailed-designs/rounds/spoken-and-shown-instructions/README.md`, `docs/detailed-designs/rounds/retry-and-praise/README.md`, with their diagrams.
- Mocks: `docs/mocks/pages/count-the-toys/` and their entries in `docs/mocks/manifest.json`.
- `docs/design-system/`, the ADRs in `docs/adr/` and `docs/journeys.md`.
- Check that the requirement, the design and the mock agree. Where they do not, the mock wins: bring the design system, the requirement, any ADR and the design in line, in that order, before code.

## Phase 2: Incremental implementation (`implementing-incrementally`, `angular-developer`, test-first ATDD)

- Plan thin vertical slices. These are suggestions you can adjust:
  1. The shared round shell: spoken and shown instructions, with the text shown when a recording cannot play (`L2-025`).
  2. A round shows N things from the injected random source, with no overlap (`L2-001`).
  3. One touch, one number: speak, show and mark the thing counted by shape and colour. A second touch changes nothing (`L2-001` #1, #2).
  4. Two fingers on two things count each once (`L2-001` #3).
  5. When counting is complete, numeral choices are offered (`L2-001` #4, `L2-002`).
  6. A right answer gets brief praise that never blocks the next round. A wrong answer re-counts aloud and the child chooses again. After three wrong answers the answer is modelled (`L2-026`).
  7. Only one sound plays at a time. Sound and motion rest while the tab is hidden.
- For each slice:
  - Write the Given-When-Then criteria from the L2 acceptance criteria.
  - Write the Playwright acceptance test with page objects, importing `test`/`expect` from the shared fixture, with a `// Traces to: L2-xxx` header. Assert what was spoken (the recorded audio requests) as well as what was shown.
  - Run it and show that it fails for the expected reason.
  - Implement the minimum that makes it pass: rules in `domain` with unit tests, presentation in `components`, orchestration in the `pibbo` page. Refactor while the tests are green.
  - Run `node tools/verify/verify.mjs` from the repo root (npm commands from `frontend/`), then commit.
- When all slices are green, add this journey's entry to `docs/lessons-learned.md` (what slowed it, new lessons, how earlier lessons worked). Set this journey to done and update **% complete** in `docs/journeys.md` (and `docs/detailed-journeys.md` if it exists). Keep the mocks, design system, specs and designs aligned with what was built.

## Deferred (not in scope)

- Which numbers Count covers and in what order is not decided: use the cast in the mock and do not decide it in code

## Done means

- A child can play rounds of Count the toys end to end from Home, with the spoken sequence proved by the audio fixture.
- All the new and existing tests pass with `node tools/verify/verify.mjs`, and the CI checks are green.
- Docs and design artifacts agree with the code. `docs/lessons-learned.md` and `docs/journeys.md` are updated.
- The work is on a branch (for example `journey/03-count-a-set`) with a PR to `main`. Fetch and rebase onto `main` first, because another session may have pushed to it.
- Only then end the run, with a short summary of what was built, the decisions made along the way, and anything deferred.
