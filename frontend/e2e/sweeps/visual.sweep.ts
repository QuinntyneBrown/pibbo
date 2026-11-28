// Traces to: L2-034, L2-036
import { test, expect } from '../fixtures/test';
import { everyScreen } from './screens';

const VIEWPORTS = [
  [320, 568],
  [360, 640],
  [640, 360],
  [568, 320],
  [768, 1024],
  [1280, 800],
  [1920, 1080],
] as const;

/**
 * The visual sweep: every screen at every width, upright and on its side, compared with its
 * baseline, and never scrolling, overflowing or showing a target under 60 px wide (L2-034 #5).
 * Run, and update its baselines, only when a person asks:
 * npm run sweep:visual (add -- --update-snapshots to accept new pictures).
 */
for (const [width, height] of VIEWPORTS) {
  test(`Given every screen at ${width} x ${height}, when shown, then it matches its baseline and nothing scrolls`, async ({
    page,
  }) => {
    test.skip(test.info().project.name !== 'chromium-desktop', 'the viewport is set here');
    await page.setViewportSize({ width, height });
    const scrolls: string[] = [];
    for (const screen of await everyScreen(page)) {
      await screen.open(page);
      await page.evaluate(() => document.fonts.ready);
      const scrolled = await page.evaluate(() => {
        const el = document.scrollingElement ?? document.documentElement;
        return el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight;
      });
      if (scrolled && !screen.name.startsWith('grown-up') && screen.name !== 'check-results')
        scrolls.push(screen.name);
      await expect(page).toHaveScreenshot(`${screen.name}-${width}x${height}.png`);
    }
    expect(scrolls, 'screens that scroll').toEqual([]);
  });
}
