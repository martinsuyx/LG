import type { Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

type ProductNodeType = 'product' | 'package';
type CommissionValue =
  | { type: 'percent'; value: number }
  | { type: 'fixed'; value: number }
  | { type: 'tier'; tiers: Array<{ threshold: number; value: number }> };

interface CommissionCaps {
  min?: number | null;
  max?: number | null;
  allow_override?: boolean;
  approval_required?: boolean | null;
}

interface CampaignProductDetail {
  product_id: string;
  external_keys?: string[] | null;
  keywords?: string[] | null;
  category?: string | null;
  remark?: string | null;
}

interface CampaignPackageMetrics {
  promoter_count?: number;
  matched_orders?: number;
}

interface CampaignPackageDetail {
  package_id: string;
  price: number;
  commission_default: CommissionValue;
  caps?: CommissionCaps | null;
  share_rules?: Record<string, number> | null;
  description?: string | null;
  updated_at?: string | null;
  updated_by?: string | null;
  metrics?: CampaignPackageMetrics | null;
}

interface CampaignProductNode {
  node_id: string;
  name: string;
  type: ProductNodeType;
  status: 'active' | 'archived';
  parent_id: string | null;
  sort_order: number;
  has_children: boolean;
  children: CampaignProductNode[];
  product_detail?: CampaignProductDetail | null;
  package_detail?: CampaignPackageDetail | null;
}

interface CampaignProductTemplate {
  template_id: string;
  name: string;
  description?: string;
  packages_count?: number;
}

interface ProductsTreeResponse {
  campaign_id: string;
  campaign_name?: string | null;
  status?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  matching_mode?: string | null;
  updated_at?: string | null;
  nodes: CampaignProductNode[];
}

interface ImportTaskState {
  task_id: string;
  status: 'queued' | 'processing' | 'succeeded' | 'failed';
  processed: number;
  total: number;
  result_url?: string | null;
  errors?: Array<{ row?: number; message?: string }>;
}

const baseDir = join(__dirname, '../../mocks/campaigns/C1');

function loadJson<T>(filename: string): T {
  return JSON.parse(readFileSync(join(baseDir, filename), 'utf-8')) as T;
}

function now(): string {
  return new Date().toISOString();
}

function cloneCaps(caps?: CommissionCaps | null): CommissionCaps | undefined {
  if (!caps) return undefined;
  return {
    min: caps.min ?? null,
    max: caps.max ?? null,
    allow_override: caps.allow_override ?? false,
    approval_required: caps.approval_required ?? false
  };
}

function cloneShareRules(rules?: Record<string, number> | null) {
  if (!rules) return undefined;
  const clone: Record<string, number> = {};
  Object.entries(rules).forEach(([key, value]) => {
    clone[key] = Number(value ?? 0);
  });
  return clone;
}

function clonePackageDetail(detail?: CampaignPackageDetail | null): CampaignPackageDetail | null | undefined {
  if (detail === null) return null;
  if (!detail) return undefined;
  return {
    ...detail,
    caps: cloneCaps(detail.caps ?? undefined),
    share_rules: cloneShareRules(detail.share_rules ?? undefined),
    metrics: detail.metrics ? { ...detail.metrics } : undefined
  };
}

function cloneNode(node: CampaignProductNode): CampaignProductNode {
  return {
    ...node,
    children: cloneNodes(node.children ?? []),
    product_detail: node.product_detail ? { ...node.product_detail } : undefined,
    package_detail: clonePackageDetail(node.package_detail)
  };
}

function cloneNodes(nodes: CampaignProductNode[]): CampaignProductNode[] {
  return nodes.map(cloneNode);
}

const initialTree = loadJson<ProductsTreeResponse>('products_tree.json');
const templateList = loadJson<{ templates: CampaignProductTemplate[] }>('templates.json').templates;

const templateConfigs: Record<string, Array<{ name: string; price: number; commission: CommissionValue; description?: string }>> = {
  'tpl-fast-start': [
    { name: '模板 · 59 元特惠包', price: 59, commission: { type: 'percent', value: 12 }, description: '电信渠道快速启动套餐' },
    { name: '模板 · 99 元升级包', price: 99, commission: { type: 'fixed', value: 20 }, description: '面向高客单价用户的升级礼包' }
  ],
  'tpl-campus-basic': [
    {
      name: '模板 · 校园体验包',
      price: 39,
      commission: {
        type: 'tier',
        tiers: [
          { threshold: 50, value: 6 },
          { threshold: 120, value: 8.5 }
        ]
      },
      description: '校园渠道常用阶梯计佣示例'
    }
  ]
};

const state = {
  nodes: cloneNodes(initialTree.nodes ?? []),
  updatedAt: initialTree.updated_at ?? now(),
  campaignName: initialTree.campaign_name ?? '—',
  status: initialTree.status ?? 'draft',
  startTime: initialTree.start_time ?? null,
  endTime: initialTree.end_time ?? null,
  matchingMode: initialTree.matching_mode ?? 'template',
  templates: templateList,
  importTask: null as ImportTaskState | null
};

function resetState() {
  state.nodes = cloneNodes(initialTree.nodes ?? []);
  state.updatedAt = initialTree.updated_at ?? now();
  state.campaignName = initialTree.campaign_name ?? '—';
  state.status = initialTree.status ?? 'draft';
  state.startTime = initialTree.start_time ?? null;
  state.endTime = initialTree.end_time ?? null;
  state.matchingMode = initialTree.matching_mode ?? 'template';
  state.importTask = null;
}

function ensureChildren(node: CampaignProductNode): CampaignProductNode[] {
  if (!node.children) node.children = [];
  return node.children;
}

function nextSortOrder(nodes: CampaignProductNode[]): number {
  if (!nodes.length) return 10;
  const max = Math.max(...nodes.map((item) => item.sort_order ?? 0));
  return max + 10;
}

function findNode(nodes: CampaignProductNode[], nodeId: string): CampaignProductNode | null {
  for (const node of nodes) {
    if (node.node_id === nodeId) return node;
    const child = findNode(node.children ?? [], nodeId);
    if (child) return child;
  }
  return null;
}

function removeNode(nodes: CampaignProductNode[], nodeId: string): boolean {
  const index = nodes.findIndex((node) => node.node_id === nodeId);
  if (index !== -1) {
    nodes.splice(index, 1);
    return true;
  }
  for (const node of nodes) {
    if (removeNode(node.children ?? [], nodeId)) {
      node.has_children = (node.children ?? []).length > 0;
      return true;
    }
  }
  return false;
}

function ensurePrimaryProduct(): CampaignProductNode {
  let product = state.nodes.find((node) => node.type === 'product');
  if (!product) {
    product = createProductNode('模板产品', {
      external_keys: ['template_key'],
      keywords: ['模板'],
      category: '默认分类',
      remark: '模板导入时生成的默认产品。'
    });
    state.nodes.push(product);
  }
  return product;
}

interface PackageCreateConfig {
  node_id?: string;
  name: string;
  parent_id: string;
  price: number;
  commission: CommissionValue;
  description?: string | null;
  caps?: CommissionCaps | null;
  share_rules?: Record<string, number> | null;
  metrics?: CampaignPackageMetrics | null;
  status?: 'active' | 'archived';
}

function createPackageNode(config: PackageCreateConfig): CampaignProductNode {
  const nodeId = config.node_id ?? `pkg-${Math.random().toString(36).slice(2, 10)}`;
  const caps = config.caps
    ? {
        min: config.caps.min ?? null,
        max: config.caps.max ?? null,
        allow_override: config.caps.allow_override ?? false,
        approval_required: config.caps.approval_required ?? false
      }
    : undefined;
  return {
    node_id: nodeId,
    name: config.name,
    type: 'package',
    status: config.status ?? 'active',
    parent_id: config.parent_id,
    sort_order: 10,
    has_children: false,
    children: [],
    package_detail: {
      package_id: nodeId,
      price: config.price,
      commission_default: config.commission,
      caps,
      share_rules: config.share_rules ? { ...config.share_rules } : { promoter: 0.7, leader: 0.2, city_head: 0.1 },
      description: config.description ?? '',
      updated_at: now(),
      updated_by: 'mock.operator',
      metrics: config.metrics ? { ...config.metrics } : { promoter_count: 0, matched_orders: 0 }
    }
  };
}

function createProductNode(name: string, detail?: Partial<CampaignProductDetail>): CampaignProductNode {
  const productId = `prod-${Math.random().toString(36).slice(2, 10)}`;
  return {
    node_id: productId,
    name,
    type: 'product',
    status: 'active',
    parent_id: null,
    sort_order: nextSortOrder(state.nodes),
    has_children: false,
    children: [],
    product_detail: {
      product_id: productId,
      external_keys: detail?.external_keys ?? [],
      keywords: detail?.keywords ?? [],
      category: detail?.category ?? '',
      remark: detail?.remark ?? ''
    }
  };
}

function applyTemplate(templateId: string, overwrite = false): number {
  const configs = templateConfigs[templateId] ?? [];
  if (!configs.length) return 0;
  const product = ensurePrimaryProduct();
  const children = ensureChildren(product);
  if (overwrite) {
    children.splice(0, children.length);
  }
  configs.forEach((config, index) => {
    const nodeId = `pkg-${templateId}-${index + 1}`;
    const packageNode = createPackageNode({
      node_id: nodeId,
      name: config.name,
      parent_id: product.node_id,
      price: config.price,
      commission: config.commission,
      description: config.description,
      caps: { allow_override: true, approval_required: false },
      share_rules: { promoter: 0.7, leader: 0.2, city_head: 0.1 },
      metrics: { promoter_count: 30 + index * 5, matched_orders: 80 + index * 20 }
    });
    packageNode.sort_order = nextSortOrder(children);
    children.push(packageNode);
  });
  product.has_children = children.length > 0;
  state.updatedAt = now();
  return configs.length;
}

function injectImportedPackage() {
  const product = ensurePrimaryProduct();
  const children = ensureChildren(product);
  const packageNode = createPackageNode({
    name: '批量导入套餐',
    parent_id: product.node_id,
    price: 128,
    commission: { type: 'fixed', value: 35 },
    description: '导入任务生成的套餐',
    caps: { max: 50, allow_override: true, approval_required: false },
    share_rules: { promoter: 0.6, leader: 0.25, city_head: 0.15 },
    metrics: { promoter_count: 45, matched_orders: 96 }
  });
  packageNode.sort_order = nextSortOrder(children);
  children.push(packageNode);
  product.has_children = true;
  state.updatedAt = now();
}

function updatePackageNode(node: CampaignProductNode, payload: any) {
  node.name = payload.name ?? node.name;
  node.status = payload.status ?? node.status;
  const commission =
    payload.commission_default ?? node.package_detail?.commission_default ?? ({ type: 'fixed', value: 0 } as CommissionValue);
  const caps =
    payload.caps === undefined
      ? node.package_detail?.caps ?? undefined
      : {
          min: payload.caps?.min ?? null,
          max: payload.caps?.max ?? null,
          allow_override: payload.caps?.allow_override ?? false,
          approval_required: payload.caps?.approval_required ?? false
        };
  const shareRules =
    payload.share_rules === undefined
      ? node.package_detail?.share_rules ?? undefined
      : cloneShareRules(payload.share_rules ?? {});
  const description =
    payload.description !== undefined ? payload.description ?? '' : node.package_detail?.description ?? '';
  const metrics = node.package_detail?.metrics ? { ...node.package_detail.metrics } : { promoter_count: 0, matched_orders: 0 };
  node.package_detail = {
    package_id: node.package_detail?.package_id ?? node.node_id,
    price: payload.price ?? node.package_detail?.price ?? 0,
    commission_default: commission,
    caps,
    share_rules: shareRules,
    description,
    updated_at: now(),
    updated_by: 'mock.operator',
    metrics
  };
  state.updatedAt = now();
}

function updateProductNode(node: CampaignProductNode, payload: any) {
  node.name = payload.name ?? node.name;
  node.status = payload.status ?? node.status;
  if (payload.product_detail) {
    const detail = node.product_detail ?? {
      product_id: node.node_id,
      external_keys: [],
      keywords: [],
      category: '',
      remark: ''
    };
    detail.external_keys = payload.product_detail.external_keys ?? detail.external_keys ?? [];
    detail.keywords = payload.product_detail.keywords ?? detail.keywords ?? [];
    detail.category = payload.product_detail.category ?? detail.category ?? '';
    detail.remark = payload.product_detail.remark ?? detail.remark ?? '';
    node.product_detail = detail;
  }
  state.updatedAt = now();
}

export async function registerCampaignProductsMocks(page: Page) {
  resetState();

  await page.route('**/api/v1/campaigns/C1/products_tree', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        campaign_id: 'C1',
        campaign_name: state.campaignName,
        status: state.status,
        start_time: state.startTime,
        end_time: state.endTime,
        matching_mode: state.matchingMode,
        updated_at: state.updatedAt,
        nodes: cloneNodes(state.nodes)
      })
    });
  });

  await page.route('**/api/v1/campaigns/C1/products/templates', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ templates: state.templates })
    });
  });

  await page.route('**/api/v1/campaigns/C1/products/copy_from', async (route) => {
    if (route.request().method() !== 'POST') {
      route.fallback();
      return;
    }
    const payload = await route.request().postDataJSON();
    const imported = applyTemplate(payload.template_id, Boolean(payload.overwrite));
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, imported_count: imported })
    });
  });

  await page.route('**/api/v1/campaigns/C1/products/import', async (route) => {
    if (route.request().method() !== 'POST') {
      route.fallback();
      return;
    }
    const taskId = `pkg-import-${Math.random().toString(36).slice(2, 8)}`;
    state.importTask = {
      task_id: taskId,
      status: 'queued',
      processed: 0,
      total: 12,
      result_url: null,
      errors: []
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.importTask)
    });
  });

  await page.route('**/api/v1/campaigns/C1/products/import/*', async (route) => {
    if (!state.importTask) {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'task not found' })
      });
      return;
    }
    if (state.importTask.status === 'queued') {
      state.importTask = { ...state.importTask, status: 'processing', processed: 6 };
    } else if (state.importTask.status === 'processing') {
      state.importTask = {
        ...state.importTask,
        status: 'succeeded',
        processed: 12,
        result_url: `https://mock.example.com/import/${state.importTask.task_id}.xlsx`
      };
      injectImportedPackage();
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(state.importTask)
    });
  });

  await page.route('**/api/v1/campaigns/C1/products', async (route) => {
    if (route.request().method() !== 'POST') {
      route.fallback();
      return;
    }
    const payload = await route.request().postDataJSON();
    if (payload.type === 'product') {
      const node = createProductNode(payload.name ?? '未命名产品', payload.product_detail ?? {});
      state.nodes.push(node);
      state.updatedAt = now();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cloneNode(node))
      });
      return;
    }
    if (payload.type === 'package' && payload.parent_id) {
      const parent = findNode(state.nodes, payload.parent_id);
      if (!parent) {
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'parent not found' })
        });
        return;
      }
      const children = ensureChildren(parent);
      const node = createPackageNode({
        name: payload.name ?? '未命名套餐',
        parent_id: parent.node_id,
        price: payload.price ?? 0,
        commission: payload.commission_default ?? ({ type: 'fixed', value: 0 } as CommissionValue),
        description: payload.description ?? '',
        caps: payload.caps ?? null,
        share_rules: payload.share_rules ?? null
      });
      node.sort_order = nextSortOrder(children);
      children.push(node);
      parent.has_children = true;
      state.updatedAt = now();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cloneNode(node))
      });
      return;
    }
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'invalid payload' })
    });
  });

  await page.route('**/api/v1/campaigns/C1/products/*', async (route) => {
    const method = route.request().method();
    const url = new URL(route.request().url());
    const nodeId = url.pathname.split('/').pop() as string;
    const node = findNode(state.nodes, nodeId);
    if (!node) {
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'node not found' })
      });
      return;
    }
    if (method === 'PUT') {
      const payload = await route.request().postDataJSON();
      if (node.type === 'package') {
        updatePackageNode(node, payload);
      } else {
        updateProductNode(node, payload);
      }
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(cloneNode(node))
      });
      return;
    }
    if (method === 'DELETE') {
      const removed = removeNode(state.nodes, nodeId);
      if (removed) {
        state.updatedAt = now();
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true })
        });
        return;
      }
      route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'node not found' })
      });
      return;
    }
    route.fallback();
  });
}
