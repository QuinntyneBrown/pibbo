// Traces to: L2-007, L2-025
import { test, expect } from '../fixtures/test';
import { SkipCountPage } from '../pages/skip-count.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/skip-count.wav'];
const hopBy = (step: number) => `/recordings/count/hop-by-${step}s.wav`;
const WHERE = '/recordings/count/where-do-we-land-next.wav';
const number = (n: number) => `/recordings/numbers/${n}.wav`;

/** Seeds whose first round counts by 5 and by 2 (ADR 0012). */
const BY_FIVES = 1;
const BY_TWOS = 7;
const COUNT_ON = '/recordings/count/count-on.wav';
const MORE_FROM = '/recordings/count/more-from.wav';
const ALL_THE_WAY = '/recordings/count/all-the-way-to.wav';
const upTo = (step: number, last: number) =>
  Array.from({ length: last / step }, (_, i) => (i + 1) * step);

test.describe('Skip-count', () => {
  test.use({ seed: BY_FIVES });

  test('Given a round by 5s, when it begins, then "Hop by 5s" is spoken and shown, the line starts at 0 and three choices are offered @critical', async ({
    page,
    spoken,
  }) => {
    const skip = new SkipCountPage(page);
    await skip.openFromHome();

    await expect(skip.chosenStep).toHaveText(/By 5s/);
    await expect(skip.line).toHaveAttribute('aria-label', 'Number line counting by 5: 0');
    await expect(skip.instruction).toHaveText('Hop by 5s. Where do we land next?');
    await expect(skip.choices).toHaveCount(3);
    await expect(skip.choice(5)).toHaveCount(1);
    for (const target of [...(await skip.choices.all()), ...(await skip.steps.all())]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await skip.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, hopBy(5), WHERE]);
  });

  test('Given step 5 and the sequence 5, 10, when the child chooses 14, then nothing advances, "Count on 5 more from 10." is spoken and shown, and after Try again the sequence runs on to 50', async ({
    page,
    spoken,
  }) => {
    const skip = new SkipCountPage(page);
    await skip.openFromHome();
    for (const n of [5, 10]) await skip.hop(n);

    await skip.touch(skip.choice(14));

    await expect(skip.message).toHaveText('Count on 5 more from 10.');
    await expect(skip.said).toHaveCount(3);
    await expect(skip.choice(15)).toBeDisabled();
    await expect(skip.action).toHaveText(/Try again/);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-4))
      .toEqual([COUNT_ON, number(5), MORE_FROM, number(10)]);

    await skip.touch(skip.action);

    await expect(skip.message).toHaveCount(0);
    for (const n of upTo(5, 50).slice(2)) await skip.hop(n);
    await expect(skip.message).toHaveText('Hop, hop, hop — all the way to 50!');
    await expect(skip.labels).toHaveText(['0', ...upTo(5, 50).map(String)]);
  });

  test('Given a round by 5s, when the child touches By 10s, then the line starts again from 0 and the sequence runs 10, 20 ... 100', async ({
    page,
    spoken,
  }) => {
    const skip = new SkipCountPage(page);
    await skip.openFromHome();
    await skip.hop(5);

    await skip.touch(skip.step(10));

    await expect(skip.chosenStep).toHaveText(/By 10s/);
    await expect(skip.line).toHaveAttribute('aria-label', 'Number line counting by 10: 0');
    await expect(skip.instruction).toHaveText('Hop by 10s. Where do we land next?');
    await expect
      .poll(async () => (await spoken.recordings()).slice(-2))
      .toEqual([hopBy(10), WHERE]);
    for (const n of upTo(10, 100)) await skip.hop(n);
    await expect(skip.instruction).toHaveText('You counted by 10s to 100!');
    await expect(skip.labels).toHaveText(['0', ...upTo(10, 100).map(String)]);
    expect(await skip.scrolls()).toBe(false);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-3))
      .toEqual([number(100), ALL_THE_WAY, number(100)]);
  });

  test.describe('by 2s', () => {
    test.use({ seed: BY_TWOS });

    test('Given step 2, when the child chooses 2, 4, 6 ... 20 in order, then each number is spoken as chosen and shown on the line, praise plays at 20, and Next starts the next round', async ({
      page,
      spoken,
    }) => {
      const skip = new SkipCountPage(page);
      await skip.openFromHome();
      await expect(skip.chosenStep).toHaveText(/By 2s/);

      for (const n of [2, 4, 6]) await skip.hop(n);
      await expect(skip.line).toHaveAttribute(
        'aria-label',
        'Number line counting by 2: 0, 2, 4, 6',
      );
      await expect(skip.said).toHaveCount(4);
      for (const n of upTo(2, 20).slice(3)) await skip.hop(n);

      await expect(skip.choices).toHaveCount(0);
      await expect(skip.labels).toHaveText(['0', ...upTo(2, 20).map(String)]);
      await expect(skip.instruction).toHaveText('You counted by 2s to 20!');
      await expect(skip.message).toHaveText('Hop, hop, hop — all the way to 20!');
      await expect
        .poll(() => spoken.recordings())
        .toEqual([...HOME, hopBy(2), WHERE, ...upTo(2, 20).map(number), ALL_THE_WAY, number(20)]);

      await skip.touch(skip.action);

      await expect(skip.progress).toHaveAttribute('aria-valuenow', '1');
      await expect(skip.choices).toHaveCount(3);
      await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(WHERE);
    });
  });
});

test.describe('Skip-count: the step switch as its mock draws it', () => {
  test('Given a round, when the switch is shown, then the steps sit on one tray, the chosen one filled and the others flat', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const skip = new SkipCountPage(page);

    await skip.openFromHome();

    await expect
      .poll(() => skip.switchSurfaces())
      .toEqual({
        tray: 'rgb(237, 225, 248)',
        options: ['rgb(80, 25, 192)', 'rgba(0, 0, 0, 0)', 'rgba(0, 0, 0, 0)'],
      });
  });
});
