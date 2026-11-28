import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** Skip-count (docs/mocks/pages/skip-count). Owns every selector for it. */
export class SkipCountPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly progress: Locator;
  readonly line: Locator;
  readonly said: Locator;
  readonly labels: Locator;
  readonly steps: Locator;
  readonly chosenStep: Locator;
  readonly choices: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--count');
    this.instruction = page.locator('.bubble__text');
    this.progress = page.locator('.progress');
    this.line = page.locator('svg.number-line');
    this.said = page.locator('.number-line__dot--said');
    this.labels = page.locator('.number-line__label');
    this.steps = page.locator('.switch--step .switch__option');
    this.chosenStep = page.locator('.switch--step .switch__option[aria-checked="true"]');
    this.choices = page.locator('.stage .choices .numeral');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  choice(n: number): Locator {
    return this.choices.filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  step(by: number): Locator {
    return this.steps.filter({ hasText: `By ${by}s` });
  }

  /** Opens Skip-count the way a child does: Count, then Skip-count on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Skip-count'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** Chooses where the hop lands and waits until the line shows it. */
  async hop(n: number): Promise<void> {
    await this.touch(this.choice(n));
    await expect(this.labels.filter({ hasText: new RegExp(`^${n}$`) })).toHaveCount(1);
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
