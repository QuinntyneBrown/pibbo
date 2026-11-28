# Pibbo mocks

Static HTML mocks for every screen of the Magic Patterns prototype, in every state the
prototype draws. Open [index.html](index.html) from disk to browse them. They need no
network: the fonts and pictures are in `assets/`.

**Source.** The Magic Patterns (MagicOS) project "Pibbo Early Learning App"
(`eDDkMMZM4QuKmuCTaj4fkB`): the "Pibbo App" prototype (`kEXWdPBhS1LJVpJoSCC6YH`), its 19
frames and the "Pibbo Brand" prototype. Each screen in `manifest.json` names its
`prototype_frame`. These mocks were transcribed from the prototype as it stands, at the
repository owner's direction, without reconciling it with `AGENTS.md` (see *Open questions*).

The [Magic Patterns alignment log](alignment-log.md) records each verified change by mock state and prototype reference.

## Opening the mocks

- On a state page, scroll past the mock to reach its design note and review toolbar. At phone widths, the state pills wrap so every label stays visible.
- On phones and portrait tablets, gallery previews use the device viewport. Rotate the device to review the landscape phone layout.
- In the gallery, focus or hover over a state pill to preview that state. The selected pill uses the same subject colour as the open mock and has an underline. Press Enter or tap the pill to open the full page. To keep a state in view, select **Preview states in gallery** and activate a pill. The gallery address now bookmarks that preview. Back and Forward revisit the states you selected. In this mode, moving the pointer or tabbing to another pill keeps the selected preview in place until you activate a pill. **Open mock** opens that preview in the current theme. All mocks returns to that same pill and preview, with the current theme. The Change log link in the gallery header opens the documented changes.
- The gallery and mock pages follow the browser’s color scheme until you choose a theme. A theme in the URL takes precedence over the saved choice. Changing the theme updates the URL so reloading or sharing a state preserves its appearance. Use the theme button, or press `t` while keyboard focus is in the review toolbar. Holding the key switches the theme once. Opening a toolbar state pill with Enter focuses the current pill on the destination page so you can continue through adjacent states.
- The × button hides the review toolbar and notes and takes you to the top of the mock. Use browser Back or press Escape to return to the toolbar with the round intact. Open a file with `?chrome=0` to start in preview mode.
- Home’s group pictures switch the visible activities. Count the toys, Which is bigger and Sound it out let a reviewer change the selected answer and check it. For Which is bigger, open [the right card selected](pages/which-is-bigger/default.html?picked=right) or set `picked` to `left` or `none` on either editable state.
- Spell by sound, Rhyme time and Build a sentence let you build an answer, change it, and check it. On short landscape phones, Spell by sound puts the picture, sound boxes and six-letter bank side by side so the answer button stays visible. Spell by sound also includes the [map](pages/spell-by-sound/default.html?word=map) and [cat](pages/spell-by-sound/default.html?word=cat) examples from the frame. Each has its own picture and letter bank. Build a sentence includes the [sun](pages/build-a-sentence/start.html?sentence=sun) and [boat](pages/build-a-sentence/start.html?sentence=boat) examples. Add `placed=0` through `placed=5` to an editable sentence URL to preview how many words are already on the strip, as in [the boat with three words placed](pages/build-a-sentence/default.html?sentence=boat&placed=3). Each sample has four words, so both 4 and 5 show the complete sentence. Spot the word includes [is](pages/spot-the-word/default.html?target=is) and [a](pages/spot-the-word/default.html?target=a) as well as the illustrated “the”. It highlights each target you find and opens the completion screen after the last one.
- Games opened from Home return to the same group. Opening Sound it out, Big and small letters or Count and write from Home starts a fresh round. Opening a state directly shows its illustrated example.
- In a guided lesson, Leave returns to the current step. Finish the game and choose Next to unlock the following step. The second reading game uses “map” and the third introduces “sh” in “ship”.
- Sound it out previews map, ship, boat, cape and sunset. Touch the remaining parts, choose Read it fast, and select a picture. On cape, touch the e to add the quiet e or take it away. The quiet e and the syllable captions stay visible when choosing a picture.
- A longer word is read one clap (syllable) at a time: open [sunset as the round opens](pages/sound-it-out/syllables.html?begin=1), touch sun and set, choose Read it fast, and pick the picture.
- What do I know? runs through the ship, duck, rhyme and numeral questions. Feedback keeps the selected answer visible and the fourth question leads to Results. Choose Try it to practise the “oa” sound in “boat”.
- In Count and write, touch the remaining toys, enter the total, and choose Check. Clear empties both boxes. A wrong answer demonstrates the digits in order.
- Add together lets Star and Moon add or remove ducks in turn. Done passes the pond to the next player, then opens the total choices. A wrong answer highlights each duck before the players choose again.
- Counting dance previews the beat visually. Start or resume to advance the chant, pause to hold a number, and choose Slow or Fast to change tempo. The playing frame opens at beat five for inspection. Set `beat` from 0 through 10 and `tempo` to slow or fast to inspect a specific moment, such as [beat seven at fast tempo](pages/counting-dance/playing.html?beat=7&tempo=fast).
- Progress Check keeps the selected answer when a question is reloaded. To review a specific choice, open [the bat selected for the rhyme question](pages/progress-check/answered.html?choice=1#question=3).
- Rocket countdown moves one notch per correct answer. Reloading resumes at the displayed number. Opening [a countdown at zero](pages/rocket-countdown/default.html#from=17&at=0) shows the completed track and launch. Short launch pads use smaller notches so the rocket stays visible until zero. Skip-count draws each hop and lets you restart the line by choosing a step size. Its address keeps the step and hop on reload. To review them separately, open [four hops by tens](pages/skip-count/default.html#by=10) or [nine hops at the illustrated step size](pages/skip-count/default.html#hops=9). Both keep your place when you try again.
- In Letter sounds, Big and small letters and Words and pictures, choose one card from each column. Matched pairs keep their colour and corner shape as you finish the round. Reloading a partially matched board restores each completed pair in the order you found it.
- Each Check, Next and Try again button links to the state it leads to, so you can click
  through a game the way a child would play it.

## Cast and catalog

The sample data comes from the prototype's `journeys.ts`, `pictures.ts` and each frame's
args. It is the cast, not a set of rules.

- **Child:** Maya. **Grown-up:** Dad (Add together).
- **Stars:** 26 in total across the 21 games, as shown on Home and on the progress check results.
- **Today's lessons:** Reading, "Sounds that team up" (letter sounds, sound it out, two
  letters one sound, rhyme time, build a sentence), 2 of 5 done. Counting, "Numbers up and
  down" (count the toys, count and write, which is bigger, rocket countdown, counting
  dance), 1 of 5 done.
