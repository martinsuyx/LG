import type { Page } from '@playwright/test';

export const overviewMock = {
  kpis: [
    {
      key: 'orders_today',
      label: '今日订单数',
      value: 128,
      delta: 12,
      delta_rate: 0.103,
      trend: 'up',
      unit: '笔',
      drill_link: '/orders?start=2025-09-28&end=2025-09-28'
    },
    {
      key: 'settlement_today',
      label: '今日结算金额',
      value: 5234.9,
      delta: -120.5,
      delta_rate: -0.022,
      trend: 'down',
      unit: '元',
      drill_link: '/wallet/ledger?date=2025-09-28'
    },
    {
      key: 'pending_reviews',
      label: '待审核订单',
      value: 41,
      unit: '笔',
      drill_link: '/review'
    },
    {
      key: 'risk_hits',
      label: '异常命中',
      value: 3,
      unit: '笔',
      drill_link: '/risk/hits'
    },
    {
      key: 'payout_processing',
      label: '提现处理中',
      value: 5,
      unit: '笔',
      drill_link: '/withdraws?status=processing'
    },
    {
      key: 'approval_rate',
      label: '通过率',
      value: 86.4,
      delta_rate: 0.018,
      trend: 'up',
      unit: '%',
      drill_link: '/orders?status=approved'
    }
  ],
  alerts: [
    {
      type: 'risk',
      level: 'warn',
      title: '风控命中上升',
      description: '近一小时+35%',
      action_link: '/risk/hits'
    }
  ]
};

export const seriesMock = {
  metric: 'orders',
  points: [
    {
      ts: '2025-09-26T00:00:00+08:00',
      value: 96,
      baseline_yesterday: 92,
      baseline_lastweek: 80
    },
    {
      ts: '2025-09-27T00:00:00+08:00',
      value: 110,
      baseline_yesterday: 96,
      baseline_lastweek: 85
    },
    {
      ts: '2025-09-28T00:00:00+08:00',
      value: 120,
      baseline_yesterday: 110,
      baseline_lastweek: 98
    }
  ]
};

export const compareMock = {
  metrics: [
    {
      key: 'orders',
      label: '订单量',
      current: 356,
      previous: 320,
      change: 36,
      change_rate: 0.1125
    },
    {
      key: 'gmv',
      label: '结算金额',
      current: 15640.5,
      previous: 14980.2,
      change: 660.3,
      change_rate: 0.044
    },
    {
      key: 'approval_rate',
      label: '通过率',
      current: 0.864,
      previous: 0.845,
      change: 0.019,
      change_rate: 0.0225
    }
  ]
};

type DashboardMockOverrides = Partial<{
  overview: typeof overviewMock;
  series: typeof seriesMock;
  compare: typeof compareMock;
}>;

export async function registerDashboardMocks(
  page: Page,
  overrides: DashboardMockOverrides = {}
) {
  const headers = {
    'access-control-allow-origin': '*',
    'access-control-allow-credentials': 'true',
    'content-type': 'application/json'
  };

  await page.route('**/api/v1/dashboard/**', (route) => {
    if (route.request().method() === 'OPTIONS') {
      route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': '*',
          'access-control-allow-credentials': 'true',
          'access-control-allow-methods': 'GET,OPTIONS',
          'access-control-allow-headers': '*'
        }
      });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/dashboard/overview**', (route) => {
    route.fulfill({
      status: 200,
      headers,
      body: JSON.stringify(overrides.overview ?? overviewMock)
    });
  });

  await page.route('**/api/v1/dashboard/series**', (route) => {
    route.fulfill({
      status: 200,
      headers,
      body: JSON.stringify(overrides.series ?? seriesMock)
    });
  });

  await page.route('**/api/v1/dashboard/compare**', (route) => {
    route.fulfill({
      status: 200,
      headers,
      body: JSON.stringify(overrides.compare ?? compareMock)
    });
  });
}
