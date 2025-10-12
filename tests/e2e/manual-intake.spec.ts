import { expect, test } from '@playwright/test';
import { registerManualIntakeMocks } from '../utils/intakeMocks';

test.describe('Manual Intake Page', () => {
  test.beforeEach(async ({ page }) => {
    await registerManualIntakeMocks(page);
  });

  test('validate → fill → attachments → submit → redirect', async ({ page }) => {
    await page.goto('/intake/manual');

    await page.getByRole('button', { name: '提交订单' }).click();
    await expect(page.getByText('请完善必填项后再提交')).toBeVisible();

    await page.getByLabel('手机号', { exact: false }).fill('13800000011');
    await page.getByLabel('姓名', { exact: false }).fill('李四');
    await page.locator('.form__combo select').first().selectOption('passport');
    await page.locator('.form__combo input').first().fill('P1234567');
    await page.getByLabel('门店', { exact: false }).selectOption('S001');
    await page.getByLabel('活动', { exact: false }).selectOption('CAMP-01');
    await page.getByLabel('金额', { exact: false }).fill('199.90');
    await page.getByLabel('渠道', { exact: false }).selectOption('wechat');
    await page.getByLabel('推广人', { exact: false }).fill('P1001');
    await page.getByLabel('备注', { exact: false }).fill('线下渠道补录');

    const attachments = [
      {
        name: 'contract.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('fake-pdf')
      },
      {
        name: 'voucher.png',
        mimeType: 'image/png',
        buffer: Buffer.from('fake-image')
      }
    ];
    await page.locator('.attachments__input').setInputFiles(attachments);

    await page.getByRole('checkbox', { name: /合规确认/ }).check();

    const responsePromise = page.waitForResponse(
      (response) => response.url().includes('/api/v1/orders') && response.request().method() === 'POST'
    );

    await page.getByRole('button', { name: '提交订单' }).click();

    const response = await responsePromise;
    expect(response.ok()).toBeTruthy();

    const payload = await response.request().postDataJSON();
    expect(payload.confirm_flag).toBe(true);
    expect(payload.fields).toMatchObject({
      phone: '13800000011',
      name: '李四',
      id_type: 'passport',
      id_number: 'P1234567',
      store_id: 'S001',
      campaign_id: 'CAMP-01',
      amount: '199.90',
      channel: 'wechat',
      promoter_id: 'P1001',
      note: '线下渠道补录'
    });

    const attachmentsField = JSON.parse(payload.fields.attachments);
    expect(attachmentsField).toEqual(['manual-upload-1-1', 'manual-upload-1-2']);

    await expect(page).toHaveURL(/\/orders\/O20251077777$/);
    await expect(page.getByRole('heading', { name: /订单 O20251077777/ })).toBeVisible();
  });
});
