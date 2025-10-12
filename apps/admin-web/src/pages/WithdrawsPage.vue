<template>
  <section class="withdraws">
    <header class="withdraws__head">
      <div>
        <h1 class="withdraws__title">提现管理</h1>
        <p class="withdraws__subtitle">审核与出款提现请求，跟踪状态与异常。</p>
      </div>
      <div class="withdraws__actions">
        <button type="button" class="btn" @click="exportView" :disabled="loading">导出当前筛选</button>
      </div>
    </header>

    <form class="filters" @submit.prevent="applyFilters">
      <fieldset class="filters__group">
        <legend>筛选条件</legend>
        <div class="filters__row">
          <label class="filters__field">
            <span>开始日期</span>
            <input class="input" type="date" v-model="filters.start" />
          </label>
          <label class="filters__field">
            <span>结束日期</span>
            <input class="input" type="date" v-model="filters.end" />
          </label>
          <label class="filters__field">
            <span>状态</span>
            <select class="input" multiple v-model="filters.status">
              <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <label class="filters__field">
            <span>渠道</span>
            <select class="input" multiple v-model="filters.channel">
              <option v-for="option in channelOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <label class="filters__field">
            <span>维度</span>
            <select class="input" v-model="filters.dimension">
              <option v-for="option in dimensionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="filters__field">
            <span>主体 ID</span>
            <input class="input" type="text" v-model.trim="filters.entityId" placeholder="如 S001" />
          </label>
        </div>
        <div class="filters__actions">
          <button type="submit" class="btn" :disabled="loading">应用筛选</button>
          <button type="button" class="btn btn--ghost" @click="resetFilters" :disabled="loading">重置</button>
        </div>
      </fieldset>
    </form>

    <section class="stats">
      <article class="stat-card">
        <span class="stat-card__label">待处理总额</span>
        <strong class="stat-card__value">{{ formatCurrency(stats?.pending_total) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">今日已出款</span>
        <strong class="stat-card__value">{{ formatCurrency(stats?.paid_today) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">失败笔数</span>
        <strong class="stat-card__value">{{ stats?.failed_count ?? 0 }}</strong>
      </article>
    </section>

    <div v-if="selectedIds.length" class="batch-bar">
      <span>已选 {{ selectedIds.length }} 条</span>
      <div class="batch-bar__actions">
        <button type="button" class="btn" @click="openBatchModal('approve')">批量通过</button>
        <button type="button" class="btn btn--ghost" @click="clearSelection">清空</button>
      </div>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="col-checkbox"><input type="checkbox" :checked="allSelected" @change="toggleSelectAll($event)" /></th>
            <th>申请号</th>
            <th>时间</th>
            <th>主体</th>
            <th>金额</th>
            <th>渠道</th>
            <th>账号信息</th>
            <th>状态</th>
            <th>备注</th>
            <th class="actions-col">操作</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="index in 5" :key="`loading-${index}`">
            <td :colspan="10"><div class="skeleton"></div></td>
          </tr>
        </tbody>
        <tbody v-else-if="rows.length">
          <tr v-for="row in rows" :key="row.withdraw_id">
            <td class="col-checkbox"><input type="checkbox" :checked="selected.has(row.withdraw_id)" @change="toggleSelection(row.withdraw_id, $event)" /></td>
            <td>{{ row.withdraw_id }}</td>
            <td>{{ formatDateTime(row.created_at) }}</td>
            <td>{{ row.entity_name }}</td>
            <td>{{ formatCurrency(row.amount) }}</td>
            <td>{{ row.channel }}</td>
            <td>{{ row.account_info }}</td>
            <td><span class="status-tag" :data-status="row.status">{{ statusLabel(row.status) }}</span></td>
            <td>{{ row.note || '-' }}</td>
            <td class="actions-col">
              <div class="row-actions">
                <button type="button" class="link-btn" @click="openSingleModal(row, 'approve')" :disabled="row.status !== 'pending'">通过</button>
                <button type="button" class="link-btn" @click="openSingleModal(row, 'reject')" :disabled="row.status !== 'pending'">驳回</button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="10" class="placeholder">暂时没有提现申请。</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="pager">
      <button type="button" class="btn btn--ghost" :disabled="filters.page <= 1 || loading" @click="changePage(filters.page - 1)">上一页</button>
      <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
      <button type="button" class="btn btn--ghost" :disabled="filters.page >= pageCount || loading" @click="changePage(filters.page + 1)">下一页</button>
      <label class="pager__size">
        <span>每页</span>
        <select class="input" :value="filters.pageSize" @change="changePageSize($event)">
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <span>共 {{ total }} 条</span>
    </footer>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>

    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal__body">
        <header>
          <h2>{{ modalAction === 'approve' ? '通过提现申请' : '驳回提现申请' }}</h2>
        </header>
        <section class="modal__content">
          <p v-if="modalTarget">提现号：{{ modalTarget.withdraw_id }}，金额 {{ formatCurrency(modalTarget.amount) }}</p>
          <label class="modal__field">
            <span>备注（驳回需填写）</span>
            <textarea class="textarea" v-model.trim="modalNote" rows="4" placeholder="请输入备注" />
          </label>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" @click="closeModal">取消</button>
          <button type="button" class="btn" :class="{ 'btn--danger': modalAction === 'reject' }" :disabled="modalSubmitting || (modalAction === 'reject' && modalNote.length < 2)" @click="submitModal">
            确认提交
          </button>
        </footer>
      </div>
    </div>

    <div v-if="showBatchModal" class="modal" @click.self="closeBatchModal">
      <div class="modal__body">
        <header>
          <h2>批量通过 {{ selectedIds.length }} 条提现申请</h2>
        </header>
        <section class="modal__content">
          <p class="modal__hint">本次批量操作的提现号（最多展示三条）：</p>
          <ul class="modal__list">
            <li v-for="id in selectedIds.slice(0, 3)" :key="id">{{ id }}</li>
            <li v-if="selectedIds.length > 3">... 等 {{ selectedIds.length }} 条</li>
          </ul>
          <label class="modal__field">
            <span>备注（可选）</span>
            <textarea class="textarea" v-model.trim="batchNote" rows="4" placeholder="输入备注" />
          </label>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" @click="closeBatchModal">取消</button>
          <button type="button" class="btn" :disabled="batchSubmitting" @click="submitBatch">确认提交</button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { ExportsService, WithdrawsService, type WithdrawActionRequest, type WithdrawItem, type WithdrawListResponse, type WithdrawStatsResponse } from '@/sdk';

type Dimension = 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual';
type WithdrawStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'rejected';
type WithdrawChannel = 'bank' | 'alipay' | 'wechat';
type ModalAction = 'approve' | 'reject';

const today = new Date();
const defaultEnd = today.toISOString().slice(0, 10);
const startSeed = new Date(today);
startSeed.setDate(startSeed.getDate() - 6);
const defaultStart = startSeed.toISOString().slice(0, 10);

const filters = reactive({
  start: defaultStart,
  end: defaultEnd,
  status: [] as WithdrawStatus[],
  channel: [] as WithdrawChannel[],
  dimension: 'platform' as Dimension,
  entityId: '',
  page: 1,
  pageSize: 20 as 20 | 50 | 100 | 200
});

const statusOptions: WithdrawStatus[] = ['pending', 'processing', 'succeeded', 'failed', 'rejected'];
const channelOptions: WithdrawChannel[] = ['bank', 'alipay', 'wechat'];
const dimensionOptions = [
  { value: 'platform', label: '平台' },
  { value: 'company', label: '公司' },
  { value: 'team', label: '团队' },
  { value: 'store', label: '门店' },
  { value: 'promoter', label: '推广人' },
  { value: 'individual', label: '个人' }
] as const;
const pageSizes: Array<20 | 50 | 100 | 200> = [20, 50, 100, 200];

const stats = ref<WithdrawStatsResponse | null>(null);
const rows = ref<WithdrawItem[]>([]);
const total = ref(0);
const loading = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');

const selected = reactive(new Set<string>());
const selectedIds = computed(() => Array.from(selected));
const allSelected = computed(() => rows.value.length > 0 && rows.value.every((row) => selected.has(row.withdraw_id)));

const showModal = ref(false);
const modalTarget = ref<WithdrawItem | null>(null);
const modalAction = ref<ModalAction>('approve');
const modalNote = ref('');
const modalSubmitting = ref(false);

const showBatchModal = ref(false);
const batchNote = ref('');
const batchSubmitting = ref(false);

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2
});

const dateTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return currencyFormatter.format(value);
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  try {
    return dateTimeFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function statusLabel(status: WithdrawStatus) {
  switch (status) {
    case 'pending':
      return '待审核';
    case 'processing':
      return '出款中';
    case 'succeeded':
      return '已出款';
    case 'failed':
      return '失败';
    case 'rejected':
      return '已驳回';
    default:
      return status;
  }
}

function friendlyError(message?: string, fallback = '加载提现列表失败，请稍后再试。') {
  if (!message) return fallback;
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '无法连接到提现接口，请确认 Mock 服务已启动或网络可用。';
  }
  return message;
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.status = [];
  filters.channel = [];
  filters.dimension = 'platform';
  filters.entityId = '';
  filters.page = 1;
  filters.pageSize = 20;
  fetchAll();
}

function applyFilters() {
  filters.page = 1;
  fetchAll();
}

function changePage(page: number) {
  const next = Math.min(Math.max(page, 1), pageCount.value);
  if (filters.page !== next) {
    filters.page = next;
    fetchList();
  }
}

function changePageSize(event: Event) {
  const size = Number((event.target as HTMLSelectElement).value) as 20 | 50 | 100 | 200;
  if (filters.pageSize !== size) {
    filters.pageSize = size;
    filters.page = 1;
    fetchList();
  }
}

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)));

