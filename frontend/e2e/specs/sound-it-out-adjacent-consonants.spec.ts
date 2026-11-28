// Traces to: L2-015
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const sound = (s: string) => `/recordings/sounds/${s}.wav`;

/** A seed whose first round is "stop" (the cast of the mock, not a rule). */
const STOP = 4;

test.describe('Sound it out: adjacent consonants are each their own sound', () => {
  test.use({ seed: STOP });

  test('Given "stop" shown as [s][t][o][p], when the child touches s then t, then "sss" and "t" are each spoken separately', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await expect.poll(() => read.tileLetters()).toEqual(['s', 't', 'o', 'p']);
    const before = (await spoken.recordings()).length;

    await read.touch(read.letter(0));
    await expect(read.letter(0)).toHaveClass(/tile--heard/);
    await expect(read.letter(1)).toHaveClass(/tile--next/);
    await read.touch(read.letter(1));

    await expect(read.letter(1)).toHaveClass(/tile--heard/);
    await expect(read.letter(1)).toHaveAttribute('aria-label', 't, says /t/');
    await expect(read.shownSounds).toHaveText(['/s/', '/t/']);
    await expect(read.letter(2)).toHaveClass(/tile--next/);
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([sound('s'), sound('t')]);
  });
});
