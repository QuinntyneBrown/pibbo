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

/** Every activity, with the instruction its check question shows. */
const QUESTIONS: Readonly<Record<string, RegExp>> = {
  'count-the-toys': /^How many (teddies|ducks|balls)\?$/,
  'count-and-write': /^How many (teddies|ducks|balls)\?$/,
  'which-is-bigger': /^Which number is bigger\?$/,
  'rocket-countdown': /^What comes next going down\?$/,
  'skip-count': /^Where do we land next\?$/,
  'add-together': /^How many altogether\?$/,
  'counting-dance': /^What comes next\?$/,
  'sound-it-out': /^Which picture goes with this word\?$/,
  'letter-sounds': /^Which letter makes this sound\?$/,
  'big-and-small-letters': /^Which small letter goes with this big letter\?$/,
  'spell-by-sound': /^Which word says this\?$/,
  'words-and-pictures': /^Which word goes with the picture\?$/,
  'spot-the-word': /^Find the word “\w+”\.$/,
  'rhyme-time': /^Which one rhymes with “\w+”\?$/,
};

test.describe('Check game: what has been practised', () => {
  test('Given the child has opened Rocket countdown from Home, when the check game starts, then it asks about that, and only its id is kept on the device', async ({
    page,
  }) => {
    const check = new CheckGamePage(page);
    const home = new HomePage(page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Rocket countdown'));
    await home.touch(check.leave);
    await home.touch(check.card());

    await expect(check.instruction).toHaveText(QUESTIONS['rocket-countdown']!);
    await expect(check.progress).toHaveAttribute('aria-valuemax', '5');
    expect(await check.storedKeys()).toEqual(['pibbo:practised']);
    expect(await check.stored('practised')).toEqual({
      version: 1,
      activities: ['rocket-countdown'],
    });
  });

  test('Given an activity opened twice, when the device is read, then it is kept once', async ({
    page,
  }) => {
    const check = new CheckGamePage(page);
    const home = new HomePage(page);
    await check.openWithStored('practised', '{"version":1,"activities":["count-the-toys"]}');
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Count the toys'));

    await expect(check.root).toBeVisible();
    expect(await check.stored('practised')).toEqual({
      version: 1,
      activities: ['count-the-toys'],
    });
  });

  test('Given ten activities practised, when the check game starts, then there are eight questions', async ({
    page,
  }) => {
    const check = new CheckGamePage(page);
    await check.openPractised(Object.keys(QUESTIONS).slice(0, 10));

    await expect(check.progress).toHaveAttribute('aria-valuemax', '8');
  });

  for (const [what, value] of [
    ['not JSON', '<b>nonsense'],
    ['another version', '{"version":2,"activities":["skip-count"]}'],
    ['unknown activities', '{"version":1,"activities":["<img>",7]}'],
  ] as const) {
    test(`Given a stored history that is ${what}, when the check game starts, then it asks the first lesson's questions`, async ({
      page,
    }) => {
      const check = new CheckGamePage(page);
      await check.openWithStored('practised', value);
      await check.touch(check.card());

      await expect(check.instruction).toHaveText(FIRST_LESSON);
      await expect(check.progress).toHaveAttribute('aria-valuemax', '5');
    });
  }
});

for (const size of [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 640, height: 360 },
]) {
  test.describe(`Check game: every activity's question at ${size.width} x ${size.height}`, () => {
    test.use({ viewport: size });

    test('Given each activity alone practised, when its question is shown, then three choices of at least 60 x 60 px are clear of the answer bar and nothing scrolls', async ({
      page,
    }) => {
      const check = new CheckGamePage(page);
      for (const [activity, instruction] of Object.entries(QUESTIONS)) {
        await check.openPractised([activity]);
        await expect(check.instruction, activity).toHaveText(instruction);
        await expect(check.choices, activity).toHaveCount(3);
        for (const choice of await check.choices.all()) {
          const box = (await choice.boundingBox())!;
          expect(box.width, activity).toBeGreaterThanOrEqual(60);
          expect(box.height, activity).toBeGreaterThanOrEqual(60);
          expect(box.x, activity).toBeGreaterThanOrEqual(0);
          expect(box.x + box.width, activity).toBeLessThanOrEqual(size.width);
        }
        expect(await check.shownFits(), activity).toBe(true);
        expect(await check.scrolls(), activity).toBe(false);
        expect(await check.hiddenUnderAnswerBar(), activity).toBe(false);
      }
    });
  });
}
