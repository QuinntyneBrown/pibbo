# 0009: Count and write: ten-frames, the digit pad and the round

**Status:** Accepted (journey 5)

## Context

The Count and write mocks were transcribed from the prototype. They drew a number track (1 to
20, tap the next number) and a handwriting pad the child traces "14" on with a finger, then
Check. Tracing is a precise drag, which `AGENTS.md` (*Touch is a tap*) and `L2-004` forbid, and
there were no things to count, where `L2-003` asks for rounds of 11 to 20 things in ten-frames.
`L2-004` had the answer accepted as the digits are touched, with no Check, while the mock has
Check. There was no state for a wrong numeral or for the third wrong answer (`L2-026`). Which
numbers Count covers is not decided.

## Decision

1. **The mocks were reconciled first** (`docs/mocks/README.md`): six states (`counting`,
   `default`, `written`, `hint`, `correct`, `modelled`) draw 14 toys in two ten-frames, then a
   digit pad with two boxes, Clear and Check. The prototype's track and tracing pad are gone.
2. **`L2-004` follows the mock**: the child touches digits, then Check (#1 to #3); each digit is
   spoken and shown in the next box, and Clear empties the boxes (new #5). A third digit is
   ignored (#4). A wrong numeral clears the boxes and Pibbo lights each right digit in turn,
   saying it, before the child writes again (#2); the third wrong answer is modelled (`L2-026`).
3. **The round is a pure state machine in `@pibbo/domain/counting`** (`CountAndWriteRound`:
   `counting`, `writing`, `hinting`, `right`, `modelled`) with `startCountAndWriteRound`,
   `countThing`, `writeDigit`, `clearDigits`, `checkNumeral` and `hintDone`. `tenFrames(n)`
   lays the things out: they fill each ten-frame in order, as ten-frames are taught. It reuses
   `answerOutcome` from `@pibbo/domain/rounds`. The design's `NumeralEntry` and `numeralRules`
   are this round; no `ROUND_FEEDBACK` service was needed (as in ADR 0007).
4. **The numbers are content**: `COUNT_AND_WRITE.numbers` holds the cast of the mock and of
   `L2-004` (14 and 7) until the requirement decides the range. Five rounds make one play.
5. **Targets are 60 px with 6 px between them** in a ten-frame and on the digit pad, not the
   16 px of Home (`L2-024`): five 60 px targets and their gaps must fit a 360 px phone. Targets
   never overlap and each is at least 60 x 60 px. On a tablet or desktop they grow to 80 px.
6. **Once counted, the ten-frames shrink** (`tenframes--small`) and take no touches, so the
   digit pad fits the same screen with no scrolling; one thing is asked at a time.
7. **Recordings are placeholders**, short silences as in ADR 0007: the numbers 0 and 11 to 20,
   "Write how many.", "Watch me write it." and the activity's name on Home.
8. **The e2e fixture gains a `seed` option**, so a spec can ask for the round it needs (14 or
   7) without a test hook in the bundle.

## Consequences

The prototype's tracing practice is not built. If forming numerals by hand is wanted later, it
needs a requirement that keeps to *Touch is a tap*. Count's range and the real recordings stay
open questions for the repository owner.
