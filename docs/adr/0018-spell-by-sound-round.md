# 0018: Spell by sound: boxes, a letter bank and Check

**Status:** Accepted (journey 13)

## Context

The Spell by sound mocks (`default`, `full`, `correct`, `retry`) draw "sun" with its picture,
three boxes, each with a speaker under it, and a bank of six letters (m, u, s, t, n, a). A
touched letter fills the next box; a filled box is labelled "Remove s"; Check is ready only when
every box is filled. `correct` shows the boxes right and "s – u – n. You spelled “sun”!" with
Next; `retry` shows s, u, m with "Say it slowly. Which sound doesn’t match?" and Try again.
`L2-013` said a wrong letter never fills its slot and the expected sound is spoken again, and
had no Check, no speaker and no removal. The design named `SpellPage`, `SpellSlotsComponent`
(`pb-spellslots`), `SpellRound` and `spellRules`. The mock's speaker is 40 px, under the 60 px a
child's target needs.

## Decision

1. **The mock wins.** `L2-013` now describes the boxes, the bank, the speakers, removal, Check,
   `correct` and `retry`. Any letter fills the next box; the child checks the whole word.
2. **A box's speaker is 60 × 60 px** (`--target-child`), redrawn in the mock CSS first: AGENTS.md
   sets the smallest target, and the mock is brought in line rather than the rule broken.
3. **Try again takes out only the letters that do not match**; the right ones stay, so nothing
   the child got right is lost, and the first empty box is next. The mocks draw no modelled
   state, so after any number of wrong checks the child tries again; with the right letters
   kept, every Try again brings the word closer. Whether Spell by sound models the word after
   the third wrong check (`L2-026` #2) is an open question until a mock draws it.
4. **The rules are a pure state machine** in `@pibbo/domain/sounds` (`SpellRound`: `spelling`,
   `full`, `retry`, `right`), with `startSpellRound`, `placeLetter`, `removeLetter`,
   `checkSpelling`, `trySpellingAgain` and `spellAssets`.
5. **The word content is Sound it out's** (`SOUND_OUT.words`, ADR 0008): the word, its sounds,
   picture and recording. The bank is the word's letters and other letters from the same sounds
   table, up to six, ordered by the injected random source. The content check already covers
   every word and sound; Spell by sound adds its own instructions and recordings in `spell` of
   `sound-out-content.json`, which the check covers too.
6. **The presentation is `SpellBoxes`** (`pb-spell-boxes`) in `@pibbo/components`, keeping the
   mock's `.spell`, `.boxes`, `.box`, `.bank` classes. A right check speaks each sound, then the
   word, then shows the praise; five rounds make a play, and after the fifth Next returns to
   Home with Read chosen. Spell by sound is listed in Read after Big and small letters.

## Consequences

Which words Spell by sound asks, the real recordings and the modelled answer stay open. A word
that repeats a letter works, because the bank's letters stay touchable after use.
