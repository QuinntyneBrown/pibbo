import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** What do I know? (docs/mocks/pages/progress-check). Owns every selector for it. */
export class CheckGamePage {
  readonly question: Locator;
  readonly instruction: Locator;
  readonly replay: Locator;
  readonly leave: Locator;
  readonly progress: Locator;
  readonly shown: Locator;
  readonly things: Locator;
  readonly choices: Locator;
  readonly modelled: Locator;
  readonly message: Locator;
  readonly action: Locator;
  readonly results: Locator;
  readonly resultsTitle: Locator;
  readonly earned: Locator;
  readonly earnedTitles: Locator;
  readonly subjects: Locator;
  readonly home: Locator;

  constructor(private readonly page: Page) {
    this.question = page.locator('.stage--question');
    this.instruction = page.locator('.bubble__text');
    this.replay = page.locator('.hear');
    this.leave = page.locator('.shell__top .chunky--icon');
    this.progress = page.locator('.shell__top .progress');
    this.shown = page.locator('.stage--question .show');
    this.things = page.locator('.stage--question .show .picture');
    this.choices = page.locator('.stage--question .pick__option');
    this.modelled = page.locator('.stage--question .pick__option--right');
    this.message = page.locator('.answer-bar__message');
    this.action = page.locator('.answer-bar .chunky');
    this.results = page.locator('.results');
    this.resultsTitle = page.locator('.results__title');
    this.earned = page.locator('.results .skills__row');
    this.earnedTitles = page.locator('.results .skills__title');
    this.subjects = page.locator('.results .results__subject');
    this.home = page.locator('.results__actions .chunky');
  }

  /** Opens the check game the way a child does: its picture on Home. */
  async openFromHome(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await home.touch(home.checkCard);
    await expect(this.question).toBeVisible();
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  choice(text: string): Locator {
    return this.choices.filter({ hasText: new RegExp(`^\\s*${text}\\s*$`) });
  }

  /** The choices as shown. */
  async choiceTexts(): Promise<string[]> {
    return (await this.choices.allTextContents()).map((t) => t.trim());
  }

  /** The right answer of the question shown: the word pictured, or how many things. */
  async answer(): Promise<string> {
    const label = (await this.shown.getAttribute('aria-label')) ?? '';
    if (await this.isWordQuestion()) return label.trim();
    return String(await this.things.count());
  }

  /** The thing (count) or the word (word) the question shows. */
  async shownName(): Promise<string> {
    const label = (await this.shown.getAttribute('aria-label')) ?? '';
    return label.replace(/^\d+\s+/, '').trim();
  }

  async isWordQuestion(): Promise<boolean> {
    return (await this.instruction.textContent())?.includes('word') ?? false;
  }

  /** A choice that is not the right answer. */
  async wrongChoice(): Promise<string> {
    const answer = await this.answer();
    return (await this.choiceTexts()).find((t) => t !== answer)!;
  }

  /** Chooses `text` and checks it. */
  async answerWith(text: string): Promise<void> {
    await this.touch(this.choice(text));
    await this.touch(this.action);
  }

  /** Answers the question shown rightly, then touches Next. */
  async answerRightAndGoOn(): Promise<void> {
    await this.answerWith(await this.answer());
    await expect(this.action).toHaveText(/Next/);
    await this.touch(this.action);
  }

  /** Answers the question shown wrongly three times, so Pibbo models it, then touches Next. */
  async answerWrongUntilModelledAndGoOn(): Promise<void> {
    const wrong = await this.wrongChoice();
    for (let i = 0; i < 3; i++) await this.answerWith(wrong);
    await expect(this.modelled).toHaveCount(1);
    await this.touch(this.action);
  }

  /** How many questions the game has, from its progress bar. */
  async rounds(): Promise<number> {
    return Number(await this.progress.getAttribute('aria-valuemax'));
  }

  /** The stored values Pibbo keeps on this device, by key. */
  async stored(): Promise<Record<string, string>> {
    return this.page.evaluate(() =>
      Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k) ?? ''])),
    );
  }
}
