import { test, expect } from '@playwright/test';
import { registerSettingsMocks } from '../utils/settingsMocks';

test.describe('System Settings Visuals', () => {
  test('default uploads group', async ({ page }) => {
    await registerSettingsMocks(page);
    await page.goto('/system/settings');
    await page.waitForTimeout(200);
    await expect(page).toHaveScreenshot('system-settings-uploads.png', { fullPage: true });
  });
});
