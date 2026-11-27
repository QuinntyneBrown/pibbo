# Recognise common words

## Overview

Common words ("the", "is", "said") are high-frequency words practised by sight. They come back in later rounds, chosen by on-device *spaced repetition*.

- **spaced repetition** — scheduling that brings a word back sooner after a wrong answer and later after a right one

## Description

The feature is a vertical slice through the Angular workspace: the page in the `pibbo` application, presentation components in `@pibbo/components`, pure rules in `@pibbo/domain`, and the contracts and tokens in `@pibbo/api`.

- **`CommonWordsPage`** — route component in `pibbo`, loaded by `loadComponent` when the child chooses the activity. It is provided with its own `repetitionRules` state at route scope, asks the rules for each round, plays recordings through `AUDIO_PLAYER` and hands state to the presentation component.
- **`WordChoiceComponent`** — presentation component in `@pibbo/components` (selector `pb-wordchoice`). It takes the round state as signal inputs, emits a `touched` output per target, and injects no service.
- **`RepetitionState`** — immutable round state in `@pibbo/domain/sounds`; every transition returns a new value.
- **`repetitionRules`** — pure functions in `@pibbo/domain/sounds` that build a round from the injected `RandomSource` and decide the outcome of each touch, with unit tests.
- **`AudioPlayer`** — contract in `@pibbo/api` bound to `AUDIO_PLAYER`. Playing a recording stops the one before it; a recording that cannot play resolves as `unavailable` and the screen shows the text instead.
- **`RoundFeedback`** — shared round behaviour (`retry-and-praise`): brief praise, hints after a wrong answer, and modelling the answer after three wrong answers.
- **`ProgressStore`** — on-device storage contract (`privacy/device-only-data`); state is validated on read and is never sent to the backend. Whether Pibbo remembers practice at all is not decided in `AGENTS.md` and needs an ADR (`<TO SUPPLY>`).

## Requirements

The feature realises the following level-2 (L2) requirements. Each L2 requirement refines a level-1 (L1) requirement, cited by identifier.

| L2 ID | Refines (L1) | Requirement |
|-------|--------------|-------------|
| `L2-019` | `L1-017` | Recognise common words. Common words ("the", "is", "said") appear in rounds and come back in later rounds, chosen by on-device spaced repetition. |

Acceptance criteria of `L2-019` (Recognise common words):

1. Given "the" is spoken with 3 word choices, when the child chooses "the", then praise plays; when another word is chosen, then that word is spoken and "the" is highlighted.
2. Given a common word answered wrongly, when the next 5 common-word rounds are generated, then that word appears in at least one of them.
3. Given repetition state, when saved, then it is in on-device storage only and is never sent to the backend.

## Diagrams

### System context

The child uses Pibbo directly; a grown-up is beside or nearby and is not needed to make the feature work. No third-party system takes part.

![C4 system context for recognise common words](diagrams/c4-context.png)

### Containers

The feature runs in the `pibbo` single-page application. Content arrives from `Pibbo.Api` through the service worker cache; nothing a child does is sent back.

![C4 container view for recognise common words](diagrams/c4-container.png)

### Components

`CommonWordsPage` composes `WordChoiceComponent` for presentation and calls `repetitionRules` for every decision. The page is the only part that injects tokens; the rules hold no Angular dependency.

![C4 component view for recognise common words](diagrams/c4-component.png)

### Class structure

`RepetitionState` is the value the rules transform; `CommonWordsPage` holds it in a signal and passes it to `WordChoiceComponent`.

![Class diagram for recognise common words](diagrams/class.png)

### Choose a common word

A wrong answer makes that word due within the next 5 common-word rounds.

![Sequence for choose a common word](diagrams/sequence-choose-common-word.png)
