import { expect, test } from '@playwright/test';
import { registerCampaignsMocks } from '../utils/campaignsMocks';

test.describe('Campaigns Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerCampaignsMocks(page);
    await page.goto('/campaigns');
  });

  test('create draft → publish → offline → clone flow', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '活动管理' })).toBeVisible();
    await expect(page.getByText('5G 新装 59 元套餐')).toBeVisible();

    await page.getByRole('button', { name: '新建活动' }).click();
    const drawer = page.locator('.campaigns-drawer__panel');
    await expect(drawer).toBeVisible();

    await drawer.getByLabel('活动名称').fill('渠道回馈 39 元券');
    await drawer.getByLabel('活动码').fill('REBATE39');
    await drawer.getByLabel('开始时间').fill('2025-10-10T09:00');
    await drawer.getByLabel('结束时间').fill('2025-10-31T23:59');
    await drawer.getByLabel('微信').check();
    await drawer.getByLabel('H5').check();
    await drawer.getByLabel('需要邀请码才能参与').check();

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByRole('button', { name: '新增套餐' }).click();
    const planCard = drawer.locator('.plan-card').first();
    await planCard.getByLabel('套餐名称').fill('39 元体验包');
    await planCard.getByLabel('价格 (¥)').fill('39');
    await planCard.getByLabel('佣金 (¥)').fill('5');

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByLabel('广州').check();
    await drawer.getByLabel('S001 天河路旗舰店').check();
    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByLabel('表单 DSL ID').fill('F500');
    await drawer.getByLabel('风控策略 ID').fill('R900');
    await drawer.getByRole('button', { name: '下一步' }).click();

    await drawer.getByRole('button', { name: '保存草稿' }).click();
    await expect(drawer).not.toBeVisible();
    await expect(page.getByText('渠道回馈 39 元券')).toBeVisible();

    const newRow = page.locator('tr', { hasText: '渠道回馈 39 元券' });
    await newRow.getByRole('button', { name: '发布' }).click();
    await expect(newRow.locator('.status-tag')).toHaveText('已发布');

    await newRow.getByRole('button', { name: '下架' }).click();
    const offlineModal = page.locator('.offline-modal__panel');
    await expect(offlineModal).toBeVisible();
    await offlineModal.getByRole('textbox').fill('活动策略调整需下架优化');
    await offlineModal.getByRole('button', { name: '确认下架' }).click();
    await expect(offlineModal).not.toBeVisible();
    await expect(newRow.locator('.status-tag')).toHaveText('已下架');

    await newRow.getByRole('button', { name: '复制' }).click();
    await expect(drawer).toBeVisible();
    await expect(drawer.getByLabel('活动名称')).toHaveValue('渠道回馈 39 元券（副本）');
    await drawer.getByRole('button', { name: '关闭' }).click();

    await expect(page.getByText('渠道回馈 39 元券（副本）')).toBeVisible();
  });
});
