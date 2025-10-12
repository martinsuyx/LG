import type { Page } from '@playwright/test';

type UserStatus = 'active' | 'frozen' | 'deleted';

interface User {
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  role_ids: string[];
  status: UserStatus;
  last_login_at?: string | null;
  teams: string[];
  created_at?: string;
  updated_at?: string;
  recent_actions?: Array<{ ts: string; action: string }>;
}

interface Role {
  role_id: string;
  name: string;
  desc?: string;
  status: 'active' | 'archived';
  bound_users: number;
  created_at?: string;
  updated_at?: string;
  permissions: string[];
}

interface PermissionNode {
  perm_id: string;
  name: string;
  type: 'menu' | 'api';
  children?: PermissionNode[];
}

const roles: Record<string, Role> = {
  R01: {
    role_id: 'R01',
    name: '组织管理员',
    desc: '可管理组织与用户权限',
    status: 'active',
    bound_users: 18,
    created_at: '2024-01-01T09:00:00+08:00',
    updated_at: '2025-09-20T09:30:00+08:00',
    permissions: [
      'menu:dashboard',
      'menu:orders',
      'menu:wallet',
      'menu:org',
      'menu:reports',
      'api:/api/v1/users',
      'api:/api/v1/roles',
      'api:/api/v1/teams'
    ]
  },
  R02: {
    role_id: 'R02',
    name: '审核员',
    desc: '负责订单与提现审核',
    status: 'active',
    bound_users: 32,
    created_at: '2024-02-10T09:00:00+08:00',
    updated_at: '2025-09-18T14:10:00+08:00',
    permissions: ['menu:orders', 'menu:wallet', 'api:/api/v1/orders/review', 'api:/api/v1/withdraws/audit']
  },
  R03: {
    role_id: 'R03',
    name: '访客',
    desc: '只读权限',
    status: 'active',
    bound_users: 12,
    created_at: '2024-05-01T09:00:00+08:00',
    updated_at: '2025-09-01T08:00:00+08:00',
    permissions: ['menu:dashboard', 'menu:reports', 'api:/api/v1/reports/overview']
  },
  R04: {
    role_id: 'R04',
    name: '财务专员',
    desc: '查看钱包与财务报表',
    status: 'active',
    bound_users: 9,
    created_at: '2024-03-05T09:00:00+08:00',
    updated_at: '2025-09-25T15:12:00+08:00',
    permissions: [
      'menu:wallet',
      'menu:reports',
      'api:/api/v1/wallet/summary',
      'api:/api/v1/reports/overview',
      'api:/api/v1/exports'
    ]
  },
  R05: {
    role_id: 'R05',
    name: '渠道拓展',
    desc: '任务领取与活动报表',
    status: 'archived',
    bound_users: 3,
    created_at: '2024-07-01T09:00:00+08:00',
    updated_at: '2025-08-01T10:00:00+08:00',
    permissions: ['menu:campaigns', 'menu:tasks']
  }
};

const users: Record<string, User> = {
  U1001: {
    user_id: 'U1001',
    name: '张三',
    phone: '13800000001',
    email: 'zhangsan@example.com',
    role_ids: ['R01', 'R02'],
    status: 'active',
    last_login_at: '2025-09-28T12:00:00+08:00',
    teams: ['华南大区', '广州一区'],
    created_at: '2024-01-06T08:00:00+08:00',
    updated_at: '2025-09-25T11:10:00+08:00',
    recent_actions: [
      { ts: '2025-09-25T11:00:00+08:00', action: '登录后台' },
      { ts: '2025-09-24T16:22:00+08:00', action: '审批订单 ORD-223344' }
    ]
  },
  U1002: {
    user_id: 'U1002',
    name: '李四',
    phone: '13800000002',
    email: 'lisi@example.com',
    role_ids: ['R03'],
    status: 'frozen',
    last_login_at: '2025-09-25T09:15:00+08:00',
    teams: ['华东大区'],
    created_at: '2024-03-18T10:00:00+08:00',
    updated_at: '2025-08-19T10:30:00+08:00',
    recent_actions: [{ ts: '2025-08-01T18:22:00+08:00', action: '导出活动报表' }]
  },
  U1003: {
    user_id: 'U1003',
    name: '王五',
    phone: '13800000003',
    email: 'wangwu@example.com',
    role_ids: ['R04'],
    status: 'active',
    last_login_at: '2025-09-30T18:45:00+08:00',
    teams: ['中西运营中心'],
    created_at: '2024-05-12T12:00:00+08:00',
    updated_at: '2025-09-02T12:20:00+08:00',
    recent_actions: [
      { ts: '2025-09-30T18:40:00+08:00', action: '下载钱包流水' },
      { ts: '2025-09-18T15:20:00+08:00', action: '审批提现 WDR-88990' }
    ]
  }
};

