import type { Page } from '@playwright/test';

type TeamStatus = 'active' | 'archived';
type MemberStatus = 'active' | 'frozen' | 'left';
type MemberRole = 'promoter' | 'store_owner' | 'staff' | 'lead' | 'viewer';

interface TeamNode {
  team_id: string;
  name: string;
  parent_id: string | null;
  has_children: boolean;
  members_count: number;
  lead_user_name?: string;
  lead_user_id?: string;
  company_bindings?: string[];
  tags?: string[];
}

interface TeamDetail extends TeamNode {
  status: TeamStatus;
  stores_count: number;
  desc?: string;
}

interface TeamMember {
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  role: MemberRole;
  status: MemberStatus;
  joined_at: string;
  team_path: string[];
  tags?: string[];
  frozen_reason?: string;
  left_at?: string;
}

const tree: Record<string, TeamNode> = {
  T001: {
    team_id: 'T001',
    name: '华南大区',
    parent_id: null,
    has_children: true,
    members_count: 320,
    lead_user_name: '李南',
    lead_user_id: 'U0001',
    company_bindings: ['C01', 'C02'],
    tags: ['华南', '战略']
  },
  T001A: {
    team_id: 'T001A',
    name: '广州一区',
    parent_id: 'T001',
    has_children: true,
    members_count: 128,
    lead_user_name: '赵晨',
    lead_user_id: 'U2001',
    company_bindings: ['C01'],
    tags: ['广州', '线下门店']
  },
  T001B: {
    team_id: 'T001B',
    name: '深圳一区',
    parent_id: 'T001',
    has_children: true,
    members_count: 112,
    lead_user_name: '程敏',
    lead_user_id: 'U2005',
    company_bindings: ['C01', 'C05'],
    tags: ['深圳', '企业合作']
  },
  T001B1: {
    team_id: 'T001B1',
    name: '南山大客户组',
    parent_id: 'T001B',
    has_children: false,
    members_count: 64,
    lead_user_name: '许诺',
    lead_user_id: 'U3301',
    company_bindings: ['C05'],
    tags: ['南山', 'B2B']
  },
  T002: {
    team_id: 'T002',
    name: '华东大区',
    parent_id: null,
    has_children: true,
    members_count: 210,
    lead_user_name: '顾晨',
    lead_user_id: 'U4001',
    company_bindings: ['C03'],
    tags: ['华东', '旗舰']
  },
  T003: {
    team_id: 'T003',
    name: '中西运营中心',
    parent_id: null,
    has_children: false,
    members_count: 86,
    lead_user_name: '王群',
    lead_user_id: 'U5001',
    company_bindings: ['C04'],
    tags: ['西南', '成渝']
  }
};

const childrenMap: Record<string, string[]> = {
  T001: ['T001A', 'T001B'],
  T001A: [],
  T001B: ['T001B1'],
  T002: [],
  T003: []
};

const details: Record<string, TeamDetail> = {
  T001: {
    ...tree.T001,
    status: 'active',
    stores_count: 128,
    desc: '负责华南地区的渠道拓展与重点城市运营。'
  },
  T001A: {
    ...tree.T001A,
    status: 'active',
    stores_count: 52,
    desc: '覆盖广州核心商圈与合作营业厅。'
  },
  T001B: {
    ...tree.T001B,
    status: 'active',
    stores_count: 38,
    desc: '聚焦深圳科技园区域与企业事业部合作项目。'
  },
  T001B1: {
    ...tree.T001B1,
    status: 'active',
    stores_count: 15,
    desc: '对接南山科技企业的企业购与员工福利项目。'
  },
  T002: {
    ...tree.T002,
    status: 'active',
    stores_count: 41,
    desc: '负责上海核心商圈旗舰店运营。'
  },
  T003: {
    ...tree.T003,
    status: 'active',
    stores_count: 33,
    desc: '成渝城市群与西南核心市场联合指挥。'
  }
};

