# 0006: Home's catalogue, placeholder activities and the tap rule

**Status:** Accepted (journey 2)

## Context

The Home mock was transcribed from the prototype unreconciled with `AGENTS.md`: it showed the
child's name, stars, a lesson card and 21 games. `L2-024` asks for two group pictures, Count and
Read, and the prompt for journey 2 says activities that are not built are not shown, yet asks for
a placeholder route until each activity exists. No recordings of Pibbo's voice exist yet.

## Decision

1. **The mock was reconciled first.** Home shows the Count and Read group pictures and the chosen
   group's activity pictures, nothing about the child (no name, no stars). See
   `docs/mocks/README.md`.
2. **The catalogue holds only the two activities the purpose names**: Count the toys (Count, built
   in journey 3) and Sound it out (Read, built in journey 4). Each opens a lazy route
   (`/count/toys`, `/read/sound-out`) that shows a placeholder, its name and one large way back to
   Home, until its journey replaces the route's component. The other prototype games are added to
   the catalogue by the journey that builds each.
3. **The catalogue is data in `@pibbo/domain`** (`ACTIVITY_CATALOGUE`), typed by `@pibbo/api`.
   `activitiesFor` gives a group's activities, at most 6 per screen.
4. **Recordings are placeholders.** Each group and activity names a recording under
   `/recordings/home/`. The files committed now are short silences so the paths resolve; a
   person must record the real ones (open question). The label is always shown, so nothing
   depends on hearing them.
5. **Sound is unlocked by the first touch** simply by playing that touch's recording inside the
   touch's event handler; Pibbo uses one `HTMLAudioElement` (no `AudioContext` yet).
6. **The tap rule** (`pbTap` in `@pibbo/components`, rule `tapVerdict` with unit tests): a touch
   counts as a tap when its contact is no larger than 120 × 120 CSS px (larger is a palm), it moved
   less than 12 px and it was held less than 700 ms (longer is a long press). Each pointer is
   judged on its own, so a resting palm never blocks another finger. Mouse and keyboard
   activation arrive as `click` and always count. `contextmenu` is suppressed on targets.
   The thresholds are first guesses to tune on real devices. The palm limit was first 48 px:
   on a Surface laptop and on tablets every fingertip (9-12 mm, reported as 50-65 CSS px on
   those dense screens) was judged a palm and no tap worked (issue #272). 120 px is about
   19-32 mm depending on the screen: above any fingertip, below any palm.

## Consequences

Journeys 3 and 4 swap the placeholder component of their route for the real activity. Until real
recordings exist, Pibbo is silent in production but fully usable from what is shown.
