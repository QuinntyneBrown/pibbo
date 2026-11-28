# 0011: Rocket countdown: three choices, the track and the rocket

**Status:** Accepted (journey 7)

## Context

The Rocket countdown mocks were transcribed from the prototype. They draw a *track* of the
numbers already said (`.track-row`, the current one `--now`, the rest a dot), three numeral
choices for the next number down, and a rocket that rises one notch per number. A wrong choice
shows "Going down from 6… try again." with Try again, the choices disabled; nothing is
highlighted. `L2-006` #3 had the child touch numbers on a number track and, after a wrong
touch, the expected number highlighted and spoken. The design named `CountBackwardPage`,
`NumberTrackComponent` and `backwardRules`.

## Decision

1. **The mock wins.** The child chooses among three numerals; the track shows what has been
   said and is not touched. A wrong choice says and shows "Going down from 7… try again.", the
   choices wait for Try again, nothing advances and the child continues from 7. `L2-006` #2 and
   #3 were brought in line.
2. **The choices.** The next number down, the number one above the current one, and the number
   below the next one (two above the current when that would be below 0), in an order from the
   injected `RandomSource`. The mock's 8, 11, 9 at 10 and 5, 4, 7 at 6 follow this rule.
3. **The range is the requirement's.** The start is drawn from 5 to 20 (`L2-006`), content
   (`ROCKET_COUNTDOWN.smallest`/`largest`), not a rule.
4. **The round is a pure state machine in `@pibbo/domain/counting`** (`CountdownRound`:
   `counting`, `retry`, `done`) with `startCountdownRound`, `chooseNext` and `countAgain`.
   There is no modelled answer after three wrong choices: Try again returns to the same three
   choices and the retry line already names the number to go down from (as ADR 0010 #4).
5. **The rocket.** It rises in tenths of the way from start to 0
   (`launch__rocket--0` to `--10`, 15 px each, the mock's `--4` and `--10`) and blasts off
   (`--off`) at 0. Under reduced motion it stays on the pad; the track and the words carry the
   count.
6. **Names.** The page is `RocketCountdown` (`pb-rocket-countdown`, route `/count/countdown`)
   and the presentation component is `Countdown` (`pb-countdown`, the `.countdown` block).
7. **Recordings are placeholders**, short silences as in ADR 0007: "What comes next going
   down?", "Going down from", "try again", "Blast off!" and the activity's name on Home. The
   start is spoken as its number and the question; each right choice as its number; 0 as "zero"
   and "Blast off!", the praise. Five rounds make one play.

## Consequences

A spec reaches start 10 with the `seed` fixture option 24 (ADR 0009).
