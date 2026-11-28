// Traces to: L2-010, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { LetterSoundsPage } from '../pages/letter-sounds.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/letter-sounds.wav'];
const TAP = '/recordings/read/tap-a-letter-then-its-sound.wav';
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const PRAISE = '/recordings/read/you-know-your-letter-sounds.wav';
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

test.describe('Letter sounds: matching', () => {
  test('Given m is held, when the child touches /m/, then /m/ is spoken and m and /m/ are joined in the same colour, marked matched and take no more touches', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();

    await read.match('m', '/m/');

    await expect(read.letter('m')).toHaveClass(/pair--found-1/);
    await expect(read.sound('/m/')).toHaveClass(/pair--found-1/);
    await expect(read.letter('m')).toHaveAttribute('aria-label', 'Letter m, matched');
    await expect(read.sound('/m/')).toHaveAttribute(
      'aria-label',
      'The sound /m/, as in map, matched',
    );
    await expect(read.letter('m')).toBeDisabled();
    await expect(read.sound('/m/')).toBeDisabled();
    await expect(read.letter('m')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, TAP, sound('m'), sound('m')]);
  });

  test('Given t is held, when the child touches /k/, then /k/ is spoken, the sound shakes, t stays held and nothing is taken away; then t and /t/ match', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();
    await read.match('m', '/m/');

    await read.match('t', '/k/');

    await expect(read.sound('/k/')).toHaveClass(/pair--miss/);
    await expect(read.letter('t')).toHaveAttribute('aria-pressed', 'true');
    await expect(read.matched).toHaveCount(2);
    await expect(read.message).toHaveCount(0);
    await page.clock.runFor(1000);
    await expect(read.missed).toHaveCount(0);
    await read.touch(read.sound('/t/'));
    await expect(read.letter('t')).toHaveClass(/pair--found-2/);
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, TAP, sound('m'), sound('m'), sound('t'), sound('c'), sound('t')]);
  });

  test('Given a round, when all four pairs are matched, then brief praise is spoken and shown and Next starts the next round with the sounds reordered @critical', async ({
    page,
    spoken,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();
    const first = await read.soundTexts();

    for (const [letter, shown] of Object.entries(PAIRS)) await read.match(letter, shown);

    await expect(read.matched).toHaveCount(8);
    await expect(read.message).toHaveText('You know your letter sounds!');
    await expect(read.pibbo).toHaveClass(/pibbo--cheer/);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(PRAISE);
    await page.clock.runFor(1600);
    await expect(read.pibbo).not.toHaveClass(/pibbo--cheer/);

    await read.touch(read.action);

    await expect(read.matched).toHaveCount(0);
    await expect(read.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(read.message).toHaveCount(0);
    expect(await read.soundTexts()).not.toEqual(first);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(TAP);
  });

  test('Given the fifth round is matched, when the child touches Next, then Home returns with Read chosen', async ({
    page,
  }) => {
    const read = new LetterSoundsPage(page);
    const home = new HomePage(page);
    await read.openFromHome();

    for (let round = 0; round < 5; round++) {
      for (const [letter, shown] of Object.entries(PAIRS)) await read.match(letter, shown);
      await read.touch(read.action);
    }

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Letter sounds: with the sound off', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child matches every pair, then every sound is shown and the round completes', async ({
    page,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();

    for (const [letter, shown] of Object.entries(PAIRS)) await read.match(letter, shown);

    await expect(read.message).toHaveText('You know your letter sounds!');
    await expect(read.action).toBeEnabled();
  });
});

test.describe('Letter sounds: reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Given reduced motion, when a sound is missed, then it does not move and t stays held', async ({
    page,
  }) => {
    const read = new LetterSoundsPage(page);
    await read.openFromHome();

    await read.match('t', '/k/');

    await expect(read.sound('/k/')).toHaveCSS('animation-name', 'none');
    await expect(read.letter('t')).toHaveAttribute('aria-pressed', 'true');
  });
});
