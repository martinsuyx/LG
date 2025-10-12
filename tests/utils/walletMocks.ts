import type { Page } from '@playwright/test';

const summaryOverview = {
  total_balance: 1254321.55,
  frozen: 23456.78,
  available: 1230864.77,
  withdrawable: 560000,
  in_7d: 210345.66,
  out_7d: 198765.43
};

const summaryList = {
  total: 2,
  page: 1,
  page_size: 20,
  items: [
    {
      entity_id: 'S001',
      entity_name: '天河一店',
      balance: 12500.5,
      frozen: 500.0,
      available: 12000.5,
      withdrawable: 8000.0,
      last_tx_time: '2025-10-02T20:18:00+08:00',
      status: 'normal'
    },
    {
      entity_id: 'S002',
      entity_name: '海珠二店',
      balance: 9900.0,
      frozen: 100.0,
      available: 9800.0,
      withdrawable: 6000.0,
      last_tx_time: '2025-10-02T20:05:00+08:00',
      status: 'normal'
    }
  ]
};

const seriesBalance = {
  metric: 'balance',
  points: [
    { ts: '2025-09-27', balance: 1205000 },
    { ts: '2025-09-28', balance: 1210000 },
    { ts: '2025-09-29', balance: 1213500 },
    { ts: '2025-09-30', balance: 1218800 }
  ]
};

const seriesInOut = {
  metric: 'in_out',
  points: [
    { ts: '2025-09-27', inflow: 32500, outflow: 28000 },
    { ts: '2025-09-28', inflow: 41230, outflow: 30500 },
    { ts: '2025-09-29', inflow: 39800, outflow: 36780 },
    { ts: '2025-09-30', inflow: 45210, outflow: 39020 }
  ]
};

const ledgerStats = {
  in_total: 52340.0,
  out_total: 38900.0,
  net: 13440.0
};

const ledgerList = {
  total: 2350,
  page: 1,
  page_size: 20,
  items: [
    {
      tx_id: 'T20251003001',
      created_at: '2025-10-03T10:00:00+08:00',
      entity_name: '天河一店',
      tx_type: 'order_settlement',
      order_id: 'O20251003001',
      amount: 59.0,
      balance_after: 12059.0,
      status: 'success',
      note: '订单佣金入账'
    },
    {
      tx_id: 'T20251003002',
      created_at: '2025-10-03T10:20:00+08:00',
      entity_name: '天河一店',
      tx_type: 'freeze',
      order_id: null,
      amount: -2000.0,
      balance_after: 10059.0,
      status: 'success',
      note: '提现申请冻结'
    }
  ]
};

const withdrawStats = {
  pending_total: 100000,
  paid_today: 50000,
  failed_count: 2
};

const withdrawList = {
  total: 3,
  page: 1,
  page_size: 20,
  items: [
    {
      withdraw_id: 'W20251003001',
      created_at: '2025-10-03T09:00:00+08:00',
      entity_name: '天河一店',
      amount: 5000,
      channel: 'bank',
      account_info: '中国银行(1234)',
      status: 'pending',
      note: ''
    },
    {
      withdraw_id: 'W20251003002',
      created_at: '2025-10-03T09:30:00+08:00',
      entity_name: '海珠二店',
      amount: 3200,
      channel: 'alipay',
      account_info: '支付宝(***8888)',
      status: 'processing',
      note: '等待银行确认'
    },
    {
      withdraw_id: 'W20251002088',
      created_at: '2025-10-02T15:00:00+08:00',
      entity_name: '越秀三店',
      amount: 2800,
      channel: 'wechat',
      account_info: '微信(***1234)',
      status: 'succeeded',
      note: '已出款'
    }
  ]
};

export async function registerWalletMocks(page: Page) {
  await page.route('**/api/v1/wallet/summary/overview**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(summaryOverview) });
  });

  await page.route('**/api/v1/wallet/summary/series**', (route) => {
    const metric = new URL(route.request().url()).searchParams.get('metric');
    const body = metric === 'in_out' ? seriesInOut : seriesBalance;
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route('**/api/v1/wallet/summary/list**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(summaryList) });
  });

  await page.route('**/api/v1/wallet/ledger/stats**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ledgerStats) });
  });

  await page.route('**/api/v1/wallet/ledger**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ledgerList) });
  });

  await page.route('**/api/v1/withdraws/stats**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(withdrawStats) });
  });

  await page.route('**/api/v1/withdraws?**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(withdrawList) });
  });

  await page.route('**/api/v1/withdraws/*/approve', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, new_status: 'processing' })
    });
  });

  await page.route('**/api/v1/withdraws/*/reject', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, new_status: 'rejected' })
    });
  });

  await page.route('**/api/v1/exports/wallet-summary', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'E20251003001' })
    });
  });

  await page.route('**/api/v1/exports/wallet-ledger', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'E20251003002' })
    });
  });

  await page.route('**/api/v1/exports/withdraws', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'E20251003003' })
    });
  });
}
