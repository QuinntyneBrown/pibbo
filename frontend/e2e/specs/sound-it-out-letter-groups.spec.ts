// Traces to: L2-014
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const wordRecording = (w: string) => `/recordings/words/${w}.wav`;
const WHICH = '/recordings/read/which-picture.wav';
const SAY_FAST = '/recordings/read/say-them-fast.wav';

/** Seeds whose first round is the word named (the cast of the mock, not a rule). */
const SHIP = 14;
const NIGHT = 6;
const BOAT = 1;

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

test.describe('Sound it out: blending a word with a letter group', () => {
  test.describe('night', () => {
    test.use({ seed: NIGHT });

    test('Given "night" shown as [n][igh][t], when sounded out and blended, then three sounds play and "night" is spoken @critical', async ({
      page,
      spoken,
    }) => {
      const read = new SoundItOutPage(page);
      await read.openFromHome();
      await expect.poll(() => read.tileLetters()).toEqual(['n', 'igh', 't']);
      expect(await read.scrolls()).toBe(false);
      const before = (await spoken.recordings()).length;

      await read.soundAll();
      await expect(read.shownSounds).toHaveText(['/n/', '/ī/', '/t/']);
      await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(SAY_FAST);
      const blended = (await spoken.recordings()).length;
      await read.touch(read.blend);

      await expect(read.pictures).toHaveCount(3);
      await expect(read.instruction).toHaveText('Which picture is “night”?');
      const all = await spoken.recordings();
      expect(all.slice(before, before + 3)).toEqual(['n', 'igh', 't'].map(sound));
      expect(all.slice(blended)).toEqual([
        ...['n', 'igh', 't'].map(sound),
        wordRecording('night'),
        WHICH,
        wordRecording('night'),
      ]);
      await read.answer('night');
      await expect(read.message).toHaveText('You read “night”!');
    });
  });

  test.describe('boat', () => {
    test.use({ seed: BOAT });

    test('Given "boat" shown as [b][oa][t], when blended, then "boat" is spoken', async ({
      page,
      spoken,
    }) => {
      const read = new SoundItOutPage(page);
      await read.openFromHome();
      await expect.poll(() => read.tileLetters()).toEqual(['b', 'oa', 't']);
      await read.soundAll();
      await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(SAY_FAST);
      const blended = (await spoken.recordings()).length;

      await read.touch(read.blend);

      await expect(read.pictures).toHaveCount(3);
      expect((await spoken.recordings()).slice(blended, blended + 4)).toEqual([
        ...['b', 'oa', 't'].map(sound),
        wordRecording('boat'),
      ]);
      await expect(read.instruction).toHaveText('Which picture is “boat”?');
    });
  });
});
