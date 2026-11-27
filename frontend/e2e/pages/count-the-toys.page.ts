import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Count the toys (docs/mocks/pages/count-the-toys). Owns every selector for it. */
export class CountTheToysPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly instructionPicture: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly pibbo: Locator;
  readonly rug: Locator;
  readonly toys: Locator;
  readonly counted: Locator;
  readonly highlighted: Locator;
  readonly tally: Locator;
  readonly numerals: Locator;
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
    this.rug = page.locator('.rug');
    this.toys = page.locator('.rug__toy');
    this.counted = page.locator('.rug__toy--counted');
    this.highlighted = page.locator('.rug__toy--highlight');
    this.tally = page.locator('.tally__number');
    this.numerals = page.locator('.numeral');
    this.answerBar = page.locator('.answer-bar');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  toy(index: number): Locator {
    return this.toys.nth(index);
  }

  badge(index: number): Locator {
    return this.toys.nth(index).locator('.rug__badge');
  }

  numeral(n: number): Locator {
    return this.numerals.filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  /** Opens Count the toys the way a child does: Count, then Count the toys on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Count the toys'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** How many toys this round shows. */
  async howMany(): Promise<number> {
    return this.toys.count();
  }

  /** Touches every toy once, in order. */
  async countAll(): Promise<number> {
    const n = await this.howMany();
    for (let i = 0; i < n; i++) await this.touch(this.toy(i));
    return n;
  }

  /** Chooses a numeral and touches Check. */
  async answer(n: number): Promise<void> {
    await this.touch(this.numeral(n));
    await this.touch(this.action);
  }

  /** Two fingers land on two toys in the same moment, through Chromium's touch input. */
  async touchTwoAtOnce(a: Locator, b: Locator): Promise<void> {
    const [ba, bb] = [await a.boundingBox(), await b.boundingBox()];
    if (!ba || !bb) throw new Error('toy not shown');
    const at = (x: { x: number; y: number; width: number; height: number }, id: number) => ({
      x: x.x + x.width / 2,
      y: x.y + x.height / 2,
      radiusX: 4,
      radiusY: 4,
      id,
    });
    const cdp = await this.page.context().newCDPSession(this.page);
    const send = (type: string, touchPoints: object[]) =>
      cdp.send('Input.dispatchTouchEvent', { type, touchPoints } as never);
    await send('touchStart', [at(ba, 1), at(bb, 2)]);
    await send('touchEnd', []);
    await cdp.detach();
  }

  /** The bounding boxes of every toy. */
  async toyBoxes(): Promise<{ x: number; y: number; width: number; height: number }[]> {
    const boxes = [];
    for (const t of await this.toys.all()) {
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

  /** Hides the tab, as when the screen locks or the child switches app. */
  async hideTab(): Promise<void> {
    await this.page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', configurable: true });
      Object.defineProperty(document, 'hidden', { value: true, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));
    });
  }
}
