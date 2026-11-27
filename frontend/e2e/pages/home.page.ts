import { expect, type Locator, type Page } from '@playwright/test';

/** The Home screen. Owns every selector for it; specs never hold one. */
export class HomePage {
  readonly root: Locator;
  readonly wordmark: Locator;
  readonly main: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.home');
    this.wordmark = page.locator('.home__top .wordmark');
    this.main = page.locator('main#main');
  }

  async open(): Promise<void> {
    await this.page.goto('/');
    await expect(this.root).toBeVisible();
  }

  /** Opens Home and returns the response headers of the page itself. */
  async openWithHeaders(): Promise<Record<string, string>> {
    const response = await this.page.goto('/');
    await expect(this.root).toBeVisible();
    return response?.headers() ?? {};
  }

  /** Whether the page can scroll in either direction. */
  async scrolls(): Promise<boolean> {
    return this.page.evaluate(() => {
      const el = document.scrollingElement ?? document.documentElement;
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    });
  }

  /** The font family the wordmark renders with, once fonts have loaded. */
  async wordmarkFontLoaded(): Promise<boolean> {
    return this.page.evaluate(async () => {
      await document.fonts.ready;
      return document.fonts.check('700 40px Fredoka');
    });
  }
}
