import { expect, type Locator, type Page } from '@playwright/test';
import { HomePage } from './home.page';

/** The grown-up entry, gate and area (docs/mocks/dialogs/grown-up-gate, pages/grown-up). */
export class GrownUpPage {
  readonly entry: Locator;
  readonly gate: Locator;
  readonly gateTask: Locator;
  readonly gateKeys: Locator;
  readonly gateDots: Locator;
  readonly gateClose: Locator;
  readonly area: Locator;
  readonly back: Locator;
  readonly volume: Locator;
  readonly clear: Locator;
  readonly status: Locator;
  readonly confirm: Locator;
  readonly keep: Locator;
  readonly confirmClear: Locator;

  constructor(private readonly page: Page) {
    this.entry = page.locator('.home__top .grown-up-entry');
    this.gate = page.locator('.dialog.gate');
    this.gateTask = page.locator('.gate__task');
    this.gateKeys = page.locator('.gate__keys .gate__key');
    this.gateDots = page.locator('.gate__dots .gate__dot--done');
    this.gateClose = page.locator('.gate .dialog__close');
    this.area = page.locator('.grown-up');
    this.back = page.locator('.grown-up__top .chunky');
    this.volume = page.locator('.switch--volume .switch__option');
    this.clear = page.locator('.grown-up__section .chunky--ink');
    this.status = page.locator('.grown-up__status');
    this.confirm = page.locator('.dialog.confirm');
    this.keep = page.locator('.confirm__actions .chunky--white');
    this.confirmClear = page.locator('.confirm__actions .chunky--ink');
  }

  /** Touches (phone) or clicks (desktop) a target. */
  async touch(target: Locator): Promise<void> {
    const hasTouch = await this.page.evaluate(() => matchMedia('(pointer: coarse)').matches);
    if (hasTouch) await target.tap();
    else await target.click();
  }

  key(n: number): Locator {
    return this.gateKeys.filter({ hasText: new RegExp(`^\\s*${n}\\s*$`) });
  }

  /** The numbers the gate asks for, read from its words. */
  async asked(): Promise<number[]> {
    const words = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
    const text = (await this.gateTask.textContent()) ?? '';
    return [...text.matchAll(/[a-z]+/g)].map((m) => words.indexOf(m[0]) + 1).filter((n) => n > 0);
  }

  async openGate(): Promise<void> {
    const home = new HomePage(this.page);
    await home.open();
    await this.touch(this.entry);
    await expect(this.gate).toBeVisible();
  }

  /** Passes the gate the way a reading grown-up does. */
  async openArea(): Promise<void> {
    await this.openGate();
    for (const n of await this.asked()) await this.touch(this.key(n));
    await expect(this.area).toBeVisible();
  }
}
