import type { Page } from '@playwright/test';

type ResultRow = {
  report_row_id: string;
  match_status: string;
  match_mode: string;
  matched_order_id?: string | null;
  valid?: boolean;
  risk_flags?: string[];
  candidate_count?: number;
  candidate_top_score?: number | null;
  template_id?: string;
  template_version?: string;
  matching_rule_version?: string;
  order_no?: string | null;
  product_key?: string | null;
  phone?: string | null;
  promoter_unique_id?: string | null;
  delta?: string | null;
};

const summary = {
  report_orders: 1240,
  matched: 992,
  unmatched: 118,
  ambiguous: 64,
  duplicate: 28,
  risky: 38,
  match_rate: 0.8,
  valid_rate: 0.78,
  delta: { added: 236, updated: 112, unchanged: 892 }
};

const rows: ResultRow[] = [
  {
    report_row_id: 'R1001',
    order_no: 'A-0001',
    product_key: 'PROD_5G_59',
    phone: '138***0001',
    promoter_unique_id: 'T-001',
    match_mode: 'auto_id',
    match_status: 'matched',
    candidate_count: 1,
    candidate_top_score: 1,
    matched_order_id: 'O20251015001',
    valid: true,
    risk_flags: [],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'added'
  },
  {
    report_row_id: 'R1002',
    order_no: 'A-0002',
    product_key: 'PROD_WB_200M',
    phone: '138***0002',
    promoter_unique_id: null,
    match_mode: 'manual_form',
    match_status: 'ambiguous',
    candidate_count: 2,
    candidate_top_score: 0.74,
    matched_order_id: null,
    valid: false,
    risk_flags: ['duplicate'],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'updated'
  },
  {
    report_row_id: 'R1003',
    order_no: 'A-0003',
    product_key: 'PROD_BUNDLE_99',
    phone: '138***0003',
    promoter_unique_id: 'T-004',
    match_mode: 'auto_id',
    match_status: 'unmatched',
    candidate_count: 0,
    candidate_top_score: null,
    matched_order_id: null,
    valid: false,
    risk_flags: [],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'added'
  },
  {
    report_row_id: 'R1004',
    order_no: 'A-0004',
    product_key: 'PROD_HOME_299',
    phone: '138***0004',
    promoter_unique_id: 'T-006',
    match_mode: 'auto_id',
    match_status: 'risky',
    candidate_count: 1,
    candidate_top_score: 0.93,
    matched_order_id: 'O20251015004',
    valid: false,
    risk_flags: ['high_refund', 'risk_blacklist'],
    template_id: 'TPL_CMCC_GZ_DAILY',
    template_version: 'v2025.10.15',
    matching_rule_version: 'mr-1.2.0',
    delta: 'unchanged'
  }
];

const detailR1001 = {
  report_row_id: 'R1001',
  order_no: 'A-0001',
  match_status: 'matched',
  match_mode: 'auto_id',
  matched_order_id: 'O20251015001',
  valid: true,
  risk_flags: [],
  template_id: 'TPL_CMCC_GZ_DAILY',
  template_version: 'v2025.10.15',
  matching_rule_version: 'mr-1.2.0',
  report: {
    order_no: 'A-0001',
    product_key: 'PROD_5G_59',
    phone: '13800000001',
    promoter_unique_id: 'T-001',
    customer_name: '陈晓',
    report_amount: 59,
    report_date: '2025-10-15',
    highlights: {
      order_no: 'match',
      product_key: 'match',
      phone: 'match'
    }
  },
  matched_order: {
    order_id: 'O20251015001',
    amount: 59,
    store_name: '广州天河旗舰店',
    promoter_name: '张三',
    created_at: '2025-10-15T09:20:00+08:00',
    highlights: {
      amount: 'match',
      store_name: 'match'
    }
  },
  candidates: [
    {
      order_id: 'O20251015001',
      score: 1,
      match_fields: ['order_no', 'phone', 'amount'],
      diff_fields: [],
      promoter_name: '张三',
      store_name: '广州天河旗舰店',
      created_at: '2025-10-15T09:20:00+08:00',
      status: 'completed'
    }
  ],
  timeline: [
    { ts: '2025-10-15T09:18:00+08:00', actor: 'system', action: 'imported', note: '报表导入完成。' },
    { ts: '2025-10-15T09:21:12+08:00', actor: 'system', action: 'auto_matched', note: '唯一 ID 命中。' }
  ]
};

