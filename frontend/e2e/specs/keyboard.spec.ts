// Traces to: L2-036
import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { everyActivity, type Listed } from '../pages/every-activity';
import { CheckGamePage } from '../pages/check-game.page';
import { GrownUpPage } from '../pages/grown-up.page';
import { HomePage } from '../pages/home.page';

/** What the focused element is: where it sits, its name, and whether its focus shows. */
interface Focused {
  part: number;
  name: string;
  visible: boolean;
  tag: string;
}

/** The parts of a round in the order a child meets them. */
const PARTS = ['.shell__top', '.shell__ask', '.shell__game', '.shell__answer'];

async function focused(page: Page): Promise<Focused | null> {
  return page.evaluate((parts) => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return null;
    const style = getComputedStyle(el);
    const outline = style.outlineStyle !== 'none' && parseFloat(style.outlineWidth) >= 2;
    const name =
      el.getAttribute('aria-label') ??
      (el.getAttribute('aria-labelledby')
        ? document.getElementById(el.getAttribute('aria-labelledby')!)?.textContent
        : el.textContent) ??
      '';
    return {
      part: parts.findIndex((p) => el.closest(p)),
      name: name.trim(),
      visible: outline || style.boxShadow.includes('rgb'),
      tag: el.tagName.toLowerCase(),
    };
  }, PARTS);
}

/** Tabs until `target` has focus, then presses `key` on it. */
async function tabTo(page: Page, target: import('@playwright/test').Locator, key = 'Enter') {
  for (let i = 0; i < 40; i++) {
    await page.keyboard.press('Tab');
    if (await target.evaluate((el) => el === document.activeElement)) {
      await page.keyboard.press(key);
      return;
    }
  }
  throw new Error('not reachable with Tab');
}

async function openWithKeyboard(page: Page, activity: Listed): Promise<void> {
  const home = new HomePage(page);
  await home.open();
  await tabTo(page, home.group(activity.group));
  for (let i = 0; i < activity.screen; i++) await tabTo(page, home.more);
  await tabTo(page, home.activity(activity.name), 'Space');
  await expect(home.root).toHaveCount(0);
}

test.describe('Keyboard play', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard play is for a desktop');

  test('Given a desktop with a keyboard only, when every activity is opened from Home and its targets are tabbed through, then each is reached in the order a child meets it, shows its focus, has its spoken name, and Enter plays it', async ({
    page,
    spoken,
  }) => {
    test.slow();
    for (const activity of await everyActivity(page)) {
      await openWithKeyboard(page, activity);
      await page.locator('.shell').waitFor();
      const seen: Focused[] = [];
      for (let i = 0; i < 60; i++) {
        await page.keyboard.press('Tab');
        const f = await focused(page);
        if (!f || f.part < 0) break;
        seen.push(f);
      }
      const where = activity.name;
      expect(seen.length, where).toBeGreaterThanOrEqual(3);
      for (const f of seen) {
        expect(f.visible, `${where}: focus shows on ${f.name}`).toBe(true);
        expect(f.name.length, `${where}: a ${f.tag} has a name`).toBeGreaterThan(0);
      }
      const parts = seen.map((f) => f.part);
      expect(parts, `${where}: top, ask, game, answer`).toEqual([...parts].sort((a, b) => a - b));
      expect(parts, where).toContain(2);

      // Enter on the first target of the game plays it: something is spoken or shown (a miss
      // in Spot the word is shown with no sound, by design).
      const heard = (await spoken.recordings()).length;
      const game = page.locator('.shell__game');
      const before = await game.innerHTML();
      await page.locator('.shell__game button:not([disabled])').first().focus();
      await page.keyboard.press('Enter');
      await expect
        .poll(
          async () =>
            (await spoken.recordings()).length > heard || (await game.innerHTML()) !== before,
          { message: where },
        )
        .toBe(true);
    }
  });

  test('Given a desktop with a keyboard only, when the check game is opened and a question answered, then Space chooses, Enter checks and Next goes on', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const check = new CheckGamePage(page);
    await home.open();
    await tabTo(page, home.checkCard);
    await expect(check.question).toBeVisible();

    await tabTo(page, check.choice(await check.answer()), 'Space');
    await tabTo(page, check.action);

    await expect(check.message).toHaveText('Yes!');
    await page.keyboard.press('Enter');
    await expect(check.progress).toHaveAttribute('aria-valuenow', '1');
  });

  test('Given a desktop with a keyboard only, when the grown-up entry is reached, then the gate can be passed with the keyboard', async ({
    page,
  }) => {
    const home = new HomePage(page);
    const grownUp = new GrownUpPage(page);
    await home.open();
    await tabTo(page, grownUp.entry);
    await expect(grownUp.gate).toBeVisible();

    for (const n of await grownUp.asked()) await tabTo(page, grownUp.key(n));

    await expect(grownUp.area).toBeVisible();
  });
});
