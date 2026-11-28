# 0020: Adjacent consonants in Sound it out

**Status:** Accepted (journey 15)

## Context

`L2-015` asks that two consonants side by side ("stop" as [s][t][o][p]) are each touched and
spoken on their own, and that a question then asks for the first two sounds, with "st", "s" and
"t" to choose from. The `sound-it-out` mocks had no state for a word of four sounds, nor for the
question. The detailed design named a separate page (`AdjacentConsonantsPage`) and component
(`SoundChoiceComponent`); letter groups (ADR 0019) had already shown that Sound it out's round
carries such words with data alone. Four tiles of 80 px with their gaps do not fit one row on a
320 or 360 px phone. Spell by sound (ADR 0018) uses Sound it out's words and draws three boxes.

## Decision

1. **The mock first.** Three states were drawn: `clusters` (four tiles, s heard, t next),
   `first-two` (the question) and `first-two-retry` (both sounds modelled, choose again).
   `tiles--long` narrows each tile to 64 px below 40rem, so a four-sound word keeps one row and
   each tile stays at least 60 × 60 px. The blend bar fills in quarters for it.
2. **Inside Sound it out, not a new activity.** `adjacentConsonants(word)` in
   `@pibbo/domain/sounds` finds two single-letter consonants at the start of a word. A round for
   such a word gains a `first-two` phase after blending and before the pictures, asked once;
   `chooseFirstTwo` decides it. The design's separate page and component were not built.
3. **The choices are tiles in `pb-word-tiles`** (`.choose`, `.choose__option`), since the tile's
   styles live there. One touch chooses. "st" speaks s then t, "You heard both sounds!", then
   the picture question; s or t speaks "Listen:", s, t, "Choose again." with each tile lit, and
   all three choices stay open. The random source orders the choices.
4. **The word is the mock's cast**: stop, with the prototype's picture and placeholder
   recordings (ADR 0008 #7), plus the sound o. "frog" in the journey's goal has no picture yet.
5. **The content check** fails a word of more than four tiles and a missing recording for any
   first-two-sounds line.
6. **Spell by sound keeps to words of three sounds**, the boxes its mock draws.

## Consequences

A seeded round can now be stop, so the letter-group specs were reseeded for seven words, and the
page object's `soundAndBlend` answers the first two sounds when asked. Whether the question also
covers consonants at the end of a word ("lamp"), which clusters and words Sound Out teaches, and
their real recordings stay open questions for the repository owner.
