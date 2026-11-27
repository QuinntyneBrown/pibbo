import { defineConfig, devices } from '@playwright/test';

const port = 4300;

/**
 * Chromium only, touch emulated. Specs run against the production build served by
 * e2e/serve.mjs, which also sends the security headers a deployed host must send.
 * Only behaviour specs run by default; sweeps live elsewhere and run when a person asks.
 */
export default defineConfig({
  testDir: './e2e/specs',
  fullyParallel: true,
  forbidOnly: !!process.env['CI'],
  retries: 0,
  reporter: process.env['CI'] ? [['github'], ['list']] : 'list',
  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium-phone',
      use: { ...devices['Pixel 7'], browserName: 'chromium' },
    },
    {
      name: 'chromium-desktop',
      use: { ...devices['Desktop Chrome'], browserName: 'chromium' },
    },
  ],
  webServer: {
    command: `node e2e/serve.mjs ${port}`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: !process.env['CI'],
  },
});
