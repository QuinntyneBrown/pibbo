// Traces to: L2-001, L2-002, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { CountTheToysPage } from '../pages/count-the-toys.page';
import { HomePage } from '../pages/home.page';

const HOME = ['/recordings/home/count.wav', '/recordings/home/count-the-toys.wav'];
const TAP_EACH = '/recordings/count/tap-each-toy.wav';

test.describe('Count the toys: spoken and shown instructions', () => {
  test('Given a round starts, when it is shown, then its instruction is spoken and shown with a picture, and no timer or score is visible', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await expect(count.instruction).toHaveText('Tap each toy once to count it.');
    await expect(count.instructionPicture).toBeVisible();
    await expect(count.progress).toHaveAttribute('role', 'progressbar');
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    await expect(page.getByText(/score|lives|streak|seconds/i)).toHaveCount(0);
    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH]);
  });

  test('Given a round, when the child touches replay, then the instruction is spoken again', async ({
    page,
    spoken,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    await count.touch(count.replay);

    expect(await spoken.recordings()).toEqual([...HOME, TAP_EACH, TAP_EACH]);
  });

  test('Given a round, when the grown-up touches leave, then Home returns with Count chosen', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    const home = new HomePage(page);
    await count.openFromHome();

    await count.touch(count.leave);

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
  });
});

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function overlap(a: Box, b: Box): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
}

test.describe('Count the toys: a round of things', () => {
  test('Given a round is generated, when it is laid out, then no two toys overlap, each is at least 60 x 60 px and nothing scrolls', async ({
    page,
  }) => {
    const count = new CountTheToysPage(page);
    await count.openFromHome();

    const boxes = await count.toyBoxes();
    expect(boxes.length).toBeGreaterThanOrEqual(1);
    expect(boxes.length).toBeLessThanOrEqual(10);
    await expect(count.rug).toHaveAttribute('aria-label', `The rug, ${boxes.length} toys`);
    for (const b of boxes) {
      expect(b.width).toBeGreaterThanOrEqual(60);
      expect(b.height).toBeGreaterThanOrEqual(60);
    }
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) {
        expect(overlap(boxes[i]!, boxes[j]!)).toBe(false);
      }
    }
    await expect(count.counted).toHaveCount(0);
    await expect(count.tally).toHaveText('0');
    expect(await count.scrolls()).toBe(false);
  });
});