const permissionTree: PermissionNode[] = [
  {
    perm_id: 'menu:dashboard',
    name: '仪表盘',
    type: 'menu',
    children: [
      {
        perm_id: 'menu:dashboard:overview',
        name: '概览',
        type: 'menu',
        children: [{ perm_id: 'api:/api/v1/dashboard/overview', name: 'Dashboard 概览接口', type: 'api' }]
      }
    ]
  },
  {
    perm_id: 'menu:orders',
    name: '订单与审核',
    type: 'menu',
    children: [
      { perm_id: 'menu:orders:list', name: '订单列表', type: 'menu' },
      { perm_id: 'menu:orders:review', name: '审核工作台', type: 'menu' },
      { perm_id: 'api:/api/v1/orders/review', name: '订单审核接口', type: 'api' },
      { perm_id: 'api:/api/v1/orders/export', name: '订单导出接口', type: 'api' }
    ]
  },
  {
    perm_id: 'menu:wallet',
    name: '资金与账户',
    type: 'menu',
    children: [
      { perm_id: 'menu:wallet:summary', name: '钱包摘要', type: 'menu' },
      { perm_id: 'menu:wallet:ledger', name: '钱包流水', type: 'menu' },
      { perm_id: 'api:/api/v1/wallet/summary', name: '钱包摘要接口', type: 'api' },
      { perm_id: 'api:/api/v1/withdraws/audit', name: '提现审核接口', type: 'api' }
    ]
  },
  {
    perm_id: 'menu:org',
    name: '组织与用户',
    type: 'menu',
    children: [
      { perm_id: 'menu:org:teams', name: '团队与人员', type: 'menu' },
      { perm_id: 'menu:org:users', name: '用户与角色', type: 'menu' },
      { perm_id: 'api:/api/v1/users', name: '用户管理接口', type: 'api' },
      { perm_id: 'api:/api/v1/roles', name: '角色管理接口', type: 'api' }
    ]
  },
  {
    perm_id: 'menu:reports',
    name: '报表与导出',
    type: 'menu',
    children: [
      { perm_id: 'menu:reports:overview', name: '报表总览', type: 'menu' },
      { perm_id: 'menu:reports:exports', name: '导出中心', type: 'menu' },
      { perm_id: 'api:/api/v1/reports/overview', name: '报表接口', type: 'api' },
      { perm_id: 'api:/api/v1/exports', name: '导出接口', type: 'api' }
    ]
  }
];

let sequence = 2000;

function recalcRoleBindings() {
  const counts: Record<string, number> = {};
  Object.values(users).forEach((user) => {
    user.role_ids.forEach((roleId) => {
      counts[roleId] = (counts[roleId] || 0) + 1;
    });
  });
  Object.values(roles).forEach((role) => {
    role.bound_users = counts[role.role_id] || 0;
  });
}

function listUsersResponse() {
  const items = Object.values(users).map((user) => ({
    user_id: user.user_id,
    name: user.name,
    phone: user.phone,
    email: user.email,
    role_ids: user.role_ids,
    status: user.status,
    last_login_at: user.last_login_at,
    teams: user.teams
  }));
  return {
    page: 1,
    page_size: 20,
    total: items.length,
    items
  };
}

