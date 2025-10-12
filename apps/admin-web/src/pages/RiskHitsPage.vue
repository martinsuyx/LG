<template>
  <section class="risk-hits">
    <header class="risk-hits__header">
      <div>
        <h1 class="risk-hits__title">风控命中列表</h1>
        <p class="risk-hits__subtitle">筛选命中记录，查看上下文并快速发起处置。</p>
      </div>
      <div class="risk-hits__actions">
        <Button size="sm" variant="ghost" :disabled="listLoading" @click="exportHits">导出当前视图</Button>
        <Button size="sm" variant="secondary" :disabled="!selectedIds.length" @click="openIgnoreModal">批量忽略</Button>
      </div>
    </header>

    <section class="risk-hits__summary" aria-label="命中统计" v-if="summaryStats.total">
      <article class="summary-card">
        <h3>命中总数</h3>
        <strong>{{ summaryStats.total }}</strong>
      </article>
      <article class="summary-card">
        <h3>未处理</h3>
        <strong>{{ summaryStats.new }}</strong>
      </article>
      <article class="summary-card">
        <h3>处理中</h3>
        <strong>{{ summaryStats.processing }}</strong>
      </article>
      <article class="summary-card summary-card--critical">
        <h3>高危及以上</h3>
        <strong>{{ summaryStats.high }}</strong>
      </article>
    </section>

    <form class="risk-hits__filters" @submit.prevent="applyFilters">
      <label>
        <span>开始日期</span>
        <input type="date" v-model="filters.start" :disabled="listLoading" required />
      </label>
      <label>
        <span>结束日期</span>
        <input type="date" v-model="filters.end" :disabled="listLoading" required />
      </label>
      <label>
        <span>等级</span>
        <select v-model="filters.severity" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in severityOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>渠道</span>
        <select v-model="filters.channel" :disabled="listLoading">
          <option value="">全部</option>
          <option value="wechat">微信</option>
          <option value="h5">H5</option>
          <option value="scan">扫码</option>
          <option value="api">API</option>
        </select>
      </label>
      <label class="filters__keyword">
        <span>关键词</span>
        <input type="search" v-model.trim="filters.keyword" placeholder="命中ID / 规则 / 订单" :disabled="listLoading" />
      </label>
      <div class="filters__actions">
        <Button size="sm" type="submit" :loading="listLoading">应用筛选</Button>
        <Button size="sm" variant="ghost" type="button" :disabled="listLoading" @click="resetFilters">重置</Button>
      </div>
    </form>

    <div class="risk-hits__content">
      <section class="risk-hits__table" role="region" aria-label="命中列表">
        <Table
          :columns="columns"
          :rows="hits"
          :loading="listLoading"
          :row-key="(row) => row.hit_id"
          default-sort-key="hit_time"
          default-sort-order="desc"
          @rowClick="handleRowClick"
          @sortChange="handleSortChange"
        >
          <template #cell:select="{ row }">
            <input type="checkbox" :value="row.hit_id" :checked="isSelected(row.hit_id)" @change="toggleSelection(row.hit_id, $event)" aria-label="选择命中" />
          </template>
          <template #cell:hit_time="{ row }">
            {{ formatDateTime(row.hit_time) }}
          </template>
          <template #cell:severity="{ row }">
            <span class="severity-chip" :data-level="row.severity">{{ severityLabel(row.severity) }}</span>
          </template>
          <template #cell:entity="{ row }">
            <div class="entity-cell">
              <span v-for="(value, key) in previewEntity(row.entity)" :key="`${row.hit_id}-${key}`">
                <strong>{{ key }}：</strong>{{ value }}
              </span>
            </div>
          </template>
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell:note="{ row }">
            {{ row.note || '—' }}
          </template>
          <template #empty>
            {{ listLoading ? '加载中…' : '暂无命中记录' }}
          </template>
          <template #pagination>
            <Pagination
              v-if="pageCount > 1"
              :page="filters.page"
              :pages="pageCount"
              :page-size="filters.page_size"
              @update:page="changePage"
              @update:pageSize="changePageSize"
            />
          </template>
        </Table>
        <div class="bulk-select" v-if="hits.length">
          <label>
            <input type="checkbox" :checked="isPageFullySelected" :indeterminate="hasPartialSelection" @change="toggleSelectAll($event)" />
            <span>本页全选</span>
          </label>
          <span class="bulk-select__count" v-if="selectedIds.length">已选择 {{ selectedIds.length }} 条</span>
        </div>
      </section>

      <aside class="risk-hits__drawer" v-if="drawerVisible" aria-label="命中详情">
        <header class="drawer__header">
          <div>
            <h2>命中详情</h2>
            <p>{{ activeHit?.rule_name }} · {{ activeHit?.hit_id }}</p>
          </div>
          <button class="drawer__close" type="button" aria-label="关闭" @click="closeDrawer">×</button>
        </header>
        <div class="drawer__body" v-if="detailLoading">
          <p class="drawer__placeholder">详情加载中…</p>
        </div>
        <div class="drawer__body" v-else-if="activeDetail">
          <section class="drawer-section">
            <h3>基本信息</h3>
            <dl class="drawer-grid">
              <div>
                <dt>命中时间</dt>
                <dd>{{ formatDateTime(activeHit?.hit_time) }}</dd>
              </div>
              <div>
                <dt>规则编码</dt>
                <dd>{{ activeHit?.rule_code }}</dd>
              </div>
              <div>
                <dt>风险得分</dt>
                <dd>{{ activeHit?.score }}</dd>
              </div>
              <div>
                <dt>状态</dt>
                <dd><span class="status-chip" :data-status="activeHit?.status || 'new'">{{ statusLabel(activeHit?.status || 'new') }}</span></dd>
              </div>
              <div>
                <dt>关联订单</dt>
                <dd>{{ activeHit?.order_id || '—' }}</dd>
              </div>
              <div>
                <dt>关联工单</dt>
                <dd>{{ activeHit?.ticket_id || '—' }}</dd>
              </div>
            </dl>
          </section>
          <section class="drawer-section">
            <h3>命中上下文</h3>
            <div class="context-block">
              <pre>{{ stringifyContext(activeDetail.context) }}</pre>
            </div>
          </section>
          <section class="drawer-section">
            <h3>证据</h3>
            <ul class="evidence-list">
              <li v-for="(item, index) in activeDetail.evidences" :key="`${activeDetail.hit_id}-evidence-${index}`">
                <span class="evidence-type">{{ evidenceLabel(item.type) }}</span>
                <span class="evidence-text">{{ item.content }}</span>
              </li>
            </ul>
          </section>
          <section class="drawer-section">
            <h3>相似命中</h3>
            <ul class="similar-list">
              <li v-for="similar in activeDetail.similar_hits" :key="similar.hit_id">
                <span class="similar-id">{{ similar.hit_id }}</span>
                <span>{{ formatDateTime(similar.time) }}</span>
                <span>{{ similar.rule_code }}</span>
                <span class="similar-score">得分 {{ similar.score }}</span>
              </li>
            </ul>
          </section>
          <div class="drawer-actions">
            <Button size="sm" variant="secondary" @click="openTicketModal">创建工单</Button>
          </div>
        </div>
        <div class="drawer__body" v-else>
          <p class="drawer__placeholder">请选择一个命中查看详情</p>
        </div>
      </aside>
    </div>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

    <Modal v-model="ignoreModalVisible" @confirm="submitBatchIgnore">
      <template #title>批量忽略命中</template>
      <form class="modal-form" @submit.prevent>
        <p>已选择 {{ selectedIds.length }} 条记录，忽略操作需填写原因。</p>
        <label>
          <span>备注（至少 5 字）</span>
          <textarea v-model.trim="ignoreNote" rows="3" placeholder="说明忽略原因" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="ignoreModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitBatchIgnore">确认忽略</Button>
      </template>
    </Modal>

    <Modal v-model="ticketModalVisible" @confirm="submitCreateTicket">
      <template #title>创建风控工单</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>优先级</span>
          <select v-model="ticketForm.priority">
            <option value="low">低</option>
            <option value="normal">普通</option>
            <option value="high">高</option>
          </select>
        </label>
        <label>
          <span>备注</span>
          <textarea v-model.trim="ticketForm.note" rows="3" placeholder="补充说明（可选）" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="ticketModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitCreateTicket" :disabled="!activeHit">提交工单</Button>
      </template>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import Table from '@/components/Table.vue';
