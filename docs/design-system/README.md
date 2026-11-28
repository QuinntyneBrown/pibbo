# Pibbo design system

Extracted from [docs/mocks](../mocks/README.md) on 2026-11-27. Open [index.html](index.html) locally (or serve the repo root over HTTP). The mocks render through this folder: `docs/mocks/assets/tokens.css` and `ui.css` import `tokens/tokens.css` and `assets/components.css`, so the two cannot drift. Where this folder and a mock disagree, the mock is right.

Colour comes only from the ramps in [palette-source.md](palette-source.md) (plus white and black). No other branding from that source is used.

## Foundations

| Page                                            | Covers                                            |
| ----------------------------------------------- | ------------------------------------------------- |
| [Color](foundations/color.html)                 | Ramps, roles, both themes, contrast               |
| [Typography](foundations/typography.html)       | Fredoka for Pibbo's voice, Andika for reading     |
| [Spacing](foundations/spacing.html)             | The 4px scale and the size scale                  |
| [Layout](foundations/layout.html)               | Breakpoints, columns, margins, the activity frame |
| [Elevation](foundations/elevation.html)         | The press edge, shadows, z-order                  |
| [Shape](foundations/shape.html)                 | Radii and borders                                 |
| [Motion](foundations/motion.html)               | Durations, easing, reduced motion                 |
| [Iconography](foundations/iconography.html)     | The stroke icon set                               |
| [Theming](foundations/theming.html)             | Light, dark and how themes work                   |
| [Responsive](foundations/responsive.html)       | Phone, tablet and desktop rules                   |
| [Accessibility](foundations/accessibility.html) | WCAG 2.2 AA and the child-first rules             |
| [Content](foundations/content.html)             | What Pibbo says and shows                         |
| [Foundations overview](foundations/index.html)  | Links the twelve pages (kept at its old URL)      |

## Components

