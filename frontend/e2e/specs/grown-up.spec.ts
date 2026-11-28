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

test.describe('The gate', () => {
  test('Given the grown-up entry is touched, when the gate opens, then it asks in words only for three different numbers in order, and nothing is spoken', async ({
    page,
    spoken,
  }) => {
    const grownUp = new GrownUpPage(page);
    await grownUp.openGate();

    await expect(page.getByRole('heading', { name: 'For grown-ups' })).toBeVisible();
    await expect(grownUp.area).toHaveCount(0);
    await expect(grownUp.gateTask).toHaveText(
      /^Touch (one|two|three|four|five|six|seven|eight|nine), [a-z]+, [a-z]+ in order\.$/,
    );
    const asked = await grownUp.asked();
    expect(asked).toHaveLength(3);
    expect(new Set(asked).size).toBe(3);
    await expect(grownUp.gateKeys).toHaveText(['1', '2', '3', '4', '5', '6', '7', '8', '9']);
    expect(await spoken.recordings()).toEqual([]);
  });

  test('@critical Given the gate, when the three numbers are touched in order, then the grown-up area opens', async ({
    page,
  }) => {
    const grownUp = new GrownUpPage(page);
    await grownUp.openGate();
    const [a, b, c] = await grownUp.asked();

    await grownUp.touch(grownUp.key(a!));
    await grownUp.touch(grownUp.key(b!));
    await expect(grownUp.gateDots).toHaveCount(2);
    await grownUp.touch(grownUp.key(c!));

    await expect(grownUp.area).toBeVisible();
    await expect(page).toHaveURL(/\/grown-up$/);
    await expect(grownUp.gate).toHaveCount(0);
  });

  test('Given the gate, when a wrong number is touched, then it closes and Home is unchanged', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    const grownUp = new GrownUpPage(page);
    await home.open('/?group=count');
    await grownUp.touch(grownUp.entry);
    const [a] = await grownUp.asked();
    const wrong = [1, 2, 3, 4, 5, 6, 7, 8, 9].find((n) => n !== a)!;

    await grownUp.touch(grownUp.key(wrong));

    await expect(grownUp.gate).toHaveCount(0);
    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\/\?group=count$/);
    expect(await spoken.recordings()).toEqual([]);
  });

  test('Given the gate, when Back to Pibbo is touched, then Home is unchanged', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const grownUp = new GrownUpPage(page);
    await home.open('/?group=read');
    await grownUp.touch(grownUp.entry);
    await expect(grownUp.gate).toBeVisible();

    await grownUp.touch(grownUp.gateClose);

    await expect(grownUp.gate).toHaveCount(0);
    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/\/\?group=read$/);
  });

  test('Given the grown-up screen, when it is opened by typing its address, then the gate is shown first', async ({
    page,
  }) => {
    const grownUp = new GrownUpPage(page);
    await page.goto('/grown-up');

    await expect(grownUp.gate).toBeVisible();
    await expect(grownUp.area).toHaveCount(0);
  });
});

test.describe('The grown-up area', () => {
  test('Given the area, when shown, then it offers volume, clear progress and about Pibbo, and has no link out', async ({
    page,
  }) => {
    const grownUp = new GrownUpPage(page);
    await grownUp.openArea();

    await expect(page.getByRole('heading', { level: 2 })).toHaveText([
      'Volume',
      'Progress',
      'About Pibbo',
    ]);
    await expect(grownUp.volume).toHaveText(['Quiet', 'Medium', 'Loud']);
    await expect(grownUp.volume.nth(1)).toHaveAttribute('aria-checked', 'true');
    await expect(grownUp.clear).toHaveText('Clear progress');
    await expect(page.locator('a[href]:not([href^="#"])')).toHaveCount(0);
    await expect(page.locator('iframe, script[src^="http"]')).toHaveCount(0);
  });

  test('@critical Given progress on the device, when Clear progress is confirmed, then all of it is erased, the volume is kept and "Progress cleared." is said on screen', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem('seeded')) return;
      sessionStorage.setItem('seeded', '1');
      localStorage.setItem('pibbo:practice', '{"version":1,"practised":["count-the-toys"]}');
      localStorage.setItem('pibbo:check', '{"version":1,"earned":["count-the-toys"]}');
      localStorage.setItem('pibbo:volume', '"loud"');
      const db = indexedDB.open('pibbo-content', 1);
      db.onsuccess = () => db.result.close();
    });
    const grownUp = new GrownUpPage(page);
    await grownUp.openArea();

    await grownUp.touch(grownUp.clear);
    await expect(grownUp.confirm).toBeVisible();
    await expect(grownUp.keep).toBeFocused();
    await grownUp.touch(grownUp.confirmClear);

    await expect(grownUp.status).toHaveText('Progress cleared.');
    const left = await page.evaluate(async () => ({
      keys: Object.keys(localStorage).filter((k) => k.startsWith('pibbo:')),
      dbs: (await indexedDB.databases()).map((d) => d.name),
    }));
    expect(left.keys).toEqual(['pibbo:volume']);
    expect(left.dbs).not.toContain('pibbo-content');
    await expect(grownUp.volume.nth(2)).toHaveAttribute('aria-checked', 'true');
  });

  test('Given the confirmation, when Keep it is touched, then nothing is erased', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem('pibbo:check', '{"version":1,"earned":["count-the-toys"]}'),
    );
    const grownUp = new GrownUpPage(page);
    await grownUp.openArea();

    await grownUp.touch(grownUp.clear);
    await grownUp.touch(grownUp.keep);

    await expect(grownUp.confirm).toHaveCount(0);
    await expect(grownUp.clear).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('pibbo:check'))).not.toBeNull();
  });

  test('Given the area, when Quiet is chosen, then it is kept on the device and every recording plays at it', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const w = window as unknown as { __volume: number };
      w.__volume = 1;
      Object.defineProperty(HTMLMediaElement.prototype, 'volume', {
        configurable: true,
        get: () => w.__volume,
        set: (v: number) => (w.__volume = v),
      });
    });
    const home = new HomePage(page);
    const grownUp = new GrownUpPage(page);
    await grownUp.openArea();

    await grownUp.touch(grownUp.volume.first());

    await expect(grownUp.volume.first()).toHaveAttribute('aria-checked', 'true');
    expect(await page.evaluate(() => localStorage.getItem('pibbo:volume'))).toBe('"quiet"');
    await grownUp.touch(grownUp.back);
    await home.touch(home.group('Count'));
    const volume = await page.evaluate(() => (window as unknown as { __volume: number }).__volume);
    expect(volume).toBeLessThan(0.6);
  });
});
