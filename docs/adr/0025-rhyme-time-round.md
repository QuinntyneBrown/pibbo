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
   and `.word-card` classes; a chosen card is `aria-pressed`. Rhyme time is listed last in Read,
   its seventh activity, so Read shows five and More (`L2-024` #7); the Home mock draws the
   card and the second screen (`home/reading-more`). Five rounds make a play.
7. **The smallest phones keep the round in view.** The shell's `fit` sets `--pibbo-size`, which
   `pb-pibbo` reads, so on a small upright phone Pibbo is 44 px as the mock draws it and the
   instruction keeps its width. On a screen under 36 rem tall the cards' pictures and words are
   a little smaller, so a four-line instruction ("map") still leaves two rows of cards above
   the bar. The answer bar's `fit` also holds on a phone on its side: Next and Try again are
   narrow and never wrap, so the praise is one line and the word is not pushed under the
   instruction.

## Consequences

Which rhymes are covered, their order and the real recordings stay open; the recordings are
short silent placeholders (ADR 0008). Measured with nothing scrolling, every card at least
60 × 60 px and above the answer bar, and the word clear of the instruction, on 320 × 568,
320 × 640, 360 × 640, 640 × 360 and 568 × 320, for both words, in the choosing, hint, modelled
and praise states.
