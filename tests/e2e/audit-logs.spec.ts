import { expect, test } from '@playwright/test';
import { registerAuditMocks } from '../utils/auditMocks';

test.describe('Audit Logs Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAuditMocks(page);
    await page.goto('/audit/logs');
  });

  test('filter → open detail → evidence → verify chain', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '审计日志' })).toBeVisible();

    await page.getByLabel('事件类型').fill('export');
    await page.getByRole('button', { name: '应用' }).click();
    await expect(page.getByRole('cell', { name: /export_download/ })).toBeVisible();

    const firstRow = page.getByRole('row', { name: /A202510030001/ }).first();
    await firstRow.click();
    await expect(page.getByRole('heading', { name: /事件 A202510030001/ })).toBeVisible();

    await page.getByRole('button', { name: '取证打包' }).click();
    await expect(page.getByText(/取证包已生成/)).toBeVisible();

    await page.getByRole('button', { name: '验证链完整性' }).click();
    await expect(page.getByText(/链验证通过/)).toBeVisible();

    await page.getByRole('button', { name: '复制哈希' }).click();
    await expect(page.getByText(/哈希已复制/)).toBeVisible();

    await page.getByRole('button', { name: '关闭详情', exact: false }).click();
    await expect(page.getByRole('heading', { name: '审计日志' })).toBeVisible();
  });
});
