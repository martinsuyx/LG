import { test, expect } from '@playwright/test';
import { registerOrdersMocks } from '../utils/ordersMocks';

test.describe('Orders List Visual', () => {
  test.beforeEach(async ({ page }) => {
    await registerOrdersMocks(page);
    await page.goto('/orders');
    await page.waitForTimeout(200);
  });

  test('matches default orders layout', async ({ page }) => {
    await expect(page).toHaveScreenshot('orders-list.png', { fullPage: true });
  });
});
