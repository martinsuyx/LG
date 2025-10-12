import type { Page } from '@playwright/test';

interface AuditEvent {
  event_id: string;
  ts: string;
  level: 'info' | 'warn' | 'error' | 'security';
  type: string;
  actor: { user_id: string; name?: string; roles?: string[]; org_id?: string };
  source: 'web' | 'api' | 'cron' | 'rpa' | 'callback';
  resource: { type: string; id: string };
  action: string;
  result: 'success' | 'fail';
  reason?: string;
  ip?: string;
  ua?: string;
  trace_id?: string;
  signature?: { algo: string; hash: string; prev_hash?: string; chain_ok?: boolean };
  redactions?: string[];
  extra?: Record<string, unknown>;
  chain?: Record<string, unknown>;
  context?: Record<string, unknown>;
}

const events: Record<string, AuditEvent> = {
  A202510030001: {
    event_id: 'A202510030001',
    ts: '2025-10-03T10:00:12+08:00',
    level: 'security',
    type: 'export_download',
    actor: { user_id: 'U1001', name: '李想', roles: ['finance'], org_id: 'ORG-01' },
    source: 'web',
    resource: { type: 'export', id: 'E20251003002' },
    action: 'download',
    result: 'fail',
    reason: 'signature expired',
    ip: '203.0.113.10',
    ua: 'Chrome/140',
    trace_id: 'tr-9abcde',
    signature: { algo: 'SHA256', hash: 'abc123', prev_hash: 'def456', chain_ok: true },
    redactions: ['extra.token'],
    extra: { params_hash: '9f178d', download_url: 'https://mock/exports/E20251003002?sig=expired', token: '***' },
    chain: {
      prev: { event_id: 'A202510030000', ts: '2025-10-03T09:58:00+08:00', hash: 'def456' },
      next: { event_id: 'A202510030002', ts: '2025-10-03T10:05:00+08:00', hash: 'ghi789' }
    },
    context: {
      http: {
        method: 'GET',
        path: '/api/v1/exports/E20251003002/download',
        query: 'expires=1696300000&signature=***'
      }
    }
  },
  A202510030002: {
    event_id: 'A202510030002',
    ts: '2025-10-03T09:45:33+08:00',
    level: 'info',
    type: 'login_success',
    actor: { user_id: 'U2002', name: '王晴', roles: ['security_admin'] },
    source: 'web',
    resource: { type: 'user', id: 'U2002' },
    action: 'login',
    result: 'success',
    ip: '198.51.100.24',
    ua: 'Safari/17',
    trace_id: 'tr-abcdef',
    signature: { algo: 'SHA256', hash: 'ghi789', prev_hash: 'jkl012', chain_ok: true }
  },
  A202510030003: {
    event_id: 'A202510030003',
    ts: '2025-10-03T09:32:05+08:00',
    level: 'warn',
    type: 'permission_change',
    actor: { user_id: 'U2001', name: '陈惠', roles: ['admin'] },
    source: 'web',
    resource: { type: 'role', id: 'auditor' },
    action: 'grant',
    result: 'success',
    ip: '203.0.113.42',
    ua: 'Edge/119',
    trace_id: 'tr-77ab999',
    signature: { algo: 'SHA256', hash: 'mno345', prev_hash: 'pqr678', chain_ok: true }
  },
  A202510030004: {
    event_id: 'A202510030004',
    ts: '2025-10-03T09:15:20+08:00',
    level: 'security',
    type: 'wallet_export',
    actor: { user_id: 'U3001', name: '赵越', roles: ['finance'] },
    source: 'api',
    resource: { type: 'wallet', id: 'WLT-8899' },
    action: 'export',
    result: 'success',
    ip: '192.0.2.20',
    ua: 'API Client/2.5',
    trace_id: 'tr-5566aa',
    signature: { algo: 'SHA256', hash: 'stu901', prev_hash: 'vwx234', chain_ok: false }
  }
};

const listResponse = () => ({
  total: Object.keys(events).length,
  page: 1,
  page_size: 50,
  items: Object.values(events)
});

export async function registerAuditMocks(page: Page) {
  await page.route('**/api/v1/audit/events', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(listResponse())
    });
  });

  await page.route(/\/api\/v1\/audit\/events\/([^/]+)$/, (route, match) => {
    const [, eventId] = match;
    const detail = events[eventId];
    if (!detail) {
      route.fulfill({ status: 404, contentType: 'application/json', body: JSON.stringify({ message: 'not found' }) });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(detail)
    });
  });

  await page.route('**/api/v1/audit/verify**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, first_hash: 'abc000', last_hash: 'xyz999', broken_links: [] })
    });
  });

  await page.route('**/api/v1/audit/evidence', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ package_id: 'EV20251003001', download_url: 'https://mock/audit/evidence/EV20251003001.zip', status: 'ready' })
    });
  });
}
