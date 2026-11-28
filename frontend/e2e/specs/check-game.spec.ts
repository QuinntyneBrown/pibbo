// Traces to: L2-023, L2-024, L2-025, L2-026
import { test, expect } from '../fixtures/test';
import { CheckGamePage } from '../pages/check-game.page';
import { HomePage } from '../pages/home.page';

const CARD = '/recordings/home/check-game.wav';

/** The instructions of the first lesson's four activities (L2-023 #4). */
const FIRST_LESSON =
  /^(Which word goes with the picture\?|How many (teddies|ducks|balls)\?|Which one rhymes with “\w+”\?|Which number is bigger\?)$/;

test.describe('Check game: opening it', () => {
  test('Given Home, when nothing has been chosen, then the check game has its own picture, at least 60 x 60 px, and nothing scrolls', async ({
    page,
  }) => {
    const check = new CheckGamePage(page);
    const home = new HomePage(page);
    await home.open();

    await expect(check.card()).toHaveText(/What do I know\?/);
    const box = (await check.card().boundingBox())!;
    expect(box.width).toBeGreaterThanOrEqual(60);
    expect(box.height).toBeGreaterThanOrEqual(60);
    expect(await home.scrolls()).toBe(false);
  });

  test('Given nothing has been practised, when the child touches the picture, then its name is spoken and a question of the first lesson is spoken and shown with three choices, out of five, and Check takes no touch', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();

    await expect(check.instruction).toHaveText(FIRST_LESSON);
    await expect(check.choices).toHaveCount(3);
    for (const choice of await check.choices.all()) {
      await expect(choice).toHaveAttribute('aria-pressed', 'false');
      const box = (await choice.boundingBox())!;
      expect(box.width).toBeGreaterThanOrEqual(60);
      expect(box.height).toBeGreaterThanOrEqual(60);
    }
    await expect(check.progress).toHaveAttribute('aria-valuemax', '5');
    await expect(check.progress).toHaveAttribute('aria-valuenow', '0');
    await expect(check.action).toHaveText('Check');
    await expect(check.action).toBeDisabled();
    await expect(page.locator('[role="timer"]')).toHaveCount(0);
    expect(await check.scrolls()).toBe(false);
    expect(await check.hiddenUnderAnswerBar()).toBe(false);
    await expect.poll(async () => (await spoken.recordings())[0]).toBe(CARD);
    await expect.poll(async () => (await spoken.recordings()).length).toBeGreaterThan(1);
  });

  test('Given a question, when the child touches replay, then it is spoken again; when the grown-up touches leave, then Home returns', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    await expect.poll(async () => (await spoken.recordings()).length).toBeGreaterThan(1);
    const asked = (await spoken.recordings()).slice(1);

    await check.touch(check.replay);
    await expect
      .poll(async () => (await spoken.recordings()).slice(1))
      .toEqual([...asked, ...asked]);
    await check.touch(check.leave);

    await expect(check.card()).toBeVisible();
  });
});
