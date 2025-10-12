import type { Page } from '@playwright/test';

const settingsPayload = {
  uploads: {
    provider: 'aliyun',
    bucket: 'lg-prod',
    region: 'cn-guangzhou',
    key_tpls: [
      { biz: 'order_attachment', template: 'orders/${date}/${uuid}.jpg', ttl_seconds: 86400 },
      { biz: 'kyc', template: 'kyc/${user_id}/${uuid}.png', ttl_seconds: 43200 }
    ],
    max_size_mb: 15,
    allow_types: ['jpg', 'png', 'pdf'],
    sts_ttl_seconds: 900,
    cdn_domain: 'https://cdn.example.com'
  },
  secrets: {
    items: [
      {
        id: 'CRT-20251001',
        name: 'API TLS 证书',
        type: 'tls_cert',
        kid: 'tls-202510',
        status: 'active',
        created_at: '2025-09-01T08:00:00+08:00',
        expires_at: '2026-09-01T08:00:00+08:00',
        scope: 'global',
        tags: ['prod'],
        creator: 'security_admin'
      }
    ],
    rotation_policy: { rotate_every_days: 90, overlap_days: 7, notify_before_days: 14 },
    kms_provider: 'aliyun_kms',
    vault_path: 'kms:/prod/lg-platform'
  },
  flags: {
    flags: [
      {
        flag_key: 'wallet_v2',
        name: '钱包 2.0',
        desc: '启用新钱包服务',
        status: 'gray',
        gray_percent: 30,
        conditions: { region: ['GZ'], role: ['finance'] },
        owner: 'product',
        created_at: '2025-08-01T12:00:00+08:00',
        updated_at: '2025-09-28T09:00:00+08:00'
      }
    ]
  },
  notify: {
    channels: [
      {
        channel: 'email',
        name: '安全邮件',
        endpoint: 'security@example.com',
        enabled: true,
        retry: { max_times: 3, backoff: 'exp', interval_sec: 60 }
      }
    ],
    templates: [],
    subscriptions: []
  },
  i18n: {
    default_timezone: 'Asia/Shanghai',
    default_currency: 'CNY',
    decimal_scale: { money: 2, percent: 2, weight: 3 },
    locale_options: []
  },
  auth: {
    jwt: {
      issuer: 'lg-platform',
      audience: 'lg-clients',
      alg: 'RS256',
      kid_active: 'kid-202510',
      access_ttl_minutes: 30,
      refresh_ttl_days: 7,
      clock_skew_sec: 30
    },
    sso: {
      type: 'oidc',
      client_id: 'client-123',
      redirect_uri: 'https://admin.example.com/callback',
      issuer: 'https://login.example.com',
      auth_url: 'https://login.example.com/auth',
      token_url: 'https://login.example.com/token',
      scopes: ['openid', 'profile', 'email'],
      mapping: { email: 'username', groups: 'roles' }
    }
  },
  workflow: {
    uploads: { status: 'effective', updated_at: '2025-09-20T10:00:00+08:00', updated_by: 'ops_admin' },
    secrets: { status: 'effective', updated_at: '2025-09-22T11:00:00+08:00', updated_by: 'security_admin' },
    flags: { status: 'draft', updated_at: '2025-10-02T08:30:00+08:00', updated_by: 'product' },
    notify: { status: 'effective', updated_at: '2025-09-25T14:00:00+08:00', updated_by: 'ops_admin' },
    i18n: { status: 'submitted', updated_at: '2025-10-01T09:30:00+08:00', updated_by: 'admin' },
    auth: { status: 'effective', updated_at: '2025-09-18T16:40:00+08:00', updated_by: 'security_admin' }
  }
};

export async function registerSettingsMocks(page: Page) {
  await page.route('**/api/v1/settings', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(settingsPayload)
    });
  });

  await page.route(/\/api\/v1\/settings\/([^/]+)$/i, async (route) => {
    const payload = await route.request().postDataJSON();
    const clone = JSON.parse(JSON.stringify(payload || {}));
    const [, group] = route.request().url().match(/settings\/([^/?]+)/i) || [];
    if (group && settingsPayload[group as keyof typeof settingsPayload]) {
      (settingsPayload as any)[group] = clone;
      settingsPayload.workflow[group] = {
        status: 'draft',
        updated_at: new Date().toISOString(),
        updated_by: 'mock_user'
      };
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ draft_id: 'D-TEST', status: 'draft' }) });
  });

  await page.route(/\/api\/v1\/settings\/([^/]+)\/submit$/i, (route) => {
    const [, group] = route.request().url().match(/settings\/([^/]+)\/submit/i) || [];
    if (group) {
      settingsPayload.workflow[group as keyof typeof settingsPayload] = {
        status: 'submitted',
        updated_at: new Date().toISOString(),
        updated_by: 'mock_user'
      } as any;
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ approval_id: 'AP-TEST', status: 'submitted' }) });
  });

  await page.route(/\/api\/v1\/settings\/([^/]+)\/approve$/i, (route) => {
    const [, group] = route.request().url().match(/settings\/([^/]+)\/approve/i) || [];
    if (group) {
      settingsPayload.workflow[group as keyof typeof settingsPayload] = {
        status: 'effective',
        updated_at: new Date().toISOString(),
        updated_by: 'mock_user'
      } as any;
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ status: 'effective', effective_at: new Date().toISOString() }) });
  });

  await page.route(/\/api\/v1\/settings\/([^/]+)\/test$/i, (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, detail: '连接成功 (mock)' }) });
  });
}
