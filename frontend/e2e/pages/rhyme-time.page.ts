import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Rhyme time (docs/mocks/pages/rhyme-time). Owns every selector for it. */
export class RhymeTimePage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly target: Locator;
  readonly targetPicture: Locator;
  readonly targetEnd: Locator;
  readonly cards: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.target = page.locator('.rhyme-target__word');
    this.targetPicture = page.locator('.rhyme-target__picture .picture');
    this.targetEnd = page.locator('.rhyme-target__end');
    this.cards = page.locator('.word-cards .word-card');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  /** The card of `word`. */
  card(word: string): Locator {
    return this.cards.filter({ has: this.page.getByText(word, { exact: true }) });
  }

  /** The tick on the card of `word`, shown while it is chosen. */
  tick(word: string): Locator {
    return this.card(word).locator('.word-card__tick');
  }

  /** Opens Rhyme time the way a child does: Read, then the activity on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    // Read has more than 6 activities: Rhyme time is on the second screen (L2-024 #7).
    await home.touch(home.more);
    await home.touch(home.activity('Rhyme time'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The word the round asks about, read from its picture's text alternative. */
  async word(): Promise<string> {
    return (await this.targetPicture.getAttribute('alt')) ?? '';
  }

  async cardWords(): Promise<string[]> {
    return (await this.cards.allTextContents()).map((t) => t.trim());
  }

  /** Touches the card of each word in turn. */
  async choose(words: readonly string[]): Promise<void> {
    for (const w of words) await this.touch(this.card(w));
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }

  /** Whether any card reaches under the answer bar, where it could not be touched. */
  async hiddenUnderAnswerBar(): Promise<boolean> {
    const bar = (await this.page.locator('.answer-bar').boundingBox())!;
    for (const card of await this.cards.all()) {
      const box = (await card.boundingBox())!;
      if (box.y + box.height > bar.y + 0.5) return true;
    }
    return false;
  }

  /** Whether the word asked reaches up under Pibbo's instruction, which would cover it. */
  async wordUnderInstruction(): Promise<boolean> {
    const ask = (await this.page.locator('.shell__ask').boundingBox())!;
    const word = (await this.page.locator('.rhyme-target').boundingBox())!;
    return word.y < ask.y + ask.height - 0.5;
  }
}
