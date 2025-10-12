import { expect, test } from '@playwright/test';
import { registerAiIntakeMocks } from '../utils/intakeMocks';

test.describe('AI Intake Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerAiIntakeMocks(page);
  });

  test('upload → parse → edit → submit → redirect', async ({ page }) => {
    await page.goto('/intake/ai');

    const sampleImage = {
      name: 'idcard.png',
      mimeType: 'image/png',
      buffer: Buffer.from('fake-image')
    };

    await page.locator('.uploader__input').setInputFiles(sampleImage);
    await expect(page.getByText('AI 正在解析字段...', { exact: false })).toBeVisible();

    await expect(page.getByLabel('姓名', { exact: false })).toHaveValue('张三');
    await expect(page.getByLabel('手机号', { exact: false })).toHaveValue('13800000000');

    await page.getByLabel('金额', { exact: false }).fill('88.00');
    await page.getByRole('checkbox', { name: '我已核对信息并确认无误' }).check();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/orders') && response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: '提交订单' }).click();

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    const payload = await response.request().postDataJSON();
    expect(payload).toMatchObject({
      job_id: 'J20251003001',
      confirm_flag: true
    });
    expect(payload.fields.amount).toBe('88.00');

    await expect(page).toHaveURL(/\/orders\/O20251088888$/);
    await expect(page.getByRole('heading', { name: /订单 O20251088888/ })).toBeVisible();
  });
});
