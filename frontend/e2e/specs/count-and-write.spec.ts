// Traces to: L2-003, L2-004, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { CountAndWritePage } from '../pages/count-and-write.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/count-and-write.wav'];
const TAP_EACH = '/recordings/count/tap-each-toy.wav';
const WRITE = '/recordings/count/write-how-many.wav';
const number = (n: number) => `/recordings/numbers/${n}.wav`;
const oneTo = (n: number) => Array.from({ length: n }, (_, i) => number(i + 1));

/** Seeds whose first round asks for 14 and for 7 things (ADR 0009). */
const ROUND_OF_14 = 14;

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
