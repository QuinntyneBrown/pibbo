import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Words and pictures (docs/mocks/pages/words-and-pictures). Owns every selector for it. */
export class WordsAndPicturesPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly board: Locator;
  readonly words: Locator;
  readonly pictures: Locator;
  readonly matched: Locator;
  readonly missed: Locator;
  readonly status: Locator;
  readonly message: Locator;
  readonly action: Locator;
  readonly pibbo: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.progress = page.locator('.progress');
    this.board = page.locator('.pairs--pictures');
    this.words = this.board.locator('.pairs__column').nth(0).locator('.pair');
    this.pictures = this.board.locator('.pairs__column').nth(1).locator('.pair');
    this.matched = this.board.locator('.pair[class*="pair--found-"]');
    this.missed = this.board.locator('.pair--miss');
    this.status = page.locator('.shell__game [role="status"]');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
    this.pibbo = page.locator('.shell__ask .pibbo');
  }

  /** The word `word` ("boat"). */
  word(word: string): Locator {
    return this.words.filter({
      has: this.page.locator('.pair__word').getByText(word, { exact: true }),
    });
  }

  /** The picture of `word`, matched or not. */
  picture(word: string): Locator {
    const name = `Picture of a ${word}`;
    return this.pictures.and(
      this.page.locator(`[aria-label="${name}"], [aria-label="${name}, matched"]`),
    );
  }

  /** Opens Words and pictures the way a child does: Read, then the activity on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Words and pictures'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The words, in the order shown. */
  async wordTexts(): Promise<string[]> {
    return (await this.words.locator('.pair__word').allTextContents()).map((t) => t.trim());
  }

  /** The pictures' words, in the order shown, read from their names. */
  async pictureWords(): Promise<string[]> {
    const labels = await this.pictures.evaluateAll((els) =>
      els.map((el) => el.getAttribute('aria-label') ?? ''),
    );
    return labels.map((l) => l.replace(/^Picture of an? /, '').replace(/, matched$/, ''));
  }

  /** Touches a word, then a picture. */
  async connect(word: string, picture: string): Promise<void> {
    await this.touch(this.word(word));
    await this.touch(this.picture(picture));
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
