# 0031: Explainer films: one a journey, pictured from the running app

**Status:** Accepted (asked for by the repository owner)

## Context

The repository owner asked for a narrated explainer video of every implemented journey, with the
voice, music and transitions of the owner's sibling repository `wattzup`, no captions, slides in
Pibbo's design system, and pictures of the running app only, using real requests. Pibbo has no
backend, and its recordings are silent placeholders.

## Decision

1. **One folder a journey in `docs/videos/`.** Text sources and the generated media are both
   committed. The standard is `docs/videos/README.md`.
2. **The tools live outside `frontend/`**, in `tools/video-audio/`, `tools/video-build/` and
   `tools/video-record/`, copied from `wattzup` and changed as little as possible. They are not
   part of the app, its build, `npm run e2e` or CI. They run only when a person runs them.
3. **Pictures come from the production build**, served by `frontend/e2e/serve.mjs`. No request is
   stubbed or answered by the recorder. The clock and the random order stay fixed (the shared
   fixture), so a rerun gives the same pictures, and the fixture's guard still fails on a page
   error or a request off this machine.
4. **The shared fixture gains `playback: 'real' | 'fake'`.** It defaults to `'fake'`, so specs
   are unchanged. The recorder uses `'real'`: the audio player fetches and plays each recording.
5. **No app sound is mixed in while the recordings are placeholders.** A "Pibbo plays" card shows
   the files the app fetched at that step, and says they are placeholders. The recorder fails if
   the server did not answer one.
6. **The films' brand is the mocks'**: tokens, fonts, wordmark and mascot. `docs/brand/` still
   holds an earlier mascot and is not used.

## Consequences

- The repository grows by the media of each film.
- A film shows the app as it was when recorded; rebuilding one is three commands.
- Making a film needs Python with `kokoro-onnx` and `numpy`, and ffmpeg, which the app does not.
- When real recordings arrive, the films can be re-recorded and the sound mixed in.
