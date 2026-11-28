// Traces to: L2-018, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { WordsAndPicturesPage } from '../pages/words-and-pictures.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/words-and-pictures.wav'];
const ASK = '/recordings/read/by-the-sea-read-a-word.wav';
/** The cast: the mock's "by the sea" words that Sound it out already has. */
const WORDS = ['boat', 'ship', 'sun'];

test.describe('Words and pictures: a round', () => {
  test('Given the child chooses Words and pictures, when the round is shown, then the words of one theme and their pictures are shown in a different order, and the instruction naming the theme is spoken and shown', async ({
    page,
    spoken,
  }) => {
    const round = new WordsAndPicturesPage(page);
    await round.openFromHome();

    expect(await round.wordTexts()).toEqual(WORDS);
    const pictures = await round.pictureWords();
    expect([...pictures].sort()).toEqual([...WORDS].sort());
    expect(pictures).not.toEqual(WORDS);
    await expect(round.word('ship')).toHaveAttribute('aria-label', 'ship');
    await expect(round.word('ship')).toHaveAttribute('aria-pressed', 'false');
    await expect(round.picture('ship')).toHaveAttribute('aria-label', 'Picture of a ship');
    await expect(round.picture('ship').locator('img')).toHaveAttribute('alt', '');
    await expect(round.instruction).toHaveText('By the sea! Read a word, then tap its picture.');
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    for (const target of [...(await round.words.all()), ...(await round.pictures.all())]) {
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    expect(await round.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const round = new WordsAndPicturesPage(page);
    const home = new HomePage(page);
    await round.openFromHome();

    await round.touch(round.replay);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK, ASK]);
    await round.touch(round.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Words and pictures')).toBeVisible();
  });
});
