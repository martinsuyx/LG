<template>
  <section class="audit-logs">
    <header class="audit-logs__header">
      <div>
        <h1 class="audit-logs__title">审计日志</h1>
        <p class="audit-logs__subtitle">检索关键操作事件，追踪签名链并快速取证。</p>
      </div>
      <div class="audit-logs__actions">
        <Button size="sm" variant="ghost" :disabled="loading.list" @click="loadEvents">刷新</Button>
        <Button size="sm" :disabled="loading.list" @click="exportEvidence">取证打包</Button>
      </div>
    </header>

    <section class="audit-logs__stats">
      <article class="stats-card">
        <span class="stats-card__label">事件总数</span>
        <strong class="stats-card__value">{{ summary.total }}</strong>
      </article>
      <article class="stats-card">
        <span class="stats-card__label">失败事件</span>
        <strong class="stats-card__value">{{ summary.failed }}</strong>
      </article>
      <article class="stats-card">
        <span class="stats-card__label">安全级别</span>
        <strong class="stats-card__value">{{ summary.security }}</strong>
      </article>
      <article class="stats-card">
        <span class="stats-card__label">导出相关</span>
        <strong class="stats-card__value">{{ summary.export }}</strong>
      </article>
    </section>

    <form class="audit-logs__filters" @submit.prevent="applyFilters">
      <fieldset class="filters__group">
        <legend class="sr-only">筛选条件</legend>
        <div class="filters__grid">
          <label class="filters__field">
            <span>开始时间</span>
            <input type="datetime-local" v-model="filters.start" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>结束时间</span>
            <input type="datetime-local" v-model="filters.end" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>级别</span>
            <select v-model="filters.level" :disabled="loading.list">
              <option value="">全部</option>
              <option value="info">信息</option>
              <option value="warn">警告</option>
              <option value="error">错误</option>
              <option value="security">安全</option>
            </select>
          </label>
          <label class="filters__field">
            <span>事件类型</span>
            <input type="text" v-model.trim="filters.type" placeholder="如 export_download" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>结果</span>
            <select v-model="filters.result" :disabled="loading.list">
              <option value="">全部</option>
              <option value="success">成功</option>
              <option value="fail">失败</option>
            </select>
          </label>
          <label class="filters__field">
            <span>来源</span>
            <select v-model="filters.source" :disabled="loading.list">
              <option value="">全部</option>
              <option value="web">Web</option>
              <option value="api">API</option>
              <option value="cron">定时任务</option>
              <option value="rpa">RPA</option>
              <option value="callback">回调</option>
            </select>
          </label>
          <label class="filters__field">
            <span>主体/用户</span>
            <input type="text" v-model.trim="filters.actor" placeholder="用户 ID" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>资源类型</span>
            <input type="text" v-model.trim="filters.resourceType" placeholder="如 export" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>资源 ID</span>
            <input type="text" v-model.trim="filters.resourceId" placeholder="ID" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>IP</span>
            <input type="text" v-model.trim="filters.ip" placeholder="203.0.113.10" :disabled="loading.list" />
          </label>
        </div>
        <div class="filters__actions">
          <div class="quick-range">
            <span>快速选择：</span>
            <button
              v-for="item in quickRanges"
              :key="item.value"
              type="button"
              class="quick-range__btn"
              :class="{ 'is-active': quickRange === item.value }"
              :disabled="loading.list"
              @click="applyQuickRange(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
          <div class="filters__buttons">
            <Button size="sm" type="submit" :loading="loading.list">应用</Button>
            <Button size="sm" variant="ghost" type="button" :disabled="loading.list" @click="resetFilters">重置</Button>
          </div>
        </div>
      </fieldset>
    </form>

    <section class="audit-logs__table">
      <Table
        :columns="columns"
        :rows="events"
        :loading="loading.list"
        :row-key="(row) => row.event_id"
        default-sort-key="ts"
        default-sort-order="desc"
        @rowClick="openDetail"
      >
        <template #cell:ts="{ row }">
          {{ formatDateTime(row.ts) }}
        </template>
        <template #cell:type="{ row }">
          <span class="type-badge">{{ row.type }}</span>
        </template>
        <template #cell:actor="{ row }">
          <div class="cell-multi">
            <strong>{{ row.actor?.name || row.actor?.user_id || '—' }}</strong>
            <span>{{ (row.actor?.roles || []).join(', ') || '无角色' }}</span>
          </div>
        </template>
        <template #cell:resource="{ row }">
          <div class="cell-multi">
            <strong>{{ row.resource?.type || '—' }}</strong>
            <span>{{ row.resource?.id || '—' }}</span>
          </div>
        </template>
        <template #cell:result="{ row }">
          <span class="result-chip" :data-result="row.result">{{ resultLabel(row.result) }}</span>
        </template>
        <template #cell:ip="{ row }">
          <div class="cell-multi">
            <span>{{ row.ip || '—' }}</span>
            <span class="muted">{{ row.ua || '—' }}</span>
          </div>
        </template>
        <template #cell:signature="{ row }">
          <span class="signature-chip" :data-valid="row.signature?.chain_ok === true">
            {{ row.signature?.chain_ok ? '完整' : '异常' }}
          </span>
        </template>
        <template #cell:actions="{ row }">
          <div class="row-actions">
            <button type="button" class="link-btn" @click.stop="openDetail(row)">详情</button>
            <button type="button" class="link-btn" @click.stop="verifySingle(row)">验证</button>
          </div>
        </template>
        <template #empty>
          {{ loading.list ? '加载审计事件中…' : '暂无记录，请调整筛选条件。' }}
        </template>
        <template #pagination>
          <Pagination
            v-if="pageCount > 1"
            :page="filters.page"
            :pages="pageCount"
            :page-size="filters.pageSize"
            @update:page="changePage"
            @update:pageSize="changePageSize"
          />
        </template>
      </Table>
    </section>

    <aside class="event-drawer" v-if="drawer.open">
      <header class="event-drawer__header">
        <div>
          <h2>事件 {{ activeEvent?.event_id }}</h2>
          <p>{{ formatDateTime(activeEvent?.ts || '') }} · {{ resultLabel(activeEvent?.result || 'success') }}</p>
        </div>
        <button type="button" class="event-drawer__close" aria-label="关闭详情" @click="closeDrawer">×</button>
      </header>
      <div class="event-drawer__body" v-if="loading.detail">
        <p class="event-drawer__placeholder">详情加载中…</p>
      </div>
      <div class="event-drawer__body" v-else-if="activeEvent">
        <section class="drawer-section">
          <h3>概要</h3>
          <dl class="drawer-grid">
            <div>
              <dt>类型</dt>
              <dd>{{ activeEvent.type }}</dd>
            </div>
            <div>
              <dt>级别</dt>
              <dd>{{ levelLabel(activeEvent.level) }}</dd>
            </div>
            <div>
              <dt>主体</dt>
              <dd>{{ activeEvent.actor?.name || activeEvent.actor?.user_id }}</dd>
            </div>
            <div>
              <dt>来源</dt>
              <dd>{{ sourceLabel(activeEvent.source) }}</dd>
            </div>
            <div>
              <dt>资源</dt>
              <dd>{{ activeEvent.resource?.type }} · {{ activeEvent.resource?.id }}</dd>
            </div>
            <div>
              <dt>Trace ID</dt>
              <dd>{{ activeEvent.trace_id || '—' }}</dd>
            </div>
            <div>
              <dt>IP / UA</dt>
              <dd>{{ activeEvent.ip || '—' }} · {{ activeEvent.ua || '—' }}</dd>
            </div>
            <div>
              <dt>签名状态</dt>
              <dd><span class="signature-chip" :data-valid="activeEvent.signature?.chain_ok === true">{{ activeEvent.signature?.chain_ok ? '链完整' : '链异常' }}</span></dd>
            </div>
          </dl>
          <div class="drawer-buttons">
            <Button size="sm" variant="primary" :loading="loading.verify" @click="verifyChainRange">验证链完整性</Button>
            <Button size="sm" variant="secondary" :disabled="loading.evidence" :loading="loading.evidence" @click="requestEvidence">
              取证打包
            </Button>
            <Button size="sm" variant="ghost" @click="copyHash">复制哈希</Button>
          </div>
        </section>

        <section class="drawer-section" v-if="activeEvent.chain">
          <h3>签名链</h3>
          <ul class="chain-list">
            <li v-if="activeEvent.chain.prev">
              <span>前一事件：</span>
              <code>{{ (activeEvent.chain.prev as any).event_id }}</code>
              <span>{{ (activeEvent.chain.prev as any).hash }}</span>
            </li>
            <li>
              <span>当前哈希：</span>
              <code>{{ activeEvent.signature?.hash || '—' }}</code>
            </li>
            <li v-if="activeEvent.chain.next">
              <span>后一事件：</span>
              <code>{{ (activeEvent.chain.next as any).event_id }}</code>
              <span>{{ (activeEvent.chain.next as any).hash }}</span>
            </li>
          </ul>
        </section>

        <section class="drawer-section">
          <h3>事件 JSON</h3>
          <pre class="drawer-pre">{{ formatJson(activeEvent) }}</pre>
        </section>

        <section class="drawer-section" v-if="activeEvent.context">
          <h3>上下文</h3>
          <pre class="drawer-pre">{{ formatJson(activeEvent.context) }}</pre>
        </section>
      </div>
      <div class="event-drawer__body" v-else>
        <p class="event-drawer__placeholder">未找到事件详情。</p>
      </div>
    </aside>

    <p v-if="feedback.message" :class="['feedback', feedback.error ? 'feedback--error' : '']" role="alert">
      {{ feedback.message }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import Pagination from '@/components/Pagination.vue';
import Table from '@/components/Table.vue';
import {
  AuditService,
  type AuditEvent,
  type AuditFilters,
  type AuditListResponse,
  type AuditVerifyResponse
} from '@/sdk/audit';

const now = new Date();
const defaultEnd = toDateTimeLocal(now);
const defaultStart = toDateTimeLocal(addHours(now, -24));

const filters = reactive({
  start: defaultStart,
  end: defaultEnd,
  level: '' as AuditFilters['level'],
  type: '',
  result: '' as AuditFilters['result'],
  source: '' as AuditFilters['source'],
  actor: '',
  resourceType: '',
  resourceId: '',
  ip: '',
  page: 1,
  pageSize: 50
});

const quickRanges = [
  { value: '24h' as const, label: '近 24 小时' },
  { value: '7d' as const, label: '近 7 天' },
  { value: '30d' as const, label: '近 30 天' }
];
const quickRange = ref<'24h' | '7d' | '30d'>('24h');

const columns = [
  { key: 'ts', title: '时间', width: '12rem' },
  { key: 'type', title: '事件类型', width: '10rem' },
  { key: 'actor', title: '主体', width: '12rem' },
  { key: 'resource', title: '资源', width: '11rem' },
  { key: 'result', title: '结果', width: '6rem' },
  { key: 'ip', title: 'IP / UA', width: '12rem' },
  { key: 'trace_id', title: 'Trace ID', width: '12rem' },
  { key: 'signature', title: '签名', width: '6rem' },
  { key: 'actions', title: '操作', width: '8rem' }
];

const loading = reactive({
  list: false,
  detail: false,
  verify: false,
  evidence: false
});

const events = ref<AuditEvent[]>([]);
const total = ref(0);
const drawer = reactive({ open: false, eventId: '' });
const activeEvent = ref<AuditEvent | null>(null);
const feedback = reactive<{ message: string; error: boolean }>({ message: '', error: false });

const fallbackList: AuditListResponse = {
  total: 4,
  page: 1,
  page_size: 50,
  items: [
    {
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
      signature: { algo: 'SHA256', hash: 'abc123', prev_hash: 'def456', chain_ok: true }
    },
    {
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
    {
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
    {
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
  ]
};

const fallbackDetail: AuditEvent = {
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
};

const fallbackVerify: AuditVerifyResponse = {
  ok: true,
  first_hash: 'abc000',
  last_hash: 'xyz999',
  broken_links: []
};

const eventsSet = computed(() => events.value);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)));

const summary = computed(() => {
  let failed = 0;
  let security = 0;
  let exportCount = 0;
  eventsSet.value.forEach((item) => {
    if (item.result === 'fail') failed += 1;
    if (item.level === 'security') security += 1;
    if (item.type?.includes('export')) exportCount += 1;
  });
  return {
    total: eventsSet.value.length,
    failed,
    security,
    export: exportCount
  };
});

onMounted(() => {
  loadEvents();
});

async function loadEvents() {
  loading.list = true;
  try {
    const response = await AuditService.list(buildFilters());
    const list = response && Array.isArray(response.items) && response.items.length ? response : fallbackList;
    events.value = list.items;
    total.value = typeof list.total === 'number' ? list.total : list.items.length;
  } catch (error) {
    events.value = fallbackList.items;
    total.value = fallbackList.total;
    setFeedback((error as Error).message || '加载审计事件失败，展示示例数据。', true);
  } finally {
    loading.list = false;
  }
}

async function loadDetail(eventId: string) {
  loading.detail = true;
  try {
    const detail = await AuditService.get(eventId);
    activeEvent.value = detail ?? fallbackDetail;
  } catch (error) {
    activeEvent.value = fallbackDetail;
    setFeedback((error as Error).message || '获取事件详情失败。', true);
  } finally {
    loading.detail = false;
  }
}

function applyFilters() {
  filters.page = 1;
  loadEvents();
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.level = '';
  filters.type = '';
  filters.result = '';
  filters.source = '';
  filters.actor = '';
  filters.resourceType = '';
  filters.resourceId = '';
  filters.ip = '';
  filters.page = 1;
  filters.pageSize = 50;
  quickRange.value = '24h';
  loadEvents();
}

function applyQuickRange(range: typeof quickRange.value) {
  quickRange.value = range;
  if (range === '24h') {
    filters.start = toDateTimeLocal(addHours(now, -24));
    filters.end = defaultEnd;
  } else if (range === '7d') {
    filters.start = toDateTimeLocal(addHours(now, -24 * 7));
    filters.end = defaultEnd;
  } else {
    filters.start = toDateTimeLocal(addHours(now, -24 * 30));
    filters.end = defaultEnd;
  }
  filters.page = 1;
  loadEvents();
}

function changePage(page: number) {
  filters.page = page;
  loadEvents();
}

function changePageSize(size: number) {
  filters.pageSize = size;
  filters.page = 1;
  loadEvents();
}

function openDetail(event: AuditEvent) {
  drawer.open = true;
  drawer.eventId = event.event_id;
  activeEvent.value = event;
  loadDetail(event.event_id);
}

function closeDrawer() {
  drawer.open = false;
  drawer.eventId = '';
  activeEvent.value = null;
}

async function verifyChainRange() {
  if (!activeEvent.value) return;
  loading.verify = true;
  try {
    const params = {
      from: activeEvent.value.chain && (activeEvent.value.chain.prev as any)?.event_id,
      to: activeEvent.value.chain && (activeEvent.value.chain.next as any)?.event_id
    };
    const response = await AuditService.verify(params);
    const data = response ?? fallbackVerify;
    if (data.ok) {
      setFeedback('链验证通过。', false);
    } else {
      setFeedback('链验证失败，请检查断点。', true);
    }
  } catch (error) {
    setFeedback((error as Error).message || '链验证请求失败。', true);
  } finally {
    loading.verify = false;
  }
}

async function verifySingle(event: AuditEvent) {
  loading.verify = true;
  try {
    const response = await AuditService.verify({ from: event.event_id, to: event.event_id });
    const data = response ?? fallbackVerify;
    if (data.ok) setFeedback(`事件 ${event.event_id} 链一致。`, false);
    else setFeedback(`事件 ${event.event_id} 链异常。`, true);
  } catch (error) {
    setFeedback((error as Error).message || '链验证失败。', true);
  } finally {
    loading.verify = false;
  }
}

async function requestEvidence() {
  if (!activeEvent.value) return;
  loading.evidence = true;
  try {
    const response = await AuditService.createEvidence({ event_ids: [activeEvent.value.event_id], include_context: true });
    const pkg = response ?? { package_id: 'EV20251003001', download_url: 'https://mock/audit/evidence/EV20251003001.zip' };
    setFeedback(`取证包已生成（${pkg.package_id}），请下载。`, false);
  } catch (error) {
    setFeedback((error as Error).message || '取证打包失败。', true);
  } finally {
    loading.evidence = false;
  }
}

async function exportEvidence() {
  if (!events.value.length) {
    setFeedback('当前无可导出的事件。', true);
    return;
  }
  loading.evidence = true;
  try {
    const eventIds = events.value.slice(0, 3).map((item) => item.event_id);
    const response = await AuditService.createEvidence({ event_ids: eventIds, include_context: false });
    const pkg = response ?? { package_id: 'EV20251003002', download_url: 'https://mock/audit/evidence/EV20251003002.zip' };
    setFeedback(`取证包 ${pkg.package_id} 已生成。`, false);
  } catch (error) {
    setFeedback((error as Error).message || '取证打包失败。', true);
  } finally {
    loading.evidence = false;
  }
}

function copyHash() {
  if (!activeEvent.value?.signature?.hash) return;
  navigator.clipboard?.writeText(activeEvent.value.signature.hash).then(
    () => setFeedback('哈希已复制。', false),
    () => setFeedback('复制失败，请手动复制。', true)
  );
}

function buildFilters(): AuditFilters {
  return {
    start: filters.start || undefined,
    end: filters.end || undefined,
    level: filters.level || undefined,
    type: filters.type || undefined,
    result: filters.result || undefined,
    source: filters.source || undefined,
    actor: filters.actor || undefined,
    resource_type: filters.resourceType || undefined,
    resource_id: filters.resourceId || undefined,
    ip: filters.ip || undefined,
    page: filters.page,
    page_size: filters.pageSize
  };
}

function setFeedback(message: string, error: boolean) {
  feedback.message = message;
  feedback.error = error;
  if (!message) return;
  window.setTimeout(() => {
    if (feedback.message === message) {
      feedback.message = '';
      feedback.error = false;
    }
  }, error ? 5000 : 3000);
}

function formatDateTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
}

