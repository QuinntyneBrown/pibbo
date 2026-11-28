import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Count and write (docs/mocks/pages/count-and-write). Owns every selector for it. */
export class CountAndWritePage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly instructionPicture: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly pibbo: Locator;
  readonly frameGroup: Locator;
  readonly frames: Locator;
  readonly things: Locator;
  readonly counted: Locator;
  readonly pad: Locator;
  readonly slots: Locator;
  readonly filledSlots: Locator;
  readonly answerSlots: Locator;
  readonly written: Locator;
  readonly clear: Locator;
  readonly keys: Locator;
  readonly litKey: Locator;
  readonly answerBar: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--count');
    this.instruction = page.locator('.bubble__text');
    this.instructionPicture = page.locator('.bubble__picture');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.progress = page.locator('.progress');
    this.pibbo = page.locator('.shell__ask .pibbo');
    this.frameGroup = page.locator('.tenframes');
    this.frames = page.locator('.tenframe');
    this.things = page.locator('.tenframe__thing');
    this.counted = page.locator('.tenframe__thing--counted');
    this.pad = page.locator('.digit-pad');
    this.slots = page.locator('.digit-pad__slot');
    this.filledSlots = page.locator('.digit-pad__slot--filled');
    this.answerSlots = page.locator('.digit-pad__slot--answer');
    this.written = page.locator('.digit-pad__slots');
    this.clear = page.locator('.digit-pad__clear');
    this.keys = page.locator('.digit-pad__key');
    this.litKey = page.locator('.digit-pad__key--lit');
    this.answerBar = page.locator('.answer-bar');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  thing(index: number): Locator {
    return this.things.nth(index);
  }

  thingsIn(frame: number): Locator {
    return this.frames.nth(frame).locator('.tenframe__thing');
  }

  cellsIn(frame: number): Locator {
    return this.frames.nth(frame).locator('.tenframe__cell');
  }

  badge(index: number): Locator {
    return this.things.nth(index).locator('.tenframe__badge');
  }

  key(digit: number): Locator {
    return this.keys.filter({ hasText: new RegExp(`^\\s*${digit}\\s*$`) });
  }

  /** Opens Count and write the way a child does: Count, then Count and write on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Count and write'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Touches every thing once, in order, and waits for the digit pad. */
  async countAll(): Promise<number> {
    const n = await this.things.count();
    for (let i = 0; i < n; i++) await this.touch(this.thing(i));
    await expect(this.pad).toBeVisible();
    return n;
  }

  /** Touches each digit of `digits` in turn. */
  async write(digits: string): Promise<void> {
    for (const d of digits) await this.touch(this.key(Number(d)));
  }

  /** Writes `digits` and touches Check. */
  async answer(digits: string): Promise<void> {
    await this.write(digits);
    await this.touch(this.action);
  }

  async boxes(target: Locator): Promise<{ x: number; y: number; width: number; height: number }[]> {
    const boxes = [];
    for (const t of await target.all()) {
      const b = await t.boundingBox();
      if (b) boxes.push(b);
    }
    return boxes;
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }

  /** Whether the whole of `target` lies inside the viewport. */
  async inView(target: Locator): Promise<boolean> {
    const b = await target.boundingBox();
    const v = this.page.viewportSize();
    if (!b || !v) return false;
    return b.x >= 0 && b.y >= 0 && b.x + b.width <= v.width && b.y + b.height <= v.height;
  }
}
