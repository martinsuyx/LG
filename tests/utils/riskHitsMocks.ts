import type { Page } from '@playwright/test';

type Severity = 'low' | 'medium' | 'high' | 'critical';
type Status = 'new' | 'processing' | 'resolved' | 'ignored';

interface Hit {
  hit_id: string;
  hit_time: string;
  rule_code: string;
  rule_name: string;
  severity: Severity;
  order_id: string | null;
  entity: Record<string, unknown>;
  channel: string;
  score: number;
  status: Status;
  ticket_id: string | null;
  operator: string | null;
  note: string;
}

interface Detail {
  hit_id: string;
  context: Record<string, unknown>;
  evidences: Array<{ type: string; content: string }>;
  similar_hits: Array<{ hit_id: string; time: string; rule_code: string; score: number }>;
}

const hits: Record<string, Hit> = {
  H202510030001: {
    hit_id: 'H202510030001',
    hit_time: '2025-10-03T10:12:30+08:00',
    rule_code: 'GEOFENCE_OUT',
    rule_name: '越界地理围栏',
    severity: 'high',
    order_id: 'O20251003001',
    entity: { phone: '138****0000', device_id: 'DEV-9A7', store_id: 'S001' },
    channel: 'wechat',
    score: 87.5,
    status: 'new',
    ticket_id: null,
    operator: null,
    note: ''
  },
  H202510030014: {
    hit_id: 'H202510030014',
    hit_time: '2025-10-03T09:48:21+08:00',
    rule_code: 'FREQ_APPLY',
    rule_name: '短期高频提交',
    severity: 'medium',
    order_id: 'O20251002999',
    entity: { id_number: '4401***********1234', device_id: 'DEV-42C', ip: '183.23.12.9' },
    channel: 'h5',
    score: 74.2,
    status: 'processing',
    ticket_id: 'RTK-2025100008',
    operator: '林杉',
    note: '工单处理中'
  },
  H202510021208: {
    hit_id: 'H202510021208',
    hit_time: '2025-10-02T22:05:18+08:00',
    rule_code: 'DEVICE_BLACK',
    rule_name: '设备命中黑名单',
    severity: 'critical',
    order_id: null,
    entity: { device_id: 'DEV-BLK-888', promoter_id: 'P0021' },
    channel: 'api',
    score: 95,
    status: 'new',
    ticket_id: null,
    operator: null,
    note: ''
  }
};

const details: Record<string, Detail> = {
  H202510030001: {
    hit_id: 'H202510030001',
    context: {
      location: { lat: 23.129, lng: 113.264, distance_to_store_km: 12.7 },
      device: { device_id: 'DEV-9A7', recent_orders_24h: 5 }
    },
    evidences: [
      { type: 'text', content: '定位距离门店超过 10km' },
      { type: 'stat', content: '同设备 24 小时内触发该规则 3 次' }
    ],
    similar_hits: [
      { hit_id: 'H202510020123', time: '2025-10-02T11:20:00+08:00', rule_code: 'GEOFENCE_OUT', score: 83.2 },
      { hit_id: 'H202510010456', time: '2025-10-01T15:02:00+08:00', rule_code: 'GEOFENCE_OUT', score: 80.1 }
    ]
  },
  H202510030014: {
    hit_id: 'H202510030014',
    context: {
      submission: { count_1h: 6, count_24h: 15, channel: 'h5' },
      user: { id_number: '4401***********1234', phone: '138****0001' }
    },
    evidences: [
      { type: 'stat', content: '近 1 小时提交 6 笔，高于阈值 3' },
      { type: 'text', content: 'IP 与常驻城市不一致' }
    ],
    similar_hits: [
      { hit_id: 'H202510020201', time: '2025-10-02T18:21:00+08:00', rule_code: 'FREQ_APPLY', score: 76.4 }
    ]
  },
  H202510021208: {
    hit_id: 'H202510021208',
    context: {
      device: { device_id: 'DEV-BLK-888', blacklist_source: '国家名单库', related_users: 12 }
    },
    evidences: [
      { type: 'text', content: '设备指纹命中高危黑名单库' },
      { type: 'stat', content: '该设备近 24 小时发起 12 次请求' }
    ],
    similar_hits: [
      { hit_id: 'H202510021045', time: '2025-10-02T20:14:00+08:00', rule_code: 'DEVICE_BLACK', score: 94.5 }
    ]
  }
};

let ticketSequence = 9;

export async function registerRiskHitsMocks(page: Page) {
  await page.route('**/api/v1/risk/hits', (route) => {
    const items = Object.values(hits);
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ total: items.length, page: 1, page_size: 20, items })
    });
  });

  await page.route(/\/api\/v1\/risk\/hits\/([^/]+)$/, (route, match) => {
    const [, hitId] = match;
    const detail = details[hitId];
    if (!detail) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'not found' }) });
      return;
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
  });

  await page.route('**/api/v1/risk/hits/batch_ignore', async (route) => {
    const payload = (await route.request().postDataJSON()) as { ids?: string[]; note?: string };
    const ids = Array.isArray(payload.ids) ? payload.ids : [];
    ids.forEach((id) => {
      if (hits[id]) {
        hits[id].status = 'ignored';
        hits[id].note = payload.note ?? '';
        hits[id].operator = 'MockUser';
      }
    });
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, count: ids.length })
    });
  });

  await page.route('**/api/v1/risk/tickets', async (route) => {
    const payload = (await route.request().postDataJSON()) as { hit_id?: string };
    if (!payload?.hit_id || !hits[payload.hit_id]) {
      route.fulfill({ status: 400, body: JSON.stringify({ message: 'invalid hit id' }) });
      return;
    }
    ticketSequence += 1;
    const ticketId = `RTK-20251001${ticketSequence}`;
    hits[payload.hit_id].status = 'processing';
    hits[payload.hit_id].ticket_id = ticketId;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ticket_id: ticketId, status: 'processing' })
    });
  });

  await page.route('**/api/v1/exports/risk-hits', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-RISK-HITS-PLAY-001', status: 'pending', module: 'risk-hits' })
    });
  });
}