| Component                                        | Variants                                                     | States                                           | Source mocks                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Button (Chunky)](components/button.html)        | Count, Read, Success, Reward, Ink, White, icon, Wide (phone) | Default, Hover, Focus, Active, Disabled          | [count-the-toys/choose](../mocks/pages/count-the-toys/choose.html), [count-the-toys/correct](../mocks/pages/count-the-toys/correct.html), [home/default](../mocks/pages/home/default.html), [guided-lesson/default](../mocks/pages/guided-lesson/default.html) |
| [Hear button](components/hear-button.html)       | Count, Read                                                  | Default, Hover, Focus, Active, Disabled          | [count-the-toys/default](../mocks/pages/count-the-toys/default.html), [sound-it-out/default](../mocks/pages/sound-it-out/default.html)                                                                                                                         |
| [Group switch](components/group-switch.html)     | Groups (Home), Segmented (grown-up)                          | Default, Hover, Focus, Active, Pressed           | [home/default](../mocks/pages/home/default.html), [home/counting](../mocks/pages/home/counting.html), [home/first-visit](../mocks/pages/home/first-visit.html)                                                                                                 |
| [Numeral](components/numeral.html)               | Choice, Pressed, The answer (modelled), Wide (two digits)    | Default, Hover, Focus, Active, Pressed, Disabled | [count-the-toys/choose](../mocks/pages/count-the-toys/choose.html), [count-the-toys/modelled](../mocks/pages/count-the-toys/modelled.html), [which-is-bigger/default](../mocks/pages/which-is-bigger/default.html)                                             |
| [Tile](components/tile.html)                     | Letter, Heard, Next, Wide (sh), Word, Used word              | Default, Hover, Focus, Active, Disabled          | [sound-it-out/default](../mocks/pages/sound-it-out/default.html), [spell-by-sound/default](../mocks/pages/spell-by-sound/default.html), [build-a-sentence/default](../mocks/pages/build-a-sentence/default.html)                                               |
| [Count set](components/count-set.html)           | Counting                                                     | Default, Focus, Disabled                         | [count-the-toys/default](../mocks/pages/count-the-toys/default.html), [count-the-toys/retry](../mocks/pages/count-the-toys/retry.html), [count-the-toys/choose](../mocks/pages/count-the-toys/choose.html)                                                     |
| [Tally](components/tally.html)                   | Counting, Choosing                                           | Default                                          | [count-the-toys/default](../mocks/pages/count-the-toys/default.html), [count-the-toys/choose](../mocks/pages/count-the-toys/choose.html)                                                                                                                       |
| [Activity card](components/activity-card.html)   | Count, Read                                                  | Default, Hover, Focus, Active                    | [home/default](../mocks/pages/home/default.html), [home/counting](../mocks/pages/home/counting.html)                                                                                                                                                           |
| [Lesson card](components/lesson-card.html)       | Count, Read, Check                                           | Default, Hover, Focus, Active                    | [guided-lesson/default](../mocks/pages/guided-lesson/default.html), [progress-check/default](../mocks/pages/progress-check/default.html)                                                                                                                       |
| [Speech bubble](components/speech-bubble.html)   | Count, Read                                                  | Default                                          | [count-the-toys/default](../mocks/pages/count-the-toys/default.html), [sound-it-out/default](../mocks/pages/sound-it-out/default.html)                                                                                                                         |
| [Answer bar](components/answer-bar.html)         | Check, Correct, Retry                                        | Default, Hover, Focus, Active, Disabled          | [count-the-toys/choose](../mocks/pages/count-the-toys/choose.html), [count-the-toys/correct](../mocks/pages/count-the-toys/correct.html), [count-the-toys/retry](../mocks/pages/count-the-toys/retry.html)                                                     |
| [Progress bar](components/progress-bar.html)     | Count, Read                                                  | Default                                          | [count-the-toys/default](../mocks/pages/count-the-toys/default.html)                                                                                                                                                                                           |
| [Star rating](components/star-rating.html)       | 2 of 3                                                       | Default                                          | [progress-check/results](../mocks/pages/progress-check/results.html)                                                                                                                                                                                           |
| [Pill](components/pill.html)                     | Child, Stars                                                 | Default                                          | [progress-check/results](../mocks/pages/progress-check/results.html)                                                                                                                                                                                           |
| [Lesson path](components/lesson-path.html)       | Count lesson                                                 | Default                                          | [guided-lesson/default](../mocks/pages/guided-lesson/default.html), [guided-lesson/counting](../mocks/pages/guided-lesson/counting.html)                                                                                                                       |
| [Activity shell](components/activity-shell.html) | Count, Read                                                  | Default                                          | [count-the-toys/default](../mocks/pages/count-the-toys/default.html), [sound-it-out/default](../mocks/pages/sound-it-out/default.html)                                                                                                                         |
| [Skip link](components/skip-link.html)           | one                                                          | Default, Focus                                   | [home/default](../mocks/pages/home/default.html)                                                                                                                                                                                                               |
| [Mascot (Pibbo)](components/mascot.html)         | one                                                          | Default                                          | [brand/default](../mocks/pages/brand/default.html), [count-the-toys/default](../mocks/pages/count-the-toys/default.html)                                                                                                                                       |
| [Wordmark](components/wordmark.html)             | Ink                                                          | Default                                          | [brand/default](../mocks/pages/brand/default.html), [home/default](../mocks/pages/home/default.html)                                                                                                                                                           |
| [Picture](components/picture.html)               | Toy, Word picture                                            | Default                                          | [count-the-toys/default](../mocks/pages/count-the-toys/default.html), [words-and-pictures/default](../mocks/pages/words-and-pictures/default.html)                                                                                                             |