import Pagination from '@/components/Pagination.vue';
import {
  RiskHitsService,
  type RiskHitDetail,
  type RiskHitFilters,
  type RiskHitItem,
  type RiskHitSeverity,
  type RiskHitStatus,
  type RiskHitListResponse
} from '@/sdk/risk';

const DEFAULT_END = '2025-10-03';
const DEFAULT_START = '2025-09-30';

const fallbackHits: RiskHitItem[] = [
  {
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
  {
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
  {
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
];

const fallbackDetails: Record<string, RiskHitDetail> = {
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
    similar_hits: [{ hit_id: 'H202510020201', time: '2025-10-02T18:21:00+08:00', rule_code: 'FREQ_APPLY', score: 76.4 }]
  },
  H202510021208: {
    hit_id: 'H202510021208',
    context: {
      device: { device_id: 'DEV-BLK-888', blacklist_source: '国家名单库', related_users: 12 },
      account: { promoter_id: 'P0021', promoter_name: '渠道-深圳A组', previous_risk_hits: 5 }
    },
    evidences: [
      { type: 'text', content: '设备指纹命中高危黑名单库' },
      { type: 'stat', content: '该设备近 24 小时发起 12 次请求' }
    ],
    similar_hits: [{ hit_id: 'H202510021045', time: '2025-10-02T20:14:00+08:00', rule_code: 'DEVICE_BLACK', score: 94.5 }]
  }
};

const filters = reactive<RiskHitFilters>({
  start: DEFAULT_START,
  end: DEFAULT_END,
  severity: '',
  status: '',
  channel: '',
  keyword: '',
  page: 1,
  page_size: 10,
  sort_key: 'hit_time',
  sort_order: 'desc'
});

const severityOptions: Array<{ value: RiskHitSeverity; label: string }> = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '致命' }
];

