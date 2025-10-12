import type { Page } from '@playwright/test';

type Metric = 'orders' | 'gmv' | 'settlement' | 'withdraw';
type Dimension = 'campaign' | 'store' | 'promoter';

interface CompareItem {
  id: string;
  name: string;
  metric: number;
}

interface TableRow extends CompareItem {
  orders?: number;
  gmv?: number;
  settlement?: number;
  withdraw?: number;
  approval_rate?: number;
}

const overview = {
  kpis: [
    { key: 'orders', value: 1680, delta: 8.5, trend: 'up', unit: '笔', drill_link: '/orders?status=approved' },
    { key: 'gmv', value: 985430.65, delta: 5.2, trend: 'up', unit: '元', drill_link: '/reports/exports?type=gmv' },
    { key: 'settlement', value: 725840.48, delta: -2.8, trend: 'down', unit: '元', drill_link: '/wallet/summary' },
    { key: 'withdraw', value: 254360.1, delta: 3.1, trend: 'up', unit: '元', drill_link: '/withdraws' },
    { key: 'avg_order_value', value: 587.12, delta: -1.4, trend: 'down', unit: '元', drill_link: '/reports/detail/avg-order' },
    { key: 'approval_rate', value: 0.863, delta: 2.1, trend: 'up', unit: '%', drill_link: '/review' },
    { key: 'risk_hits', value: 324, delta: -6.2, trend: 'down', unit: '笔', drill_link: '/risk/hits' },
    { key: 'ticket_close_rate', value: 0.782, delta: 4.6, trend: 'up', unit: '%', drill_link: '/risk/tickets' },
    { key: 'kyc_pass_rate', value: 0.912, delta: 1.8, trend: 'up', unit: '%', drill_link: '/risk/kyc' }
  ],
  reports: [
    {
      report_key: 'sales_daily',
      title: '销售日报',
      desc: '按门店/渠道拆分的销售与结算明细。',
      route: '/exports?type=sales-daily'
    },
    {
      report_key: 'channel_weekly',
      title: '渠道周报',
      desc: '渠道转化、GMV、成本与 ROI 周度表现。',
      route: '/reports/channel-weekly'
    },
    {
      report_key: 'activity_monthly',
      title: '活动效果月报',
      desc: '活动曝光、下单与转化漏斗。',
      route: '/reports/activity-monthly'
    },
    {
      report_key: 'risk_weekly',
      title: '风控周报',
      desc: '命中、工单与处置效率，对比周度表现。',
      route: '/risk/hits'
    },
    {
      report_key: 'finance_reconcile',
      title: '财务对账报表',
      desc: '订单、提现、分账与平台佣金对账。',
      route: '/wallet/ledger'
    }
  ]
};

const baseSeries: Record<Metric, Array<{ ts: string; value: number; baseline_yesterday?: number; baseline_lastweek?: number }>> = {
  orders: [
    { ts: '2025-09-25', value: 480, baseline_yesterday: 455, baseline_lastweek: 420 },
    { ts: '2025-09-26', value: 502, baseline_yesterday: 480, baseline_lastweek: 430 },
    { ts: '2025-09-27', value: 515, baseline_yesterday: 502, baseline_lastweek: 445 },
    { ts: '2025-09-28', value: 498, baseline_yesterday: 515, baseline_lastweek: 438 },
    { ts: '2025-09-29', value: 526, baseline_yesterday: 498, baseline_lastweek: 450 },
    { ts: '2025-09-30', value: 548, baseline_yesterday: 526, baseline_lastweek: 462 },
    { ts: '2025-10-01', value: 565, baseline_yesterday: 548, baseline_lastweek: 470 }
  ],
  gmv: [
    { ts: '2025-09-25', value: 685430.12, baseline_yesterday: 664200.32, baseline_lastweek: 642180.98 },
    { ts: '2025-09-26', value: 702110.55, baseline_yesterday: 685430.12, baseline_lastweek: 650340.21 },
    { ts: '2025-09-27', value: 718520.21, baseline_yesterday: 702110.55, baseline_lastweek: 658120.34 },
    { ts: '2025-09-28', value: 698120.12, baseline_yesterday: 718520.21, baseline_lastweek: 664310.45 },
    { ts: '2025-09-29', value: 735640.44, baseline_yesterday: 698120.12, baseline_lastweek: 672140.18 },
    { ts: '2025-09-30', value: 752340.81, baseline_yesterday: 735640.44, baseline_lastweek: 680210.05 },
    { ts: '2025-10-01', value: 789540.66, baseline_yesterday: 752340.81, baseline_lastweek: 698214.33 }
  ],
  settlement: [
    { ts: '2025-09-25', value: 68230.12, baseline_yesterday: 70410.32, baseline_lastweek: 65500.98 },
    { ts: '2025-09-26', value: 71540.02, baseline_yesterday: 68230.12, baseline_lastweek: 64820.31 },
    { ts: '2025-09-27', value: 73525.55, baseline_yesterday: 71540.02, baseline_lastweek: 66014.28 },
    { ts: '2025-09-28', value: 70118.43, baseline_yesterday: 73525.55, baseline_lastweek: 67240.03 },
    { ts: '2025-09-29', value: 74890.88, baseline_yesterday: 70118.43, baseline_lastweek: 68110.52 },
    { ts: '2025-09-30', value: 78214.63, baseline_yesterday: 74890.88, baseline_lastweek: 69420.37 },
    { ts: '2025-10-01', value: 82540.97, baseline_yesterday: 78214.63, baseline_lastweek: 71204.66 }
  ],
  withdraw: [
    { ts: '2025-09-25', value: 25210.1, baseline_yesterday: 24120.98, baseline_lastweek: 23500.01 },
    { ts: '2025-09-26', value: 26430.22, baseline_yesterday: 25210.1, baseline_lastweek: 23840.12 },
    { ts: '2025-09-27', value: 27240.88, baseline_yesterday: 26430.22, baseline_lastweek: 24210.45 },
    { ts: '2025-09-28', value: 25860.11, baseline_yesterday: 27240.88, baseline_lastweek: 24540.33 },
    { ts: '2025-09-29', value: 27640.45, baseline_yesterday: 25860.11, baseline_lastweek: 24880.12 },
    { ts: '2025-09-30', value: 28330.76, baseline_yesterday: 27640.45, baseline_lastweek: 25210.98 },
    { ts: '2025-10-01', value: 29240.04, baseline_yesterday: 28330.76, baseline_lastweek: 25860.43 }
  ]
};

