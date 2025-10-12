<template>
  <section class="risk-tickets">
    <header class="risk-tickets__header">
      <div>
        <h1 class="risk-tickets__title">风控工单</h1>
        <p class="risk-tickets__subtitle">跟踪风险案件的分配与处置进度。</p>
      </div>
      <div class="risk-tickets__actions">
        <Button size="sm" variant="ghost" :disabled="ticketsLoading" @click="refreshTickets">刷新</Button>
      </div>
    </header>

    <section class="risk-tickets__summary" aria-label="工单统计" v-if="tickets.length">
      <article class="summary-card">
        <h3>全部</h3>
        <strong>{{ tickets.length }}</strong>
      </article>
      <article class="summary-card">
        <h3>进行中</h3>
        <strong>{{ inProgressCount }}</strong>
      </article>
      <article class="summary-card summary-card--critical">
        <h3>超时</h3>
        <strong>{{ overdueCount }}</strong>
      </article>
    </section>

    <form class="risk-tickets__filters" @submit.prevent="applyFilters">
      <label>
        <span>状态</span>
        <select v-model="filters.status" :disabled="ticketsLoading">
          <option value="">全部</option>
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>优先级</span>
        <select v-model="filters.priority" :disabled="ticketsLoading">
          <option value="">全部</option>
          <option v-for="item in priorityOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="filters__keyword">
        <span>关键词</span>
        <input type="search" v-model.trim="filters.keyword" placeholder="工单号 / 标题 / 负责人" :disabled="ticketsLoading" />
      </label>
      <div class="filters__actions">
        <Button size="sm" type="submit" :loading="ticketsLoading">应用</Button>
        <Button size="sm" variant="ghost" type="button" @click="resetFilters" :disabled="ticketsLoading">重置</Button>
      </div>
    </form>

    <div class="risk-tickets__layout">
      <section class="tickets-table" role="region" aria-label="工单列表">
        <Table
          :columns="columns"
          :rows="tickets"
          :loading="ticketsLoading"
          :row-key="(row) => row.ticket_id"
          default-sort-key="created_at"
          default-sort-order="desc"
          @rowClick="openDetail"
        >
          <template #cell:priority="{ row }">
            <span class="priority-chip" :data-level="row.priority">{{ priorityLabel(row.priority) }}</span>
          </template>
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell:created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
          <template #cell:due_at="{ row }">{{ formatDateTime(row.due_at) }}</template>
          <template #cell:tags="{ row }">
            <template v-if="row.tags?.length">
              <span v-for="tag in row.tags" :key="`${row.ticket_id}-${tag}`" class="tag-chip">{{ tag }}</span>
            </template>
            <span v-else>—</span>
          </template>
          <template #empty>{{ ticketsLoading ? '加载中…' : '暂无工单' }}</template>
        </Table>
      </section>

      <aside class="tickets-drawer" v-if="activeTicket">
        <header class="drawer__header">
          <div>
            <h2>{{ activeTicket.title }}</h2>
            <p>{{ activeTicket.ticket_id }} · {{ formatDateTime(activeTicket.created_at) }}</p>
          </div>
          <button type="button" class="drawer__close" aria-label="关闭" @click="closeDetail">×</button>
        </header>
        <div class="drawer__body" v-if="detailLoading">
          <p class="drawer__placeholder">详情加载中…</p>
        </div>
        <div class="drawer__body" v-else-if="ticketDetail">
          <section class="drawer-section">
            <h3>基本信息</h3>
            <dl class="drawer-grid">
              <div>
                <dt>状态</dt>
                <dd><span class="status-chip" :data-status="ticketDetail.status">{{ statusLabel(ticketDetail.status) }}</span></dd>
              </div>
              <div>
                <dt>优先级</dt>
                <dd><span class="priority-chip" :data-level="ticketDetail.priority">{{ priorityLabel(ticketDetail.priority) }}</span></dd>
              </div>
              <div>
                <dt>负责人</dt>
                <dd>{{ ticketDetail.assignee_name || '未指派' }}</dd>
              </div>
              <div>
                <dt>来源</dt>
                <dd>{{ sourceLabel(ticketDetail.source) }}</dd>
              </div>
              <div>
                <dt>SLA</dt>
                <dd>{{ ticketDetail.sla_minutes ? `${ticketDetail.sla_minutes} 分钟` : '—' }}</dd>
              </div>
              <div>
                <dt>到期时间</dt>
                <dd>{{ formatDateTime(ticketDetail.due_at) }}</dd>
              </div>
            </dl>
          </section>

          <section class="drawer-section" v-if="ticketDetail.desc">
            <h3>说明</h3>
            <p class="drawer-text">{{ ticketDetail.desc }}</p>
          </section>

          <section class="drawer-section" v-if="ticketDetail.entities?.length">
            <h3>关联主体</h3>
            <ul class="entity-list">
              <li v-for="entity in ticketDetail.entities" :key="`${ticketDetail.ticket_id}-${entity.type}-${entity.id}`">
                <span class="entity-type">{{ entity.label || entity.type }}</span>
                <span>{{ entity.id }}</span>
              </li>
            </ul>
          </section>

          <section class="drawer-section" v-if="ticketDetail.actions?.length">
            <h3>处理记录</h3>
            <ul class="action-timeline">
              <li v-for="action in ticketDetail.actions" :key="`${ticketDetail.ticket_id}-${action.time}-${action.action}`">
                <span class="timeline-time">{{ formatDateTime(action.time) }}</span>
                <div>
                  <strong>{{ action.actor }}</strong>
                  <span class="timeline-action">{{ actionLabel(action.action, action.to_status) }}</span>
                  <span v-if="action.note" class="timeline-note">{{ action.note }}</span>
                </div>
              </li>
            </ul>
          </section>

          <div class="drawer-actions">
            <Button size="sm" variant="secondary" @click="openAssignModal">指派</Button>
            <Button size="sm" variant="secondary" @click="runStart">开始调查</Button>
            <Button size="sm" variant="secondary" @click="openPendModal">待补资料</Button>
            <Button size="sm" variant="primary" @click="openResolveModal">标记已处置</Button>
            <Button size="sm" variant="danger" @click="openRejectModal">拒绝</Button>
            <Button size="sm" variant="ghost" @click="openCloseModal">关闭</Button>
          </div>
        </div>
        <div class="drawer__body" v-else>
          <p class="drawer__placeholder">请选择工单查看详情</p>
        </div>
      </aside>
    </div>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

    <Modal v-model="assignModalVisible" @confirm="submitAssign">
      <template #title>指派工单</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>负责人 ID</span>
          <input type="text" v-model.trim="assignForm.assignee_id" placeholder="如 U2099" />
        </label>
        <label>
          <span>备注</span>
          <textarea rows="3" v-model.trim="assignForm.note" placeholder="可选" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="assignModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitAssign">确认</Button>
      </template>
    </Modal>

    <Modal v-model="noteModal.visible" @confirm="submitNoteAction">
      <template #title>{{ noteModal.title }}</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>备注</span>
          <textarea rows="3" v-model.trim="noteModal.note" placeholder="请输入备注" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="closeNoteModal" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitNoteAction">确认</Button>
      </template>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import Table from '@/components/Table.vue';
