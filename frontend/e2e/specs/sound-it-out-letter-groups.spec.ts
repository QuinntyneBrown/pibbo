// Traces to: L2-014
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const sound = (s: string) => `/recordings/sounds/${s}.wav`;

/** Seeds whose first round is the word named (the cast of the mock, not a rule). */
const SHIP = 1;

test.describe('Sound it out: a letter group is one tile', () => {
  test.use({ seed: SHIP });

  test('Given "ship" shown as [sh][i][p], when the child touches [sh], then one recording "shhh" plays, not "s" then "h"', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await expect.poll(() => read.tileLetters()).toEqual(['sh', 'i', 'p']);
    const before = (await spoken.recordings()).length;

    await read.touch(read.letter(0));

    await expect(read.letter(0)).toHaveClass(/tile--heard/);
    await expect(read.letter(0)).toHaveAttribute('aria-label', 'sh, says /sh/');
    await expect(read.shownSounds).toHaveText(['/sh/']);
    await expect(read.letter(1)).toHaveClass(/tile--next/);
    expect((await spoken.recordings()).slice(before)).toEqual([sound('sh')]);
  });

  test('Given a letter-group tile, when displayed, then its letters share one tile outline and the tile is at least 60 x 60 px', async ({
    page,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();

    await expect(read.letters).toHaveCount(3);
    await expect(read.letter(0)).toHaveText('sh');
    const box = (await read.letter(0).boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(60);
    expect(box.height).toBeGreaterThanOrEqual(60);
    const single = (await read.letter(1).boundingBox())!;
    expect(box.width).toBeGreaterThan(single.width);
    expect(await read.scrolls()).toBe(false);
  });
});
