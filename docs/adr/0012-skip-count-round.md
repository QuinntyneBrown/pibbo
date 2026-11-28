# 0012: Skip-count: the number line, three choices and the step switch

**Status:** Accepted (journey 8)

## Context

The Skip-count mocks were transcribed from the prototype. They draw a *number line* from 0 with
a hop to each number already said and a `?` at the next, three numeral choices for where the
next hop lands, and a switch of By 2s, By 5s and By 10s that starts the line again from 0. A
wrong choice shows "Count on 5 more from 20." with Try again, the choices disabled. `L2-007`
had the child touch groups of things and, after a wrong prediction, the next group shown and
counted on aloud. The design named `SkipCountPage`, `GroupedSetComponent` (`pb-groupedset`)
and `skipRules`. The prototype's switch was 44 px tall, 4 px apart, colour only.

## Decision

1. **The mock wins.** The hops are the groups: the child chooses where each hop lands from
   three numerals, and each right choice is spoken and drawn on the line. A wrong choice says
   and shows "Count on 5 more from 10.", the choices wait for Try again, nothing advances and
   the child chooses again. `L2-007` #1 and #4 were brought in line.
2. **The switch is redrawn** (`.switch--step`): 64 px targets 16 px apart, the chosen step
   ticked, so it keeps `AGENTS.md`'s 60 px rule and colour is not its only carrier.
3. **The choices.** The next landing, one below it, and one step beyond it, in an order from
   the injected `RandomSource`. The mock's 5, 4, 10 at 0, 25, 24, 30 at 20 and 7, 10, 8 at 6
   follow this rule.
4. **The steps and the end are the requirement's.** 2, 5 and 10; a line has ten hops, so it
   ends at 20, 50 and 100 (`SKIP_COUNT.steps`, `hops`): content, not a rule. Each round's step
   comes from the random source; touching another step on the switch starts the line again
   from 0 with that step and does not count as a round.
5. **The round is a pure state machine in `@pibbo/domain/counting`** (`SkipRound`:
   `counting`, `retry`, `done`) with `startSkipRound`, `skipBy`, `chooseLanding` and
   `hopAgain`. There is no modelled answer: the retry line names how far to hop (ADR 0011 #4).
6. **Names.** The page is `SkipCount` (`pb-skip-count`, route `/count/skip`) and the
   presentation component is `NumberLine` (`pb-number-line`): the switch, the `.number-line`
   and the choices.
7. **Recordings are placeholders**, short silences as in ADR 0007: "Hop by 2s / 5s / 10s",
   "Where do we land next?", "Count on", "more from", "Hop, hop, hop — all the way to", "You
   counted by 2s / 5s / 10s to", the numbers 25 to 100 that a line reaches, and the activity's
   name on Home. Five rounds make one play.

## Consequences

The 34-unit labels of the mock grew to 44 so a phone can read them. A spec reaches a round of
fives with the `seed` fixture option.
