import { OpenAPI } from '../../../../sdk/ts';
import type { CommissionValue } from './commission';

export type ProductNodeType = 'product' | 'package';

export interface CampaignProductNode {
  node_id: string;
  name: string;
  type: ProductNodeType;
  status: 'active' | 'archived';
  parent_id: string | null;
  sort_order: number;
  has_children: boolean;
  children?: CampaignProductNode[];
  package_detail?: CampaignPackageDetail | null;
}

export interface CampaignPackageDetail {
  package_id: string;
  price: number;
  commission_default: CommissionValue;
  caps?: CommissionCaps | null;
  description?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
}

export interface CommissionCaps {
  min?: number | null;
  max?: number | null;
  allow_override?: boolean;
}

export interface CampaignProductsTreeResponse {
  campaign_id: string;
  nodes: CampaignProductNode[];
  updated_at?: string | null;
}

export interface ProductCreateRequest {
  type: ProductNodeType;
  name: string;
  parent_id?: string | null;
  price?: number;
  commission_default?: CommissionValue;
  caps?: CommissionCaps | null;
  description?: string | null;
}

export interface ProductUpdateRequest {
  name?: string;
  price?: number;
  commission_default?: CommissionValue;
  caps?: CommissionCaps | null;
  description?: string | null;
  status?: 'active' | 'archived';
}

export interface CopyFromTemplateRequest {
  template_id: string;
  overwrite?: boolean;
}

export interface CopyFromTemplateResponse {
  ok: boolean;
  imported_count: number;
}

export interface CampaignProductTemplate {
  template_id: string;
  name: string;
  description?: string;
  packages_count?: number;
}

export interface ProductsImportRequest {
  upload_token: string;
  notify_email?: string;
  dry_run?: boolean;
}

export interface ProductsImportTask {
  task_id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  processed?: number;
  total?: number;
  result_url?: string | null;
  message?: string | null;
  errors?: Array<{ row?: number; message?: string }>;
}

const FALLBACK_TREE: CampaignProductsTreeResponse = {
  campaign_id: 'C1',
  updated_at: '2025-09-18T10:00:00+08:00',
  nodes: [
    {
      node_id: 'prod-100',
      name: '5G 地推礼包',
      type: 'product',
      status: 'active',
      parent_id: null,
      sort_order: 1,
      has_children: true,
      children: [
        {
          node_id: 'pkg-100-A',
          name: '首充 59 元套餐',
          type: 'package',
          status: 'active',
          parent_id: 'prod-100',
          sort_order: 10,
          has_children: false,
          children: [],
          package_detail: {
            package_id: 'pkg-100-A',
            price: 59,
            commission_default: { type: 'percent', value: 12 },
            caps: { min: 5, max: 20, allow_override: true },
            description: '地推新用户首充奖励',
            updated_at: '2025-09-12T16:30:00+08:00',
            updated_by: 'li.mei'
          }
        },
        {
          node_id: 'pkg-100-B',
          name: '首充 99 元套餐',
          type: 'package',
          status: 'active',
          parent_id: 'prod-100',
          sort_order: 20,
          has_children: false,
          children: [],
          package_detail: {
            package_id: 'pkg-100-B',
            price: 99,
            commission_default: { type: 'fixed', value: 18 },
            caps: { min: 8, max: 30, allow_override: false },
            description: '高客单价礼包',
            updated_at: '2025-09-13T09:45:00+08:00',
            updated_by: 'li.mei'
          }
        }
      ]
    },
    {
      node_id: 'prod-200',
      name: '校园渠道专享',
      type: 'product',
      status: 'active',
      parent_id: null,
      sort_order: 2,
      has_children: true,
      children: [
        {
          node_id: 'pkg-200-A',
          name: '校园 39 元体验包',
          type: 'package',
          status: 'archived',
          parent_id: 'prod-200',
          sort_order: 5,
          has_children: false,
          children: [],
          package_detail: {
            package_id: 'pkg-200-A',
            price: 39,
            commission_default: {
              type: 'tier',
              tiers: [
                { threshold: 50, value: 6 },
                { threshold: 120, value: 8.5 }
              ]
            },
            caps: { min: 3, max: 12, allow_override: true },
            description: '暑期校园拉新包',
            updated_at: '2025-08-30T11:20:00+08:00',
            updated_by: 'chen.zhi'
          }
        }
      ]
    },
    {
      node_id: 'prod-300',
      name: '线下门店特卖',
      type: 'product',
      status: 'archived',
      parent_id: null,
      sort_order: 3,
      has_children: true,
      children: [
        {
          node_id: 'pkg-300-A',
          name: '门店 129 元组合包',
          type: 'package',
          status: 'active',
          parent_id: 'prod-300',
          sort_order: 10,
          has_children: false,
          children: [],
          package_detail: {
            package_id: 'pkg-300-A',
            price: 129,
            commission_default: { type: 'percent', value: 10 },
            caps: { min: 6, max: 18, allow_override: true },
            description: '线下门店限定组合包',
            updated_at: '2025-09-22T14:10:00+08:00',
            updated_by: 'wang.hui'
          }
        },
        {
          node_id: 'pkg-300-B',
          name: '引流体验券',
          type: 'package',
          status: 'archived',
          parent_id: 'prod-300',
          sort_order: 20,
          has_children: false,
          children: [],
          package_detail: {
            package_id: 'pkg-300-B',
            price: 19,
            commission_default: {
              type: 'tier',
              tiers: [
                { threshold: 30, value: 3 },
                { threshold: 80, value: 4.5 },
                { threshold: 150, value: 6 }
              ]
            },
            caps: { min: 0, max: 8, allow_override: false },
            description: '门店地推体验券，阶梯激励',
            updated_at: '2025-09-10T18:00:00+08:00',
            updated_by: 'wang.hui'
          }
        }
      ]
    }
  ]
};

