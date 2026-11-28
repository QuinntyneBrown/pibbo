# video-record

Saves a video's screenshots: runs the folder's `shots.ts` in Chromium against the production build
of the app and writes PNGs at double density into the folder's `shots/`. Standard:
[`docs/videos/README.md`](../../docs/videos/README.md), "Screenshots". Decision: ADR 0031.

```
node tools/video-record/record.mjs docs/videos/NN-journey-name            # builds, then records
node tools/video-record/record.mjs docs/videos/NN-journey-name --no-build # uses the last build
```

It is not a test and not a sweep. It has its own Playwright config (here, matching only `shots.ts`
in the given folder), compares nothing, and is not run by `npm run e2e` or CI. It empties `shots/`,
serves the build on `:4310` with `frontend/e2e/serve.mjs` (with the real security headers) and
imports the shared fixture of `frontend/e2e/fixtures/test.ts` with `playback: 'real'`: the clock
and the random order stay fixed, the guard still fails on a page error or a request off this
machine, and the audio player fetches and plays every recording from that server. No request is
stubbed or answered by the test.

| Helper (`shots.ts`) | What it does |
|---------------------|--------------|
| `frame(page, size)` | Sets the window (`'XS'` 390×780, `'M'` 768×1024, `'L'` 1024×768, `'XL'` 1440×900), light, with reduced motion. Call it before opening a screen. |
| `shot(page, name)` | Saves the window as `shots/<name>.png`, once fonts and pictures have arrived. |
| `detail(locator, name, pad = 16)` | Saves one region with `pad` CSS pixels of air around it. |
| `detailAll(locators, name, pad = 16)` | The same for the smallest region holding several. |
| `heard(page, spoken, name)` | Lists the recordings played since the last call, checks the server answered each, and adds them to `shots/heard.js` for the film's "Pibbo plays" card. |
| `listen(page, spoken)` | Starts a new `heard` list from now. |
| `pictures(page)` | Waits until every picture on the page has arrived. |

Selectors stay in the page objects of `frontend/e2e/pages/`.
