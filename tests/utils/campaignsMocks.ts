import type { Page } from '@playwright/test';

type CampaignStatus = 'draft' | 'published' | 'offline' | 'ended';

interface CampaignRecord {
  campaign_id: string;
  name: string;
  code: string;
  status: CampaignStatus;
  start_time: string;
  end_time: string;
  channels: string[];
  plans: any[];
  scope: {
    companies?: string[];
    cities?: string[];
    stores?: string[];
  };
  form_dsl_id?: string;
  risk_policy_id?: string | null;
  visible_to_roles?: string[];
  require_invite?: boolean;
  metrics?: {
    impressions?: number;
    submitted?: number;
    approved?: number;
    settled?: number;
  };
  offline_note?: string;
}

const campaigns: Record<string, CampaignRecord> = {
  C20251003001: {
    campaign_id: 'C20251003001',
    name: '5G 新装 59 元套餐',
    code: '5G59',
    status: 'draft',
    start_time: '2025-10-05T00:00:00+08:00',
    end_time: '2025-11-05T23:59:59+08:00',
    channels: ['wechat', 'scan'],
    plans: [
      {
        plan_id: 'P1',
        name: '59 元档',
        price: 59.0,
        commission_scheme: { type: 'fixed', value: 10.0 },
        constraints: { new_user_only: true }
      }
    ],
    scope: { cities: ['GZ'], companies: ['华南事业部'], stores: [] },
    form_dsl_id: 'F123',
    risk_policy_id: 'R001',
    visible_to_roles: ['operator', 'promoter'],
    require_invite: true,
    metrics: { impressions: 12800, submitted: 640, approved: 480, settled: 420 }
  },
  C20250915018: {
    campaign_id: 'C20250915018',
    name: '国庆焕新 99 元流量卡',
    code: 'NATDAY99',
    status: 'published',
    start_time: '2025-09-15T00:00:00+08:00',
    end_time: '2025-10-08T23:59:59+08:00',
    channels: ['wechat', 'h5', 'api'],
    plans: [
      {
        plan_id: 'P11',
        name: '99 元合约包',
        price: 99.0,
        commission_scheme: { type: 'percent', value: 12 }
      },
      {
        plan_id: 'P12',
        name: '129 元合约包',
        price: 129.0,
        commission_scheme: {
          type: 'tier',
          tiers: [
            { threshold: 50, value: 15 },
            { threshold: 100, value: 18 }
          ]
        }
      }
    ],
    scope: { cities: ['GZ', 'SZ'], companies: ['华南事业部'], stores: [] },
    form_dsl_id: 'F201',
    risk_policy_id: 'R008',
    visible_to_roles: ['operator', 'promoter', 'store_owner'],
    require_invite: false,
    metrics: { impressions: 35600, submitted: 1890, approved: 1612, settled: 1544 }
  },
  C20240801003: {
    campaign_id: 'C20240801003',
    name: '暑期校园流量包',
    code: 'CAMPUS88',
    status: 'offline',
    start_time: '2025-08-01T00:00:00+08:00',
    end_time: '2025-09-01T23:59:59+08:00',
    channels: ['scan'],
    plans: [
      {
        plan_id: 'P21',
        name: '校园 88 套餐',
        price: 88.0,
        commission_scheme: { type: 'fixed', value: 12.5 }
      }
    ],
    scope: { cities: ['FS'], stores: ['FS001', 'FS002'], companies: [] },
    form_dsl_id: 'F305',
    risk_policy_id: null,
    visible_to_roles: ['promoter'],
    require_invite: false,
    metrics: { impressions: 8700, submitted: 420, approved: 320, settled: 295 },
    offline_note: '返佣策略调整，待新版本发布'
  }
};

function buildListPayload() {
  return {
    total: Object.keys(campaigns).length,
    page: 1,
    page_size: 20,
    items: Object.values(campaigns).map((record) => ({
      campaign_id: record.campaign_id,
      name: record.name,
      code: record.code,
      status: record.status,
      start_time: record.start_time,
      end_time: record.end_time,
      channels: record.channels,
      scope: record.scope,
      metrics: record.metrics
    }))
  };
}

export async function registerCampaignsMocks(page: Page) {
  await page.route('**/api/v1/campaigns?**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(buildListPayload())
    });
  });

  await page.route('**/api/v1/campaigns/C20251003001', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(campaigns.C20251003001) });
  });

  await page.route('**/api/v1/campaigns/C20250915018', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(campaigns.C20250915018) });
  });

  await page.route('**/api/v1/campaigns/C20240801003', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(campaigns.C20240801003) });
  });

  await page.route('**/api/v1/campaigns', async (route) => {
    if (route.request().method() === 'POST') {
      const req = await route.request().postDataJSON();
      const newId = `C${Date.now()}`;
      campaigns[newId] = {
        campaign_id: newId,
        name: req.name,
        code: req.code,
        status: 'draft',
        start_time: req.start_time,
        end_time: req.end_time,
        channels: req.channels || [],
        plans: req.plans || [],
        scope: req.scope || {},
        form_dsl_id: req.form_dsl_id,
        risk_policy_id: req.risk_policy_id,
        visible_to_roles: req.visible_to_roles || [],
        require_invite: req.require_invite,
        metrics: { impressions: 0, submitted: 0, approved: 0, settled: 0 }
      };
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ campaign_id: newId, status: 'draft' })
      });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/campaigns/*', async (route) => {
    const segments = route.request().url().split('/');
    const id = segments.at(-1) as string;
    if (route.request().method() === 'PUT') {
      const payload = await route.request().postDataJSON();
      const record = campaigns[id];
      if (record) {
        campaigns[id] = {
          ...record,
          ...payload,
          campaign_id: id,
          status: record.status
        };
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ campaign_id: id }) });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/campaigns/*/publish', (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    if (campaigns[id]) {
      campaigns[id].status = 'published';
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, new_status: 'published' }) });
  });

  await page.route('**/api/v1/campaigns/*/offline', async (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    const payload = await route.request().postDataJSON();
    if (campaigns[id]) {
      campaigns[id].status = 'offline';
      campaigns[id].offline_note = payload.reason;
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, new_status: 'offline' }) });
  });

  await page.route('**/api/v1/campaigns/*/clone', (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    const source = campaigns[id];
    const newId = `${id}-COPY`;
    campaigns[newId] = {
      ...source,
      campaign_id: newId,
      name: `${source.name}（副本）`,
      code: `${source.code}NEW`.slice(0, 16),
      status: 'draft'
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ campaign_id: newId, status: 'draft', source_campaign_id: id })
    });
  });

  await page.route('**/api/v1/exports/campaigns', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-CAMPAIGN-001', status: 'pending' })
    });
  });
}