const teamMembers: Record<string, TeamMember[]> = {
  T001: [
    {
      user_id: 'U0001',
      name: '李南',
      phone: '13800138000',
      role: 'lead',
      status: 'active',
      joined_at: '2023-12-10T09:00:00+08:00',
      team_path: ['华南大区'],
      tags: ['负责人']
    },
    {
      user_id: 'U1188',
      name: '陈宇',
      phone: '13800138032',
      role: 'promoter',
      status: 'active',
      joined_at: '2024-04-22T11:00:00+08:00',
      team_path: ['华南大区']
    }
  ],
  T001A: [
    {
      user_id: 'U2001',
      name: '赵晨',
      phone: '13800550001',
      email: 'zhaochen@example.com',
      role: 'lead',
      status: 'active',
      joined_at: '2024-05-01T10:00:00+08:00',
      team_path: ['华南大区', '广州一区'],
      tags: ['负责人']
    },
    {
      user_id: 'U2012',
      name: '梁婷',
      phone: '13800550012',
      role: 'promoter',
      status: 'active',
      joined_at: '2024-06-03T11:20:00+08:00',
      team_path: ['华南大区', '广州一区'],
      tags: ['月度Top']
    },
    {
      user_id: 'U2030',
      name: '谢源',
      phone: '13800550030',
      role: 'promoter',
      status: 'left',
      joined_at: '2024-07-01T09:05:00+08:00',
      left_at: '2024-09-18T18:00:00+08:00',
      team_path: ['华南大区', '广州一区']
    }
  ],
  T001B: [
    {
      user_id: 'U2201',
      name: '刘楠',
      phone: '13800660001',
      role: 'lead',
      status: 'active',
      joined_at: '2024-05-15T10:00:00+08:00',
      team_path: ['华南大区', '深圳一区']
    }
  ],
  T001B1: [
    {
      user_id: 'U3301',
      name: '许诺',
      phone: '13800770001',
      role: 'lead',
      status: 'active',
      joined_at: '2024-04-02T09:45:00+08:00',
      team_path: ['华南大区', '深圳一区', '南山大客户组']
    }
  ],
  T002: [
    {
      user_id: 'U4101',
      name: '唐悦',
      phone: '13807770001',
      role: 'lead',
      status: 'active',
      joined_at: '2024-02-20T10:00:00+08:00',
      team_path: ['华东大区']
    }
  ],
  T003: [
    {
      user_id: 'U5001',
      name: '王群',
      phone: '13808880001',
      role: 'lead',
      status: 'active',
      joined_at: '2024-06-15T09:10:00+08:00',
      team_path: ['中西运营中心']
    }
  ]
};

let importStatus: 'queued' | 'processing' | 'succeeded' = 'queued';

function buildListResponse(): { teams: TeamNode[] } {
  return {
    teams: Object.values(tree)
      .filter((node) => node.parent_id === null)
      .map((node) => ({ ...node }))
  };
}

function buildChildren(parentId: string) {
  return {
    parent_id: parentId,
    teams: (childrenMap[parentId] || []).map((id) => ({ ...tree[id] }))
  };
}

function isDescendant(sourceId: string, targetId: string): boolean {
  const queue = [...(childrenMap[sourceId] || [])];
  while (queue.length) {
    const current = queue.shift()!;
    if (current === targetId) return true;
    queue.push(...(childrenMap[current] || []));
  }
  return false;
}

