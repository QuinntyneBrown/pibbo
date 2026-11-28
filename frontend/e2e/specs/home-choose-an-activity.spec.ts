// Traces to: L2-024, L2-009 (ADR 0035)
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { SoundItOutPage } from '../pages/sound-it-out.page';
import { CountTheToysPage } from '../pages/count-the-toys.page';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

function gapBetween(a: Box, b: Box): number {
  const dx = Math.max(b.x - (a.x + a.width), a.x - (b.x + b.width), 0);
  const dy = Math.max(b.y - (a.y + a.height), a.y - (b.y + b.height), 0);
  return Math.max(dx, dy);
}

async function expectTargetsSizedAndApart(home: HomePage): Promise<void> {
  const boxes = await home.targetBoxes();
  expect(boxes.length).toBeGreaterThan(0);
  for (const b of boxes) {
    expect(b.width).toBeGreaterThanOrEqual(60);
    expect(b.height).toBeGreaterThanOrEqual(60);
  }
  for (let i = 0; i < boxes.length; i++) {
    for (let j = i + 1; j < boxes.length; j++) {
      expect(gapBetween(boxes[i]!, boxes[j]!)).toBeGreaterThanOrEqual(16);
    }
  }
  expect(await home.scrollsSideways()).toBe(false);
}

const READING = ['Letters', 'Sounds into words', 'Words and sentences'];
const COUNTING = ['Counting', 'Numbers'];

test.describe('Home: choose an activity', () => {
  test('Given Home has just opened, when nothing has been touched, then Reading is chosen with its sections, nothing is spoken, nothing scrolls sideways and targets are 60 px with 16 px between', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(home.groups).toHaveText(['Reading', 'Counting']);
    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'false');
    await expect(home.sectionTitles).toHaveText(READING);
    await expectTargetsSizedAndApart(home);
    expect(await spoken.recordings()).toEqual([]);
  });

  test('Given Home, when the child touches Counting, then "Counting" is spoken and the counting activities are shown in their sections', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await home.touch(home.group('Count'));

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'false');
    await expect(home.sectionTitles).toHaveText(COUNTING);
    await expect(home.activities).toHaveText([
      /Count the toys/,
      /Count and write/,
      /Rocket countdown/,
      /Skip-count/,
      /Counting dance/,
      /Which is bigger\?/,
      /Add together/,
    ]);
    expect(await spoken.recordings()).toEqual(['/recordings/home/count.wav']);
    await expectTargetsSizedAndApart(home);
  });

  test('Given Counting is chosen, when the child touches Reading, then "Reading" is spoken and every reading activity is shown in its section', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open('/?group=count');

    await home.touch(home.group('Read'));

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.sectionTitles).toHaveText(READING);
    await expect(home.activities).toHaveText([
      /Big and small letters/,
      /Letter sounds/,
      /Sound it out/,
      /Spell by sound/,
      /Rhyme time/,
      /Words and pictures/,
      /Spot the word/,
      /Build a sentence/,
    ]);
    expect(await spoken.recordings()).toEqual(['/recordings/home/read.wav']);
  });

  test("Given Home, when shown, then the sample child's name and 26 stars are in the top bar and each card names its stars out of three", async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(home.childName).toHaveText(/Maya/);
    await expect(home.starsTotal).toHaveAccessibleName('26 stars');
    await expect(home.stars('Big and small letters')).toHaveAccessibleName('3 of 3 stars');
    await expect(home.stars('Words and pictures')).toHaveAccessibleName('1 of 3 stars');
  });

  test("Given no lesson game is done, when Home is shown, then today's lesson is named with no dot done, and Start is spoken and opens the lesson", async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(home.lessonTitle).toHaveText('Sounds that team up');
    await expect(home.lessonDots).toHaveAccessibleName('0 of 5 games done');
    await expect(home.lesson).toHaveText(/Start/);

    await home.touch(home.lesson);

    await expect(page).toHaveURL(/\/lesson\/read$/);
    expect((await spoken.recordings())[0]).toBe('/recordings/home/start.wav');
  });

  test('Given two games of the reading lesson are done, when Home is shown, then two dots are done and Keep going is spoken', async ({
    page,
    spoken,
  }) => {
    await page.addInitScript(() =>
      localStorage.setItem(
        'pibbo:lesson:read',
        JSON.stringify({ v: 1, step: 3, at: 'spell-by-sound' }),
      ),
    );
    const home = new HomePage(page);
    await home.open();

    await expect(home.lessonDots).toHaveAccessibleName('2 of 5 games done');
    await expect(home.lesson).toHaveText(/Keep going/);

    await home.touch(home.lesson);

    await expect(page).toHaveURL(/\/lesson\/read$/);
    expect((await spoken.recordings())[0]).toBe('/recordings/home/keep-going.wav');
  });

  test("Given Counting is chosen, when Home is shown, then today's lesson is the counting lesson", async ({
    page,
  }) => {
    const home = new HomePage(page);
    await home.open('/?group=count');

    await expect(home.lessonTitle).toHaveText('Numbers up and down');
  });

  for (const width of [320, 768, 1024, 1920]) {
    test(`Given a ${width} px wide screen, when Home is shown, then nothing scrolls sideways and targets are 60 px with 16 px between`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 800 });
      const home = new HomePage(page);
      await home.open();

      await expect(home.activities.first()).toBeVisible();
      await expectTargetsSizedAndApart(home);
    });
  }

  test('Given the counting activities, when the child touches an activity card once, then its name is spoken and it opens @critical', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    const activity = new CountTheToysPage(page);
    await home.open();
    await home.touch(home.group('Count'));

    await home.touch(home.activity('Count the toys'));

    await expect(activity.root).toBeVisible();
    expect(new URL(page.url()).pathname).toBe('/count/toys');
    expect((await spoken.recordings()).slice(0, 2)).toEqual([
      '/recordings/home/count.wav',
      '/recordings/home/count-the-toys.wav',
    ]);
  });

  test('Given an open activity, when the grown-up touches leave, then Home returns with the group still chosen', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const activity = new SoundItOutPage(page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Sound it out'));
    await expect(activity.root).toBeVisible();

    await home.touch(activity.leave);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Sound it out')).toBeVisible();
  });

  test('Given a desktop with a keyboard, when Read and an activity are reached with Tab and Enter, then each is spoken and the activity opens', async ({
    page,
    spoken,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'the keyboard is for the desktop');
    const home = new HomePage(page);
    const activity = new SoundItOutPage(page);
    await home.open();

    await home.activateWithKeyboard(home.group('Count'));
    await home.activateWithKeyboard(home.group('Read'));
    await home.activateWithKeyboard(home.activity('Sound it out'));

    await expect(activity.root).toBeVisible();
    expect((await spoken.recordings()).slice(0, 3)).toEqual([
      '/recordings/home/count.wav',
      '/recordings/home/read.wav',
      '/recordings/home/sound-it-out.wav',
    ]);
  });
});

test.describe('Home: the group switch as its mock draws it', () => {
  test('Given a group is chosen, when the switch is shown, then Reading and Counting sit on one tray, the chosen one filled and the other flat', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const home = new HomePage(page);
    await home.open();

    await home.touch(home.group('Count'));

    await expect
      .poll(() => home.switchSurfaces())
      .toEqual({ tray: 'rgb(237, 225, 248)', options: ['rgba(0, 0, 0, 0)', 'rgb(80, 25, 192)'] });
  });
});
