import { defineConfig } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://127.0.0.1:5173';

export default defineConfig({
  testDir: './e2e',
  testMatch: [
    '**/dashboard.spec.ts',
    '**/order-list.spec.ts',
    '**/wallet.spec.ts',
    '**/ai-intake.spec.ts',
    '**/manual-intake.spec.ts',
    '**/campaigns.spec.ts',
    '**/tasks.spec.ts',
    '**/team-members.spec.ts',
    '**/users-roles.spec.ts',
    '**/reports-overview.spec.ts',
    '**/exports-center.spec.ts',
    '**/audit-logs.spec.ts',
    '**/system-settings.spec.ts',
    '**/kyc-console.spec.ts',
    '**/risk-hits.spec.ts',
    '**/risk-tickets.spec.ts'
  ],
  timeout: 60_000,
  expect: {
    timeout: 5_000
  },
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    viewport: { width: 1440, height: 900 }
  },
  webServer: {
    command: 'pnpm --filter admin-web dev -- --host 127.0.0.1 --port 5173',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000
  }
});
