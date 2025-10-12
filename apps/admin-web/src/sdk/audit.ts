import { OpenAPI } from '../../../../sdk/ts';

export type AuditLevel = 'info' | 'warn' | 'error' | 'security';
export type AuditResult = 'success' | 'fail';
export type AuditSource = 'web' | 'api' | 'cron' | 'rpa' | 'callback';

export interface AuditActor {
  user_id: string;
  name?: string;
  roles?: string[];
  org_id?: string;
}

export interface AuditResource {
  type: string;
  id: string;
}

export interface AuditSignature {
  algo: string;
  hash: string;
  prev_hash?: string;
  chain_ok?: boolean;
}

export interface AuditEvent {
  event_id: string;
  ts: string;
  level: AuditLevel;
  type: string;
  actor: AuditActor;
  source: AuditSource;
  resource: AuditResource;
  action: string;
  result: AuditResult;
  reason?: string;
  ip?: string;
  ua?: string;
  trace_id?: string;
  signature?: AuditSignature;
  redactions?: string[];
  extra?: Record<string, unknown>;
  chain?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

export interface AuditListResponse {
  total: number;
  page: number;
  page_size: number;
  items: AuditEvent[];
}

export interface AuditVerifyResponse {
  ok: boolean;
  first_hash?: string;
  last_hash?: string;
  broken_links?: Array<Record<string, unknown>>;
}

export interface AuditEvidenceResponse {
  package_id: string;
  download_url?: string;
  status?: string;
}

export interface AuditFilters {
  start?: string;
  end?: string;
  level?: AuditLevel | '';
  type?: string;
  result?: AuditResult | '';
  source?: AuditSource | '';
  actor?: string;
  resource_type?: string;
  resource_id?: string;
  ip?: string;
  page?: number;
  page_size?: number;
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

export const AuditService = {
  async list(filters?: AuditFilters): Promise<AuditListResponse> {
    const url = buildUrl('/api/v1/audit/events', filters || {});
    return request<AuditListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async get(eventId: string): Promise<AuditEvent> {
    const url = buildUrl(`/api/v1/audit/events/${encodeURIComponent(eventId)}`);
    return request<AuditEvent>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async verify(params: { from?: string; to?: string }): Promise<AuditVerifyResponse> {
    const url = buildUrl('/api/v1/audit/verify', params);
    return request<AuditVerifyResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async createEvidence(payload: { event_ids?: string[]; include_context?: boolean }): Promise<AuditEvidenceResponse> {
    const url = buildUrl('/api/v1/audit/evidence');
    return request<AuditEvidenceResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  }
};
