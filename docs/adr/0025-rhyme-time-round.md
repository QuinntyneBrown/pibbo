# 0025: Rhyme time: choose every rhyme, then Check

**Status:** Accepted (journey 21)

## Context

The Rhyme time mocks (`start`, `default`, `all-chosen`, `correct`, `retry`) draw "cat" with its
ending marked and four cards (hat, sun, bat, map). More than one card can be chosen, a touch on
a chosen card unchooses it, and Check judges the choice. `L2-021` offered three choices and
judged a single touch. No mock drew the modelled answer `L2-026` #2 requires after three wrong
answers. 
## Decision

1. **The mock wins.** `L2-021` now describes the four cards, choosing, Check, `correct` and
   `retry`. A touched card still says the pair ("cat, hat"), the intent of the earlier criteria:
   a child who cannot read hears each rhyme.
2. **A `model` state is drawn first**: after the third wrong Check the rhymes show as right,
   "Listen: cat, hat, bat — they all end in “at”." is spoken and shown, and Next completes the
   round.
3. **Try again clears the choice**, as the mock's Try again leads back to `start`. A choice is
   not something earned, so nothing is lost (`L2-026` #1).
4. **The rules are a pure state machine** in `@pibbo/domain/sounds` (`RhymeRound`). The random
   source chooses the round, never the one just played, and the order of its cards.
5. **The content is its own data file**, `rhymes-content.json`, checked before every build. It
   loads with the activity's lazy route. Each round carries its own lines, because "c-at" and
   "they all end in “at”" cannot be joined from other recordings. Its two rounds (cat and map)
   use the mock's pictures; they are a cast, not a decision on which rhymes Pibbo covers.
6. **The presentation is `RhymeCards`** (`pb-rhyme-cards`), keeping the mock's `.rhyme-target`
   and `.word-card` classes; a chosen card is `aria-pressed`. Rhyme time is listed in Read after
   Spell by sound. Five rounds make a play.

## Consequences

Which rhymes are covered, their order and the real recordings stay open; the recordings are
short silent placeholders (ADR 0008).
