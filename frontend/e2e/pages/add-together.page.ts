import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

export type Player = 'Star' | 'Moon';

/** Add together (docs/mocks/pages/add-together). Owns every selector for it. */
export class AddTogetherPage {
  readonly root: Locator;
  readonly instruction: Locator;
  readonly progress: Locator;
  readonly players: Locator;
  readonly turn: Locator;
  readonly sum: Locator;
  readonly answer: Locator;
  readonly choices: Locator;
  readonly message: Locator;
  readonly action: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.shell--count');
    this.instruction = page.locator('.bubble__text');
    this.progress = page.locator('.progress');
    this.players = page.locator('.players .player');
    this.turn = page.locator('.players .player[aria-current="step"]');
    this.sum = page.locator('.sum');
    this.answer = page.locator('.sum__answer');
    this.choices = page.locator('.sum-row .choices .numeral');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
  }

  player(who: Player): Locator {
    return this.page.locator(`.players .player--${who.toLowerCase()}`);
  }

  symbol(who: Player): Locator {
    return this.player(who).locator('.turn');
  }

  ducks(who: Player): Locator {
    return this.player(who).locator('.player__ducks .picture');
  }

  add(who: Player): Locator {
    return this.page.getByRole('button', { name: `${who} adds one` });
  }

  takeAway(who: Player): Locator {
    return this.page.getByRole('button', { name: `${who} takes one away` });
  }

  choice(n: number): Locator {
    return this.choices.filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  /** Opens Add together the way a child does: Count, then Add together on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Add together'));
    await expect(this.root).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  /** The player adds `n` ducks, one touch each, then touches Done. */
  async takeTurn(who: Player, n: number): Promise<void> {
    await expect(this.turn).toHaveClass(new RegExp(`player--${who.toLowerCase()}`));
    for (let i = 1; i <= n; i++) {
      await this.touch(this.add(who));
      await expect(this.ducks(who)).toHaveCount(i);
    }
    await this.touch(this.action);
  }

  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }
}
