# Contributing to Pibbo

Thank you for your interest in Pibbo. This guide explains how to propose a change and what a
pull request needs before it can be merged.

By taking part you agree to follow the [code of conduct](CODE_OF_CONDUCT.md).

## Contents

- [Ways to contribute](#ways-to-contribute)
- [Before you start](#before-you-start)
- [How a change is made](#how-a-change-is-made)
- [Development setup](#development-setup)
- [Coding conventions](#coding-conventions)
- [Testing](#testing)
- [Commits and pull requests](#commits-and-pull-requests)
- [Licensing of contributions](#licensing-of-contributions)

## Ways to contribute

- **Report a bug.** Open an issue with the steps, what you expected and what happened.
  Include the device, the browser and its version, and whether the sound was on.
- **Suggest a feature.** Open an issue saying how it helps a child count or sound out a word.
- **Improve the documentation.** Requirements, designs and mocks go in `docs/` and welcome
  corrections.
- **Implement a feature.** Once the detailed designs exist they are listed in
  `docs/detailed-designs/README.md`; each traces to its requirements in `docs/specs/L2.md`.

Security vulnerabilities are never reported in a public issue; see [`SECURITY.md`](SECURITY.md).

## Before you start

1. Read [`AGENTS.md`](AGENTS.md). It is the single source of the repository's rules, and it applies
   to people and coding agents alike.
2. Read the architecture decision records in `docs/adr/` for the area you will change.
3. For anything larger than a small fix, open an issue first so the approach can be agreed before
   you write code.

Every change serves what Pibbo is for: helping a child count, or sound out a word. A change that
cannot be traced back to that does not belong here.

The people who use Pibbo are small children. A change that would collect anything about a
child, load anything from a third party, or lead a child out of the app is not accepted; see
*Children's privacy and safety* in `AGENTS.md`.

Use the words the requirements use (`docs/specs/`, and until they exist, `AGENTS.md`) in code,
docs and UI; do not invent synonyms.

## How a change is made

Pibbo is built requirement first and test first.

1. **Requirement.** Every change to production behaviour has a requirement with acceptance
   criteria in `docs/specs/`.
2. **Detailed design.** The feature has a design in `docs/detailed-designs/`.
3. **Mock.** Every screen and state the change touches has a mock in `docs/mocks/`. The mocks
   are the source of truth for the UI.
4. **Slices.** The work is planned as small, reviewable slices.
5. **Acceptance test first.** For each slice, write the Given-When-Then criteria and the
   acceptance test, and run it to prove it fails for the expected reason before writing production
   code.
6. **Implement, then refactor** with the tests green, and run the regression checks before the
   next slice.

Documentation-only, mock-only, design-system-only and test-only changes do not need steps 1 to 3
unless they are part of a production behaviour change. Do not write tests for mocks or the design
system, and never add architecture tests (tests that assert the shape of the code rather than its
behaviour).

## Development setup

Follow [Getting started](README.md#getting-started) in the README. You need Node.js 22 or later
with npm and a current Chrome or Edge.

## Coding conventions

- Prettier owns formatting and angular-eslint owns lint; CI fails on either.
- Standalone components, signals and OnPush change detection, zoneless.
- One type per file, and no single-file components: `name.ts` + `name.html` + `name.scss`.
- Selectors use `pb-*`; class, file and folder names omit the prefix.
- Presentation components go in the `components` library, named as in the design system, and
  take inputs and emit outputs; the contracts and their types go in the `api` library; the
  rules of the activities go in `domain`; everything else is the `pibbo` app
  (`frontend/projects/`).
- The rules of an activity are pure functions in `domain` with unit tests, never in a
  component. Anything random or timed comes from a source that is injected.
- The words, the sounds each is made of, and their pictures and recordings are data, checked
  when the app is built. A sound is a recording, never the browser's speech engine.
- Read design tokens by role, never hex values.
- A child never types, and is never shown an error message.
- Anything a child touches is at least 60 × 60 px and needs only a tap.
- Whatever is said is also shown, and whatever is shown is also said; colour is never the only
  carrier of a state, and motion respects `prefers-reduced-motion`.
- Every screen works at every width, with touch, with a mouse and with the keyboard.
- Fonts, pictures, recordings and scripts are bundled and self-hosted. The browser calls
  nothing but Pibbo's own origin, and never asks for the microphone or the camera.
- Nothing about a child is collected, kept or sent.

## Testing

- **No automated test uses a real clock, real randomness, real sound or a network beyond
  localhost.** Behaviour specs run at the time and in the order the spec sets, and check which
  recordings were asked for rather than listening to them.
- Tests never sleep: they advance a fake clock.
- Use the Page Object Model: selectors live in page objects, never in a spec.
- Run frontend tests in Chromium only.
- Do not run the visual, responsive or accessibility sweeps or update baselines unless the
  repository owner asks; do keep them current.

The commands for each suite are in the README under
[Build and test](README.md#build-and-test). A change is done when format, lint, unit tests, the
production build and the behaviour specs pass (`node tools/verify/verify.mjs`).

## Commits and pull requests

- Branch from `main`; never commit to `main` directly.
- Keep each pull request to one concern, and each commit to one slice.
- Write commit subjects in the imperative mood, as a sentence that says what the change does
  (for example, "Count each thing once").
- Fill in the pull request template: what changed, why, the requirement it satisfies and how it
  was tested.
- Keep the requirement, detailed design, mock, tests and code in agreement within the same pull
  request.
- CI must be green before review.

## Licensing of contributions

Pibbo is licensed under the [MIT License](LICENSE). By submitting a contribution you agree that
it is licensed under the same terms, and you confirm that you have the right to submit it.
