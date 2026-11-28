import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Big and small letters (docs/mocks/pages/big-and-small-letters). Owns every selector for it. */
export class BigAndSmallLettersPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly heads: Locator;
  readonly big: Locator;
  readonly small: Locator;
  readonly matched: Locator;
  readonly missed: Locator;
  readonly message: Locator;
  readonly action: Locator;
  readonly pibbo: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.progress = page.locator('.progress');
    this.heads = page.locator('.pairs__heads p');
    this.big = page.locator('.pairs__column').nth(0).locator('.pair');
    this.small = page.locator('.pairs__column').nth(1).locator('.pair');
    this.matched = page.locator('.pair[class*="pair--found-"]');
    this.missed = page.locator('.pair--miss');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
    this.pibbo = page.locator('.shell__ask .pibbo');
  }

  /** The big letter `letter` ("B"). */
  bigLetter(letter: string): Locator {
    return this.big.filter({
      has: this.page.locator('.pair__letter', { hasText: new RegExp(`^${letter}$`) }),
    });
  }

  /** The small letter `letter` ("b"). */
  smallLetter(letter: string): Locator {
    return this.small.filter({
      has: this.page.locator('.pair__letter', { hasText: new RegExp(`^${letter}$`) }),
    });
  }

  /** Opens Big and small letters the way a child does: Read, then the activity on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Big and small letters'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  async bigTexts(): Promise<string[]> {
    return (await this.big.locator('.pair__letter').allTextContents()).map((t) => t.trim());
  }

  async smallTexts(): Promise<string[]> {
    return (await this.small.locator('.pair__letter').allTextContents()).map((t) => t.trim());
  }

  /** Touches a big letter, then a small one. */
  async match(big: string, small: string): Promise<void> {
    await this.touch(this.bigLetter(big));
    await this.touch(this.smallLetter(small));
  }

  /** The font a letter is drawn in. */
  async letterFont(target: Locator): Promise<string> {
    return target.locator('.pair__letter').evaluate((el) => getComputedStyle(el).fontFamily);
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
