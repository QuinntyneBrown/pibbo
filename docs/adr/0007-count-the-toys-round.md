# 0007: Count the toys: the round, retry, praise and the timer contract

**Status:** Accepted (journey 3)

## Context

The Count the toys mocks were transcribed from the prototype. Its retry state cleared the
stamps so the child recounted from one, which contradicts `L2-002` #2 and `L2-026` #1 (nothing
is taken away; Pibbo re-counts aloud) and the purpose in `AGENTS.md`. Its toy spots overlapped
at phone widths and were smaller than 60 px, against `L2-002` #3. Its leave and replay controls
were 48 px. Its instruction was text only. There was no state for the third wrong answer
(`L2-026` #2). Which numbers Count covers is not decided.

## Decision

1. **The mocks were reconciled first** (see `docs/mocks/README.md`): the retry state keeps every
   stamp and lights each toy in turn while Pibbo counts aloud; a new `modelled` state shows the
   right numeral after the third wrong answer; toys sit one per cell of a 4 x 3 grid on the rug
   (so none overlap, and each is at least 60 px on a 320 px phone); leave and replay are 60 px;
   the speech bubble carries a picture of what is asked (a tapping hand, a question tile).
2. **The round is a pure state machine in `@pibbo/domain/counting`** (`CountRound`, with
   `startRound`, `touchThing`, `chooseNumeral`, `checkAnswer`, `recountDone`). The shared rule
   for wrong answers is in `@pibbo/domain/rounds` (`answerOutcome`: `right`, `hint`, or `model` on
   the third wrong answer). The page in `pibbo` orchestrates recordings and the praise timer; no
   separate `ROUND_FEEDBACK` service was needed yet. Later activities that share more than the
   rule can lift the page's praise handling into one.
3. **The numeral choices are three consecutive numbers that include the answer**, the answer in
   the middle unless it is 1 or the largest number, as the mock draws (6, 7, 8 for 7).
4. **The numbers a round can ask are content, not a rule**: `COUNT_THE_TOYS.numbers` holds the
   cast of the mock and `L2-001` (5 and 7) until the requirement decides the range. The random
   source picks the number, the cells and the toys.
5. **Five rounds make one play**, as the mock's progress bar draws; after the fifth, Next returns
   to Home with Count chosen. The bar shows progress only; nothing is scored.
6. **`Clock` gains `after(ms, callback)`**, returning a cancel function, so praise dismisses
   itself through the injected clock (1.5 s, `L2-026` #3); Playwright's fake clock drives it in
   specs. Praise never blocks Next.
7. **Recordings are placeholders**, short silences under `/recordings/count/` and
   `/recordings/numbers/`, as for Home (ADR 0006). Everything spoken is also shown.

## Consequences

The prototype's mock-note "Try again clears the stamps" is gone. Count's range, its order and
the real recordings stay open questions for the repository owner.
