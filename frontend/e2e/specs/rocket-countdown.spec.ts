// Traces to: L2-006, L2-025
import { test, expect } from '../fixtures/test';
import { RocketCountdownPage } from '../pages/rocket-countdown.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/rocket-countdown.wav'];
const ASK = '/recordings/count/what-comes-next-going-down.wav';
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
});
