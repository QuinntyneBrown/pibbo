# Grown-up gate and area

## Overview

Settings and information for a grown-up sit behind a *gate*. The gate entry is a small corner control at least 48 px from any activity picture. Passing the gate needs a text-only task a pre-reader cannot pass by chance, such as touching 7, 3, 9 in order. The grown-up area offers volume, clear progress and about Pibbo, with no external links.

- **gate** — the grown-up screen's first step: a reading task that only a reader passes; nothing in it is spoken

## Description

The feature is a vertical slice through the Angular workspace: the page in the `pibbo` application, presentation components in `@pibbo/components`, pure rules in `@pibbo/domain`, and the contracts and tokens in `@pibbo/api` (ADRs 0026 and 0028).

- **`GrownUpEntry`** (`pb-grown-up-entry`) — the corner control on Home (`.grown-up-entry`): an outline padlock, 48 × 48 px, "For grown-ups", in the top bar; Home's row under it keeps every activity picture at least 48 px away.
- **`GrownUpScreen`** — lazy route `/grown-up` in the app, opened by the entry with Home's address in the navigation state. Its first step is always the gate; then the area; Clear progress adds a confirmation step in place of its button. Leaving goes back to Home's address as it was.
- **`GateView`** (`pb-gate`, `.gate`) — three numbers written as words, dots for progress and a 3 × 3 keypad, with Back to Pibbo. Nothing is spoken. The first wrong number or Back to Pibbo returns to Home unchanged; the right three show the area.
- **`gateRules`** — pure functions in `@pibbo/domain/grown-up`: `newGate` (three different numbers from 1 to 9, from `RANDOM_SOURCE`), `gateTask` ("Touch seven, three, nine in order."), `touchGate` (`pending`, `passed` or `failed`).
- **`VolumeSwitch`** (`pb-volume-switch`) — Quiet, Medium or Loud, a radio group with a tick; kept as `pibbo:volume` and applied through `AudioPlayer.setVolume`.
- **`ConfirmClear`** (`pb-confirm`, `.confirm`) — "Clear progress?", Keep it (focused) and Clear progress, which calls `ProgressStore.clearProgress()`; the area then says "Progress cleared.".

The gate and the confirmation are steps of the screen, not CDK dialogs: a dialog brought enough of Angular's core into the initial bundle to pass its 250 kB budget (ADR 0028).

## Requirements

The feature realises the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-037` | `L1-030` | Grown-up gate |

Acceptance criteria of `L2-037` (Grown-up gate):

1. Given Home, when shown, then the grown-up entry is a small corner control at least 48 px from any activity picture.
2. Given the grown-up entry is touched, when the gate opens, then a text-only task a pre-reader cannot pass by chance (for example "touch 7, 3, 9 in order") must be completed to go on.
3. Given the gate is failed or dismissed, when that happens, then Home returns unchanged.
4. Given the grown-up area, when shown, then it offers volume, clear progress and about Pibbo, and has no external links.
5. Given the grown-up area, when "clear progress" is touched, then a confirmation asks first in its place, starting on Keep it; confirming erases all progress on the device and says "Progress cleared.", keeping the volume.
6. Given the grown-up area, when a volume is chosen, then every recording plays at it and it is kept on the device.
7. Given the grown-up screen, when it is opened in any way (the entry, typed, reloaded), then the gate is shown first.

## Diagrams

### System context

The child uses Pibbo directly; a grown-up is beside or nearby and is not needed to make the feature work. No third-party system takes part.

![C4 system context for grown-up gate and area](diagrams/c4-context.png)

### Containers

The feature runs in the `pibbo` single-page application. Content arrives from `Pibbo.Api` through the service worker cache; nothing a child does is sent back.

![C4 container view for grown-up gate and area](diagrams/c4-container.png)

### Components

The grown-up route is lazy; its first step is the gate, and only a passed gate shows the area.

![C4 component view for grown-up gate and area](diagrams/c4-component.png)

### Class structure

The gate holds only the sequence and the touches so far.

![Class diagram for grown-up gate and area](diagrams/class.png)

### Pass or fail the gate

Only the exact sequence opens the grown-up area; anything else returns to Home unchanged.

![Sequence for pass or fail the gate](diagrams/sequence-pass-gate.png)