function toggleSelection(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) selected.add(id);
  else selected.delete(id);
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) rows.value.forEach((row) => selected.add(row.withdraw_id));
  else rows.value.forEach((row) => selected.delete(row.withdraw_id));
}

function clearSelection() {
  selected.clear();
}

function openSingleModal(row: WithdrawItem, action: ModalAction) {
  modalTarget.value = row;
  modalAction.value = action;
  modalNote.value = '';
  showModal.value = true;
}

function closeModal() {
  showModal.value = false;
  modalTarget.value = null;
  modalNote.value = '';
}

function openBatchModal(action: ModalAction) {
  if (action !== 'approve') return;
  batchNote.value = '';
  showBatchModal.value = true;
}

function closeBatchModal() {
  showBatchModal.value = false;
}

async function submitModal() {
  if (!modalTarget.value) return;
  modalSubmitting.value = true;
  errorMessage.value = '';
  try {
    if (modalAction.value === 'approve') {
      await WithdrawsService.approveWithdraw(modalTarget.value.withdraw_id, modalNote.value ? { note: modalNote.value } : undefined);
      updateRowStatus(modalTarget.value.withdraw_id, 'processing');
      feedbackMessage.value = `提现 ${modalTarget.value.withdraw_id} 已通过，进入出款流程。`;
    } else {
      await WithdrawsService.rejectWithdraw(modalTarget.value.withdraw_id, { note: modalNote.value } as WithdrawActionRequest);
      updateRowStatus(modalTarget.value.withdraw_id, 'rejected');
      feedbackMessage.value = `提现 ${modalTarget.value.withdraw_id} 已驳回。`;
    }
    selected.delete(modalTarget.value.withdraw_id);
    closeModal();
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message, '操作失败，请稍后再试。');
  } finally {
    modalSubmitting.value = false;
  }
}

