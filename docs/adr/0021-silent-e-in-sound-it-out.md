# 0021: Silent e in Sound it out

**Status:** Accepted (journey 16)

## Context

`L2-016` asks that the child adds a quiet e to "cap" and sees and hears it become "cape", takes
it away again, and that a round asking for the picture of "cape" offers the cap picture. The
prototype's `magic-e` state drew "cape" with a grey, disabled e: nothing to add or take away.
The detailed design named a separate page (`SilentEPage`) and component (`SilentEWordComponent`);
letter groups (ADR 0019) and adjacent consonants (ADR 0020) had already shown that Sound it
out's round carries such words. Spell by sound (ADR 0018) uses Sound it out's words and spells
one letter per box.

## Decision

1. **The mock first.** `magic-e` was redrawn as "cap" with its picture and an e tile waiting to
   be added (`tile--silent tile--next`, `aria-pressed="false"`), and a new `magic-e-on` draws
   "cape": the e dashed and pressed (`tile--added`), the a marked with a bar (`tile--changed`,
   `tile__mark`) and the picture a cape. Neither state is told by colour alone.
2. **Inside Sound it out, not a new activity.** A silent-e word is data: the word carries the
   word it is without its e (`withoutE`), and its own sounds are what it says with the e, the
   changed vowel a sound of its own (`a_e`, shown /ā/). The round gains a `magic-e` phase before
   sounding and `eAdded`; `toggleSilentE` adds or takes away the e, speaks the word made, and
   starts the sounds afresh. It is open until blending starts. The design's separate page and
   component were not built.
3. **The e is a toggle tile in `pb-word-tiles`**; the rule and the word shown now, with its
   picture, are `pb-silent-e` (`.rule`, `.before`).
4. **The pictures are a real choice.** A silent-e round offers the picture of the word without
   its e among its three. Choosing it speaks that word, as any picture does, and a wrong Check
   is a chance to try again (`L2-026`). While the child picks, the rule and the tiles stay, the
   e added and no longer a toggle, and the word's own picture is not shown beside them: it would
   be the answer. The prototype kept the strip there.
5. **The word is the mock's cast**: cape and cap, with the prototype's pictures and placeholder
   recordings (ADR 0008 #7), plus the sound a_e and the line "Add a quiet e to the end."
6. **The content check** requires that a silent-e word is the word without it plus e, that both
   have a picture, a recording and recorded sounds, and that the instruction is recorded.
7. **Spell by sound leaves silent-e words out**: it spells one letter per box, and the quiet e
   has no sound to spell.

## Consequences

A seeded round can now be cape, so the adjacent-consonants spec follows the reseeded choice
order, and the page object's `soundAll` adds the quiet e first and reads the word with it. Which
silent-e words Sound Out teaches, in what order, and their real recordings stay open questions
for the repository owner. On screens shorter than those the specs measure (320 × 568), Sound it
out's parts overlap for every word; the responsive mocks now on `main` draw the fix, which is
not built here.