- **Pictures:** teddy, duck, ball, map, sun, ship, stop, cap, cape, boat, night, sunset,
  cat, hat, bat (`assets/pictures/`, downloaded from the prototype).
- **Words:** map, ship, stop, cape, boat, night, sunset (Sound it out); sun (Spell by
  sound); cat with hat, bat, sun, map (Rhyme time); "The cat can sit." (Build a sentence);
  the story "The cat is on the mat. A ship is on the sea. The sun is up and the cat has a
  nap." (Spot the word).
- Open the [stop example](pages/sound-it-out/default.html?begin=1&word=stop) for four separate sounds, with the first two said quickly.
- Open the [night example](pages/sound-it-out/default.html?begin=1&word=night) to see the three-letter unit and follow it through blending, picture choice and feedback. The static mock displays the sound labels.
- **Numbers:** 7 toys; 14 to write; 7 against 4; countdown from 10; skip-count by 5s to
  50; 3 + 4; dance to 10.

## How the mocks were made

`assets/tokens.css` holds the prototype's `@theme` palette and type as primitives, with
semantic roles on top. `assets/ui.css` is the component kit, with one BEM block per
prototype component (`ActivityShell` is `.shell`, `Chunky` is `.chunky`, `PairMatch` is
`.pairs`, and so on). Every state of a screen is the same layout with different content.

### Where the mocks depart from the prototype

- **Short tablet and split windows.** The progress bar and spoken prompt share the top row when height is limited. In activities such as Count the toys and Spell by sound, the picture sits beside the choices so the child can see the prompt, play and reach the answer button in one view.

- **Replaying a completed lesson step.** Next returns to the first unfinished game. The prototype advances its step counter after each completion, which can skip an unplayed game during a replay.
- **Dark theme added.** The prototype is light only. The dark theme is new: Pibbo and
  the brand colours are kept, and pictures sit on a light plate. Counting, reading and success symbols use the light tints of their respective prototype colours against dark surfaces.
