# 0022: Spot the word: every common word in a short story, and misses that come back

**Status:** Accepted (journey 19)

## Context

The Spot the word mocks (`default`, `miss`, `correct`) draw a short story, "The cat is on the
mat. A ship is on the sea. The sun is up and the cat has a nap.", every word a 60 × 60 px
target, the word to find ("the") shown large, and one dot for each "the" in the story. A found
word stays highlighted and takes no touch; a wrong word greys for 0.4 s, "with no sound for a
miss"; once all five are found the bar shows "You found “the” 5 times!" with Next. The mock's
script also offers "is" and "a" in the same story. `L2-019` described "the" spoken with three
word choices, the other word spoken after a wrong choice, and repetition state saved on the
device. The design named `CommonWordsPage`, `WordChoiceComponent` (`pb-wordchoice`),
`RepetitionState` and a `ProgressStore`. `AGENTS.md` leaves open whether Pibbo remembers what a
child has practised.

## Decision

1. **The mock wins.** A round is the story and one common word; the child finds every one.
   `L2-019` now describes the prompt, finding, a miss, the praise and the five-round play.
2. **A found word speaks the common word**, stays highlighted (`story__word--found`), is disabled
   so a second touch never counts twice, and fills one more dot. A visually hidden status
   announces "Found “the”. 2 of 5 found." for a screen reader.
3. **A miss greys the word for 0.4 s on the injected clock and plays nothing**, as the mock
   note says; nothing found is lost. The status announces "Look for “the”. You chose “cat”."
4. **The prompt is three recordings**: "Find every", the word, "in the story."; the praise is
   "You found", the word, the number and "times", all brief, and Next is ready at once.
5. **A missed word comes back.** The page holds, at route scope, the words missed in this play.
   The next round is chosen from them first (oldest first, never the word just asked); otherwise
   by the injected random source, never the word just asked. A word missed in a round is asked
   again within the next 5 rounds. **Nothing is stored or sent**: when the child leaves, it is
   gone. Whether Pibbo remembers practice across visits stays undecided; `L2-019` #6 says so,
   and no `ProgressStore` is built.
6. **The content is data** in `@pibbo/domain/sounds/common-words-content.json`: the story's
   words as shown, the common words with their recordings, and the lines. The content check
   fails the build when a common word has no recording, does not appear in the story, or a line
   has no recording. Which words and stories Pibbo covers, and in what order, is not decided.
7. **The rules are pure functions** in `@pibbo/domain/sounds` (`SpotRound`: `finding`, `right`):
   `startSpotRound`, `touchStoryWord`, `endMiss`, `nextSpotWord`, `spotAssets`, with unit tests.
8. **The presentation is `SpotTheWord`** (`pb-spot`) in `@pibbo/components`, keeping the mock's
   `.spot`, `.spot__find`, `.target-word`, `.found`, `.story` and `.story__word` classes. Spot
   the word is listed in Read after Spell by sound (`/read/sight-words`), with "the" as its
   picture; the Home mock gained the card first.

## Consequences

Spaced repetition across visits waits for the decision on remembering practice. The recordings
are placeholders, as for every activity (ADR 0008). The story's words are touch targets of
their own, so a long story would need its own layout check.
