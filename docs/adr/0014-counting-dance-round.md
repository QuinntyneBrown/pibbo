# 0014: Counting dance: one recording a beat, pause, speed and a second screen on Home

**Status:** Accepted (journey 10)

## Context

The Counting dance mocks were transcribed from the prototype. They draw Pibbo large beside a
big numeral, a row of the numbers 1 to 10 with the ones already said marked, one control that
reads Start the music, Pause or Keep dancing, and a Slow and Fast switch. The dance ends with
"You danced all the way to 10!" and Next. `L2-009` asks for a rhythm with a number spoken and
shown on each beat, a pause that stops within 200 ms and resumes from the same number, a beat
that still shows with the sound off, and a figure that keeps still with reduced motion. The
design named `CountToMusicPage`, `BeatFigureComponent` (`pb-beatfigure`), `beatRules` and a
`BeatScheduler`. The prototype's speed switch was 44 px tall, 4 px apart, colour only. Home's
Count group already showed six activities, the most `L2-024` allows on one screen.

## Decision

1. **The mock wins.** One control plays and pauses: Start the music, Pause, Keep dancing. The
   dance counts from 1 to 10 (`COUNTING_DANCE.last`: content, not a rule). Slow is 900 ms a
   beat and Fast 600 ms (`COUNTING_DANCE.beatMs`); a change of speed takes effect from the next
   beat. One dance makes one play: Next goes back to Home.
2. **One recording a beat.** Each beat plays one recording, the number said over that beat of
   the rhythm (`/recordings/dance/<n>.wav`). There is no music track under the speech, so one
   sound at a time holds by construction and nothing can pile up. Beats are scheduled with
   `CLOCK.after`, one at a time; each beat's recording stops the one before it.
3. **Pause.** Pause cancels the next beat and stops the recording in the same task, well within
   200 ms. Keep dancing plays the next number at once: no number is said twice or skipped.
   The tab being hidden is a pause: nothing plays on return until the child touches Keep
   dancing.
4. **The beat is shown.** Each beat shows its numeral, marks it in the row (`chant__beat--now`,
   `aria-current="step"`; the ones before are `--said`) and makes the numeral pop. While the
   music plays Pibbo cheers, and sways (`dance__pibbo--sway`) on every other beat. With reduced
   motion the sway and the pop are removed: Pibbo keeps one pose and the numeral change alone
   shows the beat. With the sound off every beat still shows.
5. **The speed switch is redrawn** (`.switch--speed`, as `.switch--step`): 64 px targets 16 px
   apart, the chosen speed ticked.
6. **The round is a pure state machine in `@pibbo/domain/counting`** (`DanceRound`: `ready`,
   `playing`, `paused`, `done`) with `startDance`, `playDance`, `danceBeat`, `pauseDance`
   and `danceAt`. The page only schedules beats and plays recordings; there is no separate
   scheduler service.
7. **Names.** The page is `CountingDance` (`pb-counting-dance`, route `/count/dance`); the
   presentation component is `Dance` (`pb-dance`): the figure, the numeral, the row, the
   control and the switch.
8. **Home's second screen.** A group with more than 6 activities shows them 5 to a screen
   with a More picture last (`.game-card--more`), which speaks "More" and shows the next
   screen; the last screen's More goes back to the first. `L2-024` was brought in line; the
   rule is `activityScreen` in `@pibbo/domain`.
9. **Recordings are placeholders**, short silences as in ADR 0007: the instruction, the ten
   beats, "You danced all the way to", "More" and the activity's name on Home. Their loudness
   (`L2-009` #5) is checked when real recordings replace them; it is an open question in the
   design. The e2e fixture fails a spec that asks for the microphone or the camera
   (`L2-009` #6).

## Consequences

The design's `BeatScheduler` and `RoundFeedback` are not built: the dance has no wrong
answer, and the page's `CLOCK.after` chain is the scheduler. Moving Add together and Counting
dance to Home's second screen means a child touches More to reach them.
