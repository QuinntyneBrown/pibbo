// Traces to: L2-013, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { SpellBySoundPage } from '../pages/spell-by-sound.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/spell-by-sound.wav'];
const LISTEN = '/recordings/read/listen.wav';
const PICK = '/recordings/read/pick-a-letter-for-each-sound.wav';
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const word = (w: string) => `/recordings/words/${w}.wav`;
/** The cast of the content: each word's letters. */
const WORDS: Record<string, string[]> = {
  map: ['m', 'a', 'p'],
  sun: ['s', 'u', 'n'],
  cat: ['c', 'a', 't'],
};

test.describe('Spell by sound: a round', () => {
  test('Given the child chooses Spell by sound, when the round is shown, then the word is spoken and shown with its picture, one empty box for each sound with the first marked, and up to 6 letters that include the word’s letters', async ({
    page,
    spoken,
  }) => {
    const spell = new SpellBySoundPage(page);
    await spell.openFromHome();

    const w = await spell.word();
    const letters = WORDS[w]!;
    expect(letters).toBeDefined();
    await expect(spell.instruction).toHaveText(`Listen: “${w}.” Pick a letter for each sound.`);
    await expect(spell.boxes).toHaveCount(letters.length);
    expect(await spell.boxTexts()).toEqual(letters.map(() => ''));
    await expect(spell.boxes.nth(0)).toHaveClass(/box--next/);
    await expect(spell.boxes.nth(0)).toHaveAttribute('aria-label', 'Empty box for sound 1');
    const bank = await spell.bankTexts();
    expect(bank.length).toBeLessThanOrEqual(6);
    expect(new Set(bank).size).toBe(bank.length);
    for (const l of letters) expect(bank).toContain(l);
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    for (const target of [...(await spell.bank.all()), ...(await spell.speakers.all())]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await spell.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, LISTEN, word(w), PICK]);
  });

  test('Given a round, when the child touches the speaker under box 2, then the sound that belongs in box 2 is spoken', async ({
    page,
    spoken,
  }) => {
    const spell = new SpellBySoundPage(page);
    await spell.openFromHome();
    const w = await spell.word();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, LISTEN, word(w), PICK]);

    await spell.touch(spell.speakers.nth(1));

    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, LISTEN, word(w), PICK, sound(WORDS[w]![1]!)]);
  });

  test('Given a round, when the child touches replay, then the word and the instruction are spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const spell = new SpellBySoundPage(page);
    const home = new HomePage(page);
    await spell.openFromHome();
    const w = await spell.word();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, LISTEN, word(w), PICK]);

    await spell.touch(spell.replay);
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, LISTEN, word(w), PICK, LISTEN, word(w), PICK]);
    await spell.touch(spell.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Spell by sound')).toBeVisible();
  });
});
