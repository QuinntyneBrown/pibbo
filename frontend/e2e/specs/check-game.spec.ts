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

const YES = '/recordings/count/yes.wav';
const ANSWER_IS = '/recordings/check/here-is-the-answer.wav';

test.describe('Check game: answering', () => {
  test('@critical Given Home, when the child answers all five questions of the first lesson, then each right answer is shown and spoken as praise and Next asks the next', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openFromHome();

    for (let round = 0; round < 5; round++) {
      await expect(check.progress).toHaveAttribute('aria-valuenow', String(round));
      await expect(check.instruction).toHaveText(FIRST_LESSON);
      await expect(check.action).toBeDisabled();
      const { right } = await check.solve();

      await check.touch(check.choice(right));
      await expect(check.choice(right)).toHaveAttribute('aria-pressed', 'true');
      await check.touch(check.action);

      await expect(check.message).toHaveText('Yes!');
      await expect(check.action).toHaveText('Next');
      // As the mock draws it, the choice stays pressed; the tick is for the answer Pibbo shows.
      await expect(check.choice(right)).toHaveAttribute('aria-pressed', 'true');
      await expect(check.rightChoice).toHaveCount(0);
      for (const choice of await check.choices.all()) await expect(choice).toBeDisabled();
      await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(YES);
      expect(await check.scrolls()).toBe(false);
      await check.touch(check.action);
    }
  });

  test('Given a wrong answer, when it is checked, then a hint is spoken and shown, and Try again asks the same question with nothing chosen', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openPractised(['which-is-bigger']);
    const { wrong } = await check.solve();
    const choices = await check.choiceNames();

    await check.answer(wrong);

    const hint = await check.message.textContent();
    expect(hint!.trim().length).toBeGreaterThan(0);
    await expect(check.action).toHaveText('Try again');
    await expect(check.rightChoice).toHaveCount(0);
    for (const choice of await check.choices.all()) await expect(choice).toBeDisabled();
    await expect
      .poll(async () => (await spoken.recordings()).at(-1))
      .toBe('/recordings/count/which-has-more.wav');

    await check.touch(check.action);

    await expect(check.message).toHaveCount(0);
    expect(await check.choiceNames()).toEqual(choices);
    for (const choice of await check.choices.all()) {
      await expect(choice).toBeEnabled();
      await expect(choice).toHaveAttribute('aria-pressed', 'false');
    }
    await expect(check.action).toBeDisabled();
    await expect(check.progress).toHaveAttribute('aria-valuenow', '0');
  });

  test('Given two wrong answers, when a third is checked, then the right choice is ticked and said, and Next asks the next question', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openPractised(['which-is-bigger']);
    const { right, wrong } = await check.solve();

    for (let miss = 0; miss < 2; miss++) {
      await check.answer(wrong);
      await check.touch(check.action);
    }
    await check.answer(wrong);

    await expect(check.message).toHaveText('Here is the answer.');
    await expect(check.rightChoice).toHaveAttribute('aria-label', right);
    await expect(check.rightChoice).toHaveAttribute('aria-pressed', 'true');
    await expect(check.choice(wrong)).toHaveAttribute('aria-pressed', 'false');
    await expect(check.action).toHaveText('Next');
    await expect
      .poll(async () => (await spoken.recordings()).slice(-2))
      .toEqual([ANSWER_IS, `/recordings/numbers/${right}.wav`]);

    await check.touch(check.action);
    await expect(check.progress).toHaveAttribute('aria-valuenow', '1');
    await expect(check.message).toHaveCount(0);
    await expect(check.rightChoice).toHaveCount(0);
  });

  test('Given a number or a picture, when it is chosen, then it is said; a word to read is chosen in silence', async ({
    page,
    spoken,
  }) => {
    const check = new CheckGamePage(page);
    await check.openPractised(['which-is-bigger']);
    const number = (await check.choiceNames())[0]!;
    await check.touch(check.choice(number));
    await expect
      .poll(async () => (await spoken.recordings()).at(-1))
      .toBe(`/recordings/numbers/${number}.wav`);

    await check.openPractised(['rhyme-time']);
    const picture = (await check.choiceNames())[0]!;
    await check.touch(check.choice(picture));
    await expect
      .poll(async () => (await spoken.recordings()).at(-1))
      .toBe(`/recordings/words/${picture}.wav`);

    await check.openPractised(['words-and-pictures']);
    await expect
      .poll(async () => (await spoken.recordings()).at(-1))
      .toBe('/recordings/check/which-word-goes-with-the-picture.wav');
    const asked = (await spoken.recordings()).length;
    const word = (await check.choiceNames())[0]!;
    await check.touch(check.choice(word));
    await expect(check.choice(word)).toHaveAttribute('aria-pressed', 'true');
    await expect(check.action).toBeEnabled();
    expect((await spoken.recordings()).length).toBe(asked);
  });

  test('Given praise, when a second and a half pass, then Pibbo rests; Next never waited for it', async ({
    page,
  }) => {
    const check = new CheckGamePage(page);
    await check.openPractised(['which-is-bigger']);
    await check.answer((await check.solve()).right);

    await expect(check.mascot).toHaveClass(/pibbo--cheer/);
    await expect(check.action).toBeEnabled();
    await page.clock.runFor(1500);

    await expect(check.mascot).not.toHaveClass(/pibbo--cheer/);
  });

  test.describe('muted', () => {
    test.use({ sound: 'off' });

    test('Given a muted device, when the child answers, then the question, the hint and the praise are shown and the game goes on', async ({
      page,
    }) => {
      const check = new CheckGamePage(page);
      await check.openPractised(['which-is-bigger']);
      const { right, wrong } = await check.solve();

      await check.answer(wrong);
      await expect(check.message).not.toBeEmpty();
      await check.touch(check.action);
      await check.answer(right);

      await expect(check.message).toHaveText('Yes!');
      await check.touch(check.action);
      await expect(check.progress).toHaveAttribute('aria-valuenow', '1');
    });
  });
});

for (const size of [
  { width: 320, height: 568 },
  { width: 360, height: 640 },
  { width: 640, height: 360 },
]) {
  test.describe(`Check game: after Check at ${size.width} x ${size.height}`, () => {
    test.use({ viewport: size });

    for (const activity of ['count-and-write', 'add-together', 'sound-it-out']) {
      test(`Given ${activity}, when a hint, then the answer, then praise are shown, then nothing is under the answer bar and nothing scrolls`, async ({
        page,
      }) => {
        const check = new CheckGamePage(page);
        await check.openPractised([activity]);
        const fits = async (state: string) => {
          await expect(check.action, state).toBeVisible();
          expect(await check.shownFits(), state).toBe(true);
          expect(await check.scrolls(), state).toBe(false);
          expect(await check.hiddenUnderAnswerBar(), state).toBe(false);
        };

        // Each choice in turn until three are wrong: the fourth state is the answer shown.
        let misses = 0;
        for (const name of await check.choiceNames()) {
          if (misses === 3) break;
          await check.answer(name);
          // The result is shown before it is read.
          await expect(check.action).not.toHaveText('Check');
          if ((await check.action.textContent())!.includes('Next')) break;
          await fits('hint');
          await check.touch(check.action);
          misses++;
        }
        await fits('over');
      });
    }
  });
}
