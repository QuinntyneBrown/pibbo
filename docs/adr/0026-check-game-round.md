# 0026: What do I know?: five or more mixed questions, the normal retry, and earned pictures

**Status:** Accepted (journey 23)

## Context

The prototype's progress check (`docs/mocks/pages/progress-check`) asked four fixed questions
(a word for the ship picture with near misses "sip" and "hip", how many ducks, a rhyme, the
bigger numeral). A wrong answer moved on ("Good try! On to the next one."), and the results
named the child, gave every game 0 to 3 stars and suggested what to try next. `L2-023` asks for
5 to 8 mixed rounds from what the child has practised, the normal retry rule (`L2-026`), only
skills answered correctly as earned pictures with no score or count of misses, and results kept
on the device. The design named `CheckGamePage`, `EarnedPicturesComponent`, `checkRules` and a
`ProgressStore`; it said each round reuses the activity's own component. ADR 0025 decided that
practice is kept on the device.

## Decision

1. **The mocks were redrawn first**, to `AGENTS.md` and `L2-023`: five questions
   (`Question 1 of 5`), a `retry` that gives a hint and keeps the choice, a new `modelled`
   state, `results` with earned pictures only and the new `results-empty`, and the check card on
   Home (`.home__check`). `L2-023` gained #5 and #6 for what the mocks draw.
2. **A round is one question about one skill**, not the activity's own screen: a skill is an
   activity in the catalogue, and its kind (`count` or `word`) comes from its group. A `count`
   question shows one thing several times and asks how many, with three numerals; a `word`
   question shows one word's picture and asks which word goes with it, with three words that
   each have a picture and a recording. Reusing every activity's component inside the check is
   left out: it would load every activity's code for one game, against *Lazy loading*.
3. **Which skills, and how many.** The skills are the practised activities that are still in
   the catalogue; with none, the first lesson's activities that exist (ADR 0025). The game has
   as many rounds as skills, but at least 5 and at most 8. The skills are shuffled by the
   injected random source and taken in turn, starting again when they run out, so two skills
   alternate. The numbers, things and words come from the content, also by the random source.
4. **Each choice is spoken when touched and selected**; Check judges it with `answerOutcome`
   (`L2-026`). Right: "Yes!", brief, and Next is ready at once. Wrong: Pibbo's hint is shown
   and spoken, then, for a word, the sounds of the picture's word, and for a count, the numbers
   up to the answer; the choice stays chosen and Check is ready again. The third wrong answer
   shows the right choice with a tick, says it ("This is" and the word, or "There are" and the
   number), and Next goes on.
5. **A skill is earned** when one of its rounds was answered right before the answer was
   modelled. Results list the earned skills under Reading and Counting in catalogue order, each
   a row with its glyph, its name and a tick, spoken when touched. With none earned, "Well
   played!" is shown and spoken, and nothing is marked. There is no score, star, percentage,
   red mark or count of misses, and no name.
6. **Saved on the device only.** When results show, the earned skills are written to the store
   (`pibbo:check`, `{ version: 1, earned: [...] }`) and nothing else; misses are never stored.
   Clear progress erases it (journey 24). Nothing reads it back yet.
7. **The rules are pure functions** in `@pibbo/domain/lessons`: `LESSONS`, `firstLessonSkills`,
   `checkSkills`, `startCheck`, `chooseCheckOption`, `checkCheckAnswer`, `nextCheckRound`,
   `earnedSkills`, `checkAssets`, the guards `isPracticeHistory` and `isCheckResult`, and
   `notePractised`, with unit tests. The content (`check-content.ts`) is data, checked at build:
   every prompt, hint and praise has a recording, every thing a picture.
8. **The page is `CheckGame`** (`pb-check-game`, lazy route `/check`) in the app; the
   presentation is `CheckQuestion` (`pb-check-question`: `.stage--question`, `.show`, `.pick`,
   `.pick__option--text`) and `EarnedPictures` (`pb-earned-pictures`: `.results`, `.skills`,
   `.skills__row`) in `@pibbo/components`, keeping the mocks' classes. Home shows the check card
   (`pb-check-card`, `.check-card`) under the group pictures at all times; touching it says
   "What do I know?" and opens the game. Leave goes back to Home.

## Consequences

The check asks the same two kinds of question for every activity in a group; a question per
activity (a letter's sound, a rhyme) can come when the content for it is decided. Which numbers,
things and words a check asks stays content. The guided lesson screen (journey 22) will also
read `LESSONS`. The recordings are placeholders, as for every activity (ADR 0008).
