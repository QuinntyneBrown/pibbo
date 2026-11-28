// Traces to: L2-029
import type { Request } from '@playwright/test';
import { test, expect } from '../fixtures/test';
import { CheckGamePage } from '../pages/check-game.page';
import { everyActivity, openFromHome, playALittle } from '../pages/every-activity';
import { GrownUpPage } from '../pages/grown-up.page';

/** Notes any ask for a permission a child's app never needs (L2-029 #2). */
function watchPermissions(): void {
  const asked = (what: string) => console.error(`a permission was asked for: ${what}`);
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition = () => asked('location');
    navigator.geolocation.watchPosition = () => {
      asked('location');
      return 0;
    };
  }
  if ('Notification' in window) {
    Notification.requestPermission = () => {
      asked('notifications');
      return Promise.resolve('denied');
    };
  }
  if (navigator.permissions) {
    navigator.permissions.query = (d: PermissionDescriptor) => {
      asked(String(d.name));
      return Promise.reject(new DOMException('never', 'NotAllowedError'));
    };
  }
}

/** Everything about the requests a screen made that would let something leave the device. */
function leaks(requests: Request[], origin: string): string[] {
  return requests.flatMap((r) => {
    const url = new URL(r.url());
    const problems: string[] = [];
    if (!['data:', 'blob:'].includes(url.protocol) && url.origin !== origin)
      problems.push(`off the Pibbo origin: ${r.url()}`);
    if (r.method() !== 'GET') problems.push(`${r.method()} ${url.pathname}`);
    if (r.postData()) problems.push(`a body sent to ${url.pathname}`);
    if (url.search) problems.push(`a query sent to ${url.pathname}${url.search}`);
    return problems;
  });
}

/** Scripts and links on the screen shown that lead to another origin (L2-029 #3). */
async function outsiders(page: import('@playwright/test').Page): Promise<string[]> {
  return page.evaluate(() => {
    const here = location.origin;
    const off = (u: string) => {
      const url = new URL(u, location.href);
      return url.protocol.startsWith('http') && url.origin !== here;
    };
    return [
      ...[...document.querySelectorAll<HTMLScriptElement>('script[src]')].map((s) => s.src),
      ...[...document.querySelectorAll<HTMLAnchorElement>('a[href]')].map((a) => a.href),
      ...[...document.querySelectorAll<HTMLIFrameElement>('iframe')].map((f) => f.src || 'iframe'),
      ...[...document.querySelectorAll<HTMLLinkElement>('link[href]')].map((l) => l.href),
    ].filter(off);
  });
}

test.describe('Nothing about a child leaves the device', () => {
  test('@critical Given every activity on Home, when each is opened and played a little, then only GET requests to the Pibbo origin are made, none carries anything, no permission is asked for and nothing leads to another origin', async ({
    page,
    baseURL,
  }) => {
    test.slow();
    await page.addInitScript(watchPermissions);
    const requests: Request[] = [];
    page.on('request', (r) => requests.push(r));
    const origin = new URL(baseURL!).origin;

    const activities = await everyActivity(page);
    expect(activities.length).toBeGreaterThanOrEqual(14);
    for (const activity of activities) {
      await openFromHome(page, activity);
      await playALittle(page);
      expect(await outsiders(page), activity.name).toEqual([]);
    }

    expect(leaks(requests, origin)).toEqual([]);
  });

  test('Given the check game and the grown-up area, when played and opened, then only GET requests to the Pibbo origin are made and nothing leads out', async ({
    page,
    baseURL,
  }) => {
    await page.addInitScript(watchPermissions);
    const requests: Request[] = [];
    page.on('request', (r) => requests.push(r));
    const check = new CheckGamePage(page);
    const grownUp = new GrownUpPage(page);

    await check.openFromHome();
    for (let i = 0; i < 5; i++) await check.answerRightAndGoOn();
    expect(await outsiders(page)).toEqual([]);
    await grownUp.openArea();
    await grownUp.touch(grownUp.volume.first());
    await grownUp.touch(grownUp.clear);
    await grownUp.touch(grownUp.confirmClear);
    await expect(grownUp.status).toHaveText('Progress cleared.');
    expect(await outsiders(page)).toEqual([]);

    expect(leaks(requests, new URL(baseURL!).origin)).toEqual([]);
  });
});
