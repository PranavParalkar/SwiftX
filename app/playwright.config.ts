import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright config — drives the running dev server. Run with:
 *   npm run test:e2e
 * Or for interactive debugging:
 *   npm run test:e2e:ui
 *
 * Requires a *running* dev server (npm run dev) and a *test* Supabase
 * project (never run against prod data). E2E_BASE_URL overrides the URL.
 */
export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
  ],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium-desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-android',   use: { ...devices['Pixel 7'] } },     // TC-09-03, TC-10-03
  ],
  webServer: process.env.CI
    ? {
        command: 'npm run start',
        url: 'http://localhost:3000',
        reuseExistingServer: false,
        timeout: 120_000,
      }
    : undefined,
})
