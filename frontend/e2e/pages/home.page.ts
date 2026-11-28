import { expect, type Locator, type Page } from '@playwright/test';

export type GroupName = 'Count' | 'Read';

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The Home screen. Owns every selector for it; specs never hold one. */
export class HomePage {
  readonly root: Locator;
  readonly wordmark: Locator;
  readonly main: Locator;
  readonly groups: Locator;
  readonly activities: Locator;
  readonly activityGroupTitle: Locator;
  /** More: the next screen of a group with more than 6 activities. */
  readonly more: Locator;
  /** The chosen group's guided lesson (L2-024 #4). */
  readonly lesson: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.home');
    this.wordmark = page.locator('.home__top .wordmark');
    this.main = page.locator('main#main');
    this.groups = page.locator('.switch--groups .switch__option');
    this.activities = page.locator('.home__games .game-card:not(.game-card--more)');
    this.activityGroupTitle = page.locator('.home__games .game-group__title');
    this.more = page.locator('.home__games .game-card--more');
    this.lesson = page.locator('.home__lesson');
  }

  group(name: GroupName): Locator {
    return this.groups.filter({ hasText: name });
  }

  activity(name: string): Locator {
    return this.activities.filter({ hasText: name });
  }

  /** The no-network symbol on an activity picture, drawn offline when it cannot open (L2-033). */
  offlineSymbol(name: string): Locator {
    return this.activity(name).locator('.game-card__offline');
  }

  async open(path = '/'): Promise<void> {
    await this.page.goto(path);
    await expect(this.root).toBeVisible();
  }

  /** The colours Home is drawn in: the page, its text and the wordmark's seed. */
  async colours(): Promise<{ paper: string; ink: string; seed: string }> {
    const body = this.page.locator('body');
    const [paper, ink] = await body.evaluate((el) => {
      const style = getComputedStyle(el);
      return [style.backgroundColor, style.color];
    });
    const seed = await this.wordmark
      .locator('.wordmark__seed')
      .evaluate((el) => getComputedStyle(el).backgroundColor);
    return { paper: paper!, ink: ink!, seed };
  }

  /** The colours of the group switch: its tray and each option, in order. */
  async switchSurfaces(): Promise<{ tray: string; options: string[] }> {
    const background = (el: Element) => getComputedStyle(el).backgroundColor;
    return {
      tray: await this.page.locator('.switch--groups').evaluate(background),
      options: await this.groups.evaluateAll((all) =>
        all.map((el) => getComputedStyle(el).backgroundColor),
      ),
    };
  }

  /** Opens Home and returns the response headers of the page itself. */
  async openWithHeaders(): Promise<Record<string, string>> {
    const response = await this.page.goto('/');
    await expect(this.root).toBeVisible();
    return response?.headers() ?? {};
  }

  /** Touches (phone) or clicks (desktop) a target, the way a child or grown-up would. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Moves focus to a target with Tab and activates it with Enter. */
  async activateWithKeyboard(target: Locator): Promise<void> {
    for (let i = 0; i < 20; i++) {
      await this.page.keyboard.press('Tab');
      if (await target.evaluate((el) => el === document.activeElement)) {
        await this.page.keyboard.press('Enter');
        return;
      }
    }
    throw new Error('target not reachable with Tab');
  }

  /**
   * Rests a palm-sized contact on the left edge, then taps `target` with another finger,
   * through Chromium's touch input. The palm lifts only after the tap.
   */
  async tapWithPalmResting(target: Locator): Promise<void> {
    const box = await target.boundingBox();
    if (!box) throw new Error('target not shown');
    const viewport = this.page.viewportSize() ?? { width: 400, height: 800 };
    const palm = { x: 6, y: viewport.height - 60, radiusX: 45, radiusY: 45, id: 1 };
    const finger = {
      x: box.x + box.width / 2,
      y: box.y + box.height / 2,
      radiusX: 4,
      radiusY: 4,
      id: 2,
    };
    await this.dispatchTouches([
      ['touchStart', [palm]],
      ['touchStart', [palm, finger]],
      ['touchEnd', [palm]],
      ['touchEnd', []],
    ]);
  }

  /** Holds one finger on `target` for `ms` on the page's clock, then lifts it. */
  async longPress(target: Locator, ms: number): Promise<void> {
    const box = await target.boundingBox();
    if (!box) throw new Error('target not shown');
    const point = { x: box.x + box.width / 2, y: box.y + box.height / 2, id: 1 };
    const cdp = await this.page.context().newCDPSession(this.page);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await this.page.clock.runFor(ms);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await cdp.detach();
  }

  /** Touches an activity picture, and Read straight after it in the same moment. */
  async touchActivityThenReadAtOnce(name: string): Promise<void> {
    const read = this.group('Read');
    const activity = this.activity(name);
    const [a, r] = [await activity.boundingBox(), await read.boundingBox()];
    if (!a || !r) throw new Error('target not shown');
    const at = (b: Box, id: number) => ({ x: b.x + b.width / 2, y: b.y + b.height / 2, id });
    await this.dispatchTouches([
      ['touchStart', [at(a, 1)]],
      ['touchEnd', []],
      ['touchStart', [at(r, 2)]],
      ['touchEnd', []],
    ]);
  }

  /** The bounding boxes of every target on screen. */
  async targetBoxes(): Promise<Box[]> {
    const boxes: Box[] = [];
    for (const t of await this.page
      .locator('.switch__option, .game-card, .home__lesson, .check-card')
      .all()) {
      const b = await t.boundingBox();
      if (b) boxes.push(b);
    }
    return boxes;
  }

  /** Whether the page can scroll in either direction. */
  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }

  /** The font family the wordmark renders with, once fonts have loaded. */
  async wordmarkFontLoaded(): Promise<boolean> {
    return this.page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('700 40px Fredoka');
    });
  }

  private async dispatchTouches(steps: [string, object[]][]): Promise<void> {
    const cdp = await this.page.context().newCDPSession(this.page);
    for (const [type, touchPoints] of steps) {
      await cdp.send('Input.dispatchTouchEvent', { type, touchPoints } as never);
    }
    await cdp.detach();
  }
}
