import type { Page } from '@playwright/test';

type Status = 'pending' | 'need_more' | 'approved' | 'rejected' | 'callback_error';
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface Materials {
  id_front_url?: string;
  id_back_url?: string;
  selfie_url?: string;
  extra_images?: string[];
  liveness_score?: number;
  psl_similarity?: number;
}

interface OcrResult {
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

interface DiffItem {
  key: string;
  ocr_value?: string | null;
  form_value?: string | null;
  confidence?: number | null;
  mismatch?: boolean;
}

interface ActionLog {
  time: string;
  actor: string;
  action: string;
  note?: string;
}

interface KycCase {
  case_id: string;
  created_at: string;
  status: Status;
  risk_level: RiskLevel;
  channel: string;
  source: 'auto' | 'manual';
  id_type: string;
  order_id?: string | null;
  user_id?: string | null;
  assignee_id?: string | null;
  double_review?: boolean;
  materials?: Materials;
  ocr?: OcrResult;
  form?: Record<string, unknown>;
  diffs?: DiffItem[];
  actions?: ActionLog[];
}

const svgPlaceholder = (label: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="Arial,Helvetica,sans-serif" font-size="20">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const store: Record<string, KycCase> = {
  KYC20251003001: {
    case_id: 'KYC20251003001',
    created_at: '2025-10-03T09:30:00+08:00',
    status: 'pending',
    risk_level: 'high',
    channel: 'wechat',
    source: 'auto',
    id_type: 'cn_id',
    order_id: 'O20251002001',
    user_id: 'U138000',
    assignee_id: null,
    double_review: true,
    materials: {
      id_front_url: svgPlaceholder('证件正面'),
      id_back_url: svgPlaceholder('证件背面'),
      selfie_url: svgPlaceholder('自拍'),
      liveness_score: 0.92,
      psl_similarity: 0.88
    },
    ocr: {
      name: '张三',
      id_number: '4401********1234',
      birth_date: '1995-06-18',
      gender: 'M',
      address: '广东省广州市天河区体育西路 1 号',
      valid_from: '2021-01-01',
      valid_to: '2031-01-01',
      confidence: 0.94
    },
    form: {
      name: '张三',
      id_number: '4401********1234',
      birth_date: '1995-06-18',
      gender: 'M',
      address: '广东省广州市天河区体育西路 1 号'
    },
    diffs: [
      { key: 'name', ocr_value: '张三', form_value: '张三', confidence: 0.94, mismatch: false },
      { key: 'id_number', ocr_value: '4401********1234', form_value: '4401********1234', confidence: 0.92, mismatch: false },
      { key: 'address', ocr_value: '广东省广州市天河区体育西路一号', form_value: '广东省广州市天河区体育西路 1 号', confidence: 0.76, mismatch: true }
    ],
    actions: [{ time: '2025-10-03T09:31:00+08:00', actor: '系统', action: 'auto_review', note: '触发人工复核' }]
  },
  KYC20251002008: {
    case_id: 'KYC20251002008',
    created_at: '2025-10-02T14:12:00+08:00',
    status: 'need_more',
    risk_level: 'medium',
    channel: 'h5',
    source: 'manual',
    id_type: 'passport',
    order_id: 'O20251001088',
    user_id: 'U556677',
    assignee_id: 'U2005',
    double_review: false,
    materials: {
      id_front_url: svgPlaceholder('证件正面'),
      selfie_url: svgPlaceholder('自拍'),
      extra_images: [svgPlaceholder('补充材料')]
    },
    ocr: {
      name: 'LEE KA',
      id_number: 'P12345678',
      birth_date: '1992-03-08',
      gender: 'F',
      valid_from: '2020-06-01',
      valid_to: '2030-05-31'
    },
    form: {
      name: 'LEE KA',
      id_number: 'P12345678',
      birth_date: '1992-03-08',
      gender: 'F',
      address: '香港九龙弥敦道 99 号'
    },
    diffs: [
      { key: 'address', ocr_value: '——', form_value: '香港九龙弥敦道 99 号', confidence: 0.4, mismatch: true }
    ],
    actions: [
      { time: '2025-10-02T14:20:00+08:00', actor: '李秀', action: 'request_more', note: '请补充住址证明' }
    ]
  },
  KYC20250930015: {
    case_id: 'KYC20250930015',
    created_at: '2025-09-30T11:05:00+08:00',
    status: 'callback_error',
    risk_level: 'critical',
    channel: 'api',
    source: 'auto',
    id_type: 'cn_id',
    order_id: 'O20250928022',
    user_id: 'U998800',
    assignee_id: 'U2002',
    double_review: true,
    materials: {
      id_front_url: svgPlaceholder('证件正面'),
      selfie_url: svgPlaceholder('自拍')
    },
    ocr: {
      name: '李四',
      id_number: '3301********5678',
      birth_date: '1988-11-20',
      gender: 'M',
      address: '浙江省杭州市西湖区灵隐路 18 号',
      valid_from: '2022-05-01',
      valid_to: '2032-04-30'
    },
    form: {
      name: '李四',
      id_number: '3301********5678',
      birth_date: '1988-11-20',
      gender: 'M',
      address: '浙江省杭州市西湖区灵隐路 18 号'
    },
    diffs: [{ key: 'liveness_score', ocr_value: '0.62', form_value: '0.90', confidence: 0.62, mismatch: true }],
    actions: [
      { time: '2025-09-30T11:07:00+08:00', actor: '三方供应商', action: 'callback_error', note: '签名校验失败' },
      { time: '2025-09-30T11:09:00+08:00', actor: '系统', action: 'auto_retry', note: '等待重放' }
    ]
  }
};

const listResponse = () => {
  const items = Object.values(store).map(
    ({ case_id, created_at, status, risk_level, channel, source, id_type, order_id, user_id, assignee_id }) => ({
      case_id,
      created_at,
      status,
      risk_level,
      channel,
      source,
      id_type,
      order_id: order_id ?? null,
      user_id: user_id ?? null,
      assignee_id: assignee_id ?? null
    })
  );
  return { total: items.length, page: 1, page_size: 20, items };
};

export async function registerKycMocks(page: Page) {
  await page.route('**/api/v1/kyc/cases', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(listResponse())
    });
  });

  await page.route(/\/api\/v1\/kyc\/cases\/([^/]+)$/, (route, match) => {
    const [, caseId] = match;
    const detail = store[caseId];
    if (!detail) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'not found' }) });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail)
    });
  });

  await page.route(/\/api\/v1\/kyc\/cases\/([^/]+)\/approve$/, async (route, match) => {
    const [, caseId] = match;
    const detail = store[caseId];
    if (detail) {
      detail.status = 'approved';
      detail.actions = [
        { time: new Date().toISOString(), actor: 'MockReviewer', action: 'approve', note: '' },
        ...(detail.actions || [])
      ];
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, new_status: 'approved' })
    });
  });

  await page.route(/\/api\/v1\/kyc\/cases\/([^/]+)\/reject$/, async (route, match) => {
    const [, caseId] = match;
    const payload = (await route.request().postDataJSON()) as { note?: string };
    const detail = store[caseId];
    if (detail) {
      detail.status = 'rejected';
      detail.actions = [
        {
          time: new Date().toISOString(),
          actor: 'MockReviewer',
          action: 'reject',
          note: payload?.note || '资料不符'
        },
        ...(detail.actions || [])
      ];
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, new_status: 'rejected' })
    });
  });

  await page.route(/\/api\/v1\/kyc\/cases\/([^/]+)\/request_more$/, async (route, match) => {
    const [, caseId] = match;
    const payload = (await route.request().postDataJSON()) as { note?: string };
    const detail = store[caseId];
    if (detail) {
      detail.status = 'need_more';
      detail.actions = [
        {
          time: new Date().toISOString(),
          actor: 'MockReviewer',
          action: 'request_more',
          note: payload?.note || '请补充资料'
        },
        ...(detail.actions || [])
      ];
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, new_status: 'need_more' })
    });
  });

  await page.route(/\/api\/v1\/kyc\/cases\/([^/]+)\/sync_callback$/, (route, match) => {
    const [, caseId] = match;
    const detail = store[caseId];
    if (detail) {
      detail.actions = [
        { time: new Date().toISOString(), actor: '系统', action: 'sync_callback', note: '手动同步回调' },
        ...(detail.actions || [])
      ];
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, third_party_status: 'synced' })
    });
  });

  await page.route('**/api/v1/exports/kyc-cases', async (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-KYC-001', status: 'pending', module: 'kyc-cases' })
    });
  });
}
