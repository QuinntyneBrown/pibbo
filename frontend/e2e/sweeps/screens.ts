import { expect, type Page } from '@playwright/test';
import { CheckGamePage } from '../pages/check-game.page';
import { everyActivity, openFromHome } from '../pages/every-activity';
import { GrownUpPage } from '../pages/grown-up.page';
import { HomePage } from '../pages/home.page';

/** A screen in one of its states, reached the way a child or grown-up reaches it. */
export interface Screen {
  readonly name: string;
  open(page: Page): Promise<void>;
}

/** Every screen the sweeps visit: Home, each activity's first round, the check game, the area. */
export async function everyScreen(page: Page): Promise<Screen[]> {
  const activities = await everyActivity(page);
  const home = new HomePage(page);
  return [
    { name: 'home', open: () => home.open() },
    { name: 'home-count', open: () => home.open('/?group=count') },
    { name: 'home-read', open: () => home.open('/?group=read') },
    ...activities.map((a) => ({
      name: a.name.toLowerCase().replace(/[^a-z]+/g, '-'),
      open: async (p: Page) => {
        await openFromHome(p, a);
        await p.locator('.shell').waitFor();
      },
    })),
    { name: 'check-question', open: (p: Page) => new CheckGamePage(p).openFromHome() },
    {
      name: 'check-results',
      open: async (p: Page) => {
        const check = new CheckGamePage(p);
        await check.openFromHome();
        for (let i = 0; i < 5; i++) await check.answerRightAndGoOn();
        await expect(check.results).toBeVisible();
      },
    },
    { name: 'grown-up-gate', open: (p: Page) => new GrownUpPage(p).openGate() },
    { name: 'grown-up-area', open: (p: Page) => new GrownUpPage(p).openArea() },
    {
      name: 'grown-up-confirm',
      open: async (p: Page) => {
        const grownUp = new GrownUpPage(p);
        await grownUp.openArea();
        await grownUp.touch(grownUp.clear);
        await expect(grownUp.confirm).toBeVisible();
      },
    },
  ];
}
