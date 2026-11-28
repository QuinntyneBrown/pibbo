# 0028: The grown-up gate and area: a corner padlock, three numbers in words, and Clear progress

**Status:** Accepted (journey 24)

## Context

ADR 0026 decided that a grown-up has an area. `L2-037` asks for a small corner control on Home
at least 48 px from any activity picture, a text-only task a pre-reader cannot pass by chance
("touch 7, 3, 9 in order"), Home unchanged when the gate is failed or dismissed, and an area
with volume, clear progress and about Pibbo and no external links. `L2-029` #4 asks that
Clear progress erases all Pibbo progress in `localStorage` and IndexedDB. `AGENTS.md` says
grown-up edits open a CDK Dialog or a screen, never a hand-rolled modal, that the way out is
for a grown-up, where a child will not land on it by accident, and that a change that grows
the initial bundle is not done. No mock existed.

## Decision

1. **The mocks were drawn first**: Home's corner entry and `pages/grown-up` (`gate`,
   `gate-progress`, `default`, `confirm`, `cleared`).
2. **The entry is a quiet padlock** (`pb-grown-up-entry`, `.grown-up-entry`) in Home's top
   bar, right-hand corner, labelled "For grown-ups", outline only, 48 × 48 px. It is not a
   child's target, so it is smaller and plainer than one; `AGENTS.md`'s 60 px rule is for what a
   child touches. Home's row under the top bar starts 48 px below it (`.home__row`), so every
   activity picture is at least 48 px away at every width. Touching it speaks nothing.
3. **One grown-up screen, gate first.** The entry opens the lazy route `/grown-up` with Home's
   address in the navigation state. Its first step is always the gate (`pb-gate`, `.gate`):
   "Touch seven, three, nine in order." with three different numbers from 1 to 9 chosen by the
   injected random source and written as words, a 3 × 3 keypad of numerals and three dots for
   progress. It speaks nothing: the task is text only, so a child who cannot read passes it by
   chance less than once in 500 tries. The first wrong number or Back to Pibbo returns to Home's
   address, so Home is as it was (the chosen group, nothing spoken, nothing stored). Typed or
   reloaded, the screen also starts at the gate. The rules are pure functions in
   `@pibbo/domain/grown-up`: `newGate`, `gateTask`, `touchGate`.
4. **Steps, not dialogs.** A first build put the gate and the confirmation in CDK Dialogs. The
   CDK uses parts of Angular's core the app did not, and the build hoists them into the initial
   bundle: it grew from 238 kB to 257 kB, past the 250 kB budget. A screen is what `AGENTS.md`
   allows besides a CDK Dialog, so `@angular/cdk` is not a dependency; nothing traps focus and
   Back always works.
5. **The area** (`.grown-up`): Back to Pibbo, Volume (Quiet, Medium, Loud, a radio group with a
   tick on the chosen one, `pb-volume-switch`), Progress with Clear progress, and About Pibbo.
   It has no link and asks for no permission. The volume is a setting kept on the device
   (`pibbo:volume`), read by `BrowserAudioPlayer` and applied to every recording
   (`AudioPlayer.setVolume`); it is not progress, so Clear progress keeps it.
6. **Clear progress asks first**, in place of its button (`pb-confirm`, `.confirm`), with focus
   on Keep it. Clear progress calls `ProgressStore.clearProgress()`, which removes every
   `pibbo:` key but the volume, and every IndexedDB database named `pibbo…`; the area then says
   "Progress cleared." in a status.

## Consequences

A grown-up who cannot read English cannot pass the gate; which languages Pibbo speaks is not
decided. The area is the place for later grown-up settings, each needing its own requirement.
A CDK Dialog stays allowed by `AGENTS.md`, but only once its cost to the initial bundle is
paid for elsewhere.
