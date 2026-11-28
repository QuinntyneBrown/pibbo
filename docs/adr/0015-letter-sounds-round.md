# 0015: Letter sounds: a pair match of letters and their sounds

**Status:** Accepted (journey 11)

## Context

The Letter sounds mocks were transcribed from the prototype. They draw a pair match: four
letters (m, s, t, c) in one column and their four sounds in another, in a different order, each
sound written ("/t/") beside a picture of a word it begins ("as in teddy"). A touched letter is
held (`aria-pressed`); a matched pair takes the same colour and no longer takes a touch; when
all four are matched, "You know your letter sounds!" and Next. The prototype's note says a
wrong partner "gives a small shake and nothing else", but no class or state drew it. `L2-010`
asked for something else: one sound played, three letters, and the sound played again after a
wrong letter. The design named `MatchSoundsPage`, `LetterChoiceComponent` (`pb-letterchoice`)
and a content API. The content showed c's sound as "/c/"; both reading mocks show "/k/".

## Decision

1. **The mock wins.** `L2-010` now describes the pair match: a touched letter is held and says
   its sound, never its name; a touched sound says its recording; a right partner joins the two;
   a wrong one shakes, the held letter stays held and nothing is taken away. Praise comes once,
   when all four are matched, so it never interrupts the next touch.
2. **The shake is drawn** as `.pair--miss` (`--duration-slow`) with a new `miss` state; reduced
   motion removes it. The shake is not the answer, so without it the round still makes sense:
   the sound is spoken and shown, and the letter stays held.
3. **The round is a pure state machine in `@pibbo/domain/sounds`** (`LetterSoundsRound`:
   `matching`, `right`) with `startLetterSoundsRound`, `holdLetter`, `matchSound`,
   `pairColour` and `letterSoundsAssets`. The letters keep the content's order; the injected
   random source orders the sounds, never in the letters' own order.
4. **The content is data** in `letterSounds` of `sound-out-content.json`. A pair names a sound
   key from the same `sounds` table Sound it out uses, so one recording serves both, and the
   build-time check (ADR 0008) now also fails on a pair whose sound, picture or recording is
   missing. c's sound is shown "/k/".
5. **Five rounds make one play**, the same pairs reordered each round; after the fifth, Next
   returns to Home with Read chosen, as in Sound it out. The mock's Next to Sound it out is the
   prototype's cast. Letter sounds is listed in Read after Sound it out.
6. **No hint and no model after three misses.** The mock asks for nothing else on a miss, and a
   sound card already shows and says the sound; `L2-026`'s hint applies to rounds that check an
   answer.

7. **Phone layouts.** Two columns of four pairs do not fit above the answer bar on a 360 × 640
   or 640 × 360 phone; upright, the letters make one row and the sounds a second; on its side,
   all eight make one row of 60 px targets. Drawn in the mocks first.

## Consequences

Which letters Letter sounds covers, and in what order, stays open, as do the real recordings
and the consonant audit. Journey 12 (big and small letters) can reuse `Pairs`.
