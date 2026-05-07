import { defineConfig, devices } from '@playwright/test';

const PORT = 3333;
const BASE_URL = process.env['PLAYWRIGHT_BASE_URL'] ?? `http://127.0.0.1:${PORT}`;

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 2 : 0,
  ...(process.env['CI'] ? { workers: 2 } : {}),
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['list'],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],
  outputDir: 'test-results',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'ar-SA',
    timezoneId: 'Asia/Riyadh',
  },
  projects: [
    {
      name: 'chromium-rtl',
      use: { ...devices['Desktop Chrome'], locale: 'ar-SA' },
    },
    {
      name: 'chromium-ltr',
      use: { ...devices['Desktop Chrome'], locale: 'en-US' },
    },
    {
      name: 'firefox-rtl',
      use: { ...devices['Desktop Firefox'], locale: 'ar-SA' },
    },
    {
      name: 'webkit-rtl',
      use: { ...devices['Desktop Safari'], locale: 'ar-SA' },
    },
    {
      name: 'mobile-rtl',
      use: { ...devices['iPhone 14'], locale: 'ar-SA' },
    },
  ],
  ...(process.env['PLAYWRIGHT_BASE_URL']
    ? {}
    : {
        webServer: {
          command: 'pnpm dev',
          url: BASE_URL,
          reuseExistingServer: !process.env['CI'],
          timeout: 120_000,
          stdout: 'ignore' as const,
          stderr: 'pipe' as const,
        },
      }),
});