- **Self-hosted fonts and pictures.** The prototype loads Fredoka and Andika from Google
  Fonts and its pictures from the Magic Patterns CDN. The mocks bundle copies so they
  open offline.
- **Direct links to activity states.** Each page opens at its illustrated state. The rocket, dance, blending and pair-matching examples can also be played through using their controls.
- **Links instead of handlers.** Leave, Next, Try again, Check and the game cards are
  links between mock files. In the product they are buttons and routes.
- **Words and pictures, Spot the word, Build a sentence and What do I know?** are
  frames in the project but are not wired into the prototype's own navigation. Here they
  are linked from Home and the lesson, as `journeys.ts` describes.

- **Home reconciled with `AGENTS.md` (journey 2).** The prototype's Home (the child's
  name and stars, today's lesson card, the check card and 21 game cards) is replaced by what
  `L2-024` and *Children's privacy and safety* allow: two group pictures, Count and Read, and
  the chosen group's activities as pictures, only those that exist. The prototype's subject
  switch became the group pictures (`.switch--groups`), its game cards lost their stars, and
  targets and gaps grew to 60 px and 16 px (`--target-child`, `--gap-targets`). The lesson and
  check pictures (`L2-024` #4) come back with journeys 22 and 23. `activity-placeholder` is new:
  it stands in for an activity until its journey builds it (ADR 0006). Review either the
  [Count the toys placeholder](pages/activity-placeholder/default.html) or the
  [Sound it out placeholder](pages/activity-placeholder/default.html?activity=sound-it-out).
  Home returns to the matching group. Pressing Enter on Home focuses the activity card.

- **Sound it out reconciled with `L2-012` and `L2-026` (journey 4).** The prototype's cast was
  "ship", a digraph (`L2-014`, journey 14); the journey-4 states now draw a three-sound word of
  single letters ("map", with sun and cat as the other pictures) and drop the `rule` line. The
  speech bubble carries a picture of what is asked (`bubble__picture`), the letter sounding is
  lit (`tile--sounding`), the right picture carries a tick (`pick__tick`), Next starts the next round, and a new `modelled` state shows the
  right picture after the third wrong one. `syllables` is unchanged (ADR 0008).
- **Silent e drawn for `L2-016` (journey 16).** The prototype's `magic-e` showed "cape" with the e greyed and disabled; `L2-016` asks the child to add and take away the e. `magic-e` now draws "cap" with its picture and the e tile waiting to be added (`tile--silent tile--next`, `aria-pressed=false`); the new `magic-e-on` draws "cape": the e dashed and pressed (`tile--added`), the a tile marked with a bar (`tile--changed`, `tile__mark`) and the picture a cape. Touching the e in either state opens the other. While the child picks the picture the rule and the tiles stay, the quiet e added and no longer a toggle, and the word's own picture is not shown beside them, so the pictures are a real choice between cap and cape (ADR 0021).
- **Counting stamps on small toys.** At tile widths of 112 px or less, Count the toys and Count and write place the number inside the lower corner. The prototype centres the stamp, which can cover the whole illustration on a phone. Larger rug toys keep the centred stamp.
- **Count the toys reconciled with `L2-001`, `L2-002`, `L2-025` and `L2-026` (journey 3).** The
  prototype's Try again cleared the stamps; now nothing is cleared: Pibbo counts the toys again
  aloud, lighting each in turn (`rug__toy--highlight`), and the child chooses again. A new
  `modelled` state shows the right numeral (`numeral--answer`) after the third wrong answer. The
  prototype's toy spots overlapped on a phone; toys now sit one per cell of a 4 x 3 grid
  (`rug__toy--0` to `--11`), each at least 60 px. Leave and replay grew to 60 px, and the speech
  bubble carries a picture of what is asked (`bubble__picture`). Next starts the next round
  (ADR 0007).
- **Count and write reconciled with `L2-003`, `L2-004` and `AGENTS.md` (journey 5).** The
  prototype drew a number track and a handwriting pad the child traces with a finger, which is a
  precise drag (*Touch is a tap*), and it showed no things to count. The states now draw 14
  toys in two ten-frames (`.tenframes`, `.tenframe`, `__thing`, `__cell`, `__badge`),
  filled in order, each at least 60 px; once counted they shrink (`tenframes--small`) and a digit
  pad (`.digit-pad`, `__slots`, `__slot`, `__keys`, `__key`, `__clear`) writes the numeral
  by taps. On narrow portrait phones the ten digits form four columns with 9 and 0 centred on the last row. In landscape the small ten-frames and answer slots share the space beside the keys. New `hint` (the boxes clear and Pibbo lights 1, then 4: `digit-pad__key--lit`) and
  `modelled` (`digit-pad__slot--answer`) states. The title is "Count and write"; the
  cells between digit keys and things are 6 px, not 16 px, so five 60 px targets fit a 360 px
  phone (ADR 0009).
- **Which is bigger reconciled with `L2-005` (journey 6).** The `retry` state now marks the
  dots of the bigger set beyond the smaller number (`ten-frame__dot--extra`, a ring as well as a
  colour), so the ten-frames line the sets up one-to-one and show the extra. A number above 10
  is drawn as two `.ten-frame`s in its card; on a short screen the numeral shrinks, and on a phone on
  its side it sits beside its ten-frames, so a card of 20 and the answer bar fit with no scrolling. Open [6 and 9](pages/which-is-bigger/default.html?left=6&right=9) for a larger right-hand set or [20 and 0](pages/which-is-bigger/default.html?left=20&right=0) for two full ten-frames beside an empty one. Choosing a card and then Check stays as drawn, and
  `L2-005` was brought in line (ADR 0010).
- **Rocket countdown reconciled with `L2-006` (journey 7).** The rocket rises in tenths of the
  way from the start to 0 (`launch__rocket--0` to `--10`, 15 px each here, 5.5% of the launch's
  height in the product), so any start from 5 to 20 draws; the mock's `--4` at 6 of 10 is one of
  them. So that a start of 20 and the answer bar fit a 360 x 640 phone and a 640 x 360 one with
  no scrolling, the product keeps the launch beside the numbers at every width, draws the track
  (shown, never touched) with smaller cells on a phone, and on a phone on its side puts the track
  and the choices side by side. The three choices, the track that is not
  touched and the retry line stay as drawn, and `L2-006` was brought in line (ADR 0011).
- **Skip-count reconciled with `AGENTS.md` and `L2-007` (journey 8).** The prototype's step
  switch (`switch__option--sm`) was 44 px tall, 4 px apart, and showed the chosen step by colour
  alone; it is now `.switch--step`, 64 px targets 16 px apart with a tick on the chosen step.
  The number line's labels are 44 units (were 34) so they stay readable on a phone. The number
  line, the three choices and the retry line stay as drawn, and `L2-007` was brought in line
  (ADR 0012). Home's Count group lists Skip-count.
- **Add together reconciled with `AGENTS.md` and `L2-008` (journey 9).** The prototype named the
  players "Maya" and "Dad"; Pibbo asks a child for nothing about themselves and `L2-008` #1
  shows a turn by a symbol and colour, never a name, so the players are a star and a moon
  (`.turn--star`, `.turn--moon`), and the player whose turn it is has a ring
  (`.player[aria-current="step"]`). The + and − buttons (`.round-btn`) were 44 px, 8 px apart, on
  both players at once; they are 64 px, 16 px apart, and only the player whose turn it is has
  them, beside the sum (`.turn-controls`). The two sets stay side by side at every width, so
  5 + 5 fits a 360 × 640 phone either way up. The turns are taken one after the other: `start` is the star's
  turn, the new `moon-turn` the moon's, each ended by Done, and the three choices appear only
  when both sets are shown (`default`). Home's Count group lists Add together (ADR 0013).
- **Counting dance reconciled with `AGENTS.md` and `L2-009` (journey 10).** The prototype's
  speed switch (`switch__option--sm`, `.switch--quiet`) was 44 px tall, 4 px apart, and showed
  the chosen speed by colour alone; it is now `.switch--speed`, 64 px targets 16 px apart with
  a tick, as `.switch--step`. The figure, the numeral, the row of numbers and the one control
  stay as drawn (ADR 0014). Home's Count group now has seven activities, more than the 6 a
  screen `L2-024` allows: `home/counting` shows five and a More picture
  (`.game-card--more`), and the new `home/counting-more` shows Add together, Counting dance
  and More, which goes back to the first screen.
- **Matching feedback.** Letter sounds, Big and small letters, and Words and pictures give each completed pair a shared corner shape as well as its prototype colour. A solid ring identifies the held card. A missed partner shows a dashed ring, including with reduced motion.
- **Letter sounds reconciled with `L2-010` (journey 11).** The prototype is a pair match, four
  letters beside their four sounds, each sound with its recording and a picture "as in" a word;
  `L2-010` asked for one sound played and three letters to choose from. The mock wins and
  `L2-010` now describes the pair match (ADR 0015). The prototype's "small shake" for a wrong
  partner had no class and no state: `.pair--miss` and the new `miss` state draw it, and
  reduced motion removes it. c's sound is shown "/k/", as in both Letter sounds and Sound it
  out. Home's Read group lists Letter sounds after Sound it out; after the fifth round Next
  goes back to Home with Read chosen, as in Sound it out (ADR 0008), not to Sound it out.
  The prototype's two columns of 80 px pairs ran under the answer bar on a 360 × 640 phone and
  on a 640 × 360 one: upright, the letters now make one row and the sounds a second, each
  picture above its sound; on its side, all eight make one row of 60 px targets.

## Open questions

- The prototype and these mocks are not reconciled with `AGENTS.md`. At the owner's
  direction, that was set aside for this transcription. The main differences: Home
  shows the child's name and stars and offers 21 games, not the two activities `AGENTS.md`
  names; "Rocket countdown" counts down; "What do I know?" keeps results between visits.
  Under `AGENTS.md` the mocks are the source of truth, so this needs deciding before the
  requirements, the design system or the code follow them.
- Routes in `manifest.json` are proposals; the prototype has no URLs.
- No specs exist yet, so no mock lists requirement IDs.

## Re-checking and re-screenshotting

```sh
python .claude/skills/writing-html-mocks/scripts/check_mocks.py docs/mocks --write
python .claude/skills/writing-html-mocks/scripts/screenshot_mocks.py docs/mocks
```

Screenshots go to `docs/mocks/.cache/` (ignored by git).

## Coverage

<!-- coverage:start -->

Legend: ✅ mock exists · ➖ not applicable (reason in manifest) · ❌ missing

### Pages

| Screen | default | loading | empty | error | counting | counting-more | first-visit | start | done | choose | correct | retry | modelled | written | hint | picked | by-twos | moon-turn | playing | held | miss | ready | pick | magic-e | magic-e-on | syllables | groups | clusters | first-two | first-two-retry | full | all-chosen | answered | counting-question | results | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home · Choose an activity (`home`) | [✅](pages/home/default.html) | ➖ | ➖ | ➖ | [✅](pages/home/counting.html) | [✅](pages/home/counting-more.html) | [✅](pages/home/first-visit.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-024`, `L2-035` |
| Activity placeholder (`activity-placeholder`) | [✅](pages/activity-placeholder/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-024` |
| Guided lesson (`guided-lesson`) | [✅](pages/guided-lesson/default.html) | ➖ | ➖ | ➖ | [✅](pages/guided-lesson/counting.html) |  |  | [✅](pages/guided-lesson/start.html) | [✅](pages/guided-lesson/done.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Count the toys (`count-the-toys`) | [✅](pages/count-the-toys/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/count-the-toys/start.html) |  | [✅](pages/count-the-toys/choose.html) | [✅](pages/count-the-toys/correct.html) | [✅](pages/count-the-toys/retry.html) | [✅](pages/count-the-toys/modelled.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-001`, `L2-002`, `L2-025`, `L2-026` |
| Count and write (`count-and-write`) | [✅](pages/count-and-write/default.html) | ➖ | ➖ | ➖ | [✅](pages/count-and-write/counting.html) |  |  |  |  |  | [✅](pages/count-and-write/correct.html) |  | [✅](pages/count-and-write/modelled.html) | [✅](pages/count-and-write/written.html) | [✅](pages/count-and-write/hint.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-003`, `L2-004`, `L2-025`, `L2-026` |
| Which is bigger? (`which-is-bigger`) | [✅](pages/which-is-bigger/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/which-is-bigger/correct.html) | [✅](pages/which-is-bigger/retry.html) |  |  |  | [✅](pages/which-is-bigger/picked.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-005`, `L2-025` |
| Rocket countdown (`rocket-countdown`) | [✅](pages/rocket-countdown/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/rocket-countdown/start.html) |  |  | [✅](pages/rocket-countdown/correct.html) | [✅](pages/rocket-countdown/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-006`, `L2-025` |
| Skip-count (`skip-count`) | [✅](pages/skip-count/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/skip-count/start.html) |  |  | [✅](pages/skip-count/correct.html) | [✅](pages/skip-count/retry.html) |  |  |  |  | [✅](pages/skip-count/by-twos.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-007`, `L2-025` |
| Add together (`add-together`) | [✅](pages/add-together/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/add-together/start.html) |  |  | [✅](pages/add-together/correct.html) | [✅](pages/add-together/retry.html) |  |  |  | [✅](pages/add-together/picked.html) |  | [✅](pages/add-together/moon-turn.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-008`, `L2-025` |
| Counting dance (`counting-dance`) | [✅](pages/counting-dance/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/counting-dance/start.html) |  |  | [✅](pages/counting-dance/correct.html) |  |  |  |  |  |  |  | [✅](pages/counting-dance/playing.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-009`, `L2-025` |
| Letter sounds (`letter-sounds`) | [✅](pages/letter-sounds/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/letter-sounds/start.html) |  |  | [✅](pages/letter-sounds/correct.html) |  |  |  |  |  |  |  |  | [✅](pages/letter-sounds/held.html) | [✅](pages/letter-sounds/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-010`, `L2-025`, `L2-026` |
| Big and small letters (`big-and-small-letters`) | [✅](pages/big-and-small-letters/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/big-and-small-letters/correct.html) |  |  |  |  |  |  |  |  | [✅](pages/big-and-small-letters/held.html) | [✅](pages/big-and-small-letters/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-011`, `L2-025`, `L2-026` |
| Words and pictures (`words-and-pictures`) | [✅](pages/words-and-pictures/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/words-and-pictures/correct.html) |  |  |  |  |  |  |  |  | [✅](pages/words-and-pictures/held.html) | [✅](pages/words-and-pictures/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-025`, `L2-026` |
| Sound it out (`sound-it-out`) | [✅](pages/sound-it-out/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/sound-it-out/correct.html) | [✅](pages/sound-it-out/retry.html) | [✅](pages/sound-it-out/modelled.html) |  |  |  |  |  |  |  |  | [✅](pages/sound-it-out/ready.html) | [✅](pages/sound-it-out/pick.html) | [✅](pages/sound-it-out/magic-e.html) | [✅](pages/sound-it-out/magic-e-on.html) | [✅](pages/sound-it-out/syllables.html) | [✅](pages/sound-it-out/groups.html) | [✅](pages/sound-it-out/clusters.html) | [✅](pages/sound-it-out/first-two.html) | [✅](pages/sound-it-out/first-two-retry.html) |  |  |  |  |  | `L2-012`, `L2-014`, `L2-015`, `L2-016`, `L2-025`, `L2-026` |
| Spell by sound (`spell-by-sound`) | [✅](pages/spell-by-sound/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/spell-by-sound/correct.html) | [✅](pages/spell-by-sound/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/spell-by-sound/full.html) |  |  |  |  | `L2-013`, `L2-025`, `L2-026` |
| Rhyme time (`rhyme-time`) | [✅](pages/rhyme-time/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/rhyme-time/start.html) |  |  | [✅](pages/rhyme-time/correct.html) | [✅](pages/rhyme-time/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/rhyme-time/all-chosen.html) |  |  |  |  |
| Spot the word (`spot-the-word`) | [✅](pages/spot-the-word/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/spot-the-word/correct.html) |  |  |  |  |  |  |  |  |  | [✅](pages/spot-the-word/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Build a sentence (`build-a-sentence`) | [✅](pages/build-a-sentence/default.html) | ➖ | ➖ | ➖ |  |  |  | [✅](pages/build-a-sentence/start.html) |  |  | [✅](pages/build-a-sentence/correct.html) | [✅](pages/build-a-sentence/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/build-a-sentence/full.html) |  |  |  |  |  |
| What do I know? (`progress-check`) | [✅](pages/progress-check/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  | [✅](pages/progress-check/correct.html) | [✅](pages/progress-check/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/progress-check/answered.html) | [✅](pages/progress-check/counting-question.html) | [✅](pages/progress-check/results.html) |  |
| Pibbo brand (`brand`) | [✅](pages/brand/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

<!-- coverage:end -->