import {
  RiskTicketsService,
  type RiskTicketDetail,
  type RiskTicketListItem,
  type RiskTicketPriority,
  type RiskTicketStatus
} from '@/sdk/risk';

interface TableColumn {
  key: string;
  title: string;
  width?: string;
  sortable?: boolean;
}

const fallbackTickets: RiskTicketListItem[] = [
  {
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
  },
  {
    ticket_id: 'K20251003005',
    created_at: '2025-10-03T08:45:00+08:00',
    priority: 'normal',
    status: 'assigned',
    severity: 'medium',
    assignee_id: 'U2002',
    assignee_name: '朱敏',
    source: 'hit',
    rule_id: 'FREQ_APPLY',
    title: '短期高频提交 O20251002999',
    due_at: '2025-10-03T11:45:00+08:00',
    sla_minutes: 180,
    tags: ['频率', '人工']
  }
];

const fallbackTicketDetails: Record<string, RiskTicketDetail> = {
  K20251003001: {
    ...fallbackTickets[0],
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

const tickets = ref<RiskTicketListItem[]>([]);
const ticketsLoading = ref(false);
const detailLoading = ref(false);
const selectedTicketId = ref<string | null>(null);
const ticketDetailsCache = reactive<Record<string, RiskTicketDetail>>({});

const filters = reactive({
  status: '' as RiskTicketStatus | '',
  priority: '' as RiskTicketPriority | '',
  keyword: ''
});

const statusOptions = [
  { value: 'new', label: '新建' },
  { value: 'assigned', label: '已指派' },
  { value: 'investigating', label: '调查中' },
  { value: 'pending_info', label: '待补资料' },
  { value: 'resolved', label: '已处置' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'closed', label: '已关闭' }
];

const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '致命' }
];

