# 0025: Guided lesson: the path, and the one thing a lesson keeps on the device

**Status:** Accepted (journey 22)

## Context

The guided lesson mocks (`start`, `default`, `counting`, `done`) draw a lesson as a path of five
games. Finishing a game and touching Next returns to the path; the next node lights up, the
footer says "Up next: …" and "Play game N" starts it. Done games can be played again; later
games are locked. Leaving a game returns to the path at the same step; Back home leaves the
lesson. The done state said "Lesson done! You earned a star." `L2-022` said the next activity
"starts after brief praise" automatically, and that a lesson resumes on the same device.
The Home mock had no lesson picture, although `L2-024` #4 asks for one.

Resuming needs something kept on the device. `AGENTS.md` leaves open whether Pibbo remembers
what a child has practised, and *Children's privacy and safety* allows nothing about a child to
leave the device. The privacy design (`privacy/device-only-data`) names a `ProgressStore` over
`localStorage` under a `pibbo:` prefix, whose `read` treats missing, old or damaged data as
absent, and whose `clearAll` the grown-up area's "clear progress" calls.

## Decision

1. **The mock wins on the flow.** After an activity's own praise and Next, the path shows with
   the next step current; "Up next" and the activity's name are spoken (two recordings) and
   shown, and one touch on Play (or on the current node) starts it. The child never chooses
   what comes next, which is what "automatically" means in `L2-022`, rewritten to say so.
   No timer starts an activity on its own: sound follows a touch.
2. **The done state earns no star.** Praise is for effort and nothing is counted: "Lesson done!
   You played every game." is spoken and shown, and Back home returns Home. The mock is
   redrawn so.
3. **Lessons are content** in `@pibbo/domain/lessons/lesson-content.ts`: an id (`count` or
   `read`, the route `/lesson/:subject`), the kicker and title shown, and 3 to 6 activity ids
   from the catalogue. Which activities a lesson holds, and in what order, is not decided; the
   mock's two paths are the cast. "Two letters, one sound" is not a separate activity, so the
   reading lesson's third game is Spell by sound. Rhyme time and Build a sentence (journeys 20
   and 21) are named before they exist.
4. **An unknown activity is left off the path** (`lessonSteps`), and the page logs one client
   warning per unknown step through `CLIENT_LOG`: `Lesson "read" names an unknown activity
   "rhyme-time"; it is skipped.` It names content only. Nothing is sent anywhere.
5. **What is kept: one small value per lesson**, under the key `pibbo:lesson:<id>` in
   `localStorage`: `{"v":1,"step":2,"at":"count-and-write"}`. `step` is the current step
   (1-based, of the steps on the path, `steps + 1` once done) and `at` the id of that step's
   activity (`"done"` once done). Nothing else: no answers, no times, no tries, no name.
6. **Checked when read.** `readLessonPlace` in `@pibbo/domain` takes what the store returned
   and the lesson's steps and gives a step, or nothing when the value is missing, not an
   object, of another version, a step out of range, or an `at` that no longer names that step's
   activity (the content changed). Nothing means step 1. Storage that throws (private mode,
   disabled) reads as nothing and writes nothing; the lesson still runs.
7. **The store** is `PROGRESS_STORE` in `@pibbo/api` (`read`, `write`, `clearAll`), bound in
   `app.config.ts` to `BrowserProgressStore` over `localStorage`. `clearAll` removes every
   `pibbo:` key. A stored value is parsed as JSON and only ever used as a number and an id
   compared with content; it is never rendered.
8. **How a grown-up clears it.** Journey 24's grown-up area calls `clearAll` for "clear
   progress". Until then, clearing the site's data in the browser removes it. Finishing a
   lesson keeps it done (the path shows every step done, each one playable again).
9. **The activities learn they are in a lesson from the URL**: the path opens an activity at
   its own route with `?lesson=<id>&step=<n>`. `ACTIVITY_EXIT` (`@pibbo/api`, bound to
   `RouterActivityExit`) is what an activity calls when the child leaves (`leave`) or finishes
   its last round (`finish`). Outside a lesson both return Home with the group chosen, as
   before. In a lesson, `leave` returns to the path and `finish` returns to it with
   `?finished=<n>`; the path advances only when `n` is its current step, so a replayed game or
   a reload never skips one. Only the activities a lesson names call it: the count lesson's
   five and the reading lesson's three that exist.
10. **Home shows the chosen group's lesson** as a Lesson picture beside the wordmark
    (`.home__lesson`); touching it speaks "Lesson" and opens the path where the child left off.
11. **Rules are pure functions** in `@pibbo/domain/lessons` with unit tests: `lessonSteps`,
    `readLessonPlace`, `lessonPlace`, `finishStep`. The path is `LessonPath` (`pb-lesson-path`)
    in `@pibbo/components`, keeping the mock's `.path` classes, with `aria-current="step"` on the
    current node. The page is the lazy `LessonPage` at `/lesson/:subject`.

## Consequences

Pibbo now keeps one number and one id per lesson on the device; it is not practice history
(no answers or results), so the open question of remembering practice stays open for
journey 23. The recordings ("Up next", "Lesson", the lesson titles, "Lesson done") are
placeholders like every other (ADR 0006). Inside a lesson the activity's progress bar still
shows its own rounds; the mock's "game N of 5" bar is deferred. When Rhyme time and Build a
sentence are built, the reading lesson grows to five steps and the e2e spec for the unknown
step must name another unknown activity.
