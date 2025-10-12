import { test, expect } from '@playwright/test';
import { registerTasksMocks } from '../utils/tasksMocks';

test.describe('Tasks Visual', () => {
  test.beforeEach(async ({ page }) => {
    await registerTasksMocks(page);
    await page.goto('/tasks');
    await page.waitForTimeout(200);
  });

  test('default snapshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('tasks-page.png', { fullPage: true });
  });
});
