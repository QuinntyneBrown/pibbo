import { defineConfig, devices } from '@playwright/test';
import base from './playwright.config';

/**
 * The sweeps: accessibility, heap, visual and load time. They run, and their baselines update,
 * only when a person asks (`npm run sweep`, or one of `sweep:a11y`, `sweep:heap`,
 * `sweep:visual`, `sweep:load`); never in CI and never with the behaviour specs.
 */
export default defineConfig({
  ...base,
  testDir: './e2e/sweeps',
  testMatch: '*.sweep.ts',
  timeout: 120_000,
  reporter: 'list',
  snapshotPathTemplate: '{testDir}/baselines/{testFilePath}/{arg}-{projectName}{ext}',
  expect: { toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' } },
  projects: [
    { name: 'chromium-phone', use: { ...devices['Pixel 7'], browserName: 'chromium' } },
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } },
  ],
});
