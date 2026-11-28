# Pibbo design system

Extracted from the mocks in [`docs/mocks/`](../mocks/), which are the source of truth. Where this
folder and a mock disagree, the mock is right and this folder is brought in line.

**Scope so far: foundations only** (journey 1). Component and pattern pages are added as the
journeys that build each component need them.

## Contents

| Path | What it is |
|------|------------|
| [`tokens/tokens.json`](tokens/tokens.json) | DTCG export of every token, with the dark value of each themed role under `$extensions["pibbo.theme"].dark`. Generated from the app's `_tokens.scss`. |
| [`foundations/index.html`](foundations/index.html) | Colour roles, type, space, radius and motion, read live from `docs/mocks/assets/tokens.css`. `?theme=dark` shows dark. |

The product reads the same tokens from
[`frontend/projects/pibbo/src/styles/_tokens.scss`](../../frontend/projects/pibbo/src/styles/_tokens.scss),
a transcription of `docs/mocks/assets/tokens.css`.

## Foundations

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

| Component | Block | Mock | Code |
|-----------|-------|------|------|
| Wordmark | `.wordmark` (`--md`, `--lg`, `--hero`) | `pages/brand/default.html`, `pages/home/default.html` | `@pibbo/components` `pb-wordmark` |
| Group switch | `.switch--groups`, `.switch__option--group` (`--read`), `.switch__glyph`; chosen is `aria-pressed="true"` plus a tick | `pages/home/*.html` | `@pibbo/components` `pb-group-switch` |
| Activity grid | `.game-group`, `__title`, `__grid` (2, 3, 5 columns; `--gap-targets`) | `pages/home/default.html`, `counting.html` | `@pibbo/components` `pb-activity-grid` |
| Activity picture | `.game-card` (`--count`, `--read`), `__glyph`, `__body`, `__title`; at least `--target-child` | `pages/home/default.html`, `counting.html` | `@pibbo/components` `pb-activity-picture` |
| Tap | behaviour, no block: `[pbTap]` on every target (ADR 0006) | — | `@pibbo/components` `Tap` |
| Pibbo | `.pibbo` (`--cheer`; "oh" beak); colours by role `--color-pibbo-*` | `pages/count-the-toys/*.html` | `@pibbo/components` `pb-pibbo` |
| Round shell | `.shell` (`--count`, `--read`), `__top`, `__ask`, `__game`; `.progress`; `.bubble`, `__picture`, `__text`; `.hear` (60 px) | `pages/count-the-toys/*.html` | `@pibbo/components` `pb-round-shell` |
| Count set | `.rug`, `__toy` (`--0` to `--11` cells, `--counted`, `--highlight`), `__badge` | `pages/count-the-toys/*.html` | `@pibbo/components` `pb-count-set` |
| Tally | `.tally`, `__number`; `.choices`; `.numeral` (`aria-pressed`, `--answer`) | `pages/count-the-toys/*.html` | `@pibbo/components` `pb-tally` |
| Answer bar | `.answer-bar` (`--check`, `--right`, `--hint`, `--retry`, `--model`), `__message`; `.chunky--read`, `--reward` for Try again | `pages/count-the-toys/*.html`, `pages/sound-it-out/*.html` | `@pibbo/components` `pb-answer-bar` |
| Word tiles | `.tiles`, `__unit`, `__say` (`--hidden`); `.tile` (`--next`, `--heard`, `--sounding`; `disabled`); `.blend`, `__bar`, `__fill` (`--0` to `--100`) | `pages/sound-it-out/*.html` | `@pibbo/components` `pb-word-tiles` |
| Picture pick | `.pick`, `__option` (`aria-pressed`, `--right`; `disabled`), `__tick` | `pages/sound-it-out/pick.html`, `correct.html`, `retry.html`, `modelled.html` | `@pibbo/components` `pb-picture-pick` |
| Ten-frames | `.tenframes` (`--small` once counted), `.tenframe`, `__cell`, `__thing` (`--counted`; `disabled`), `__badge`; 60 px things, 6 px apart | `pages/count-and-write/*.html` | `@pibbo/components` `pb-tenframes` |
| Digit pad | `.digit-pad`, `__slots`, `__slot` (`--filled`, `--answer`), `__clear`, `__keys`, `__key` (`--lit`; `disabled`) | `pages/count-and-write/*.html` | `@pibbo/components` `pb-digit-pad` |

## Drift log

| Change | Why |
|--------|-----|
| Added `--color-brand-seed` and `--color-brand-leaf` | The mock's wordmark reads `--palette-sun` and `--palette-leaf` directly; the product reads tokens by role only. Same values. |
| Dropped the "aliases mock.css expects" (`--color-accent`, `--color-warning-*`) | They serve the mock chrome, not the product. |
| Added `--target-child` (60 px) and `--gap-targets` (16 px) | `L2-024` and `AGENTS.md`; added to the mock tokens first (journey 2). |
| Dark theme also applies by `prefers-color-scheme` | The mocks force it with `data-theme`; a child's device setting should be honoured. |
| Added `--color-pibbo-*` role tokens | The mock's mascot reads `--palette-*` directly; the product reads tokens by role only. Same values (journey 3). |
| Added `.tile--sounding`, `.pick__tick` and `.shell--read .bubble__picture` | `L2-012` #1 lights each letter as it sounds; the right picture carries a tick, so colour is not its only carrier; the read bubble carries a picture as Count's does. Added to the mocks first (journey 4). |
| Added `.tenframes` and `.digit-pad`; 6 px between ten-frame and digit targets | The prototype traced the numeral (a drag) and had no ten-frames (`L2-003`, `L2-004`). Five 60 px targets fit a 360 px phone only with a 6 px gap. Added to the mocks first (journey 5, ADR 0009). |
| Added `.ten-frame__dot--extra`; a card holds two `.ten-frame`s above 10 | `L2-005` #2 highlights the extra things after a wrong choice, by shape as well as colour; `L2-005` covers 0 to 20. Added to the mocks first (journey 6, ADR 0010). |
| Added `.launch__rocket--1` to `--9` | `L2-006` starts anywhere from 5 to 20; the rocket rises in tenths of the way to 0, 15 px each. Added to the mocks first (journey 7, ADR 0011). |
| Added `.switch--step`; `.number-line__label` 44 units | The prototype's step switch was 44 px, 4 px apart, colour only; it is 64 px, 16 px apart, with a tick. Labels grew so a phone can read them. Added to the mocks first (journey 8, ADR 0012). |

## Open questions

- `--target-min` (48 px) stays for the prototype's smaller controls, but every target a child
  touches now uses `--target-child` (60 px), settled in journey 2. Other screens move to it as
  their journeys build them.
- Component pages, the remaining foundation pages and the contrast record come with the
  journeys that build each component.
