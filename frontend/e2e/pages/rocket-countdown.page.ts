import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Rocket countdown (docs/mocks/pages/rocket-countdown). Owns every selector for it. */
export class RocketCountdownPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly progress: Locator;
  readonly track: Locator;
  readonly said: Locator;
  readonly now: Locator;
  readonly choices: Locator;
  readonly rocket: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--count');
    this.instruction = page.locator('.bubble__text');
    this.progress = page.locator('.progress');
    this.track = page.locator('.track-row');
    this.said = page.locator('.track-row__cell--said');
    this.now = page.locator('.track-row__cell--now');
    this.choices = page.locator('.countdown .choices .numeral');
    this.rocket = page.locator('.launch__rocket');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  choice(n: number): Locator {
    return this.choices.filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  /** Opens Rocket countdown the way a child does: Count, then Rocket countdown on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Rocket countdown'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Chooses a number and waits until the track shows it as the current one (or blast off). */
  async step(n: number): Promise<void> {
    await this.touch(this.choice(n));
    if (n > 0) await expect(this.now).toHaveText(String(n));
    else await expect(this.now).toHaveCount(0);
  }

  /** The rocket's computed `translate`: `none` while it is on the pad. */
  async rocketTranslate(): Promise<string> {
    return this.rocket.evaluate((el) => getComputedStyle(el).translate);
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