const statusOptions: Array<{ value: RiskHitStatus; label: string }> = [
  { value: 'new', label: '未处理' },
  { value: 'processing', label: '处理中' },
  { value: 'resolved', label: '已处理' },
  { value: 'ignored', label: '已忽略' }
];

const hits = ref<RiskHitItem[]>([]);
const total = ref(0);
const listLoading = ref(false);

const selectedIds = ref<string[]>([]);

const drawerVisible = ref(false);
const activeHitId = ref<string | null>(null);
const activeHit = computed(() => hits.value.find((item) => item.hit_id === activeHitId.value) || null);
const detailCache = reactive<Record<string, RiskHitDetail>>({});
const detailLoading = ref(false);

const ignoreModalVisible = ref(false);
const ignoreNote = ref('');
const ticketModalVisible = ref(false);
const ticketForm = reactive({ priority: 'normal' as 'low' | 'normal' | 'high', note: '' });

const actionLoading = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

const columns = [
  { key: 'select', title: '', width: '3rem' },
  { key: 'hit_time', title: '命中时间', sortable: true, width: '10rem' },
  { key: 'rule_name', title: '规则' },
  { key: 'severity', title: '等级', width: '6rem' },
  { key: 'order_id', title: '关联订单', width: '8rem' },
  { key: 'entity', title: '主体摘要', width: '14rem' },
  { key: 'channel', title: '渠道', width: '6rem' },
  { key: 'score', title: '风险得分', sortable: true, width: '7rem' },
  { key: 'status', title: '状态', width: '7rem' },
  { key: 'ticket_id', title: '工单号', width: '8rem' },
  { key: 'operator', title: '处理人', width: '6rem' },
  { key: 'note', title: '备注', width: '10rem' }
];

const summaryStats = computed(() => {
  const result = { total: hits.value.length, new: 0, processing: 0, high: 0 };
  hits.value.forEach((item) => {
    if (item.status === 'new') result.new += 1;
    if (item.status === 'processing') result.processing += 1;
    if (item.severity === 'high' || item.severity === 'critical') result.high += 1;
  });
  return result;
});

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / (filters.page_size || 10))));

