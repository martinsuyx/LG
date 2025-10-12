import { OpenAPI } from '../../../../sdk/ts';

export type RiskHitSeverity = 'low' | 'medium' | 'high' | 'critical';
export type RiskHitStatus = 'new' | 'processing' | 'resolved' | 'ignored';

export interface RiskHitEntity {
  phone?: string;
  device_id?: string;
  store_id?: string;
  id_number?: string;
  promoter_id?: string;
  name?: string;
  lat?: number;
  lng?: number;
  count_24h?: number;
  [key: string]: unknown;
}

export interface RiskHitItem {
  hit_id: string;
  hit_time: string;
  rule_code: string;
  rule_name: string;
  severity: RiskHitSeverity;
  order_id?: string | null;
  entity: RiskHitEntity;
  channel: string;
  score: number;
  status: RiskHitStatus;
  ticket_id?: string | null;
  operator?: string | null;
  note?: string | null;
}

export interface RiskHitListResponse {
  total: number;
  page: number;
  page_size: number;
  items: RiskHitItem[];
}

export interface RiskHitFilters {
  start: string;
  end: string;
  severity?: RiskHitSeverity | '';
  status?: RiskHitStatus | '';
  channel?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  sort_key?: 'hit_time' | 'score' | 'severity';
  sort_order?: 'asc' | 'desc';
}

export interface RiskHitEvidence {
  type: 'text' | 'stat' | 'image' | string;
  content: string;
}

export interface RiskHitSimilarItem {
  hit_id: string;
  time: string;
  rule_code: string;
  score: number;
}

export interface RiskHitDetail {
  hit_id: string;
  context: Record<string, unknown>;
  evidences: RiskHitEvidence[];
  similar_hits: RiskHitSimilarItem[];
}

export type RiskTicketPriority = 'low' | 'normal' | 'high' | 'critical';
export type RiskTicketStatus = 'new' | 'assigned' | 'investigating' | 'pending_info' | 'resolved' | 'rejected' | 'closed';

export interface RiskTicketListItem {
  ticket_id: string;
  created_at: string;
  priority: RiskTicketPriority;
  status: RiskTicketStatus;
  severity?: string;
  assignee_id?: string | null;
  assignee_name?: string | null;
  source: 'hit' | 'manual';
  rule_id?: string | null;
  title: string;
  due_at?: string | null;
  sla_minutes?: number | null;
  tags?: string[];
}

export interface RiskTicketListResponse {
  total: number;
  page: number;
  page_size: number;
  items: RiskTicketListItem[];
}

export interface RiskTicketDetail extends RiskTicketListItem {
  updated_at?: string | null;
  creator_id?: string;
  creator_name?: string;
  desc?: string | null;
  hit_ids?: string[];
  order_ids?: string[];
  entities?: Array<{ type: string; id: string; label?: string }>;
  actions?: Array<{ time: string; actor: string; action: string; note?: string; to_status?: string }>;
  attachments?: Array<{ name: string; url: string; uploaded_by?: string; uploaded_at?: string }>;
  overdue?: boolean;
}

export interface TicketTransitionResponse {
  ok: boolean;
  new_status: RiskTicketStatus;
  assignee_id?: string | null;
  assignee_name?: string | null;
}

export type RiskListType = 'blacklist' | 'whitelist' | 'greylist';
export type RiskListEntityType = 'phone' | 'id_number' | 'device' | 'ip' | 'store' | 'user';