const columns: TableColumn[] = [
  { key: 'ticket_id', title: '工单号', width: '9rem', sortable: true },
  { key: 'title', title: '标题' },
  { key: 'priority', title: '优先级', width: '6rem' },
  { key: 'status', title: '状态', width: '7rem' },
  { key: 'assignee_name', title: '负责人', width: '7rem' },
  { key: 'created_at', title: '创建时间', width: '10rem', sortable: true },
  { key: 'due_at', title: '到期时间', width: '10rem' },
  { key: 'tags', title: '标签', width: '10rem' }
];

const activeTicket = computed(() => tickets.value.find((item) => item.ticket_id === selectedTicketId.value) || null);
const ticketDetail = computed<RiskTicketDetail | null>(() => (selectedTicketId.value ? ticketDetailsCache[selectedTicketId.value] || null : null));
const inProgressCount = computed(() => tickets.value.filter((item) => item.status === 'investigating' || item.status === 'assigned').length);
const overdueCount = computed(() => tickets.value.filter((item) => item.due_at && new Date(item.due_at).getTime() < Date.now()).length);

const feedbackMessage = ref('');
const errorMessage = ref('');
const actionLoading = ref(false);

const assignModalVisible = ref(false);
const assignForm = reactive({ assignee_id: '', note: '' });

const noteModal = reactive({ visible: false, action: '' as '' | 'pend' | 'resolve' | 'reject' | 'close', title: '', note: '' });

onMounted(() => {
  refreshTickets();
});

async function refreshTickets() {
  ticketsLoading.value = true;
  try {
    const response = await RiskTicketsService.listTickets();
    const items = Array.isArray(response?.items) ? response.items : [];
    tickets.value = items.length ? items : fallbackTickets;
  } catch (err) {
    tickets.value = fallbackTickets;
    showError((err as Error).message || '加载工单失败');
  } finally {
    ticketsLoading.value = false;
  }
}

function applyFilters() {
  let items = [...fallbackTickets];
  if (filters.status) items = items.filter((item) => item.status === filters.status);
  if (filters.priority) items = items.filter((item) => item.priority === filters.priority);
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    items = items.filter((item) => `${item.ticket_id}${item.title}${item.assignee_name ?? ''}`.toLowerCase().includes(keyword));
  }
  tickets.value = items;
}

function resetFilters() {
  filters.status = '';
  filters.priority = '';
  filters.keyword = '';
  applyFilters();
}

async function openDetail(row: RiskTicketListItem) {
  selectedTicketId.value = row.ticket_id;
  if (ticketDetailsCache[row.ticket_id]) return;
  detailLoading.value = true;
  try {
    const detail = await RiskTicketsService.getTicketDetail(row.ticket_id);
    if (detail) {
      ticketDetailsCache[row.ticket_id] = detail;
    } else if (fallbackTicketDetails[row.ticket_id]) {
      ticketDetailsCache[row.ticket_id] = fallbackTicketDetails[row.ticket_id];
    }
  } catch (err) {
    if (fallbackTicketDetails[row.ticket_id]) {
      ticketDetailsCache[row.ticket_id] = fallbackTicketDetails[row.ticket_id];
    } else {
      showError((err as Error).message || '加载工单详情失败');
    }
  } finally {
    detailLoading.value = false;
  }
}

function closeDetail() {
  selectedTicketId.value = null;
}

function openAssignModal() {
  if (!selectedTicketId.value) return;
  assignForm.assignee_id = activeTicket?.assignee_id || '';
  assignForm.note = '';
  assignModalVisible.value = true;
}

function openPendModal() { openNoteModal('pend', '标记待补资料'); }
function openResolveModal() { openNoteModal('resolve', '标记已处置'); }
function openRejectModal() { openNoteModal('reject', '拒绝工单'); }
function openCloseModal() { openNoteModal('close', '关闭工单'); }

function openNoteModal(action: 'pend' | 'resolve' | 'reject' | 'close', title: string) {
  if (!selectedTicketId.value) return;
  noteModal.visible = true;
  noteModal.action = action;
  noteModal.title = title;
  noteModal.note = '';
}

function closeNoteModal() {
  noteModal.visible = false;
  noteModal.action = '';
  noteModal.note = '';
}

