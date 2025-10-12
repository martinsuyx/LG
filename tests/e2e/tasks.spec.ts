import { expect, test } from '@playwright/test';
import { registerTasksMocks } from '../utils/tasksMocks';

test.describe('Tasks Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerTasksMocks(page);
    await page.goto('/tasks');
  });

  test('create → validate → publish → offline → clone', async ({ page }) => {
    await expect(page.getByRole('heading', { name: '任务管理' })).toBeVisible();

    await page.getByRole('button', { name: '新建任务' }).click();
    const drawer = page.locator('.tasks-drawer__panel');
    await expect(drawer).toBeVisible();

    await drawer.getByLabel('任务名称').fill('线索核验任务');
    await drawer.getByLabel('任务码').fill('LEADCHK');
    await drawer.getByLabel('开始时间').fill('2025-10-10T09:00');
    await drawer.getByLabel('结束时间').fill('2025-12-31T23:59');
    await drawer.getByLabel('运营人员').check();
    await drawer.getByLabel('审核员').check();
    await drawer.getByLabel('华南事业部').check();

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByLabel('绑定表单 DSL').selectOption('F208');
    await drawer.getByRole('button', { name: '新增映射' }).click();
    const mapRow = drawer.locator('.mapping-row').first();
    await mapRow.getByPlaceholder('dsl_key').fill('customer_id');
    await mapRow.getByPlaceholder('biz_key').fill('lead_id');
    await mapRow.getByText('必填').check();
    await mapRow.getByLabel('校验规则').selectOption('regex');
    await mapRow.getByPlaceholder('如 ^\\d+$ 或 A,B,C').fill('^LEAD-\\d+$');

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByRole('button', { name: '新增校验' }).click();
    const ruleBlock = drawer.locator('.rule-block').first();
    await ruleBlock.getByPlaceholder('如 id_number').fill('customer_id');
    await ruleBlock.getByPlaceholder('如 regex_cn_id').fill('regex_lead');
    await ruleBlock.getByPlaceholder('提示信息').fill('线索编号格式错误');
    await drawer.getByRole('button', { name: '新增阈值' }).click();
    const thresholdBlock = drawer.locator('.rule-block').nth(1);
    await thresholdBlock.getByPlaceholder('如 amount').fill('score');
    await thresholdBlock.getByPlaceholder('>=', { exact: true }).fill('>=');
    await thresholdBlock.getByLabel('阈值').fill('80');
    await thresholdBlock.getByPlaceholder('如 manual_review').fill('manual_review');
    await drawer.getByLabel('抽审比例 %').fill('15');
    await drawer.getByLabel('抽审种子').fill('202510');
    await drawer.getByLabel('启用双人复核').check();
    await drawer.getByLabel('审核 SLA (分钟)').fill('90');

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByLabel('风控模板').selectOption('R006');
    await drawer.getByLabel('命中动作').selectOption('block');

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByLabel('流程模式').selectOption('gray');
    await drawer.getByLabel('灰度比例 %').fill('25');
    await drawer.getByLabel('回滚版本').fill('1');

    await drawer.getByRole('button', { name: '下一步' }).click();
    await drawer.getByRole('button', { name: '保存草稿' }).click();
    await expect(drawer).toBeVisible();
    await expect(page.getByText('线索核验任务')).toBeVisible();

    await drawer.getByRole('button', { name: '校验配置' }).click();
    await expect(page.getByText('校验通过', { exact: false })).toBeVisible();

    await drawer.getByRole('button', { name: '发布' }).click();
    await expect(page.getByText('任务已发布')).toBeVisible();
    await drawer.getByRole('button', { name: '关闭' }).click();

    const row = page.locator('tr', { hasText: '线索核验任务' });
    await expect(row.locator('.status-tag')).toHaveText('已发布');

    await row.getByRole('button', { name: '下架' }).click();
    const offlineModal = page.locator('.offline-modal__panel');
    await expect(offlineModal).toBeVisible();
    await offlineModal.getByRole('textbox').fill('策略调整需要下架');
    await offlineModal.getByRole('button', { name: '确认下架' }).click();
    await expect(row.locator('.status-tag')).toHaveText('已下架');

    await row.getByRole('button', { name: '复制' }).click();
    await expect(drawer).toBeVisible();
    await expect(drawer.getByLabel('任务名称')).toHaveValue('线索核验任务（副本）');
    await drawer.getByRole('button', { name: '关闭' }).click();

    await expect(page.getByText('线索核验任务（副本）')).toBeVisible();
  });
});