export interface RiskListItem {
  list_id: string;
  type: RiskListType;
  entity_type: RiskListEntityType;
  entity_value: string;
  status: 'active' | 'archived';
  source: 'manual' | 'import' | 'api';
  hit_count?: number;
  expire_at?: string | null;
  note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface RiskListResponse {
  total: number;
  page: number;
  page_size: number;
  items: RiskListItem[];
}

export interface RiskListDetail extends RiskListItem {
  history?: Array<{ time: string; action: string; actor: string; note?: string }>;
}

export interface RiskListImportTask {
  task_id: string;
  file_name: string;
  rows_total: number;
  rows_valid: number;
  rows_invalid: number;
  status: 'pending' | 'processing' | 'succeeded' | 'failed';
  error_file?: string | null;
}

export interface RiskListDedupPreview {
  total: number;
  duplicates: Array<{ entity_value: string; existing_list_id: string; type: RiskListType }>;
  conflicts: Array<{ entity_value: string; existing_type: RiskListType; new_type: RiskListType }>;
}

export interface RiskRuleListItem {
  rule_id: string;
  code: string;
  name: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  status: 'draft' | 'published' | 'offline' | 'deprecated';
  version: number;
  weight?: number;
  threshold?: number;
  package?: string;
  hit_7d?: number;
  updated_by?: string;
  updated_at?: string;
}

export interface RiskRuleListResponse {
  total: number;
  page: number;
  page_size: number;
  items: RiskRuleListItem[];
}

export interface RiskRuleDetail extends RiskRuleListItem {
  expr?: string;
  datasource_map?: Record<string, string>;
  changelog?: string;
  simulations?: Array<{ simulation_id: string; dataset: string; metrics: Record<string, number>; created_at: string }>;
  versions?: Array<{ version: number; updated_at: string; comment?: string }>;
}

export interface RiskRuleSimulationResponse {
  simulation_id: string;
  dataset: string;
  status: 'succeeded' | 'processing' | 'failed';
  metrics?: Record<string, number>;
  result_url?: string;
}

export interface RiskRulePublishResponse {
  ok: boolean;
  deployment_id?: string;
  mode?: string;
  percent?: number;
}

export interface RiskRuleReplayResponse {
  replay_id: string;
  status: 'succeeded' | 'processing' | 'failed';
  range?: { start?: string; end?: string };
  before_rule_version?: number;
  after_rule_version?: number;
  delta_metrics?: Record<string, number>;
  report_url?: string;
}

export type KycStatus = 'pending' | 'need_more' | 'approved' | 'rejected' | 'callback_error';
export type KycRiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface KycCaseListItem {
  case_id: string;
  created_at: string;
  status: KycStatus;
  risk_level: KycRiskLevel;
  channel: string;
  source: 'auto' | 'manual';
  id_type: string;
  order_id?: string | null;
  user_id?: string | null;
  assignee_id?: string | null;
}

export interface KycCaseListResponse {
  total: number;
  page: number;
  page_size: number;
  items: KycCaseListItem[];
}

export interface KycMaterials {
  id_front_url?: string | null;
  id_back_url?: string | null;
  selfie_url?: string | null;
  extra_images?: string[];
  liveness_score?: number | null;
  psl_similarity?: number | null;
}

export interface KycOcr {
  name?: string;
  id_number?: string;
  birth_date?: string;
  gender?: string;
  address?: string;
  issued_by?: string;
  valid_from?: string;
  valid_to?: string;
  confidence?: number;
}

export interface KycDiff {
  key: string;
  ocr_value?: string | null;
  form_value?: string | null;
  confidence?: number | null;
  mismatch?: boolean;
}

export interface KycCaseDetail extends KycCaseListItem {
  materials?: KycMaterials;
  ocr?: KycOcr;
  form?: Record<string, unknown>;
  diffs?: KycDiff[];
  actions?: Array<{ time: string; actor: string; action: string; note?: string }>;
  double_review?: boolean;
}

export interface KycActionResponse {
  ok: boolean;
  new_status?: KycStatus;
  assignee_id?: string | null;
  assignee_name?: string | null;
  third_party_status?: string;
  synced_at?: string;
}

export interface BatchIgnoreRequest {
  ids: string[];
  note: string;
}

export interface BatchIgnoreResponse {
  ok: boolean;
  count: number;
}

export interface CreateTicketRequest {
  hit_id: string;
  priority: 'low' | 'normal' | 'high';
  assignee?: string;
  note?: string;
}

export interface CreateTicketResponse {
  ticket_id: string;
  status?: string;
}

interface ExportResponse {
  export_id: string;
  status?: string;
  module?: string;
}

function resolveHeaders(): HeadersInit {
  const baseHeaders = (OpenAPI.HEADERS as Record<string, string>) || {};
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
    let errorBody: unknown = null;
    const contentType = response.headers.get('content-type') || '';
    try {
      if (contentType.includes('application/json')) {
        errorBody = await response.json();
        if (errorBody && typeof errorBody === 'object' && 'message' in errorBody) {
          const bodyMessage = (errorBody as Record<string, unknown>).message;
          if (typeof bodyMessage === 'string' && bodyMessage.trim().length) {
            message = bodyMessage;
          }
        }
      } else {
        const text = await response.text();
        if (text.trim().length) {
          message = text;
        }
      }
    } catch (parseError) {
      void parseError;
    }
    const error = new Error(message);
    if (errorBody && typeof errorBody === 'object') {
      Object.assign(error, { details: errorBody });
    }
    throw error;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  const successType = response.headers.get('content-type') || '';
  if (successType.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const RiskHitsService = {
  async listHits(filters: RiskHitFilters): Promise<RiskHitListResponse> {
    const url = buildUrl('/api/v1/risk/hits', filters as Record<string, unknown>);
    return request<RiskHitListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getHitDetail(hitId: string): Promise<RiskHitDetail> {
    const url = buildUrl(`/api/v1/risk/hits/${encodeURIComponent(hitId)}`);
    return request<RiskHitDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async batchIgnore(payload: BatchIgnoreRequest): Promise<BatchIgnoreResponse> {
    const url = buildUrl('/api/v1/risk/hits/batch_ignore');
    return request<BatchIgnoreResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async createTicket(payload: CreateTicketRequest): Promise<CreateTicketResponse> {
    const url = buildUrl('/api/v1/risk/tickets');
    return request<CreateTicketResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async exportHits(filters: RiskHitFilters): Promise<ExportResponse> {
    const url = buildUrl('/api/v1/exports/risk-hits');
    return request<ExportResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(filters)
    });
  }
};

export const RiskTicketsService = {
  async listTickets(params?: Record<string, unknown>): Promise<RiskTicketListResponse> {
    const url = buildUrl('/api/v1/risk/tickets', params || {});
    return request<RiskTicketListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getTicketDetail(ticketId: string): Promise<RiskTicketDetail> {
    const url = buildUrl(`/api/v1/risk/tickets/${encodeURIComponent(ticketId)}`);
    return request<RiskTicketDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async transition(ticketId: string, action: 'assign' | 'start' | 'pend' | 'resolve' | 'reject' | 'close', payload?: Record<string, unknown>): Promise<TicketTransitionResponse> {
    const url = buildUrl(`/api/v1/risk/tickets/${encodeURIComponent(ticketId)}/${action}`);
    return request<TicketTransitionResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: payload ? JSON.stringify(payload) : undefined
    });
  }
};

export const RiskListsService = {
  async list(params?: Record<string, unknown>): Promise<RiskListResponse> {
    const url = buildUrl('/api/v1/risk/lists', params || {});
    return request<RiskListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getDetail(listId: string): Promise<RiskListDetail> {
    const url = buildUrl(`/api/v1/risk/lists/${encodeURIComponent(listId)}`);
    return request<RiskListDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async create(payload: Record<string, unknown>): Promise<RiskListDetail> {
    const url = buildUrl('/api/v1/risk/lists');
    return request<RiskListDetail>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async import(payload: Record<string, unknown>): Promise<RiskListImportTask> {
    const url = buildUrl('/api/v1/risk/lists/import');
    return request<RiskListImportTask>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async getImportTask(taskId: string): Promise<RiskListImportTask> {
    const url = buildUrl(`/api/v1/risk/lists/import/${encodeURIComponent(taskId)}`);
    return request<RiskListImportTask>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async previewDedup(payload: Record<string, unknown>): Promise<RiskListDedupPreview> {
    const url = buildUrl('/api/v1/risk/lists/dedup_preview');
    return request<RiskListDedupPreview>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  }
};

export const RiskRulesService = {
  async list(params?: Record<string, unknown>): Promise<RiskRuleListResponse> {
    const url = buildUrl('/api/v1/risk/rules', params || {});
    return request<RiskRuleListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getDetail(ruleId: string): Promise<RiskRuleDetail> {
    const url = buildUrl(`/api/v1/risk/rules/${encodeURIComponent(ruleId)}`);
    return request<RiskRuleDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async save(ruleId: string | null, payload: Record<string, unknown>): Promise<RiskRuleDetail> {
    if (ruleId) {
      const url = buildUrl(`/api/v1/risk/rules/${encodeURIComponent(ruleId)}`);
      return request<RiskRuleDetail>(url, {
        method: 'PUT',
        headers: resolveHeaders(),
        body: JSON.stringify(payload)
      });
    }
    const url = buildUrl('/api/v1/risk/rules');
    return request<RiskRuleDetail>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async simulate(ruleId: string, payload: Record<string, unknown>): Promise<RiskRuleSimulationResponse> {
    const url = buildUrl(`/api/v1/risk/rules/${encodeURIComponent(ruleId)}/simulate`);
    return request<RiskRuleSimulationResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async publish(ruleId: string, payload: Record<string, unknown>): Promise<RiskRulePublishResponse> {
    const url = buildUrl(`/api/v1/risk/rules/${encodeURIComponent(ruleId)}/publish`);
    return request<RiskRulePublishResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async replay(ruleId: string, payload: Record<string, unknown>): Promise<RiskRuleReplayResponse> {
    const url = buildUrl(`/api/v1/risk/rules/${encodeURIComponent(ruleId)}/replay`);
    return request<RiskRuleReplayResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  }
};

export const KycService = {
  async list(params?: Record<string, unknown>): Promise<KycCaseListResponse> {
    const url = buildUrl('/api/v1/kyc/cases', params || {});
    return request<KycCaseListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getDetail(caseId: string): Promise<KycCaseDetail> {
    const url = buildUrl(`/api/v1/kyc/cases/${encodeURIComponent(caseId)}`);
    return request<KycCaseDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async assign(caseId: string, assigneeId: string): Promise<KycActionResponse> {
    const url = buildUrl(`/api/v1/kyc/cases/${encodeURIComponent(caseId)}/assign`);
    return request<KycActionResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify({ assignee_id: assigneeId })
    });
  },

  async approve(caseId: string, payload?: Record<string, unknown>): Promise<KycActionResponse> {
    const url = buildUrl(`/api/v1/kyc/cases/${encodeURIComponent(caseId)}/approve`);
    return request<KycActionResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload || {})
    });
  },

  async reject(caseId: string, payload: Record<string, unknown>): Promise<KycActionResponse> {
    const url = buildUrl(`/api/v1/kyc/cases/${encodeURIComponent(caseId)}/reject`);
    return request<KycActionResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async requestMore(caseId: string, payload: Record<string, unknown>): Promise<KycActionResponse> {
    const url = buildUrl(`/api/v1/kyc/cases/${encodeURIComponent(caseId)}/request_more`);
    return request<KycActionResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async syncCallback(caseId: string): Promise<KycActionResponse> {
    const url = buildUrl(`/api/v1/kyc/cases/${encodeURIComponent(caseId)}/sync_callback`);
    return request<KycActionResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async exportCases(filters: Record<string, unknown>): Promise<ExportResponse> {
    const url = buildUrl('/api/v1/exports/kyc-cases');
    return request<ExportResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(filters)
    });
  }
};
