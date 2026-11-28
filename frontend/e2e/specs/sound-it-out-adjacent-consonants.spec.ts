// Traces to: L2-015
import { test, expect } from '../fixtures/test';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const sound = (s: string) => `/recordings/sounds/${s}.wav`;

/** A seed whose first round is "stop" (the cast of the mock, not a rule). */
const STOP = 4;

test.describe('Sound it out: adjacent consonants are each their own sound', () => {
  test.use({ seed: STOP });

  test('Given "stop" shown as [s][t][o][p], when the child touches s then t, then "sss" and "t" are each spoken separately', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await expect.poll(() => read.tileLetters()).toEqual(['s', 't', 'o', 'p']);
    const before = (await spoken.recordings()).length;

    await read.touch(read.letter(0));
    await expect(read.letter(0)).toHaveClass(/tile--heard/);
    await expect(read.letter(1)).toHaveClass(/tile--next/);
    await read.touch(read.letter(1));

    await expect(read.letter(1)).toHaveClass(/tile--heard/);
    await expect(read.letter(1)).toHaveAttribute('aria-label', 't, says /t/');
    await expect(read.shownSounds).toHaveText(['/s/', '/t/']);
    await expect(read.letter(2)).toHaveClass(/tile--next/);
    await expect
      .poll(async () => (await spoken.recordings()).slice(before))
      .toEqual([sound('s'), sound('t')]);
  });
});

for (const viewport of [
  { width: 320, height: 640 },
  { width: 360, height: 640 },
  { width: 640, height: 360 },
]) {
  test.describe(`Sound it out: four tiles fit at ${viewport.width} x ${viewport.height}`, () => {
    test.use({ seed: STOP, viewport });

    test('Given "stop", when shown, then its four tiles sit in one row, each at least 60 x 60 px, with nothing to scroll', async ({
      page,
    }) => {
      const read = new SoundItOutPage(page);
      await read.openFromHome();
      await expect.poll(() => read.tileLetters()).toEqual(['s', 't', 'o', 'p']);

      const boxes = await read.tileBoxes();
      expect(new Set(boxes.map((b) => Math.round(b.y))).size).toBe(1);
      for (const b of boxes) {
        expect(b.width).toBeGreaterThanOrEqual(60);
        expect(b.height).toBeGreaterThanOrEqual(60);
      }
      expect(await read.scrolls()).toBe(false);
    });
  });
}

const FIRST_TWO = '/recordings/read/first-two-sounds.wav';
const HEARD_BOTH = '/recordings/read/you-heard-both.wav';
const LISTEN = '/recordings/read/listen.wav';
const CHOOSE_AGAIN = '/recordings/read/choose-again.wav';
const WHICH = '/recordings/read/which-picture.wav';
const STOP_WORD = '/recordings/words/stop.wav';

test.describe('Sound it out: the first two sounds', () => {
  test.use({ seed: STOP });

  test('Given "stop" blended and the question "what are the first two sounds?" with s, st and t, when st is chosen, then both sounds are spoken, praise plays and the pictures follow @critical', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await read.soundAll();
    const blended = (await spoken.recordings()).length;

    await read.touch(read.blend);

    await expect(read.instruction).toHaveText('What are the first two sounds?');
    await expect(read.choices).toHaveText(['s', 'st', 't']);
    await expect
      .poll(async () => (await spoken.recordings()).slice(blended))
      .toEqual([...['s', 't', 'o', 'p'].map(sound), STOP_WORD, FIRST_TWO]);
    const asked = (await spoken.recordings()).length;

    await read.touch(read.choice('st'));

    await expect(read.message).toHaveText('You heard both sounds!');
    await expect(read.pictures).toHaveCount(3);
    await expect(read.instruction).toHaveText('Which picture is “stop”?');
    await expect
      .poll(async () => (await spoken.recordings()).slice(asked))
      .toEqual([sound('s'), sound('t'), HEARD_BOTH, WHICH, STOP_WORD]);
    await read.answer('stop');
    await expect(read.message).toHaveText('You read “stop”!');
  });

  test('Given the question, when t is chosen, then both sounds are modelled and the child chooses again', async ({
    page,
    spoken,
  }) => {
    const read = new SoundItOutPage(page);
    await read.openFromHome();
    await read.soundAll();
    await read.touch(read.blend);
    await expect(read.choices).toHaveCount(3);
    const asked = (await spoken.recordings()).length;

    await read.touch(read.choice('t'));

    await expect(read.message).toHaveText('Listen: /s/ /t/. Choose again.');
    await expect
      .poll(async () => (await spoken.recordings()).slice(asked))
      .toEqual([LISTEN, sound('s'), sound('t'), CHOOSE_AGAIN]);
    await expect(read.pictures).toHaveCount(0);
    await expect(read.heard).toHaveCount(4);
    for (const c of await read.choices.all()) await expect(c).toBeEnabled();

    await read.touch(read.choice('st'));
    await expect(read.message).toHaveText('You heard both sounds!');
    await expect(read.pictures).toHaveCount(3);
  });
});
