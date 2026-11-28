import { expect, type Page } from '@playwright/test';

/**
 * The device's side of offline play (ADR 0032): Pibbo's service worker and its cache. Specs
 * that use it allow service workers (`test.use({ serviceWorkers: 'allow' })`).
 */
export class OfflineDevice {
  constructor(private readonly page: Page) {}

  /** Waits until Pibbo's service worker has kept the shell and answers this page. */
  async ready(): Promise<void> {
    await expect
      .poll(() => this.page.evaluate(() => navigator.serviceWorker?.controller != null), {
        timeout: 10_000,
      })
      .toBe(true);
  }

  /** The paths, of those given, that are not in Pibbo's cache. */
  async notCached(paths: readonly string[]): Promise<string[]> {
    return this.page.evaluate(async (all) => {
      const missing: string[] = [];
      for (const path of all) if (!(await caches.match(path))) missing.push(path);
      return missing;
    }, paths);
  }

  /** Waits until every path given is in Pibbo's cache. */
  async waitUntilCached(paths: readonly string[]): Promise<void> {
    await expect.poll(() => this.notCached(paths), { timeout: 10_000 }).toEqual([]);
  }

  /**
   * Waits until every file of the recordings and pictures folders the given paths are in has
   * been kept: the worker fetches the rest of a folder in the background with its first file.
   */
  async waitUntilFoldersKept(paths: readonly string[]): Promise<void> {
    const folders = [
      ...new Set(paths.map((p) => p.match(/^\/(recordings|pictures)\/[^/]+\//)?.[0] ?? null)),
    ].filter((f): f is string => f !== null);
    const files = await this.page.evaluate(async () => {
      const worker = await (await fetch('/sw.js')).text();
      return JSON.parse(worker.match(/const FILES = (\[.*?\]);/)?.[1] ?? '[]') as string[];
    });
    await this.waitUntilCached(files.filter((f) => folders.some((folder) => f.startsWith(folder))));
  }

  /** The host publishes a new version, and the browser checks for it, as it does on its own. */
  async publishNewVersion(): Promise<void> {
    const response = await this.page.request.post('/__e2e/next-version');
    expect(response.status()).toBe(204);
    await this.page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      await registration?.update();
    });
  }

  /** Whether a new version has installed and is waiting to take over. */
  async newVersionWaiting(): Promise<boolean> {
    return this.page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return registration?.waiting != null;
    });
  }

  /** The address of the service worker answering this page. */
  async answeringWorker(): Promise<string | null> {
    return this.page.evaluate(() => navigator.serviceWorker.controller?.scriptURL ?? null);
  }

  /** Reloads, once fonts and pending loads have settled (lessons learned, J22 #3). */
  async reload(): Promise<void> {
    await this.page.evaluate(() => document.fonts.ready.then(() => undefined));
    await this.page.reload();
  }
}