const FALLBACK_TEMPLATES: CampaignProductTemplate[] = [
  {
    template_id: 'tpl-fast-start',
    name: '5G 快速配置模板',
    description: '包含首充 59/99 套餐，适用于电信渠道。',
    packages_count: 2
  },
  {
    template_id: 'tpl-campus-basic',
    name: '校园渠道基础模板',
    description: '包含39元体验包与地推佣金阶梯。',
    packages_count: 1
  }
];

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
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      if (value.length) search.append(key, value.join(','));
    } else {
      search.append(key, String(value));
    }
  });
  const query = search.toString();
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

export const CampaignProductsService = {
  async getTree(campaignId: string): Promise<CampaignProductsTreeResponse> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products_tree`);
    try {
      const response = await request<CampaignProductsTreeResponse>(url, {
        method: 'GET',
        headers: resolveHeaders()
      });
      if (!Array.isArray(response?.nodes) || !response.nodes.length) {
        return FALLBACK_TREE;
      }
      return response;
    } catch {
      return FALLBACK_TREE;
    }
  },

  async listTemplates(campaignId: string): Promise<CampaignProductTemplate[]> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products/templates`);
    const result = await request<{ templates?: CampaignProductTemplate[] | null } | null>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
    if (Array.isArray(result?.templates) && result.templates.length) {
      return result.templates;
    }
    return FALLBACK_TEMPLATES;
  },

  async createNode(campaignId: string, payload: ProductCreateRequest): Promise<CampaignProductNode> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products`);
    return request<CampaignProductNode>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async updateNode(campaignId: string, nodeId: string, payload: ProductUpdateRequest): Promise<CampaignProductNode> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products/${encodeURIComponent(nodeId)}`);
    return request<CampaignProductNode>(url, {
      method: 'PUT',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async deleteNode(campaignId: string, nodeId: string): Promise<{ ok: boolean }> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products/${encodeURIComponent(nodeId)}`);
    return request(url, {
      method: 'DELETE',
      headers: resolveHeaders()
    });
  },

  async copyFromTemplate(campaignId: string, payload: CopyFromTemplateRequest): Promise<CopyFromTemplateResponse> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products/copy_from`);
    return request<CopyFromTemplateResponse>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async importPackages(campaignId: string, payload: ProductsImportRequest): Promise<ProductsImportTask> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products/import`);
    return request<ProductsImportTask>(url, {
      method: 'POST',
      headers: resolveHeaders(),
      body: JSON.stringify(payload)
    });
  },

  async getImportTask(campaignId: string, taskId: string): Promise<ProductsImportTask> {
    const url = buildUrl(`/api/v1/campaigns/${encodeURIComponent(campaignId)}/products/import/${encodeURIComponent(taskId)}`);
    return request<ProductsImportTask>(url, {
      method: 'GET',
      headers: resolveHeaders()
    });
  }
};
