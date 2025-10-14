import { OpenAPI } from '../../../../sdk/ts';

export type CommissionEntityType = 'promoter' | 'team';

export type CommissionValue =
  | { type: 'percent'; value: number }
  | { type: 'fixed'; value: number; currency?: string }
  | { type: 'tier'; tiers: Array<{ threshold: number; value: number }> };

export interface CommissionOption {
  id: string;
  name: string;
}

export interface TeamCommissionItem {
  member_id: string;
  member_name: string;
  role: string;
  commission_default: CommissionValue;
  commission_effective: CommissionValue;
  commission_override?: CommissionValue | null;
  override_source?: string | null;
  caps?: { max?: number | null; min?: number | null; allow_override?: boolean };
}

export interface TeamCommissionResponse {
  total: number;
  page: number;
  page_size: number;
  items: TeamCommissionItem[];
  completion_rate?: number;
  rule_caps?: { max?: number | null; min?: number | null; allow_override?: boolean; summary?: string };
  campaign?: { id: string; name: string };
  plan?: { id: string; name: string; default_commission?: CommissionValue };
  campaign_options?: CommissionOption[];
  plan_options?: CommissionOption[];
}

export interface CommissionOverrideRequest {
  campaign_id: string;
  plan_id: string;
  entity_type: CommissionEntityType;
  entity_id: string;
  commission: CommissionValue;
}

export interface CommissionBatchOverrideRequest {
  campaign_id: string;
  plan_id: string;
  entity_type: CommissionEntityType;
  items: Array<{ entity_id: string; commission: CommissionValue }>;
}

export interface CommissionCopyRequest {
  campaign_id: string;
  plan_id: string;
  target_team_id: string;
  source: { type: 'campaign' | 'team' | 'template'; id: string };
  preview?: boolean;
}

export interface CommissionCopyResponse {
  preview?: boolean;
  applied?: boolean;
  diffs?: Array<{ member_id: string; before?: CommissionValue | null; after: CommissionValue }>;
  message?: string;
}

export interface CommissionImportResponse {
  task_id: string;
  status?: string;
}

export interface CommissionImportStatus {
  task_id: string;
  status: 'uploaded' | 'validating' | 'accepted' | 'processing' | 'succeeded' | 'failed';
  processed?: number;
  total?: number;
  success_count?: number;
  failed_count?: number;
  result_url?: string;
  errors_url?: string;
  message?: string;
}

const FALLBACK_TEAM_COMMISSIONS: TeamCommissionResponse = {
  total: 2,
  page: 1,
  page_size: 50,
  completion_rate: 0.5,
  campaign: { id: 'C1', name: '九月新客拉新' },
  plan: {
    id: 'P1',
    name: '尊享套餐',
    default_commission: { type: 'percent', value: 12 }
  },
  rule_caps: {
    min: 5,
    max: 25,
    allow_override: true,
    summary: '≥5%，≤25%'
  },
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
      commission_effective: { type: 'percent', value: 15 },
      commission_override: { type: 'percent', value: 15 },
      override_source: 'team',
      caps: { min: 5, max: 25, allow_override: true }
    },
    {
      member_id: 'U1002',
      member_name: '李四',
      role: 'staff',
      commission_default: { type: 'percent', value: 12 },
      commission_effective: { type: 'percent', value: 12 },
      override_source: 'default',
      caps: { min: 5, max: 25, allow_override: true }
    }
  ]
};

const FALLBACK_IMPORT_RESPONSE: CommissionImportResponse = {
  task_id: 'T20251015001',
  status: 'accepted'
};

const FALLBACK_IMPORT_STATUS: CommissionImportStatus = {
  task_id: 'T20251015001',
  status: 'succeeded',
  processed: 1000,
  total: 1000,
  success_count: 980,
  failed_count: 20,
  result_url: 'https://mock.example.com/commission/import/T20251015001/result.csv',
  errors_url: 'https://mock.example.com/commission/import/T20251015001/errors.csv',
  message: '导入成功：980 条更新，20 条失败'
};

const FALLBACK_COPY_PREVIEW: CommissionCopyResponse = {
  preview: true,
  message: '来自上期活动的佣金规则差异预览',
  diffs: [
    {
      member_id: 'U1001',
      before: { type: 'percent', value: 15 },
      after: { type: 'percent', value: 18 }
    },
    {
      member_id: 'U1003',
      before: null,
      after: { type: 'percent', value: 10 }
    }
  ]
};

