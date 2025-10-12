import { test, expect } from '@playwright/test';
import { registerDashboardMocks } from '../utils/dashboardMocks';

test.describe('Dashboard Visuals', () => {
  test('matches default overview layout', async ({ page }) => {
    await registerDashboardMocks(page);

    await page.goto('/dashboard');
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('dashboard-default.png', {
      fullPage: true
    });
  });
});
