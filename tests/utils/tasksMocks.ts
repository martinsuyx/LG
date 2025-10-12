import type { Page } from '@playwright/test';

export type TaskStatus = 'draft' | 'published' | 'offline' | 'deprecated';

type ReviewRules = {
  auto_checks: Array<{ key: string; rule: string; level: 'error' | 'warn'; message: string }>;
  thresholds: Array<{ key: string; op: string; value: number; action: string }>;
  sampling: { percent: number; seed: string };
  double_review: boolean;
  sla: number;
};

type TaskRecord = {
  task_id: string;
  name: string;
  code: string;
  status: TaskStatus;
  version: number;
  desc?: string;
  start_time: string;
  end_time: string;
  visible_to_roles: string[];
  scope: {
    companies?: string[];
    cities?: string[];
    stores?: string[];
  };
  form_dsl_id: string;
  form_dsl: {
    schema_version?: string;
    fields_map: Array<{ dsl_key: string; biz_key: string; required: boolean; validation?: Record<string, unknown> }>;
  };
  review_rules: ReviewRules;
  risk_policy_id?: string | null;
  risk_action?: 'block' | 'queue' | 'flag';
  release: {
    mode: 'immediate' | 'scheduled' | 'gray';
    schedule_time?: string | null;
    gray_percent?: number | null;
    rollback_to_version?: number | null;
  };
  versions: Array<{ version: number; operator: string; time: string; changelog: string; diff?: Record<string, unknown> }>;
};

const tasks: Record<string, TaskRecord> = {
  T20251003001: {
    task_id: 'T20251003001',
    name: '实名开户提交',
    code: 'OPENKYC',
    status: 'draft',
    version: 1,
    desc: '实名开户流程任务，采集身份信息并自动校验。',
    start_time: '2025-10-05T00:00:00+08:00',
    end_time: '2025-12-31T23:59:59+08:00',
    visible_to_roles: ['operator', 'reviewer'],
    scope: { companies: ['华南事业部'], cities: ['GZ'], stores: [] },
    form_dsl_id: 'F123',
    form_dsl: {
      schema_version: '1.4.2',
      fields_map: [
        { dsl_key: 'name', biz_key: 'customer_name', required: true },
        { dsl_key: 'id_number', biz_key: 'customer_id', required: true, validation: { type: 'regex', value: '^\\\d{17}[\\\dX]$' } },
        { dsl_key: 'amount', biz_key: 'loan_amount', required: false, validation: { type: 'range', min: 0, max: 99999 } }
      ]
    },
    review_rules: {
      auto_checks: [
        { key: 'id_number', rule: 'regex_cn_id', level: 'error', message: '证件号格式错误' },
        { key: 'name', rule: 'not_empty', level: 'error', message: '姓名不能为空' }
      ],
      thresholds: [{ key: 'amount', op: '>=', value: 59, action: 'manual_review' }],
      sampling: { percent: 10, seed: '202510' },
      double_review: false,
      sla: 60
    },
    risk_policy_id: 'R001',
    risk_action: 'queue',
    release: { mode: 'immediate', gray_percent: 0, rollback_to_version: null },
    versions: [
      {
        version: 1,
        operator: 'alice',
        time: '2025-10-05T10:00:00+08:00',
        changelog: '创建任务草稿'
      },
      {
        version: 0,
        operator: 'system',
        time: '2025-09-30T09:00:00+08:00',
        changelog: '初始化模板'
      }
    ]
  },
  T20250915005: {
    task_id: 'T20250915005',
    name: '门店回访抽审',
    code: 'STORECHK',
    status: 'published',
    version: 4,
    start_time: '2025-09-15T00:00:00+08:00',
    end_time: '2025-11-30T23:59:59+08:00',
    visible_to_roles: ['reviewer'],
    scope: { cities: ['SZ', 'FS'], stores: ['SZ101', 'FS002'] },
    form_dsl_id: 'F208',
    form_dsl: {
      schema_version: '2.0.1',
      fields_map: [
        { dsl_key: 'store_code', biz_key: 'store_code', required: true },
        { dsl_key: 'feedback', biz_key: 'feedback_text', required: true }
      ]
    },
    review_rules: {
      auto_checks: [{ key: 'feedback', rule: 'not_empty', level: 'warn', message: '请填写回访反馈' }],
      thresholds: [],
      sampling: { percent: 30, seed: '202509' },
      double_review: true,
      sla: 120
    },
    risk_policy_id: 'R006',
    risk_action: 'block',
    release: { mode: 'gray', gray_percent: 30, rollback_to_version: 3 },
    versions: []
  }
};

