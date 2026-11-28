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

test.describe('Spot the word: finding the word', () => {
  test('Given a round, when the child touches the word, then it is spoken, stays highlighted, takes no further touch and fills one dot; a second touch never counts twice', async ({
    page,
    spoken,
  }) => {
    const spot = new SpotTheWordPage(page);
    await spot.openFromHome();
    const w = await spot.word();
    const [first] = await spot.indexesOf(w);
    const total = (await spot.indexesOf(w)).length;
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...ask(w)]);

    await spot.touch(spot.words.nth(first!));

    await expect(spot.words.nth(first!)).toHaveClass(/story__word--found/);
    await expect(spot.words.nth(first!)).toBeDisabled();
    await expect(spot.words.nth(first!)).toHaveAttribute('aria-label', `${STORY[first!]}, found`);
    await expect.poll(() => spot.filled()).toBe(1);
    await expect(spot.found).toHaveAttribute('aria-label', `1 of ${total} found`);
    await expect(spot.status).toHaveText(`Found “${w}”. 1 of ${total} found.`);
    await spot.words.nth(first!).dispatchEvent('click');
    await expect.poll(() => spot.filled()).toBe(1);
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...ask(w), word(w)]);
  });

  test('Given a round with one word found, when the child touches another word, then it greys with no sound, the grey fades after 0.4 s, and nothing found is lost', async ({
    page,
    spoken,
  }) => {
    const spot = new SpotTheWordPage(page);
    await spot.openFromHome();
    const w = await spot.word();
    const [first] = await spot.indexesOf(w);
    const other = await spot.otherThan(w);
    await spot.touch(spot.words.nth(first!));
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ...ask(w), word(w)]);

    await spot.touch(spot.words.nth(other));

    await expect(spot.words.nth(other)).toHaveClass(/story__word--miss/);
    await expect(spot.status).toHaveText(`Look for “${w}”. You chose “${STORY[other]}”.`);
    await expect.poll(() => spot.filled()).toBe(1);
    await expect(spot.words.nth(first!)).toHaveClass(/story__word--found/);
    await page.clock.runFor(400);
    await expect(spot.words.nth(other)).not.toHaveClass(/story__word--miss/);
    await expect(spot.words.nth(other)).toBeEnabled();
    expect(await spoken.recordings()).toEqual([...HOME, ...ask(w), word(w)]);
  });

  test('Given every one but the last is found, when the child touches the last, then "You found" with the word, how many and "times" is spoken and shown with Next, the story takes no touch, and Next starts a new round @critical', async ({
    page,
    spoken,
  }) => {
    const spot = new SpotTheWordPage(page);
    await spot.openFromHome();
    const w = await spot.word();
    const own = await spot.indexesOf(w);

    await spot.findAll();

    await expect(spot.message).toHaveText(`You found “${w}” ${own.length} times!`);
    await expect(spot.action).toContainText('Next');
    await expect.poll(() => spot.filled()).toBe(own.length);
    for (const target of await spot.words.all()) await expect(target).toBeDisabled();
    await expect
      .poll(async () => (await spoken.recordings()).slice(-4))
      .toEqual([
        '/recordings/read/you-found.wav',
        word(w),
        `/recordings/numbers/${own.length}.wav`,
        '/recordings/read/times.wav',
      ]);

    await spot.touch(spot.action);
    await expect.poll(() => spot.word()).not.toBe(w);
    await expect.poll(() => spot.filled()).toBe(0);
    await expect(spot.message).toHaveCount(0);
    const next = await spot.word();
    await expect.poll(async () => (await spoken.recordings()).slice(-3)).toEqual(ask(next));
  });
});

// Seed 7 asks "the" first, and without repetition the next four rounds would ask only "is"
// and "a" (found offline from the fixture's mulberry32): only the rule brings "the" back.
test.describe('Spot the word: a missed word comes back', () => {
  test.use({ seed: 7 });

  test('Given a word missed in a round, when the next rounds are played, then it is asked again in one of them; after five rounds Next returns to Home with Read chosen', async ({
    page,
  }) => {
    const spot = new SpotTheWordPage(page);
    const home = new HomePage(page);
    await spot.openFromHome();
    const missed = await spot.word();
    expect(missed).toBe('the');
    await spot.touch(spot.words.nth(await spot.otherThan(missed)));

    const asked: string[] = [];
    for (let i = 0; i < 5; i++) {
      if (i > 0) asked.push(await spot.word());
      await spot.findAll();
      await expect(spot.action).toContainText('Next');
      await spot.touch(spot.action);
      if (i < 4) await expect.poll(() => spot.filled()).toBe(0);
    }

    expect(asked).toContain(missed);
    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Spot the word: muted', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child plays a round, then it can be finished from what is shown alone', async ({
    page,
  }) => {
    const spot = new SpotTheWordPage(page);
    await spot.openFromHome();
    const w = await spot.word();
    await expect(spot.instruction).toHaveText(`Find every “${w}” in the story.`);

    await spot.findAll();

    await expect(spot.message).toContainText(`You found “${w}”`);
    await expect(spot.action).toContainText('Next');
  });
});
