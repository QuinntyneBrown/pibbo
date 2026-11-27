// Traces to: L2-012, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { SoundItOutPage } from '../pages/sound-it-out.page';

const HOME = ['/recordings/home/read.wav', '/recordings/home/sound-it-out.wav'];
const TAP_EACH = '/recordings/read/tap-each-letter.wav';

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
