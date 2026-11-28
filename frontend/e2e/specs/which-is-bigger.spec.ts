// Traces to: L2-005, L2-025
import { test, expect } from '../fixtures/test';
import { WhichIsBiggerPage } from '../pages/which-is-bigger.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/which-is-bigger.wav'];
const ASK = '/recordings/count/which-is-bigger.wav';
const number = (n: number) => `/recordings/numbers/${n}.wav`;

/** The seed whose first round shows 6 on the left and 9 on the right (ADR 0010). */
const SIX_AND_NINE = 511;

test.describe('Which is bigger', () => {
  test.use({ seed: SIX_AND_NINE });

  test('Given a round from the random source, when it is shown, then two numbers are shown as numerals and dots, the question is spoken and shown, and touching a card speaks its number and chooses it', async ({
    page,
    spoken,
  }) => {
    const compare = new WhichIsBiggerPage(page);
    await compare.openFromHome();

    await expect(compare.cards).toHaveCount(2);
    await expect(compare.numeral(0)).toHaveText('6');
    await expect(compare.numeral(1)).toHaveText('9');
    await expect(compare.dots(0)).toHaveCount(6);
    await expect(compare.dots(1)).toHaveCount(9);
    await expect(compare.card(0)).toHaveAttribute('aria-label', '6, 6 dots');
    await expect(compare.instruction).toHaveText('Which number is bigger?');
    await expect(compare.action).toBeDisabled();
    for (const card of await compare.cards.all()) {
      const box = (await card.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await compare.scrolls()).toBe(false);

    await compare.touch(compare.card(0));
    await compare.touch(compare.card(1));

    await expect(compare.card(1)).toHaveAttribute('aria-pressed', 'true');
    await expect(compare.card(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(compare.action).toBeEnabled();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK, number(6), number(9)]);
  });
});
