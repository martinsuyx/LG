import { expect, test } from '@playwright/test';
import { registerSettingsMocks } from '../utils/settingsMocks';

test.describe('System Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerSettingsMocks(page);
    await page.goto('/system/settings');
  });

  test('edit → submit → approve → effective', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '上传策略' })).toBeVisible();

    await page.getByLabel('Bucket').fill('lg-prod-updated');
    await page.getByRole('button', { name: '保存草稿' }).click();
    await expect(page.getByText(/已保存草稿/)).toBeVisible();

    await page.getByRole('button', { name: '提交审批' }).click();
    await expect(page.getByText(/已提交审批/)).toBeVisible();

    await page.getByRole('button', { name: '审批通过' }).click();
    await expect(page.getByText(/设置已生效/)).toBeVisible();

    await page.getByRole('button', { name: '测试连接' }).click();
    await expect(page.getByText(/连接成功/)).toBeVisible();
  });
});