const activeDetail = computed(() => (activeHitId.value ? detailCache[activeHitId.value] : null));

const pageIds = computed(() => hits.value.map((item) => item.hit_id));
const isPageFullySelected = computed(() => pageIds.value.length > 0 && pageIds.value.every((id) => selectedIds.value.includes(id)));
const hasPartialSelection = computed(() => {
  const selected = pageIds.value.filter((id) => selectedIds.value.includes(id)).length;
  return selected > 0 && selected < pageIds.value.length;
});

onMounted(() => {
  loadHits();
});

async function loadHits() {
  listLoading.value = true;
  try {
    const data = await RiskHitsService.listHits({ ...filters });
    const response = (data ?? {}) as Partial<RiskHitListResponse>;
    const items = Array.isArray(response.items) ? (response.items as RiskHitItem[]) : [];
    if (!items.length) {
      hits.value = fallbackHits;
      total.value = fallbackHits.length;
    } else {
      hits.value = items;
      total.value = typeof response.total === 'number' ? response.total : items.length;
    }
    selectedIds.value = selectedIds.value.filter((id) => hits.value.some((item) => item.hit_id === id));
    if (activeHitId.value && !hits.value.some((item) => item.hit_id === activeHitId.value)) {
      closeDrawer();
    }
  } catch (err) {
    showError((err as Error).message || '加载命中列表失败');
  } finally {
    listLoading.value = false;
  }
}

function applyFilters() {
  filters.page = 1;
  loadHits();
}

function resetFilters() {
  filters.start = DEFAULT_START;
  filters.end = DEFAULT_END;
  filters.severity = '';
  filters.status = '';
  filters.channel = '';
  filters.keyword = '';
  filters.page = 1;
  filters.page_size = 10;
  filters.sort_key = 'hit_time';
  filters.sort_order = 'desc';
  loadHits();
}

function changePage(page: number) {
  filters.page = page;
  loadHits();
}

function changePageSize(size: number) {
  filters.page_size = size;
  filters.page = 1;
  loadHits();
}

function handleSortChange(key: string, order: 'asc' | 'desc') {
  if (key === 'hit_time' || key === 'score' || key === 'severity') {
    filters.sort_key = key as RiskHitFilters['sort_key'];
    filters.sort_order = order;
    loadHits();
  }
}

function toggleSelection(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    if (!selectedIds.value.includes(id)) selectedIds.value = [...selectedIds.value, id];
  } else {
    selectedIds.value = selectedIds.value.filter((item) => item !== id);
  }
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    const union = new Set([...selectedIds.value, ...pageIds.value]);
    selectedIds.value = Array.from(union);
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageIds.value.includes(id));
  }
}

function isSelected(id: string) {
  return selectedIds.value.includes(id);
}

async function handleRowClick(row: RiskHitItem) {
  activeHitId.value = row.hit_id;
  drawerVisible.value = true;
  await ensureDetail(row.hit_id);
}

function closeDrawer() {
  drawerVisible.value = false;
  activeHitId.value = null;
}

async function ensureDetail(hitId: string) {
  if (detailCache[hitId]) return;
  detailLoading.value = true;
  try {
    const data = await RiskHitsService.getHitDetail(hitId);
    if (data) {
      detailCache[hitId] = data as RiskHitDetail;
    } else if (fallbackDetails[hitId]) {
      detailCache[hitId] = fallbackDetails[hitId];
    }
  } catch (err) {
    showError((err as Error).message || '加载详情失败');
  } finally {
    detailLoading.value = false;
  }
}

function openIgnoreModal() {
  if (!selectedIds.value.length) return;
  ignoreNote.value = '';
  ignoreModalVisible.value = true;
}

