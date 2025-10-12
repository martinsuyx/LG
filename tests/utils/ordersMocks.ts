import type { Page } from '@playwright/test';

const baseList = {
  total: 3,
  page: 1,
  page_size: 20,
  items: [
    {
      order_id: 'O20251001001',
      created_at: '2025-10-01T09:20:00+08:00',
      status: 'under_review',
      channel: 'wechat',
      store_name: '天河一店',
      promoter_name: '张三',
      amount: 129.5,
      settled_amount: null
    },
    {
      order_id: 'O20251001002',
      created_at: '2025-10-01T10:05:00+08:00',
      status: 'pending',
      channel: 'h5',
      store_name: '海珠二店',
      promoter_name: '李四',
      amount: 89.0,
      settled_amount: null
    },
    {
      order_id: 'O20250930098',
      created_at: '2025-09-30T15:18:00+08:00',
      status: 'approved',
      channel: 'scan',
      store_name: '越秀三店',
      promoter_name: '王五',
      amount: 59.0,
      settled_amount: 59.0
    }
  ]
};

const detail = {
  order_id: 'O20251001001',
  created_at: '2025-10-01T09:20:00+08:00',
  status: 'under_review',
  amount: 129.5,
  channel: 'wechat',
  store_id: 'S001',
  campaign_id: 'CAMP-01',
  user: {
    id: 'U1001',
    name: '张三',
    phone: '13800000000',
    id_number: '440100199001011234'
  },
  materials: [
    {
      url: 'https://mock.example/idcard.jpg',
      type: 'idcard',
      ocr: { name: '张三', id_number: '440100199001011234' },
      uploaded_at: '2025-10-01T09:21:00+08:00'
    }
  ],
  commission: 18.0,
  settled_amount: null,
  frozen_amount: 18.0,
  risk_hits: [
    {
      rule_id: 'R001',
      rule_name: '同证件多单',
      level: 'warn',
      desc: '同一证件 24 小时内下单 ≥ 3 笔'
    }
  ],
  audits: [
    {
      time: '2025-10-01T09:20:00+08:00',
      actor: 'user:U1001',
      action: 'submit',
      note: '用户提交订单'
    },
    {
      time: '2025-10-01T09:21:30+08:00',
      actor: 'system',
      action: 'ocr_parsed',
      note: 'OCR 解析完成'
    }
  ]
};

const approvedOnly = {
  total: 1,
  page: 1,
  page_size: 20,
  items: [baseList.items[2]]
};

export async function registerOrdersMocks(page: Page) {
  await page.route('**/api/v1/orders?**', (route) => {
    const url = new URL(route.request().url());
    const statusParams = url.searchParams.getAll('status');
    if (statusParams.includes('approved')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(approvedOnly)
      });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(baseList)
    });
  });

  await page.route('**/api/v1/orders/O20251001001', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail)
    });
  });

  await page.route('**/api/v1/orders/O20251001002', (route) => {
    const secondDetail = {
      ...detail,
      order_id: 'O20251001002',
      status: 'pending',
      amount: 89.0
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(secondDetail)
    });
  });

  await page.route('**/api/v1/orders/O20250930098', (route) => {
    const thirdDetail = {
      ...detail,
      order_id: 'O20250930098',
      status: 'approved',
      amount: 59.0
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(thirdDetail)
    });
  });

  await page.route('**/api/v1/orders/*/actions/review', (route) => {
    const response = {
      ok: true,
      new_status: 'approved',
      processed_ids: [route.request().url().split('/').at(-2)]
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });

  await page.route('**/api/v1/orders/batch_review', async (route) => {
    const request = await route.request().postDataJSON();
    const response = {
      processed_ids: request.ids,
      action: request.action,
      note: request.note
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}
