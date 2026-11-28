# 0028: Practice is kept on the device, and a grown-up has an area

**Status:** Accepted (journeys 23 and 24, decided by the repository owner)

## Context

`AGENTS.md` listed two matters as not decided and never to be decided in code: whether Pibbo
remembers what a child has practised, and whether a grown-up has a screen. ADR 0024 kept Spot the
word's repetition in memory for that reason. Journey 23 (the check game, `L2-023`) needs practice
history and saved results; journey 24 (`L2-037`) is a grown-up gate and area where progress is
cleared. `L1-025` already says "any progress shall stay on the device". Asked before journey 23,
the repository owner decided both.

## Decision

1. **Pibbo remembers what a child has practised, on this device only.** It keeps two things and
   nothing else: which activities were opened (practice history) and which skills the last check
   game earned. No name, age, answer, miss, time or count is kept, and nothing is sent anywhere
   (`L2-029`). A misses list is never stored (`L2-023` #1).
2. **A grown-up has an area**, behind a gate a child will not pass by accident, reached from a
   small corner control on Home and never between a child and an activity (`L1-030`, `L2-037`).
   It offers volume, clear progress and about Pibbo, and has no external links.
3. **The store is a contract.** `PROGRESS_STORE` in `@pibbo/api` (`ProgressStore`: `read` with a
   guard, `write`, `clearProgress`) is bound in `app.config.ts` to `BrowserProgressStore`, over
   `localStorage` under the `pibbo:` prefix. `read` checks the stored value with a guard from
   `@pibbo/domain/storage` and treats a missing, old or damaged value as absent; a store that
   cannot be read or written (private window, storage blocked) behaves as empty and never
   blocks a round. `clearProgress` removes every progress key and any IndexedDB database whose
   name starts with `pibbo`; the volume setting stays.
4. **What counts as practised** is opening an activity from Home: Home notes the activity before
   it opens. The history keeps each activity once, most recent last, at most one entry per
   activity in the catalogue, so it cannot grow.
5. **The first lesson is data**, not a rule: `LESSONS` in `@pibbo/domain/lessons` holds the mock's
   two lessons as ordered lists of activity ids. With no practice history, the check game takes
   its rounds from the first lesson's activities that exist; an unknown one is skipped. The
   guided lesson screen itself stays with journey 22.

## Consequences

`AGENTS.md` no longer lists the two matters as undecided and points here. Spaced repetition
across visits (ADR 0024) can now use the store, but is not built. Which numbers, sounds and words
the activities cover, and in what order, stays undecided, as do languages and accents. A browser
that clears its storage forgets the history; the check game then falls back to the first lesson.
