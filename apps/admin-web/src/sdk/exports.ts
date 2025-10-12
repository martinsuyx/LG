import { OpenAPI } from '../../../../sdk/ts';

export type ExportJobStatus = 'queued' | 'processing' | 'ready' | 'failed' | 'canceled' | 'expired';
export type ExportJobType =
  | 'orders'
  | 'wallet_ledger'
  | 'wallet_summary'
  | 'withdraws'
  | 'campaigns'
  | 'tasks'
  | 'teams'
  | 'members'
  | 'users'
  | 'roles'
  | 'risk_hits'
  | 'risk_tickets'
  | 'risk_lists'
  | 'risk_rules'
  | 'kyc_cases'
  | 'reports_custom';

export interface ExportJob {
  job_id: string;
  type: ExportJobType;
  status: ExportJobStatus;
  progress: number;
  file_name?: string | null;
  file_type?: 'csv' | 'xlsx' | 'parquet' | 'json' | string | null;
  file_size?: number | null;
  download_url?: string | null;
  expires_at?: string | null;
  params?: Record<string, unknown>;
  created_by: string;
  created_at: string;
  finished_at?: string | null;
  source?: string | null;
  retry_of?: string | null;
  error?: { code?: string; message?: string; stack?: string };
  logs_tail?: string;
  downloads?: Array<{ time: string; actor: string; channel?: string; ip?: string }>;
}

export interface ExportListResponse {
  total: number;
  page: number;
  page_size: number;
  items: ExportJob[];
}

export interface ExportFilters {
  start?: string;
  end?: string;
  status?: ExportJobStatus | '';
  type?: ExportJobType | '';
  created_by?: string;
  source?: string;
  file_type?: string;
  min_size?: number;
  max_size?: number;
  page?: number;
  page_size?: number;
}

export interface RetryResponse {
  new_job_id: string;
  status?: ExportJobStatus;
}

export interface CancelResponse {
  ok: boolean;
  new_status?: ExportJobStatus;
}

export interface DeleteExpiredResponse {
  deleted: number;
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

export const ExportJobsService = {
  async list(filters?: ExportFilters): Promise<ExportListResponse> {
    const url = buildUrl('/api/v1/exports', filters || {});
    return request<ExportListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async get(jobId: string): Promise<ExportJob> {
    const url = buildUrl(`/api/v1/exports/${encodeURIComponent(jobId)}`);
    return request<ExportJob>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async retry(jobId: string): Promise<RetryResponse> {
    const url = buildUrl(`/api/v1/exports/${encodeURIComponent(jobId)}/retry`);
    return request<RetryResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async cancel(jobId: string): Promise<CancelResponse> {
    const url = buildUrl(`/api/v1/exports/${encodeURIComponent(jobId)}/cancel`);
    return request<CancelResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async deleteExpired(): Promise<DeleteExpiredResponse> {
    const url = buildUrl('/api/v1/exports/batch_delete_expired');
    return request<DeleteExpiredResponse>(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  }
};
