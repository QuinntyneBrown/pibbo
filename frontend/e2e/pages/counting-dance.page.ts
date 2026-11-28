import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Counting dance (docs/mocks/pages/counting-dance). Owns every selector for it. */
export class CountingDancePage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly figure: Locator;
  readonly number: Locator;
  readonly beats: Locator;
  readonly said: Locator;
  readonly now: Locator;
  readonly play: Locator;
  readonly speeds: Locator;
  readonly chosenSpeed: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--count');
    this.instruction = page.locator('.bubble__text');
    this.figure = page.locator('.dance .pibbo');
    this.number = page.locator('.dance__number');
    this.beats = page.locator('.chant__beat');
    this.said = page.locator('.chant__beat--said');
    this.now = page.locator('.chant__beat--now');
    this.play = page.locator('.controls .chunky');
    this.speeds = page.locator('.switch--speed .switch__option');
    this.chosenSpeed = page.locator('.switch--speed .switch__option[aria-checked="true"]');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  speed(name: 'Slow' | 'Fast'): Locator {
    return this.speeds.filter({ hasText: name });
  }

  /** Opens Counting dance the way a child does: Count, More, then Counting dance on Home. */
  /** The colours of the speed switch: its tray and each option, in order. */
  async switchSurfaces(): Promise<{ tray: string; options: string[] }> {
    const background = (el: Element) => getComputedStyle(el).backgroundColor;
    return {
      tray: await this.page.locator('.switch--speed').evaluate(background),
      options: await this.speeds.evaluateAll((all) =>
        all.map((el) => getComputedStyle(el).backgroundColor),
      ),
    };
  }

  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.more);
    await home.touch(home.activity('Counting dance'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Lets the page's clock run, as the music would. */
  async wait(ms: number): Promise<void> {
    await this.page.clock.runFor(ms);
  }

  /** Hides or shows the tab, as a child switching away or locking the screen would. */
  async setHidden(hidden: boolean): Promise<void> {
    await this.page.evaluate((h) => {
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (h ? 'hidden' : 'visible'),
      });
      document.dispatchEvent(new Event('visibilitychange'));
    }, hidden);
  }

  /** Whether the figure is drawn mid-move (sway). */
  async sways(): Promise<boolean> {
    return this.figure.evaluate((el) => getComputedStyle(el.parentElement!).rotate !== 'none');
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
