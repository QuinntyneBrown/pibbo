import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Letter sounds (docs/mocks/pages/letter-sounds). Owns every selector for it. */
export class LetterSoundsPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly letters: Locator;
  readonly sounds: Locator;
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
    this.letters = page.locator('.pairs__column').nth(0).locator('.pair');
    this.sounds = page.locator('.pairs__column').nth(1).locator('.pair');
    this.matched = page.locator('.pair[class*="pair--found-"]');
    this.missed = page.locator('.pair--miss');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
    this.pibbo = page.locator('.shell__ask .pibbo');
  }

  letter(letter: string): Locator {
    return this.letters.filter({ has: this.page.locator('.pair__letter', { hasText: letter }) });
  }

  /** The sound card that shows `shown` ("/m/"). */
  sound(shown: string): Locator {
    return this.sounds.filter({ has: this.page.locator('.pair__sound-left', { hasText: shown }) });
  }

  /** Opens Letter sounds the way a child does: Read, then Letter sounds on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Letter sounds'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The letters, in the order shown. */
  async letterTexts(): Promise<string[]> {
    return (await this.letters.locator('.pair__letter').allTextContents()).map((t) => t.trim());
  }

  /** The sounds as shown ("/m/"), in the order shown. */
  async soundTexts(): Promise<string[]> {
    return (await this.sounds.locator('.pair__sound-left').allTextContents()).map((t) => t.trim());
  }

  /** Touches a letter, then its sound. */
  async match(letter: string, shown: string): Promise<void> {
    await this.touch(this.letter(letter));
    await this.touch(this.sound(shown));
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
