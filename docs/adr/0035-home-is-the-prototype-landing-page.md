# 0035: Home is the prototype's landing page

**Status:** Accepted (decided by the repository owner)

## Context

Journey 2 replaced the prototype's Home (Magic Patterns frame `qWbazJPhFtQFND16jvAWTf`) with two
group pictures, Count and Read, and up to six activity pictures a screen with More (ADRs 0006,
0014), because `AGENTS.md` described Home that way and ruled out a score. Later journeys added a
Lesson picture and a check picture beside it (ADRs 0026, 0027). The repository owner asked for
Home to be the prototype's landing page again, responsive from a phone to a large desktop, with
sample data wherever it shows something about a child.

## Decision

1. **Home is drawn as the prototype draws it** (`docs/mocks/pages/home`): a top bar with the
   wordmark, the child's stars and the child's name; today's lesson card ("Hi Maya! Today's
   lesson", the lesson title, one dot a game, and "Start" or "Keep going" with Pibbo beside it);
   the "What do I know?" card; a Reading / Counting switch; and the chosen subject's activities
   in sections (Reading: Letters, Sounds into words, Words and sentences; Counting: Counting,
   Numbers), each a card with the prototype's glyph, its name and up to three stars.
2. **The child's name and stars are sample data.** `CHILD_PROFILE` in `@pibbo/api` (`ChildProfile`:
   a name and the stars per activity) is bound in `app.config.ts` to `SAMPLE_CHILD` in
   `@pibbo/domain`, the prototype's "Maya" with 26 stars. Nothing asks for a name, nothing earns
   or keeps a star, and nothing is stored or sent (ADR 0028, `L2-029` are unchanged). A real
   profile, if one is ever wanted, is a new binding and its own decision.
3. **Today's lesson shows real progress.** The dots and the button read the lesson's kept place
   (ADR 0026): the games before the current step are done. Its button speaks "Start" or "Keep
   going" and opens the lesson where the child left off.
4. **Home scrolls.** Every activity of the subject is listed; More and its screens go
   (`activityScreen`, `moreFor`, `more.wav`). Cards are laid out 2 a row on a phone, 3 from
   640 px and 5 from 1024 px, and the page stops growing at 1280 px, centred.
5. **The subjects are named Reading and Counting**, as the prototype names them, and Reading is
   chosen when Home opens. Their recordings say the same words.
6. **Kept from the rules the prototype predates:** the grown-up padlock sits in the top bar after
   the child's name, 48 px from every child target, so the cards start 48 px under the top bar,
   not 24 (ADR 0029, `L2-037` #1); every target is at least 60 × 60 px with 16 px between (the
   switch is 60 px tall, not 48, and its choices 16 px apart, not 4); nothing is spoken until
   the first touch; only activities that exist are listed, so the prototype's six Sound it out
   cards are one.

## Consequences

`AGENTS.md`'s Home bullet points here. `L2-024` is rewritten; the journey-2 departures in
`docs/mocks/README.md` are kept as history and marked superseded. Stars are drawn, not earned:
`L2-025` #4 (no score on an activity screen) is unchanged. Recordings for "Reading", "Counting",
"Start" and "Keep going" are placeholders, as every recording is (ADR 0007).
