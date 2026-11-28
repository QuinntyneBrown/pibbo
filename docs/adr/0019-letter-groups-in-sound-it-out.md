# 0019: Letter groups in Sound it out

**Status:** Accepted (journey 14)

## Context

`L2-014` asks that a group of letters that makes one sound (sh, igh, oa and the like) is one
joined tile that plays one recording, and that a word with such a group is sounded out and
blended one sound per tile. The `sound-it-out` mocks had no state for it; the design said a
word's `sounds` list already carries one unit per sound, and `pb-word-tiles` already widened a
tile whose `letters` hold more than one letter (`tile--wide`). Spell by sound (ADR 0018) uses
Sound it out's words and offers only single letters in its bank. Which groups and words Sound
Out teaches, and in what order, is not decided.

## Decision

1. **The mock first.** A new `groups` state draws "ship" as [sh][i][p], with [sh] one wide
   tile, heard, and "i" next. The default mock's description, which named "ship" while drawing
   "map", was corrected.
2. **A letter group is a sound in the content data**, keyed and recorded like any other sound:
   `sh`, `igh` and `oa` with their own recordings (`/recordings/sounds/sh.wav`) and how each is
   shown (`/sh/`, `/ī/`, `/ō/`). `isLetterGroup` in `@pibbo/domain/sounds` names the rule (more
   than one letter). The round, the blend and the tiles need no other change.
3. **The words are the mock's cast**: ship, night and boat join map, sun and cat, with the
   prototype's pictures and placeholder recordings (ADR 0008 #7). That is not a decision on
   which words Sound Out teaches.
4. **The content check** (`tools/content/check-content.mjs`) already fails a word whose sound
   has no recording and a word whose sounds do not spell it; it now also fails a tile of more
   than three letters.
5. **Spell by sound keeps to words of single letters.** A word with a letter group is left out
   of its rounds, since its bank has one letter per box; spelling with groups waits for its own
   requirement.

## Consequences

A random round may now be a word with a letter group, so the Sound it out specs read each
tile's letters rather than one letter per character. The real recordings of each group and
the list of groups stay open questions for the repository owner.
