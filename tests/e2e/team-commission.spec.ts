import { expect, test } from '@playwright/test';
import { registerTeamCommissionMocks } from '../utils/teamCommissionMocks';

test.describe('Team Commission Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerTeamCommissionMocks(page);
    await page.goto('/org/teams/T001/commission?campaign_id=C1&plan_id=P1');
    await expect(page.getByRole('heading', { name: '团队佣金配置' })).toBeVisible();
  });

  test('single edit, batch override, import and copy flows', async ({ page }) => {
    const firstRow = page.getByRole('row', { name: /张三/ });
    const secondRow = page.getByRole('row', { name: /李四/ });

    await firstRow.getByRole('button', { name: '设置' }).click();
    await page.getByLabel('默认佣金比例').fill('14');
    await page.getByRole('button', { name: '保存' }).click();
    await expect(page.getByText('已保存覆盖佣金')).toBeVisible();
    await expect(firstRow.getByText('14%')).toBeVisible();

    await firstRow.getByRole('button', { name: '清除' }).click();
    await expect(page.getByText('已清除覆盖')).toBeVisible();
    await expect(firstRow.getByText('12%')).toBeVisible();

    const rowCheckboxes = page.locator('tbody tr input[type="checkbox"]');
    await rowCheckboxes.nth(0).check();
    await rowCheckboxes.nth(1).check();
    await page.getByRole('button', { name: '批量设置' }).click();
    await page.getByRole('dialog').getByLabel('默认佣金比例').fill('16');
    await page.getByRole('button', { name: '应用' }).click();
    await expect(page.getByText('批量设置已提交')).toBeVisible();
    await expect(firstRow.getByText('16%')).toBeVisible();
    await expect(secondRow.getByText('16%')).toBeVisible();

    await page.getByRole('button', { name: '导入 Excel' }).click();
    const importDialog = page.getByRole('dialog');
    await importDialog.getByLabel('上传凭证或任务 ID').fill('upload-token-123');
    await importDialog.getByRole('button', { name: '提交导入' }).click();
    await expect(page.getByText('导入任务已提交')).toBeVisible();
    await expect(importDialog.getByText(/任务 T20251015001/)).toBeVisible();
    await importDialog.getByRole('button', { name: '关闭' }).click();

    await page.getByRole('button', { name: '复制规则' }).click();
    const copyDialog = page.getByRole('dialog');
    await copyDialog.getByRole('button', { name: '预览差异' }).click();
    await expect(copyDialog.getByText(/将更新/)).toBeVisible();
    await copyDialog.getByRole('button', { name: '应用规则' }).click();
    await expect(page.getByText('规则已复制应用')).toBeVisible();
    await copyDialog.getByRole('button', { name: '取消' }).click();

    await expect(firstRow.getByText('18%')).toBeVisible();
    await expect(secondRow.getByText('17%')).toBeVisible();
  });
});
