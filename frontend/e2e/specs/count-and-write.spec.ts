// Traces to: L2-003, L2-004, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { CountAndWritePage } from '../pages/count-and-write.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/count-and-write.wav'];
const TAP_EACH = '/recordings/count/tap-each-toy.wav';
const WRITE = '/recordings/count/write-how-many.wav';
const YES = '/recordings/count/yes.wav';
const WATCH = '/recordings/count/watch-me.wav';
const THERE_ARE = '/recordings/count/there-are.wav';
const number = (n: number) => `/recordings/numbers/${n}.wav`;
const oneTo = (n: number) => Array.from({ length: n }, (_, i) => number(i + 1));

/** Seeds whose first round asks for 14 and for 7 things (ADR 0009). */
const ROUND_OF_14 = 14;
const ROUND_OF_7 = 1;

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe('Count and write: count to twenty in ten-frames', () => {
  test.use({ seed: ROUND_OF_14, viewport: { width: 360, height: 640 } });

  test('Given a round of 14 things on a 360 x 640 px viewport, when it is shown, then all 14 are visible without scrolling, each at least 60 x 60 px, as one full ten-frame and one partial ten-frame', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();

    await expect(count.things).toHaveCount(14);
    await expect(count.frames).toHaveCount(2);
    await expect(count.thingsIn(0)).toHaveCount(10);
    await expect(count.thingsIn(1)).toHaveCount(4);
    await expect(count.cellsIn(1)).toHaveCount(6);
    await expect(count.frameGroup).toHaveAttribute('aria-label', 'The ten-frames, 14 toys');
    const boxes = await count.boxes(count.things);
    for (const b of boxes) {
      expect(b.width).toBeGreaterThanOrEqual(60);
      expect(b.height).toBeGreaterThanOrEqual(60);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
    for (let i = 0; i < 14; i++) expect(await count.inView(count.thing(i))).toBe(true);
    expect(await count.scrolls()).toBe(false);
    await expect(count.instruction).toHaveText('Tap each toy once to count it.');
    await expect(count.instructionPicture).toBeVisible();
    await expect(count.pad).toHaveCount(0);
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH]);
  });

  test('Given some things counted, when the child touches a counted thing again, then it is not counted twice and nothing is spoken', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    for (const i of [0, 1, 2]) await count.touch(count.thing(i));
    await expect(count.badge(2)).toHaveText('3');

    await count.thing(1).click({ force: true });
    await count.touch(count.thing(12));

    await expect(count.counted).toHaveCount(4);
    await expect(count.badge(12)).toHaveText('4');
    await expect(count.thing(12)).toHaveAttribute('aria-label', 'Toy counted as 4');
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH, ...oneTo(4)]);
  });

  test('Given 14 things counted, when the count reaches 14, then "fourteen" is spoken and the child is asked to write the numeral', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();

    await count.countAll();

    await expect(count.instruction).toHaveText('Write how many.');
    await expect(count.frameGroup).toHaveClass(/tenframes--small/);
    await expect(count.keys).toHaveCount(10);
    for (const b of await count.boxes(count.keys)) {
      expect(b.width).toBeGreaterThanOrEqual(60);
      expect(b.height).toBeGreaterThanOrEqual(60);
    }
    for (let d = 0; d <= 9; d++) expect(await count.inView(count.key(d))).toBe(true);
    expect(await count.inView(count.action)).toBe(true);
    expect(await count.scrolls()).toBe(false);
    await expect(count.action).toBeDisabled();
    await expect.poll(() => spoken.recordings()).toEqual([...HOME, TAP_EACH, ...oneTo(14), WRITE]);
  });
});

