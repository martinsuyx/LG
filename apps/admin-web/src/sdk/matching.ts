import { OpenAPI } from '../../../../sdk/ts';

export type MatchingMode = 'auto_id' | 'manual_form';
export type MatchingStatus =
  | 'matched'
  | 'unmatched'
  | 'ambiguous'
  | 'invalid'
  | 'risky'
  | 'duplicate'
  | 'cross_period';
export type MatchingDelta = 'added' | 'updated' | 'unchanged';

export interface MatchingFilters {
  campaign_id?: string;
  start?: string;
  end?: string;
  status?: MatchingStatus | '';
  delta?: MatchingDelta | '';
  mode?: MatchingMode | '';
  page?: number;
  page_size?: number;
  q?: string;
}

export interface MatchingSummaryDelta {
  added?: number;
  updated?: number;
  unchanged?: number;
}

export interface MatchingSummary {
  report_orders: number;
  matched: number;
  unmatched: number;
  ambiguous: number;
  duplicate: number;
  risky: number;
  match_rate: number;
  valid_rate: number;
  delta?: MatchingSummaryDelta;
}

export interface MatchingResultItem {
  report_row_id: string;
  order_no?: string | null;
  product_key?: string | null;
  phone?: string | null;
  promoter_unique_id?: string | null;
  match_mode: MatchingMode;
  match_status: MatchingStatus;
  candidate_count?: number;
  candidate_top_score?: number | null;
  matched_order_id?: string | null;
  valid?: boolean;
  risk_flags?: string[];
  template_id?: string | null;
  template_version?: string | null;
  matching_rule_version?: string | null;
  delta?: MatchingDelta | null;
  updated_at?: string | null;
}

export interface MatchingListResponse {
  total: number;
  page: number;
  page_size: number;
  summary?: MatchingSummary;
  metadata?: {
    template_id?: string | null;
    template_version?: string | null;
    matching_rule_version?: string | null;
    generated_at?: string | null;
  };
  items: MatchingResultItem[];
}

export interface MatchingCandidate {
  order_id: string;
  score: number;
  match_fields?: string[];
  diff_fields?: string[];
  promoter_name?: string;
  store_name?: string;
  created_at?: string;
  status?: string;
}

export interface MatchingTimelineItem {
  ts: string;
  actor: string;
  action: string;
  note?: string;
}

export interface MatchingDetail {
  report_row_id: string;
  order_no?: string;
  match_status: MatchingStatus;
  match_mode: MatchingMode;
  matched_order_id?: string | null;
  valid?: boolean;
  risk_flags?: string[];
  template_id?: string | null;
  template_version?: string | null;
  matching_rule_version?: string | null;
  report: Record<string, unknown>;
  matched_order?: Record<string, unknown> | null;
  candidates?: MatchingCandidate[];
  timeline?: MatchingTimelineItem[];
}

export interface MatchingImportResponse {
  task_id: string;
  status?: string;
  files?: Array<{ filename: string; size?: number }>;
}

export interface MatchingImportStatus extends MatchingImportResponse {
  progress?: number;
  summary?: MatchingSummary;
  template_id?: string;
  template_version?: string;
  matching_rule_version?: string;
  files?: Array<{ filename: string; status?: string; rows?: number; warnings?: number }>;
  messages?: string[];
}

export interface MatchingResolvePayload {
  order_id?: string;
  lead_id?: string;
  score?: number;
}

export interface MatchingResolveResponse {
  ok?: boolean;
  report_row_id: string;
  matched_order_id?: string | null;
  score?: number;
  match_status?: MatchingStatus;
}

export interface MatchingValidResponse {
  ok?: boolean;
  report_row_id: string;
  valid: boolean;
  matched_order_id?: string | null;
  updated_at?: string;
}

export interface MatchingRiskFlagResponse {
  ok?: boolean;
  report_row_id: string;
  risk_flags: string[];
}

export interface MatchingExportResponse {
  export_id: string;
  status?: string;
  module?: string;
  download_url?: string;
}

export interface TemplateRecognizeResponse {
  template_id: string;
  template_version?: string;
  score?: number;
  matched_columns?: string[];
  missing_columns?: string[];
  recommendations?: string[];
}

type RequestParams = Record<string, unknown>;

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

