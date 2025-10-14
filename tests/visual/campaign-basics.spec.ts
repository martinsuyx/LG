import { test, expect } from '@playwright/test';
import { registerCampaignBasicsMocks } from '../utils/campaignBasicsMocks';

test.describe('Campaign Basics Visual', () => {
  test.beforeEach(async ({ page }) => {
    await registerCampaignBasicsMocks(page);
    await page.goto('/campaigns/C1/basics');
    await page.waitForTimeout(200);
  });

  test('default layout snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('campaign-basics.png', { fullPage: true });
  });
});
