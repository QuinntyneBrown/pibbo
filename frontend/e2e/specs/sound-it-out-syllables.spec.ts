// Traces to: L2-017
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const word = (w: string) => `/recordings/words/${w}.wav`;
const sound = (s: string) => `/recordings/sounds/${s}.wav`;
const read_ = (line: string) => `/recordings/read/${line}.wav`;
const SET = '/recordings/syllables/set.wav';

/** "Tap", the syllable, "and clap it". */
const ask = (syllable: string) => [read_('tap'), syllable, read_('and-clap-it')];

/** A seed whose first round is "sunset" (the cast of the mock, not a rule). */
const SUNSET = 4;

test.describe('Sound it out: a longer word read by syllable', () => {
  test.use({ seed: SUNSET });

  test('Given a longer-word round, when it is shown, then "sunset" appears as [sun][set] under its rule, and "Tap “sun” and clap it." is spoken and shown', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();

    await expect.poll(() => read.tileLetters()).toEqual(['sun', 'set']);
    await expect(read.rule).toHaveText('sun · set Read one beat at a time');
    await expect(read.instruction).toHaveText('Tap “sun” and clap it.');
    await expect(read.instructionPicture).toBeVisible();
    await expect(read.letter(0)).toHaveClass(/tile--next/);
    await expect(read.letter(1)).toBeDisabled();
    await expect(read.shownSounds).toHaveCount(0);
    await expect(read.blend).toBeDisabled();
    await expect.poll(async () => (await spoken.recordings()).slice(-3)).toEqual(ask(word('sun')));
    expect(await read.scrolls()).toBe(false);
    const asked = (await spoken.recordings()).length;

    await read.touch(read.replay);

    await expect
      .poll(async () => (await spoken.recordings()).slice(asked))
      .toEqual(ask(word('sun')));
  });

  test('Given "sunset" shown as [sun][set], when the child touches [sun], then "sun" is sounded out and blended; then [set] likewise @critical', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await expect.poll(async () => (await spoken.recordings()).slice(-3)).toEqual(ask(word('sun')));
    let before = (await spoken.recordings()).length;

    await read.touch(read.letter(0));

    await expect(read.letter(0)).toHaveClass(/tile--heard/);
    await expect(read.letter(0)).toHaveAttribute('aria-label', 'sun, says clap 1');
    await expect(read.shownSounds).toHaveText(['clap 1']);
    await expect(read.letter(1)).toHaveClass(/tile--next/);
    await expect(read.instruction).toHaveText('Tap “set” and clap it.');
    await expect(read.blendFill).toHaveClass(/blend__fill--50/);
    await expect(read.blend).toBeDisabled();
    // Its sounds, then the syllable; only then is the next one asked for.
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([sound('s'), sound('u'), sound('n'), word('sun'), ...ask(SET)]);
    before = (await spoken.recordings()).length;

    await read.touch(read.letter(1));

    await expect(read.letter(1)).toHaveAttribute('aria-label', 'set, says clap 2');
    await expect(read.shownSounds).toHaveText(['clap 1', 'clap 2']);
    await expect(read.blendFill).toHaveClass(/blend__fill--100/);
    await expect(read.blend).toBeEnabled();
    await expect(read.instruction).toHaveText('Now say the sounds fast to read the word.');
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([sound('s'), sound('e'), sound('t'), SET, read_('say-them-fast')]);
  });
});
