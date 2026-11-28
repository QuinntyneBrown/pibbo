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

const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const said = (w: string) => `/recordings/words/${w}.wav`;

test.describe('Words and pictures: a word sounds out', () => {
  test('Given a round, when the child touches boat, then boat is held and its sounds are spoken in turn, never the letter names; when the child touches ship, then ship is held instead', async ({
    page,
    spoken,
  }) => {
    const round = new WordsAndPicturesPage(page);
    await round.openFromHome();

    await round.touch(round.word('boat'));
    await expect(round.word('boat')).toHaveAttribute('aria-pressed', 'true');
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, ASK, sound('b'), sound('oa'), sound('t')]);
    await round.touch(round.word('ship'));

    await expect(round.word('ship')).toHaveAttribute('aria-pressed', 'true');
    await expect(round.word('boat')).toHaveAttribute('aria-pressed', 'false');
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, ASK, ...['b', 'oa', 't', 'sh', 'i', 'p'].map(sound)]);
  });

  test('Given no word is held, when the child touches the picture of a sun, then "sun" is spoken and nothing is joined: a pair needs two touches', async ({
    page,
    spoken,
  }) => {
    const round = new WordsAndPicturesPage(page);
    await round.openFromHome();

    await round.touch(round.picture('sun'));

    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK, said('sun')]);
    await expect(round.matched).toHaveCount(0);
    await expect(round.missed).toHaveCount(0);
  });
});

test.describe('Words and pictures: connecting', () => {
  test('Given boat is held, when the child touches the picture of a boat, then "boat" is spoken and the two are joined in the same colour, marked matched and take no more touches', async ({
    page,
    spoken,
  }) => {
    const round = new WordsAndPicturesPage(page);
    await round.openFromHome();

    await round.connect('boat', 'boat');

    await expect(round.word('boat')).toHaveClass(/pair--found-1/);
    await expect(round.picture('boat')).toHaveClass(/pair--found-1/);
    await expect(round.word('boat')).toHaveAttribute('aria-label', 'boat, matched');
    await expect(round.picture('boat')).toHaveAttribute('aria-label', 'Picture of a boat, matched');
    await expect(round.word('boat')).toBeDisabled();
    await expect(round.picture('boat')).toBeDisabled();
    await expect(round.status).toHaveText('boat and Picture of a boat matched. 1 of 3 pairs.');
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, ASK, sound('b'), sound('oa'), sound('t'), said('boat')]);
  });

  test('Given ship is held, when the child touches the picture of a sun, then "ship" and "sun" are spoken, the picture shakes, ship is let go and nothing is taken away; then ship and its picture join', async ({
    page,
    spoken,
  }) => {
    const round = new WordsAndPicturesPage(page);
    await round.openFromHome();
    await round.connect('boat', 'boat');

    await round.connect('ship', 'sun');

    await expect(round.picture('sun')).toHaveClass(/pair--miss/);
    await expect(round.word('ship')).toHaveAttribute('aria-pressed', 'false');
    await expect(round.matched).toHaveCount(2);
    await expect(round.status).toHaveText('ship and Picture of a sun. Try again.');
    await expect(round.message).toHaveCount(0);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-2))
      .toEqual([said('ship'), said('sun')]);
    await page.clock.runFor(1000);
    await expect(round.missed).toHaveCount(0);

    await round.connect('ship', 'ship');

    await expect(round.word('ship')).toHaveClass(/pair--found-2/);
    await expect(round.picture('ship')).toHaveClass(/pair--found-2/);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(said('ship'));
  });
});