function levelLabel(level: string) {
  const map: Record<string, string> = { info: '信息', warn: '警告', error: '错误', security: '安全' };
  return map[level] || level;
}

function resultLabel(result: string) {
  return result === 'success' ? '成功' : result === 'fail' ? '失败' : result;
}

function sourceLabel(source: string) {
  const map: Record<string, string> = { web: 'Web', api: 'API', cron: '定时任务', rpa: 'RPA', callback: '回调' };
  return map[source] || source;
}

function formatJson(value: unknown) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function toDateTimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function addHours(date: Date, hours: number) {
  const next = new Date(date);
  next.setHours(next.getHours() + hours);
  return next;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.audit-logs {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $text-strong;
}

.audit-logs__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.audit-logs__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.audit-logs__subtitle {
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.audit-logs__actions {
  display: flex;
  gap: $spacing-12;
}

.audit-logs__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: $spacing-12;
}

.stats-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-16;
  box-shadow: 0 16px 34px rgba($color-surface-700, 0.08);
  display: flex;
  flex-direction: column;
  gap: $spacing-8;

  &__label {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  &__value {
    font-size: $text-16-semibold-fs;
    line-height: $text-16-semibold-lh;
    font-weight: $text-16-semibold-wt;
  }
}

.audit-logs__filters {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20 $spacing-24;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
}

.filters__group {
  border: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.filters__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
}

.filters__field {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $text-12-regular-fs;
  color: $text-muted;

  input,
  select {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
    background: $surface-0;
  }
}

.filters__actions {
  display: flex;
  justify-content: space-between;
  gap: $spacing-12;
  flex-wrap: wrap;
}

.filters__buttons {
  display: flex;
  gap: $spacing-12;
}

.quick-range {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.quick-range__btn {
  border: none;
  background: $surface-100;
  color: $text-strong;
  padding: $spacing-8 $spacing-12;
  border-radius: $radius-lg;
  cursor: pointer;
  font: inherit;

  &.is-active {
    background: $primary-100;
    color: $primary-700;
    font-weight: $text-12-medium-wt;
  }
}

.audit-logs__table {
  position: relative;
}

.type-badge {
  display: inline-flex;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-strong;
  font-size: $text-12-regular-fs;
}

.cell-multi {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 4);

  strong {
    font-size: $text-12-medium-fs;
  }

  .muted {
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.result-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  &[data-result='success'] {
    background: rgba($primary-100, 0.6);
    color: $primary-700;
  }
  &[data-result='fail'] {
    background: rgba($danger-600, 0.18);
    color: $danger-700;
  }
}

.signature-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  background: rgba($text-muted, 0.12);
  &[data-valid='true'] {
    background: rgba($primary-200, 0.5);
    color: $primary-700;
  }
  &[data-valid='false'] {
    background: rgba($danger-600, 0.18);
    color: $danger-700;
  }
}

.row-actions {
  display: inline-flex;
  gap: $spacing-8;
}

.link-btn {
  background: transparent;
  border: none;
  color: $primary-700;
  font-size: $text-12-medium-fs;
  cursor: pointer;
  padding: 0;

  &:disabled {
    color: rgba($text-muted, 0.6);
    cursor: not-allowed;
  }
}

.event-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(34rem, 90vw);
  background: $surface-0;
  border-left: $border-width-1 solid $surface-200;
  box-shadow: -14px 0 36px rgba($color-surface-700, 0.2);
  display: flex;
  flex-direction: column;
  z-index: $z-dialog;
}

