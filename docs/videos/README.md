# Pibbo videos

One narrated explainer a journey of [`docs/journeys.md`](../journeys.md), for the grown-up nearby
and for whoever works on Pibbo. The text files are the source; the media is generated from them.
Where this page differs from the defaults of the `creating-videos` skill, this page wins: the films
follow the standard of the owner's sibling repository `wattzup`, with the same voice, music and
transitions (its `docs/videos/11-1-results-screen`), in Pibbo's own brand. Decision:
[ADR 0031](../adr/0031-explainer-films-from-the-running-app.md).

| Journey | Video | Runtime | What it is |
|---------|-------|---------|------------|

**App sound: placeholders.** Every recording the app ships is a silent placeholder, so the films
mix in none. Where Pibbo speaks, a "Pibbo plays" card names the recordings the running app
fetched at that step.

## What every video is

- **Narrated.** Kokoro-82M (`onnx-community/Kokoro-82M-v1.0-ONNX`), voice `af_heart`, run locally
  with `kokoro-onnx`: free, no key, no hosted speech service.
- **Set to boom bap.** "Beautiful Boom Bap" ([credits](assets/music/CREDITS.md)) plays from the
  first frame to the last, 16 dB under the voice and 5 dB under it between lines.
- **No captions.** Nothing is burned into the picture. `captions.vtt` is written beside the MP4 for
  a player to show to someone who needs it.
- **Branded.** The tokens of `docs/design-system/tokens/tokens.css`, Fredoka for headlines and
  Andika for words, and the wordmark and mascot as the mocks draw them. Pibbo sits in the corner of
  every scene between the opening and the close.
- **Picture-led.** Screenshots of the running app carry the film. A scene holds a headline of a few
  words with some in the accent colour, a label or a card; it never transcribes the narration.
- **Moving.** Scenes change with designed transitions, on the beat of the music.
- **True.** It shows and says only what the app does, in the words of `docs/specs/`. The close
  quotes Pibbo's purpose from `AGENTS.md` word for word, on screen and in the voice. The mission
  is not written, so no film states one.

Format: 1920×1080, 30 fps, H.264 with AAC audio, 60 to 150 seconds, under about 15 MB.

## Folder

```
docs/videos/NN-journey-name/        named as the journey's prompt in docs/prompts/
  narration.json     the lines, their scenes and the voice                     (written)
  film.js            the scenes: markup and the functions that move it         (written)
  slides.html        the page that plays the film                              (written)
  shots.ts           which states of the app to open and what to save          (written)
  README.md          what the video shows, its run sheet, what it proves       (written)
  script.md          the transcript                                            (written)
  shots/             PNG at double density, and heard.js                       (generated, committed)
  timing.js          the scene grid and the lines in film time                 (generated, committed)
  captions.vtt       captions in film time, a sidecar file                     (generated, committed)
  NN-journey-name.mp3 / .mp4    voice with ducked music, and the film          (generated, committed)
```

Shared by every film, in `assets/`: `film.css` (the stage in Pibbo's brand), `film-runtime.js`
(scenes on the bar grid, `seek(seconds)`, word rises, wipes, the growing screen, the aurora),
`film-kit.js` (devices arriving, close-ups, fact cards, the terminal, the "Pibbo plays" card, the
opening, the close, the act transitions and the corner mark) and `music/`.

## Tools

| Tool | What it does |
|------|--------------|
| [`tools/video-record/`](../../tools/video-record/README.md) | Builds the app, serves it and runs a folder's `shots.ts`, saving `shots/`. |
| [`tools/video-audio/`](../../tools/video-audio/README.md) | Speaks `narration.json`, fits each line to its scene, mixes the music under it, writes the MP3, `captions.vtt` and `timing.js`. |
| [`tools/video-build/`](../../tools/video-build/README.md) | Seeks `slides.html` frame by frame and encodes the MP4. `--check` prints the schedule; `--frame <seconds> <png>` saves one frame. |

They need Node with `frontend/node_modules` (`cd frontend && npm ci`), Python 3.10 or later with
`kokoro-onnx` and `numpy` (`pip install kokoro-onnx numpy`), and ffmpeg with libx264
(`FFMPEG_PATH` overrides). From the repository root:

```shell
node tools/video-record/record.mjs docs/videos/NN-journey-name
python tools/video-audio/film_audio.py docs/videos/NN-journey-name
node tools/video-build/build.mjs docs/videos/NN-journey-name --crf 25
```

None of them is part of a test run, and CI never runs them.

## Screenshots

- **From the running app, never from the mocks.** `shots.ts` uses the shared fixture and page
  objects of `frontend/e2e/`, with real audio playback. No request is stubbed.
- **Every width.** Take the key state at 390, 768, 1024 and 1440 px. Pibbo is shot in its light
  theme, with reduced motion.
- **Close-ups.** Small text is unreadable at 1080p. Save a `detail` shot of the region a line is
  about and enlarge that.
- **Vary the layout.** No two scenes in a row share a layout or a field. Acts change colour.

## Slides and motion

- **Every pixel is a pure function of film time.** `slides.html` plays live against the MP3 and
  exposes `seek(seconds)`. No CSS animation or transition, no timer, no unseeded random number.
- **Cut to the music.** 92.99 BPM, a bar of 2.581 s. A scene is a whole number of bars.
- **Transitions are designed, and few.** A change of act is a wipe in a brand colour, a push, or a
  zoom through a screenshot. Inside an act the cuts are hard.
- **One scene grows the same screen** from the phone to the desktop.
- **The aurora opens and closes the film** behind the lockup. It is the only shader.
- **Calm, like the app:** no confetti and no flashing.

## Narration

- Two sentences a scene is plenty. Second person, to the grown-up nearby: warm and concrete.
- **Never say a letter's name, or a sound with a vowel added.** The voice cannot say a lone sound
  rightly, so it says "each letter's sound"; the "Pibbo plays" card names the recordings.
- The shape: a hook; the journey on screen; the widths; one card for what the tests prove; the
  close, with the lockup and the purpose.

## Check before committing

- `ffprobe -v error -show_entries format=duration:stream=codec_name,width,height <mp4>` gives
  1920×1080, `h264` and `aac`, and a duration that matches the MP3.
- Save one frame a scene with `--frame` and look at each: nothing clipped, small text readable, no
  blank frame, the brand on every frame, no captions.
- Add the video's row to the table at the top of this page.
