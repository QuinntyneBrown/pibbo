// Traces to: L2-016
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const word = (w: string) => `/recordings/words/${w}.wav`;
const ADD_E = '/recordings/read/add-a-quiet-e.wav';

/** A seed whose first round is "cape" (the cast of the mock, not a rule). */
const CAPE = 4;

test.describe('Sound it out: a silent-e word', () => {
  test.use({ seed: CAPE });

  test('Given a silent-e round, when it is shown, then "cap" appears with its picture and an e tile waiting to be added, and the instruction is spoken and shown', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();

    await expect.poll(() => read.tileLetters()).toEqual(['c', 'a', 'p']);
    await expect(read.silentE).toHaveText('e');
    await expect(read.silentE).toHaveAttribute('aria-pressed', 'false');
    await expect(read.silentE).toHaveClass(/tile--next/);
    await expect(read.beforeWord).toHaveText('cap');
    await expect(read.beforePicture).toHaveAttribute('src', /\/cap\.jpg$/);
    await expect(read.rule).toContainText('The e is quiet and makes a say its name');
    await expect(read.instruction).toHaveText('Add a quiet e to the end.');
    await expect(read.changed).toHaveCount(0);
    await expect(read.blend).toBeDisabled();
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(ADD_E);
    expect(await read.scrolls()).toBe(false);
  });
  test('Given "cap" with its picture, when the child touches the e tile, then the word becomes "cape", the a tile shows a change mark, "cape" is spoken, and the picture changes to a cape', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await expect(read.silentE).toHaveAttribute('aria-pressed', 'false');
    const before = (await spoken.recordings()).length;

    await read.touch(read.silentE);

    await expect(read.silentE).toHaveAttribute('aria-pressed', 'true');
    await expect(read.silentE).toHaveClass(/tile--added/);
    await expect(read.beforeWord).toHaveText('cape');
    await expect(read.beforePicture).toHaveAttribute('src', /\/cape\.jpg$/);
    await expect(read.changed).toHaveCount(1);
    await expect(read.changed).toHaveText('a');
    await expect(read.changed).toHaveAttribute('aria-label', 'a, changed by the quiet e');
    await expect(read.changeMark).toHaveCount(1);
    await expect(read.instruction).toHaveText('Tap each letter to hear its sound.');
    await expect(read.letter(0)).toHaveClass(/tile--next/);
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([word('cape')]);
  });

  test('Given "cape", when the child touches the e tile again, then e is removed and "cap" is spoken', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await read.touch(read.silentE);
    await expect(read.beforeWord).toHaveText('cape');
    const added = (await spoken.recordings()).length;

    await read.touch(read.silentE);

    await expect(read.silentE).toHaveAttribute('aria-pressed', 'false');
    await expect(read.beforeWord).toHaveText('cap');
    await expect(read.beforePicture).toHaveAttribute('src', /\/cap\.jpg$/);
    await expect(read.changed).toHaveCount(0);
    await expect.poll(async () => (await spoken.recordings()).slice(added)).toEqual([word('cap')]);
  });
});
