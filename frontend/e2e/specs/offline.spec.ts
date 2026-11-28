// Traces to: L2-033
import { test, expect } from '../fixtures/test';
import { CountTheToysPage } from '../pages/count-the-toys.page';
import { HomePage } from '../pages/home.page';
import { OfflineDevice } from '../pages/offline-device';

test.use({ serviceWorkers: 'allow' });

const COUNT_AND_WRITE = '/recordings/home/count-and-write.wav';

/** Count, then Count the toys, from Home. */
async function openCountTheToys(home: HomePage, count: CountTheToysPage): Promise<void> {
  await home.touch(home.group('Count'));
  await home.touch(home.activity('Count the toys'));
  await expect(count.root).toBeVisible();
}

/** One round: every toy counted and the right numeral chosen. */
async function playRound(count: CountTheToysPage): Promise<void> {
  await expect(count.counted).toHaveCount(0);
  const n = await count.countAll();
  await expect(count.instruction).toHaveText('How many toys are there?');
  await count.answer(n);
  await expect(count.message).toHaveText(`Yes! ${n} toys.`);
}

test.describe('Offline after first use', () => {
  test('Given an activity opened once while online, when the network is lost, then it still plays fully, recordings included @critical', async ({
    page,
    spoken,
    network,
  }) => {
    const home = new HomePage(page);
    const count = new CountTheToysPage(page);
    const device = new OfflineDevice(page);
    await home.open();
    await device.ready();
    await openCountTheToys(home, count);
    await playRound(count);
    const online = await spoken.recordings();
    await device.waitUntilFoldersKept(online);
    await count.touch(count.leave);
    await expect(home.root).toBeVisible();

    await network.offline();
    await device.reload();
    await expect(home.root).toBeVisible();
    await openCountTheToys(home, count);
    for (let round = 0; round < 5; round++) {
      await playRound(count);
      await count.touch(count.action);
    }

    await expect(home.group('Count')).toHaveAttribute('aria-pressed', 'true');
    const offline = await spoken.recordings();
    expect(offline.slice(0, online.length)).toEqual(online);
    expect(offline.length).toBeGreaterThan(online.length);
    expect(await device.notCached(offline)).toEqual([]);
  });

  test('Given the app is offline, when the child touches an activity never opened, then its picture shows greyed with a no-network symbol and it does not open', async ({
    page,
    spoken,
    network,
  }) => {
    const home = new HomePage(page);
    const device = new OfflineDevice(page);
    await home.open();
    await device.ready();
    await home.touch(home.group('Count'));
    await expect(home.activity('Count and write')).toBeVisible();
    await expect(home.offlineSymbol('Count and write')).toHaveCount(0);
    await device.waitUntilFoldersKept(await spoken.recordings());

    // Only the activity's own code, never opened, may fail to load offline.
    await network.offline((path) => /^\/chunk-[^/]+\.js$/.test(path));
    await home.touch(home.activity('Count and write'));

    await expect(home.activity('Count and write')).toHaveAttribute('aria-disabled', 'true');
    await expect(home.offlineSymbol('Count and write')).toBeVisible();
    await expect(home.activity('Count and write')).toHaveAccessibleName(/needs the internet/);
    await expect(home.root).toBeVisible();
    await expect(page).toHaveURL(/\/\?group=count$/);
    expect(await spoken.recordings()).toContain(COUNT_AND_WRITE);

    await network.online();
    await expect(home.activity('Count and write')).not.toHaveAttribute('aria-disabled', 'true');
    await expect(home.offlineSymbol('Count and write')).toHaveCount(0);
  });

  test('Given a new content version, when the app is next online, then it installs in the background without interrupting a round', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);
    const count = new CountTheToysPage(page);
    const device = new OfflineDevice(page);
    await home.open();
    await device.ready();
    const worker = await device.answeringWorker();
    await home.touch(home.group('Count'));
    await home.touch(home.activity('Count the toys'));
    await expect(count.root).toBeVisible();
    await count.touch(count.toy(0));
    await expect(count.tally).toHaveText('1');
    const before = await spoken.recordings();

    await device.publishNewVersion();

    await expect.poll(() => device.newVersionWaiting(), { timeout: 10_000 }).toBe(true);
    await expect(count.root).toBeVisible();
    await expect(count.tally).toHaveText('1');
    await expect(count.counted).toHaveCount(1);
    expect(await spoken.recordings()).toEqual(before);
    expect(await device.answeringWorker()).toBe(worker);
    const n = await count.howMany();
    for (let i = 1; i < n; i++) await count.touch(count.toy(i));
    await count.answer(n);
    await expect(count.message).toHaveText(`Yes! ${n} toys.`);
  });
});
