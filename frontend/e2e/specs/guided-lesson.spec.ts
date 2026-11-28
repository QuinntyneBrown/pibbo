// Traces to: L2-022
import { test, expect } from '../fixtures/test';
import { CountTheToysPage } from '../pages/count-the-toys.page';
import { HomePage } from '../pages/home.page';
import { LessonPage } from '../pages/lesson.page';

const COUNT_TITLE = '/recordings/lessons/count.wav';
const UP_NEXT = '/recordings/lessons/up-next.wav';
const DONE = '/recordings/lessons/done.wav';
const YES = '/recordings/count/yes.wav';
const name = (id: string) => `/recordings/home/${id}.wav`;

test.describe('Guided lesson: the path', () => {
  test('Given the counting lesson, when it opens, then a path of 5 steps shows step 1 current by shape and colour, and its title, "Up next" and the first activity are spoken and shown', async ({
    page,
    spoken,
  }) => {
    const lesson = new LessonPage(page);
    await lesson.open('count');

    await expect(lesson.title).toHaveText('Numbers up and down');
    await expect(lesson.steps).toHaveCount(5);
    await expect(lesson.node(1)).toHaveAttribute('aria-current', 'step');
    await expect(lesson.node(1)).toHaveClass(/path__node--now/);
    await expect(lesson.later).toHaveCount(4);
    await expect(lesson.name(1)).toHaveText('Count the toys');
    await expect(lesson.next).toHaveText('Up next: Count the toys');
    await expect(lesson.play).toHaveText('Play game 1');
    // By shape as well as colour: the current node is larger than a later one.
    const [now, later] = [await lesson.node(1).boundingBox(), await lesson.node(2).boundingBox()];
    expect(now!.width).toBeGreaterThan(later!.width);
    expect(now!.width).toBeGreaterThanOrEqual(60);
    expect(await lesson.scrolls()).toBe(false);
    await expect
      .poll(() => spoken.recordings())
      .toEqual([COUNT_TITLE, UP_NEXT, name('count-the-toys')]);
  });

  test('Given the path, when the child touches Play, then the current activity opens as part of the lesson', async ({
    page,
  }) => {
    const lesson = new LessonPage(page);
    await lesson.open('count');

    await lesson.touch(lesson.play);

    await expect(page).toHaveURL(/\/count\/toys\?lesson=count&step=1$/);
    await expect(page.locator('.shell--count')).toBeVisible();
  });
});

test.describe('Guided lesson: moving on', () => {
  test('Given the counting lesson, when the child finishes activity 1 and touches Next after its brief praise, then the path shows step 1 done and step 2 current by shape and colour, and "Up next" and activity 2 are spoken and shown @critical', async ({
    page,
    spoken,
  }) => {
    const lesson = new LessonPage(page);
    const count = new CountTheToysPage(page);
    await lesson.open('count');
    await lesson.touch(lesson.play);
    await expect(count.root).toBeVisible();

    for (let round = 0; round < 5; round++) {
      await expect(count.counted).toHaveCount(0);
      await count.answer(await count.countAll());
      await expect(count.message).toHaveText(/Yes!/);
      await count.touch(count.action);
    }
    await expect(lesson.root).toBeVisible();
    await expect(lesson.node(1)).toHaveClass(/path__node--done/);
    await expect(lesson.node(2)).toHaveAttribute('aria-current', 'step');
    await expect(lesson.node(2)).toHaveClass(/path__node--now/);
    await expect(lesson.later).toHaveCount(3);
    await expect(lesson.next).toHaveText('Up next: Count and write');
    await expect(lesson.play).toHaveText('Play game 2');
    await expect
      .poll(async () => (await spoken.recordings()).slice(-3))
      .toEqual([YES, UP_NEXT, name('count-and-write')]);

    await lesson.touch(lesson.play);
    await expect(page).toHaveURL(/\/count\/write\?lesson=count&step=2$/);
  });

  test('Given step 2 is current, when step 1 is finished again (a replay or a reload), then step 2 is still current and nothing is skipped', async ({
    page,
  }) => {
    const lesson = new LessonPage(page);
    await lesson.open('count', '?finished=1');
    await expect(lesson.node(2)).toHaveAttribute('aria-current', 'step');

    await lesson.open('count', '?finished=1');

    await expect(lesson.node(2)).toHaveAttribute('aria-current', 'step');
    await expect(lesson.done).toHaveCount(1);
  });
});

