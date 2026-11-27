// Traces to: L2-024
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';
import { ActivityPlaceholderPage } from '../pages/activity-placeholder.page';

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
  expect(await home.scrolls()).toBe(false);
}

test.describe('Home: choose an activity', () => {
  test('Given Home has just opened, when shown, then Count and Read show, nothing is chosen or spoken, nothing scrolls and targets are 60 px with 16 px between', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await expect(home.groups).toHaveCount(2);
    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'false');
    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'false');
    await expect(home.activities).toHaveCount(0);
    await expectTargetsSizedAndApart(home);
    expect(await spoken.recordings()).toEqual([]);
  });

  test('Given Home, when the child touches the Count picture, then "Count" is spoken and the counting activities are shown', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await home.touch(home.group('Count'));

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activityGroupTitle).toHaveText('Count');
    await expect(home.activity('Count the toys')).toBeVisible();
    await expect(home.activity('Sound it out')).toHaveCount(0);
    expect(await spoken.recordings()).toEqual(['/recordings/home/count.wav']);
    await expectTargetsSizedAndApart(home);
  });

  test('Given Home, when the child touches the Read picture, then "Read" is spoken and the reading activities are shown', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    await home.open();

    await home.touch(home.group('Read'));

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'false');
    await expect(home.activity('Sound it out')).toBeVisible();
    await expect(home.activity('Count the toys')).toHaveCount(0);
    expect(await spoken.recordings()).toEqual(['/recordings/home/read.wav']);
    await expectTargetsSizedAndApart(home);
  });

  test('Given the counting activities, when the child touches an activity picture once, then its name is spoken and it opens', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    const activity = new ActivityPlaceholderPage(page);
    await home.open();
    await home.touch(home.group('Count'));

    await home.touch(home.activity('Count the toys'));

    await expect(activity.title).toHaveText('Count the toys');
    expect(activity.path()).toBe('/count/toys');
    expect(await spoken.recordings()).toEqual([
      '/recordings/home/count.wav',
      '/recordings/home/count-the-toys.wav',
    ]);
  });

  test('Given an open activity placeholder, when the child touches Home, then Home returns with the group still chosen', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const activity = new ActivityPlaceholderPage(page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Sound it out'));
    await expect(activity.title).toHaveText('Sound it out');

    await home.touch(activity.home);

    await expect(home.group('Read')).toHaveAttribute('aria-pressed', 'true');
    await expect(home.activity('Sound it out')).toBeVisible();
  });

  test('Given a desktop with a keyboard, when Read and an activity are reached with Tab and Enter, then each is spoken and the activity opens', async ({
    page,
    spoken,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-desktop', 'the keyboard is for the desktop');
    const home = new HomePage(page);
    const activity = new ActivityPlaceholderPage(page);
    await home.open();

    await home.activateWithKeyboard(home.group('Read'));
    await home.activateWithKeyboard(home.activity('Sound it out'));

    await expect(activity.title).toHaveText('Sound it out');
    expect(await spoken.recordings()).toEqual([
      '/recordings/home/read.wav',
      '/recordings/home/sound-it-out.wav',
    ]);
  });
});
