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

## Drift log

| Change | Why |
|--------|-----|
| Added `--color-brand-seed` and `--color-brand-leaf` | The mock's wordmark reads `--palette-sun` and `--palette-leaf` directly; the product reads tokens by role only. Same values. |
| Dropped the "aliases mock.css expects" (`--color-accent`, `--color-warning-*`) | They serve the mock chrome, not the product. |
| Dark theme also applies by `prefers-color-scheme` | The mocks force it with `data-theme`; a child's device setting should be honoured. |

## Open questions

- `--target-min` in the mocks is 3 rem (48 px), while `AGENTS.md` requires every target a child
  touches to be at least 60 × 60 px. The first journey that builds a target must settle this
  with the repository owner (mock first, then this folder).
- Component pages, the remaining foundation pages and the contrast record come with the
  journeys that build each component.
