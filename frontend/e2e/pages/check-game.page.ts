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
  readonly mascot: Locator;
  readonly results: Locator;
  readonly resultsTitle: Locator;
  readonly earnedLists: Locator;
  readonly earned: Locator;
  readonly home: Locator;

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
    this.mascot = page.locator('.shell__ask .pibbo');
    this.results = page.locator('.results');
    this.resultsTitle = page.locator('.results__title');
    this.earnedLists = page.locator('.results__lists section');
    this.earned = page.locator('.skills__picture');
    this.home = page.locator('.results__actions .chunky');
  }

  /** The check game's picture on Home. */
  card(): Locator {
    return this.page.locator('.home .check-card');
  }

  /** The choice with this accessible name. */
  choice(name: string): Locator {
    return this.page.locator('.stage--question .pick').getByRole('button', { name, exact: true });
  }

  /**
   * Puts `value` in on-device storage, as an earlier visit would have, with Home shown. The
   * game reads it each time it opens, so a game already open is left, not reloaded: a reload
   * cancels fetches still on their way, which the network guard reports.
   */
  async openWithStored(key: string, value: string): Promise<void> {
    const home = new HomePage(this.page);
    if (this.page.url() === 'about:blank') await home.open();
    else if (await this.root.isVisible()) await this.touch(this.leave);
    await expect(this.card()).toBeVisible();
    await this.page.evaluate(([k, v]) => localStorage.setItem(`pibbo:${k}`, v), [
      key,
      value,
    ] as const);
  }

  /** Home, with `activities` practised on an earlier visit, then the check game. */
  async openPractised(activities: readonly string[]): Promise<void> {
    await this.openWithStored('practised', JSON.stringify({ version: 1, activities }));
    await this.touch(this.card());
    await expect(this.root).toBeVisible();
  }

  /** What on-device storage holds under Pibbo's `key`, parsed. */
  async stored(key: string): Promise<unknown> {
    return this.page.evaluate((k) => JSON.parse(localStorage.getItem(`pibbo:${k}`) ?? 'null'), key);
  }

  /** The names of everything kept on the device. */
  async storedKeys(): Promise<string[]> {
    return this.page.evaluate(() => Object.keys(localStorage).sort());
  }

  /** From the next load, every read and write of on-device storage throws. */
  async refuseStorage(): Promise<void> {
    await this.page.addInitScript(() => {
      const refuse = () => {
        throw new DOMException('off', 'SecurityError');
      };
      Storage.prototype.getItem = refuse;
      Storage.prototype.setItem = refuse;
    });
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

  /**
   * The names of the right choice and of a wrong one, worked out from what is shown, as a
   * child would. It knows the first lesson's four questions only.
   */
  async solve(): Promise<{ right: string; wrong: string }> {
    await expect(this.choices).toHaveCount(3);
    const asked = (await this.instruction.textContent())!.trim();
    const names = await this.choiceNames();
    let right: string;
    if (asked.startsWith('How many')) right = String(await this.shownPictures.count());
    else if (asked.startsWith('Which number is bigger'))
      right = String(Math.max(...names.map(Number)));
    else if (asked.startsWith('Which word goes with the picture'))
      right = (await this.show.getAttribute('aria-label'))!;
    else {
      const target = /“(\w+)”/.exec(asked)![1]!;
      right = names.find((name) => name.endsWith(target.slice(-2)))!;
    }
    expect(names, asked).toContain(right);
    return { right, wrong: names.find((name) => name !== right)! };
  }

  /** Chooses the choice with this name and touches Check. */
  async answer(name: string): Promise<void> {
    await this.touch(this.choice(name));
    await this.touch(this.action);
  }

  /**
   * Plays every question to the end. `earn` tries one choice after another, so each is
   * answered right by the third; `miss` is wrong three times, so Pibbo shows the answer.
   * `how` says which, from the question's instruction. Returns each instruction asked.
   */
  async play(how: (asked: string) => 'earn' | 'miss' = () => 'earn'): Promise<string[]> {
    const asked: string[] = [];
    const rounds = Number(await this.progress.getAttribute('aria-valuemax'));
    for (let round = 0; round < rounds; round++) {
      await expect(this.progress).toHaveAttribute('aria-valuenow', String(round));
      await expect(this.action).toHaveText('Check');
      const instruction = (await this.instruction.textContent())!.trim();
      asked.push(instruction);
      if (how(instruction) === 'miss') {
        const { wrong } = await this.solve();
        for (let miss = 0; miss < 3; miss++) {
          await this.answer(wrong);
          await expect(this.action).not.toHaveText('Check');
          if (miss < 2) await this.touch(this.action);
        }
        await expect(this.action).toHaveText('Next');
        await this.touch(this.action);
      } else {
        await this.answerRightAndGoOn();
      }
    }
    await expect(this.results).toBeVisible();
    return asked;
  }

  /**
   * Answers any question shown by trying one choice after another, so it is right by the
   * third, then touches Next.
   */
  async answerRightAndGoOn(): Promise<void> {
    await expect(this.action).toHaveText('Check');
    for (const name of await this.choiceNames()) {
      await this.answer(name);
      await expect(this.action).not.toHaveText('Check');
      if ((await this.action.textContent())!.includes('Next')) break;
      await this.touch(this.action);
    }
    await expect(this.action).toHaveText('Next');
    await this.touch(this.action);
  }

  /** The names on the earned pictures, in the order they are shown. */
  async earnedNames(): Promise<string[]> {
    return this.page.locator('.skills__title').allInnerTexts();
  }

  /** The subjects the earned pictures are grouped under, as shown. */
  async subjects(): Promise<string[]> {
    return this.page.locator('.results__subject').allInnerTexts();
  }

  /** Everything the results show, as text. */
  async resultsText(): Promise<string> {
    return (await this.results.innerText()).replace(/\s+/g, ' ');
  }

  async scrolls(): Promise<boolean> {
    return new HomePage(this.page).scrolls();
  }

  /** Whether what is shown stays between the instruction and the choices, never over either. */
  async shownFits(): Promise<boolean> {
    if ((await this.show.count()) === 0) return true;
    const ask = (await this.page.locator('.shell__ask').boundingBox())!;
    const pick = (await this.page.locator('.stage--question .pick').boundingBox())!;
    const parts = await this.page.locator('.show .picture, .show__text').all();
    for (const part of parts) {
      const box = (await part.boundingBox())!;
      const belowAsk = box.y >= ask.y + ask.height - 0.5;
      const above = box.y + box.height <= pick.y + 0.5;
      const beside = box.x + box.width <= pick.x + 0.5;
      if (!belowAsk || !(above || beside)) return false;
    }
    return true;
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