export async function registerUsersMocks(page: Page) {
  recalcRoleBindings();
  await page.route('**/api/v1/users', async (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(listUsersResponse()) });
      return;
    }
    if (route.request().method() === 'POST') {
      const payload = (await route.request().postDataJSON()) as Partial<User>;
      sequence += 1;
      const user_id = `U${sequence}`;
      const newUser: User = {
        user_id,
        name: payload.name || `新用户${sequence}`,
        phone: payload.phone || '',
        email: payload.email || '',
        role_ids: Array.isArray(payload.role_ids) ? payload.role_ids : [],
        status: 'active',
        last_login_at: null,
        teams: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      users[user_id] = newUser;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          user: newUser,
          temporary_password: 'Join#2025'
        })
      });
      recalcRoleBindings();
      return;
    }
    route.fallback();
  });

  await page.route(/\/api\/v1\/users\/([^/]+)$/, (route, match) => {
    const [, userId] = match;
    if (route.request().method() === 'GET') {
      const detail = users[userId];
      if (!detail) {
        route.fulfill({ status: 404, body: JSON.stringify({ message: 'user not found' }) });
        return;
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
      return;
    }
    route.fallback();
  });

  await page.route(/\/api\/v1\/users\/([^/]+)\/roles$/, async (route, match) => {
    const [, userId] = match;
    const body = await route.request().postDataJSON();
    const detail = users[userId];
    if (!detail) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'user not found' }) });
      return;
    }
    detail.role_ids = Array.isArray(body?.role_ids) ? body.role_ids : [];
    detail.updated_at = new Date().toISOString();
    recalcRoleBindings();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, user_id: userId, role_ids: detail.role_ids, updated_at: detail.updated_at })
    });
  });

  await page.route(/\/api\/v1\/users\/([^/]+)\/reset_password$/, (route, match) => {
    const [, userId] = match;
    if (!users[userId]) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'user not found' }) });
      return;
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        user_id: userId,
        temp_password: 'Temp#9201',
        expire_at: '2025-12-31T23:59:59+08:00'
      })
    });
  });

  await page.route(/\/api\/v1\/users\/([^/]+)\/freeze$/, (route, match) => {
    const [, userId] = match;
    const detail = users[userId];
    if (!detail) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'user not found' }) });
      return;
    }
    detail.status = 'frozen';
    detail.updated_at = new Date().toISOString();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, user_id: userId, status: 'frozen', frozen_at: detail.updated_at })
    });
  });

  await page.route(/\/api\/v1\/users\/([^/]+)\/activate$/, (route, match) => {
    const [, userId] = match;
    const detail = users[userId];
    if (!detail) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'user not found' }) });
      return;
    }
    detail.status = 'active';
    detail.updated_at = new Date().toISOString();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, user_id: userId, status: 'active', activated_at: detail.updated_at })
    });
  });

  await page.route('**/api/v1/exports/users', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-USERS-PLAY-001', status: 'pending', module: 'users' })
    });
  });

  await page.route('**/api/v1/roles', (route) => {
    if (route.request().method() === 'GET') {
      const items = Object.values(roles).map((role) => ({
        role_id: role.role_id,
        name: role.name,
        desc: role.desc,
        status: role.status,
        bound_users: role.bound_users,
        updated_at: role.updated_at
      }));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ total: items.length, items })
      });
      return;
    }
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ export_id: 'EXP-ROLES-PLAY-001', status: 'pending', module: 'roles' })
      });
      return;
    }
    route.fallback();
  });

  await page.route(/\/api\/v1\/roles\/([^/]+)$/, (route, match) => {
    const [, roleId] = match;
    const detail = roles[roleId];
    if (!detail) {
      route.fulfill({ status: 404, body: JSON.stringify({ message: 'role not found' }) });
      return;
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(detail) });
  });

  await page.route('**/api/v1/permissions/tree', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ items: permissionTree }) });
  });
}
