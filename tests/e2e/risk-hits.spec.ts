import { expect, test } from '@playwright/test';
import { registerRiskHitsMocks } from '../utils/riskHitsMocks';

test.describe('Risk Hits Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerRiskHitsMocks(page);
    await page.goto('/risk/hits');
  });

  test('filter → open detail → batch ignore → create ticket', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '风控命中列表' })).toBeVisible();

    await page.getByLabel('等级').selectOption('high');
    await page.getByRole('button', { name: '应用筛选' }).click();

    const hitRow = page.getByRole('row', { name: /越界地理围栏/ });
    await expect(hitRow).toBeVisible();
    await hitRow.click();

    await expect(page.getByRole('heading', { name: '命中详情' })).toBeVisible();

    await hitRow.getByRole('checkbox').check();
    await page.getByRole('button', { name: '批量忽略' }).click();
    const noteField = page.getByLabel('备注（至少 5 字）');
    await noteField.fill('门店活动导致距离异常');
    await page.getByRole('button', { name: '确认忽略' }).click();
    await expect(page.getByText(/已忽略/)).toBeVisible();

    await page.getByRole('button', { name: '创建工单' }).click();
    await page.getByRole('button', { name: '提交工单' }).click();
    await expect(page.getByText(/已创建工单/)).toBeVisible();

    await page.getByRole('button', { name: '导出当前视图' }).click();
    await expect(page.getByText(/导出任务已创建/)).toBeVisible();
  });
});
