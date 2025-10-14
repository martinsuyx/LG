import type { Page } from '@playwright/test';

type PercentCommission = { type: 'percent'; value: number };
type CommissionValue = PercentCommission;

type CommissionCaps = {
  min?: number | null;
  max?: number | null;
  allow_override?: boolean;
  summary?: string;
};

type CommissionMember = {
  member_id: string;
  member_name: string;
  role: string;
  commission_default: CommissionValue;
  commission_effective: CommissionValue;
  commission_override?: CommissionValue | null;
  override_source?: string | null;
  caps?: CommissionCaps;
};

type CommissionListState = {
  campaign: { id: string; name: string };
  plan: { id: string; name: string; default_commission: CommissionValue };
  rule_caps: CommissionCaps;
  campaign_options: Array<{ id: string; name: string }>;
  plan_options: Array<{ id: string; name: string }>;
  items: CommissionMember[];
};

const capsRule: CommissionCaps = { min: 5, max: 25, allow_override: true, summary: '≥5%，≤25%' };

const previewDiffs = [
  {
    member_id: 'U1001',
    before: { type: 'percent', value: 14 },
    after: { type: 'percent', value: 18 }
  },
  {
    member_id: 'U1002',
    before: { type: 'percent', value: 15 },
    after: { type: 'percent', value: 17 }
  }
];

const state: CommissionListState = {
  campaign: { id: 'C1', name: '九月新客拉新' },
  plan: { id: 'P1', name: '尊享套餐', default_commission: { type: 'percent', value: 12 } },
  rule_caps: capsRule,
  campaign_options: [
    { id: 'C1', name: '九月新客拉新' },
    { id: 'C2', name: '十月复购激励' }
  ],
  plan_options: [
    { id: 'P1', name: '尊享套餐' },
    { id: 'P2', name: '基础套餐' }
  ],
  items: [
    {
      member_id: 'U1001',
      member_name: '张三',
      role: 'promoter',
      commission_default: { type: 'percent', value: 12 },
      commission_effective: { type: 'percent', value: 12 },
      commission_override: null,
      override_source: 'default',
      caps: { ...capsRule }
    },
    {
      member_id: 'U1002',
      member_name: '李四',
      role: 'staff',
      commission_default: { type: 'percent', value: 12 },
      commission_effective: { type: 'percent', value: 15 },
      commission_override: { type: 'percent', value: 15 },
      override_source: 'team',
      caps: { ...capsRule }
    }
  ]
};

let lastPreviewDiffs = previewDiffs;
let pendingImportTaskId: string | null = null;
let pendingImportPolls = 0;

function cloneCommission(value: CommissionValue): CommissionValue {
  return JSON.parse(JSON.stringify(value));
}

function updateMemberCommission(memberId: string, commission: CommissionValue, source: string) {
  state.items = state.items.map((item) => {
    if (item.member_id !== memberId) return item;
    const next = cloneCommission(commission);
    return {
      ...item,
      commission_effective: next,
      commission_override: next,
      override_source: source
    };
  });
}

function clearMemberCommission(memberId: string) {
  state.items = state.items.map((item) => {
    if (item.member_id !== memberId) return item;
    return {
      ...item,
      commission_effective: cloneCommission(item.commission_default),
      commission_override: null,
      override_source: 'default'
    };
  });
}

function applyDiffs(diffs: typeof previewDiffs) {
  diffs.forEach((diff) => {
    updateMemberCommission(diff.member_id, diff.after, 'team');
  });
}

function computeCompletion(items: CommissionMember[]): number {
  if (!items.length) return 0;
  const configured = items.filter((item) => item.override_source && item.override_source !== 'default').length;
  return configured / items.length;
}

function buildListResponse(params: URLSearchParams) {
  const page = Math.max(Number(params.get('page') || '1'), 1);
  const pageSize = Math.max(Math.min(Number(params.get('page_size') || '50'), 200), 1);
  const keyword = (params.get('q') || '').trim().toLowerCase();
  const source = keyword
    ? state.items.filter((item) => {
        const target = `${item.member_name}${item.member_id}`.toLowerCase();
        return target.includes(keyword);
      })
    : state.items;
  const start = (page - 1) * pageSize;
  const paged = source.slice(start, start + pageSize);
  return {
    total: source.length,
    page,
    page_size: pageSize,
    completion_rate: computeCompletion(source),
    rule_caps: state.rule_caps,
    campaign: state.campaign,
    plan: state.plan,
    campaign_options: state.campaign_options,
    plan_options: state.plan_options,
    items: paged
  };
}

export async function registerTeamCommissionMocks(page: Page) {
  await page.route('**/api/v1/teams/T001/commissions?**', (route) => {
    const url = new URL(route.request().url());
    const body = buildListResponse(url.searchParams);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route('**/api/v1/teams/T001/commissions', (route) => {
    const url = new URL(route.request().url());
    const body = buildListResponse(url.searchParams);
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route('**/api/v1/commission/override', async (route) => {
    if (route.request().method() === 'POST') {
      const payload = await route.request().postDataJSON();
      updateMemberCommission(payload.entity_id, payload.commission, payload.entity_type === 'promoter' ? 'promoter' : 'team');
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, entity_id: payload.entity_id, entity_type: payload.entity_type, commission: payload.commission })
      });
      return;
    }
    const url = new URL(route.request().url());
    const entityId = url.searchParams.get('entity_id');
    if (entityId) {
      clearMemberCommission(entityId);
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, entity_id: entityId })
    });
  });

  await page.route('**/api/v1/commission/batch_override', async (route) => {
    const payload = await route.request().postDataJSON();
    const items = Array.isArray(payload.items) ? payload.items : [];
    items.forEach((item: { entity_id: string; commission: CommissionValue }) => {
      updateMemberCommission(item.entity_id, item.commission, 'team');
    });
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, total: items.length, succeeded: items.length, failed: 0, conflicts: [] })
    });
  });

  await page.route('**/api/v1/commission/import', async (route) => {
    const taskId = 'T20251015001';
    pendingImportTaskId = taskId;
    pendingImportPolls = 0;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ task_id: taskId, status: 'accepted' })
    });
  });

  await page.route('**/api/v1/commission/import/*', (route) => {
    const taskId = route.request().url().split('/').pop() || 'task';
    let status = 'processing';
    if (pendingImportTaskId && taskId === pendingImportTaskId) {
      status = pendingImportPolls > 0 ? 'succeeded' : 'processing';
      pendingImportPolls += 1;
      if (status === 'succeeded') {
        pendingImportTaskId = null;
      }
    }
    const body = {
      task_id: taskId,
      status,
      processed: status === 'succeeded' ? state.items.length : 0,
      total: state.items.length,
      success_count: status === 'succeeded' ? state.items.length : 0,
      failed_count: 0,
      result_url: 'https://mock/commission/import/result.csv',
      errors_url: 'https://mock/commission/import/errors.csv',
      message: status === 'succeeded' ? '导入成功：全部成员已更新' : '任务处理中'
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route('**/api/v1/commission/copy_from', async (route) => {
    const payload = await route.request().postDataJSON();
    if (payload.preview) {
      lastPreviewDiffs = previewDiffs;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ preview: true, message: '来自历史活动的佣金规则差异预览', diffs: lastPreviewDiffs })
      });
      return;
    }
    applyDiffs(lastPreviewDiffs);
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ preview: false, applied: true, message: '规则已复制应用', diffs: lastPreviewDiffs })
    });
  });
}
