# 0010: Which is bigger: two cards, Check and the lined-up retry

**Status:** Accepted (journey 6)

## Context

The Which is bigger mocks were transcribed from the prototype. They draw two cards, each a
numeral over a ten-frame of dots; touching a card chooses it (`aria-pressed`), and Check
confirms it. `L2-005` had the answer taken on the first touch, with no Check, and asked for the
sets to be "lined up one-to-one" with the extra things highlighted after a wrong choice; the
`retry` mock showed only "Look at the dots. Which has more?" and Try again, with nothing
highlighted. The mock's cast is 7 and 4 on one ten-frame each, while `L2-005` covers 0 to 20.

## Decision

1. **The mock wins on Check.** A touch chooses a card and speaks its number; touching the
   other card chooses it instead; Check confirms. `L2-005` #1 and #2 now say "touches 9 and
   then Check", and a new #4 covers choosing.
2. **The ten-frames are the one-to-one line-up.** Both cards fill their frames in the same
   order, so dot `i` of one sits beside dot `i` of the other. In `retry` the dots of the bigger
   set beyond the smaller number are marked `ten-frame__dot--extra`, a ring as well as a colour,
   so colour is not the only carrier. The `retry` mock was redrawn with them first.
3. **The range is the requirement's.** `L2-005` decides 0 to 20, so `startCompareRound` draws
   two different numbers from 0 to 20 and puts the bigger on the left by an even coin from the
   injected `RandomSource` (`L2-005` #3). A number above 10 is drawn as two ten-frames; 0 is one
   empty frame. The bounds are content (`WHICH_IS_BIGGER.smallest`/`largest`), not rules.
4. **The round is a pure state machine in `@pibbo/domain/counting`** (`CompareRound`:
   `choosing`, `retry`, `right`) with `startCompareRound`, `chooseCard`, `checkChoice`,
   `chooseAgain` and `extraDots`. There is no modelled answer after three wrong choices
   (`L2-026` #2): with two cards, Try again always leaves only the right one, and every wrong
   choice already shows the answer by the extra dots.
5. **Names.** The page is `WhichIsBigger` (`pb-which-is-bigger`, route `/count/compare`) and
   the presentation component is `Compare` (`pb-compare`, the `.compare` block of the mock).
   The design's `ComparePage`, `CompareSetsComponent` and `compareRules` are these.
6. **Recordings are placeholders**, short silences as in ADR 0007: "Which number is bigger?",
   "is bigger than", "Look at the dots. Which has more?" and the activity's name on Home. The
   comparison is spoken as three recordings: the bigger number, "is bigger than", the smaller.
   Five rounds make one play. The speech bubble carries the question picture, as on the other
   Count screens.

## Consequences

A spec reaches 6 and 9 through the `seed` fixture option (ADR 0009). If the owner narrows the
range, only the content changes.