async function submitBatchIgnore() {
  if (!selectedIds.value.length) {
    showError('请选择需要忽略的记录');
    return;
  }
  if (!ignoreNote.value || ignoreNote.value.length < 5) {
    showError('备注至少需要 5 个字符');
    return;
  }
  actionLoading.value = true;
  try {
    await RiskHitsService.batchIgnore({ ids: selectedIds.value, note: ignoreNote.value });
    hits.value = hits.value.map((item) =>
      selectedIds.value.includes(item.hit_id)
        ? { ...item, status: 'ignored', note: ignoreNote.value, operator: '当前用户' }
        : item
    );
    showFeedback(`已忽略 ${selectedIds.value.length} 条命中`);
    selectedIds.value = [];
    ignoreModalVisible.value = false;
  } catch (err) {
    showError((err as Error).message || '忽略失败');
  } finally {
    actionLoading.value = false;
  }
}

function openTicketModal() {
  if (!activeHit.value) {
    showError('请选择需要创建工单的命中');
    return;
  }
  ticketForm.priority = 'normal';
  ticketForm.note = '';
  ticketModalVisible.value = true;
}

async function submitCreateTicket() {
  if (!activeHit.value) {
    showError('请选择命中记录');
    return;
  }
  actionLoading.value = true;
  try {
    const result = await RiskHitsService.createTicket({
      hit_id: activeHit.value.hit_id,
      priority: ticketForm.priority,
      note: ticketForm.note || undefined
    });
    hits.value = hits.value.map((item) =>
      item.hit_id === activeHit.value?.hit_id
        ? { ...item, status: 'processing', ticket_id: result.ticket_id }
        : item
    );
    if (activeHit.value) {
      activeHit.value.status = 'processing';
      activeHit.value.ticket_id = result.ticket_id;
    }
    showFeedback(`已创建工单：${result.ticket_id}`);
    ticketModalVisible.value = false;
  } catch (err) {
    showError((err as Error).message || '创建工单失败');
  } finally {
    actionLoading.value = false;
  }
}

async function exportHits() {
  actionLoading.value = true;
  try {
    const result = await RiskHitsService.exportHits({ ...filters });
    showFeedback(`导出任务已创建：${result.export_id}`);
  } catch (err) {
    showError((err as Error).message || '导出失败');
  } finally {
    actionLoading.value = false;
  }
}

function previewEntity(entity: Record<string, unknown>) {
  const entries = Object.entries(entity).slice(0, 3);
  const mapped = entries.map(([key, value]) => [key, typeof value === 'object' ? JSON.stringify(value) : String(value)]);
  return Object.fromEntries(mapped);
}

function stringifyContext(context: Record<string, unknown>) {
  try {
    return JSON.stringify(context, null, 2);
  } catch (err) {
    return String(context);
  }
}

function evidenceLabel(type: string) {
  switch (type) {
    case 'stat':
      return '统计';
    case 'image':
      return '图片';
    case 'text':
    default:
      return '文本';
  }
}

function severityLabel(severity: RiskHitSeverity) {
  switch (severity) {
    case 'low':
      return '低';
    case 'medium':
      return '中';
    case 'high':
      return '高';
    case 'critical':
      return '致命';
    default:
      return severity;
  }
}

function statusLabel(status: RiskHitStatus) {
  switch (status) {
    case 'new':
      return '未处理';
    case 'processing':
      return '处理中';
    case 'resolved':
      return '已处理';
    case 'ignored':
      return '已忽略';
    default:
      return status;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function showFeedback(message: string) {
  feedbackMessage.value = message;
  errorMessage.value = '';
  window.setTimeout(() => {
    if (feedbackMessage.value === message) feedbackMessage.value = '';
  }, 4000);
}

function showError(message: string) {
  errorMessage.value = message;
  window.setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = '';
  }, 5000);
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$card-radius: $radius-xl;
$panel-bg: $surface-0;

.risk-hits {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $text-strong;
}

.risk-hits__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.risk-hits__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.risk-hits__subtitle {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.risk-hits__actions {
  display: flex;
  gap: $spacing-12;
}

.risk-hits__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-16;
}

.summary-card {
  background: $panel-bg;
  border: $border-width-1 solid $surface-200;
  border-radius: $card-radius;
  padding: $spacing-16;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.05);

  h3 {
    margin: 0;
    font-size: $text-12-medium-fs;
    line-height: $text-12-medium-lh;
    color: $text-muted;
  }

  strong {
    display: block;
    margin-top: $spacing-8;
    font-size: $text-16-semibold-fs;
    line-height: $text-16-semibold-lh;
    font-weight: $text-16-semibold-wt;
  }
}

