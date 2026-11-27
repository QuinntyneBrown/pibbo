import { test as base, expect, type Page } from '@playwright/test';

/**
 * The shared fixture every spec imports `test` and `expect` from.
 *
 * - The clock is fixed, so anything timed asks the same thing on every run.
 * - `Math.random` is replaced by a seeded generator, so anything random comes in the same order.
 * - The audio player is stood in for: `HTMLMediaElement.play` records the recording it was
 *   asked to play and ends at once; no real sound is played and no spec waits for one.
 * - A network guard fails the spec on any request off localhost, any request left unanswered
 *   and any page error.
 */

export const FIXED_TIME = new Date('2026-01-05T09:00:00Z');
export const RANDOM_SEED = 20260105;

export interface Spoken {
  /** The recordings asked for, in order, as paths on Pibbo's own origin. */
  recordings(): Promise<string[]>;
}

interface Fixtures {
  spoken: Spoken;
  guard: void;
}

function installFakes(seed: number): void {
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
  (window as unknown as { __spoken: string[] }).__spoken = asked;
  HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
    asked.push(new URL(this.currentSrc || this.src, location.href).pathname);
    queueMicrotask(() => this.dispatchEvent(new Event('ended')));
    return Promise.resolve();
  };
  HTMLMediaElement.prototype.pause = function pause() {
    /* nothing is playing */
  };
  HTMLMediaElement.prototype.load = function load() {
    /* nothing is fetched */
  };
}

function isLocal(url: string): boolean {
  const { protocol, hostname } = new URL(url);
  if (protocol === 'data:' || protocol === 'blob:' || protocol === 'about:') return true;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

async function guardNetwork(page: Page, use: () => Promise<void>): Promise<void> {
  const problems: string[] = [];
  const pending = new Set<string>();

  await page.route(
    (url) => !isLocal(url.href),
    (route) => {
      problems.push(`request off localhost: ${route.request().url()}`);
      return route.abort('blockedbyclient');
    },
  );
  page.on('request', (r) => pending.add(r.url()));
  page.on('requestfinished', (r) => pending.delete(r.url()));
  page.on('requestfailed', (r) => {
    pending.delete(r.url());
    if (isLocal(r.url())) problems.push(`request failed: ${r.url()} (${r.failure()?.errorText})`);
  });
  page.on('pageerror', (e) => problems.push(`page error: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error') problems.push(`console error: ${m.text()}`);
  });

  await use();

  await page.waitForLoadState('networkidle').catch(() => undefined);
  for (const url of pending) problems.push(`request unanswered: ${url}`);
  expect(problems, 'the network guard').toEqual([]);
}

export const test = base.extend<Fixtures>({
  page: async ({ page }, use) => {
    await page.clock.install({ time: FIXED_TIME });
    await page.addInitScript(installFakes, RANDOM_SEED);
    await use(page);
  },
  guard: [async ({ page }, use) => guardNetwork(page, use), { auto: true }],
  spoken: async ({ page }, use) => {
    await use({
      recordings: () =>
        page.evaluate(() => [...(window as unknown as { __spoken: string[] }).__spoken]),
    });
  },
});

export { expect };
