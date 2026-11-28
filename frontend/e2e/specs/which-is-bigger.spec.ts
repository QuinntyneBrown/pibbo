// Traces to: L2-005, L2-025
import { test, expect } from '../fixtures/test';
import { WhichIsBiggerPage } from '../pages/which-is-bigger.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/which-is-bigger.wav'];
const ASK = '/recordings/count/which-is-bigger.wav';
const BIGGER_THAN = '/recordings/count/is-bigger-than.wav';
const YES = '/recordings/count/yes.wav';
const MORE = '/recordings/count/which-has-more.wav';
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

  test('Given 6 and 9 are shown, when the child touches 9 and then Check, then "nine is bigger than six" is spoken and shown, praise plays, and Next starts the next round', async ({
    page,
    spoken,
  }) => {
    const compare = new WhichIsBiggerPage(page);
    await compare.openFromHome();

    await compare.answer(1);

    await expect(compare.message).toHaveText('9 is bigger than 6!');
    await expect(compare.card(1)).toHaveClass(/compare__card--won/);
    await expect(compare.card(0)).toBeDisabled();
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, ASK, number(9), number(9), BIGGER_THAN, number(6), YES]);

    await compare.touch(compare.action);

    await expect(compare.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(compare.message).toHaveCount(0);
    await expect(compare.card(0)).toHaveAttribute('aria-pressed', 'false');
    await expect(compare.card(1)).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(ASK);
  });

  test('Given 6 and 9 are shown, when the child touches 6 and then Check, then the 3 extra dots of 9 are highlighted, the hint is spoken and shown, and after Try again the child chooses again', async ({
    page,
    spoken,
  }) => {
    const compare = new WhichIsBiggerPage(page);
    await compare.openFromHome();

    await compare.answer(0);

    await expect(compare.extraDots).toHaveCount(3);
    await expect(compare.extraDotsIn(1)).toHaveCount(3);
    await expect(compare.dots(1)).toHaveCount(9);
    await expect(compare.dots(0)).toHaveCount(6);
    await expect(compare.message).toHaveText('Look at the dots. Which has more?');
    await expect(compare.action).toHaveText(/Try again/);
    await expect(compare.card(1)).toBeDisabled();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK, number(6), MORE]);

    await compare.touch(compare.action);

    await expect(compare.extraDots).toHaveCount(0);
    await expect(compare.card(0)).toHaveAttribute('aria-pressed', 'false');
    await compare.answer(1);
    await expect(compare.message).toHaveText('9 is bigger than 6!');
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(YES);
  });
});
