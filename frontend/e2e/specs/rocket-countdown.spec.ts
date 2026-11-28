// Traces to: L2-006, L2-025
import { test, expect } from '../fixtures/test';
import { RocketCountdownPage } from '../pages/rocket-countdown.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/rocket-countdown.wav'];
const ASK = '/recordings/count/what-comes-next-going-down.wav';
const BLAST_OFF = '/recordings/count/blast-off.wav';
const number = (n: number) => `/recordings/numbers/${n}.wav`;

/** The seed whose first round starts at 10 (ADR 0011). */
const START_TEN = 24;

test.describe('Rocket countdown', () => {
  test.use({ seed: START_TEN });

  test('Given start 10, when the round begins, then "ten" is spoken and shown as the start, with three choices and the rocket on the pad', async ({
    page,
    spoken,
  }) => {
    const countdown = new RocketCountdownPage(page);
    await countdown.openFromHome();

    await expect(countdown.now).toHaveText('10');
    await expect(countdown.track).toHaveAttribute('aria-label', 'Counting down from 10');
    await expect(countdown.instruction).toHaveText('We’re at 10. What comes next going down?');
    await expect(countdown.choices).toHaveCount(3);
    await expect(countdown.choice(9)).toHaveCount(1);
    await expect(countdown.rocket).toHaveClass(/launch__rocket--0/);
    for (const choice of await countdown.choices.all()) {
      const box = (await choice.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await countdown.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, number(10), ASK]);
  });

  test('Given start 10, when the child chooses 9, 8 ... 0 in order, then each number is spoken as chosen and shown on the track, praise plays at 0, and Next starts the next round', async ({
    page,
    spoken,
  }) => {
    const countdown = new RocketCountdownPage(page);
    await countdown.openFromHome();

    await countdown.step(9);
    await expect(countdown.said).toHaveText(['10']);
    await expect(countdown.instruction).toHaveText('We’re at 9. What comes next going down?');
    await expect(countdown.rocket).toHaveClass(/launch__rocket--1/);
    for (let n = 8; n >= 0; n--) await countdown.step(n);

    await expect(countdown.said).toHaveCount(11);
    await expect(countdown.choices).toHaveCount(0);
    await expect(countdown.instruction).toHaveText('Blast off!');
    await expect(countdown.message).toHaveText('3, 2, 1… blast off!');
    await expect(countdown.rocket).toHaveClass(/launch__rocket--off/);
    await expect
      .poll(() => spoken.recordings())
      .toEqual([
        ...HOME,
        number(10),
        ASK,
        ...[9, 8, 7, 6, 5, 4, 3, 2, 1, 0].map(number),
        BLAST_OFF,
      ]);

    await countdown.touch(countdown.action);

    await expect(countdown.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(countdown.choices).toHaveCount(3);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(ASK);
  });
});
