// Traces to: L2-022
import { test, expect } from '../fixtures/test';
import { LessonPage } from '../pages/lesson.page';

const COUNT_TITLE = '/recordings/lessons/count.wav';
const UP_NEXT = '/recordings/lessons/up-next.wav';
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
