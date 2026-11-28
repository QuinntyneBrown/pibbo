// Traces to: L2-008, L2-025
import { test, expect } from '../fixtures/test';
import { AddTogetherPage } from '../pages/add-together.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/add-together.wav'];
const rec = (name: string) => `/recordings/count/${name}.wav`;
const number = (n: number) => `/recordings/numbers/${n}.wav`;
const upTo = (n: number) => Array.from({ length: n }, (_, i) => number(i + 1));

test.describe('Add together', () => {
  test("Given a new round, when it starts, then the star's turn is shown and spoken by a symbol, never a name, and only the star can add", async ({
    page,
    spoken,
  }) => {
    const add = new AddTogetherPage(page);
    await add.openFromHome();

    await expect(add.players).toHaveCount(2);
    await expect(add.symbol('Star')).toHaveAttribute('aria-label', 'Star');
    await expect(add.symbol('Moon')).toHaveAttribute('aria-label', 'Moon');
    await expect(add.turn).toHaveClass(/player--star/);
    await expect(add.instruction).toHaveText('Star’s turn. Add ducks to the pond.');
    await expect(add.add('Moon')).toHaveCount(0);
    await expect(add.action).toHaveText(/Done/);
    await expect(add.action).toBeDisabled();
    await expect(add.choices).toHaveCount(0);
    for (const target of [add.add('Star'), add.takeAway('Star'), add.action]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await add.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, rec('star-turn')]);

    await add.takeTurn('Star', 3);

    await expect(add.turn).toHaveClass(/player--moon/);
    await expect(add.add('Star')).toHaveCount(0);
    await expect(add.instruction).toHaveText('Moon’s turn. Add ducks to the pond.');
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, rec('star-turn'), ...upTo(3), rec('moon-turn')]);
  });

  test('Given the star added 3 and the moon 4, when both sets are shown, then "How many altogether?" is spoken, 7 is among three choices, and a wrong 6 counts all the ducks aloud from 1 to 7 before the players choose again', async ({
    page,
    spoken,
  }) => {
    const add = new AddTogetherPage(page);
    await add.openFromHome();
    await add.takeTurn('Star', 3);
    await add.takeTurn('Moon', 4);

    await expect(add.instruction).toHaveText('How many altogether?');
    await expect(add.sum).toHaveText(/3 \+ 4 =\s*\?/);
    await expect(add.choices).toHaveCount(3);
    await expect(add.choice(7)).toHaveCount(1);
    await expect
      .poll(async () => (await spoken.recordings()).at(-1))
      .toBe(rec('how-many-altogether'));
    expect(await add.scrolls()).toBe(false);

    await add.touch(add.choice(6));
    await expect(add.answer).toHaveText('6');
    await add.touch(add.action);

    await expect(add.message).toHaveText('Count all the ducks together, one by one.');
    await expect(add.choice(7)).toBeDisabled();
    await expect(add.ducks('Star')).toHaveCount(3);
    await expect(add.ducks('Moon')).toHaveCount(4);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-8))
      .toEqual([...upTo(7), rec('count-all-the-ducks')]);

    await add.touch(add.action);

    await expect(add.message).toHaveCount(0);
    await expect(add.answer).toHaveText('?');
    await expect(add.choice(7)).toBeEnabled();
  });

  test('Given the total is 7, when 7 is chosen and checked, then "3 and 4 make 7! Great teamwork." is spoken and shown, with no winner, loser or score, and Next starts a new round @critical', async ({
    page,
    spoken,
  }) => {
    const add = new AddTogetherPage(page);
    await add.openFromHome();
    await add.takeTurn('Star', 3);
    await add.takeTurn('Moon', 4);

    await add.touch(add.choice(7));
    await add.touch(add.action);

    await expect(add.message).toHaveText('3 and 4 make 7! Great teamwork.');
    await expect(add.answer).toHaveText('7');
    await expect(add.root).not.toContainText(/win|lose|score|points/i);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-6))
      .toEqual([number(3), rec('and'), number(4), rec('make'), number(7), rec('great-teamwork')]);

    await add.touch(add.action);

    await expect(add.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(add.turn).toHaveClass(/player--star/);
    await expect(add.ducks('Star')).toHaveCount(0);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(rec('star-turn'));
  });
});
