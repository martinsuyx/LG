import { OpenAPI } from '../../../../sdk/ts';

export interface SettingsWorkflowState {
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'effective';
  updated_at?: string;
  updated_by?: string;
}

export interface SettingsResponse {
  uploads?: Record<string, unknown>;
  secrets?: Record<string, unknown>;
  flags?: Record<string, unknown>;
  notify?: Record<string, unknown>;
  i18n?: Record<string, unknown>;
  auth?: Record<string, unknown>;
  workflow?: Record<string, SettingsWorkflowState>;
}

export interface SaveSettingsResponse {
  draft_id?: string;
  status?: string;
}

export interface SubmitSettingsResponse {
  approval_id?: string;
  status?: string;
}

export interface ApproveSettingsResponse {
  status?: string;
  effective_at?: string;
}

export interface TestSettingsResponse {
  ok: boolean;
  detail?: string;
}

type SettingsGroup = 'uploads' | 'secrets' | 'flags' | 'notify' | 'i18n' | 'auth';

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
      // ignore parse error
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

export const SystemSettingsService = {
  async getAll(): Promise<SettingsResponse> {
    const url = buildUrl('/api/v1/settings');
    return request<SettingsResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async save(group: SettingsGroup, payload: Record<string, unknown>): Promise<SaveSettingsResponse> {
    const url = buildUrl(`/api/v1/settings/${encodeURIComponent(group)}`);
    return request<SaveSettingsResponse>(url, {
      method: 'PUT',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async submit(group: SettingsGroup): Promise<SubmitSettingsResponse> {
    const url = buildUrl(`/api/v1/settings/${encodeURIComponent(group)}/submit`);
    return request<SubmitSettingsResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async approve(group: SettingsGroup): Promise<ApproveSettingsResponse> {
    const url = buildUrl(`/api/v1/settings/${encodeURIComponent(group)}/approve`);
    return request<ApproveSettingsResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async test(group: SettingsGroup, payload?: Record<string, unknown>): Promise<TestSettingsResponse> {
    const url = buildUrl(`/api/v1/settings/${encodeURIComponent(group)}/test`);
    return request<TestSettingsResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: payload ? JSON.stringify(payload) : undefined
    });
  }
};
