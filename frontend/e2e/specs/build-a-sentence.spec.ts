// Traces to: L2-020, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { BuildASentencePage } from '../pages/build-a-sentence.page';
import { HomePage } from '../pages/home.page';

const HOME = [
  '/recordings/home/read.wav',
  '/recordings/home/more.wav',
  '/recordings/home/build-a-sentence.wav',
];
const ASK = '/recordings/read/put-the-words-in-order.wav';
const ASK_TEXT = 'Look at the picture. Put the words in order to tell about it.';

/** The cast of the content, by its picture's text alternative. */
const CAST: Record<string, { words: string[]; extra: string; recording: string }> = {
  'A cat sitting': {
    words: ['The', 'cat', 'can', 'sit.'],
    extra: 'hat',
    recording: '/recordings/sentences/the-cat-can-sit.wav',
  },
  'The sun in the sky': {
    words: ['I', 'see', 'the', 'sun.'],
    extra: 'map',
    recording: '/recordings/sentences/i-see-the-sun.wav',
  },
  'A big boat': {
    words: ['The', 'boat', 'is', 'big.'],
    extra: 'sat',
    recording: '/recordings/sentences/the-boat-is-big.wav',
  },
};
const COMMON = ['the', 'is'];
/** The recording a tile says: "The" and "sit." say "the" and "sit". */
const said = (text: string) => {
  const w = text.toLowerCase().replace('.', '');
  return COMMON.includes(w) ? `/recordings/common-words/${w}.wav` : `/recordings/words/${w}.wav`;
};

test.describe('Build a sentence: a round', () => {
  test('Given the child chooses Build a sentence, when the round is shown, then a picture, an empty strip and the sentence’s words with one more are shown, the instruction is spoken and shown, and Check takes no touch', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();

    const cast = CAST[await sentence.pictureAlt()]!;
    expect(cast).toBeDefined();
    await expect(sentence.picture).toHaveJSProperty('complete', true);
    await expect(sentence.instruction).toHaveText(ASK_TEXT);
    await expect(sentence.hint).toHaveText('Tap words to build your sentence');
    await expect(sentence.placed).toHaveCount(0);
    await expect(sentence.tiles).toHaveCount(5);
    expect((await sentence.tileTexts()).sort()).toEqual([...cast.words, cast.extra].sort());
    for (const tile of await sentence.tiles.all()) {
      await expect(tile).toBeEnabled();
      const box = (await tile.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    await expect(sentence.action).toHaveText('Check');
    await expect(sentence.action).toBeDisabled();
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    expect(await sentence.scrolls()).toBe(false);
    expect(await sentence.hiddenUnderAnswerBar()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    const home = new HomePage(page);
    await sentence.openFromHome();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK]);

    await sentence.touch(sentence.replay);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK, ASK]);
    await sentence.touch(sentence.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.more).toBeVisible();
  });
});
