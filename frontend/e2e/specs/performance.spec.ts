// Traces to: L2-032
import { test, expect } from '../fixtures/test';
import { everyActivity, openFromHome } from '../pages/every-activity';
import { HomePage } from '../pages/home.page';

test.describe('A touch answers at once', () => {
  test('@critical Given each activity is opened, when its first round shows, then what its first touch plays has already been fetched', async ({
    page,
    spoken,
  }) => {
    test.slow();
    const fetched = new Set<string>();
    page.on('requestfinished', (r) => fetched.add(new URL(r.url()).pathname));
    const home = new HomePage(page);

    for (const activity of await everyActivity(page)) {
      await openFromHome(page, activity);
      await page.locator('.shell__game').waitFor();
      await page.clock.runFor(500);
      await page.waitForLoadState('networkidle');
      const before = new Set(fetched);
      const heard = (await spoken.recordings()).length;

      // The first target of the round that speaks when touched.
      const targets = page.locator('.shell__game button:not([disabled])');
      let played: string[] = [];
      for (let i = 0; i < Math.min(4, await targets.count()) && played.length === 0; i++) {
        await home.touch(targets.nth(i));
        await page.clock.runFor(100);
        played = (await spoken.recordings()).slice(heard);
      }

      expect(played.length, `${activity.name}: a touch is spoken`).toBeGreaterThan(0);
      expect(
        before.has(played[0]!),
        `${activity.name}: ${played[0]} fetched before the touch`,
      ).toBe(true);
    }
  });
});
