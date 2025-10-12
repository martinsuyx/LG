import { OpenAPI } from '../../../../sdk/ts';

export type TaskStatus = 'draft' | 'published' | 'offline' | 'deprecated';

export interface TaskScope {
  companies?: string[];
  cities?: string[];
  stores?: string[];
}

export interface TaskFieldValidation {
  type?: 'regex' | 'enum' | 'range';
  value?: string;
  min?: number;
  max?: number;
}

export interface TaskFieldMapping {
  dsl_key: string;
  biz_key: string;
  required: boolean;
  validation?: TaskFieldValidation | null;
}

export interface TaskFormField {
  key: string;
  type: string;
  required?: boolean;
}

export interface TaskFormBinding {
  schema_version?: string;
  fields?: TaskFormField[];
  fields_map?: TaskFieldMapping[];
}

export interface TaskAutoCheck {
  key: string;
  rule: string;
  level: 'error' | 'warn';
  message: string;
}

export interface TaskThreshold {
  key: string;
  op: string;
  value: number;
  action: string;
}

export interface TaskSampling {
  percent?: number;
  seed?: string;
}

export interface TaskReviewRules {
  auto_checks?: TaskAutoCheck[];
  thresholds?: TaskThreshold[];
  sampling?: TaskSampling;
  double_review?: boolean;
  sla?: number;
}

export interface TaskReleasePlan {
  mode?: 'immediate' | 'scheduled' | 'gray';
  schedule_time?: string | null;
  gray_percent?: number | null;
  rollback_to_version?: number | null;
}

export interface TaskListItem {
  task_id: string;
  name: string;
  code: string;
  status: TaskStatus;
  version: number;
  start_time: string;
  end_time: string;
  form_dsl_id: string;
  risk_policy_id?: string | null;
  visible_to_roles: string[];
  scope: TaskScope;
}

export interface TaskDetail extends TaskListItem {
  desc?: string;
  form_dsl?: TaskFormBinding;
  review_rules?: TaskReviewRules;
  risk_action?: 'block' | 'queue' | 'flag';
  release?: TaskReleasePlan;
  versions?: TaskVersionList;
}

export interface TaskVersionItem {
  version: number;
  operator: string;
  time: string;
  changelog: string;
  diff?: Record<string, unknown>;
}

export interface TaskVersionList {
  total: number;
  page?: number;
  page_size?: number;
  items: TaskVersionItem[];
}

export interface TaskListResponse {
  total: number;
  page: number;
  page_size: number;
  items: TaskListItem[];
}

export interface TaskFilters {
  status?: TaskStatus | '';
  form_dsl_id?: string;
  risk_policy_id?: string;
  role?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  sort_key?: string;
  sort_order?: 'asc' | 'desc';
}

export interface TaskPayload {
  name: string;
  code: string;
  desc?: string;
  start_time: string;
  end_time: string;
  visible_to_roles: string[];
  scope: TaskScope;
  form_dsl_id: string;
  form_dsl: TaskFormBinding;
  review_rules: TaskReviewRules;
  risk_policy_id?: string | null;
  risk_action?: 'block' | 'queue' | 'flag';
  release?: TaskReleasePlan;
}

export interface TaskValidateResponse {
  ok: boolean;
  missing_fields: string[];
  invalid_rules: Array<{ key?: string; reason?: string }>;
  warnings: Array<{ message: string }>;
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
  if (!params) return `${base}${path}`;
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '' || Number.isNaN(value)) return;
    if (Array.isArray(value)) {
      if (!value.length) return;
      searchParams.append(key, value.join(','));
    } else {
      searchParams.append(key, String(value));
    }
  });
  const query = searchParams.toString();
  return query ? `${base}${path}?${query}` : `${base}${path}`;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const TasksService = {
  async listTasks(filters: TaskFilters): Promise<TaskListResponse> {
    const url = buildUrl('/api/v1/tasks', filters as Record<string, unknown>);
    return request(url, { method: 'GET', headers: resolveHeaders() });
  },

  async getTask(taskId: string): Promise<TaskDetail> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}`);
    return request(url, { method: 'GET', headers: resolveHeaders() });
  },

  async createTask(payload: TaskPayload): Promise<{ task_id: string; status?: TaskStatus; version?: number }> {
    const url = buildUrl('/api/v1/tasks');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async updateTask(taskId: string, payload: TaskPayload): Promise<{ task_id: string; status?: TaskStatus; version?: number }> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}`);
    return request(url, {
      method: 'PUT',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async validateTask(taskId: string): Promise<TaskValidateResponse> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}/validate`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async publishTask(taskId: string): Promise<{ ok: boolean; new_status: TaskStatus; version?: number }> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}/publish`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async offlineTask(taskId: string, reason: string): Promise<{ ok: boolean; new_status: TaskStatus }> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}/offline`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify({ reason })
    });
  },

  async cloneTask(taskId: string): Promise<{ task_id: string; status: TaskStatus; version?: number; source_task_id?: string }> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}/clone`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async listVersions(taskId: string, page = 1, pageSize = 20): Promise<TaskVersionList> {
    const url = buildUrl(`/api/v1/tasks/${encodeURIComponent(taskId)}/versions`, {
      page,
      page_size: pageSize
    });
    return request(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async exportTasks(filters: TaskFilters): Promise<{ export_id: string; status: string }> {
    const url = buildUrl('/api/v1/exports/tasks');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(filters)
    });
  }
};
