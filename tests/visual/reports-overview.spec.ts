import { test, expect } from '@playwright/test';
import { registerReportsMocks } from '../utils/reportsMocks';

test.describe('Reports Overview Visuals', () => {
  test('default overview layout', async ({ page }) => {
    await registerReportsMocks(page);

    await page.goto('/reports/overview');
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('reports-overview-default.png', {
      fullPage: true
    });
  });
});
