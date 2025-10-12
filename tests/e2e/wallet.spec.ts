import { test, expect } from '@playwright/test';
import { registerWalletMocks } from '../utils/walletMocks';

test.describe('钱包摘要与提现流程', () => {
  test.beforeEach(async ({ page }) => {
    await registerWalletMocks(page);
  });

  test('summary → drill ledger → export → withdraw approve', async ({ page }) => {
    await page.goto('/wallet/summary');

    await expect(page.getByText('总余额')).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    await page.getByRole('button', { name: '查看流水' }).first().click();
    await expect(page).toHaveURL(/\/wallet\/ledger/);
    await expect(page.getByText('钱包流水')).toBeVisible();

    await page.getByRole('button', { name: '导出当前筛选' }).click();
    await expect(page.getByText('已创建导出任务')).toBeVisible();

    await page.goto('/withdraws');
    await expect(page.getByText('提现管理')).toBeVisible();

    await page.getByRole('button', { name: '通过' }).first().click();
    await page.getByRole('button', { name: '确认提交' }).click();
    await expect(page.getByText('进入出款流程')).toBeVisible();
    await expect(page.getByRole('row', { name: /W20251003001/ }).getByText('出款中')).toBeVisible();
  });
});