function buildListPayload() {
  return {
    total: Object.keys(tasks).length,
    page: 1,
    page_size: 20,
    items: Object.values(tasks).map(({ versions, form_dsl, review_rules, risk_action, ...rest }) => rest)
  };
}

export async function registerTasksMocks(page: Page) {
  await page.route('**/api/v1/tasks?**', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(buildListPayload()) });
  });

  await page.route('**/api/v1/tasks/*/versions?**', (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    const record = tasks[id];
    const payload = {
      total: record ? record.versions.length : 0,
      page: 1,
      page_size: 20,
      items: record ? record.versions : []
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });

  await page.route('**/api/v1/tasks/*/validate', async (route) => {
    const response = {
      ok: true,
      missing_fields: [],
      invalid_rules: [],
      warnings: [{ message: '抽审比例 10%，请确认容量' }]
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });

  await page.route('**/api/v1/tasks/T20251003001', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tasks.T20251003001) });
  });

  await page.route('**/api/v1/tasks/T20250915005', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(tasks.T20250915005) });
  });

  await page.route('**/api/v1/tasks', async (route) => {
    if (route.request().method() === 'POST') {
      const payload = await route.request().postDataJSON();
      const newId = `T${Date.now()}`;
      tasks[newId] = {
        task_id: newId,
        name: payload.name,
        code: payload.code,
        status: 'draft',
        version: 1,
        desc: payload.desc,
        start_time: payload.start_time,
        end_time: payload.end_time,
        visible_to_roles: payload.visible_to_roles || [],
        scope: payload.scope || {},
        form_dsl_id: payload.form_dsl_id,
        form_dsl: payload.form_dsl || { fields_map: [] },
        review_rules: payload.review_rules || { auto_checks: [], thresholds: [], sampling: { percent: 0, seed: '' }, double_review: false, sla: 60 },
        risk_policy_id: payload.risk_policy_id,
        risk_action: payload.risk_action || 'queue',
        release: payload.release || { mode: 'immediate', gray_percent: 0, rollback_to_version: null },
        versions: [
          {
            version: 1,
            operator: 'auto',
            time: new Date().toISOString(),
            changelog: '自动生成草稿'
          }
        ]
      };
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task_id: newId, status: 'draft', version: 1 }) });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/tasks/*', async (route) => {
    const segments = route.request().url().split('/');
    const id = segments.at(-1) as string;
    if (route.request().method() === 'PUT') {
      const payload = await route.request().postDataJSON();
      const record = tasks[id];
      if (record) {
        tasks[id] = {
          ...record,
          ...payload,
          task_id: id,
          status: record.status,
          version: record.version + 1
        };
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task_id: id, status: record?.status || 'draft', version: (tasks[id]?.version) || 1 }) });
      return;
    }
    route.fallback();
  });

  await page.route('**/api/v1/tasks/*/publish', (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    if (tasks[id]) {
      tasks[id].status = 'published';
      tasks[id].version += 1;
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, new_status: 'published', version: tasks[id]?.version || 1 }) });
  });

  await page.route('**/api/v1/tasks/*/offline', async (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    const payload = await route.request().postDataJSON();
    if (tasks[id]) {
      tasks[id].status = 'offline';
      tasks[id].versions.unshift({
        version: tasks[id].version,
        operator: 'admin',
        time: new Date().toISOString(),
        changelog: `下架原因：${payload.reason}`
      });
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, new_status: 'offline' }) });
  });

  await page.route('**/api/v1/tasks/*/clone', (route) => {
    const id = route.request().url().split('/').at(-2) as string;
    const source = tasks[id];
    const newId = `${id}-COPY`;
    tasks[newId] = {
      ...source,
      task_id: newId,
      name: `${source.name}（副本）`,
      code: `${source.code}NEW`.slice(0, 16),
      status: 'draft',
      version: 1,
      release: { mode: 'immediate', gray_percent: 0, rollback_to_version: null }
    };
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ task_id: newId, status: 'draft', version: 1, source_task_id: id }) });
  });

  await page.route('**/api/v1/exports/tasks', (route) => {
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ export_id: 'EXP-TASKS-001', status: 'pending' }) });
  });
}