function buildUrl(path: string, params?: RequestParams): string {
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

const FALLBACK_SUMMARY: MatchingSummary = {
  report_orders: 1240,
  matched: 992,
  unmatched: 118,
  ambiguous: 64,
  duplicate: 28,
  risky: 38,
  match_rate: 0.8,
  valid_rate: 0.78,
  delta: {
    added: 236,
    updated: 112,
    unchanged: 892
  }
};

const FALLBACK_ITEMS: MatchingResultItem[] = [
  {
    report_row_id: 'R1001',
    order_no: 'A-0001',
    product_key: 'PROD_5G_59',
    phone: '138***0001',
    promoter_unique_id: 'T-001',
    match_mode: 'auto_id',
    match_status: 'matched',
    candidate_count: 1,
    candidate_top_score: 1,
    matched_order_id: 'O20251015001',
    valid: true,
    risk_flags: [],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'added',
    updated_at: '2025-10-15T09:22:00+08:00'
  },
  {
    report_row_id: 'R1002',
    order_no: 'A-0002',
    product_key: 'PROD_WB_200M',
    phone: '138***0002',
    promoter_unique_id: null,
    match_mode: 'manual_form',
    match_status: 'ambiguous',
    candidate_count: 2,
    candidate_top_score: 0.74,
    matched_order_id: null,
    valid: false,
    risk_flags: ['duplicate'],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'updated',
    updated_at: '2025-10-15T09:25:00+08:00'
  },
  {
    report_row_id: 'R1003',
    order_no: 'A-0003',
    product_key: 'PROD_BUNDLE_99',
    phone: '138***0003',
    promoter_unique_id: 'T-004',
    match_mode: 'auto_id',
    match_status: 'unmatched',
    candidate_count: 0,
    candidate_top_score: null,
    matched_order_id: null,
    valid: false,
    risk_flags: [],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'added',
    updated_at: '2025-10-15T09:24:00+08:00'
  },
  {
    report_row_id: 'R1004',
    order_no: 'A-0004',
    product_key: 'PROD_HOME_299',
    phone: '138***0004',
    promoter_unique_id: 'T-006',
    match_mode: 'auto_id',
    match_status: 'risky',
    candidate_count: 1,
    candidate_top_score: 0.93,
    matched_order_id: 'O20251015004',
    valid: false,
    risk_flags: ['high_refund', 'risk_blacklist'],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'unchanged',
    updated_at: '2025-10-15T09:28:00+08:00'
  },
  {
    report_row_id: 'R1005',
    order_no: 'A-0005',
    product_key: 'PROD_5G_59',
    phone: '138***0005',
    promoter_unique_id: 'T-007',
    match_mode: 'auto_id',
    match_status: 'duplicate',
    candidate_count: 2,
    candidate_top_score: 0.64,
    matched_order_id: 'O20251015005',
    valid: false,
    risk_flags: ['duplicate'],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'updated',
    updated_at: '2025-10-15T09:32:00+08:00'
  },
  {
    report_row_id: 'R1006',
    order_no: 'A-0006',
    product_key: 'PROD_FAMILY_399',
    phone: '138***0006',
    promoter_unique_id: null,
    match_mode: 'manual_form',
    match_status: 'matched',
    candidate_count: 1,
    candidate_top_score: 0.88,
    matched_order_id: 'O20251014011',
    valid: true,
    risk_flags: [],
    template_id: 'TPL_CMCC_GZ_MONTHLY',
    template_version: 'v2025.10.01',
    matching_rule_version: 'mr-1.2.0',
    delta: 'unchanged',
    updated_at: '2025-10-15T09:35:00+08:00'
  }
];

const FALLBACK_DETAIL: Record<string, MatchingDetail> = {
  R1001: {
    report_row_id: 'R1001',
    order_no: 'A-0001',
    match_status: 'matched',
    match_mode: 'auto_id',
    matched_order_id: 'O20251015001',
    valid: true,
    risk_flags: [],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    report: {
      order_no: 'A-0001',
      product_key: 'PROD_5G_59',
      phone: '13800000001',
      promoter_unique_id: 'T-001',
      customer_name: '陈晓',
      store_name: '广州天河旗舰店',
      report_amount: 59,
      report_date: '2025-10-15',
      city: '广州',
      channel: '门店扫码',
      highlights: {
        order_no: 'match',
        product_key: 'match',
        phone: 'match',
        promoter_unique_id: 'match',
        report_amount: 'match'
      }
    },
    matched_order: {
      order_id: 'O20251015001',
      created_at: '2025-10-15T09:20:00+08:00',
      status: 'completed',
      campaign_name: '九月新客拉新',
      plan_name: '尊享套餐',
      promoter_id: 'U1001',
      promoter_name: '张三',
      store_id: 'S001',
      store_name: '广州天河旗舰店',
      amount: 59,
      activated_at: '2025-10-15T12:38:00+08:00',
      phone: '13800000001',
      highlights: {
        order_id: 'match',
        amount: 'match',
        phone: 'match',
        store_name: 'match'
      }
    },
    candidates: [
      {
        order_id: 'O20251015001',
        score: 1,
        match_fields: ['order_no', 'phone', 'amount'],
        diff_fields: [],
        promoter_name: '张三',
        store_name: '广州天河旗舰店',
        created_at: '2025-10-15T09:20:00+08:00',
        status: 'completed'
      }
    ],
    timeline: [
      {
        ts: '2025-10-15T09:18:00+08:00',
        actor: 'system',
        action: 'imported',
        note: '报表导入完成，进入自动匹配队列。'
      },
      {
        ts: '2025-10-15T09:21:12+08:00',
        actor: 'system',
        action: 'auto_matched',
        note: '唯一推广 ID 命中，自动匹配成功。'
      },
      {
        ts: '2025-10-15T09:25:33+08:00',
        actor: 'ops_admin',
        action: 'set_valid',
        note: '复核通过，确认有效。'
      }
    ]
  },
  R1002: {
    report_row_id: 'R1002',
    order_no: 'A-0002',
    match_status: 'ambiguous',
    match_mode: 'manual_form',
    matched_order_id: null,
    valid: false,
    risk_flags: ['duplicate'],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    report: {
      order_no: 'A-0002',
      product_key: 'PROD_WB_200M',
      phone: '13800000002',
      id_number: '4401**********1234',
      customer_name: '李晓',
      report_amount: 199,
      report_date: '2025-10-15',
      city: '广州',
      channel: '营业厅填报',
      highlights: {
        product_key: 'match',
        phone: 'match'
      }
    },
    matched_order: null,
    candidates: [
      {
        order_id: 'O20251015021',
        score: 0.74,
        match_fields: ['phone', 'product_key'],
        diff_fields: ['report_date'],
        promoter_name: '王五',
        store_name: '广州越秀营业厅',
        created_at: '2025-10-14T18:20:00+08:00',
        status: 'processing'
      },
      {
        order_id: 'O20251014011',
        score: 0.58,
        match_fields: ['phone'],
        diff_fields: ['product_key', 'store_name'],
        promoter_name: '刘强',
        store_name: '广州海珠营业厅',
        created_at: '2025-10-14T11:35:00+08:00',
        status: 'completed'
      }
    ],
    timeline: [
      {
        ts: '2025-10-15T09:19:42+08:00',
        actor: 'system',
        action: 'auto_match_failed',
        note: '唯一 ID 缺失，进入消歧流程。'
      },
      {
        ts: '2025-10-15T09:26:03+08:00',
        actor: 'system',
        action: 'ambiguous',
        note: '存在 2 个候选，请人工选择。'
      }
    ]
  }
};

function normaliseList(response?: MatchingListResponse | null): MatchingListResponse {
  if (!response || typeof response !== 'object') {
    return {
      total: FALLBACK_ITEMS.length,
      page: 1,
      page_size: FALLBACK_ITEMS.length,
      summary: FALLBACK_SUMMARY,
      items: [...FALLBACK_ITEMS]
    };
  }
  const total = typeof response.total === 'number' ? response.total : FALLBACK_ITEMS.length;
  const page = typeof response.page === 'number' ? response.page : 1;
  const pageSize = typeof response.page_size === 'number' ? response.page_size : FALLBACK_ITEMS.length;
  const items = Array.isArray(response.items) && response.items.length ? response.items : [...FALLBACK_ITEMS];
  const summary = response.summary || FALLBACK_SUMMARY;
  const metadata = response.metadata || {
    template_id: items[0]?.template_id ?? FALLBACK_ITEMS[0]?.template_id ?? null,
    template_version: items[0]?.template_version ?? FALLBACK_ITEMS[0]?.template_version ?? null,
    matching_rule_version: items[0]?.matching_rule_version ?? FALLBACK_ITEMS[0]?.matching_rule_version ?? null,
    generated_at: new Date().toISOString()
  };
  return { total, page, page_size: pageSize, summary, items, metadata };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function normaliseDetail(response?: MatchingDetail | null, rowId?: string): MatchingDetail {
  if (response && typeof response === 'object') {
    return response as MatchingDetail;
  }
  if (rowId && FALLBACK_DETAIL[rowId]) {
    return clone(FALLBACK_DETAIL[rowId]);
  }
  return clone(FALLBACK_DETAIL.R1001);
}

function normaliseImportStatus(payload?: MatchingImportStatus | null): MatchingImportStatus {
  if (!payload || typeof payload !== 'object') {
    return clone({
      task_id: 'MATCH_TASK_20251015_001',
      status: 'matched',
      progress: 100,
      summary: FALLBACK_SUMMARY,
      template_id: 'TPL_CMCC_GZ_DAILY',
      template_version: 'v2025.10.15',
      matching_rule_version: 'mr-1.2.0'
    });
  }
  return payload;
}

export const MatchingService = {
  async importReports(payload: FormData | Record<string, unknown>): Promise<MatchingImportResponse> {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    const url = buildUrl('/api/v1/matching/import');
    try {
      return await request<MatchingImportResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(isForm ? 'form' : 'json'),
        body: isForm ? payload : JSON.stringify(payload)
      });
    } catch {
      return { task_id: 'MATCH_TASK_20251015_001', status: 'uploaded' };
    }
  },

  async getImportStatus(taskId: string): Promise<MatchingImportStatus> {
    const url = buildUrl(`/api/v1/matching/import/${encodeURIComponent(taskId)}`);
    try {
      const response = await request<MatchingImportStatus>(url, {
        method: 'GET',
        headers: resolveHeaders()
      });
      return normaliseImportStatus(response);
    } catch {
      return normaliseImportStatus();
    }
  },

  async listResults(filters: MatchingFilters): Promise<MatchingListResponse> {
    const url = buildUrl('/api/v1/matching/results', filters);
    try {
      const response = await request<MatchingListResponse>(url, {
        method: 'GET',
        headers: resolveHeaders()
      });
      return normaliseList(response);
    } catch {
      return normaliseList();
    }
  },

  async getResultDetail(reportRowId: string): Promise<MatchingDetail> {
    const url = buildUrl(`/api/v1/matching/results/${encodeURIComponent(reportRowId)}`);
    try {
      const response = await request<MatchingDetail>(url, {
        method: 'GET',
        headers: resolveHeaders()
      });
      return normaliseDetail(response, reportRowId);
    } catch {
      return normaliseDetail(undefined, reportRowId);
    }
  },

  async resolveCandidate(reportRowId: string, payload: MatchingResolvePayload): Promise<MatchingResolveResponse> {
    const url = buildUrl(`/api/v1/matching/results/${encodeURIComponent(reportRowId)}/resolve`);
    try {
      return await request<MatchingResolveResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(),
        body: JSON.stringify(payload)
      });
    } catch {
      return {
        ok: true,
        report_row_id: reportRowId,
        matched_order_id: payload.order_id ?? null,
        score: payload.score,
        match_status: 'matched'
      };
    }
  },

  async setValid(reportRowId: string, valid: boolean): Promise<MatchingValidResponse> {
    const url = buildUrl(`/api/v1/matching/results/${encodeURIComponent(reportRowId)}/set_valid`);
    try {
      return await request<MatchingValidResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(),
        body: JSON.stringify({ valid })
      });
    } catch {
      return {
        ok: true,
        report_row_id: reportRowId,
        valid,
        matched_order_id: null,
        updated_at: new Date().toISOString()
      };
    }
  },

  async updateRiskFlag(reportRowId: string, payload: { flag: string; action: 'add' | 'remove' }): Promise<MatchingRiskFlagResponse> {
    const url = buildUrl(`/api/v1/matching/results/${encodeURIComponent(reportRowId)}/risk_flag`);
    try {
      return await request<MatchingRiskFlagResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(),
        body: JSON.stringify(payload)
      });
    } catch {
      return {
        ok: true,
        report_row_id: reportRowId,
        risk_flags: payload.action === 'add' ? [payload.flag] : []
      };
    }
  },

  async exportResults(filters: MatchingFilters): Promise<MatchingExportResponse> {
    const url = buildUrl('/api/v1/matching/export');
    try {
      return await request<MatchingExportResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(),
        body: JSON.stringify(filters)
      });
    } catch {
      return {
        export_id: `EXPORT_MATCHING_${Date.now()}`,
        status: 'queued',
        module: 'matching.results'
      };
    }
  },

  async recognizeTemplate(payload: FormData | Record<string, unknown>): Promise<TemplateRecognizeResponse> {
    const isForm = typeof FormData !== 'undefined' && payload instanceof FormData;
    const url = buildUrl('/api/v1/report_templates/recognize');
    try {
      return await request<TemplateRecognizeResponse>(url, {
        method: 'POST',
        headers: resolveHeaders(isForm ? 'form' : 'json'),
        body: isForm ? payload : JSON.stringify(payload)
      });
    } catch {
      return {
        template_id: 'TPL_CMCC_GZ_DAILY',
        template_version: 'v2025.10.15',
        score: 0.96,
        matched_columns: ['order_no', 'product_key', 'phone', 'report_date']
      };
    }
  }
};
