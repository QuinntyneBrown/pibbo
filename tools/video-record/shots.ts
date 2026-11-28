import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type { Locator, Page } from '@playwright/test';
import { expect, test as base, type Spoken } from '../../frontend/e2e/fixtures/test';

/**
 * Helpers for a video's `shots.ts`. A shot is a PNG of the running app at double density, saved
 * in the video folder's `shots/`; `film.js` then draws a phone, a tablet or a browser window
 * around it. See docs/videos/README.md, "Screenshots".
 */

/** The shared fixture with real audio playback: every recording is fetched and played. */
export const test = base.extend({
  playback: async ({}, use) => use('real'),
});
export { expect };

/** Where the pictures go: `<video folder>/shots`. */
export const shotsDir = path.resolve(process.env['PB_VIDEO_DIR'] ?? '.', 'shots');

/** The four form factors a film shows. */
export const SIZES = {
  XS: { width: 390, height: 780 },
  M: { width: 768, height: 1024 },
  L: { width: 1024, height: 768 },
  XL: { width: 1440, height: 900 },
} as const;
export type Size = keyof typeof SIZES;

/** What the server answered for each recording a page asked for, by path. */
const served = new WeakMap<Page, Map<string, number>>();
/** How many of the recordings asked for have already been listed. */
const listed = new WeakMap<Page, number>();
const heardCards: Record<string, string[]> = {};

/**
 * Sets the window, with reduced motion in the light theme, and starts noting the server's answers
 * for recordings. Call it before opening a screen.
 */
export async function frame(page: Page, size: Size): Promise<void> {
  await page.setViewportSize(SIZES[size]);
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' });
  if (!served.has(page)) {
    const answers = new Map<string, number>();
    served.set(page, answers);
    page.on('response', (response) => {
      const { pathname } = new URL(response.url());
      if (pathname.startsWith('/recordings/')) answers.set(pathname, response.status());
    });
  }
}

function file(name: string): string {
  mkdirSync(shotsDir, { recursive: true });
  return path.join(shotsDir, name);
}

/** Waits until every picture on the page has arrived. */
export async function pictures(page: Page): Promise<void> {
  await expect
    .poll(() => page.evaluate(() => [...document.images].every((i) => i.complete && i.naturalWidth)))
    .toBe(true);
}

/** Waits until the bundled faces and the pictures are drawn. */
async function settle(page: Page): Promise<void> {
  await page.evaluate(() => document.fonts.ready);
  await pictures(page);
}

/** Saves what the window shows as `shots/<name>.png`. */
export async function shot(page: Page, name: string): Promise<void> {
  await settle(page);
  await page.screenshot({ path: file(`${name}.png`), animations: 'disabled', caret: 'hide' });
}

/** Saves one region with `pad` CSS pixels of air around it: the close-up of a scene. */
export async function detail(region: Locator, name: string, pad = 16): Promise<void> {
  await detailAll([region], name, pad);
}

/** The same for the smallest region holding several. */
export async function detailAll(regions: Locator[], name: string, pad = 16): Promise<void> {
  const page = regions[0]!.page();
  await settle(page);
  const boxes = [];
  for (const region of regions) {
    for (const each of await region.all()) {
      const box = await each.boundingBox();
      if (box) boxes.push(box);
    }
  }
  if (!boxes.length) throw new Error(`The region of "${name}" is not on the page.`);
  const view = page.viewportSize()!;
  const x = Math.max(0, Math.min(...boxes.map((b) => b.x)) - pad);
  const y = Math.max(0, Math.min(...boxes.map((b) => b.y)) - pad);
  await page.screenshot({
    path: file(`${name}.png`),
    animations: 'disabled',
    caret: 'hide',
    clip: {
      x,
      y,
      width: Math.min(view.width, Math.max(...boxes.map((b) => b.x + b.width)) + pad) - x,
      height: Math.min(view.height, Math.max(...boxes.map((b) => b.y + b.height)) + pad) - y,
    },
  });
}

/** Forgets what has been asked for so far, so the next `heard` lists only what comes after. */
export async function listen(page: Page, spoken: Spoken): Promise<void> {
  listed.set(page, (await spoken.recordings()).length);
}

/**
 * The recordings the app has played since the last `heard` or `listen`, for the film's "Pibbo
 * plays" card `name`. Each must have been answered by the server (200 or 206), so the card never
 * names a file the running app did not really fetch. Saved to `shots/heard.js`.
 */
export async function heard(page: Page, spoken: Spoken, name: string): Promise<string[]> {
  const all = await spoken.recordings();
  const from = Math.min(listed.get(page) ?? 0, all.length);
  const fresh = all.slice(from);
  listed.set(page, all.length);
  expect(fresh.length, `something was played for "${name}"`).toBeGreaterThan(0);
  const answers = served.get(page);
  if (!answers) throw new Error('call frame() before opening the screen');
  for (const recording of fresh) {
    await expect
      .poll(() => answers.get(recording), { message: `the server answered ${recording}` })
      .toBeDefined();
    expect([200, 206], recording).toContain(answers.get(recording));
  }
  const files = fresh.map((recording) => recording.replace('/recordings/', ''));
  heardCards[name] = files;
  writeFileSync(file('heard.js'), `window.HEARD = ${JSON.stringify(heardCards, null, 2)};\n`);
  return files;
}
