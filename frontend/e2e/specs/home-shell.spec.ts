// Traces to: L2-034, L2-039
import { test, expect } from '../fixtures/test';
import { HomePage } from '../pages/home.page';

test.describe('Home shell', () => {
  test('Given a child opens Pibbo, when Home loads, then the shell shows with nothing to scroll and nothing leaving localhost @critical', async ({
    page,
    spoken,
  }) => {
    const home = new HomePage(page);

    await home.open();

    await expect(home.wordmark).toHaveAccessibleName('Pibbo');
    await expect(home.main).toBeAttached();
    expect(await home.wordmarkFontLoaded()).toBe(true);
    expect(await home.scrolls()).toBe(false);
    // Nothing is spoken before the child touches the screen.
    expect(await spoken.recordings()).toEqual([]);
  });

  test('Given a light device, when Home loads, then it is drawn in the colours of its mock: lavender paper, deep purple ink and a yellow seed @critical', async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: 'light' });
    const home = new HomePage(page);

    await home.open();

    expect(await home.colours()).toEqual({
      paper: 'rgb(247, 241, 252)',
      ink: 'rgb(33, 11, 74)',
      seed: 'rgb(255, 194, 61)',
    });
  });
});
