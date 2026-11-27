import type { Locator, Page } from '@playwright/test';

/** The placeholder that stands in for an activity until its journey builds it. */
export class ActivityPlaceholderPage {
  readonly root: Locator;
  readonly title: Locator;
  readonly home: Locator;

  constructor(private readonly page: Page) {
    this.root = page.locator('.placeholder');
    this.title = page.locator('.placeholder__title');
    this.home = page.locator('.placeholder__home');
  }

  path(): string {
    return new URL(this.page.url()).pathname;
  }
}
