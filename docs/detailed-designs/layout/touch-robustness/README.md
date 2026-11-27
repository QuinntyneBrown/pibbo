# Touch robustness

## Overview

A small child pinches, double-taps, long-presses and rests a palm on the screen. None of these zooms the page, selects text, opens a context menu or makes an answer. A tap from another finger is still handled.

## Description

The feature is a vertical slice through the Angular workspace: the page in the `pibbo` application, presentation components in `@pibbo/components`, pure rules in `@pibbo/domain`, and the contracts and tokens in `@pibbo/api`.

- **`Global touch styles`** — `touch-action: manipulation`, `user-select: none` and `-webkit-touch-callout: none` on activity screens; viewport meta prevents pinch zoom inside activities.
- **`TapDirective`** — directive `pbTap` turning a primary-pointer short press into one `tap` event; it ignores contacts larger than a palm threshold and non-primary pointers starting at the screen edge (`<TO SUPPLY>` thresholds), and suppresses `contextmenu`.

## Requirements

The feature realises the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-035` | `L1-028` | Touch robustness |

Acceptance criteria of `L2-035` (Touch robustness):

1. Given any activity, when the child pinches, double-taps or long-presses, then the page does not zoom, select text or open a context menu, and no answer is made.
2. Given a palm resting on the screen edge, when another finger taps a target, then the tap is handled and the resting contact activates nothing.

## Diagrams

### System context

The child uses Pibbo directly; a grown-up is beside or nearby and is not needed to make the feature work. No third-party system takes part.

![C4 system context for touch robustness](diagrams/c4-context.png)

### Containers

The feature runs in the `pibbo` single-page application. Content arrives from `Pibbo.Api` through the service worker cache; nothing a child does is sent back.

![C4 container view for touch robustness](diagrams/c4-container.png)

### Components

Every target in `@pibbo/components` uses `pbTap` rather than raw click handling.

![C4 component view for touch robustness](diagrams/c4-component.png)

### Class structure

`TapDirective` holds per-pointer state and releases its listeners on destroy.

![Class diagram for touch robustness](diagrams/class.png)

### A resting palm and a tap

The palm contact is ignored; the finger tap is emitted once.

![Sequence for a resting palm and a tap](diagrams/sequence-palm-and-tap.png)
