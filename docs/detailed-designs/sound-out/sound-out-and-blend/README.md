# Sound out and blend a three-sound word

## Overview

Sound Out is the reading activity. A short word of three single-letter sounds ("map") appears with its picture. The child touches each letter to hear its sound, then touches *blend* to hear the sounds run together into the word.

- **blending** — speaking a word's sounds closer together until they become the word
- **blend control** — touch target that starts blending

## Description

The feature is a vertical slice through the Angular workspace: the page in the `pibbo` application, presentation components in `@pibbo/components`, pure rules in `@pibbo/domain`, and the contracts and tokens in `@pibbo/api`.

- **`SoundItOut`** — route component in `pibbo` (`pages/sound-it-out`), loaded by `loadComponent` at `/read/sound-out` when the child chooses the activity. It holds the round in a signal, plays recordings through `AUDIO_PLAYER`, times praise through `CLOCK` and provides `ASSET_PRELOADER` at its own scope.
- **`WordTiles`** — presentation component in `@pibbo/components` (selector `pb-word-tiles`, blocks `.tiles` and `.blend`). It takes the letters, which are heard, which is next and which is sounding, emits `touched` per letter and `blend`, and injects nothing.
- **`PicturePick`** — presentation component in `@pibbo/components` (selector `pb-picture-pick`, block `.pick`): three pictures, the chosen one `aria-pressed`, the right one `--right`.
- **`RoundShell`** and **`AnswerBar`** — shared with Count; the shell takes the activity's group (`shell--read`) and the bar gains a `retry` kind (Try again).
- **`SoundOutRound`** — immutable round state in `@pibbo/domain/sounds`; every transition returns a new value. Phases: `sounding`, `ready`, `blending`, `picking`, `retry`, `right`, `modelled`.
- **Round rules** — pure functions in `@pibbo/domain/sounds` (`startRound`, `touchLetter`, `blendPlan`, `blendDone`, `choosePicture`, `checkPicture`, `tryAgain`) with unit tests; the wrong-answer rule is `answerOutcome` from `@pibbo/domain/rounds`.
- **`SOUND_OUT`** — the content, data in `sound-out-content.json`: words (sounds, picture, recording) and sounds (recording, how each is shown). `tools/content/check-content.mjs` checks it before every build.
- **`PlaybackStep`** — one recording plus the letter to light while it plays; a blend plan is a list of steps played in order through `AUDIO_PLAYER`.
- **`AssetPreloader`** — contract in `@pibbo/api` bound to `ASSET_PRELOADER`; fetches the next round's picture and recordings while the child plays, keeps at most two rounds and aborts on destroy.
- **`AudioPlayer`** — contract in `@pibbo/api` bound to `AUDIO_PLAYER`. Playing a recording stops the one before it; a recording that cannot play resolves as `failed` and the screen already shows what it would have said.

The frontend does not call the backend (ADR 0032): words, pictures and recordings are bundled with the app (ADR 0003, ADR 0008). The diagrams below predate this and still draw `Pibbo.Api` and a service worker; they are to be redrawn.

## Requirements

The feature realises the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-012` | `L1-010` | Sound out and blend a three-sound word. A word of three single-letter sounds ("map") is shown with its picture. |

Acceptance criteria of `L2-012` (Sound out and blend a three-sound word), as reconciled with the mock (ADR 0008):

1. Given "map" is shown, when the child touches m, a, p in turn, then "mmm", "a", "p" are spoken and each letter is highlighted as it sounds and shows its sound beneath it.
2. Given all three sounds have been heard, when the child touches blend, then the sounds are spoken again back to back, each letter lit as it sounds, "map" is spoken, and three pictures are offered.
3. Given not every letter has been heard, when the round is shown, then blend is offered but not yet active, and the next letter to touch is marked.
4. Given a recording is playing, when another letter is touched, then the playing recording stops and the new one starts within 100 ms.
5. Given three pictures are offered, when the child chooses the picture of "map" and touches Check, then that picture is highlighted, brief praise plays, and the next round is offered; a wrong picture follows `L2-026`.

## Diagrams

### System context

The child uses Pibbo directly; a grown-up is beside or nearby and is not needed to make the feature work. No third-party system takes part.

![C4 system context for sound out and blend a three-sound word](diagrams/c4-context.png)

### Containers

The feature runs in the `pibbo` single-page application. Content is bundled with the app and served from Pibbo's own origin; nothing a child does is sent back.

![C4 container view for sound out and blend a three-sound word](diagrams/c4-container.png)

### Components

`SoundOutPage` composes `WordTilesComponent` for presentation and calls `blendRules` for every decision. The page is the only part that injects tokens; the rules hold no Angular dependency.

![C4 component view for sound out and blend a three-sound word](diagrams/c4-component.png)

### Class structure

`SoundOutRound` is the value the rules transform; `SoundOutPage` holds it in a signal and passes it to `WordTilesComponent`.

![Class diagram for sound out and blend a three-sound word](diagrams/class.png)

### Touch each letter, then blend

Each touch stops the playing recording and starts the new one within 100 ms. Blend first plays any sound not yet heard, then the sounds closer together, then the word.

![Sequence for touch each letter, then blend](diagrams/sequence-sound-out-and-blend.png)

## Open questions

- Which words and sounds Sound Out covers, and in what order: the mock cast (map, sun, cat) stands in.
- The real recordings of each sound, recorded alone with no vowel after a consonant.
- The diagrams still draw a backend and a service worker; they need redrawing without them.
