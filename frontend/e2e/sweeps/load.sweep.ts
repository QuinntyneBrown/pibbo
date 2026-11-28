// Traces to: L2-032
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';

test.use({ clock: 'real' });

/** A mid-range phone on a slow 4G network (L2-032 #1). */
const NETWORK = {
  offline: false,
  latency: 150,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
};
const CPU_SLOWDOWN = 4;

/**
 * The load-time sweep, with time passing as it does for a child: Home's Largest Contentful Paint
 * and initial script on a throttled phone, and how fast a touch is answered (L2-032 #1, #2).
 * Run only when a person asks: npm run sweep:load
 */
test('Given a mid-range phone on 4G, when Home loads cold, then its Largest Contentful Paint is at most 2.5 s and its initial script at most 250 KB gzipped, and a touch is answered within 100 ms', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-phone', 'a phone');
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', NETWORK);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: CPU_SLOWDOWN });
  // The script Home loads, as sent over the network (gzipped).
  const scripts = new Set<string>();
  let script = 0;
  cdp.on('Network.responseReceived', (e) => {
    if (e.type === 'Script') scripts.add(e.requestId);
  });
  cdp.on('Network.loadingFinished', (e) => {
    if (scripts.has(e.requestId)) script += e.encodedDataLength;
  });
  await page.addInitScript(() => {
    const w = window as unknown as { __lcp: number; __events: number[] };
    w.__lcp = 0;
    w.__events = [];
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__lcp = e.startTime;
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((list) => {
      for (const e of list.getEntries()) w.__events.push(e.duration);
    }).observe({ type: 'event', buffered: true, durationThreshold: 16 } as PerformanceObserverInit);
  });

  const home = new HomePage(page);
  await home.open();
  await page.waitForLoadState('networkidle');
  const lcp = await page.evaluate(() => (window as unknown as { __lcp: number }).__lcp);
  expect(lcp).toBeLessThanOrEqual(2500);
  expect(script).toBeLessThanOrEqual(250 * 1024);

  // Touches on Home's targets: the slowest is answered within 100 ms and p75 within 200 ms.
  for (const target of [home.group('Count'), home.group('Read'), home.group('Count')]) {
    await home.touch(target);
  }
  const events = await page.evaluate(() =>
    (window as unknown as { __events: number[] }).__events.sort((a, b) => a - b),
  );
  const p75 = events[Math.floor(events.length * 0.75)] ?? 0;
  expect(p75).toBeLessThanOrEqual(200);
  const shown = await page.evaluate(async () => {
    const start = performance.now();
    (document.querySelector('.switch__option') as HTMLElement).click();
    await new Promise(requestAnimationFrame);
    return performance.now() - start;
  });
  expect(shown).toBeLessThanOrEqual(100);
});
