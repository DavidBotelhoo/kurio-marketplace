import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

/*
 * E2E suite against the production build with the mock API (the same
 * bundle as the published demo). Each test runs in a new browser context:
 * empty storage, so the mock database starts from its seed.
 *
 * Projects: "desktop" (1440×900) runs everything; "mobile" (390×844,
 * touch) runs the main flows. Tests tagged @desktop rely on the desktop
 * layout only. Visual baselines live next to tests/visual/*.spec.ts.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : '50%',
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.01, animations: 'disabled' },
  },
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],
  use: {
    baseURL: `http://localhost:${String(PORT)}`,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'mobile',
      use: {
        ...devices['Pixel 7'],
        viewport: { width: 390, height: 844 },
      },
      grepInvert: /@desktop/,
    },
  ],
  webServer: {
    command: `pnpm build && pnpm preview --port ${String(PORT)} --strictPort`,
    url: `http://localhost:${String(PORT)}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
