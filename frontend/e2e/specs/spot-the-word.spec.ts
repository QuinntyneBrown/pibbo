// Traces to: L2-019, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { SpotTheWordPage } from '../pages/spot-the-word.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/spot-the-word.wav'];
const FIND = '/recordings/read/find-every.wav';
const IN_STORY = '/recordings/read/in-the-story.wav';
const word = (w: string) => `/recordings/common-words/${w}.wav`;
const ask = (w: string) => [FIND, word(w), IN_STORY];
/** The cast of the mock: the story and the common words it asks. */
const STORY =
  'The cat is on the mat. A ship is on the sea. The sun is up and the cat has a nap.'.split(' ');
const COMMON = ['the', 'is', 'a'];

test.describe('Spot the word: a round', () => {
  test('Given the child chooses Spot the word, when the round is shown, then "Find every “the” in the story." is spoken and shown, the word is shown large with one empty dot for each time it is in the story, and every word of the story is a 60 × 60 px target with nothing scrolling', async ({
    page,
    spoken,
  }) => {
    const spot = new SpotTheWordPage(page);
    await spot.openFromHome();

    const w = await spot.word();
    expect(COMMON).toContain(w);
    await expect(spot.instruction).toHaveText(`Find every “${w}” in the story.`);
    await expect.poll(() => spot.storyTexts()).toEqual(STORY);
    const own = await spot.indexesOf(w);
    await expect(spot.dots).toHaveCount(own.length);
    expect(await spot.filled()).toBe(0);
    await expect(spot.found).toHaveAttribute('aria-label', `0 of ${own.length} found`);
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    const bar = (await page.locator('.answer-bar').boundingBox())!;
    for (const target of await spot.words.all()) {
      await expect(target).toBeEnabled();
      const box = (await target.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
      expect(box.y + box.height).toBeLessThanOrEqual(bar.y);
    }
    expect(await spot.scrolls()).toBe(false);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...ask(w)]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again; when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
    spoken,
  }) => {
    const spot = new SpotTheWordPage(page);
    const home = new HomePage(page);
    await spot.openFromHome();
    const w = await spot.word();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...ask(w)]);

    await spot.touch(spot.replay);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...ask(w), ...ask(w)]);
    await spot.touch(spot.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Spot the word')).toBeVisible();
  });
});
