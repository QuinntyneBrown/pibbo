# 0032: Build a sentence: put the words on a strip, then Check

**Status:** Accepted (journey 20)

## Context

The Build a sentence mocks (`start`, `default`, `full`, `correct`, `retry`) draw a picture, an
empty strip and a bank of five word tiles: the four words of "The cat can sit." and "hat",
which does not belong. A touched tile puts its word at the end of the strip and stays in place,
used; a word on the strip goes back when touched; Check judges the sentence once the strip is
full. `L2-020` described slots that each wait for the next word, a wrong word that pulses the
slot, and no Check. No mock drew the modelled answer `L2-026` #2 requires after three wrong
answers. The reading lesson (ADR 0026) already names `build-a-sentence`.

## Decision

1. **The mock wins.** `L2-020` now describes the strip, taking a word back, Check, `correct`,
   `retry` and `model`. A touched tile still says its word (the old #3), so a child who cannot
   read hears every word before placing it.
2. **A `model` state is drawn first**: after the third wrong Check the strip shows the
   sentence in order as right, "Listen:" and the sentence are spoken, "Listen: “The cat can
   sit.”" is shown, and Next completes the round.
3. **Try again empties the strip**, as the mock's Try again leads back to `start`. Words on a
   strip are not something earned, so nothing is lost (`L2-026` #1).
4. **The tiles carry the sentence's capital and full stop** ("The", "sit."), as the mock draws
   them, so the built sentence starts with a capital letter and ends with a full stop
   (the old #4) without a rule that rewrites it. A word's recording is the word itself.
5. **The rules are a pure state machine** in `@pibbo/domain/sounds` (`SentenceRound`). The
   random source chooses the sentence, never the one just played, and the order of the tiles.
6. **The content is its own data file**, `sentences-content.json`, checked before every build:
   every sentence has a picture, a recording of the whole sentence and a recording for each
   word; its tiles are distinct; its extra word is not one of its words. Its three sentences
   (cat, sun, boat) are the mock's cast, not a decision on which sentences Pibbo covers.
   Five rounds make a play.
7. **The presentation is `SentenceBuilder`** (`pb-sentence-builder`), keeping the mock's
   `.sentence`, `.strip`, `.strip__word`, `.word-bank` and `.word-tile` classes. A used tile is
   `disabled` with "cat, used" as its name; a word on the strip is named "Take back cat" while
   it can be taken back. Build a sentence is listed last in Read, its eighth activity, on the
   second screen with Spot the word and Rhyme time.
8. **The lesson spec keeps proving `L2-022` #4.** Once Build a sentence exists, the reading
   lesson's five steps are all known. The spec for an unknown step now rewrites the lesson in
   the served script for that one test, so the lesson names an activity that does not exist;
   the shipped content stays honest.

## Consequences

Which sentences are covered, their order and the real recordings stay open; the recordings are
short silent placeholders (ADR 0008). The check game asks one question about a practised
Build a sentence (ADR 0027 asks about every activity on Home): "What comes next?" shows a
sentence without its last word and offers that word, the extra word and another sentence's
last word, written and never said. On a phone on its side (`shell--fit`, under 30 rem tall)
the shell draws no picture beside the instruction and a smaller Pibbo, as the mocks of every
fit screen do, so the instruction keeps to two lines and the strip and the words stay above
the answer bar. Measured with nothing scrolling, every word at least 60 x 60 px, clear of the
answer bar and the instruction, for all three sentences in the start, full, hint, modelled and
praise states at 320 x 568, 360 x 640, 568 x 320, 640 x 360 and 1920 x 1080. The initial
bundle grows by 0.1 kB raw (243.09 to 243.19 kB): Home's catalogue entry; the rest loads with
the activity's route.
