// Traces to: L2-023, L2-024, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { CheckGamePage } from '../pages/check-game.page';
import { HomePage } from '../pages/home.page';

const WHAT_DO_I_KNOW = '/recordings/home/what-do-i-know.wav';
const WHICH_WORD = '/recordings/check/which-word.wav';

test.describe('What do I know?: opening it from Home', () => {
  test('Given Home, when shown, then the check game has its own picture, with no group chosen', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(home.checkCard).toHaveText(/What do I know\?/);
    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'false');
    const box = await home.checkCard.boundingBox();
    expect(box!.height).toBeGreaterThanOrEqual(60);
    expect(await spoken.recordings()).toEqual([]);
  });

  test('@critical Given Home and no practice history, when the check picture is touched, then "What do I know?" is spoken and the first question asks about a first-lesson activity', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();

    // The first lesson is Letter sounds and Sound it out: reading, so a word question.
    await expect(check.instruction).toHaveText('Which word goes with the picture?');
    await expect(check.shown).toHaveAttribute('role', 'img');
    await expect(check.choices).toHaveCount(3);
    expect(await check.choiceTexts()).toContain(await check.answer());
    expect(await check.rounds()).toBe(5);
    expect(await spoken.recordings()).toEqual([WHAT_DO_I_KNOW, WHICH_WORD]);
    await expect(page.getByText(/score|lives|streak|seconds|%/i)).toHaveCount(0);
  });

  test('Given a question, when the child touches replay, then the question is spoken again', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();

    await check.touch(check.replay);

    expect(await spoken.recordings()).toEqual([WHAT_DO_I_KNOW, WHICH_WORD, WHICH_WORD]);
  });

  test('Given a question, when leave is touched, then Home returns', async ({ page }) => {
    const check = new CheckGamePage(page);
    const home = new HomePage(page);
    await check.openFromHome();

    await check.touch(check.leave);

    await expect(home.checkCard).toBeVisible();
  });

  test('Given Home on a phone, when shown with a group chosen, then nothing scrolls', async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.open('/?group=read');

    await expect(home.checkCard).toBeVisible();
    expect(await home.scrolls()).toBe(false);
  });
});
