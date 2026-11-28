// Traces to: L2-029, L2-037
import { test, expect } from '../fixtures/test';
import { GrownUpPage } from '../pages/grown-up.page';
import { HomePage } from '../pages/home.page';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The distance between the nearest edges of two boxes; 0 when they touch or overlap. */
function gap(a: Box, b: Box): number {
  const dx = Math.max(0, b.x - (a.x + a.width), a.x - (b.x + b.width));
  const dy = Math.max(0, b.y - (a.y + a.height), a.y - (b.y + b.height));
  return Math.hypot(dx, dy);
}

test.describe('The grown-up entry on Home', () => {
  for (const [width, height] of [
    [320, 568],
    [360, 640],
    [640, 360],
    [1280, 800],
  ] as const) {
    test(`Given Home at ${width} x ${height}, when shown with a group chosen, then the grown-up entry is a small corner control at least 48 px from any activity picture`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const home = new HomePage(page);
      const grownUp = new GrownUpPage(page);
      await home.open('/?group=read');

      await expect(grownUp.entry).toHaveAccessibleName('For grown-ups');
      const entry = (await grownUp.entry.boundingBox())!;
      expect(entry.width).toBeLessThanOrEqual(48);
      expect(entry.height).toBeLessThanOrEqual(48);
      expect(entry.x + entry.width).toBeGreaterThan(width - 64);
      expect(entry.y).toBeLessThan(64);
      for (const target of await home.targetBoxes()) {
        expect(gap(entry, target)).toBeGreaterThanOrEqual(48);
      }
    });
  }
});
