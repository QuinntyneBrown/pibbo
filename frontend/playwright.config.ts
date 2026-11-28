import { defineConfig, devices } from '@playwright/test';

/**
 * Each checkout serves its own build on its own port. A fixed, shared port let concurrent runs
 * from other worktrees reuse one another's server, which served the wrong build and was stopped
 * mid-run when its owner finished, leaving requests unanswered. The port is derived from this
 * folder, so it is stable, and kept in the environment so every worker sees the same one.
 */
process.env['PIBBO_E2E_PORT'] ??= String(
  4300 + ([...__dirname].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % 1000),
);
const port = Number(process.env['PIBBO_E2E_PORT']);

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
    reuseExistingServer: false,
  },
});
