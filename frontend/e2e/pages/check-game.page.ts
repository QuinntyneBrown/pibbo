import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** The check game (docs/mocks/pages/progress-check). Owns every selector for it. */
export class CheckGamePage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly show: Locator;
  readonly shownPictures: Locator;
  readonly choices: Locator;
  readonly rightChoice: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.progress = page.getByRole('progressbar');
    this.show = page.locator('.stage--question .show');
    this.shownPictures = page.locator('.stage--question .show .picture');
    this.choices = page.locator('.stage--question .pick__option');
    this.rightChoice = page.locator('.pick__option--right');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  /** The check game's picture on Home. */
  card(): Locator {
    return this.page.locator('.home .check-card');
  }

  /** The choice with this accessible name. */
  choice(name: string): Locator {
    return this.page.locator('.stage--question .pick').getByRole('button', { name, exact: true });
  }

  /** Opens the check game the way a child does: its picture on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(this.card());
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    await new HomePage(this.page).touch(target);
  }

  async choiceNames(): Promise<string[]> {
    const names: string[] = [];
    for (const c of await this.choices.all()) {
      names.push((await c.getAttribute('aria-label')) ?? '');
    }
    return names;
  }

  async scrolls(): Promise<boolean> {
    return new HomePage(this.page).scrolls();
  }

  /** Whether any choice reaches under the answer bar, where it could not be touched. */
  async hiddenUnderAnswerBar(): Promise<boolean> {
    const bar = (await this.page.locator('.answer-bar').boundingBox())!;
    for (const choice of await this.choices.all()) {
      const box = (await choice.boundingBox())!;
      if (box.y + box.height > bar.y + 0.5) return true;
    }
    return false;
  }
}
