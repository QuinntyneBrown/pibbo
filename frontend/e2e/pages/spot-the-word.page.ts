import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Spot the word (docs/mocks/pages/spot-the-word). Owns every selector for it. */
export class SpotTheWordPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly target: Locator;
  readonly found: Locator;
  readonly dots: Locator;
  readonly words: Locator;
  readonly status: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.target = page.locator('.spot__find .target-word');
    this.found = page.locator('.spot__find .found');
    this.dots = page.locator('.found .found__dot');
    this.words = page.locator('.story .story__word');
    this.status = page.locator('.story__status');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  /** Opens Spot the word the way a child does: Read, then the activity on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Spot the word'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The common word asked, as shown large. */
  async word(): Promise<string> {
    return ((await this.target.textContent()) ?? '').trim();
  }

  /** The story's words as shown. */
  async storyTexts(): Promise<string[]> {
    return (await this.words.allTextContents()).map((t) => t.trim());
  }

  /** The indexes of the story's words that are `word`, whatever their case or punctuation. */
  async indexesOf(word: string): Promise<number[]> {
    const plain = (t: string) => t.toLowerCase().replace(/[.,!?]/g, '');
    return (await this.storyTexts()).flatMap((t, i) => (plain(t) === word ? [i] : []));
  }

  /** The index of a story word that is not `word`. */
  async otherThan(word: string): Promise<number> {
    const own = await this.indexesOf(word);
    return (await this.storyTexts()).findIndex((_, i) => !own.includes(i));
  }

  /** How many dots are filled. */
  async filled(): Promise<number> {
    return this.page.locator('.found .found__dot--on').count();
  }

  /** Touches every story word that is the round's word. */
  async findAll(): Promise<void> {
    const w = await this.word();
    for (const i of await this.indexesOf(w)) await this.touch(this.words.nth(i));
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
