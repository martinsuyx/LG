import { expect, test } from '@playwright/test';
import { registerCampaignBasicsMocks } from '../utils/campaignBasicsMocks';

test.describe('Campaign Basics Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerCampaignBasicsMocks(page);
    await page.goto('/campaigns/C1/basics');
  });

  test('save draft → parse example → next step feedback', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '活动基础设置' })).toBeVisible();

    await page.getByLabel('客户名称').fill('京夏通讯集团');
    await page.getByLabel('活动名称').fill('校园地推 69 元套餐');
    await page.getByLabel('活动编码').fill('CAMP69');

    await page.getByLabel('微信').check();
    await page.getByLabel('H5').check();

    await page.getByLabel('开始时间').fill('2025-09-05T09:00');
    await page.getByLabel('结束时间').fill('2025-10-20T23:59');

    await page.locator('table tbody tr').nth(0).getByRole('textbox').fill('客户编号');
    await page.locator('table tbody tr').nth(1).getByRole('textbox').fill('下单金额（元）');

    await page.getByRole('button', { name: '保存草稿' }).click();
    await expect(page.getByText('草稿已保存')).toBeVisible();

    await page.getByRole('button', { name: '测试解析' }).click();
    await expect(page.getByText('解析完成')).toBeVisible();
    await expect(page.getByText('共 2 行样本')).toBeVisible();

    await page.getByRole('button', { name: '下一步' }).click();
    await expect(page.getByText('已保存草稿，可继续配置下一步')).toBeVisible();
  });
});
