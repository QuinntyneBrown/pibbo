import { test as base, expect, type Page, type Request } from '@playwright/test';

/**
 * The shared fixture every spec imports `test` and `expect` from.
 *
 * - The clock is fixed, so anything timed asks the same thing on every run.
 * - `Math.random` is replaced by a seeded generator, so anything random comes in the same order.
 * - The audio player is stood in for: `HTMLMediaElement.play` records the recording it was
 *   asked to play and ends at once; no real sound is played and no spec waits for one. Only the
 *   film recorder (tools/video-record) turns this off with `playback: 'real'`, so the player
 *   fetches and plays each file (ADR 0031).
 * - A network guard fails the spec on any request off localhost, any request left unanswered
 *   and any page error, and on any ask for the microphone or the camera (L2-009 #6).
 * - Service workers are blocked, so a spec starts from nothing kept; a spec of offline play
 *   allows them (`test.use({ serviceWorkers: 'allow' })`) and goes offline through `network`
 *   (ADR 0032).
 */

export const FIXED_TIME = new Date('2026-01-05T09:00:00Z');
export const RANDOM_SEED = 20260105;

export interface Spoken {
  /** The recordings asked for, in order, as paths on Pibbo's own origin. */
  recordings(): Promise<string[]>;
  /** How many times a playing recording was stopped. */
  stops(): Promise<number>;
}

/** `'off'` stands for a muted device: every recording fails to play (L2-025 #3). */
export type Sound = 'on' | 'off';

/** `'real'` leaves the audio player alone and only notes what it was asked to play. */
export type Playback = 'fake' | 'real';
export interface Network {
  /**
   * Takes the device offline. `expected` names the requests a spec expects to fail while
   * offline (an activity never opened); any other failure still fails the spec.
   */
  offline(expected?: (url: string) => boolean): Promise<void>;
  online(): Promise<void>;
}

interface Fixtures {
  sound: Sound;
  /**
   * `fixed` (every behaviour spec): the clock is fixed and only moves when a spec moves it.
   * `real`: time passes as it does for a child, for the load-time sweep alone (L2-032 #1, #2).
   */
  clock: 'fixed' | 'real';
  playback: Playback;
  network: Network;
  /** The seed of the random source; a spec that needs a particular round sets it (ADR 0009). */
  seed: number;
  spoken: Spoken;
  guard: void;
}

function installFakes({
  seed,
  sound,
  playback,
}: {
  seed: number;
  sound: Sound;
  playback: Playback;
}): void {
  // Seeded random source (mulberry32).
  let state = seed >>> 0;
  Math.random = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  // The stand-in audio player.
  const asked: string[] = [];
  const stops = { count: 0 };
  (window as unknown as { __spoken: string[] }).__spoken = asked;
  (window as unknown as { __stops: { count: number } }).__stops = stops;
  if (playback === 'real') {
    const { play, pause } = HTMLMediaElement.prototype;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      asked.push(new URL(this.src || this.currentSrc, location.href).pathname);
      return play.call(this);
    };
    HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
      stops.count++;
      pause.call(this);
    };
  } else {
    HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
      asked.push(new URL(this.src || this.currentSrc, location.href).pathname);
      if (sound === 'off') return Promise.reject(new DOMException('muted', 'NotAllowedError'));
      queueMicrotask(() => this.dispatchEvent(new Event('ended')));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function pause() {
      stops.count++;
    };
    HTMLMediaElement.prototype.load = function load() {
      /* nothing is fetched */
    };
  }

  // The microphone and the camera are never asked for: any ask is noted for the guard.
  const media = navigator.mediaDevices;
  if (media) {
    media.getUserMedia = () => {
      console.error('the microphone or camera was asked for');
      return Promise.reject(new DOMException('never', 'NotAllowedError'));
    };
  }
}

function isLocal(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  if (protocol === 'data:' || protocol === 'blob:' || protocol === 'about:') return true;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/** What the guard allows while a spec has taken the device offline. */
interface OfflineAllowance {
  expected: ((url: string) => boolean) | null;
}

async function guardNetwork(
  page: Page,
  offline: OfflineAllowance,
  use: () => Promise<void>,
): Promise<void> {
  const problems: string[] = [];
  // Keyed by request, not URL: a recording is fetched twice (preloaded, then played), and the
  // two fetches overlap.
  const pending = new Set<Request>();

  await page.route(
    (url) => !isLocal(url.href),
    (route) => {
      problems.push(`request off localhost: ${route.request().url()}`);
      return route.abort('blockedbyclient');
    },
  );
  page.on('request', (r) => pending.add(r));
  page.on('requestfinished', (r) => pending.delete(r));
  page.on('requestfailed', (r) => {
    pending.delete(r);
    // A recording cut short by the next one (one sound at a time) aborts its download, leaving
    // an activity aborts the fetches of its next round, and a picture whose word changes while
    // it loads (a fast touch under load) aborts its image.
    const stoppedRecording =
      ['media', 'fetch', 'image'].includes(r.resourceType()) &&
      r.failure()?.errorText === 'net::ERR_ABORTED';
    const expectedOffline = offline.expected?.(new URL(r.url()).pathname) ?? false;
    if (isLocal(r.url()) && !stoppedRecording && !expectedOffline)
      problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    // The browser logs the expected offline failure itself.
    const url = m.location().url;
    if (m.type() === 'error' && url && offline.expected?.(new URL(url).pathname)) return;
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });

  await use();

  // A fetch the last touch started (the next round's preload) may still be in flight when the
  // spec ends; `networkidle` has already been reached once and does not wait for it. Give each
  // request still open a bounded time to settle; one that never does is unanswered.
  await expect
    .poll(() => pending.size, { timeout: 5000 })
    .toBe(0)
    .catch(() => undefined);
  for (const r of pending) problems.push(`request unanswered: ${r.url()}`);
  expect(problems, 'the network guard').toEqual([]);
}

export const test = base.extend<Fixtures & { offlineAllowance: OfflineAllowance }>({
  sound: ['on', { option: true }],
  playback: ['fake', { option: true }],
  seed: [RANDOM_SEED, { option: true }],
  clock: ['fixed', { option: true }],
  page: async ({ page, sound, seed, clock, playback }, use) => {
    if (clock === 'fixed') await page.clock.install({ time: FIXED_TIME });
    await page.addInitScript(installFakes, { seed, sound, playback });
    await use(page);
  },
  // Playwright needs the empty pattern for a fixture with no dependencies.
  // eslint-disable-next-line no-empty-pattern
  offlineAllowance: async ({}, use) => use({ expected: null }),
  guard: [
    async ({ page, offlineAllowance }, use) => guardNetwork(page, offlineAllowance, use),
    { auto: true },
  ],
  network: async ({ context, offlineAllowance }, use) => {
    await use({
      offline: async (expected) => {
        offlineAllowance.expected = expected ?? null;
        await context.setOffline(true);
      },
      online: async () => {
        await context.setOffline(false);
      },
    });
  },
  spoken: async ({ page }, use) => {
    await use({
      recordings: () =>
        page.evaluate(() => [...(window as unknown as { __spoken: string[] }).__spoken]),
      stops: () =>
        page.evaluate(() => (window as unknown as { __stops: { count: number } }).__stops.count),
    });
  },
});

export { expect };