async function submitAssign() {
  if (!selectedTicketId.value || !assignForm.assignee_id.trim()) {
    showError('请填写负责人 ID');
    return;
  }
  const ticketId = selectedTicketId.value;
  const previous = snapshotTicket(ticketId);
  optimisticUpdate(ticketId, { assignee_id: assignForm.assignee_id.trim(), assignee_name: assignForm.assignee_id.trim(), status: 'assigned' });
  actionLoading.value = true;
  try {
    const result = await RiskTicketsService.transition(ticketId, 'assign', {
      assignee_id: assignForm.assignee_id.trim(),
      note: assignForm.note || undefined
    });
    optimisticUpdate(ticketId, {
      status: result.new_status,
      assignee_id: result.assignee_id || assignForm.assignee_id.trim(),
      assignee_name: result.assignee_name || assignForm.assignee_id.trim()
    });
    showFeedback('指派成功');
    assignModalVisible.value = false;
  } catch (err) {
    restoreTicket(ticketId, previous);
    showError((err as Error).message || '指派失败');
  } finally {
    actionLoading.value = false;
  }
}

async function runStart() {
  await executeTransition('start', '已进入调查', 'investigating');
}

async function submitNoteAction() {
  if (!noteModal.action) return;
  const map: Record<string, { action: 'pend' | 'resolve' | 'reject' | 'close'; success: string; status: RiskTicketStatus }> = {
    pend: { action: 'pend', success: '已标记待补资料', status: 'pending_info' },
    resolve: { action: 'resolve', success: '工单已处置', status: 'resolved' },
    reject: { action: 'reject', success: '工单已拒绝', status: 'rejected' },
    close: { action: 'close', success: '工单已关闭', status: 'closed' }
  };
  const item = map[noteModal.action];
  await executeTransition(item.action, item.success, item.status, noteModal.note || undefined);
  closeNoteModal();
}

async function executeTransition(action: 'start' | 'pend' | 'resolve' | 'reject' | 'close', successMessage: string, status: RiskTicketStatus, note?: string) {
  if (!selectedTicketId.value) return;
  const ticketId = selectedTicketId.value;
  const previous = snapshotTicket(ticketId);
  optimisticUpdate(ticketId, { status });
  actionLoading.value = true;
  try {
    await RiskTicketsService.transition(ticketId, action, note ? { note } : undefined);
    optimisticUpdate(ticketId, { status });
    showFeedback(successMessage);
  } catch (err) {
    restoreTicket(ticketId, previous);
    showError((err as Error).message || '操作失败');
  } finally {
    actionLoading.value = false;
  }
}

function snapshotTicket(ticketId: string) {
  const listItem = tickets.value.find((item) => item.ticket_id === ticketId);
  const detail = ticketDetailsCache[ticketId];
  return { listItem: listItem ? { ...listItem } : null, detail: detail ? { ...detail } : null };
}

function optimisticUpdate(ticketId: string, patch: Partial<RiskTicketListItem>) {
  const index = tickets.value.findIndex((item) => item.ticket_id === ticketId);
  if (index >= 0) {
    tickets.value.splice(index, 1, { ...tickets.value[index], ...patch });
  }
  if (ticketDetailsCache[ticketId]) {
    ticketDetailsCache[ticketId] = { ...ticketDetailsCache[ticketId], ...patch } as RiskTicketDetail;
  } else if (fallbackTicketDetails[ticketId]) {
    ticketDetailsCache[ticketId] = { ...fallbackTicketDetails[ticketId], ...patch } as RiskTicketDetail;
  }
}

function restoreTicket(ticketId: string, snapshot: { listItem: RiskTicketListItem | null; detail: RiskTicketDetail | null }) {
  if (snapshot.listItem) {
    const index = tickets.value.findIndex((item) => item.ticket_id === ticketId);
    if (index >= 0) tickets.value.splice(index, 1, snapshot.listItem);
  }
  if (snapshot.detail) {
    ticketDetailsCache[ticketId] = snapshot.detail;
  }
}

function priorityLabel(priority: RiskTicketPriority) {
  switch (priority) {
    case 'low':
      return '低';
    case 'normal':
      return '普通';
    case 'high':
      return '高';
    case 'critical':
      return '致命';
    default:
      return priority;
  }
}

function statusLabel(status: RiskTicketStatus) {
  switch (status) {
    case 'new':
      return '新建';
    case 'assigned':
      return '已指派';
    case 'investigating':
      return '调查中';
    case 'pending_info':
      return '待补资料';
    case 'resolved':
      return '已处置';
    case 'rejected':
      return '已拒绝';
    case 'closed':
      return '已关闭';
    default:
      return status;
  }
}

