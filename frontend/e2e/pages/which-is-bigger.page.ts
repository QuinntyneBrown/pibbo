import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Which is bigger (docs/mocks/pages/which-is-bigger). Owns every selector for it. */
export class WhichIsBiggerPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly progress: Locator;
  readonly cards: Locator;
  readonly extraDots: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--count');
    this.instruction = page.locator('.bubble__text');
    this.progress = page.locator('.progress');
    this.cards = page.locator('.compare__card');
    this.extraDots = page.locator('.ten-frame__dot--extra');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  card(index: number): Locator {
    return this.cards.nth(index);
  }

  numeral(index: number): Locator {
    return this.card(index).locator('.compare__number');
  }

  dots(index: number): Locator {
    return this.card(index).locator('.ten-frame__dot');
  }

  extraDotsIn(index: number): Locator {
    return this.card(index).locator('.ten-frame__dot--extra');
  }

  /** Opens Which is bigger the way a child does: Count, then Which is bigger? on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Which is bigger?'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Chooses a card and touches Check. */
  async answer(index: number): Promise<void> {
    await this.touch(this.card(index));
    await expect(this.card(index)).toHaveAttribute('aria-pressed', 'true');
    await this.touch(this.action);
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