async function submitBatch() {
  batchSubmitting.value = true;
  errorMessage.value = '';
  try {
    // Mock 接口暂未提供批量，通过单个调用模拟
    for (const id of selectedIds.value) {
      await WithdrawsService.approveWithdraw(id, batchNote.value ? { note: batchNote.value } : undefined);
      updateRowStatus(id, 'processing');
    }
    feedbackMessage.value = `批量通过 ${selectedIds.value.length} 条提现申请成功。`;
    selected.clear();
    closeBatchModal();
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message, '批量操作失败，请稍后再试。');
  } finally {
    batchSubmitting.value = false;
  }
}

function updateRowStatus(id: string, status: WithdrawStatus) {
  rows.value = rows.value.map((row) => (row.withdraw_id === id ? { ...row, status } : row));
}

async function exportView() {
  feedbackMessage.value = '';
  errorMessage.value = '';
  try {
    await ExportsService.exportWithdraws();
    feedbackMessage.value = '已创建导出任务，请前往导出中心查看。';
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message, '导出失败，请稍后再试。');
  }
}

async function fetchStats() {
  stats.value = await WithdrawsService.getWithdrawStats(filters.start || undefined, filters.end || undefined);
}

async function fetchList() {
  const response: WithdrawListResponse = await WithdrawsService.listWithdraws(
    filters.start || undefined,
    filters.end || undefined,
    filters.status.length ? filters.status : undefined,
    filters.channel.length ? filters.channel : undefined,
    filters.dimension,
    filters.entityId || undefined,
    filters.page,
    filters.pageSize
  );
  rows.value = response.items ?? [];
  total.value = response.total ?? 0;
  // 清理已不存在的选中项
  const currentIds = new Set(rows.value.map((row) => row.withdraw_id));
  Array.from(selected).forEach((id) => {
    if (!currentIds.has(id)) selected.delete(id);
  });
}