function actionLabel(action: string, toStatus?: string) {
  const labelMap: Record<string, string> = {
    create: '创建工单',
    assign: '指派',
    start: '开始调查',
    pend: '待补资料',
    resolve: '标记处理',
    reject: '拒绝',
    close: '关闭'
  };
  const status = toStatus ? ` → ${statusLabel(toStatus as RiskTicketStatus)}` : '';
  return `${labelMap[action] || action}${status}`;
}

function sourceLabel(source: 'hit' | 'manual') {
  return source === 'hit' ? '命中转单' : '手工创建';
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

.risk-tickets {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.risk-tickets__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.risk-tickets__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.risk-tickets__subtitle {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.risk-tickets__actions {
  display: flex;
  gap: $spacing-12;
}

.risk-tickets__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-16;
}

.summary-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-16;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.05);
  h3 { margin: 0; font-size: $text-12-medium-fs; color: $text-muted; }
  strong { display: block; margin-top: $spacing-8; font-size: $text-16-semibold-fs; }
}

.summary-card--critical strong { color: $color-danger-600; }

.risk-tickets__filters {
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
  select,
  input {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.filters__keyword { min-width: 16rem; }
.filters__actions { display: flex; gap: $spacing-12; }

.risk-tickets__layout {
  display: grid;
  grid-template-columns: minmax(38rem, 1fr) minmax(24rem, 28rem);
  gap: $spacing-24;
}

.tickets-table {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-12;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.05);
}

.tickets-drawer {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 44rem;
}

.drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-16 $spacing-20;
  border-bottom: $border-width-1 solid $surface-200;
  h2 { margin: 0; font-size: $text-16-semibold-fs; }
  p { margin: 0; color: $text-muted; font-size: $text-12-regular-fs; }
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

.drawer__placeholder { margin: 0; color: $text-muted; text-align: center; }

.drawer-section {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  h3 { margin: 0; font-size: $text-12-medium-fs; color: $text-muted; }
}

.drawer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  dt { font-size: $text-12-regular-fs; color: $text-muted; }
  dd { margin: 0; font-size: $text-14-regular-fs; }
}

.drawer-text { margin: 0; font-size: $text-14-regular-fs; line-height: $font-line-height-16; }

.entity-list,
.action-timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.entity-type {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-muted;
  margin-right: $spacing-8;
}

.timeline-time {
  display: inline-block;
  min-width: 10rem;
  color: $text-muted;
}

.timeline-action { margin-left: $spacing-8; color: $color-primary-700; }
.timeline-note { margin-left: $spacing-8; color: $text-muted; }

.drawer-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-12;
}

.priority-chip,
.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  font-weight: $text-12-medium-wt;
}

.priority-chip[data-level='low'] { background: $surface-100; color: $text-muted; }
.priority-chip[data-level='normal'] { background: rgba($color-primary-200, 0.35); color: $color-primary-700; }
.priority-chip[data-level='high'] { background: rgba($color-warning-strong, 0.18); color: $color-warning-strong; }
.priority-chip[data-level='critical'] { background: rgba($color-danger-600, 0.18); color: $color-danger-600; }

.status-chip[data-status='investigating'],
.status-chip[data-status='assigned'] { background: rgba($color-primary-700, 0.12); color: $color-primary-700; }
.status-chip[data-status='pending_info'] { background: rgba($color-warning-strong, 0.18); color: $color-warning-strong; }
.status-chip[data-status='resolved'] { background: rgba($color-primary-200, 0.35); color: $color-primary-700; }
.status-chip[data-status='rejected'] { background: rgba($color-danger-300, 0.3); color: $color-danger-600; }
.status-chip[data-status='closed'] { background: rgba($color-surface-500, 0.18); color: $color-surface-500; }
.status-chip[data-status='new'] { background: $surface-100; color: $text-muted; }

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  background: $surface-100;
  color: $text-muted;
  margin-right: $spacing-8;
}

.feedback { font-size: $text-12-regular-fs; color: $color-primary-700; }
.feedback--error { color: $color-danger-600; }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  input,
  textarea {
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-8 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

@media (max-width: 80rem) {
  .risk-tickets__layout {
    grid-template-columns: 1fr;
  }
  .tickets-drawer { max-height: none; }
}
</style>