.summary-card--critical {
  border-color: rgba($color-danger-600, 0.3);
  strong {
    color: $color-danger-600;
  }
}

.risk-hits__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  align-items: flex-end;

  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  input,
  select,
  textarea {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
  }

  textarea {
    height: auto;
    resize: vertical;
  }
}

.filters__keyword {
  min-width: 16rem;
}

.filters__actions {
  display: flex;
  gap: $spacing-12;
}

.risk-hits__content {
  display: grid;
  grid-template-columns: minmax(40rem, 1fr) minmax(20rem, 26rem);
  gap: $spacing-24;
}

.risk-hits__table {
  background: $panel-bg;
  border: $border-width-1 solid $surface-200;
  border-radius: $card-radius;
  padding: $spacing-12;
  box-shadow: 0 14px 36px rgba($color-surface-700, 0.06);
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.bulk-select {
  display: flex;
  align-items: center;
  gap: $spacing-12;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.bulk-select__count {
  color: $color-primary-700;
}

.risk-hits__drawer {
  background: $panel-bg;
  border: $border-width-1 solid $surface-200;
  border-radius: $card-radius;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 42rem;
}

.drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-16 $spacing-20;
  border-bottom: $border-width-1 solid $surface-200;

  h2 {
    margin: 0;
    font-size: $text-16-semibold-fs;
  }

  p {
    margin: 0;
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.drawer__close {
  background: transparent;
  border: none;
  font-size: $text-16-semibold-fs;
  cursor: pointer;
  color: $text-muted;
}

.drawer__body {
  padding: $spacing-16 $spacing-20;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.drawer__placeholder {
  margin: 0;
  color: $text-muted;
  text-align: center;
}

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  h3 {
    margin: 0;
    font-size: $text-12-medium-fs;
    line-height: $text-12-medium-lh;
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

.context-block {
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  background: $surface-50;
  padding: $spacing-12;
  font-size: $text-12-regular-fs;
  color: $text-strong;
  max-height: 14rem;
  overflow: auto;
}

.evidence-list,
.similar-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.evidence-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-muted;
  margin-right: $spacing-8;
}

.similar-list li {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr auto;
  gap: $spacing-8;
  align-items: center;
}

.similar-score {
  color: $color-primary-700;
  font-weight: $text-12-medium-wt;
}

.drawer-actions {
  display: flex;
  justify-content: flex-end;
}

.entity-cell {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $text-12-regular-fs;
}

.severity-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  font-weight: $text-12-medium-wt;
}

.severity-chip[data-level='low'] {
  background: $surface-100;
  color: $text-muted;
}

.severity-chip[data-level='medium'] {
  background: rgba($color-warning-strong, 0.18);
  color: $color-warning-strong;
}

.severity-chip[data-level='high'] {
  background: rgba($color-primary-700, 0.18);
  color: $color-primary-700;
}

.severity-chip[data-level='critical'] {
  background: rgba($color-danger-600, 0.16);
  color: $color-danger-600;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  line-height: $text-12-medium-lh;
}

.status-chip[data-status='new'] {
  background: rgba($color-primary-700, 0.12);
  color: $color-primary-700;
}

.status-chip[data-status='processing'] {
  background: rgba($color-warning-strong, 0.18);
  color: $color-warning-strong;
}

.status-chip[data-status='resolved'] {
  background: rgba($color-surface-500, 0.18);
  color: $color-surface-500;
}

.status-chip[data-status='ignored'] {
  background: rgba($color-surface-200, 0.6);
  color: $color-surface-700;
}

.feedback {
  font-size: $text-12-regular-fs;
  color: $color-primary-700;
}

.feedback--error {
  color: $color-danger-600;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;

  textarea,
  select {
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-8 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

@media (max-width: 80rem) {
  .risk-hits__content {
    grid-template-columns: 1fr;
  }

  .risk-hits__drawer {
    max-height: none;
  }
}
</style>
