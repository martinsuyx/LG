import { OpenAPI } from '../../../../sdk/ts';

export type ReportsGranularity = 'd' | 'w' | 'm';
export type ReportsDimension = 'campaign' | 'store' | 'promoter';
export type ReportsMetric = 'orders' | 'gmv' | 'settlement' | 'withdraw';

export interface ReportsFilters {
  start: string;
  end: string;
  granularity: ReportsGranularity;
  company_id?: string;
  city?: string;
  channel?: string[];
  dimension?: ReportsDimension;
  metric?: ReportsMetric;
  page?: number;
  page_size?: number;
}

export interface ReportsKpi {
  key: string;
  value: number;
  delta?: number;
  trend?: 'up' | 'down' | 'flat';
  unit?: string;
  group?: string;
  drill_link?: string;
  label?: string;
}

export interface ReportsOverviewResponse {
  kpis: ReportsKpi[];
  reports?: ReportCard[];
}

export interface ReportCard {
  report_key: string;
  title: string;
  desc?: string;
  route?: string;
  download_link?: string;
  schedule?: string;
}

export interface ReportsSeriesPoint {
  ts: string;
  value: number;
  baseline_yesterday?: number;
  baseline_lastweek?: number;
}

export interface ReportsSeriesResponse {
  metric: ReportsMetric | string;
  points: ReportsSeriesPoint[];
}

export interface ReportsCompareItem {
  id: string;
  name: string;
  metric: number;
}

export interface ReportsCompareResponse {
  dimension: ReportsDimension | string;
  metric: ReportsMetric | string;
  items: ReportsCompareItem[];
}

export interface ReportsTableItem {
  id: string;
  name: string;
  orders?: number;
  gmv?: number;
  settlement?: number;
  withdraw?: number;
  approval_rate?: number;
  [key: string]: unknown;
}

export interface ReportsTableResponse {
  total: number;
  page: number;
  page_size: number;
  items: ReportsTableItem[];
}

export interface ReportsExportResponse {
  export_id: string;
  status?: string;
  module?: string;
  download_url?: string;
}

type RequestParams = Record<string, unknown>;

function resolveHeaders(): HeadersInit {
  const baseHeaders = (OpenAPI.HEADERS as Record<string, string>) || {};
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
  const type = response.headers.get('content-type') || '';
  if (type.includes('application/json')) {
    return (await response.json()) as T;
  }
  return (await response.text()) as unknown as T;
}

export const ReportsService = {
  async overview(filters: ReportsFilters): Promise<ReportsOverviewResponse> {
    const url = buildUrl('/api/v1/reports/overview', filters);
    return request<ReportsOverviewResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async series(metric: ReportsMetric, filters: ReportsFilters): Promise<ReportsSeriesResponse> {
    const url = buildUrl('/api/v1/reports/series', { ...filters, metric });
    return request<ReportsSeriesResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async compare(dimension: ReportsDimension, metric: ReportsMetric, filters: ReportsFilters): Promise<ReportsCompareResponse> {
    const url = buildUrl('/api/v1/reports/compare', { ...filters, dimension, metric });
    return request<ReportsCompareResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async table(filters: ReportsFilters): Promise<ReportsTableResponse> {
    const url = buildUrl('/api/v1/reports/table', filters);
    return request<ReportsTableResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async exportOverview(filters: ReportsFilters): Promise<ReportsExportResponse> {
    const url = buildUrl('/api/v1/reports/export');
    return request<ReportsExportResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(filters)
    });
  }
};
