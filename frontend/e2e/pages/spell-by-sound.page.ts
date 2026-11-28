import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Spell by sound (docs/mocks/pages/spell-by-sound). Owns every selector for it. */
export class SpellBySoundPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly picture: Locator;
  readonly boxes: Locator;
  readonly speakers: Locator;
  readonly bank: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.picture = page.locator('.spell-round .picture');
    this.boxes = page.locator('.boxes .box');
    this.speakers = page.locator('.boxes .speaker');
    this.bank = page.locator('.bank .bank__letter');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  /** The bank letter `letter`. */
  letter(letter: string): Locator {
    return this.bank.filter({ hasText: new RegExp(`^\s*${letter}\s*$`) });
  }

  /** Opens Spell by sound the way a child does: Read, then the activity on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Spell by sound'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The word asked, read from its picture's text alternative. */
  async word(): Promise<string> {
    return (await this.picture.getAttribute('alt')) ?? '';
  }

  async bankTexts(): Promise<string[]> {
    return (await this.bank.allTextContents()).map((t) => t.trim());
  }

  async boxTexts(): Promise<string[]> {
    return (await this.boxes.allTextContents()).map((t) => t.trim());
  }

  /** Touches each letter of `letters` in turn. */
  async spell(letters: string[]): Promise<void> {
    for (const l of letters) await this.touch(this.letter(l));
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
