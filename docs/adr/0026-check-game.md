# 0026: The check game: one question for each activity, and what the device keeps

**Status:** Accepted (journey 23); what the device keeps is open for the repository owner

## Context

`L2-023` asks for 5 to 8 mixed rounds from what the child has practised, the normal retry rule,
results that show only earned pictures, and results kept on the device only. The mocks
(`progress-check`) drew four fixed questions; a `retry` that said "Good try! On to the next one."
beside a Try again button that led to the next question; and results that named a child, gave
every activity zero to three stars, listed what had never been answered and recommended what to
try next. Home had no picture for the check game. The design said `CheckGamePage` "reuses each
activity's component for its rounds".

Journey 22 (the guided lesson) is not built, so there is no lesson content, no practice history
and no storage. `AGENTS.md` lists as not decided "whether Pibbo remembers what a child has
practised". Journey 23's instructions put history-based rounds and saving results in scope.

## Decision

1. **The mocks were redrawn first** where they broke `L2-023` or the purpose: results are earned
   pictures only, with no name, stars, unearned rows or recommendation, plus a `results-none`
   state; a wrong answer gets a hint and Try again on the same question, and a `model` state
   shows the third miss. Home gained the check game's picture, "What do I know?", beside the
   wordmark.
2. **A check question is one shape**, as the mock draws it: an instruction, something shown, three
   choices and Check. Each activity has one kind of question, so a skill earned is truthfully
   that activity's. The activities' own components are not reused: their rounds take many
   touches and own their pages' rules. `letter-question` and `adding-question` were drawn for
   the questions that show text or two sets. The words, letters, numbers and recordings come
   from the activities' existing content; no new numbers, sounds or words are chosen.
3. **Choosing rounds** (`planCheck`, pure): the practised activities that have a question,
   shuffled by the injected random source, at most 8; fewer than 5 take turns until there are 5.
4. **The first lesson** is not defined yet. Until journey 22 brings lesson content,
   `CHECK_GAME.firstLesson` names the four activities whose questions the mock draws (Words and
   pictures, Count the toys, Rhyme time, Which is bigger?). It is a stand-in, not a decision
   about what Pibbo teaches first; journey 22 replaces it with its first lesson's activities.
5. **What the device keeps** is the smallest thing `L2-023` needs: under `pibbo:practised`, the
   ids of activities opened from Home; under `pibbo:earned`, the ids of activities ever
   answered right in a check game. Each is `{ "version": 1, "activities": [...] }`, holds each
   id once (so it never grows past the number of activities), and holds no name, date, count,
   score, answer or miss. Nothing is sent anywhere. Earned ids only grow: a later check never
   takes one away.
6. **"Practised" is "opened from Home"**: one place records it, and no activity changes. A stray
   touch counts too; the only effect is that the check game asks one question about it.
7. **`ProgressStore`** (`PROGRESS_STORE` in `@pibbo/api`) has `read(key, parse)`, `write` and
   `clearAll`. The browser one uses `localStorage` under the `pibbo:` prefix and never throws:
   storage that is off, full or damaged counts as empty. No IndexedDB is used. `clearAll` is what
   journey 24's "clear progress" calls; until then no screen calls it.
8. **Reading choices are silent.** Touching a word or letter choice chooses it without saying it,
   since saying it would answer the question; a numeral says its number and a picture its word.
   Every choice has its text as its accessible name.
9. **The progress bar became `pb-progress-bar`**, so a game of 6, 7 or 8 rounds can be drawn
   without inline styles and without pushing the shell's stylesheet over its budget.

## Consequences

This answers part of an open question in `AGENTS.md`: Pibbo now remembers *which activities*
were practised and earned, on the device. The repository owner should confirm it and update
`AGENTS.md`; removing it means deleting the two keys, and the check game then always uses the
first lesson. Until journey 24 builds the grown-up area, a grown-up clears it only by clearing
the site's data in the browser. Dedicated recordings for the new lines are placeholders, as for
every activity (ADR 0008). Results are shown once and not kept on screen: the saved earned ids
have no reader yet.
