import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Sound it out (docs/mocks/pages/sound-it-out). Owns every selector for it. */
export class SoundItOutPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly instructionPicture: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly letters: Locator;
  readonly heard: Locator;
  readonly next: Locator;
  readonly sounding: Locator;
  readonly shownSounds: Locator;
  readonly blend: Locator;
  readonly blendFill: Locator;
  readonly pictures: Locator;
  readonly rightPicture: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--read');
    this.instruction = page.locator('.bubble__text');
    this.instructionPicture = page.locator('.bubble__picture');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.progress = page.locator('.progress');
    this.letters = page.locator('.tile');
    this.heard = page.locator('.tile--heard');
    this.next = page.locator('.tile--next');
    this.sounding = page.locator('.tile--sounding');
    this.shownSounds = page.locator('.tiles__say:not(.tiles__say--hidden)');
    this.blend = page.locator('.blend .chunky');
    this.blendFill = page.locator('.blend__fill');
    this.pictures = page.locator('.pick__option');
    this.rightPicture = page.locator('.pick__option--right');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  letter(index: number): Locator {
    return this.letters.nth(index);
  }

  picture(word: string): Locator {
    return this.pictures.filter({ has: this.page.locator(`img[src$="/${word}.jpg"]`) });
  }

  /** Opens Sound it out the way a child does: Read, then Sound it out on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Read'));
    await home.touch(home.activity('Sound it out'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The word this round shows, read from its letters. */
  async word(): Promise<string> {
    return (await this.letters.allTextContents()).map((t) => t.trim()).join('');
  }

  /** The letters on each tile, in order: a letter group is one tile ("sh"). */
  async tileLetters(): Promise<string[]> {
    return (await this.letters.allTextContents()).map((t) => t.trim());
  }

  /** Where each tile is drawn, in order. */
  async tileBoxes(): Promise<{ x: number; y: number; width: number; height: number }[]> {
    return this.letters.evaluateAll((tiles) =>
      tiles.map((t) => {
        const r = t.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
  }

  /** Touches every tile in order. */
  async soundAll(): Promise<string> {
    const word = await this.word();
    const tiles = await this.letters.count();
    for (let i = 0; i < tiles; i++) await this.touch(this.letter(i));
    return word;
  }

  /** Sounds every letter, blends, and waits for the pictures. */
  async soundAndBlend(): Promise<string> {
    const word = await this.soundAll();
    await this.touch(this.blend);
    await expect(this.pictures).toHaveCount(3);
    return word;
  }

  /** Chooses a picture and touches Check. */
  async answer(word: string): Promise<void> {
    await this.touch(this.picture(word));
    await this.touch(this.action);
  }

  /** The words of the pictures offered, in order. */
  async pictureWords(): Promise<string[]> {
    const srcs = await this.pictures
      .locator('img')
      .evaluateAll((imgs) => imgs.map((i) => (i as HTMLImageElement).getAttribute('src') ?? ''));
    return srcs.map((s) => s.replace(/^.*\//, '').replace(/\.jpg$/, ''));
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
