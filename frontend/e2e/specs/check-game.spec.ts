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

const YES = '/recordings/check/yes.wav';
const LISTEN = '/recordings/check/listen-to-the-sounds.wav';
const THIS_IS = '/recordings/read/this-is.wav';
const word = (w: string) => `/recordings/words/${w}.wav`;
const after = async (spoken: { recordings(): Promise<string[]> }, from: number) =>
  (await spoken.recordings()).slice(from);

test.describe('What do I know?: answering, with the normal retry', () => {
  test('Given a question, when a choice is touched, then it is chosen and spoken, and Check is ready', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    await expect(check.action).toBeDisabled();
    const wrong = await check.wrongChoice();
    const heard = (await spoken.recordings()).length;

    await check.touch(check.choice(wrong));

    await expect(check.choice(wrong)).toHaveAttribute('aria-pressed', 'true');
    await expect(check.action).toBeEnabled();
    expect(await after(spoken, heard)).toEqual([word(wrong)]);
  });

  test('@critical Given a question, when the right answer is checked, then "Yes!" is spoken and shown, and Next asks question 2', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    const answer = await check.answer();

    await check.answerWith(answer);

    await expect(check.message).toHaveText('Yes!');
    await expect(check.action).toHaveText(/Next/);
    expect((await spoken.recordings()).at(-1)).toBe(YES);

    await check.touch(check.action);

    await expect(check.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(check.choices.first()).toHaveAttribute('aria-pressed', 'false');
    expect((await spoken.recordings()).at(-1)).toBe(WHICH_WORD);
  });

  test('Given a question, when a wrong answer is checked, then a hint is shown and spoken with the sounds of the pictured word, the choice stays and the child checks again', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    const wrong = await check.wrongChoice();
    await check.touch(check.choice(wrong));
    const heard = (await spoken.recordings()).length;

    await check.touch(check.action);

    await expect(check.message).toHaveText('Listen to the sounds and look again.');
    await expect(check.choice(wrong)).toHaveAttribute('aria-pressed', 'true');
    await expect(check.action).toHaveText('Check');
    await expect(check.action).toBeEnabled();
    await expect(check.choices).toHaveCount(3);
    await expect.poll(async () => (await after(spoken, heard)).length).toBeGreaterThanOrEqual(3);
    const hint = await after(spoken, heard);
    expect(hint[0]).toBe(LISTEN);
    for (const r of hint.slice(1)) expect(r).toMatch(/^\/recordings\/sounds\/.+\.wav$/);
    await expect(page.getByText(/wrong|score|lives/i)).toHaveCount(0);
  });

  test('Given two wrong answers, when the third is checked, then Pibbo shows the right word with a tick and says it, and Next goes on', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    const answer = await check.answer();
    const wrong = await check.wrongChoice();

    for (let i = 0; i < 2; i++) await check.answerWith(wrong);
    await expect(check.message).toHaveText('Listen to the sounds and look again.');
    await expect(check.modelled).toHaveCount(0);

    await check.touch(check.action);

    await expect(check.modelled).toHaveText(answer);
    await expect(check.message).toHaveText(`This is “${answer}”.`);
    expect((await spoken.recordings()).slice(-2)).toEqual([THIS_IS, word(answer)]);
    await check.touch(check.action);
    await expect(check.progress).toHaveAttribute('aria-valuenow', '1');
  });
});

