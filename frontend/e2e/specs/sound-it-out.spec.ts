// Traces to: L2-012, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/sound-it-out.wav'];
const TAP_EACH = '/recordings/read/tap-each-letter.wav';
const SAY_FAST = '/recordings/read/say-them-fast.wav';
const YOU_READ = '/recordings/read/you-read.wav';
const READ_AGAIN = '/recordings/read/read-again.wav';
const THIS_IS = '/recordings/read/this-is.wav';
const WHICH = '/recordings/read/which-picture.wav';
const wordRecording = (w: string) => `/recordings/words/${w}.wav`;
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
/** How a letter's sound is shown: c makes /k/. */
const shown = (l: string) => (l === 'c' ? '/k/' : `/${l}/`);

test.describe('Sound it out: a round', () => {
  test('Given the child chooses Sound it out, when the round is shown, then a three-letter word appears with the first letter marked, blend not yet active, and the instruction spoken and shown with a picture', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();

    await expect(read.letters).toHaveCount(3);
    expect(await read.word()).toMatch(/^[a-z]{3}$/);
    await expect(read.next).toHaveCount(1);
    await expect(read.letter(0)).toHaveClass(/tile--next/);
    await expect(read.letter(1)).toBeDisabled();
    await expect(read.blend).toBeDisabled();
    await expect(read.instruction).toHaveText('Tap each letter to hear its sound.');
    await expect(read.instructionPicture).toBeVisible();
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    expect(await read.scrolls()).toBe(false);
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH]);
  });

  test('Given a round, when the grown-up touches leave, then Home returns with Read chosen', async ({
    page,
  }) => {
    const read = new SoundItOutPage(page);
    const home = new HomePage(page);
    await read.openFromHome();

    await read.touch(read.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Sound it out: each letter makes its sound', () => {
  test('Given a word is shown, when the child touches each letter in turn, then each sound is spoken and shown beneath its letter, and blend becomes active', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    const word = await read.word();

    await read.touch(read.letter(0));
    await expect(read.letter(0)).toHaveClass(/tile--heard/);
    await expect(read.shownSounds).toHaveText([shown(word[0]!)]);
    await expect(read.letter(1)).toHaveClass(/tile--next/);
    await read.touch(read.letter(1));
    await read.touch(read.letter(2));

    await expect(read.heard).toHaveCount(3);
    await expect(read.shownSounds).toHaveText([...word].map(shown));
    await expect(read.blend).toBeEnabled();
    await expect(read.instruction).toHaveText('Now say the sounds fast to read the word.');
    expect(await spoken.recordings()).toEqual([
      ...HOME,
      TAP_EACH,
      ...[...word].map(sound),
      SAY_FAST,
    ]);
  });

  test('Given a sound is playing, when the next letter is touched, then the playing recording stops and the new one starts', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    const word = await read.word();
    const before = await spoken.stops();

    await read.touch(read.letter(0));
    await read.touch(read.letter(1));

    expect(await spoken.stops()).toBeGreaterThan(before);
    expect((await spoken.recordings()).slice(-2)).toEqual([sound(word[0]!), sound(word[1]!)]);
  });

  test('Given the next letter is marked, when a later letter is touched, then nothing is spoken', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();

    await read.letter(2).dispatchEvent('click');

    await expect(read.heard).toHaveCount(0);
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH]);
  });
});

test.describe('Sound it out: blending', () => {
  test('Given all three sounds have been heard, when the child touches blend, then the sounds are spoken again back to back, then the word, and three pictures are offered', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    const word = await read.soundAll();
    const before = (await spoken.recordings()).length;

    await read.touch(read.blend);

    await expect(read.pictures).toHaveCount(3);
    expect(await read.pictureWords()).toContain(word);
    await expect(read.blend).toHaveCount(0);
    await expect(read.sounding).toHaveCount(0);
    await expect(read.instruction).toHaveText(`Which picture is “${word}”?`);
    expect((await spoken.recordings()).slice(before)).toEqual([
      ...[...word].map(sound),
      wordRecording(word),
      WHICH,
      wordRecording(word),
    ]);
  });
});