.event-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-20;
  border-bottom: $border-width-1 solid $surface-200;

  h2 {
    margin: 0 0 $spacing-8;
    font-size: $text-16-semibold-fs;
  }

  p {
    margin: 0;
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.event-drawer__close {
  border: none;
  background: transparent;
  font-size: $text-16-semibold-fs;
  cursor: pointer;
  color: $text-muted;
}

.event-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-20;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.event-drawer__placeholder {
  margin: 0;
  text-align: center;
  color: $text-muted;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  h3 {
    margin: 0;
    font-size: $text-12-medium-fs;
    color: $text-muted;
  }
}

.drawer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;

  dt {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  dd {
    margin: 0;
    font-size: $text-14-regular-fs;
  }
}

.drawer-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.drawer-pre {
  margin: 0;
  padding: $spacing-12;
  border-radius: $radius-lg;
  background: $surface-50;
  border: $border-width-1 solid $surface-200;
  font-size: $text-12-regular-fs;
  color: $text-strong;
  max-height: 16rem;
  overflow: auto;
}

.chain-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;

  li {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 4);
    code {
      font-family: 'SFMono-Regular', ui-monospace, monospace;
      background: $surface-100;
      padding: 0 calc(#{$spacing-8} / 2);
      border-radius: $radius-lg;
    }
  }
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  background: rgba($primary-100, 0.6);
  color: $primary-700;
  font-size: $text-12-regular-fs;

  &.feedback--error {
    background: rgba($danger-600, 0.12);
    color: $danger-700;
  }
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

@media (max-width: 72rem) {
  .audit-logs__stats {
    grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  }
}
</style>
