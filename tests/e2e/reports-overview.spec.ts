import { expect, test } from '@playwright/test';
import { registerReportsMocks } from '../utils/reportsMocks';

test.describe('Reports Overview Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerReportsMocks(page);
    await page.goto('/reports/overview');
  });

  test('load → switch dimension → drill → export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '报表总览' })).toBeVisible();

    await expect(page.getByRole('button', { name: '导出当前视图' })).toBeEnabled();
    await expect(page.getByText('经营指标', { exact: false })).toBeVisible();

    const kpiCard = page.getByRole('button', { name: /订单数/ });
    await expect(kpiCard).toBeVisible();

    await page.getByLabel('维度').selectOption('store');
    await expect(page.getByRole('heading', { name: '门店明细' })).toBeVisible();
    await expect(page.getByText('广州天河一店')).toBeVisible();

    await page.getByRole('button', { name: 'GMV' }).click();
    await expect(page.getByText(/¥228,540/)).toBeVisible();

    const firstRow = page.getByRole('row', { name: /广州天河一店/ }).first();
    await firstRow.click();
    await page.waitForURL('**/reports/detail**');
    await page.goBack();
    await page.waitForURL('**/reports/overview');

    await page.getByRole('button', { name: '导出当前视图' }).click();
    await expect(page.getByText('导出任务已创建', { exact: false })).toBeVisible();
  });
});
