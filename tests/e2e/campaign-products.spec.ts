import { expect, test } from '@playwright/test';
import { registerCampaignProductsMocks } from '../utils/campaignProductsMocks';

test.describe('Campaign Products Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerCampaignProductsMocks(page);
    await page.goto('/campaigns/C1/products');
  });

  test('edit package, create nodes, copy template and import', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '推广产品设置' })).toBeVisible();

    await page.getByRole('button', { name: /首充 59 元套餐/ }).click();
    await expect(page.getByRole('heading', { name: '首充 59 元套餐' })).toBeVisible();

    await page.getByLabel('套餐名称').fill('首充 59 元套餐（调优）');
    await page.getByLabel('套餐价格').fill('66');
    await page.getByLabel('套餐说明').fill('地推渠道限时调佣');
    await page.getByLabel('状态').selectOption({ label: '已归档' });

    await page.getByLabel('阶梯佣金').check();
    await page.getByRole('button', { name: '新增阶梯' }).click();
    const tierRow = page.locator('.commission-field__tiers tbody tr').first();
    await tierRow.locator('input').first().fill('100');
    await tierRow.locator('input').nth(1).fill('12.5');

    await page.getByLabel('最小值').fill('4');
    await page.getByLabel('最大值').fill('12');
    await page.getByLabel('允许运营覆盖默认佣金').check();

    await page.getByRole('button', { name: '保存套餐' }).click();
    await expect(page.getByText('套餐已保存')).toBeVisible();

    await page.getByRole('button', { name: '新增产品' }).click();
    const createProductDialog = page.getByRole('dialog', { name: '新增产品' });
    await createProductDialog.getByLabel('产品名称').fill('云闪付联合包');
    await createProductDialog.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('产品已创建')).toBeVisible();
    await expect(page.getByRole('button', { name: '云闪付联合包' })).toBeVisible();

    await page.getByRole('button', { name: '云闪付联合包' }).click();
    await page.getByRole('button', { name: '新增套餐' }).click();
    const createPackageDialog = page.getByRole('dialog', { name: '新增套餐' });
    await createPackageDialog.getByLabel('套餐名称').fill('联合首充礼包');
    await createPackageDialog.getByLabel('套餐价格').fill('88');
    await createPackageDialog.getByLabel('固定佣金').check();
    await createPackageDialog.getByLabel('默认佣金金额').fill('18');
    await createPackageDialog.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('套餐已创建')).toBeVisible();
    await expect(page.getByRole('button', { name: /联合首充礼包/ })).toBeVisible();

    await page.getByRole('button', { name: '复制模板' }).click();
    const copyDialog = page.getByRole('dialog', { name: '从模板复制套餐' });
    await copyDialog.getByLabel('选择模板').selectOption('tpl-campus-basic');
    await copyDialog.getByLabel('覆盖当前套餐配置').check();
    await copyDialog.getByRole('button', { name: '确认' }).click();
    await expect(page.getByText('模板已复制到当前活动')).toBeVisible();

    await page.getByRole('button', { name: /5G 地推礼包/ }).click();
    await expect(page.getByRole('button', { name: /模板 · 校园体验包/ })).toBeVisible();

    await page.getByRole('button', { name: '导入配置' }).click();
    const importDialog = page.getByRole('dialog', { name: '导入套餐配置' });
    await importDialog.getByLabel('上传凭证').fill('upload-token-001');
    await importDialog.getByLabel('通知邮箱（可选）').fill('ops@example.com');
    await importDialog.getByLabel('仅校验，不落库').check();
    await importDialog.getByRole('button', { name: '确认' }).click();

    const taskDialog = page.getByRole('dialog', { name: '导入任务进度' });
    await expect(taskDialog.getByText('处理中')).toBeVisible({ timeout: 5000 });
    await expect(taskDialog.getByText('已完成')).toBeVisible({ timeout: 5000 });
    await taskDialog.getByRole('button', { name: 'Close' }).click();

    await page.getByRole('button', { name: /5G 地推礼包/ }).click();
    await expect(page.getByRole('button', { name: /批量导入套餐/ })).toBeVisible();
  });
});
