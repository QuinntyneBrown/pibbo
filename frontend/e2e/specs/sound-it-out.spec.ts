// Traces to: L2-012, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/sound-it-out.wav'];
const TAP_EACH = '/recordings/read/tap-each-letter.wav';
const SAY_FAST = '/recordings/read/say-them-fast.wav';
const WHICH = '/recordings/read/which-picture.wav';
const wordRecording = (w: string) => `/recordings/words/${w}.wav`;
const sound = (s: string) => `/recordings/sounds/${s}.wav`;

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
    await expect(read.shownSounds).toHaveText([`/${word[0]}/`]);
    await expect(read.letter(1)).toHaveClass(/tile--next/);
    await read.touch(read.letter(1));
    await read.touch(read.letter(2));

    await expect(read.heard).toHaveCount(3);
    await expect(read.shownSounds).toHaveText([...word].map((l) => `/${l}/`));
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
