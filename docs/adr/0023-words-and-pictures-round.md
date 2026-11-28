# 0023: Words and pictures: a pair match of words and their pictures

**Status:** Accepted (journey 18)

## Context

The Words and pictures mocks draw a pair match, as Letter sounds (ADR 0015) and Big and small
letters (ADR 0017) do: four words on one theme ("By the sea": boat, ship, sun, sunset) in one
column and their four pictures in another, in a different order. "By the sea! Read a word, then
tap its picture." A touched word is held; a matched pair takes the same colour and corner shape
and no longer takes a touch; when every pair is matched, "You read all the by the sea words!"
and Next. The board carries `data-release-on-miss`: after a wrong picture the held word is let
go, where Letter sounds keeps its letter held. Only the default and correct states were drawn,
Home had no Words and pictures card, and the manifest named no requirement.

`L2-018` asked for three words, said a wrong pair "speaks both", and asked that a word's letters,
when touched, sound out as in `L2-012`. The mock draws each word as one target, not as letter
tiles. The design named `WordPicturePage`, `PairingBoardComponent` (`pb-pairingboard`),
`PairingRound` and `pairingRules`, and a `RoundFeedback` service that does not exist.

## Decision

1. **The mock wins.** `L2-018` now describes the pair match: two to four pairs (the mock draws
   four), words in the content's order, pictures in an order the random source chooses and never
   the words' own order. A wrong picture speaks the held word and the picture's word, shakes the
   picture once (none with reduced motion) and lets the word go, as `data-release-on-miss` draws;
   nothing is taken away. The `held` and `miss` states are drawn, and Home lists Words and
   pictures in Read after Spell by sound.
2. **A word sounds out when it is touched.** The mock draws no letter targets, so `L2-018` #2
   holds on the word itself: touching it holds it and speaks its sounds in turn, the same sound
   recordings as `L2-012`, never the letters' names. The word itself is spoken when its picture
   is joined, so the child blends before Pibbo says it. A picture touched with no word held
   speaks its word, so every picture shown is also said.
3. **The rules are their own small state machine**, `WordPicturesRound` with `matching` and
   `right`, in `@pibbo/domain/sounds`. Letter sounds' `matchSound` keeps its letter held after a
   miss, speaks one recording a touch and keys pairs by sound; here a miss lets the word go,
   holding speaks a sequence and pairs are keyed by word. Making the letter rules generic over
   all three would cost more than the hundred lines it saves.
4. **The presentation is a new component**, `WordPictures` (`pb-word-pictures`), drawing the
   mock's `.pairs.pairs--pictures` with `.pair--tall` and `.pair__word`. `Pairs` keeps its two
   kinds: its stylesheet is near the 4 kB component budget and the picture board's sizing (the
   game area as a size container, one row on a phone on its side) is its own. Matched pairs share
   colour and corner shape, and "matched" in their names, so colour is never the only sign.
5. **Content is data.** `wordPictures` in `sound-out-content.json` names themes, each with its
   words (by name, from Sound it out's `words`, so every word has its picture, recording and
   recorded sounds), its instruction and its praise, both naming the theme. The build-time
   content check covers it. The one theme is the mock's "by the sea" with boat, ship and sun;
   sunset, which journey 17 added as a two-syllable word while this one was built, can join it as
   a content change. Each round chooses a theme with
   the random source; five rounds make a play, and after the fifth Next returns to Home with
   Read chosen. The mock's Next to Spot the word is the prototype's cast.
6. **The board fits every phone.** Each target is at least 60 × 60 px and rows share the game
   area's height. The page asks `RoundShell` for `shell--fit` (ADR 0022), the mock's rules for
   small screens: on a small upright phone the bubble gives way, so at 320 px wide the
   instruction keeps a readable column (it had collapsed to 48 px), and on a phone on its side the
   ask stands beside the progress bar. At 568 × 320 that still leaves 117 px for the board, too
   little for the mock's two rows of 60 px, so on its side the words take the left half of one
   row and their pictures the right, as Letter sounds does (ADR 0015). Measured at 320 × 568,
   320 × 640, 360 × 640, 568 × 320, 640 × 360, 768 × 1024, 1280 × 720 and 1920 × 1080, with and
   without the praise bar.

## Consequences

Which themes and words the activity covers, how many pairs a round shows and in what order the
themes come stay open, as do the real recordings. A theme of two to four words is all the layout
holds; the content check refuses more.
