import { defineConfig, devices } from '@playwright/test';
console.log('>>>> env', process.env.PLAYWRIGHT_HTML_OUTPUT_DIR);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  globalSetup: require.resolve('./global-setup'),
  timeout: process.env.CI ? 120_000 : 60_000,
  outputDir: 'test-results',
  testDir: './tests',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: 'dist/report' }]
  ],
  use: {
    baseURL: 'http://localhost:3000',
    video: {
      mode: 'on',
      size: { width: 640, height: 480 },
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    timeout: 30_000,
    command: 'pnpm --filter "@tasker/web" start -H localhost',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
});
