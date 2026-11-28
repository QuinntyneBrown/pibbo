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

test.describe('Build a sentence: building it', () => {
  test('Given a round, when the child touches a word tile, then its word is spoken, it goes to the end of the strip, and its tile stays in place, used and taking no touch', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const { words, extra } = CAST[await sentence.pictureAlt()]!;
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, ASK]);
    const before = (await spoken.recordings()).length;
    const since = async () => (await spoken.recordings()).slice(before);
    const tileBox = (await sentence.tile(words[1]!).boundingBox())!;

    await sentence.touch(sentence.tile(words[1]!));

    await expect(sentence.placed).toHaveText([words[1]!]);
    await expect(sentence.hint).toHaveCount(0);
    await expect.poll(since).toEqual([said(words[1]!)]);
    const used = sentence.tile(words[1]!);
    await expect(used).toBeDisabled();
    await expect(used).toHaveClass(/word-tile--used/);
    await expect(used).toHaveAttribute('aria-label', `${words[1]}, used`);
    expect(await used.boundingBox()).toEqual(tileBox);
    await expect(sentence.placed.first()).toHaveAttribute('aria-label', `Take back ${words[1]}`);

    await sentence.touch(sentence.tile(extra));
    await expect(sentence.placed).toHaveText([words[1]!, extra]);
    await expect.poll(since).toEqual([said(words[1]!), said(extra)]);
    await expect(sentence.action).toBeDisabled();
  });

  test('Given words on the strip, when the child touches one, then it goes back to its tile and the words after it close up', async ({
    page,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const { words, extra } = CAST[await sentence.pictureAlt()]!;
    await sentence.build([words[0]!, extra, words[1]!]);

    await sentence.touch(sentence.placed.nth(1));

    await expect(sentence.placed).toHaveText([words[0]!, words[1]!]);
    await expect(sentence.tile(extra)).toBeEnabled();
    await expect(sentence.tile(extra)).not.toHaveClass(/word-tile--used/);
    await sentence.build([words[2]!]);
    await expect(sentence.placed).toHaveText([words[0]!, words[1]!, words[2]!]);
  });

  test('Given the strip holds as many words as the sentence, then Check takes a touch, and a tile still says its word but adds nothing; with one taken back Check takes none', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const { words, extra } = CAST[await sentence.pictureAlt()]!;
    await sentence.build([...words].reverse());

    await expect(sentence.action).toBeEnabled();
    await sentence.touch(sentence.tile(extra));
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(said(extra));
    await expect(sentence.placed).toHaveCount(words.length);

    await sentence.touch(sentence.placed.first());
    await expect(sentence.placed).toHaveCount(words.length - 1);
    await expect(sentence.action).toBeDisabled();
  });
});

const PRAISE = '/recordings/read/what-a-great-sentence.wav';
const HINT = '/recordings/read/does-it-sound-right.wav';
const LISTEN = '/recordings/read/listen.wav';
const text = (words: readonly string[]) => words.join(' ');
/** The sentence's words in another order: the first two swapped. */
const muddled = (words: readonly string[]) => [words[1]!, words[0]!, ...words.slice(2)];

