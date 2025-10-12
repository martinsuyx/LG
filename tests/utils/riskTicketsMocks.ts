import type { Page } from '@playwright/test';

type Priority = 'low' | 'normal' | 'high' | 'critical';
type Status = 'new' | 'assigned' | 'investigating' | 'pending_info' | 'resolved' | 'rejected' | 'closed';

type Ticket = {
  ticket_id: string;
  created_at: string;
  priority: Priority;
  status: Status;
  severity: string;
  assignee_id: string | null;
  assignee_name?: string | null;
  source: 'hit' | 'manual';
  rule_id?: string | null;
  title: string;
  due_at?: string | null;
  sla_minutes?: number | null;
  tags?: string[];
};

type Detail = Ticket & {
  updated_at?: string | null;
  creator_id?: string;
  creator_name?: string;
  desc?: string;
  hit_ids?: string[];
  order_ids?: string[];
  entities?: Array<{ type: string; id: string; label?: string }>;
  actions?: Array<{ time: string; actor: string; action: string; note?: string; to_status?: string }>;
  attachments?: Array<{ name: string; url: string; uploaded_by?: string; uploaded_at?: string }>;
  overdue?: boolean;
};

const tickets: Record<string, Ticket> = {
  K20251003001: {
    ticket_id: 'K20251003001',
    created_at: '2025-10-03T09:10:00+08:00',
    priority: 'high',
    status: 'investigating',
    severity: 'high',
    assignee_id: 'U2001',
    assignee_name: '林杉',
    source: 'hit',
    rule_id: 'GEOFENCE_OUT',
    title: '越界地理围栏(高) O20251003001',
    due_at: '2025-10-03T10:10:00+08:00',
    sla_minutes: 60,
    tags: ['地理围栏', '高风险']
  }
};

const details: Record<string, Detail> = {
  K20251003001: {
    ...tickets.K20251003001,
    updated_at: '2025-10-03T09:18:00+08:00',
    creator_id: 'U1900',
    creator_name: '风控机器人',
    desc: '位置与门店距离超过 10km，疑似代办。',
    hit_ids: ['H202510030001'],
    order_ids: ['O20251003001'],
    entities: [
      { type: 'device', id: 'DEV-9A7', label: '设备' },
      { type: 'phone', id: '138****0000', label: '手机号' }
    ],
    actions: [
      { time: '2025-10-03T09:11:00+08:00', actor: '系统', action: 'create', note: '命中 GEOFENCE_OUT 规则' },
      { time: '2025-10-03T09:12:00+08:00', actor: '林杉', action: 'assign', note: '指派给自己', to_status: 'assigned' },
      { time: '2025-10-03T09:13:30+08:00', actor: '林杉', action: 'start', note: '开始调查', to_status: 'investigating' }
    ],
    attachments: [{ name: 'location-map.png', url: '/mock/location-map.png', uploaded_by: '林杉', uploaded_at: '2025-10-03T09:14:00+08:00' }],
    overdue: false
  }
};

function listResponse() {
  const items = Object.values(tickets);
  return { total: items.length, page: 1, page_size: 20, items };
}

export async function registerRiskTicketsMocks(page: Page) {
  await page.route('**/api/v1/risk/tickets', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listResponse()) });
      return;
    }
    if (route.request().method() === 'POST') {
      const ticket = details.K20251003001;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ticket) });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/risk/tickets/K20251003001', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(details.K20251003001) });
  });

  const transitionActions: Record<string, Status> = {
    start: 'investigating',
    pend: 'pending_info',
    resolve: 'resolved',
    reject: 'rejected',
    close: 'closed'
  };

  for (const action of ['assign', 'start', 'pend', 'resolve', 'reject', 'close']) {
    await page.route(`**/api/v1/risk/tickets/*/${action}`, async (route) => {
      const url = route.request().url();
      const ticketId = url.split('/api/v1/risk/tickets/')[1]?.split('/')[0];
      if (!ticketId || !tickets[ticketId]) {
        route.fulfill({ status: 404, body: JSON.stringify({ message: 'not found' }) });
        return;
      }
      const body = route.request().method() === 'POST' && route.request().postDataJSON ? await route.request().postDataJSON() : {};
      if (action === 'assign') {
        tickets[ticketId].status = 'assigned';
        tickets[ticketId].assignee_id = body?.assignee_id || 'U2099';
        tickets[ticketId].assignee_name = body?.assignee_id || 'U2099';
        details[ticketId].status = 'assigned';
        details[ticketId].assignee_id = tickets[ticketId].assignee_id;
        details[ticketId].assignee_name = tickets[ticketId].assignee_name;
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, new_status: 'assigned', assignee_id: tickets[ticketId].assignee_id, assignee_name: tickets[ticketId].assignee_name })
        });
        return;
      }
      const newStatus = transitionActions[action as keyof typeof transitionActions];
      tickets[ticketId].status = newStatus;
      details[ticketId].status = newStatus;
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, new_status: newStatus }) });
    });
  }
}