Activity-specific blocks in `components.css` that are not yet promoted to pages (they belong to activities not reconciled with AGENTS.md; see the mocks' _Open questions_): `.track`, `.write-pad`, `.compare`, `.launch`/`.rocket`, `.number-line`, `.ten-frame`, `.pairs`, `.blend`, `.story`, `.sentence`, `.results`, `.brand`.

`.spell` (`.boxes`, `.box`, `.box--filled`, `.box--next`, `.box--right`, `.bank`, `.bank__letter`, with the shared `.speaker`) is reconciled with `L2-013` (journey 13, ADR 0018) and rendered by `pb-spell-boxes` in `@pibbo/components`: a box is 60 × 60 px at least (`--size-11` × `--size-12`), a bank letter `--size-10`; a filled box takes a touch to take its letter out.

Core components from the generic catalog that Pibbo does not have (text field, select, dialog, toast, table, menu, tabs, tooltip...) are deliberately absent: no mock draws them and AGENTS.md forbids inventing design. See [Dialogs and overlays](patterns/overlays.html).

## Patterns

| Pattern                                                           | Covers                                                  |
| ----------------------------------------------------------------- | ------------------------------------------------------- |
| [Activity round](patterns/activity-round.html)                    | Ask, answer, feedback: one round from start to Next     |
| [Choosing an answer](patterns/choosing-an-answer.html)            | Pibbo's forms: choosing, checking and changing a choice |
| [Feedback and loading](patterns/feedback.html)                    | Correct, retry, modelled; nothing ever waits            |
| [Empty and error states](patterns/empty-and-error-states.html)    | What a child never sees, and what a grown-up sees       |
| [Navigation and page structure](patterns/navigation.html)         | Home, an activity, and the way out                      |
| [Dialogs and overlays](patterns/overlays.html)                    | Why Pibbo has none during an activity                   |
| [Lists and grids](patterns/activity-grids.html)                   | Activity pictures and choice sets                       |
| [Notifications: spoken and shown](patterns/spoken-and-shown.html) | Sound carries meaning and is never the only carrier     |
| [Content and tone](patterns/content-and-tone.html)                | Pibbo's voice, words and numbers                        |

## Tokens

- `tokens/tokens.css`: source of truth (primitives, semantic roles, Pibbo roles, light and dark).
- `tokens/tokens.json`: DTCG export from `tokens_to_json.py`.
- `tokens/contrast-pairs.json`: the 63 pairs checked in both themes.
- `assets/components.css`: the product kit; `assets/ds.css`, `ds-pibbo.css`, `ds.js`: docs chrome.
- The Angular app reads the same values from `frontend/projects/pibbo/src/styles/_tokens.scss`.

## Changelog

- **2026-11-27: palette replaced.** All colours now come from `palette-source.md`. Mapping: text neutral-900 `#2a2923`, page neutral-50 `#f6f5f2`, surfaces white, secondary text neutral-700 `#56534e`, accent purple-500 `#7e2ee9`; Count blue (`#0057ff` buttons, `#2e8cff` fills); Read pink (`#b627c6` buttons, `#ff5dd8` fills); success green (`#106d24` text and buttons, `#1eb83f` fills); info blue; errors pink/red. Dark uses the darker shades: page purple-950 `#210846`, surfaces neutral-900, wells black, text and accents lightened (purple-200, blue-200, pink-200, green-200).
- **Deviations logged:** the source has no yellow or orange, so Pibbo's body (was sun `#ffc23d`) is lime green-200 `#9eff86`, stars and rewards (were sun) are lilac purple-200 `#dcb7ff`, retry (was sun-soft) is purple-50; `--color-fg-subtle` equals muted because neutral-500 `#807b74` is 4.2:1 on white; red-600 on pink-50 fails 4.5:1, so error text is pink-800 and red is kept for icons and solids; dark surfaces could not use neutral-700 (purple-200 text 4.47:1), so they use neutral-900 on a purple-950 page.
- **New roles:** `--color-count-fg`, `--color-read-fg` (themed subject text, replacing dark-only primitive overrides in the kit), `--color-reward-depth`, `--color-on-strong-dim`, `--color-on-strong-line`, `--color-art-*`, the standard `--color-bg-*`/`--color-fg-*`/status roles. Old names (`--color-bg`, `--color-fg`, `--color-surface`, `--color-border`, `--color-focus`) are kept as aliases.
- **Rebuilt** the whole system from the mocks (was a single foundations page).

## Drift found in the mocks

| Mock                           | Issue                                                                                          | Resolution                                           |
| ------------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| assets/ui.css (all pages)      | Components read `--palette-*` primitives directly and used dark-only overrides with primitives | Mapped to semantic and art roles; themed `-fg` roles |
| assets/ui.css                  | Raw `rgb(255 255 255 / …)` on lesson dots and lesson foot                                      | `--color-on-strong-dim`, `--color-on-strong-line`    |
| pages/count-the-toys/_, home/_ | `.hear` declared 48px then overridden to 60px                                                  | Documented 60px only                                 |
| assets/ui.css                  | No hover style; `100vh` shells                                                                 | Hover lift for mouse only; `100dvh`                  |
| assets/tokens.css              | Dark theme only under `[data-theme=dark]`, not `prefers-color-scheme`                          | Both blocks                                          |
| assets/tokens.css              | `--space-1-5` (6px) off the 4px grid                                                           | Kept for stability, flagged                          |
| pages/count-the-toys/*         | `mock:requirements` meta empty vs manifest (checker warning)                                   | Left for the mocks owner                             |
| pages/brand/default            | Swatch names and hex were the old palette                                                      | Updated to the new palette                           |

## Verification

- **Colour.** Primitives (`--palette-*`) are the prototype's values; components read roles
  only (`--color-*`): surface and text (`bg`, `bg-sunken`, `surface`, `border`, `fg`,
  `fg-muted`, `focus`), the subject colours (Reading `read-*` is berry, Counting `count-*` is
  sky), feedback (`success-*`, `reward-*`) and the brand marks (`brand-seed`, `brand-leaf`).
- **Themes.** Light is the prototype. Dark is the mocks' addition. The product follows the
  device's `prefers-color-scheme`; `data-theme="light"` or `"dark"` on `:root` forces one (the
  mocks use the attribute only).
- **Type.** Fredoka (`--font-display`) is Pibbo's voice, buttons and titles; Andika
  (`--font-read`) is for anything a child reads to learn, for its single-storey a and g. Both
  are bundled and self-hosted.
- **Space** is a 4 px grid (`--space-*`). Also **size** (`--size-*`), **radius**
  (`--radius-*`), **elevation** (the "press" edge, `--press-*`, `--shadow-*`), **motion**
  (`--duration-*`, `--ease-*`, all zero under reduced motion), **layout** (`--layout-margin`,
  `--bp-*`, `--content-max`) and **z** (`--z-*`).

## Components extracted so far

| Component        | Block                                                                                                                                             | Mock                                                                          | Code                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------- |
| Wordmark         | `.wordmark` (`--md`, `--lg`, `--hero`)                                                                                                            | `pages/brand/default.html`, `pages/home/default.html`                         | `@pibbo/components` `pb-wordmark`         |
| Group switch     | `.switch--groups`, `.switch__option--group` (`--read`), `.switch__glyph`; chosen is `aria-pressed="true"` plus a tick                             | `pages/home/*.html`                                                           | `@pibbo/components` `pb-group-switch`     |
| Activity grid    | `.game-group`, `__title`, `__grid` (2, 3, 5 columns; `--gap-targets`)                                                                             | `pages/home/default.html`, `counting.html`                                    | `@pibbo/components` `pb-activity-grid`    |
| Activity picture | `.game-card` (`--count`, `--read`), `__glyph`, `__body`, `__title`; at least `--target-child`                                                     | `pages/home/default.html`, `counting.html`                                    | `@pibbo/components` `pb-activity-picture` |
| Tap              | behaviour, no block: `[pbTap]` on every target (ADR 0006)                                                                                         | —                                                                             | `@pibbo/components` `Tap`                 |
| Pibbo            | `.pibbo` (`--cheer`; "oh" beak); colours by role `--color-pibbo-*`                                                                                | `pages/count-the-toys/*.html`                                                 | `@pibbo/components` `pb-pibbo`            |
| Round shell      | `.shell` (`--count`, `--read`), `__top`, `__ask`, `__game`; `.progress`; `.bubble`, `__picture`, `__text`; `.hear` (60 px)                        | `pages/count-the-toys/*.html`                                                 | `@pibbo/components` `pb-round-shell`      |
| Count set        | `.rug`, `__toy` (`--0` to `--11` cells, `--counted`, `--highlight`), `__badge`                                                                    | `pages/count-the-toys/*.html`                                                 | `@pibbo/components` `pb-count-set`        |
| Tally            | `.tally`, `__number`; `.choices`; `.numeral` (`aria-pressed`, `--answer`)                                                                         | `pages/count-the-toys/*.html`                                                 | `@pibbo/components` `pb-tally`            |
| Answer bar       | `.answer-bar` (`--check`, `--right`, `--hint`, `--retry`, `--model`), `__message`; `.chunky--read`, `--reward` for Try again                      | `pages/count-the-toys/*.html`, `pages/sound-it-out/*.html`                    | `@pibbo/components` `pb-answer-bar`       |
| Word tiles       | `.tiles`, `__unit`, `__say` (`--hidden`); `.tile` (`--next`, `--heard`, `--sounding`; `disabled`); `.blend`, `__bar`, `__fill` (`--0` to `--100`) | `pages/sound-it-out/*.html`                                                   | `@pibbo/components` `pb-word-tiles`       |
| Picture pick     | `.pick`, `__option` (`aria-pressed`, `--right`; `disabled`), `__tick`                                                                             | `pages/sound-it-out/pick.html`, `correct.html`, `retry.html`, `modelled.html` | `@pibbo/components` `pb-picture-pick`     |
| Ten-frames       | `.tenframes` (`--small` once counted), `.tenframe`, `__cell`, `__thing` (`--counted`; `disabled`), `__badge`; 60 px things, 6 px apart            | `pages/count-and-write/*.html`                                                | `@pibbo/components` `pb-tenframes`        |
| Digit pad        | `.digit-pad`, `__slots`, `__slot` (`--filled`, `--answer`), `__clear`, `__keys`, `__key` (`--lit`; `disabled`)                                    | `pages/count-and-write/*.html`                                                | `@pibbo/components` `pb-digit-pad`        |

## Drift log

| Change                                                                                                                   | Why                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Added `--color-brand-seed` and `--color-brand-leaf`                                                                      | The mock's wordmark reads `--palette-sun` and `--palette-leaf` directly; the product reads tokens by role only. Same values.                                                                                                                                    |
| Dropped the "aliases mock.css expects" (`--color-accent`, `--color-warning-*`)                                           | They serve the mock chrome, not the product.                                                                                                                                                                                                                    |
| Added `--target-child` (60 px) and `--gap-targets` (16 px)                                                               | `L2-024` and `AGENTS.md`; added to the mock tokens first (journey 2).                                                                                                                                                                                           |
| Dark theme also applies by `prefers-color-scheme`                                                                        | The mocks force it with `data-theme`; a child's device setting should be honoured.                                                                                                                                                                              |
| Added `--color-pibbo-*` role tokens                                                                                      | The mock's mascot reads `--palette-*` directly; the product reads tokens by role only. Same values (journey 3).                                                                                                                                                 |
| Added `.tile--sounding`, `.pick__tick` and `.shell--read .bubble__picture`                                               | `L2-012` #1 lights each letter as it sounds; the right picture carries a tick, so colour is not its only carrier; the read bubble carries a picture as Count's does. Added to the mocks first (journey 4).                                                      |
| Added `.tenframes` and `.digit-pad`; 6 px between ten-frame and digit targets                                            | The prototype traced the numeral (a drag) and had no ten-frames (`L2-003`, `L2-004`). Five 60 px targets fit a 360 px phone only with a 6 px gap. Added to the mocks first (journey 5, ADR 0009).                                                               |
| Added `.ten-frame__dot--extra`; a card holds two `.ten-frame`s above 10                                                  | `L2-005` #2 highlights the extra things after a wrong choice, by shape as well as colour; `L2-005` covers 0 to 20. Added to the mocks first (journey 6, ADR 0010).                                                                                              |
| Added `.launch__rocket--1` to `--9`                                                                                      | `L2-006` starts anywhere from 5 to 20; the rocket rises in tenths of the way to 0, 15 px each. Added to the mocks first (journey 7, ADR 0011).                                                                                                                  |
| Added `.switch--step`; `.number-line__label` 44 units                                                                    | The prototype's step switch was 44 px, 4 px apart, colour only; it is 64 px, 16 px apart, with a tick. Labels grew so a phone can read them. Added to the mocks first (journey 8, ADR 0012).                                                                    |
| Added `.turn--star`, `.turn--moon` and `.player[aria-current="step"]`; `.turn-controls`; `.round-btn` 64 px, 16 px apart | The prototype named the players and its + and − were 44 px, 8 px apart, on both players; only the player whose turn it is has them now. A turn is shown by a symbol and colour, never a name (`L2-008`). Added to the mocks first (journey 9, ADR 0013).        |
| Added `.switch--speed`; `.game-card--more`                                                                               | The prototype's speed switch was 44 px, 4 px apart, colour only; it is 64 px, 16 px apart, with a tick, as `.switch--step`. Home shows at most 6 activities a screen, so a group with more has a More picture. Added to the mocks first (journey 10, ADR 0014). |
| Added `.pair--miss`                                                                                                      | A wrong partner in Letter sounds gives a small shake (`--duration-slow`), removed by reduced motion. Added to the mocks first (journey 11, ADR 0015).                                                                                                           |

## Open questions

- `--target-min` (48 px) stays for the prototype's smaller controls, but every target a child
  touches now uses `--target-child` (60 px), settled in journey 2. Other screens move to it as
  their journeys build them.
- Component pages, the remaining foundation pages and the contrast record come with the
  journeys that build each component.

See the report of the extraction run: `check_design_system.py` and `check_contrast.py` both exit 0; screenshots in `.cache/shots` (git-ignored).
