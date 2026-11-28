// Traces to: L2-032
import { test, expect } from '../fixtures/test';
import { everyActivity, openFromHome, playALittle } from '../pages/every-activity';
import { HomePage } from '../pages/home.page';

/** How much the heap may grow between the second and the last visit, in bytes. */
const ALLOWED_GROWTH = 1_000_000;
const VISITS = 6;

/**
 * The heap sweep: each activity is opened, played a little and left, again and again. After a
 * garbage collection the heap must not keep growing: everything an activity acquires is released
 * when the child leaves. Run only when a person asks: npm run sweep:heap
 */
test('Given each activity is opened, played and left again and again, when the heap is measured after each visit, then it does not keep growing', async ({
  page,
}) => {
  test.skip(test.info().project.name !== 'chromium-desktop', 'one heap is enough');
  const cdp = await page.context().newCDPSession(page);
  const heap = async () => {
    await cdp.send('HeapProfiler.collectGarbage');
    return (await cdp.send('Runtime.getHeapUsage')).usedSize;
  };
  const home = new HomePage(page);
  const growth: string[] = [];

  for (const activity of await everyActivity(page)) {
    const sizes: number[] = [];
    for (let visit = 0; visit < VISITS; visit++) {
      await openFromHome(page, activity);
      await playALittle(page, 4);
      await home.open();
      sizes.push(await heap());
    }
    // The first visit loads the activity's code once; after that, nothing should pile up.
    const grew = sizes.at(-1)! - sizes[1]!;
    if (grew > ALLOWED_GROWTH) growth.push(`${activity.name}: +${Math.round(grew / 1024)} kB`);
  }
  expect(growth).toEqual([]);
});
