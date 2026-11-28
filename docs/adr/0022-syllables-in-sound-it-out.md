# 0022: Longer words by syllable in Sound it out

**Status:** Accepted (journey 17)

## Context

`L2-017` asks that the child reads "sunset" shown as [sun][set] one syllable at a time, then
blends the whole word. The `syllables` mock is a Sound it out state: two wide tiles captioned
"clap 1" and "clap 2", the rule "sun · set Read one beat at a time", the instruction
`Tap “set” and clap it.` and Read it fast. The mock's script then goes on to `pick`, so the child
chooses the word's picture from three as for any word. The requirement said only that blending
highlights the picture, and the detailed design named a separate page (`SyllablePage`) and
component (`ChunkedWordComponent`). Silent e (ADR 0021), letter groups (ADR 0019) and adjacent
consonants (ADR 0020) are all carried by Sound it out's one round.

## Decision

1. **The mock first.** `syllables` gained the bubble's picture of what is asked (`L2-025`), and
   its script shows the round as it opens (`?begin=1`) and moves the instruction to the next
   syllable.
2. **`L2-017` follows the mock.** Blending speaks the syllables and the word and offers three
   pictures; the word's picture is highlighted once it is chosen and checked (as ADR 0008 did
   for `L2-012`).
3. **Inside Sound it out, not a new activity.** A longer word is data: it carries its
   `syllables`, each with the sounds that spell it and its own recording. The round has one tile
   per syllable. The design's separate page and component were not built.
4. **A touch sounds the syllable out and blends it**: each of its sounds, back to back, then the
   syllable, with the whole tile lit. The tile counts as read on the touch, as a letter does, and
   a newer sound cuts the plan short (`L2-012` #4). The mock lights no letter inside a tile, so
   none is lit.
5. **The instruction names the next syllable** and is spoken as it is shown: "Tap", the
   syllable, "and clap it". Pibbo asks for the next one only after the last one has finished,
   never over it. Once both are read the instruction is Sound it out's own for blending.
6. **Blending a longer word speaks its syllables, not its single sounds**, each tile lit, then
   the word.
7. **`pb-word-tiles` draws the syllable tiles** from the same inputs as sounds (the syllable on
   the tile, "clap N" beneath). The rule line is a new `pb-rule`, which `pb-silent-e` now uses.
8. **The word is the mock's cast**: sunset, with the mock's picture and placeholder recordings
   (ADR 0008 #7), plus the sound e, the syllable "set" and the two instruction lines.
9. **The content check** requires that a longer word's syllables spell it, that there are two to
   four of them, and that each has a recording and recorded sounds.
10. **Spell by sound leaves longer words out** (it has three boxes), though the sound e joins the
    letters its bank draws from.
11. **A longer word's round uses the mocks' short-screen layout.** With the shared layout, Read
    it fast fell behind the answer bar at 320 × 640 and 640 × 360, where a child could not
    touch it. `pb-round-shell` gained `fit` (`shell--fit`): a smaller prompt on a short upright
    phone, and on its side the prompt beside the way out, with the syllables beside Read it fast
    or the pictures. Only longer words turn it on, so no other screen changes.

## Consequences

A ninth word moves what a seeded round shows, so the specs that need a particular word use new
seeds. Which longer words and syllables Sound Out teaches, in what order, whether a letter should
light inside a syllable tile as it sounds, and the real recordings stay open questions for the
repository owner. The same overlap exists for ordinary words ("boat" at 320 × 640 and
640 × 360), which this journey leaves unchanged; journey 26, or a fix of its own, should draw
them the same way.
