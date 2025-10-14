import { OpenAPI } from '../../../../sdk/ts';

export interface ReportTemplateSummary {
  template_id: string;
  name: string;
  category?: string;
  description?: string;
  updated_at?: string | null;
}

export interface ReportTemplateListResponse {
  templates: ReportTemplateSummary[];
}

export interface ReportTemplateField {
  field: string;
  label: string;
  required: boolean;
  type?: string;
  example?: string;
}

export interface ReportTemplateDetail {
  template_id: string;
  name: string;
  category?: string;
  version?: string;
  description?: string;
  fields: ReportTemplateField[];
  sample?: string;
}

export interface ReportTemplateParseRequest {
  example: string;
  options?: Record<string, unknown>;
}

export interface ReportTemplateParseColumn {
  field: string;
  label: string;
  samples?: string[];
  confidence?: number | null;
}

export interface ReportTemplateParseMessage {
  level?: 'info' | 'warning' | 'error';
  text: string;
}

export interface ReportTemplateParseResponse {
  status?: 'parsed' | 'failed';
  rows?: number;
  columns?: ReportTemplateParseColumn[];
  messages?: ReportTemplateParseMessage[];
}

export interface ReportTemplateRecognizeRequest {
  sample: string;
  limit?: number;
}

export interface ReportTemplateRecognizeResponse {
  template_id?: string;
  template_name?: string;
  confidence?: number;
  matched_fields?: Array<{ field: string; label?: string; confidence?: number }>;
  hints?: string[];
}

function resolveHeaders(): HeadersInit {
  const baseHeaders = (OpenAPI.HEADERS as Record<string, string>) || {};
  return {
    'Content-Type': 'application/json',
    ...baseHeaders
  };
}

function buildUrl(path: string): string {
  const base = OpenAPI.BASE?.replace(/\/$/, '') || '';
  return `${base}${path}`;
}

async function request<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init);
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const ReportTemplatesService = {
  async listTemplates(): Promise<ReportTemplateSummary[]> {
    const url = buildUrl('/api/v1/report_templates');
    const result = await request<ReportTemplateListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
    return result.templates || [];
  },

  async getTemplate(templateId: string): Promise<ReportTemplateDetail> {
    const url = buildUrl(`/api/v1/report_templates/${encodeURIComponent(templateId)}`);
    return request<ReportTemplateDetail>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async parseExample(templateId: string, payload: ReportTemplateParseRequest): Promise<ReportTemplateParseResponse> {
    const url = buildUrl(`/api/v1/report_templates/${encodeURIComponent(templateId)}/parse_example`);
    return request<ReportTemplateParseResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async recognizeTemplate(payload: ReportTemplateRecognizeRequest): Promise<ReportTemplateRecognizeResponse> {
    const url = buildUrl('/api/v1/report_templates/recognize');
    return request<ReportTemplateRecognizeResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  }
};
