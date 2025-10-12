import { test, expect } from '@playwright/test';
import { registerOrdersMocks } from '../utils/ordersMocks';

test.describe('订单列表与审核流程', () => {
  test.beforeEach(async ({ page }) => {
    await registerOrdersMocks(page);
  });

  test('load → filter → detail → single review → batch review', async ({ page }) => {
    await page.goto('/orders');

    const rows = page.locator('tbody tr');
    await expect(rows).toHaveCount(3);

    await page.getByLabel('状态').selectOption({ label: '已通过' });
    await page.getByRole('button', { name: '应用筛选' }).click();
    await expect(rows).toHaveCount(1);

    await page.getByRole('button', { name: '重置' }).click();
    await expect(rows).toHaveCount(3);

    await page.getByRole('button', { name: 'O20251001001' }).click();
    await expect(page).toHaveURL(/\/orders\/O20251001001$/);
    await expect(page.getByRole('heading', { name: /订单 O20251001001/ })).toBeVisible();

    await page.goBack();
    await expect(rows).toHaveCount(3);

    await page.getByRole('button', { name: '审核' }).first().click();
    await page.getByRole('textbox', { name: /备注/ }).fill('单条审核通过');
    await page.getByRole('button', { name: '提交' }).click();
    await expect(page.getByText('已标记为')).toBeVisible();
    await expect(rows.first().getByText('已通过')).toBeVisible();

    await rows.nth(1).locator('input[type="checkbox"]').check();
    await rows.nth(2).locator('input[type="checkbox"]').check();
    await page.getByRole('button', { name: '批量通过' }).click();
    await page.getByRole('textbox', { name: /备注/ }).fill('批量通过测试');
    await page.getByRole('button', { name: '确认提交' }).click();
    await expect(page.getByText('批量通过 2 条订单成功')).toBeVisible();
    await expect(rows.nth(1).getByText('已通过')).toBeVisible();
  });
});