test.describe('Sound it out: choosing the picture', () => {
  test('Given three pictures, when the child chooses the right one and touches Check, then it is highlighted, brief praise plays, and Next starts the next round @critical', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    const word = await read.soundAndBlend();
    await expect(read.action).toBeDisabled();

    await read.answer(word);

    await expect(read.rightPicture).toHaveAttribute('aria-label', word);
    await expect(read.message).toHaveText(`You read “${word}”!`);
    expect((await spoken.recordings()).slice(-2)).toEqual([YOU_READ, wordRecording(word)]);
    await page.clock.runFor(1500);
    await read.touch(read.action);

    await expect(read.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(read.pictures).toHaveCount(0);
    await expect(read.heard).toHaveCount(0);
    expect(await read.word()).not.toBe(word);
    expect((await spoken.recordings()).at(-1)).toBe(TAP_EACH);
  });

  test('Given three pictures, when the child chooses a wrong one, then nothing heard is taken away, Pibbo says to read it again, and Try again blends the word again before the child picks again', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    const word = await read.soundAndBlend();
    const wrong = (await read.pictureWords()).find((w) => w !== word)!;

    await read.answer(wrong);

    await expect(read.message).toHaveText('Read it again, then look closely.');
    await expect(read.heard).toHaveCount(3);
    await expect(read.pictures.first()).toBeDisabled();
    expect((await spoken.recordings()).at(-1)).toBe(READ_AGAIN);
    const before = (await spoken.recordings()).length;

    await read.touch(read.action);

    await expect(read.pictures.first()).toBeEnabled();
    expect((await spoken.recordings()).slice(before)).toEqual([
      ...[...word].map(sound),
      wordRecording(word),
      WHICH,
      wordRecording(word),
    ]);
    await read.answer(word);
    await expect(read.message).toHaveText(`You read “${word}”!`);
  });

  test('Given two wrong pictures, when the third is wrong too, then Pibbo shows and says the right picture and the round completes', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    const word = await read.soundAndBlend();
    const wrong = (await read.pictureWords()).find((w) => w !== word)!;

    for (let i = 0; i < 2; i++) {
      await read.answer(wrong);
      await read.touch(read.action);
      await expect(read.pictures.first()).toBeEnabled();
    }
    await read.answer(wrong);

    await expect(read.message).toHaveText(`This is “${word}”.`);
    await expect(read.rightPicture).toHaveAttribute('aria-label', word);
    expect((await spoken.recordings()).slice(-2)).toEqual([THIS_IS, wordRecording(word)]);
    await expect(read.action).toBeEnabled();
  });

  test('Given the fifth round is read, when the child touches Next, then Home returns with Read chosen', async ({
    page,
  }) => {
    const read = new SoundItOutPage(page);
    const home = new HomePage(page);
    await read.openFromHome();

    for (let i = 0; i < 5; i++) {
      const word = await read.soundAndBlend();
      await read.answer(word);
      await read.touch(read.action);
      if (i < 4) await expect(read.progress).toHaveAttribute('aria-valuenow', String(i + 1));
    }

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
  });
});

test.describe('Sound it out: with the sound off', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child sounds out and blends a word, then every sound is shown and the round completes', async ({
    page,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();

    const word = await read.soundAndBlend();
    await expect(read.shownSounds).toHaveText([...word].map(shown));
    await read.answer(word);

    await expect(read.message).toHaveText(`You read “${word}”!`);
  });
});

test.describe('Sound it out: the next round is ready', () => {
  test('Given a round is being played, when the child touches Next, then the next word’s sounds, recording and picture were already fetched', async ({
    page,
  }) => {
    const read = new SoundItOutPage(page);
    const fetched: string[] = [];
    page.on('request', (r) => fetched.push(new URL(r.url()).pathname));
    await read.openFromHome();
    const first = await read.soundAndBlend();
    await read.answer(first);
    const before = [...fetched];

    await read.touch(read.action);
    await expect(read.progress).toHaveAttribute('aria-valuenow', '1');
    const next = await read.word();

    for (const asset of [
      ...[...next].map((l) => `/recordings/sounds/${l}.wav`),
      `/recordings/words/${next}.wav`,
      `/pictures/words/${next}.jpg`,
    ]) {
      expect(before, `${asset} fetched before Next`).toContain(asset);
    }
  });
});
