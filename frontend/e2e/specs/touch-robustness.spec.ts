// Traces to: L2-035
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { CountTheToysPage } from '../pages/count-the-toys.page';

test.describe('Touch robustness on Home', () => {
  test.skip(({ hasTouch }) => !hasTouch, 'touch is for the phone');

  test('Given a palm resting on the screen edge, when another finger taps the Count picture, then the tap is handled and the palm activates nothing', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await home.tapWithPalmResting(home.group('Count'));

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'false');
    expect(await spoken.recordings()).toEqual(['/recordings/home/count.wav']);
  });

  test('Given an activity picture is touched, when Read is touched while it opens, then the second touch is ignored and only the activity opens', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    const activity = new CountTheToysPage(page);
    await home.open();
    await home.touch(home.group('Count'));

    await home.touchActivityThenReadAtOnce('Count the toys');

    await expect(activity.root).toBeVisible();
    expect(await spoken.recordings()).toEqual([
      '/recordings/home/count.wav',
      '/recordings/home/count-the-toys.wav',
      '/recordings/count/tap-each-toy.wav',
    ]);
  });

  test('Given Home, when the child long-presses the Count picture, then nothing is chosen and nothing is spoken', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await home.longPress(home.group('Count'), 1200);

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'false');
    expect(await spoken.recordings()).toEqual([]);
  });
});
