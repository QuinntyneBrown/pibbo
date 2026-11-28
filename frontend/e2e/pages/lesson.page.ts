import { expect, type Locator, type Page } from '@playwright/test';

/** The guided lesson path (docs/mocks/pages/guided-lesson). Owns every selector for it. */
export class LessonPage {
  readonly root: Locator;
  readonly kicker: Locator;
  readonly title: Locator;
  readonly path: Locator;
  readonly steps: Locator;
  readonly nodes: Locator;
  readonly current: Locator;
  readonly done: Locator;
  readonly later: Locator;
  readonly next: Locator;
  readonly play: Locator;
  readonly home: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.lesson');
    this.kicker = page.locator('.lesson__kicker');
    this.title = page.locator('.lesson__title');
    this.path = page.locator('.path');
    this.steps = page.locator('.path__step');
    this.nodes = page.locator('.path__node');
    this.current = page.locator('.path__node--now');
    this.done = page.locator('.path__node--done');
    this.later = page.locator('.path__node:disabled');
    this.next = page.locator('.lesson__next p');
    this.play = page.locator('.lesson__foot .chunky');
    this.home = page.locator('.lesson__top .chunky--icon');
  }

  step(n: number): Locator {
    return this.steps.nth(n - 1);
  }

  node(n: number): Locator {
    return this.step(n).locator('.path__node');
  }

  name(n: number): Locator {
    return this.step(n).locator('.path__name');
  }

  /** Opens a lesson's path straight from its address. */
  async open(lesson: 'count' | 'read', query = ''): Promise<void> {
    await this.page.goto(`/lesson/${lesson}${query}`);
    await expect(this.root).toBeVisible();
    await this.settle();
  }

  /** Waits for fonts still loading: the next navigation would cut them off and fail the guard. */
  async settle(): Promise<void> {
    await this.page.evaluate(() => document.fonts.ready.then(() => undefined));
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Whether the page can scroll in either direction. */
  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }

  /** Puts a value where the lesson keeps its place, before the app starts. */
  async storeBeforeLoad(lesson: 'count' | 'read', value: string): Promise<void> {
    await this.page.addInitScript(
      ([key, v]) => {
        if (!sessionStorage.getItem('pibbo-e2e-stored')) {
          localStorage.setItem(key, v);
          sessionStorage.setItem('pibbo-e2e-stored', '1');
        }
      },
      [`pibbo:lesson:${lesson}`, value] as const,
    );
  }

  /** What the device keeps for a lesson, or null. */
  async stored(lesson: 'count' | 'read'): Promise<string | null> {
    return this.page.evaluate((key) => localStorage.getItem(key), `pibbo:lesson:${lesson}`);
  }
}
