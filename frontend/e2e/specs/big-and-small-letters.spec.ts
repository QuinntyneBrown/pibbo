// Traces to: L2-011, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { BigAndSmallLettersPage } from '../pages/big-and-small-letters.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/big-and-small-letters.wav'];
const FIND = '/recordings/read/find-each-big-letters-small-letter.wav';
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const PRAISE = '/recordings/read/every-letter-found-its-partner.wav';
/** The cast of the mock: each big letter and its small letter. */
const PAIRS: Record<string, string> = { A: 'a', B: 'b', D: 'd', G: 'g' };

test.describe('Big and small letters: a round', () => {
  test('Given the child chooses Big and small letters, when the round is shown, then four big letters and their four small letters are shown in a different order under Big and Small, in the house letterforms, and the instruction is spoken and shown', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();

    expect(await letters.bigTexts()).toEqual(Object.keys(PAIRS));
    const small = await letters.smallTexts();
    expect([...small].sort()).toEqual(Object.values(PAIRS).sort());
    expect(small).not.toEqual(Object.values(PAIRS));
    await expect(letters.heads).toHaveText(['Big', 'Small']);
    await expect(letters.bigLetter('B')).toHaveAttribute('aria-label', 'Big B');
    await expect(letters.smallLetter('b')).toHaveAttribute('aria-label', 'Small b');
    await expect(letters.bigLetter('B')).toHaveAttribute('aria-pressed', 'false');
    expect(await letters.letterFont(letters.smallLetter('g'))).toMatch(/^['"]?Andika/);
    expect(await letters.letterFont(letters.bigLetter('D'))).toMatch(/^['"]?Andika/);
    await expect(letters.instruction).toHaveText('Find each big letter’s small letter.');
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    for (const target of [...(await letters.big.all()), ...(await letters.small.all())]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await letters.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, FIND]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    const home = new HomePage(page);
    await letters.openFromHome();

    await letters.touch(letters.replay);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, FIND, FIND]);
    await letters.touch(letters.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Big and small letters')).toBeVisible();
  });
});

test.describe('Big and small letters: each letter makes its sound', () => {
  test('Given a round, when the child touches B, then B is held and its sound is spoken, never its name; when the child touches D, then D is held instead', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();

    await letters.touch(letters.bigLetter('B'));
    await expect(letters.bigLetter('B')).toHaveAttribute('aria-pressed', 'true');
    await letters.touch(letters.bigLetter('D'));

    await expect(letters.bigLetter('D')).toHaveAttribute('aria-pressed', 'true');
    await expect(letters.bigLetter('B')).toHaveAttribute('aria-pressed', 'false');
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, FIND, sound('b'), sound('d')]);
  });

  test('Given no big letter is held, when the child touches g, then its sound is spoken and nothing is matched', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();

    await letters.touch(letters.smallLetter('g'));

    await expect.poll(() => spoken.recordings()).toEqual([...HOME, FIND, sound('g')]);
    await expect(letters.matched).toHaveCount(0);
    await expect(letters.missed).toHaveCount(0);
  });
});

test.describe('Big and small letters: matching', () => {
  test('Given B is held, when the child touches b, then b is spoken and B and b are joined in the same colour, marked matched and take no more touches', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();

    await letters.match('B', 'b');

    await expect(letters.bigLetter('B')).toHaveClass(/pair--found-1/);
    await expect(letters.smallLetter('b')).toHaveClass(/pair--found-1/);
    await expect(letters.bigLetter('B')).toHaveAttribute('aria-label', 'Big B, matched');
    await expect(letters.smallLetter('b')).toHaveAttribute('aria-label', 'Small b, matched');
    await expect(letters.bigLetter('B')).toBeDisabled();
    await expect(letters.smallLetter('b')).toBeDisabled();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, FIND, sound('b'), sound('b')]);
  });

  test('Given D is held, when the child touches b, then b is spoken, b shakes, D stays held and nothing is taken away; then D and d match', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();
    await letters.match('A', 'a');

    await letters.match('D', 'b');

    await expect(letters.smallLetter('b')).toHaveClass(/pair--miss/);
    await expect(letters.bigLetter('D')).toHaveAttribute('aria-pressed', 'true');
    await expect(letters.matched).toHaveCount(2);
    await expect(letters.message).toHaveCount(0);
    await page.clock.runFor(1000);
    await expect(letters.missed).toHaveCount(0);
    await letters.touch(letters.smallLetter('d'));
    await expect(letters.bigLetter('D')).toHaveClass(/pair--found-2/);
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, FIND, sound('a'), sound('a'), sound('d'), sound('b'), sound('d')]);
  });

  test('Given a round, when all four pairs are matched, then brief praise is spoken and shown and Next starts the next round with the small letters reordered @critical', async ({
    page,
    spoken,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();
    const first = await letters.smallTexts();

    for (const [big, small] of Object.entries(PAIRS)) await letters.match(big, small);

    await expect(letters.matched).toHaveCount(8);
    await expect(letters.message).toHaveText('Every letter found its partner!');
    await expect(letters.pibbo).toHaveClass(/pibbo--cheer/);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(PRAISE);
    await page.clock.runFor(1600);
    await expect(letters.pibbo).not.toHaveClass(/pibbo--cheer/);

    await letters.touch(letters.action);

    await expect(letters.matched).toHaveCount(0);
    await expect(letters.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(letters.message).toHaveCount(0);
    expect(await letters.smallTexts()).not.toEqual(first);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(FIND);
  });

  test('Given the fifth round is matched, when the child touches Next, then Home returns with Read chosen', async ({
    page,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    const home = new HomePage(page);
    await letters.openFromHome();

    for (let round = 0; round < 5; round++) {
      for (const [big, small] of Object.entries(PAIRS)) await letters.match(big, small);
      await letters.touch(letters.action);
    }

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Big and small letters: with the sound off', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child matches every pair, then the round completes and its praise is shown', async ({
    page,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();

    for (const [big, small] of Object.entries(PAIRS)) await letters.match(big, small);

    await expect(letters.message).toHaveText('Every letter found its partner!');
    await expect(letters.action).toBeEnabled();
  });
});

test.describe('Big and small letters: reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('Given reduced motion, when a small letter is missed, then it does not move and D stays held', async ({
    page,
  }) => {
    const letters = new BigAndSmallLettersPage(page);
    await letters.openFromHome();

    await letters.match('D', 'b');

    await expect(letters.smallLetter('b')).toHaveCSS('animation-name', 'none');
    await expect(letters.bigLetter('D')).toHaveAttribute('aria-pressed', 'true');
  });
});
