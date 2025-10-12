import { test, expect } from '@playwright/test';
import { registerWalletMocks } from '../utils/walletMocks';

test.describe('Wallet Summary Visual', () => {
  test.beforeEach(async ({ page }) => {
    await registerWalletMocks(page);
    await page.goto('/wallet/summary');
    await page.waitForTimeout(200);
  });

  test('matches default wallet summary layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('wallet-summary.png', { fullPage: true });
  });
});
