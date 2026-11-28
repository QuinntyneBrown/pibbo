// Traces to: L2-036
import AxeBuilder from '@axe-core/playwright';
import { test, expect } from '../fixtures/test';
import { everyScreen } from './screens';

/**
 * The accessibility sweep (L2-036 #1, #3, #5): every screen, light and dark, with and without
 * reduced motion, scanned with axe-core for WCAG 2.2 AA. Serious and critical violations fail.
 * Run only when a person asks: npm run sweep:a11y
 */
for (const colorScheme of ['light', 'dark'] as const) {
  for (const reducedMotion of ['no-preference', 'reduce'] as const) {
    test(`Given every screen in ${colorScheme} with motion ${reducedMotion}, when scanned with axe-core, then there are no serious or critical violations`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme, reducedMotion });
      const problems: string[] = [];
      for (const screen of await everyScreen(page)) {
        await screen.open(page);
        const { violations } = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        for (const v of violations) {
          if (v.impact === 'serious' || v.impact === 'critical') {
            problems.push(`${screen.name}: ${v.id} (${v.nodes.length}) ${v.help}`);
          }
        }
      }
      expect(problems).toEqual([]);
    });
  }
}
