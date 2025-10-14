import { Buffer } from 'buffer';
import { expect, test } from '@playwright/test';
import { registerOrderMatchingMocks } from '../utils/orderMatchingMocks';

test.describe('Order Matching Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerOrderMatchingMocks(page);
    await page.goto('/orders/matching');
    await expect(page.getByRole('heading', { name: '订单匹配与有效性确认' })).toBeVisible();
  });

  test('resolve ambiguous candidate, update validity and submit import', async ({ page }) => {
    const ambiguousRow = page.getByRole('row', { name: /A-0002/ });
    await ambiguousRow.getByRole('button', { name: '消歧' }).click();

    const dialog = page.getByRole('dialog', { name: /候选消歧/ });
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: '选择' }).first().click();
    await expect(dialog).toBeHidden();

    await expect(ambiguousRow.getByText('已匹配')).toBeVisible();

    const firstRow = page.getByRole('row', { name: /A-0001/ });
    await firstRow.getByRole('button', { name: '详情' }).click();

    const drawer = page.locator('.matching-drawer');
    await expect(drawer).toBeVisible();
    await drawer.getByRole('button', { name: '设为无效' }).click();
    await expect(page.getByText('已设为无效')).toBeVisible();
    await page.getByLabel('关闭').click();
    await expect(drawer).toBeHidden();

    await page.getByRole('button', { name: '上传报表' }).click();
    const upload = page.getByRole('dialog', { name: '上传报表' });
    await expect(upload).toBeVisible();
    await upload.locator('input[type="file"]').setInputFiles({
      name: 'mock-report.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      buffer: Buffer.from('mock report content')
    });
    await upload.getByRole('button', { name: '提交解析' }).click();
    await expect(page.getByText('导入任务已提交，正在识别模板…')).toBeVisible();
  });
});
