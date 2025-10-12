import { test, expect } from '@playwright/test';
import { registerExportsMocks } from '../utils/exportsMocks';

test.describe('Exports Center Visuals', () => {
  test('default layout', async ({ page }) => {
    await registerExportsMocks(page);

    await page.goto('/exports');
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('exports-center-default.png', {
      fullPage: true
    });
  });
});
