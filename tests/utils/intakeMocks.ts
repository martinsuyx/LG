import type { Page } from '@playwright/test';

type SubmitInspector = {
  getLastSubmit: () => any;
};

function buildUploadsResponse(count: number, prefix: string) {
  return Array.from({ length: count }).map((_, index) => {
    const id = `${prefix}-${index + 1}`;
    return {
      file_id: id,
      upload_url: `https://mock.storage/${prefix}/${id}`
    };
  });
}

export async function registerAiIntakeMocks(page: Page): Promise<SubmitInspector> {
  let uploadCounter = 0;
  let statusRequestCount = 0;
  let lastSubmit: any = null;
  const jobId = 'J20251003001';
  const orderId = 'O20251088888';

  await page.route('**/api/v1/uploads', async (route) => {
    const request = await route.request().postDataJSON();
    const uploads = buildUploadsResponse(request.files?.length || 0, `ai-upload-${++uploadCounter}`);
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ uploads })
    });
  });

  await page.route('https://mock.storage/**', (route) => {
    route.fulfill({ status: 200, body: '' });
  });

  await page.route('**/api/v1/orders/ai-intake', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_id: jobId })
      });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/orders/ai-intake/*', (route) => {
    statusRequestCount += 1;
    const payload =
      statusRequestCount < 2
        ? {
            job_id: jobId,
            status: 'parsing',
            fields: []
          }
        : {
            job_id: jobId,
            status: 'parsed',
            fields: [
              { key: 'name', value: '张三', confidence: 0.95, editable: true },
              { key: 'phone', value: '13800000000', confidence: 0.92, editable: true },
              { key: 'id_number', value: '4401********1234', confidence: 0.88, editable: true },
              { key: 'store_id', value: 'S001', confidence: 0.75, editable: true },
              { key: 'campaign_id', value: 'CAMP-01', confidence: 0.78, editable: true },
              { key: 'amount', value: '59.00', confidence: 0.62, editable: true }
            ]
          };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload)
    });
  });

  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') {
      lastSubmit = await route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ order_id: orderId, status: 'pending' })
      });
      return;
    }
    route.fallback();
  });

  await page.route(`**/api/v1/orders/${orderId}`, (route) => {
    const detail = {
      order_id: orderId,
      created_at: '2025-10-03T10:00:00+08:00',
      status: 'pending',
      amount: 88.0,
      channel: 'offline',
      store_id: 'S001',
      campaign_id: 'CAMP-01',
      user: {
        name: '张三',
        phone: '13800000000',
        id_number: '4401********1234'
      },
      materials: [],
      audits: []
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail)
    });
  });

  return {
    getLastSubmit: () => lastSubmit
  };
}

export async function registerManualIntakeMocks(page: Page): Promise<SubmitInspector> {
  let uploadCounter = 0;
  let lastSubmit: any = null;
  const orderId = 'O20251077777';

  await page.route('**/api/v1/uploads', async (route) => {
    const request = await route.request().postDataJSON();
    const uploads = buildUploadsResponse(request.files?.length || 0, `manual-upload-${++uploadCounter}`);
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ uploads })
    });
  });

  await page.route('https://mock.storage/**', (route) => {
    route.fulfill({ status: 200, body: '' });
  });

  await page.route('**/api/v1/orders', async (route) => {
    if (route.request().method() === 'POST') {
      lastSubmit = await route.request().postDataJSON();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ order_id: orderId, status: 'pending' })
      });
      return;
    }
    route.fallback();
  });

  await page.route(`**/api/v1/orders/${orderId}`, (route) => {
    const detail = {
      order_id: orderId,
      created_at: '2025-10-05T09:00:00+08:00',
      status: 'pending',
      amount: 129.9,
      channel: 'offline',
      store_id: 'S002',
      campaign_id: 'CAMP-02',
      user: {
        name: '李四',
        phone: '13900000000',
        id_number: '4401********5678'
      },
      materials: [],
      audits: []
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail)
    });
  });

  return {
    getLastSubmit: () => lastSubmit
  };
}
