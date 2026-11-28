import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Build a sentence (docs/mocks/pages/build-a-sentence). Owns every selector for it. */
export class BuildASentencePage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly picture: Locator;
  readonly strip: Locator;
  readonly hint: Locator;
  readonly placed: Locator;
  readonly tiles: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.picture = page.locator('.frame-picture .picture');
    this.strip = page.locator('.strip');
    this.hint = page.locator('.strip__hint');
    this.placed = page.locator('.strip .strip__word');
    this.tiles = page.locator('.word-bank .word-tile');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  /** The tile showing `text`, exactly as written ("The", "sit."). */
  tile(text: string): Locator {
    return this.tiles.filter({ hasText: new RegExp(`^\\s*${text.replace('.', '\\.')}\\s*$`) });
  }

  /** Opens Build a sentence the way a child does: Read, More, then the activity on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    // Read has more than 6 activities: Build a sentence is on the second screen (L2-024 #7).
    await home.touch(home.more);
    await home.touch(home.activity('Build a sentence'));
    await expect(this.root).toBeVisible();
    await expect(this.tiles.first()).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The round's picture, by its text alternative: it names the sentence's cast. */
  async pictureAlt(): Promise<string> {
    return (await this.picture.getAttribute('alt')) ?? '';
  }

  async tileTexts(): Promise<string[]> {
    return (await this.tiles.allTextContents()).map((t) => t.trim());
  }

  async placedTexts(): Promise<string[]> {
    return (await this.placed.allTextContents()).map((t) => t.trim());
  }

  /** Touches the tile of each word in turn, waiting for each to land on the strip. */
  async build(words: readonly string[]): Promise<void> {
    for (const w of words) {
      const before = await this.placed.count();
      await this.touch(this.tile(w));
      await expect(this.placed).toHaveCount(before + 1);
    }
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }

  /** Whether any tile or word on the strip reaches under the answer bar, out of touch. */
  async hiddenUnderAnswerBar(): Promise<boolean> {
    const bar = (await this.page.locator('.answer-bar').boundingBox())!;
    for (const target of [...(await this.tiles.all()), ...(await this.placed.all())]) {
      const box = (await target.boundingBox())!;
      if (box.y + box.height > bar.y + 0.5) return true;
    }
    return false;
  }

  /** Whether the game reaches up under Pibbo's instruction, which would cover it. */
  async gameUnderInstruction(): Promise<boolean> {
    const ask = (await this.page.locator('.shell__ask').boundingBox())!;
    const strip = (await this.strip.boundingBox())!;
    return strip.y < ask.y + ask.height - 0.5;
  }
}