export async function registerTeamsMocks(page: Page) {
  await page.route('**/api/v1/teams', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildListResponse()) });
      return;
    }
    route.fallback();
  });

  await page.route(/\/api\/v1\/teams\/([^/]+)$/, (route, match) => {
    const [, teamId] = match;
    if (route.request().method() === 'GET') {
      const payload = details[teamId];
      if (payload) {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
      } else {
        route.fulfill({ status: 404, body: JSON.stringify({ message: 'Not Found' }) });
      }
      return;
    }
    route.fallback();
  });

  await page.route(/\/api\/v1\/teams\/([^/]+)\/children$/, (route, match) => {
    const [, parentId] = match;
    if (route.request().method() === 'GET') {
      const payload = buildChildren(parentId);
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
      return;
    }
    route.fallback();
  });

  await page.route(/\/api\/v1\/teams\/([^/]+)\/members(\?.*)?$/, (route, match) => {
    const [, teamId] = match;
    const members = teamMembers[teamId] || [];
    const body = {
      team_id: teamId,
      total: members.length,
      page: 1,
      page_size: 20,
      items: members
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });

  await page.route(/\/api\/v1\/teams\/([^/]+)\/move$/, async (route, match) => {
    const [, teamId] = match;
    const payload = await route.request().postDataJSON();
    const targetId = payload?.target_team_id as string;
    if (!targetId || !tree[teamId] || !tree[targetId]) {
      route.fulfill({ status: 400, body: JSON.stringify({ message: 'invalid target' }) });
      return;
    }
    if (isDescendant(teamId, targetId)) {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'TEAM_LOOP', message: '无法将团队移动到其子节点下，请选择其他目标团队。' })
      });
      return;
    }
    const previousParent = tree[teamId].parent_id;
    if (previousParent) {
      childrenMap[previousParent] = (childrenMap[previousParent] || []).filter((id) => id !== teamId);
      tree[previousParent].has_children = Boolean(childrenMap[previousParent]?.length);
    }
    tree[teamId].parent_id = targetId;
    childrenMap[targetId] = [...(childrenMap[targetId] || []), teamId];
    tree[targetId].has_children = true;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        team_id: teamId,
        previous_parent_id: previousParent,
        new_parent_id: targetId
      })
    });
  });

  await page.route('**/api/v1/invites', async (route) => {
    const payload = await route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        invite_code: 'INV-TEAM-PLAY-001',
        target_team_id: payload.target_team_id,
        quota: payload.quota,
        expires_at: payload.expires_at,
        link: 'https://example.com/invite/INV-TEAM-PLAY-001'
      })
    });
  });

  await page.route('**/api/v1/members/import', async (route) => {
    importStatus = 'processing';
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        task_id: 'IMPORT-PLAY-001',
        status: importStatus,
        processed: 0,
        total: 120
      })
    });
  });

  await page.route('**/api/v1/members/import/IMPORT-PLAY-001', (route) => {
    importStatus = 'succeeded';
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        task_id: 'IMPORT-PLAY-001',
        status: importStatus,
        processed: 120,
        total: 120,
        finished_at: new Date().toISOString()
      })
    });
  });

  await page.route('**/api/v1/members/batch_move', async (route) => {
    const payload = await route.request().postDataJSON();
    const userIds = payload.user_ids as string[];
    const target = payload.target_team_id as string;
    const targetMembers = teamMembers[target] || [];
    userIds.forEach((id: string) => {
      const originEntry = Object.entries(teamMembers).find(([, records]) => records.some((item) => item.user_id === id));
      if (!originEntry) return;
      const [originTeam, records] = originEntry;
      const member = records.find((item) => item.user_id === id);
      if (!member) return;
      teamMembers[originTeam] = records.filter((item) => item.user_id !== id);
      targetMembers.push({
        ...member,
        team_path: [...member.team_path.slice(0, -1), tree[target].name]
      });
    });
    teamMembers[target] = targetMembers;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, moved_count: userIds.length, target_team_id: target })
    });
  });

  await page.route(/\/api\/v1\/teams\/([^/]+)\/grant$/, async (route, match) => {
    const [, teamId] = match;
    await route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, team_id: teamId, granted_roles: ['team_lead'] })
    });
  });

  await page.route('**/api/v1/exports/members', async (route) => {
    await route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-MEM-PLAY-001', status: 'pending', module: 'members' })
    });
  });

  await page.route('**/api/v1/exports/teams', async (route) => {
    await route.request().postDataJSON();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ export_id: 'EXP-TEAM-PLAY-001', status: 'pending', module: 'teams' })
    });
  });
}
