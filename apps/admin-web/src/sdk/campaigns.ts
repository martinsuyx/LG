import { OpenAPI } from '../../../../sdk/ts';

export type CampaignStatus = 'draft' | 'published' | 'offline' | 'ended';
export type CommissionType = 'fixed' | 'percent' | 'tier';

export type CommissionScheme =
  | { type: 'fixed'; value: number }
  | { type: 'percent'; value: number }
  | { type: 'tier'; tiers: Array<{ threshold: number; value: number }> };

export interface CampaignPlan {
  plan_id?: string;
  name: string;
  price: number;
  commission_scheme: CommissionScheme;
  constraints?: Record<string, unknown> | null;
}

export interface CampaignScope {
  companies?: string[];
  cities?: string[];
  stores?: string[];
}

export interface CampaignBasicsFieldMapping {
  field: string;
  label: string;
  column?: string;
  required: boolean;
}

export interface CampaignBasicsExampleColumn {
  field: string;
  label: string;
  samples?: string[];
  confidence?: number | null;
}

export interface CampaignBasicsExampleResult {
  status?: 'parsed' | 'failed' | 'pending';
  rows?: number;
  columns?: CampaignBasicsExampleColumn[];
  messages?: Array<{ level: 'info' | 'warning' | 'error'; text: string }>;
}

export interface CampaignBasicsRecognition {
  template_id?: string;
  template_name?: string;
  confidence?: number;
  matched_fields?: Array<{ field: string; label?: string; confidence?: number }>;
  hints?: string[];
}

export interface CampaignBasics {
  campaign_id: string;
  customer_name?: string;
  campaign_name: string;
  campaign_code: string;
  matching_mode: 'template' | 'manual';
  channels: string[];
  start_time: string;
  end_time: string;
  template_id?: string | null;
  recognition?: CampaignBasicsRecognition | null;
  field_mappings: CampaignBasicsFieldMapping[];
  example_input?: string;
  example_result?: CampaignBasicsExampleResult | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

export type CampaignBasicsSaveRequest = Partial<Omit<CampaignBasics, 'campaign_id' | 'recognition' | 'example_result' | 'updated_at' | 'updated_by'>> & {
  field_mappings?: CampaignBasicsFieldMapping[];
};

export interface CampaignBasicsSaveResponse {
  ok: boolean;
  campaign_id: string;
  saved_at?: string;
  next_step?: 'plans' | 'scope' | 'rules' | 'complete';
}

export interface Campaign {
  campaign_id: string;
  name: string;
  code: string;
  desc?: string | null;
  status: CampaignStatus;
  start_time: string;
  end_time: string;
  channels: string[];
  plans: CampaignPlan[];
  scope: CampaignScope;
  form_dsl_id?: string | null;
  risk_policy_id?: string | null;
  visible_to_roles?: string[];
  require_invite?: boolean;
  metrics?: {
    impressions?: number;
    submitted?: number;
    approved?: number;
    settled?: number;
  };
  offline_note?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface CampaignListItem extends Campaign {}

export interface CampaignListResponse {
  total: number;
  page: number;
  page_size: number;
  items: CampaignListItem[];
}

export interface CampaignFilters {
  status?: CampaignStatus | '';
  city?: string;
  channel?: string;
  keyword?: string;
  page?: number;
  page_size?: number;
  sort_key?: string;
  sort_order?: 'asc' | 'desc';
}

export type CampaignPayload = Omit<Campaign, 'campaign_id' | 'metrics' | 'status'> & {
  status?: CampaignStatus;
};

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
    if (value === undefined || value === null || value === '') return;
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
    const message = await response.text();
    throw new Error(message || `Request failed with ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export const CampaignsService = {
  async listCampaigns(filters: CampaignFilters): Promise<CampaignListResponse> {
    const url = buildUrl('/api/v1/campaigns', filters as Record<string, unknown>);
    return request<CampaignListResponse>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getCampaign(campaignId: string): Promise<Campaign> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}`);
    return request<Campaign>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async getCampaignBasics(campaignId: string): Promise<CampaignBasics> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/basics`);
    return request<CampaignBasics>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  },

  async saveCampaignBasics(campaignId: string, payload: CampaignBasicsSaveRequest): Promise<CampaignBasicsSaveResponse> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/basics`);
    return request<CampaignBasicsSaveResponse>(url, {
      method: 'PUT',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async createCampaign(payload: CampaignPayload): Promise<{ campaign_id: string; status?: CampaignStatus }> {
    const url = buildUrl('/api/v1/campaigns');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async updateCampaign(campaignId: string, payload: CampaignPayload): Promise<{ campaign_id: string; status?: CampaignStatus }> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}`);
    return request(url, {
      method: 'PUT',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async publishCampaign(campaignId: string): Promise<{ ok: boolean; new_status: CampaignStatus }> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/publish`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async offlineCampaign(campaignId: string, reason: string): Promise<{ ok: boolean; new_status: CampaignStatus }> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/offline`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify({ reason })
    });
  },

  async cloneCampaign(campaignId: string): Promise<{ campaign_id: string; status: CampaignStatus; source_campaign_id?: string }> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/clone`);
    return request(url, {
      method: 'POST',
      headers: resolveHeaders()
    });
  },

  async exportCampaigns(filters: CampaignFilters): Promise<{ export_id: string; status: string }> {
    const url = buildUrl('/api/v1/exports/campaigns');
    return request(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(filters)
    });
  }
};