const compareByDimension: Record<Dimension, CompareItem[]> = {
  campaign: [
    { id: 'CAMP-202509', name: '开学季大促', metric: 189230.45 },
    { id: 'CAMP-202508', name: '社群团购', metric: 146820.32 },
    { id: 'CAMP-202507', name: '门店引流礼卡', metric: 118540.27 },
    { id: 'CAMP-202506', name: '会员节', metric: 102310.11 },
    { id: 'CAMP-202505', name: '暑期早鸟', metric: 89660.58 }
  ],
  store: [
    { id: 'S001', name: '广州天河一店', metric: 182340.12 },
    { id: 'S002', name: '深圳福田旗舰店', metric: 169450.88 },
    { id: 'S003', name: '上海陆家嘴中心店', metric: 158460.43 }
  ],
  promoter: [
    { id: 'P001', name: '陈可盈', metric: 92540.33 },
    { id: 'P002', name: '李青雯', metric: 88210.45 },
    { id: 'P003', name: '王小刚', metric: 84660.55 }
  ]
};

const tableByDimension: Record<Dimension, TableRow[]> = {
  campaign: [
    {
      id: 'CAMP-202509',
      name: '开学季大促',
      orders: 562,
      gmv: 289540.21,
      settlement: 221340.12,
      withdraw: 93540.44,
      approval_rate: 0.89,
      metric: 221340.12
    },
    {
      id: 'CAMP-202508',
      name: '社群团购',
      orders: 498,
      gmv: 245210.55,
      settlement: 198540.32,
      withdraw: 86540.12,
      approval_rate: 0.91,
      metric: 198540.32
    }
  ],
  store: [
    {
      id: 'S001',
      name: '广州天河一店',
      orders: 420,
      gmv: 228540.34,
      settlement: 182340.12,
      withdraw: 80210.77,
      approval_rate: 0.88,
      metric: 182340.12
    },
    {
      id: 'S002',
      name: '深圳福田旗舰店',
      orders: 386,
      gmv: 205110.55,
      settlement: 169450.88,
      withdraw: 75640.22,
      approval_rate: 0.91,
      metric: 169450.88
    },
    {
      id: 'S003',
      name: '上海陆家嘴中心店',
      orders: 362,
      gmv: 196530.21,
      settlement: 158460.43,
      withdraw: 70215.33,
      approval_rate: 0.87,
      metric: 158460.43
    }
  ],
  promoter: [
    {
      id: 'P001',
      name: '陈可盈',
      orders: 268,
      gmv: 128540.12,
      settlement: 98540.78,
      withdraw: 38210.44,
      approval_rate: 0.9,
      metric: 98540.78
    },
    {
      id: 'P002',
      name: '李青雯',
      orders: 244,
      gmv: 118210.33,
      settlement: 94210.12,
      withdraw: 35210.55,
      approval_rate: 0.92,
      metric: 94210.12
    }
  ]
};

export async function registerReportsMocks(page: Page) {
  await page.route('**/api/v1/reports/overview**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(overview)
    });
  });

  await page.route('**/api/v1/reports/series**', (route) => {
    const url = new URL(route.request().url());
    const metric = (url.searchParams.get('metric') as Metric) || 'settlement';
    const points = baseSeries[metric] ?? baseSeries.settlement;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ metric, points })
    });
  });

  await page.route('**/api/v1/reports/compare**', (route) => {
    const url = new URL(route.request().url());
    const dimension = (url.searchParams.get('dimension') as Dimension) || 'campaign';
    const metric = (url.searchParams.get('metric') as Metric) || 'settlement';
    const items = compareByDimension[dimension] ?? compareByDimension.campaign;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ dimension, metric, items })
    });
  });

  await page.route('**/api/v1/reports/table**', (route) => {
    const url = new URL(route.request().url());
    const dimension = (url.searchParams.get('dimension') as Dimension) || 'campaign';
    const items = tableByDimension[dimension] ?? tableByDimension.campaign;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total: items.length,
        page: Number(url.searchParams.get('page') ?? '1'),
        page_size: Number(url.searchParams.get('page_size') ?? '20'),
        items
      })
    });
  });

  await page.route('**/api/v1/reports/export**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-REPORTS-UI-001', status: 'pending', module: 'reports-overview' })
    });
  });
}
