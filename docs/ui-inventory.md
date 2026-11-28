# UI inventory: every Magic Patterns UI and its components

Source: the Magic Patterns MagicOS project "Pibbo Early Learning App" (osId
`eDDkMMZM4QuKmuCTaj4fkB`), one canvas with two prototypes: "Pibbo Brand" (one frame) and
"Pibbo App" (18 frames plus its navigation shell). The mocks in `docs/mocks/` and the design
system in `docs/design-system/` are derived from this project.

How to use it: each item is a checkbox. Tick it when the Angular app implements that
component or state as drawn. Items name what the source renders, with its label or text;
the shared Magic Patterns component, where one is used, is noted in parentheses. Sample
words, pictures and numbers are the cast the frame draws, not rules.

Every game frame sits inside the shared **ActivityShell** (top bar, Pibbo's prompt, game area,
answer bar). Its parts are listed once under [Shared components](#shared-components) and in
each game's Layout as the frame-specific text it passes.

## Contents

- [App shell and navigation (Pibbo App prototype)](#app-shell-and-navigation)
- [Logo & Wordmark](#logo--wordmark)
- [Home · Choose a Game](#home--choose-a-game)
- [Guided Lesson](#guided-lesson)
- [Count the Toys](#count-the-toys)
- [Count and Write to 20](#count-and-write-to-20)
- [Which Is Bigger](#which-is-bigger)
- [Rocket Countdown](#rocket-countdown)
- [Skip-Count](#skip-count)
- [Add Together](#add-together)
- [Counting Dance](#counting-dance)
- [Letter Sounds](#letter-sounds)
- [Big and Small Letters](#big-and-small-letters)
- [Words and Pictures](#words-and-pictures)
- [Sound It Out](#sound-it-out)
- [Spell by Sound](#spell-by-sound)
- [Rhyme Time](#rhyme-time)
- [Spot the Word](#spot-the-word)
- [Build a Sentence](#build-a-sentence)
- [Progress Check](#progress-check)
- [Shared components](#shared-components)

## App shell and navigation

Prototype `kEXWdPBhS1LJVpJoSCC6YH`. Draws no UI of its own; it routes between frames.

### Layout
- [ ] Designed for a tablet held sideways (1024 × 768), every screen reflowing down to a phone
- [ ] Frame folders: Start (Home, Guided Lesson, Progress Check), Reading games (8), Counting games (7)

### Components
- [ ] Home opens a game, the guided lesson for the chosen subject, or the progress check
- [ ] A game opened from Home: leaving or finishing returns to Home
- [ ] A game opened from the lesson: leaving returns to the lesson; finishing advances the lesson step and returns to it
- [ ] In-lesson progress bar shows the game's position in the lesson (1 to 5)
- [ ] Every game starts fresh (nothing counted, picked or placed)
- [ ] Sound It Out serves seven journeys by word (map, ship, stop, cape, boat, night, sunset)
- [ ] Progress Check "Try it" opens the suggested game; "Home" returns home

### States drawn
- [ ] Child name argument ("Maya") carried to Home, Add Together and Progress Check

## Logo & Wordmark

Frame `hJsTNgw8Kuq2xNiY8yArB6` (prototype "Pibbo Brand" `4aFNgJX6NFacCvnSiaCvwt`). A brand
sheet, not a child-facing screen.

### Layout
- [ ] Primary lockup section
- [ ] Lockups section
- [ ] Moods section
- [ ] Colour and type section (two columns on wide screens)

### Components
- [ ] Eyebrow "Pibbo · brand basics"
- [ ] Hero Pibbo mascot, 168 px (Pibbo)
- [ ] Hero wordmark, 136 px (Wordmark)
- [ ] Tagline "Little steps in reading and counting."
- [ ] Heading "Lockups" with note on colour use
- [ ] Lockup "Horizontal · on sun": Pibbo in an ink circle beside the wordmark (Pibbo, Wordmark)
- [ ] Lockup "Stacked · on ink": cheering Pibbo over white wordmark (Pibbo, Wordmark)
- [ ] Lockup "Wordmark alone · on berry": white wordmark (Wordmark)
- [ ] App icon tile, sky, Pibbo 112 px, caption "App icon" (Pibbo)
- [ ] Home screen icon tile, Pibbo 64 px, caption "Home screen" (Pibbo)
- [ ] Small icon tile, Pibbo 32 px, caption "Small" (Pibbo)
- [ ] Heading "Pibbo guides every game" with note "Four faces… Pibbo never looks sad"
- [ ] Mood card "Hello" (happy): "Asks the question and waits, patiently." (Pibbo)
- [ ] Mood card "Hmm" (think): "Offers a hint after a pause." (Pibbo)
- [ ] Mood card "Oh!" (oops): "A near miss. “Let’s try that one again.”" (Pibbo)
- [ ] Mood card "Yay" (cheer): "A right answer, a finished game." (Pibbo)
- [ ] Heading "Colour does a job" with swatch list: Sun, Berry, Sky, Leaf, Ink, Paper, each with role and hex
- [ ] Heading "Two typefaces"
- [ ] Type card Fredoka: "Let’s count!", "buttons, titles, Pibbo’s voice"
- [ ] Type card Andika: "a g sh oa", "single-storey a and g, as children learn to write them"

### States drawn
- [ ] Hero mood selectable: happy, think, cheer, oops
- [ ] Tagline editable

## Home · Choose a Game

Frame `qWbazJPhFtQFND16jvAWTf`.

### Layout
- [ ] Top bar
- [ ] Lesson and check row (lesson card wide, check card narrow; stacked on a phone)
- [ ] Subject switch
- [ ] Game groups grid (2 columns phone, 3 tablet, 5 desktop)

### Components
- [ ] Wordmark, 40 px (Wordmark)
- [ ] Star total badge (sum of stars across games)
- [ ] Child badge: initial in a leaf circle and the name "Maya"
- [ ] Lesson card, berry for Reading / sky for Counting
- [ ] Lesson card greeting "Hi Maya! Today’s lesson"
- [ ] Lesson title ("Sounds that team up" / "Numbers up and down")
- [ ] Lesson step dots: done (sun, long), current (white, long), later (faint, short)
- [ ] Lesson button "Start" / "Keep going" with arrow (Chunky, sun)
- [ ] Lesson card Pibbo, happy, 150 px, hidden on a phone (Pibbo)
- [ ] Check card "What do I know?" / "A quick game that shows how much you’ve learned." with thinking Pibbo (Pibbo)
- [ ] Subject tabs "Reading" / "Counting" (selected tab takes the subject colour)
- [ ] Group heading per group (Reading: Letters, Sounds into words, Words and sentences; Counting: Counting, Numbers)
- [ ] Game tile: glyph band (e.g. "map", "1 2 3"), title, three stars filled by progress
- [ ] Reading lists 14 game tiles; Counting lists 7

### States drawn
- [ ] Subject: read / count
- [ ] Lesson progress 0 to 5 ("Start" at 0, "Keep going" after)

## Guided Lesson

Frame `5AdBwAcgFZqygAN7r2paEj`.

### Layout
- [ ] Background tinted by subject (berry-soft / sky-soft)
- [ ] Header
- [ ] Lesson path: five steps in a row on wide screens (zig-zag), a column on a phone
- [ ] Footer bar

### Components
- [ ] Back button, arrow, label "Back home" (Chunky, white, icon)
- [ ] Eyebrow "Reading lesson" / "Counting lesson"
- [ ] Lesson title
- [ ] Step node, done: green circle with tick
- [ ] Step node, now: larger subject-coloured circle with play icon
- [ ] Step node, later: white circle with lock, disabled
- [ ] Connector lines between nodes, green up to the current step
- [ ] Step caption "Game N" and game title
- [ ] Footer Pibbo, 56 px (Pibbo)
- [ ] Footer text "Up next: <game>"
- [ ] Button "Play game N" (Chunky, berry/sky)

### States drawn
- [ ] Subject: read / count
- [ ] Current step 0 to 4
- [ ] Lesson done: cheering Pibbo, "Lesson done! You earned a star.", star, "Back home" (Chunky, leaf)

## Count the Toys

Frame `3hcKaPmwMhuDctdU1Dz5XN`. Counting.

### Layout
- [ ] ActivityShell, counting (sky) (ActivityShell)
- [ ] Prompt "Tap each toy once to count it." then "How many toys are there?"
- [ ] Rug and count panel side by side on desktop, stacked otherwise
- [ ] Answer bar with Check (Chunky)

### Components
- [ ] Rug (sky-soft area) with toys scattered at fixed spots
- [ ] Toy button: teddy, duck or ball picture (Picture)
- [ ] Counted toy: dimmed picture with a numbered badge (1, 2, 3…) that pops in
- [ ] Counted toy is disabled (one touch, one number)
- [ ] Count panel "Counted" with the running numeral
- [ ] "How many?" with three numeral choices (total −1, total, total +1)
- [ ] Selected numeral choice filled sky

### States drawn
- [ ] Total 3 to 10, counted 0 to total
- [ ] Counting in progress / all counted (choices shown)
- [ ] Correct: "Yes! 7 toys." with Next
- [ ] Try again: "Hmm, let’s count them again." resets the count

## Count and Write to 20

Frame `tnYweeoJu9A6giLgvwYCdA`. Counting.

### Layout
- [ ] ActivityShell, counting (ActivityShell)
- [ ] Prompt "Count along! Tap N." then "What comes next? Write 14."
- [ ] Number track and write pad side by side on desktop

### Components
- [ ] Number track 1 to 20 (5 columns phone, 10 wider)
- [ ] Track cell states: done (sky filled), next (ringed, tappable), later (faint), target (dashed "?")
- [ ] Target cell shows the numeral once something is written
- [ ] Write pad: baseline and dashed outline of the target numeral
- [ ] Finger strokes drawn on the pad
- [ ] "Clear" button with eraser, shown once there are strokes
- [ ] Write pad dimmed until the writing step

### States drawn
- [ ] Target 2 to 20, reached 0 to 19
- [ ] Counting phase / writing phase
- [ ] Correct: "14! Lovely writing." with Next
- [ ] Try again (default retry text) clears the strokes

## Which Is Bigger

Frame `xmQrw2RZJpLoPt8jexL9rV`. Counting.

### Layout
- [ ] ActivityShell, counting (ActivityShell)
- [ ] Prompt "Which number is bigger?"
- [ ] Two cards side by side

### Components
- [ ] Number card (left 7, right 4) with large numeral
- [ ] Ten-frame under each numeral, dots for the quantity
- [ ] Selected card: sky ring
- [ ] Winning card on correct: leaf ring, leaf numeral and dots

### States drawn
- [ ] Left/right 0 to 10; picked none / left / right
- [ ] Correct: "7 is bigger than 4!"
- [ ] Try again: "Look at the dots. Which has more?"

## Rocket Countdown

Frame `kn8uZkTTPu5QAes1YGB1A8`. Counting.

### Layout
- [ ] ActivityShell, counting, no Check button (ActivityShell, hideCheck)
- [ ] Prompt "We’re at 6. What comes next going down?" then "Blast off!"
- [ ] Track and choices beside the rocket bay on wider screens

### Components
- [ ] Countdown track from 10 to 0: said numbers sky, current ringed, unsaid shown as "·"
- [ ] Three numeral choice buttons
- [ ] Rocket bay with ground strip
- [ ] Rocket that rises a notch per number counted, flame once counting has begun

### States drawn
- [ ] From 3 to 20, at 0 to from
- [ ] Launched: choices hidden, rocket at the top
- [ ] Correct: "3, 2, 1… blast off!"
- [ ] Try again: "Going down from 6… try again."
- [ ] Reduced motion: rocket does not move

## Skip-Count

Frame `vdEDZtjjyVBAUA3v7LwW8U`. Counting.

### Layout
- [ ] ActivityShell, counting, no Check (ActivityShell, hideCheck)
- [ ] Prompt "Hop by 5s. Where do we land next?" then "You counted by 5s to 50!"

### Components
- [ ] Count-by switch "By 2s" / "By 5s" / "By 10s" (radio group; changing restarts)
- [ ] Number line with 11 points
- [ ] Hop arcs drawn for each hop made
- [ ] Reached points labelled with their value; next point "?" ringed
- [ ] Three numeral choice buttons

### States drawn
- [ ] By 2 / 5 / 10, hops 0 to 10
- [ ] Correct: "Hop, hop, hop — all the way to 50!"
- [ ] Try again: "Count on 5 more from 20."

## Add Together

Frame `mkU449mJhaPU6ssfoBLky8`. Counting, played with someone.

### Layout
- [ ] ActivityShell, counting (ActivityShell)
- [ ] Prompt "Take turns adding ducks to the pond. How many altogether?"
- [ ] Two player panels with "+" between; sum row below

### Components
- [ ] Player panel (sky) "Maya adds 3"
- [ ] Player panel (sun) "Dad adds 4"
- [ ] Minus button per player ("<name> takes one away"), disabled at 0
- [ ] Plus button per player ("<name> adds one"), disabled at 5
- [ ] Ducks in each panel, one per count (Picture)
- [ ] Sum "3 + 4 = ?" with the answer box
- [ ] Three numeral choices; selected fills sky and fills the answer box

### States drawn
- [ ] Counts 0 to 5 each; partner name editable
- [ ] Correct: answer box turns leaf, "3 and 4 make 7! Great teamwork."
- [ ] Try again: "Count all the ducks together, one by one."

## Counting Dance

Frame `goqC7yjhpfWZMjk14jJLbw`. Counting.

### Layout
- [ ] ActivityShell, counting, no Check (ActivityShell, hideCheck)
- [ ] Prompt "Dance and say each number with me!"

### Components
- [ ] Dancing Pibbo, 150 px, sways on each beat (Pibbo)
- [ ] Big numeral of the current beat ("♪" before the start), announced politely
- [ ] Chant row of numbers 1 to 10 (or 20): said, current, to come
- [ ] Play/pause button "Start the music" / "Pause" / "Keep dancing" (Chunky, sky)
- [ ] Speed switch "slow" / "fast" (radio group)

### States drawn
- [ ] Up to 10 / 20; beat 0 to 20; playing on/off; tempo slow/fast
- [ ] Playing: Pibbo cheers
- [ ] Correct at the end: "You danced all the way to 10!"
- [ ] Reduced motion: Pibbo does not sway

## Letter Sounds

Frame `3wxvUaHV82kSHpo6v6bP3Q`. Reading.

### Layout
- [ ] ActivityShell, reading (berry), no Check (ActivityShell, hideCheck)
- [ ] Prompt "Tap a letter, then the sound it makes."
- [ ] Two matching columns (PairMatch)

### Components
- [ ] Letter tiles m, s, t, c (PairMatch)
- [ ] Sound tiles, shuffled: speaker icon, sound (/m/, /s/, /t/, /k/), picture (map, sun, teddy, cat) (PairMatch, Picture)
- [ ] Matched pair takes its own colour

### States drawn
- [ ] Pairs found 0 to 4
- [ ] Correct: "You know your letter sounds!"

## Big and Small Letters

Frame `ssCmdyySHgJieyyT6RSNsG`. Reading.

### Layout
- [ ] ActivityShell, reading, no Check (ActivityShell, hideCheck)
- [ ] Prompt "Find each big letter’s small letter."
- [ ] Column headings "Big" and "Small"

### Components
- [ ] Uppercase tiles (A B D G) (PairMatch)
- [ ] Lowercase tiles, shuffled (PairMatch)

### States drawn
- [ ] Letter sets "A B D G", "M N H R", "E F Q T"
- [ ] Pairs found 0 to 4
- [ ] Correct: "Every letter found its partner!"

## Words and Pictures

Frame `i8mQ2u4bAv95bb92nf7tc5`. Reading.

### Layout
- [ ] ActivityShell, reading, no Check (ActivityShell, hideCheck)
- [ ] Prompt "By the sea! Read a word, then tap its picture."
- [ ] Tall matching columns (PairMatch, tall)

### Components
- [ ] Word tiles (boat, ship, sun, sunset) (PairMatch)
- [ ] Picture tiles, shuffled (PairMatch, Picture)

### States drawn
- [ ] Themes "By the sea" / "Dress-up box" (hat, cap, cape, teddy)
- [ ] Pairs found 0 to 4
- [ ] Correct: "You read all the by the sea words!"

## Sound It Out

Frame `7f2gDTETEj5wz2wj8j3k6S`. Reading. One engine for seven words.

### Layout
- [ ] ActivityShell, reading; Check only in the pick phase (ActivityShell)
- [ ] Prompts: "Tap each part and say its sound." / "Tap “sun” and clap it." / "Now say the sounds fast to read the word." / "Which picture is “ship”?"

### Components
- [ ] Rule line with glyph (e.g. "sh Two letters, one sound")
- [ ] Magic e origin chip: picture and "cap" → "add a quiet e" (cape only) (Picture)
- [ ] Sound tiles, one per part (letters, teams like "sh"/"oa"/"igh", syllables)
- [ ] Sound tile states: heard (berry), next (ringed), not yet (white), silent e (muted)
- [ ] Sound caption under each heard tile (/sh/, /ā/, "quiet", "clap 1")
- [ ] Blend bar that fills per sound and sweeps on blend
- [ ] "Read it fast" button, enabled once all parts heard (Chunky, berry)
- [ ] Three picture choices in the pick phase (Picture)
- [ ] Selected picture ringed berry; right picture ringed leaf on correct

### States drawn
- [ ] Words: map, ship, stop, cape, boat, night, sunset
- [ ] Parts heard 0 to all
- [ ] Phase: sound / pick
- [ ] Correct: "You read “ship”!"
- [ ] Try again: "Read it again, then look closely."

## Spell by Sound

Frame `dgKcKTaV9T9eEuNaux7wcq`. Reading.

### Layout
- [ ] ActivityShell, reading (ActivityShell)
- [ ] Prompt "Listen: “sun.” Pick a letter for each sound." then "Does it say the word? Check it!"
- [ ] Picture beside the boxes and bank on wider screens

### Components
- [ ] Word picture card (Picture)
- [ ] Letter box per sound: filled, next (dashed berry), empty (dashed)
- [ ] Tapping a filled box removes it and the letters after it
- [ ] Speaker chip under each box ("Sound N")
- [ ] Letter bank of six letters

### States drawn
- [ ] Words: sun, map, cat; letters filled
- [ ] Correct: boxes turn leaf, "s – u – n. You spelled “sun”!"
- [ ] Try again: "Say it slowly. Which sound doesn’t match?"

## Rhyme Time

Frame `oyGFSwVHG2Nz2m28fZ8sqi`. Reading.

### Layout
- [ ] ActivityShell, reading (ActivityShell)
- [ ] Prompt "Which words rhyme with “cat”? Find them all."
- [ ] Target card beside the option grid on wider screens

### Components
- [ ] Target card (berry): cat picture and "cat" with "at" underlined (Picture)
- [ ] Option cards hat, sun, bat, map: picture and word, toggle on/off (Picture)
- [ ] Selected option: berry ring and tick badge
- [ ] Rhyming options on correct: leaf ring and leaf tick

### States drawn
- [ ] Chosen words (default "hat")
- [ ] Correct: "Cat, hat, bat — they all end in “at”!"
- [ ] Try again: "Listen to the ends of the words: c-at…"

## Spot the Word

Frame `1oVngqwpmYBXPpSLJSYCpS`. Reading.

### Layout
- [ ] ActivityShell, reading, no Check (ActivityShell, hideCheck)
- [ ] Prompt "Find every “the” in the story."
- [ ] Target and counter beside the story page on wider screens

### Components
- [ ] Target word chip "the" (berry)
- [ ] "Found" counter: one dot per occurrence, leaf when found
- [ ] Story page: "The cat is on the mat. A ship is on the sea. The sun is up and the cat has a nap."
- [ ] Each word a button; found words highlighted sun
- [ ] A wrong word greys briefly

### States drawn
- [ ] Target: the / is / a; found 0 to 4
- [ ] Correct: "You found “the” 5 times!"

## Build a Sentence

Frame `3mB6d7j8yJagSd2CagJNKf`. Reading.

### Layout
- [ ] ActivityShell, reading (ActivityShell)
- [ ] Prompt "Look at the picture. Put the words in order to tell about it."
- [ ] Picture beside the strip and bank on wider screens

### Components
- [ ] Scene picture card (Picture)
- [ ] Sentence strip with placeholder "Tap words to build your sentence"
- [ ] Placed word chips; tapping one removes it
- [ ] Word bank including a distractor (e.g. "hat"); used words leave a blank slot

### States drawn
- [ ] Sentences "The cat can sit.", "I see the sun.", "The boat is big."; placed 0 to 5
- [ ] Correct: strip turns leaf, "“The cat can sit.” What a great sentence!"
- [ ] Try again: "Read it out loud. Does it sound right?"

## Progress Check

Frame `uqsXti2BwppQA9k9zEtnFN`.

### Layout
- [ ] Quiz view in ActivityShell, coloured by each question's subject (ActivityShell)
- [ ] Results view: sun header, two subject columns

### Components
- [ ] Question 1 (read): "Which word goes with the picture?" ship picture; sip / ship / hip (Picture)
- [ ] Question 2 (count): "How many ducks?" six ducks; 5 / 7 / 6 (Picture)
- [ ] Question 3 (read): "Which one rhymes with “hat”?" picture options sun / bat / map (Picture)
- [ ] Question 4 (count): "Which number is bigger?" 6 / 9 / 3
- [ ] Option button; selected ringed in the subject colour
- [ ] Progress bar 1 to 4 across the questions
- [ ] Results: cheering Pibbo, 120 px (Pibbo)
- [ ] Results heading "Look what you can do, Maya!"
- [ ] Results suggestion "You’re ready for vowel teams — like oa in “boat.”"
- [ ] "Try it" with arrow (Chunky, ink)
- [ ] "Home" (Chunky, white)
- [ ] Results columns "Reading" and "Counting": each game's glyph, title and three stars

### States drawn
- [ ] View: quiz / results; question 0 to 3
- [ ] Correct: "Yes!" then the next question
- [ ] Wrong: "Good try! On to the next one." (moves on; nothing repeated)

## Shared components

From the project's `shared/` folder.

- [ ] **ActivityShell**: leave button "Leave game" (Chunky white icon, X); progress bar coloured by subject; Pibbo (72 px) whose mood follows feedback (happy, cheer, oops); prompt speech bubble with "Hear it again" speaker button; game area; answer bar with Check (disabled until ready, or hidden); correct bar (leaf, praise, "Next"); try-again bar (sun, retry text, "Try again"); bar slides in, fades only under reduced motion. Used by: every game frame and Progress Check (quiz).
- [ ] **Chunky**: the one press-down button; tones sky, berry, leaf, sun, ink, white; sizes md, lg, icon; disabled state. Used by: ActivityShell, Home, Guided Lesson, Counting Dance, Sound It Out, Progress Check.
- [ ] **Pibbo**: the sun-chick mascot SVG with moods happy, cheer, think, oops. Used by: Logo & Wordmark, Home, Guided Lesson, Counting Dance, Progress Check, ActivityShell.
- [ ] **Wordmark**: lowercase "pibbo" with a seed-and-leaf i dot; ink or white. Used by: Logo & Wordmark, Home.
- [ ] **Picture**: sticker illustration that blends into its ground. Used by: Count the Toys, Add Together, Letter Sounds, Words and Pictures, Sound It Out, Spell by Sound, Rhyme Time, Build a Sentence, Progress Check.
- [ ] **PairMatch**: two columns; tap left (held, berry), then its partner on the right; a wrong partner shakes; each found pair takes its own colour and locks; tall variant. Used by: Letter Sounds, Big and Small Letters, Words and Pictures.
- [ ] **Journeys data** (`shared/data/journeys.ts`): 21 games with subject, group, title, glyph and stars, and the two lessons. Used by: app shell, Home, Guided Lesson, Progress Check.
- [ ] **useArgState** (`shared/hooks/`): state seeded from a frame argument. Used by: every frame with controls (not a UI).