test.describe('Build a sentence: checking it', () => {
  test('Given the strip holds the sentence in order, when the child touches Check, then the strip shows as right, the sentence is spoken and shown as praise with its capital and full stop, and Next starts the next round with another sentence @critical', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const alt = await sentence.pictureAlt();
    const { words, recording } = CAST[alt]!;
    await sentence.build(words);
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(said(words.at(-1)!));
    const before = (await spoken.recordings()).length;

    await sentence.touch(sentence.action);

    await expect(sentence.message).toHaveText(`“${text(words)}” What a great sentence!`);
    await expect(sentence.message).toHaveText(/“[A-Z].*\.”/);
    await expect(sentence.strip).toHaveClass(/strip--right/);
    for (const w of await sentence.placed.all()) await expect(w).toBeDisabled();
    for (const t of await sentence.tiles.all()) await expect(t).toBeDisabled();
    await expect(sentence.action).toContainText('Next');
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([recording, PRAISE]);

    await sentence.touch(sentence.action);
    await expect.poll(() => sentence.pictureAlt()).not.toBe(alt);
    await expect(sentence.placed).toHaveCount(0);
    await expect(sentence.action).toHaveText('Check');
    await expect(sentence.action).toBeDisabled();
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(ASK);
  });

  test('Given the words in another order, when the child touches Check, then the hint is spoken and shown with Try again and the words take no touch; Try again empties the strip', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const { words } = CAST[await sentence.pictureAlt()]!;
    await sentence.build(muddled(words));

    await sentence.touch(sentence.action);

    await expect(sentence.message).toHaveText('Read it out loud. Does it sound right?');
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(HINT);
    await expect(sentence.action).toContainText('Try again');
    await expect(sentence.strip).not.toHaveClass(/strip--right/);
    for (const w of await sentence.placed.all()) await expect(w).toBeDisabled();
    for (const t of await sentence.tiles.all()) await expect(t).toBeDisabled();

    await sentence.touch(sentence.action);

    await expect(sentence.message).toHaveCount(0);
    await expect(sentence.placed).toHaveCount(0);
    await expect(sentence.hint).toBeVisible();
    for (const t of await sentence.tiles.all()) await expect(t).toBeEnabled();
    await expect(sentence.action).toHaveText('Check');
    await expect(sentence.action).toBeDisabled();
  });

  test('Given the extra word in the sentence, when the child touches Check, then the hint is given', async ({
    page,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const { words, extra } = CAST[await sentence.pictureAlt()]!;
    await sentence.build([...words.slice(0, -1), extra]);

    await sentence.touch(sentence.action);

    await expect(sentence.message).toHaveText('Read it out loud. Does it sound right?');
  });

  test('Given two wrong checks, when the third is wrong, then Pibbo shows the sentence in order as right, "Listen:" and the sentence are spoken and shown, and Next completes the round', async ({
    page,
    spoken,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const alt = await sentence.pictureAlt();
    const { words, recording } = CAST[alt]!;
    for (let miss = 1; miss <= 3; miss++) {
      await sentence.build(muddled(words));
      await sentence.touch(sentence.action);
      await expect(sentence.message).toBeVisible();
      if (miss < 3) await sentence.touch(sentence.action);
    }

    await expect(sentence.message).toHaveText(`Listen: “${text(words)}”`);
    await expect(sentence.placed).toHaveText(words);
    await expect(sentence.strip).toHaveClass(/strip--right/);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-2))
      .toEqual([LISTEN, recording]);
    await expect(sentence.action).toContainText('Next');
    await sentence.touch(sentence.action);
    await expect.poll(() => sentence.pictureAlt()).not.toBe(alt);
  });

  test('Given five rounds are finished, when the child touches Next, then Home returns with Read chosen', async ({
    page,
  }) => {
    const sentence = new BuildASentencePage(page);
    const home = new HomePage(page);
    await sentence.openFromHome();

    for (let i = 0; i < 5; i++) {
      await expect(sentence.action).toHaveText('Check');
      await sentence.build(CAST[await sentence.pictureAlt()]!.words);
      await sentence.touch(sentence.action);
      await expect(sentence.action).toContainText('Next');
      await sentence.touch(sentence.action);
    }

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Build a sentence: muted', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child plays a round, then it can be finished from what is shown alone', async ({
    page,
  }) => {
    const sentence = new BuildASentencePage(page);
    await sentence.openFromHome();
    const { words } = CAST[await sentence.pictureAlt()]!;
    await expect(sentence.instruction).toHaveText(ASK_TEXT);

    await sentence.build(words);
    await sentence.touch(sentence.action);

    await expect(sentence.message).toHaveText(`“${text(words)}” What a great sentence!`);
    await expect(sentence.action).toContainText('Next');
  });
});
