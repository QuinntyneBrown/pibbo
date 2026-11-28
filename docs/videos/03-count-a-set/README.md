# Journey 3 · Count a set

[`03-count-a-set.mp4`](03-count-a-set.mp4). Standard: [`../README.md`](../README.md). Requirements:
`L2-001`, `L2-002`, `L2-025`, `L2-026`.

**App sound: placeholders.** The "Pibbo plays" cards name the recordings the running app fetched;
no app sound is mixed in.

## Run sheet

| Scene | What is on screen | What it shows |
|-------|-------------------|---------------|
| hook | Count the toys at 1440 px | The activity |
| touch | The round on a phone, before and after three touches; the recordings played | `L2-001` #1, #2 |
| widths | The same round growing 390 → 768 → 1024 → 1440 px | More room, not more things |
| ask | "How many toys are there?" and its numerals | `L2-001` #4 |
| retry | A wrong numeral, the message and the recordings of the count again | `L2-002` #2, `L2-026` |
| yes | The right numeral, praise and Next | `L2-002` #1 |
| proof | The checks run on this machine | What no screen shows |
| close | The lockup and Pibbo's purpose | `AGENTS.md`, word for word |

## What it proves

The pictures and the file names come from the production build of the app
([`shots.ts`](shots.ts), the steps of `frontend/e2e/specs/count-the-toys.spec.ts`). A second touch
on a counted toy is checked there to play nothing.

## Rebuild

```shell
node tools/video-record/record.mjs docs/videos/03-count-a-set
python tools/video-audio/film_audio.py docs/videos/03-count-a-set
node tools/video-build/build.mjs docs/videos/03-count-a-set --crf 25
```
