// Traces to: L2-010, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { LetterSoundsPage } from '../pages/letter-sounds.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/letter-sounds.wav'];
const TAP = '/recordings/read/tap-a-letter-then-its-sound.wav';
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
/** The cast of the mock: each letter and how its sound is shown. */
const PAIRS: Record<string, string> = { m: '/m/', s: '/s/', t: '/t/', c: '/k/' };

test.describe('Letter sounds: a round', () => {
  test('Given the child chooses Letter sounds, when the round is shown, then four letters and their four sounds are shown in a different order, each sound with a picture, and the instruction is spoken and shown', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();

    expect(await read.letterTexts()).toEqual(['m', 's', 't', 'c']);
    const shown = await read.soundTexts();
    expect([...shown].sort()).toEqual(Object.values(PAIRS).sort());
    expect(shown).not.toEqual(Object.values(PAIRS));
    await expect(read.sounds.locator('img')).toHaveCount(4);
    await expect(read.sound('/k/')).toHaveAttribute('aria-label', 'The sound /k/, as in cat');
    await expect(read.letter('m')).toHaveAttribute('aria-label', 'Letter m');
    await expect(read.letter('m')).toHaveAttribute('aria-pressed', 'false');
    await expect(read.instruction).toHaveText('Tap a letter, then the sound it makes.');
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    for (const target of [...(await read.letters.all()), ...(await read.sounds.all())]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await read.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, TAP]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    const home = new HomePage(page);
    await read.openFromHome();

    await read.touch(read.replay);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, TAP, TAP]);
    await read.touch(read.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Letter sounds')).toBeVisible();
  });
});

test.describe('Letter sounds: each letter makes its sound', () => {
  test('Given a round, when the child touches m, then m is held and its sound is spoken, never its name; when the child touches t, then t is held instead', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();

    await read.touch(read.letter('m'));
    await expect(read.letter('m')).toHaveAttribute('aria-pressed', 'true');
    await read.touch(read.letter('t'));

    await expect(read.letter('t')).toHaveAttribute('aria-pressed', 'true');
    await expect(read.letter('m')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, TAP, sound('m'), sound('t')]);
  });

  test('Given no letter is held, when the child touches the sound /k/, then its recording is spoken and nothing is matched', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();

    await read.touch(read.sound('/k/'));

    await expect.poll(() => spoken.recordings()).toEqual([...HOME, TAP, sound('c')]);
    await expect(read.matched).toHaveCount(0);
    await expect(read.missed).toHaveCount(0);
  });
});