test.describe('What do I know?: with the sound off', () => {
  test.use({ sound: 'off' });

  test('Given the device is muted, when the child answers every question, then the game can still be finished from what is shown', async ({
    page,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    for (let i = 0; i < 5; i++) await check.answerRightAndGoOn();
    await expect(check.results).toBeVisible();
  });
});

const LOOK = '/recordings/check/look-what-you-can-do.wav';
const TOUCH_A_PICTURE = '/recordings/check/touch-a-picture.wav';
const WELL_PLAYED = '/recordings/check/well-played.wav';

test.describe('What do I know?: what the child can do', () => {
  test('@critical Given the game ends, when results are shown, then only the skills answered correctly are shown, as earned pictures, with no score, stars, percentage or count of misses', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    // The first lesson's two skills alternate: Sound it out or Letter sounds first.
    const first = (await check.rounds()) && (await page.title());
    expect(first).toBeTruthy();
    await check.answerRightAndGoOn();
    for (let i = 1; i < 5; i++) await check.answerWrongUntilModelledAndGoOn();

    await expect(check.results).toBeVisible();
    await expect(check.resultsTitle).toHaveText('Look what you can do!');
    await expect(check.earned).toHaveCount(1);
    await expect(check.subjects).toHaveText(['Reading']);
    await expect(check.earned.locator('.skills__tick')).toHaveCount(1);
    await expect(page.getByText(/score|star|%|missed|wrong|out of|\d+ of \d+/i)).toHaveCount(0);
    await expect(page.locator('[role="progressbar"]')).toHaveCount(0);
    await expect
      .poll(async () => (await spoken.recordings()).slice(-2))
      .toEqual([LOOK, TOUCH_A_PICTURE]);
  });

  test('Given results, when an earned picture is touched, then its name is spoken; Home returns to Home', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    const home = new HomePage(page);
    await check.openFromHome();
    for (let i = 0; i < 5; i++) await check.answerRightAndGoOn();
    await expect(check.earnedTitles).toHaveText(['Sound it out', 'Letter sounds']);

    await check.touch(check.earned.filter({ hasText: 'Letter sounds' }));

    await expect
      .poll(async () => (await spoken.recordings()).at(-1))
      .toBe('/recordings/home/letter-sounds.wav');
    await check.touch(check.home);
    await expect(home.checkCard).toBeVisible();
  });

  test('Given nothing was answered correctly, when results are shown, then the child is praised for playing and nothing is marked', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();
    for (let i = 0; i < 5; i++) await check.answerWrongUntilModelledAndGoOn();

    await expect(check.resultsTitle).toHaveText('Well played!');
    await expect(check.earned).toHaveCount(0);
    await expect(page.getByText(/score|star|%|missed|wrong/i)).toHaveCount(0);
    await expect.poll(async () => (await spoken.recordings()).at(-2)).toBe(WELL_PLAYED);
  });
});

test.describe('What do I know?: kept on this device only', () => {
  test('Given the child has opened Count the toys and Skip-count, when the check game starts, then its questions come from them and ask how many', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const check = new CheckGamePage(page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Count the toys'));
    await expect(page).toHaveURL(/count\/toys/);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Skip-count'));
    await expect(page).toHaveURL(/count\/skip/);
    await home.open();

    await home.touch(home.checkCard);

    await expect(check.question).toBeVisible();
    expect(await check.rounds()).toBe(5);
    for (let i = 0; i < 5; i++) {
      await expect(check.instruction).toHaveText(/^How many (ducks|teddies|balls)\?$/);
      await check.answerRightAndGoOn();
    }
    await expect(check.subjects).toHaveText(['Counting']);
    await expect(check.earnedTitles).toHaveText(['Count the toys', 'Skip-count']);
  });

  test('Given results, when saved, then only the earned skills are kept, on this device, and no request carries them', async ({
    page,
  }) => {
    const sent: string[] = [];
    page.on('request', (r) => {
      if (r.method() !== 'GET' || r.postData()) sent.push(`${r.method()} ${r.url()}`);
    });
    const check = new CheckGamePage(page);
    await check.openFromHome();
    await check.answerRightAndGoOn();
    for (let i = 1; i < 5; i++) await check.answerWrongUntilModelledAndGoOn();
    await expect(check.results).toBeVisible();

    const stored = await check.stored();
    expect(Object.keys(stored).sort()).toEqual(['pibbo:check']);
    const kept = JSON.parse(stored['pibbo:check']!);
    expect(kept.version).toBe(1);
    expect(kept.earned).toHaveLength(1);
    expect(Object.keys(kept).sort()).toEqual(['earned', 'version']);
    expect(sent).toEqual([]);
  });

  test('Given a damaged practice history on the device, when the check game starts, then it counts as none and the first lesson is used', async ({
    page,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem('pibbo:practice', '{"version":1,"practised":"<b>'),
    );
    const check = new CheckGamePage(page);
    await check.openFromHome();

    await expect(check.instruction).toHaveText('Which word goes with the picture?');
    await expect(page.getByText('<b>')).toHaveCount(0);
  });
});