test.describe('Count and write: write the numeral with digit tiles', () => {
  test.use({ seed: ROUND_OF_14 });

  test('Given the count is done, when the child touches a digit tile, then the digit is spoken and shown in the next box, and Clear empties the boxes', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await count.countAll();

    await count.write('1');

    await expect(count.filledSlots).toHaveText(['1']);
    await expect(count.written).toHaveAttribute('aria-label', 'You wrote 1');
    await expect(count.action).toBeEnabled();
    await count.touch(count.clear);
    await expect(count.filledSlots).toHaveCount(0);
    await expect(count.action).toBeDisabled();
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, TAP_EACH, ...oneTo(14), WRITE, number(1)]);
  });

  test('Given two digits entered, when a third digit is touched, then it is ignored', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await count.countAll();
    await count.write('14');
    await expect(count.filledSlots).toHaveText(['1', '4']);

    await count.write('7');

    await expect(count.filledSlots).toHaveText(['1', '4']);
    await expect(count.written).toHaveAttribute('aria-label', 'You wrote 14');
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, TAP_EACH, ...oneTo(14), WRITE, number(1), number(4)]);
  });

  test('Given the count is 14, when the child touches 1 then 4 and then Check, then "fourteen" is spoken and the answer is accepted @critical', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await count.countAll();

    await count.answer('14');

    await expect(count.answerBar).toHaveClass(/answer-bar--right/);
    await expect(count.message).toHaveText('Yes! 14.');
    await expect(count.keys.first()).toBeDisabled();
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, TAP_EACH, ...oneTo(14), WRITE, number(1), number(4), number(14), YES]);
  });
});

test.describe('Count and write: a one-digit count', () => {
  test.use({ seed: ROUND_OF_7 });

  test('Given the count is 7, when the child touches 7 and then Check, then the answer is accepted without a second digit', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await expect(count.things).toHaveCount(7);
    await expect(count.frames).toHaveCount(1);
    await count.countAll();

    await count.answer('7');

    await expect(count.answerBar).toHaveClass(/answer-bar--right/);
    await expect(count.message).toHaveText('Yes! 7.');
    await expect
      .poll(() => spoken.recordings())
      .toEqual([...HOME, TAP_EACH, ...oneTo(7), WRITE, number(7), number(7), YES]);
  });
});

test.describe('Count and write: a wrong numeral is a chance to try again', () => {
  test.use({ seed: ROUND_OF_14 });

  test('Given the count is 14, when the child touches 4 then 1 and then Check, then the answer is not accepted, the tiles clear, and Pibbo shows 1 then 4 being touched as a hint before the child writes again', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await count.countAll();
    await count.watchLitKeys();

    await count.answer('41');

    await expect(count.answerBar).toHaveClass(/answer-bar--hint/);
    await expect(count.message).toHaveText('Watch me write it.');
    await expect(count.filledSlots).toHaveCount(0);
    await expect(count.counted).toHaveCount(14);
    await expect.poll(() => count.litKeys()).toEqual(['1', '4']);
    await expect(count.litKey).toHaveCount(0);
    await expect(count.key(1)).toBeEnabled();
    await expect
      .poll(() => spoken.recordings())
      .toEqual([
        ...HOME,
        TAP_EACH,
        ...oneTo(14),
        WRITE,
        number(4),
        number(1),
        WATCH,
        number(1),
        number(4),
        WRITE,
      ]);

    await count.answer('14');
    await expect(count.answerBar).toHaveClass(/answer-bar--right/);
    await expect.poll(async () => (await spoken.recordings()).slice(-2)).toEqual([number(14), YES]);
  });

  test('Given two wrong numerals, when the third is wrong, then Pibbo writes 14 and says it, and Next starts the next round', async ({
    page,
    spoken,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await count.countAll();
    for (let i = 0; i < 2; i++) {
      await count.answer('41');
      await expect(count.key(4)).toBeEnabled();
    }

    await count.answer('41');

    await expect(count.answerBar).toHaveClass(/answer-bar--model/);
    await expect(count.message).toHaveText('There are 14 toys.');
    await expect(count.answerSlots).toHaveText(['1', '4']);
    await expect(count.keys.first()).toBeDisabled();
    await expect
      .poll(async () => (await spoken.recordings()).slice(-2))
      .toEqual([THERE_ARE, number(14)]);

    await count.touch(count.action);

    await expect(count.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(count.instruction).toHaveText('Tap each toy once to count it.');
    await expect(count.counted).toHaveCount(0);
    await expect(count.pad).toHaveCount(0);
  });
});

test.describe('Count and write: with the sound off', () => {
  test.use({ seed: ROUND_OF_7, sound: 'off' });

  test('Given the sound is off, when the child counts and writes, then the round still goes on and what Pibbo says is shown', async ({
    page,
  }) => {
    const count = new CountAndWritePage(page);
    await count.openFromHome();
    await count.countAll();
    await expect(count.instruction).toHaveText('Write how many.');

    await count.answer('7');

    await expect(count.message).toHaveText('Yes! 7.');
  });
});