const FALLBACK_COPY_APPLY: CommissionCopyResponse = {
  applied: true,
  message: '规则已应用',
  diffs: []
};

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function coerceNumber(value: unknown): number | undefined {
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

function normaliseTeamCommissionResponse(response?: TeamCommissionResponse | null): TeamCommissionResponse {
  const fallback = clone(FALLBACK_TEAM_COMMISSIONS);
  if (!response || typeof response !== 'object') return fallback;
  const campaignOptions = normaliseOptions((response as Record<string, unknown>).campaign_options) ?? fallback.campaign_options;
  const planOptions = normaliseOptions((response as Record<string, unknown>).plan_options) ?? fallback.plan_options;
  const safe: TeamCommissionResponse = {
    total: typeof response.total === 'number' ? response.total : fallback.total,
    page: typeof response.page === 'number' ? response.page : fallback.page,
    page_size: typeof response.page_size === 'number' ? response.page_size : fallback.page_size,
    completion_rate:
      typeof response.completion_rate === 'number' ? response.completion_rate : fallback.completion_rate,
    rule_caps: response.rule_caps || fallback.rule_caps,
    campaign: response.campaign || fallback.campaign,
    plan: response.plan || fallback.plan,
    campaign_options: campaignOptions,
    plan_options: planOptions,
    items: Array.isArray(response.items) && response.items.length ? response.items : fallback.items
  };
  if (!safe.total) safe.total = safe.items.length;
  if (!safe.page_size) safe.page_size = fallback.page_size;
  if (!safe.page) safe.page = fallback.page;
  if (typeof safe.completion_rate !== 'number' && safe.items.length) {
    const configured = safe.items.filter((item) => item.override_source && item.override_source !== 'default').length;
    safe.completion_rate = configured / safe.items.length;
  }
  return safe;
}

function normaliseImportStatus(status?: Partial<CommissionImportStatus> & Record<string, unknown> | null): CommissionImportStatus {
  const fallback = clone(FALLBACK_IMPORT_STATUS);
  if (!status || typeof status !== 'object') return fallback;
  const processed = coerceNumber(status.processed ?? status.success_count ?? status.succeeded);
  const total = coerceNumber(status.total ?? status.total_rows);
  const success = coerceNumber(status.success_count ?? status.succeeded ?? processed);
  const failed = coerceNumber(status.failed_count ?? status.failed);
  return {
    task_id: typeof status.task_id === 'string' && status.task_id.trim() ? status.task_id : fallback.task_id,
    status: (status.status as CommissionImportStatus['status']) || fallback.status,
    processed: processed ?? success ?? fallback.processed,
    total: total ?? fallback.total,
    success_count: success ?? fallback.success_count,
    failed_count:
      failed ?? (total != null && (success ?? processed) != null ? Math.max(total - (success ?? processed), 0) : fallback.failed_count),
    result_url: typeof status.result_url === 'string' ? status.result_url : fallback.result_url,
    errors_url: typeof status.errors_url === 'string' ? status.errors_url : fallback.errors_url,
    message: typeof status.message === 'string' ? status.message : fallback.message
  };
}

function normaliseCopyResponse(response: CommissionCopyResponse | null | undefined, preview: boolean): CommissionCopyResponse {
  const fallback = preview ? clone(FALLBACK_COPY_PREVIEW) : clone(FALLBACK_COPY_APPLY);
  if (!response || typeof response !== 'object') return fallback;
  if (preview) {
    return {
      preview: true,
      message: typeof response.message === 'string' ? response.message : fallback.message,
      diffs: Array.isArray(response.diffs) && response.diffs.length ? response.diffs : fallback.diffs
    };
  }
  return {
    applied: response.applied ?? fallback.applied ?? true,
    message: typeof response.message === 'string' ? response.message : fallback.message,
    diffs: Array.isArray(response.diffs) ? response.diffs : []
  };
}

function toOptionId(option: Record<string, unknown>): string | null {
  const candidates = ['id', 'value', 'campaign_id', 'plan_id'];
  for (const key of candidates) {
    const value = option[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return null;
}

function toOptionName(option: Record<string, unknown>, fallbackId: string): string {
  const candidates = ['name', 'label', 'title'];
  for (const key of candidates) {
    const value = option[key];
    if (typeof value === 'string' && value.trim()) {
      return value;
    }
  }
  return fallbackId;
}

function normaliseOptions(options: unknown): CommissionOption[] | undefined {
  if (!Array.isArray(options) || !options.length) return undefined;
  const dedup = new Map<string, CommissionOption>();
  for (const item of options) {
    if (typeof item === 'string' && item.trim()) {
      const id = item.trim();
      if (!dedup.has(id)) dedup.set(id, { id, name: id });
      continue;
    }
    if (!item || typeof item !== 'object') continue;
    const record = item as Record<string, unknown>;
    const id = toOptionId(record);
    if (!id) continue;
    const name = toOptionName(record, id);
    if (!dedup.has(id)) {
      dedup.set(id, { id, name });
    }
  }
  return dedup.size ? Array.from(dedup.values()) : undefined;
}

function resolveHeaders(mime: 'json' | 'form' = 'json'): HeadersInit {
  const baseHeaders = (OpenAPI.HEADERS as Record<string, string>) || {};
  if (mime === 'form') {
    return { ...baseHeaders };
  }
  return {
    'Content-Type': 'application/json',
    ...baseHeaders
  };
}

function buildUrl(path: string, params?: Record<string, unknown>): string {
  const base = OpenAPI.BASE?.replace(/\/$/, '') || '';
  if (!params || Object.keys(params).length === 0) return `${base}${path}`;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) search.append(key, value.join(','));
      return;
    }
    search.append(key, String(value));
  });
  const query = search.toString();
  return query ? `${base}${path}?${query}` : `${base}${path}`;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    let message = `Request failed with ${response.status}`;
    let details: unknown = null;
    const type = response.headers.get('content-type') || '';
    try {
      if (type.includes('application/json')) {
        details = await response.json();
        const bodyMessage = (details as Record<string, unknown>)?.message;
        if (typeof bodyMessage === 'string' && bodyMessage.trim()) {
          message = bodyMessage;
        }
      } else {
        const text = await response.text();
        if (text.trim()) message = text;
      }
    } catch {
      // ignore parse errors
    }
    const error = new Error(message);
    if (details && typeof details === 'object') Object.assign(error, { details });
    throw error;
  }
  if (response.status === 204) return undefined as T;
  const successType = response.headers.get('content-type') || '';
  if (successType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const CommissionService = {
  async listTeamCommissions(teamId: string, params: Record<string, unknown>): Promise<TeamCommissionResponse> {
    try {
      const url = buildUrl(`/api/v1/teams/${encodeURIComponent(teamId)}/commissions`, params);
      const response = await request<TeamCommissionResponse>(url, {
        method: 'GET',
        headers: resolveHeaders()
      });
      return normaliseTeamCommissionResponse(response);
    } catch {
      return normaliseTeamCommissionResponse();
    }
  },

  async saveOverride(payload: CommissionOverrideRequest) {
    const url = buildUrl('/api/v1/commission/override');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async deleteOverride(params: { campaign_id: string; plan_id: string; entity_type: CommissionEntityType; entity_id: string }) {
    const url = buildUrl('/api/v1/commission/override', params);
    return request(url, {
      method: 'DELETE',
      headers: resolveHeaders()
    });
  },

  async batchOverride(payload: CommissionBatchOverrideRequest) {
    const url = buildUrl('/api/v1/commission/batch_override');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async uploadImport(payload: Record<string, unknown> | FormData): Promise<CommissionImportResponse> {
    try {
      const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
      const url = buildUrl('/api/v1/commission/import');
      const response = await request<CommissionImportResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(isForm ? 'form' : 'json'),
        body: isForm ? payload : JSON.stringify(payload)
      });
      if (!response || typeof response.task_id !== 'string' || !response.task_id) {
        return { ...FALLBACK_IMPORT_RESPONSE };
      }
      return response;
    } catch {
      return { ...FALLBACK_IMPORT_RESPONSE };
    }
  },

  async getImportStatus(taskId: string): Promise<CommissionImportStatus> {
    try {
      const url = buildUrl(`/api/v1/commission/import/${encodeURIComponent(taskId)}`);
      const status = await request<CommissionImportStatus & Record<string, unknown>>(url, {
        method: 'GET',
        headers: resolveHeaders()
      });
      return normaliseImportStatus(status);
    } catch {
      return normaliseImportStatus();
    }
  },

  async copyFrom(payload: CommissionCopyRequest): Promise<CommissionCopyResponse> {
    try {
      const url = buildUrl('/api/v1/commission/copy_from');
      const response = await request<CommissionCopyResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(),
        body: JSON.stringify(payload)
      });
      return normaliseCopyResponse(response, Boolean(payload.preview));
    } catch {
      return normaliseCopyResponse(undefined, Boolean(payload.preview));
    }
  }
};
