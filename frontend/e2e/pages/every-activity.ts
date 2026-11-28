import { expect, type Page } from '@playwright/test';
import { HomePage, type GroupName } from './home.page';

/** An activity as Home lists it. */
export interface Listed {
  readonly group: GroupName;
  readonly name: string;
  /** How many times More is touched before it shows. */
  readonly screen: number;
}

/** Every activity Home lists, screen by screen, read from Home itself (L2-024). */
export async function everyActivity(page: Page): Promise<Listed[]> {
  const home = new HomePage(page);
  const listed: Listed[] = [];
  for (const group of ['Count', 'Read'] as const) {
    await home.open();
    await home.touch(home.group(group));
    await expect(home.activityGroupTitle).toHaveText(group);
    for (let screen = 0; screen < 5; screen++) {
      await expect(home.activities.first()).toBeVisible();
      const names = (await home.activities.locator('.game-card__title').allTextContents()).map(
        (n) => n.trim(),
      );
      if (names.some((name) => listed.some((l) => l.group === group && l.name === name))) break;
      for (const name of names) listed.push({ group, name, screen });
      if ((await home.more.count()) === 0) break;
      await home.touch(home.more);
      // Wait for the next screen before reading it.
      await expect(home.activities.first()).not.toHaveText(names[0]!);
    }
  }
  return listed;
}

/** Opens an activity from Home the way a child does. */
export async function openFromHome(page: Page, activity: Listed): Promise<void> {
  const home = new HomePage(page);
  await home.open();
  await home.touch(home.group(activity.group));
  for (let i = 0; i < activity.screen; i++) await home.touch(home.more);
  await home.touch(home.activity(activity.name));
  await expect(home.root).toHaveCount(0);
}

/** Touches the first few targets of the round shown, as a child might. */
export async function playALittle(page: Page, touches = 3): Promise<void> {
  const home = new HomePage(page);
  const targets = page.locator('main button:not([disabled])');
  for (let i = 0; i < touches; i++) {
    const count = await targets.count();
    if (count === 0) return;
    await home.touch(targets.nth(i % count));
    await page.clock.runFor(2000);
  }
}
