import { expect, test } from '@playwright/test';
import { registerReportsMocks } from '../utils/reportsMocks';
import { registerExportsMocks } from '../utils/exportsMocks';

test.describe('Exports Center', () => {
  test.beforeEach(async ({ page }) => {
    await registerReportsMocks(page);
    await registerExportsMocks(page);
  });

  test('create job → view in center → retry/cancel → download', async ({ page }) => {
    await page.goto('/reports/overview');
    await page.getByRole('button', { name: '导出当前视图' }).click();
    await expect(page.getByText(/导出任务已创建/)).toBeVisible();

    await page.goto('/exports');
    await expect(page.getByRole('heading', { name: '导出中心' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'E20251003002' })).toBeVisible();

    const failedRow = page.getByRole('row', { name: /E20251003003/ });
    await failedRow.getByRole('button', { name: '重试' }).click();
    await expect(page.getByText(/已重新排队任务/)).toBeVisible();

    const queuedRow = page.getByRole('row', { name: /E20251003004/ });
    const cancelDialog = page.waitForEvent('dialog');
    await queuedRow.getByRole('button', { name: '取消' }).click();
    await (await cancelDialog).accept();
    await expect(page.getByText(/任务已取消/)).toBeVisible();

    const readyRow = page.getByRole('row', { name: /E20251003002/ });
    await readyRow.getByRole('button', { name: '详情' }).click();
    await expect(page.getByRole('heading', { name: /任务 E20251003002/ })).toBeVisible();
    await page.getByRole('button', { name: '下载文件' }).click();
    await expect(page.getByText(/已打开下载链接/)).toBeVisible();
    await page.getByRole('button', { name: '复制下载链接' }).click();
    await expect(page.getByText(/下载链接已复制/)).toBeVisible();
    await page.getByRole('button', { name: '复制 cURL' }).click();
    await expect(page.getByText(/cURL 命令已复制/)).toBeVisible();

    const deleteDialog = page.waitForEvent('dialog');
    await page.getByRole('button', { name: '删除已过期' }).click();
    await (await deleteDialog).accept();
    await expect(page.getByText(/已删除/)).toBeVisible();
  });
});
