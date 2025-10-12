import { test, expect } from '@playwright/test';
import { registerCampaignsMocks } from '../utils/campaignsMocks';

test.describe('Campaigns Visual', () => {
  test.beforeEach(async ({ page }) => {
    await registerCampaignsMocks(page);
    await page.goto('/campaigns');
    await page.waitForTimeout(200);
  });

  test('default layout snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('campaigns-page.png', { fullPage: true });
  });
});
