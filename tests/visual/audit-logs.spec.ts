import { test, expect } from '@playwright/test';
import { registerAuditMocks } from '../utils/auditMocks';

test.describe('Audit Logs Visuals', () => {
  test('default table layout', async ({ page }) => {
    await registerAuditMocks(page);

    await page.goto('/audit/logs');
    await page.waitForTimeout(200);

    await expect(page).toHaveScreenshot('audit-logs-default.png', {
      fullPage: true
    });
  });
});
