import type { Page } from '@playwright/test';

interface ExportJob {
  job_id: string;
  type: string;
  status: 'queued' | 'processing' | 'ready' | 'failed' | 'canceled' | 'expired';
  progress: number;
  file_name?: string | null;
  file_type?: string | null;
  file_size?: number | null;
  download_url?: string | null;
  expires_at?: string | null;
  params?: Record<string, unknown>;
  created_by: string;
  created_at: string;
  finished_at?: string | null;
  source?: string | null;
  retry_of?: string | null;
  error?: { code?: string; message?: string };
  logs_tail?: string;
  downloads?: Array<{ time: string; actor: string; channel?: string; ip?: string }>;
}

const store: Record<string, ExportJob> = {
  E20251003001: {
    job_id: 'E20251003001',
    type: 'orders',
    status: 'processing',
    progress: 65,
    file_type: 'csv',
    file_name: null,
    file_size: null,
    download_url: null,
    expires_at: null,
    params: { start: '2025-09-01', end: '2025-09-30', status: 'approved' },
    created_by: 'U1001',
    created_at: '2025-10-03T10:00:00+08:00',
    finished_at: null,
    source: '/orders',
    retry_of: null,
    error: null,
    logs_tail: '2025-10-03 10:00:00 queued\n2025-10-03 10:00:10 preparing data...'
  },
  E20251003002: {
    job_id: 'E20251003002',
    type: 'wallet_ledger',
    status: 'ready',
    progress: 100,
    file_name: 'wallet_ledger_202509.csv',
    file_type: 'csv',
    file_size: 10_485_760,
    download_url: 'https://mock/exports/E20251003002?sig=ready',
    expires_at: '2025-10-04T10:00:00+08:00',
    params: { start: '2025-09-01', end: '2025-09-30', dimension: 'store' },
    created_by: 'U2001',
    created_at: '2025-10-03T09:30:00+08:00',
    finished_at: '2025-10-03T09:45:12+08:00',
    source: '/wallet/ledger',
    retry_of: null,
    error: null,
    logs_tail: '2025-10-03 09:30:01 queued\n2025-10-03 09:30:05 pulling data...\n2025-10-03 09:36:12 writing csv chunk 5/5\n2025-10-03 09:37:01 uploading to storage\n2025-10-03 09:45:12 job completed.',
    downloads: [
      { time: '2025-10-03T09:50:00+08:00', actor: 'U2001', channel: 'web', ip: '10.10.1.8' }
    ]
  },
  E20251003003: {
    job_id: 'E20251003003',
    type: 'risk_hits',
    status: 'failed',
    progress: 80,
    file_type: 'csv',
    file_name: null,
    file_size: null,
    download_url: null,
    expires_at: null,
    params: { start: '2025-09-28', end: '2025-10-03' },
    created_by: 'U3001',
    created_at: '2025-10-03T08:00:00+08:00',
    finished_at: '2025-10-03T08:20:00+08:00',
    source: '/risk/hits',
    retry_of: null,
    error: { code: 'EXPORT_TIMEOUT', message: 'Job exceeded 20m limit' },
    logs_tail: '2025-10-03 08:00:00 queued\n2025-10-03 08:02:12 processing rules hit data…\n2025-10-03 08:16:40 uploading chunk 7/10\n2025-10-03 08:20:00 timeout reached, aborting job\n2025-10-03 08:20:01 job marked as failed',
    downloads: []
  },
  E20251003004: {
    job_id: 'E20251003004',
    type: 'reports_custom',
    status: 'queued',
    progress: 5,
    file_type: 'xlsx',
    file_name: null,
    file_size: null,
    download_url: null,
    expires_at: null,
    params: { preset: 'channel_weekly', period: '2025-W39' },
    created_by: 'U1002',
    created_at: '2025-10-03T10:30:00+08:00',
    finished_at: null,
    source: '/reports/overview',
    retry_of: null,
    error: null,
    logs_tail: '2025-10-03 10:30:00 queued'
  },
  E20251002011: {
    job_id: 'E20251002011',
    type: 'withdraws',
    status: 'expired',
    progress: 100,
    file_type: 'csv',
    file_name: 'withdraws_20250925.csv',
    file_size: 5_242_880,
    download_url: null,
    expires_at: '2025-10-02T22:00:00+08:00',
    params: { start: '2025-09-25', end: '2025-09-25' },
    created_by: 'U2002',
    created_at: '2025-10-02T20:15:00+08:00',
    finished_at: '2025-10-02T20:35:00+08:00',
    source: '/withdraws',
    retry_of: null,
    error: null,
    logs_tail: '2025-10-02 20:15:01 queued\n2025-10-02 20:20:00 job finished'
  }
};

function listResponse() {
  const items = Object.values(store);
  return {
    total: items.length,
    page: 1,
    page_size: 20,
    items
  };
}

export async function registerExportsMocks(page: Page) {
  await page.route('**/api/v1/exports', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(listResponse())
    });
  });

  await page.route(/\/api\/v1\/exports\/([^/]+)$/, (route, match) => {
    const [, jobId] = match;
    const detail = store[jobId];
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

  await page.route(/\/api\/v1\/exports\/([^/]+)\/retry$/, (route, match) => {
    const [, jobId] = match;
    const newId = `${jobId}-R1`;
    store[newId] = {
      job_id: newId,
      type: store[jobId]?.type ?? 'orders',
      status: 'queued',
      progress: 0,
      file_type: store[jobId]?.file_type ?? 'csv',
      file_name: null,
      file_size: null,
      download_url: null,
      expires_at: null,
      params: store[jobId]?.params ?? {},
      created_by: store[jobId]?.created_by ?? 'mock',
      created_at: new Date().toISOString(),
      finished_at: null,
      source: store[jobId]?.source ?? '/reports',
      retry_of: jobId,
      error: null,
      logs_tail: '2025-10-03 10:40:00 queued from retry'
    };
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ new_job_id: newId, status: 'queued' })
    });
  });

  await page.route(/\/api\/v1\/exports\/([^/]+)\/cancel$/, (route, match) => {
    const [, jobId] = match;
    if (store[jobId]) {
      store[jobId].status = 'canceled';
      store[jobId].progress = 0;
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, new_status: 'canceled' })
    });
  });

  await page.route('**/api/v1/exports/batch_delete_expired', (route) => {
    const expired = Object.values(store).filter((job) => job.status === 'expired');
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ deleted: expired.length })
    });
  });
}
