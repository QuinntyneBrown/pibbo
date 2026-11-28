// Traces to: L2-016
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const word = (w: string) => `/recordings/words/${w}.wav`;
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const ADD_E = '/recordings/read/add-a-quiet-e.wav';
const WHICH = '/recordings/read/which-picture.wav';
const READ_AGAIN = '/recordings/read/read-again.wav';

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
  test('Given "cap" with its picture, when the child touches the e tile, then the word becomes "cape", the a tile shows a change mark, "cape" is spoken, and the picture changes to a cape @critical', async ({
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

  test('Given a round asking for the picture of "cape", when the cap picture is chosen, then "cap" is spoken and the child chooses again', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    expect(await read.soundAndBlend()).toBe('cape');

    // The round asks for "cape", and the cap is among the pictures: a real choice.
    await expect(read.instruction).toHaveText('Which picture is “cape”?');
    expect(await read.pictureWords()).toEqual(expect.arrayContaining(['cap', 'cape']));
    // The rule and the tiles stay, the quiet e added and no longer a toggle; the word's own
    // picture is not shown beside them.
    await expect(read.rule).toContainText('The e is quiet and makes a say its name');
    await expect(read.beforePicture).toHaveCount(0);
    await expect(read.silentE).toBeDisabled();
    await expect(read.silentE).toHaveAttribute('aria-pressed', 'true');
    await expect(read.silentE).toHaveAttribute('aria-label', 'e, quiet');
    await expect(read.changeMark).toHaveCount(1);
    expect(await read.scrolls()).toBe(false);
    const asked = (await spoken.recordings()).length;

    await read.touch(read.picture('cap'));

    await expect(read.picture('cap')).toHaveAttribute('aria-pressed', 'true');
    await expect.poll(async () => (await spoken.recordings()).slice(asked)).toEqual([word('cap')]);

    // Checked, it is a chance to try again: nothing heard is taken away.
    await read.touch(read.action);
    await expect(read.message).toHaveText('Read it again, then look closely.');
    await expect(read.heard).toHaveCount(3);
    expect((await spoken.recordings()).at(-1)).toBe(READ_AGAIN);
    const hinted = (await spoken.recordings()).length;

    await read.touch(read.action);

    await expect(read.pictures.first()).toBeEnabled();
    expect((await spoken.recordings()).slice(hinted)).toEqual([
      sound('c'),
      sound('a_e'),
      sound('p'),
      word('cape'),
      WHICH,
      word('cape'),
    ]);
    await read.answer('cape');
    await expect(read.message).toHaveText('You read “cape”!');
    await expect(read.rightPicture).toHaveCount(1);
  });
});

for (const viewport of [
  { width: 320, height: 640 },
  { width: 360, height: 640 },
  { width: 640, height: 360 },
]) {
  test.describe(`Sound it out: a silent-e word fits at ${viewport.width} x ${viewport.height}`, () => {
    test.use({ seed: CAPE, viewport });

    test('Given "cape" with its quiet e added, when shown, then its three letters and the e sit in one row, each at least 60 x 60 px, with nothing to scroll', async ({
      page,
    }) => {
      const read = new SoundItOutPage(page);
      await read.openFromHome();
      await read.touch(read.silentE);
      await expect(read.silentE).toHaveAttribute('aria-pressed', 'true');

      const boxes = await read.tileBoxes(true);
      expect(boxes).toHaveLength(4);
      expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(1);
      for (const b of boxes) {
        expect(b.width).toBeGreaterThanOrEqual(60);
        expect(b.height).toBeGreaterThanOrEqual(60);
      }
      expect(await read.scrolls()).toBe(false);
    });
  });
}
