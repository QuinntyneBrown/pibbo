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
