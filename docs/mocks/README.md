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
The [audit resolutions](audit-resolutions.md) record how each mock-vs-prototype issue was settled.

## Opening the mocks

- On a state page, scroll past the mock to reach its design note and review toolbar. At phone widths, the state pills wrap so every label stays visible.
- On phones and portrait tablets, gallery previews use the device viewport. Rotate the device to review the landscape phone layout.
- In the gallery, focus or hover over a state pill to preview that state. The selected pill uses the same subject colour as the open mock and has an underline. Press Enter or tap the pill to open the full page. To keep a state in view, select **Preview states in gallery** and activate a pill. The gallery address now bookmarks that preview. Back and Forward revisit the states you selected. In this mode, moving the pointer or tabbing to another pill keeps the selected preview in place until you activate a pill. **Open mock** opens that preview in the current theme. All mocks returns to that same pill and preview, with the current theme. The Change log link in the gallery header opens the documented changes.
- The gallery and mock pages follow the browser’s color scheme until you choose a theme. A theme in the URL takes precedence over the saved choice. Changing the theme updates the URL so reloading or sharing a state preserves its appearance. Use the theme button, or press `t` while keyboard focus is in the review toolbar. Holding the key switches the theme once. Opening a toolbar state pill with Enter focuses the current pill on the destination page so you can continue through adjacent states.
- The × button hides the review toolbar and notes and takes you to the top of the mock. Use browser Back or press Escape to return to the toolbar with the round intact. Open a file with `?chrome=0` to start in preview mode.
- Home’s group pictures switch the visible activities. Count the toys, Which is bigger and Sound it out let a reviewer change the selected answer and check it. For Which is bigger, open [the right card selected](pages/which-is-bigger/default.html?picked=right) or set `picked` to `left` or `none` on either editable state.
- Spell by sound, Rhyme time and Build a sentence let you build an answer, change it, and check it. On short landscape phones, Spell by sound puts the picture, sound boxes and six-letter bank side by side so the answer button stays visible. Spell by sound also includes the [map](pages/spell-by-sound/default.html?word=map) and [cat](pages/spell-by-sound/default.html?word=cat) examples from the frame. Each has its own picture and letter bank. Build a sentence includes the [sun](pages/build-a-sentence/start.html?sentence=sun) and [boat](pages/build-a-sentence/start.html?sentence=boat) examples. Add `placed=0` through `placed=5` to an editable sentence URL to preview how many words are already on the strip, as in [the boat with three words placed](pages/build-a-sentence/default.html?sentence=boat&placed=3). Each sample has four words, so both 4 and 5 show the complete sentence. Spot the word includes [is](pages/spot-the-word/default.html?target=is) and [a](pages/spot-the-word/default.html?target=a) as well as the illustrated “the”. It highlights each target you find and opens the completion screen after the last one.
- Games opened from Home return to the same group. Opening Sound it out, Big and small letters, Count and write or Spell by sound from Home starts a fresh round; in Spell by sound all three boxes start empty, and Next on its correct state starts the next round the same way. Opening a state directly shows its illustrated example.
- In a guided lesson, Leave returns to the current step. Finish the game and choose Next to unlock the following step. The second reading game uses “map” and the third introduces “sh” in “ship”. To see any number of games done, set `current` (the next game, 1 to 5) on `default` or `counting`, as in [Reading with three done](pages/guided-lesson/default.html?current=4) or [Counting with none done](pages/guided-lesson/counting.html?current=1); [the Counting lesson done](pages/guided-lesson/done.html?lesson=count) shows both lessons finished.
- Sound it out previews map, ship, stop, night, boat, cape and sunset. Touch the remaining parts, choose Read it fast, and select a picture; for "stop", answer the first-two-sounds question first. On cape, touch the e to add the quiet e or take it away. Add `begin=1` to a state before blending (default, groups, clusters, magic-e, syllables) to start that word from nothing heard. The quiet e and the syllable captions stay visible when choosing a picture.
- A longer word is read one clap (syllable) at a time: open [sunset as the round opens](pages/sound-it-out/syllables.html?begin=1), touch sun and set, choose Read it fast, and pick the picture.
- What do I know? runs through five questions: ship, ducks, rhyme, the bigger number and sun. Feedback keeps the selected answer visible and the fifth question leads to the results, which show only earned pictures. The rhyme and bigger-number questions also have their own states (`rhyme-question`, `number-question`).
- On the brand sheet, add `#heroMood=think`, `cheer` or `oops` to draw the hero Pibbo in another mood, as in [the hero cheering](pages/brand/default.html#heroMood=cheer); `#tagline=` changes the line beneath the wordmark.
- In Count and write, start with nothing counted, touch every toy, enter the total, and choose Check. Clear empties both boxes. A wrong answer demonstrates the digits in order. Next starts the next round with nothing counted.
- Add together lets Star and Moon add or remove ducks in turn. Done passes the pond to the next player, then opens the total choices. A wrong answer highlights each duck before the players choose again.
- Counting dance previews the beat visually. Start or resume to advance the chant, pause to hold a number, and choose Slow or Fast to change tempo. The playing frame opens at beat five for inspection. Set `beat` from 0 through 10 and `tempo` to slow or fast to inspect a specific moment, such as [beat seven at fast tempo](pages/counting-dance/playing.html?beat=7&tempo=fast).
- Progress Check keeps the selected answer when a question is reloaded. To review a specific choice, open [the bat selected for the rhyme question](pages/progress-check/answered.html?choice=1#question=3).
- Rocket countdown moves one notch per correct answer. Reloading resumes at the displayed number. Opening [a countdown at zero](pages/rocket-countdown/default.html#from=17&at=0) shows the completed track and launch. Short launch pads use smaller notches so the rocket stays visible until zero. Skip-count draws each hop and lets you restart the line by choosing a step size; the `by-tens` state shows the third step size. Its address keeps the step and hop on reload. To review them separately, open [four hops by tens](pages/skip-count/default.html#by=10) or [nine hops at the illustrated step size](pages/skip-count/default.html#hops=9). Both keep your place when you try again.
- In Letter sounds, Big and small letters and Words and pictures, choose one card from each column. Matched pairs keep their colour and corner shape as you finish the round. Reloading a partially matched board restores each completed pair in the order you found it. Words and pictures also has `start`, `held` and `miss` states; open [the Dress-up box words](pages/words-and-pictures/default.html#theme=dress-up) to review the second theme.
- Big and small letters also draws the frame's other two letter sets: open
  [M N H R](pages/big-and-small-letters/start.html#letters=M%20N%20H%20R) or
  [E F Q T](pages/big-and-small-letters/start.html#letters=E%20F%20Q%20T). The small letters
  keep the frame's shuffle (h, m, r, n; q, e, t, f), and the set is kept as you move between
  states.
- Each Check, Next and Try again button links to the state it leads to, so you can click
  through a game the way a child would play it.

## Cast and catalog

The sample data comes from the prototype's `journeys.ts`, `pictures.ts` and each frame's
args. It is the cast, not a set of rules.

- **The grown-up gate and area drawn (journey 24, ADRs 0028 and 0029).** The prototype has no
  grown-up screen. Home's top bar gained a small corner control (`.grown-up-entry`, an outline
  padlock, 48 × 48 px, labelled "For grown-ups") beside the Lesson picture, which stacks its icon
  over its word on narrow phones. The check game's picture moved from the top bar to the row under
  it, beside the group pictures (`.home__row`), so every activity picture stays at least 48 px from
  the entry (`L2-037` #1). It opens one
  grown-up screen (`pages/grown-up`) whose first step is the gate (`gate`, `gate-progress`): in
  words only and with nothing spoken, three numbers in order ("Touch seven, three, nine in
  order.") on a 3 × 3 keypad (`.gate__keys`), with dots for how many are touched. A wrong number
  or Back to Pibbo returns to Home as it was. The area (`default`) offers Volume (Quiet, Medium,
  Loud), Progress with Clear progress, and About Pibbo, with no link out; Clear progress asks
  first in place of its button (`confirm`, `.confirm`, focus on Keep it) and then says
  "Progress cleared." (`cleared`). Both are steps of the screen, not dialogs: a CDK Dialog grew
  the initial bundle past its budget (ADR 0029).
- **Child:** Maya. **Grown-up:** Dad (Add together).
- **Stars:** 26 in total across the 21 games, in the prototype; Home shows no stars (`AGENTS.md`), so the mocks draw none.
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

- **Replaying a completed lesson step.** A finished game stays open to replay, but Next after a replay returns to the path with the same next game: the step moves on only when the game just played was the next one. The prototype adds 1 to the step after any completion, so replaying game 1 with 2 games done marks game 3 done unplayed.
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
- **Words and pictures aligned (journey 18, ADR 0023).** Home's Read group lists it after
  Spell by sound. The `held` state (a word pressed while its sounds are spoken) and the `miss`
  state (both words spoken, the picture shaken and the word let go) are drawn. On a phone on
  its side the product makes the words and pictures one row, words on the left: at 568 × 320
  the mock's two rows of 60 px targets do not fit above the answer bar.
- **Home's second Read screen (journey 21, ADR 0025).** Read has seven activities, so
  `home/default` shows five and More, and the new `home/reading-more` shows Spot the word and
  Rhyme time, as `home/counting-more` does for Count (`L2-024` #7).
- **Build a sentence aligned (journey 20, ADR 0034).** `L2-020` followed the prototype's
  first idea (each slot waits for the next word, which pulses); the mocks build the sentence
  freely and check it, as Spell by sound and Rhyme time do. The mock wins. No mock drew the
  modelled answer `L2-026` #2 requires after a third wrong Check: the new `model` state shows
  the sentence in order, "Listen: “The cat can sit.”" spoken and shown, and Next. Home's
  `reading-more` screen gains the Build a sentence card, Read's eighth activity.

- **Guided lesson aligned (journey 22, ADR 0026).** Home's Count and Read screens gain a
  Lesson picture beside the wordmark (`.home__lesson`, `L2-024` #4); it opens the chosen
  group's lesson where the child left off. The done state no longer earns a star: praise is
  for effort and nothing is counted, so it says "Lesson done! You played every game." On the
  path, "Up next" is spoken as well as shown. The five-game paths are the cast, not a rule:
  the product's lessons are content, and a game a lesson names that does not exist yet is left
  off the path.

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
- **Home's details (journey 2).** Each follows `L2-024`, `L2-036` or ADR 0006, not the prototype:
  - No group is chosen when Home opens (`home/first-visit`, `L2-024` #6), so nothing is spoken
    before the first touch; the prototype always had Reading chosen.
  - The groups are Count then Read, named "Count" and "Read" (the prototype: "Reading" then
    "Counting"), as `AGENTS.md` and `L2-024` name them; the nav is labelled "Groups", the word
    `L2-024` uses, not "Subjects".
  - Each group picture has a glyph ("1 2 3", "a b c") so a child who cannot read can tell them
    apart, and the chosen one has a tick as well as its fill, so colour is not the only carrier
    of the state (`L2-036` #6).
  - Touching a group or activity picture speaks its name (`L2-024` #1, #2, #5); the prototype
    played nothing on Home.
  - One heading, the group's name, sits over its activities. The prototype's sub-headings
    ("Letters", "Sounds into words", "Words and sentences"; "Counting", "Numbers") are words a
    child cannot read and only sorted a long scrolling list, which `L2-024` #3 removes.
  - Activities are listed in the order their journeys added them to the catalogue (ADRs 0006,
    0014, 0015, 0017, 0018): Read is Sound it out, Letter sounds, Big and small letters, Spell by
    sound; Count is Count the toys, Count and write, Which is bigger?, Rocket countdown,
    Skip-count, then Add together and Counting dance on the second screen. Which activities, and
    in what order, is not decided yet (`AGENTS.md`).
  - Each card's glyph previews its own activity's cast as the mocks draw it: "m s t" (Letter
    sounds' m, s, t), "B b" (Big and small letters' B and b), "s u _" (a sound still to choose
    in "sun"), "14" (Count and write's 14 toys) and "7 4" (the two numbers, with no ">" sign the
    activity never shows). The prototype used "m s", "Aa", "sun", "20" and "7 > 4".
  - The page's h1 is a visually hidden "Choose an activity", so a screen reader names the screen;
    the prototype's h1 was the lesson title, which went with the lesson card.

- **Sound it out reconciled with `L2-012` and `L2-026` (journey 4).** The prototype's cast was
  "ship", a digraph (`L2-014`, journey 14); the journey-4 states now draw a three-sound word of
  single letters ("map", with cap and sun as the other pictures, as in the prototype) and drop the `rule` line. The
  speech bubble carries a picture of what is asked (`bubble__picture`), the letter sounding is
  lit (`tile--sounding`), the right picture carries a tick (`pick__tick`), Next starts the next round, and a new `modelled` state shows the
  right picture after the third wrong one. A new `start` state draws the round before any sound is heard, and `pick` draws the picture phase as it opens, nothing chosen and Check waiting. `syllables` is unchanged (ADR 0008).
- **One state, many words.** The prototype's frame is one engine for seven words. Each Sound it out state is drawn once, with one word of the cast: letter groups with "ship", adjacent consonants with "stop", the quiet e with "cap" and "cape" (`magic-e`, `magic-e-on`), syllables with "sunset". "night" and "boat" are the same letter-group states with another word, and cape's and sunset's pictures are the `pick`, `correct`, `retry` and `modelled` states with their tiles swapped in; the script draws them (`?begin=1&word=night`, Read it fast on `magic-e-on`). Words are the cast, not states.
- **The first two sounds (journey 15).** For "stop" the mock asks "What are the first two sounds?" between blending and the pictures (`first-two`), which the prototype never asks: `L2-015` #2 and ADR 0020 require it. One touch chooses, so it has no Check; a wrong choice is modelled at once with each tile lit and every choice stays open (`first-two-retry`), so it has no Try again either.
- **Try again is the hint.** In the prototype Try again only clears the chosen picture. Here it also plays the sounds and the word again, each letter lit, which is the hint `L2-026` #1 asks for before the next try.
- **Tiles name their state.** Each tile's accessible name says whether it has sounded, is next or waits ("m, says /m/", "a, tap to hear it", "p"), so a screen reader hears the round in the order a child meets it; the prototype named a tile by its letters only.
- **Sound it out on short screens.** With a rule line (and cape's "cap" card) the pictures sit beside the tiles on short screens such as 1024 × 768, and on a phone on its side the tiles sit beside the blend bar or the pictures; the prototype's single column scrolls there (by 5 to 65 px and 50 to 92 px). Below 40rem a four-sound word's tiles narrow to 64 px so "stop" keeps one row on a 320 or 360 px phone (ADR 0020), where the prototype wraps the fourth tile.
- **Try it from the results.** Try it opens Sound it out at "boat", and Leave returns to Home, as in the prototype. Next after the right picture starts the next round, as everywhere in Sound it out (ADR 0008); the prototype returned to Home.
- **Silent e drawn for `L2-016` (journey 16).** The prototype's `magic-e` showed "cape" with the e greyed and disabled; `L2-016` asks the child to add and take away the e. `magic-e` now draws "cap" with its picture and the e tile waiting to be added (`tile--silent tile--next`, `aria-pressed=false`); the new `magic-e-on` draws "cape": the e dashed and pressed (`tile--added`), the a tile marked with a bar (`tile--changed`, `tile__mark`) and the picture a cape. Touching the e in either state opens the other. While the child picks the picture the rule and the tiles stay, the quiet e added and no longer a toggle, and the word's own picture is not shown beside them, so the pictures are a real choice between cap and cape (ADR 0021).
- **Counting stamps on small toys.** At tile widths of 112 px or less, Count the toys and Count and write place the number inside the lower corner. The prototype centres the stamp, which can cover the whole illustration on a phone. Larger rug toys keep the centred stamp.
- **Count the toys reconciled with `L2-001`, `L2-002`, `L2-025` and `L2-026` (journey 3).** The
  prototype's Try again cleared the stamps and the chosen numeral; now nothing is cleared and
  there is no Try again button: while Pibbo counts the toys again aloud, lighting each in turn
  (`rug__toy--highlight`), the bar says "Let’s count them together." beside a disabled Check, and
  then the numerals come back with none chosen, so no wrong numeral stays marked (`L2-002` #2).
  A new `modelled` state shows the right numeral (`numeral--answer`) after the third wrong answer
  (`L2-026` #2). The prototype's toy spots overlapped on a phone; toys now sit one per cell of a
  4 x 3 grid (`rug__toy--0` to `--11`), each at least 60 px. Leave and replay grew to 60 px, and
  the speech bubble carries a picture of what is asked (`bubble__picture`). An uncounted toy is
  named by its picture ("Count this teddy"), and the rug is a group, "The rug, 7 toys", as in
  the product (the prototype gave it no name). A new `counted` state draws
  the numerals with none chosen and Check waiting; `choose` draws 7 chosen. Next starts the next
  round of five (ADR 0007): the progress bar counts the rounds of the play, not a lesson step
  (the prototype's fixed 3 of 5 from Home), and the static states draw one round, so they all
  show it; only in a guided lesson does the bar show the lesson's game.
- **Count and write reconciled with `L2-003`, `L2-004` and `AGENTS.md` (journey 5).** The
  prototype drew a number track (1 to 20, only the next number enabled) and a handwriting pad
  the child traces "14" on with a finger, which is a precise drag (*Touch is a tap*), and it
  showed no things to count. The track, the dimmed pad and the tracing are gone, and so is its
  question: the prototype asked "what comes next?" after 13 taps; the mock asks how many
  (`L2-003` #2). The states now draw 14 toys in two ten-frames (`.tenframes`, `.tenframe`,
  `__thing`, `__cell`, `__badge`), filled in order, each at least 60 px, touched in any order;
  once counted they shrink (`tenframes--small`) and a digit pad (`.digit-pad`, `__slots`,
  `__slot`, `__keys`, `__key`, `__clear`) writes the numeral by taps. The digit pad appears only
  when every toy is counted, so one thing is asked at a time. On narrow portrait phones the ten
  digits form four columns with 9 and 0 centred on the last row. In landscape the small
  ten-frames and answer slots share the space beside the keys. The prototype's Check always
  said right without reading the pad; here Check compares the digits with the count (`L2-004`),
  so a wrong numeral gets the new `hint` state (the boxes clear and Pibbo lights 1, then 4:
  `digit-pad__key--lit`, `answer-bar--hint`) in place of the prototype's unreachable Try again,
  and the third wrong one the new `modelled` state (`digit-pad__slot--answer`,
  `answer-bar--model`), as `L2-026` asks. A new `start` state draws the round with nothing
  counted; Next starts the next round there (five rounds make one play, so the progress bar
  starts at 1 of 5 from Home, not the prototype's fixed 3 of 5). The title is "Count and
  write"; the cells between digit keys and things are 6 px, not 16 px, so five 60 px targets
  fit a 360 px phone (ADR 0009).
- **Count and write words.** The counting prompt is "Tap each toy once to count it." (as in
  Count the toys), not "Count along! Tap 1.": the toys are touched in any order, so no number
  is named. The writing prompt is "Write how many.", not "What comes next? Write 14.", which
  would give the answer away. The praise is "Yes! 14.", as Count the toys says "Yes! 7 toys.";
  the prototype's "Lovely writing" praised handwriting there is none of. Clear is a 60 px icon
  button beside the boxes with the name "Clear" for a screen reader, not a pill with the word:
  the child cannot read it, and the word would not fit beside two boxes on a 360 px phone
  (ADR 0009).
- **Which is bigger reconciled with `L2-005` (journey 6).** The `retry` state now marks the
  dots of the bigger set beyond the smaller number (`ten-frame__dot--extra`, a ring as well as a
  colour), so the ten-frames line the sets up one-to-one and show the extra. A number above 10
  is drawn as two `.ten-frame`s in its card; on a short screen the numeral shrinks, and on a phone on
  its side it sits beside its ten-frames, so a card of 20 and the answer bar fit with no scrolling. Open [6 and 9](pages/which-is-bigger/default.html?left=6&right=9) for a larger right-hand set or [20 and 0](pages/which-is-bigger/default.html?left=20&right=0) for two full ten-frames beside an empty one. Each card is named by its numeral and its dots ("7, 7 dots"), the text alternative for the ten-frame. `picked` draws the 7 chosen; the 4 chosen before Check is the same state with the other card ([`?picked=right`](pages/which-is-bigger/picked.html?picked=right)). Next starts the next round of five (ADR 0010), not Rocket countdown; the prototype's Next left the game. Choosing a card and then Check stays as drawn, and
  `L2-005` was brought in line (ADR 0010).
- **Rocket countdown reconciled with `L2-006` (journey 7).** The rocket rises in tenths of the
  way from the start to 0 (`launch__rocket--0` to `--10`, 15 px each here, 5.5% of the launch's
  height in the product), so any start from 5 to 20 draws (the prototype's starts of 3 and 4 are
  outside `L2-006`); the states draw a start of 10, and the mock's `--4` at 6 of 10 is one of
  them. So that a start of 20 and the answer bar fit a 360 x 640 phone and a 640 x 360 one with
  no scrolling, the product keeps the launch beside the numbers at every width (the prototype
  stacked it below 768 px), draws the track (shown, never touched) with smaller cells on a phone,
  and on a phone on its side puts the track and the choices side by side. The track, the choices
  and the rocket have text alternatives the prototype lacked: the track is "Counting down from
  10", a cell not yet said reads "not yet", the current cell is `aria-current="step"` (not colour
  alone), the choices are the group "What comes next?" and the launch is an image that says how
  far the rocket has risen. Next starts the next round of five (ADR 0011), not Skip-count; the
  progress bar counts those rounds (the drawn round is the 4th), not the prototype's step 3 of 5
  from Home. The three choices, the track that is not touched and the retry line stay as drawn,
  and `L2-006` was brought in line (ADR 0011).
- **Skip-count reconciled with `AGENTS.md` and `L2-007` (journey 8).** The prototype's step
  switch (`switch__option--sm`) was 44 px tall, 4 px apart, and showed the chosen step by colour
  alone; it is now `.switch--step`, 64 px targets in the prototype's sunken tray, with a tick
  on the chosen step as well as its fill. The switch is one radio group: one Tab stop, and the
  arrow keys move to and choose the next step, as a radio group does on a desktop. The number
  line is a picture (`role="img"`) whose name lists every number said so far, and the choices
  are a group named by the question, so a screen reader hears the round in the order a child
  meets it. On a phone on its side the number line takes the top row and the switch and the
  choices share the row under it, so the line and every target fit 640 × 360 without
  scrolling. The number line's labels are 44 units (were 34) so they stay readable on a phone.
  The bar counts rounds finished out of the five that make a play (ADR 0007, ADR 0012), not the
  prototype's lesson step; the mock draws the fifth round, so its Next goes back to Home with
  Count chosen, as the prototype's does. `by-tens` is new: the prototype's third step, which
  no state drew. The number line, the three choices and the retry line stay as drawn, and
  `L2-007` was brought in line (ADR 0012). Home's Count group lists Skip-count.
- **Add together reconciled with `AGENTS.md` and `L2-008` (journey 9).** The prototype named the
  players "Maya" and "Dad"; Pibbo asks a child for nothing about themselves and `L2-008` #1
  shows a turn by a symbol and colour, never a name, so the players are a star and a moon
  (`.turn--star`, `.turn--moon`), and the player whose turn it is has a ring
  (`.player[aria-current="step"]`). The + and − buttons (`.round-btn`) were 44 px, 8 px apart, on
  both players at once; they are 64 px, 16 px apart, and only the player whose turn it is has
  them, beside the sum (`.turn-controls`). The turns are taken one after the other: `start` is
  the star's turn, the new `moon-turn` the moon's, each ended by Done (in the answer bar, where
  Check later stands), which needs at least one duck in that set, so a sum is 2 to 10 as
  `L2-008` asks. The three choices appear only when both sets are shown (`default`). Pibbo's
  line follows the step, as it is spoken: "Star’s turn. Add ducks to the pond.", "Moon’s turn.
  …", then "How many altogether?" (the prototype kept one sentence throughout). A wrong total
  counts every duck aloud, lighting each in turn (`picture--recount`; `retry` draws the fourth),
  as `L2-008` #3 asks. The sum is a polite live region and the choices a group named by the
  question, so a screen reader hears each change. The two sets stay side by side at every
  width, three ducks to a row on a phone held upright (two in the narrowest window) and one row
  of five on its side, so 5 + 5 fits a 360 × 640 phone either way up. The bar counts rounds
  finished out of the five that make a play; the mock draws the fifth, so Next goes back to
  Home's second Count screen (`home/counting-more`), where Add together is, as Leave does.
  Home's Count group lists Add together (ADR 0013).
- **Counting dance reconciled with `AGENTS.md` and `L2-009` (journey 10).** The prototype's
  speed switch (`switch__option--sm`, `.switch--quiet`) was 44 px tall, 4 px apart, and showed
  the chosen speed by colour alone; `.switch--speed` keeps the prototype's sunken tray but its
  two options are 64 px tall, 8 px apart inside it, and the chosen one carries a tick as well
  as its fill, as `.switch--step` (ADR 0014 still says 16 px apart). Slow and Fast form one
  radio group: one Tab stop, and the arrow keys move between them, so a keyboard works as a
  mouse does. The row of numbers is named ("Numbers 1 to 10"), the number the dance is on has
  `aria-current="step"` as well as its colour and underline, and Pibbo is "Pibbo dancing" while
  it dances. The dance counts 1 to 10 only (content, ADR 0014 #1); it has no wrong answer, so
  there is no `retry` state; and the next number comes at the touch that starts or resumes the
  dance (ADR 0014 #3), not one beat later. A hidden tab pauses the dance and nothing plays
  again until Keep dancing is touched (`L2-009` #7). `correct` has no controls: one dance makes
  one play and Next goes back to Home's Count group (ADR 0014 #1, `L2-009` #8). On a phone on
  its side the figure and numeral sit beside the row of numbers and the controls so all fit
  640 × 360 with no scrolling. The figure, the numeral, the row of numbers and the one control
  stay as drawn (ADR 0014). Home's Count group now has seven activities, more than the 6 a
  screen `L2-024` allows: `home/counting` shows five and a More picture
  (`.game-card--more`), and the new `home/counting-more` shows Add together, Counting dance
  and More, which goes back to the first screen.
- **Matching feedback.** Letter sounds, Big and small letters, and Words and pictures give each
  completed pair a shared corner shape as well as its prototype colour. A solid ring identifies
  the held card. A missed partner shows a dashed ring, including with reduced motion. Touching
  the held card again keeps it held (the prototype put it down): a touched letter is held and
  says its sound (`L2-010` #2, `L2-011` #2), so a second touch to hear it again, or a stray
  finger, never drops it. Each pair keeps the colour it was found in when the praise appears;
  the prototype dealt the colours again in data order at the end, so a pair could change colour
  as the round finished. A found card's name ends ", matched", so a screen reader hears what the
  colour and corner shape show.
- **Letter sounds reconciled with `L2-010` (journey 11).** The prototype is a pair match, four
  letters beside their four sounds, each sound beside a picture "as in" a word; its sound cards
  played no recording. `L2-010` asked for one sound played and three letters to choose from. The
  mock wins and `L2-010` now describes the pair match (ADR 0015): a touched sound says its
  recording, held letter or not. The prototype's "small shake" for a wrong partner had no class
  and no state: `.pair--miss` and the new `miss` state draw it, and reduced motion removes it. A
  wrong sound leaves the letter held (the prototype released it), so the child can try another
  sound at once (`L2-010` #3). c's sound is shown "/k/", as in both Letter sounds and Sound it
  out. Five rounds make a play: the states draw round 1, the bar counts rounds (1 of 5; the
  prototype showed a fixed 3 of 5 from Home), and Next starts the next round (`start`). After the
  fifth, Next goes back to Home with Read chosen, as in Sound it out (ADR 0008), never to another
  activity. Home's Read group lists Letter sounds after Sound it out. The prototype's two columns
  of 80 px pairs ran under the answer bar on a 360 × 640 phone and on a 640 × 360 one: upright,
  the letters now make one row and the sounds a second, each picture above its sound with a
  smaller speaker badge; on its side, all eight make one row of 60 px targets with no badge
  (the badge is a picture, not a control, and the card still says its sound).
- **Big and small letters reconciled with `L2-011` (journey 12).** The mock wins and `L2-011`
  describes the pair match (ADR 0017), with Letter sounds' rules: a wrong small letter shakes
  (`.pair--miss`, the `miss` state; reduced motion removes it) and the big letter stays held
  (the prototype released it, `L2-011` #3). A new `start` state draws the round as the app opens
  it, nothing matched (the frame's own default has A matched). Five rounds make a play: the bar
  counts rounds (1 of 5; the prototype showed a fixed 3 of 5) and Next starts the next round
  (`start`), never Letter sounds; after the fifth, Next goes back to Home with Read chosen. On a
  phone the columns become rows as in Letter sounds, and the Big and Small heads are hidden:
  they no longer sit over their columns and the bubble says which is which. The heads are
  hidden from screen readers at every width, since each column is a group named "Big letters"
  or "Small letters" and each card says "Big A" or "Small a".
- **Words and pictures fits the screen.** The prototype's 144 px cards (`tall`) made the page
  scroll at 1024 × 768 to reach the last row and the answer bar; here each card takes a quarter
  of the room left, so nothing scrolls during the round (*One thing at a time*). On a phone on
  its side, where two columns of four 60 px cards cannot fit, the words make one row above a
  row of their pictures. The round draws one theme, By the sea; Dress-up box is cast, not a
  separate design, and can be reviewed with `#theme=dress-up`. Next goes back to Home with
  Read chosen, as Leave does, not on to Spot the word.
- **Spell by sound reconciled with `L2-013` and ADR 0018 (journey 13).** The prototype's speakers were 40 px spans that did nothing; each is now a 60 px button that says the sound belonging to its box, and an empty box says it too (`L2-013` #3), shown briefly as `/u/` (`.speaker__sound`, `.box__sound`). A phone has no room for the speakers, so they are hidden and the empty boxes offer the sound. Upright, the picture sits beside the boxes with the letters under them; on its side the picture is hidden and the boxes and letters make one row, the word staying in the bubble; either way nothing scrolls. The progress bar counts the round in a play of five, as in Sound it out; Next starts the next round (after the fifth, Home with Read chosen), not Rhyme time.
- **Rhyme time on a phone and for a screen reader.** On a phone on its side the target card is a narrow column beside the four word cards, which make one row, so every card stays 60 px and Check is reached with no scrolling; the prototype's stacked layout and 2 × 2 grid would run under the answer bar at 320–360 px tall. Each card is a button named by its written word, so its picture has an empty text alternative rather than repeating it; the group of cards is named by the visible prompt. Rhyme time is not on Home: it is reached as game 4 of the Read lesson, so its bar shows 4 of 5. Opened directly, Next returns to Home, as Leave does.
- **Spot the word and Build a sentence outside a lesson.** Neither is a state the prototype
  lets a child stay in: as in its `finishGame`, Next on either correct state goes back to Home
  with Read chosen (`home/default.html`); a Build a sentence opened from the lesson still goes
  on to the lesson path. Spot the word's `default` is the start of a round (nothing found,
  0 of 5), and its bar shows 3 of 5, the prototype's step for a game outside a lesson. Build a
  sentence's pages keep 5 of 5, its place in the reading lesson. The frames' other samples
  (`?target=is`, `?target=a`, `?sentence=sun`, `?sentence=boat`) are URL variants of the same
  states, not extra state pages: sample words are the cast.
- **Spot the word and Build a sentence on phones.** So nothing scrolls during the activity,
  on a small upright phone Spot the word puts the target word and Found dots in the top row
  beside Leave and the progress bar; on a phone on its side it puts them beside the answer bar,
  and the story is a grid of equal columns at least 60 px wide instead of wrapping. On a
  phone on its side Build a sentence keeps the picture beside the strip and word bank. The
  prototype's arrangements overflow 360 x 640 and 640 x 360 by 35 to 88 px.
- **Spot the word and Build a sentence say their states.** The Found dots are one picture
  named "1 of 5 found"; a found word is named "The, found"; a placed word "Take back The"; a
  used tile, drawn blank, "cat, used"; the strip and bank are groups named "Your sentence" and
  "Words"; and the picture has a text alternative ("A cat sitting"). The prototype gave these
  no names, so a screen reader would hear a count, a state or a picture only through colour
  or not at all (*Said and shown*).
- **Activity shell (every activity page).** Kept on purpose, where the prototype's
  `ActivityShell` differs:
  - The speech bubble carries a picture of what is asked (`bubble__picture`: a pointing hand to
    touch, a question mark to choose) in Count the toys, Count and write and Sound it out, so the
    instruction is shown as well as said (`L2-025` #1); other activities show it in the round.
  - Praise starts with a tick, so "correct" is not carried by colour alone (`L2-036` #6).
  - Pibbo's mood follows the feedback: happy with none (including while dancing and when Pibbo
    models the answer after the third wrong one, so a wrong answer is neither praised nor
    dwelt on), cheer on correct, oops on retry and hint.
  - Each page has a visually hidden h1 with the activity's name, the progress bar is labelled
    "Game progress", and a bar that carries a message has `role="status"`, so a screen reader
    names the screen and the bar and hears the feedback (`L2-036`).
- **Guided lesson states.** Four files draw the four kinds of path a child meets: none done (`start`), some done in Reading (`default`) and in Counting (`counting`), and all done (`done`). The prototype's other eight counts of games done are the same layout with the tick, play and lock moved along, so they are drawn from the address (see *Opening the mocks*) rather than as more files.
- **Guided lesson text alternatives.** Each game button's name ends with its state ("done", "play now", "not yet") and the next game has `aria-current="step"`, because the prototype carried the state by an icon alone (*Said and shown*). The list is named "Five games in order". The footer is `role="status"` so the next game is announced when it changes, and its small Pibbo is `aria-hidden` so that announcement is only the words; Pibbo is named where it speaks, in the activities.
- **What do I know? questions.** Questions 3 (rhyme, `rhyme-question`) and 4 (bigger number, `number-question`) have their own state files; the prototype drew them from an argument. The ship question's picture is named "a ship". The ducks to count are a group, "Ducks to count", with each duck named "duck": the prototype gave them no name, and naming them "6 ducks" would say the answer. The choices are named by the question (`aria-labelledby="prompt"`), which the prototype's grid had no name for.
- **Pibbo's name says its mood where the mood carries meaning.** On the results Pibbo is "Pibbo cheering", and the four mood marks on the brand sheet are "Pibbo, Hello", "Pibbo, Hmm", "Pibbo, Oh!" and "Pibbo, Yay", so what is shown is also said; the prototype named every one "Pibbo". In the lockups the mark is hidden because the wordmark beside it already says "Pibbo"; the three app icons are named "Pibbo", as in the prototype.
- **Brand sheet.** The hero wordmark is the page's `h1`, so the sheet has one top heading above its four `h2`s; the prototype had none. The hero draws Pibbo happy; the other three moods are drawn in the moods row and can replace it from the address. Below 388 px wide the hero wordmark (136 px in the prototype) and, in a narrow tile, the wordmark on sun (72 px) shrink with the width so neither overflows a phone (*Every width*); at 1024 × 768 both are the prototype's size.
- **The progress bar.** In an activity whose journey is built (Count the toys to Spell by sound)
  the bar counts the rounds of one five-round play (ADRs 0007 to 0018), so each page draws the
  round it shows; Counting dance, one dance to a play, draws its lesson step. In a guided lesson
  `mock.js` shows the lesson's step. Rhyme time, Words and pictures, Spot the word and Build a
  sentence have no journey yet: they draw their step in the reading lesson, and Spot the word,
  in no lesson, draws the prototype's 3 of 5. The prototype showed 3 of 5 for every game opened
  from Home, which stands for nothing the child did. What the bar shows for a game outside a
  lesson before its journey is built is not decided.

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

| Screen | default | loading | empty | error | reading-more | counting | counting-more | first-visit | offline | start | done | counted | choose | correct | retry | modelled | written | hint | picked | by-twos | by-tens | moon-turn | playing | held | miss | ready | pick | magic-e | magic-e-on | syllables | groups | clusters | first-two | first-two-retry | full | all-chosen | model | answered | counting-question | rhyme-question | number-question | letter-question | adding-question | results | results-none | gate | gate-progress | confirm | cleared | Requirements |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Home · Choose an activity (`home`) | [✅](pages/home/default.html) | ➖ | ➖ | ➖ | [✅](pages/home/reading-more.html) | [✅](pages/home/counting.html) | [✅](pages/home/counting-more.html) | [✅](pages/home/first-visit.html) | [✅](pages/home/offline.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-023`, `L2-024`, `L2-035`, `L2-033`, `L2-037` |
| Activity placeholder (`activity-placeholder`) | [✅](pages/activity-placeholder/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-024` |
| Guided lesson (`guided-lesson`) | [✅](pages/guided-lesson/default.html) | ➖ | ➖ | ➖ |  | [✅](pages/guided-lesson/counting.html) |  |  |  | [✅](pages/guided-lesson/start.html) | [✅](pages/guided-lesson/done.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-022` |
| Count the toys (`count-the-toys`) | [✅](pages/count-the-toys/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/count-the-toys/start.html) |  | [✅](pages/count-the-toys/counted.html) | [✅](pages/count-the-toys/choose.html) | [✅](pages/count-the-toys/correct.html) | [✅](pages/count-the-toys/retry.html) | [✅](pages/count-the-toys/modelled.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-001`, `L2-002`, `L2-025`, `L2-026` |
| Count and write (`count-and-write`) | [✅](pages/count-and-write/default.html) | ➖ | ➖ | ➖ |  | [✅](pages/count-and-write/counting.html) |  |  |  | [✅](pages/count-and-write/start.html) |  |  |  | [✅](pages/count-and-write/correct.html) |  | [✅](pages/count-and-write/modelled.html) | [✅](pages/count-and-write/written.html) | [✅](pages/count-and-write/hint.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-003`, `L2-004`, `L2-025`, `L2-026` |
| Which is bigger? (`which-is-bigger`) | [✅](pages/which-is-bigger/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  | [✅](pages/which-is-bigger/correct.html) | [✅](pages/which-is-bigger/retry.html) |  |  |  | [✅](pages/which-is-bigger/picked.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-005`, `L2-025` |
| Rocket countdown (`rocket-countdown`) | [✅](pages/rocket-countdown/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/rocket-countdown/start.html) |  |  |  | [✅](pages/rocket-countdown/correct.html) | [✅](pages/rocket-countdown/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-006`, `L2-025` |
| Skip-count (`skip-count`) | [✅](pages/skip-count/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/skip-count/start.html) |  |  |  | [✅](pages/skip-count/correct.html) | [✅](pages/skip-count/retry.html) |  |  |  |  | [✅](pages/skip-count/by-twos.html) | [✅](pages/skip-count/by-tens.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-007`, `L2-025` |
| Add together (`add-together`) | [✅](pages/add-together/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/add-together/start.html) |  |  |  | [✅](pages/add-together/correct.html) | [✅](pages/add-together/retry.html) |  |  |  | [✅](pages/add-together/picked.html) |  |  | [✅](pages/add-together/moon-turn.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-008`, `L2-025` |
| Counting dance (`counting-dance`) | [✅](pages/counting-dance/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/counting-dance/start.html) |  |  |  | [✅](pages/counting-dance/correct.html) |  |  |  |  |  |  |  |  | [✅](pages/counting-dance/playing.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-009`, `L2-025` |
| Letter sounds (`letter-sounds`) | [✅](pages/letter-sounds/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/letter-sounds/start.html) |  |  |  | [✅](pages/letter-sounds/correct.html) |  |  |  |  |  |  |  |  |  | [✅](pages/letter-sounds/held.html) | [✅](pages/letter-sounds/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-010`, `L2-025`, `L2-026` |
| Big and small letters (`big-and-small-letters`) | [✅](pages/big-and-small-letters/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/big-and-small-letters/start.html) |  |  |  | [✅](pages/big-and-small-letters/correct.html) |  |  |  |  |  |  |  |  |  | [✅](pages/big-and-small-letters/held.html) | [✅](pages/big-and-small-letters/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-011`, `L2-025`, `L2-026` |
| Words and pictures (`words-and-pictures`) | [✅](pages/words-and-pictures/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/words-and-pictures/start.html) |  |  |  | [✅](pages/words-and-pictures/correct.html) |  |  |  |  |  |  |  |  |  | [✅](pages/words-and-pictures/held.html) | [✅](pages/words-and-pictures/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-018`, `L2-025`, `L2-026` |
| Sound it out (`sound-it-out`) | [✅](pages/sound-it-out/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/sound-it-out/start.html) |  |  |  | [✅](pages/sound-it-out/correct.html) | [✅](pages/sound-it-out/retry.html) | [✅](pages/sound-it-out/modelled.html) |  |  |  |  |  |  |  |  |  | [✅](pages/sound-it-out/ready.html) | [✅](pages/sound-it-out/pick.html) | [✅](pages/sound-it-out/magic-e.html) | [✅](pages/sound-it-out/magic-e-on.html) | [✅](pages/sound-it-out/syllables.html) | [✅](pages/sound-it-out/groups.html) | [✅](pages/sound-it-out/clusters.html) | [✅](pages/sound-it-out/first-two.html) | [✅](pages/sound-it-out/first-two-retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-012`, `L2-014`, `L2-015`, `L2-016`, `L2-025`, `L2-026` |
| Spell by sound (`spell-by-sound`) | [✅](pages/spell-by-sound/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  | [✅](pages/spell-by-sound/correct.html) | [✅](pages/spell-by-sound/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/spell-by-sound/full.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-013`, `L2-025`, `L2-026` |
| Rhyme time (`rhyme-time`) | [✅](pages/rhyme-time/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/rhyme-time/start.html) |  |  |  | [✅](pages/rhyme-time/correct.html) | [✅](pages/rhyme-time/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/rhyme-time/all-chosen.html) | [✅](pages/rhyme-time/model.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |
| Spot the word (`spot-the-word`) | [✅](pages/spot-the-word/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  | [✅](pages/spot-the-word/correct.html) |  |  |  |  |  |  |  |  |  |  | [✅](pages/spot-the-word/miss.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | `L2-019`, `L2-025`, `L2-026` |
| Build a sentence (`build-a-sentence`) | [✅](pages/build-a-sentence/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  | [✅](pages/build-a-sentence/start.html) |  |  |  | [✅](pages/build-a-sentence/correct.html) | [✅](pages/build-a-sentence/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/build-a-sentence/full.html) |  | [✅](pages/build-a-sentence/model.html) |  |  |  |  |  |  |  |  |  |  |  |  | `L2-020`, `L2-025`, `L2-026` |
| What do I know? (`progress-check`) | [✅](pages/progress-check/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  | [✅](pages/progress-check/correct.html) | [✅](pages/progress-check/retry.html) |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/progress-check/model.html) | [✅](pages/progress-check/answered.html) | [✅](pages/progress-check/counting-question.html) | [✅](pages/progress-check/rhyme-question.html) | [✅](pages/progress-check/number-question.html) | [✅](pages/progress-check/letter-question.html) | [✅](pages/progress-check/adding-question.html) | [✅](pages/progress-check/results.html) | [✅](pages/progress-check/results-none.html) |  |  |  |  | `L2-023`, `L2-025`, `L2-026` |
| For grown-ups (`grown-up`) | [✅](pages/grown-up/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  | [✅](pages/grown-up/gate.html) | [✅](pages/grown-up/gate-progress.html) | [✅](pages/grown-up/confirm.html) | [✅](pages/grown-up/cleared.html) | `L2-029`, `L2-037` |
| Pibbo brand (`brand`) | [✅](pages/brand/default.html) | ➖ | ➖ | ➖ |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |

<!-- coverage:end -->