test.describe('Guided lesson: pausing', () => {
  test('Given a lesson in progress, when the child touches Home on the path, then Home shows with the lesson group chosen and no confirmation dialog', async ({
    page,
  }) => {
    const lesson = new LessonPage(page);
    const home = new HomePage(page);
    await lesson.open('count');

    await lesson.touch(lesson.home);

    await expect(home.root).toBeVisible();
    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  });

  test('Given an activity opened from the lesson, when the child touches Leave, then the path returns at the same step', async ({
    page,
  }) => {
    const lesson = new LessonPage(page);
    const count = new CountTheToysPage(page);
    await lesson.open('count');
    await lesson.touch(lesson.play);
    await expect(count.root).toBeVisible();

    await count.touch(count.leave);

    await expect(lesson.root).toBeVisible();
    await expect(lesson.node(1)).toHaveAttribute('aria-current', 'step');
    await expect(lesson.done).toHaveCount(0);
  });
});

test.describe('Guided lesson: resuming on the same device', () => {
  test('Given step 2 is current, when the child leaves and comes back to the lesson, then it resumes at step 2', async ({
    page,
  }) => {
    const lesson = new LessonPage(page);
    const home = new HomePage(page);
    await lesson.open('count', '?finished=1');
    await expect(lesson.node(2)).toHaveAttribute('aria-current', 'step');
    await lesson.touch(lesson.home);
    await expect(home.root).toBeVisible();
    await expect(home.activities.first()).toBeVisible();
    await lesson.settle();

    await lesson.open('count');

    await expect(lesson.node(2)).toHaveAttribute('aria-current', 'step');
    await expect(lesson.next).toHaveText('Up next: Count and write');
    expect(JSON.parse((await lesson.stored('count')) ?? 'null')).toEqual({
      v: 1,
      step: 2,
      at: 'count-and-write',
    });
  });

  for (const [what, value] of [
    ['damaged', '{"v":1,"step":'],
    ['of an old version', '{"v":0,"step":3,"at":"which-is-bigger"}'],
    ['out of range', '{"v":1,"step":9,"at":"done"}'],
    ['no longer matching the lesson', '{"v":1,"step":3,"at":"count-the-toys"}'],
  ] as const) {
    test(`Given a stored place that is ${what}, when the lesson opens, then it is treated as not there and the lesson starts at step 1`, async ({
      page,
    }) => {
      const lesson = new LessonPage(page);
      await lesson.storeBeforeLoad('count', value);

      await lesson.open('count');

      await expect(lesson.node(1)).toHaveAttribute('aria-current', 'step');
      await expect(lesson.done).toHaveCount(0);
    });
  }

  test('Given the last step is current, when the child finishes it, then every step is done, "Lesson done" is spoken and shown, and Back home returns Home', async ({
    page,
    spoken,
  }) => {
    const lesson = new LessonPage(page);
    const home = new HomePage(page);
    await lesson.storeBeforeLoad('count', '{"v":1,"step":5,"at":"counting-dance"}');

    await lesson.open('count', '?finished=5');

    await expect(lesson.done).toHaveCount(5);
    await expect(lesson.current).toHaveCount(0);
    await expect(page.locator('.lesson__next p')).toHaveText('Lesson done! You played every game.');
    await expect.poll(async () => (await spoken.recordings()).at(-1)).toBe(DONE);
    await lesson.touch(lesson.play);
    await expect(home.root).toBeVisible();
  });
});
