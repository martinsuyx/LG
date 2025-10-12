import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './visual',
  snapshotDir: './visual/__snapshots__',
  timeout: 60_000,
  expect: {
    timeout: 5_000,
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.015
    }
  },
  use: {
    baseURL,
    headless: true,
    viewport: { width: 1440, height: 900 }
  },
  webServer: {
    command: 'pnpm --filter admin-web dev -- --host 127.0.0.1 --port 5173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
