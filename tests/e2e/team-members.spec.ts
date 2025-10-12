import { expect, test } from '@playwright/test';
import { registerTeamsMocks } from '../utils/teamsMocks';

test.describe('Team Members Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerTeamsMocks(page);
    await page.goto('/org/teams');
  });

  test('select node → view members → batch move → export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '团队与人员' })).toBeVisible();

    await page.getByRole('button', { name: /广州一区/ }).click();
    await expect(page.getByText('梁婷')).toBeVisible();

    const rows = page.locator('.members__table tbody tr');
    await rows.nth(0).locator('input[type="checkbox"]').check();
    await rows.nth(1).locator('input[type="checkbox"]').check();

    await page.getByRole('button', { name: '批量转移' }).click();
    const modal = page.locator('.modal-form').first();
    await expect(modal).toBeVisible();
    await modal.locator('select').selectOption({ label: '南山大客户组' });
    await page.getByRole('button', { name: '确认转移' }).click();

    await expect(page.getByText('已转移 2 人')).toBeVisible();

    await page.getByRole('button', { name: '导出成员' }).click();
    await expect(page.getByText('导出任务已创建：EXP-MEM-PLAY-001')).toBeVisible();
  });
});