const detailR1002 = {
  report_row_id: 'R1002',
  order_no: 'A-0002',
  match_status: 'ambiguous',
  match_mode: 'manual_form',
  matched_order_id: null,
  valid: false,
  risk_flags: ['duplicate'],
  template_id: 'TPL_CMCC_GZ_DAILY',
  template_version: 'v2025.10.15',
  matching_rule_version: 'mr-1.2.0',
  report: {
    order_no: 'A-0002',
    product_key: 'PROD_WB_200M',
    phone: '13800000002',
    report_amount: 199,
    report_date: '2025-10-15',
    highlights: {
      product_key: 'match',
      phone: 'match'
    }
  },
  matched_order: null,
  candidates: [
    {
      order_id: 'O20251015021',
      score: 0.74,
      match_fields: ['phone', 'product_key'],
      diff_fields: ['report_date'],
      promoter_name: '王五',
      store_name: '广州越秀营业厅',
      created_at: '2025-10-14T18:20:00+08:00',
      status: 'processing'
    },
    {
      order_id: 'O20251014011',
      score: 0.58,
      match_fields: ['phone'],
      diff_fields: ['product_key'],
      promoter_name: '刘强',
      store_name: '广州海珠营业厅',
      created_at: '2025-10-14T11:35:00+08:00',
      status: 'completed'
    }
  ],
  timeline: [
    {
      ts: '2025-10-15T09:19:42+08:00',
      actor: 'system',
      action: 'auto_match_failed',
      note: '唯一 ID 缺失，进入消歧。'
    }
  ]
};

let importPollCount = 0;
let lastTaskId = 'MATCH_TASK_20251015_001';

export async function registerOrderMatchingMocks(page: Page) {
  await page.route('**/api/v1/matching/import', async (route) => {
    lastTaskId = `MATCH_TASK_${Date.now()}`;
    importPollCount = 0;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        task_id: lastTaskId,
        status: 'uploaded'
      })
    });
  });

  await page.route('**/api/v1/matching/import/*', (route) => {
    importPollCount += 1;
    const status = importPollCount > 1 ? 'matched' : 'processing';
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        task_id: lastTaskId,
        status,
        progress: status === 'matched' ? 100 : 60,
        summary,
        template_id: 'TPL_CMCC_GZ_DAILY',
        template_version: 'v2025.10.15',
        matching_rule_version: 'mr-1.2.0',
        messages: status === 'matched' ? ['解析完成，匹配率 80%。'] : ['正在识别模板…']
      })
    });
  });

  await page.route('**/api/v1/matching/results?**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        total: rows.length,
        page: 1,
        page_size: 20,
        summary,
        metadata: {
          template_id: 'TPL_CMCC_GZ_DAILY',
          template_version: 'v2025.10.15',
          matching_rule_version: 'mr-1.2.0',
          generated_at: '2025-10-15T10:05:00+08:00'
        },
        items: rows
      })
    });
  });

  await page.route('**/api/v1/matching/results/R1001', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detailR1001)
    });
  });

  await page.route('**/api/v1/matching/results/R1002', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detailR1002)
    });
  });

  await page.route('**/api/v1/matching/results/*/resolve', async (route) => {
    const id = route.request().url().split('/').at(-2) || '';
    const payload = await route.request().postDataJSON();
    const row = rows.find((item) => item.report_row_id === id);
    if (row) {
      row.match_status = 'matched';
      row.matched_order_id = payload.order_id;
      row.valid = true;
      row.candidate_count = 1;
      row.candidate_top_score = payload.score ?? 1;
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        report_row_id: id,
        matched_order_id: payload.order_id,
        score: payload.score,
        match_status: 'matched'
      })
    });
  });

  await page.route('**/api/v1/matching/results/*/set_valid', async (route) => {
    const id = route.request().url().split('/').at(-2) || '';
    const payload = await route.request().postDataJSON();
    const row = rows.find((item) => item.report_row_id === id);
    if (row) {
      row.valid = payload.valid;
      if (!payload.valid && row.match_status === 'matched') {
        row.match_status = 'invalid';
      }
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, report_row_id: id, valid: payload.valid })
    });
  });

  await page.route('**/api/v1/matching/results/*/risk_flag', async (route) => {
    const id = route.request().url().split('/').at(-2) || '';
    const payload = await route.request().postDataJSON();
    const row = rows.find((item) => item.report_row_id === id);
    if (row) {
      const flag = payload.flag as string;
      row.risk_flags = row.risk_flags || [];
      if (payload.action === 'add' && !row.risk_flags.includes(flag)) {
        row.risk_flags.push(flag);
      } else if (payload.action === 'remove') {
        row.risk_flags = row.risk_flags.filter((item) => item !== flag);
      }
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, report_row_id: id, risk_flags: row?.risk_flags ?? [] })
    });
  });

  await page.route('**/api/v1/matching/export', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXPORT_MATCHING_TEST', status: 'queued', module: 'matching.results' })
    });
  });
}
