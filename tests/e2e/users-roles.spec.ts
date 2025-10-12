import { expect, test } from '@playwright/test';
import { registerUsersMocks } from '../utils/usersMocks';

test.describe('Users & Roles Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerUsersMocks(page);
    await page.goto('/org/users-roles');
  });

  test('create user → assign role → freeze → export', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '用户与角色' })).toBeVisible();

    await page.getByRole('button', { name: '新建用户' }).click();
    await page.getByLabel('姓名').fill('测试账号');
    await page.getByLabel('手机号').fill('13800009999');
    await page.getByLabel('邮箱').fill('test.user@example.com');
    await page.getByRole('checkbox', { name: '访客' }).check();
    await page.getByRole('button', { name: '创建' }).click();

    await expect(page.getByText(/已创建用户/)).toBeVisible();
    await expect(page.getByText('测试账号')).toBeVisible();

    await page.getByRole('button', { name: '分配角色' }).click();
    await page.getByRole('checkbox', { name: '组织管理员' }).check();
    await page.getByRole('button', { name: '保存' }).click();

    await expect(page.getByText('角色已更新')).toBeVisible();

    await page.getByRole('button', { name: '冻结用户' }).click();
    await expect(page.getByText('用户已冻结')).toBeVisible();

    await page.getByRole('button', { name: '导出用户' }).click();
    await expect(page.getByText(/用户导出任务/)).toBeVisible();
  });
});
