import { expect, test } from '@playwright/test';
import { registerRiskTicketsMocks } from '../utils/riskTicketsMocks';

test.describe('Risk Tickets Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerRiskTicketsMocks(page);
    await page.goto('/risk/tickets');
  });

  test('assign → investigate → resolve → close', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '风控工单' })).toBeVisible();

    const row = page.getByRole('row', { name: /K20251003001/ });
    await row.click();

    await page.getByRole('button', { name: '指派' }).click();
    await page.getByLabel('负责人 ID').fill('U2099');
    await page.getByRole('button', { name: /^确认$/ }).click();
    await expect(page.getByText('指派成功')).toBeVisible();

    await page.getByRole('button', { name: '开始调查' }).click();
    await expect(page.getByText('已进入调查')).toBeVisible();

    await page.getByRole('button', { name: '标记已处置' }).click();
    await page.getByLabel('备注').fill('核对无异常');
    await page.getByRole('button', { name: /^确认$/ }).click();
    await expect(page.getByText('工单已处置')).toBeVisible();

    await page.getByRole('button', { name: '关闭' }).click();
    await page.getByLabel('备注').fill('结束流程');
    await page.getByRole('button', { name: /^确认$/ }).click();
    await expect(page.getByText('工单已关闭')).toBeVisible();
  });
});
