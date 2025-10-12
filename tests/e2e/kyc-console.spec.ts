import { expect, test } from '@playwright/test';
import { registerKycMocks } from '../utils/kycMocks';

test.describe('KYC Console Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerKycMocks(page);
    await page.goto('/risk/kyc');
  });

  test('load → view → approve → request more → reject → export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'KYC 审核 Console' })).toBeVisible();

    const firstRow = page.getByRole('row', { name: /KYC20251003001/ }).first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    await expect(page.getByRole('heading', { level: 2, name: 'KYC20251003001' })).toBeVisible();
    await page.locator('.drawer-actions').getByRole('button', { name: '通过' }).click();

    const approveDialog = page.getByRole('dialog');
    await expect(approveDialog).toBeVisible();
    await approveDialog.getByRole('button', { name: '确认' }).click();

    await expect(page.getByText('案件已通过')).toBeVisible();
    await expect(firstRow.getByText('已通过')).toBeVisible();

    await page.locator('.drawer-actions').getByRole('button', { name: '同步三方回调' }).click();
    await expect(page.getByText('已触发回调同步')).toBeVisible();

    const secondRow = page.getByRole('row', { name: /KYC20251002008/ }).first();
    await secondRow.click();
    await expect(page.getByRole('heading', { level: 2, name: 'KYC20251002008' })).toBeVisible();

    await page.locator('.drawer-actions').getByRole('button', { name: '补充材料' }).click();
    const requestDialog = page.getByRole('dialog', { name: '请求补充材料' });
    await requestDialog.getByLabel('需要补充的字段（逗号分隔）').fill('住所证明');
    await requestDialog.getByLabel('备注（至少 5 字）').fill('请补充完整资料');
    await requestDialog.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('已请求补充材料')).toBeVisible();

    const thirdRow = page.getByRole('row', { name: /KYC20250930015/ }).first();
    await thirdRow.click();
    await expect(page.getByRole('heading', { level: 2, name: 'KYC20250930015' })).toBeVisible();

    await page.locator('.drawer-actions').getByRole('button', { name: '拒绝' }).click();
    const rejectDialog = page.getByRole('dialog', { name: '拒绝案件' });
    await rejectDialog.getByLabel('备注（至少 5 字）').fill('材料存在伪造迹象');
    await rejectDialog.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('案件已拒绝')).toBeVisible();

    await page.getByRole('button', { name: '导出当前列表' }).click();
    await expect(page.getByText('导出任务已创建，请前往导出中心查看')).toBeVisible();
  });
});