async function fetchAll() {
  loading.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    await Promise.all([fetchStats(), fetchList()]);
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message);
    rows.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  fetchAll();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.withdraws {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.withdraws__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.withdraws__title {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
}

.withdraws__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
}

.filters {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
}

.filters__group {
  border: none;
  padding: 0;
  margin: 0;
}

.filters__group > legend {
  font-weight: $font-weight-semibold;
  margin-bottom: $spacing-12;
}

.filters__row {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 8), 1fr));
}

.filters__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  color: $color-surface-500;
}

.filters__actions {
  display: flex;
  gap: $spacing-12;
  margin-top: $spacing-16;
}

.input,
.filters select {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  background: $color-surface-0;
  color: $color-text-strong;
  font-size: $font-size-16;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: $spacing-8 $spacing-16;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-primary-700;
  background: $color-primary-700;
  color: $color-text-on-primary;
  font-weight: $font-weight-medium;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn--ghost {
  background: transparent;
  color: $color-primary-700;
}

.btn--danger {
  border-color: $color-surface-500;
  background: $color-surface-300;
  color: $color-surface-0;
}

.stats {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 9), 1fr));
}

.stat-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.stat-card__label {
  color: $color-surface-500;
}

.stat-card__value {
  font-size: calc(#{$font-size-16} * 1.2);
  font-weight: $font-weight-semibold;
  color: $color-text-strong;
}

.batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-16;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-8;
  background: $color-primary-50;
  color: $color-primary-700;
}

.batch-bar__actions {
  display: flex;
  gap: $spacing-12;
}

.table-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  overflow-x: auto;
  background: $color-surface-0;
}

.table-card table {
  width: 100%;
  border-collapse: collapse;
}

.table-card thead th {
  text-align: left;
  padding: $spacing-12 $spacing-16;
  background: $color-surface-50;
  color: $color-surface-500;
}

.table-card tbody td {
  padding: $spacing-12 $spacing-16;
  border-top: $border-width-1 solid $color-surface-100;
}

.col-checkbox {
  width: calc(#{$spacing-16} * 2);
}

.actions-col {
  width: calc(#{$spacing-16} * 6);
}

.row-actions {
  display: inline-flex;
  gap: $spacing-8;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: $spacing-8 $spacing-12;
  border-radius: $radius-8;
  background: $color-surface-100;
  color: $color-text-strong;
}

.status-tag[data-status='pending'] {
  background: $color-surface-50;
}

.status-tag[data-status='processing'] {
  background: $color-primary-50;
  color: $color-primary-700;
}

.status-tag[data-status='succeeded'] {
  background: $color-primary-300;
  color: $color-text-on-primary;
}

.status-tag[data-status='failed'] {
  background: $color-surface-300;
  color: $color-surface-0;
}

.status-tag[data-status='rejected'] {
  background: $color-surface-200;
  color: $color-surface-700;
}

.placeholder {
  text-align: center;
  padding: $spacing-16;
  color: $color-surface-500;
}

.skeleton {
  height: calc(#{$spacing-16} * 1.5);
  background: $color-surface-100;
  border-radius: $radius-8;
  animation: shimmer 1.2s infinite ease-in-out;
}

@keyframes shimmer {
  0% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.3;
  }
  100% {
    opacity: 0.6;
  }
}

.pager {
  display: flex;
  gap: $spacing-12;
  align-items: center;
  color: $color-surface-500;
}

.pager__size {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-8;
  background: $color-primary-50;
  color: $color-primary-700;
}

.feedback--error {
  background: $color-surface-300;
  color: $color-surface-0;
}

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  padding: $spacing-24;
  z-index: 1000;
}

.modal__body {
  width: min(480px, 100%);
  background: $color-surface-0;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.modal__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.textarea {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  background: $color-surface-0;
  color: $color-text-strong;
}

.modal__hint {
  margin: 0;
  color: $color-surface-500;
}

.modal__list {
  margin: 0;
  padding-left: calc(#{$spacing-16} * 1.5);
}

.link-btn {
  border: none;
  background: transparent;
  color: $color-primary-700;
  cursor: pointer;
}

.link-btn:disabled {
  color: $color-surface-300;
  cursor: not-allowed;
}

@media (max-width: 64rem) {
  .filters__row {
    grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 6), 1fr));
  }
}
</style>
