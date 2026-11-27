# 0008: Sound it out: the round, the word content and its build-time check

**Status:** Accepted (journey 4)

## Context

The Sound it out mocks were transcribed from the prototype. Their cast was "ship", a digraph
that belongs to `L2-014` (journey 14), while `L2-012` asks for three single-letter sounds. They
show the letters touched in order and Read it fast disabled until every sound is heard, where
`L2-012` #3 had blend play the remaining sounds first. The word's picture appears only after
blending, as one of three to choose from, where `L2-012` said the word is shown with its
picture. The speech bubble had no picture, there was no state for the third wrong picture, and
`L2-012` had no criterion for choosing the picture. Which words and sounds Sound Out covers, and
in what order, is not decided. No recordings of the sounds exist yet.

## Decision

1. **The mock wins, and the mocks were reconciled first** (`docs/mocks/README.md`): the
   journey-4 states draw "map" (m, a, p) with sun and cat as the other pictures; the bubble
   carries a picture (`bubble__picture`); the letter sounding is lit (`tile--sounding`); a new
   `modelled` state shows the right picture after the third wrong one.
2. **`L2-012` follows the mock**: letters are touched in order; blend is shown but not active
   until every sound is heard (#3); blending plays the sounds again back to back, then the word,
   then offers three pictures (#2); a new #5 covers choosing the picture, with wrong pictures
   following `L2-026` (hint, then the model on the third).
3. **The round is a pure state machine in `@pibbo/domain/sounds`** (`SoundOutRound`:
   `sounding`, `ready`, `blending`, `picking`, `retry`, `right`, `modelled`), with `startRound`,
   `touchLetter`, `blendPlan`, `blendDone`, `choosePicture`, `checkPicture` and `tryAgain`. It
   reuses `answerOutcome` from `@pibbo/domain/rounds`. "Closer together" is the sounds played
   back to back with no pause; a recorded stretched blend can replace it when recordings exist.
4. **Words and sounds are data** in `sound-out-content.json` in `@pibbo/domain`: each word names
   its sounds, its picture and its recording; each sound names its recording and how it is
   shown ("/m/"). The cast of the mock (map, sun, cat) is the content until a requirement
   decides the words. `tools/content/check-content.mjs` runs before `ng build`: it fails the
   build when a word lacks a picture or a recording, uses a sound with no recording, or any file
   named is missing from `public/`.
5. **The other two pictures** are other words of the content, chosen by the injected random
   source, in an order it chooses.
6. **The next round is chosen when this one starts**, and its picture and recordings are
   fetched while the child plays (`ASSET_PRELOADER` in `@pibbo/api`, `BrowserAssetPreloader` in
   `pibbo`, provided by the route). The preloader keeps at most two rounds of assets and aborts
   whatever it still fetches when the activity is left.
7. **Recordings are placeholders**, short silences under `/recordings/sounds/`,
   `/recordings/words/` and `/recordings/read/`, as for Count (ADR 0006, 0007). Everything spoken
   is also shown: the sound under each letter, the word in the question.
8. **Five rounds make one play**, as for Count; after the fifth, Next returns to Home with Read
   chosen.

## Consequences

The real recordings of each sound ("mmm", never "muh") and the word list stay open questions
for the repository owner. Journeys 13 to 17 reuse the content file and its check.
