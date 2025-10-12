<template>
  <section class="orders">
    <header class="orders__head">
      <div>
        <h1 class="orders__title">订单列表</h1>
        <p class="orders__subtitle">检索、审核与批量处理订单，支持查看详情与导出。</p>
      </div>
      <div class="orders__head-actions">
        <button type="button" class="btn" @click="refresh" :disabled="loading">刷新</button>
        <button type="button" class="btn btn--ghost" disabled>导出当前筛选</button>
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
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="filters__field">
            <span>渠道</span>
            <select class="input" v-model="filters.channel">
              <option value="">全部</option>
              <option v-for="option in channelOptions" :key="option" :value="option">
                {{ option }}
              </option>
            </select>
          </label>
          <label class="filters__field">
            <span>门店编码</span>
            <input class="input" type="text" v-model.trim="filters.storeCode" placeholder="如 S001" />
          </label>
          <label class="filters__field">
            <span>推广人 ID</span>
            <input class="input" type="text" v-model.trim="filters.promoterId" placeholder="如 P001" />
          </label>
          <label class="filters__field">
            <span>订单号</span>
            <input class="input" type="text" v-model.trim="filters.orderId" placeholder="精确匹配" />
          </label>
          <label class="filters__field">
            <span>手机号</span>
            <input class="input" type="text" v-model.trim="filters.phone" placeholder="支持模糊" />
          </label>
        </div>
        <div class="filters__actions">
          <button type="submit" class="btn" :disabled="loading">应用筛选</button>
          <button type="button" class="btn btn--ghost" @click="resetFilters" :disabled="loading">重置</button>
        </div>
      </fieldset>
    </form>

    <div v-if="selectedIds.length" class="batch-bar">
      <span>已选中 {{ selectedIds.length }} 条</span>
      <div class="batch-bar__actions">
        <button type="button" class="btn" @click="openBatchModal('approve')">批量通过</button>
        <button type="button" class="btn btn--danger" @click="openBatchModal('reject')">批量驳回</button>
        <button type="button" class="btn btn--ghost" @click="clearSelection">清空选择</button>
      </div>
    </div>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th class="col-checkbox">
              <input type="checkbox" :checked="allSelectedOnPage" @change="toggleSelectAll($event)" />
            </th>
            <th class="sortable" @click="toggleSort('created_at')">
              下单时间
              <span class="sort-indicator" :data-active="sortKey === 'created_at'">{{ sortKey === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
            </th>
            <th>订单号</th>
            <th>状态</th>
            <th>渠道</th>
            <th>门店</th>
            <th>推广人</th>
            <th class="sortable" @click="toggleSort('amount')">
              金额
              <span class="sort-indicator" :data-active="sortKey === 'amount'">{{ sortKey === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
            </th>
            <th>实际入账</th>
            <th class="actions-col">操作</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="index in 5" :key="`loading-${index}`">
            <td :colspan="10">
              <div class="skeleton"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="orders.length">
          <tr v-for="item in orders" :key="item.order_id">
            <td class="col-checkbox">
              <input type="checkbox" :checked="selected.has(item.order_id)" @change="toggleSelection(item.order_id, $event)" />
            </td>
            <td>{{ formatDateTime(item.created_at) }}</td>
            <td>
              <button type="button" class="link-btn" @click="goDetail(item.order_id)">{{ item.order_id }}</button>
            </td>
            <td>
              <span class="status-tag" :data-status="item.status">{{ statusLabel(item.status) }}</span>
            </td>
            <td>{{ item.channel }}</td>
            <td>{{ item.store_name }}</td>
            <td>{{ item.promoter_name }}</td>
            <td>{{ formatCurrency(item.amount) }}</td>
            <td>{{ item.settled_amount !== null && item.settled_amount !== undefined ? formatCurrency(item.settled_amount) : '-' }}</td>
            <td class="actions-col">
              <div class="row-actions">
                <button type="button" class="link-btn" @click="goDetail(item.order_id)">详情</button>
                <button type="button" class="link-btn" @click="openReviewModal(item)">审核</button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="10" class="empty">暂无符合条件的订单</td>
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

    <div v-if="showReviewModal" class="modal">
      <div class="modal__body">
        <header>
          <h2>审核订单 {{ reviewTarget?.order_id }}</h2>
        </header>
        <section class="modal__content">
          <div class="modal__actions">
            <button type="button" class="btn" :class="{ 'is-active': reviewAction === 'approve' }" @click="reviewAction = 'approve'">通过</button>
            <button type="button" class="btn btn--danger" :class="{ 'is-active': reviewAction === 'reject' }" @click="reviewAction = 'reject'">驳回</button>
          </div>
          <label class="modal__field">
            <span>备注</span>
            <textarea class="textarea" v-model.trim="reviewNote" rows="4" placeholder="请输入审核备注（至少 5 个字符）" />
          </label>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" @click="closeReviewModal">取消</button>
          <button type="button" class="btn" :disabled="!canSubmitReview" @click="submitReview">提交</button>
        </footer>
      </div>
    </div>

    <div v-if="showBatchModal" class="modal">
      <div class="modal__body">
        <header>
          <h2>批量{{ batchAction === 'approve' ? '通过' : '驳回' }} {{ selectedIds.length }} 条订单</h2>
        </header>
        <section class="modal__content">
          <p class="modal__hint">将处理以下订单（最多展示前 3 条）：</p>
          <ul class="modal__list">
            <li v-for="id in selectedIds.slice(0, 3)" :key="id">{{ id }}</li>
            <li v-if="selectedIds.length > 3">... 等 {{ selectedIds.length }} 条</li>
          </ul>
          <label class="modal__field">
            <span>备注</span>
            <textarea class="textarea" v-model.trim="batchNote" rows="4" placeholder="请输入批量审核备注（至少 5 个字符）" />
          </label>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" @click="closeBatchModal">取消</button>
          <button type="button" class="btn" :class="{ 'btn--danger': batchAction === 'reject' }" :disabled="!canSubmitBatch" @click="submitBatchReview">
            确认提交
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import {
  OrdersService,
  type OrderListItem,
  type OrderStatus,
  type OrderReviewRequest,
  type OrderBatchReviewRequest
} from '@/sdk';

type ReviewAction = 'approve' | 'reject';

const router = useRouter();

const today = new Date();
const defaultEnd = today.toISOString().slice(0, 10);
const startSeed = new Date(today);
startSeed.setDate(startSeed.getDate() - 6);
const defaultStart = startSeed.toISOString().slice(0, 10);

const filters = reactive({
  start: defaultStart,
  end: defaultEnd,
  status: [] as OrderStatus[],
  channel: '',
  storeCode: '',
  promoterId: '',
  orderId: '',
  phone: '',
  page: 1,
  pageSize: 20 as 20 | 50 | 100 | 200
});

const orders = ref<OrderListItem[]>([]);
const total = ref(0);
const loading = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');

const sortKey = ref<'created_at' | 'amount' | 'status'>('created_at');
const sortOrder = ref<'asc' | 'desc'>('desc');

const selected = reactive(new Set<string>());

const showReviewModal = ref(false);
const reviewTarget = ref<OrderListItem | null>(null);
const reviewAction = ref<ReviewAction>('approve');
const reviewNote = ref('');

const showBatchModal = ref(false);
const batchAction = ref<ReviewAction>('approve');
const batchNote = ref('');

const statusOptions = [
  { value: 'pending', label: '待提交' },
  { value: 'auto_reject', label: '自动拒绝' },
  { value: 'under_review', label: '待审核' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已驳回' },
  { value: 'settled', label: '已结算' }
] as const;

const channelOptions = ['wechat', 'h5', 'scan', 'api'];

const pageSizes: Array<20 | 50 | 100 | 200> = [20, 50, 100, 200];

const pageCount = computed(() => {
  return Math.max(1, Math.ceil(total.value / filters.pageSize));
});

const selectedIds = computed(() => Array.from(selected));

const allSelectedOnPage = computed(() => {
  if (!orders.value.length) return false;
  return orders.value.every((item) => selected.has(item.order_id));
});

const canSubmitReview = computed(() => reviewNote.value.length >= 5 && !!reviewAction.value);
const canSubmitBatch = computed(() => batchNote.value.length >= 5 && selectedIds.value.length > 0);

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

let requestToken = 0;

function statusLabel(status: string) {
  const option = statusOptions.find((opt) => opt.value === status);
  return option ? option.label : status;
}

function formatCurrency(amount: number) {
  return currencyFormatter.format(amount);
}

function formatDateTime(value: string) {
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.status = [];
  filters.channel = '';
  filters.storeCode = '';
  filters.promoterId = '';
  filters.orderId = '';
  filters.phone = '';
  filters.page = 1;
  filters.pageSize = 20;
  fetchOrders();
}

function applyFilters() {
  filters.page = 1;
  fetchOrders();
}

function refresh() {
  fetchOrders();
}

function changePage(page: number) {
  const next = Math.min(Math.max(page, 1), pageCount.value);
  if (next !== filters.page) {
    filters.page = next;
  }
}

function changePageSize(event: Event) {
  const target = event.target as HTMLSelectElement;
  const size = Number(target.value) as 20 | 50 | 100 | 200;
  if (filters.pageSize !== size) {
    filters.pageSize = size;
    filters.page = 1;
  }
}

function toggleSort(key: 'created_at' | 'amount' | 'status') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'created_at' ? 'desc' : 'asc';
  }
  fetchOrders();
}

function toggleSelection(orderId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    selected.add(orderId);
  } else {
    selected.delete(orderId);
  }
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    orders.value.forEach((item) => selected.add(item.order_id));
  } else {
    orders.value.forEach((item) => selected.delete(item.order_id));
  }
}

function clearSelection() {
  selected.clear();
}

function goDetail(orderId: string) {
  router.push({ path: `/orders/${orderId}` });
}

function openReviewModal(item: OrderListItem) {
  reviewTarget.value = item;
  reviewAction.value = 'approve';
  reviewNote.value = '';
  showReviewModal.value = true;
}

function closeReviewModal() {
  showReviewModal.value = false;
  reviewTarget.value = null;
  reviewNote.value = '';
}

function openBatchModal(action: ReviewAction) {
  batchAction.value = action;
  batchNote.value = '';
  showBatchModal.value = true;
}

function closeBatchModal() {
  showBatchModal.value = false;
  batchNote.value = '';
}

function mapActionToStatus(action: ReviewAction): OrderStatus {
  return action === 'approve' ? 'approved' : 'rejected';
}

async function submitReview() {
  if (!reviewTarget.value || !reviewAction.value || reviewNote.value.length < 5) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const payload: OrderReviewRequest = {
      action: reviewAction.value,
      note: reviewNote.value,
      reviewer_id: 'demo-reviewer'
    };
    const response = await OrdersService.reviewOrder(reviewTarget.value.order_id, payload);
    const nextStatus = response.new_status ?? mapActionToStatus(reviewAction.value);
    const updated = orders.value.map((item) =>
      item.order_id === reviewTarget.value?.order_id ? { ...item, status: nextStatus } : item
    );
    orders.value = updated;
    selected.delete(reviewTarget.value.order_id);
    feedbackMessage.value = `订单 ${reviewTarget.value.order_id} 已标记为 ${statusLabel(nextStatus)}。`;
    closeReviewModal();
  } catch (error: any) {
    errorMessage.value = error?.message || '提交审核失败，请稍后再试。';
  } finally {
    loading.value = false;
  }
}

async function submitBatchReview() {
  if (!batchAction.value || batchNote.value.length < 5 || selectedIds.value.length === 0) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const payload: OrderBatchReviewRequest = {
      ids: selectedIds.value,
      action: batchAction.value,
      note: batchNote.value
    };
    const response = await OrdersService.batchReviewOrders(payload);
    const newStatus = mapActionToStatus(batchAction.value);
    const idSet = new Set(response.processed_ids ?? payload.ids);
    orders.value = orders.value.map((item) => (idSet.has(item.order_id) ? { ...item, status: newStatus } : item));
    response.processed_ids?.forEach((id) => selected.delete(id));
    feedbackMessage.value = `批量${batchAction.value === 'approve' ? '通过' : '驳回'} ${idSet.size} 条订单成功。`;
    closeBatchModal();
  } catch (error: any) {
    errorMessage.value = error?.message || '批量审核失败，请稍后再试。';
  } finally {
    loading.value = false;
  }
}

function friendlyError(message?: string) {
  if (!message) return '加载订单列表失败，请稍后再试。';
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '无法连接到订单接口，请确认 Mock 服务已启动或网络可用。';
  }
  return message;
}

async function fetchOrders() {
  loading.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  const token = ++requestToken;
  try {
    const statusPayload = filters.status.length ? filters.status : undefined;
    const channelPayload = filters.channel ? [filters.channel] : undefined;
    const response = await OrdersService.listOrders(
      filters.start || undefined,
      filters.end || undefined,
      statusPayload,
      channelPayload,
      filters.storeCode || undefined,
      filters.promoterId || undefined,
      filters.orderId || undefined,
      filters.phone || undefined,
      filters.page,
      filters.pageSize,
      sortKey.value,
      sortOrder.value
    );
    if (token !== requestToken) return;
    orders.value = response.items ?? [];
    total.value = response.total ?? 0;
    const currentIds = new Set(orders.value.map((item) => item.order_id));
    Array.from(selected).forEach((id) => {
      if (!currentIds.has(id)) selected.delete(id);
    });
  } catch (error: any) {
    if (token !== requestToken) return;
    errorMessage.value = friendlyError(error?.message);
    orders.value = [];
    total.value = 0;
  } finally {
    if (token === requestToken) {
      loading.value = false;
    }
  }
}

watch(
  () => [filters.page, filters.pageSize],
  () => {
    fetchOrders();
  }
);

onMounted(() => {
  fetchOrders();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.orders {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.orders__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-16;
}

.orders__title {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
  line-height: calc(#{$font-line-height-16} * 1.1);
}

.orders__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.orders__head-actions {
  display: flex;
  gap: $spacing-12;
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
  font-size: $font-size-16;
  color: $color-surface-500;
}

.filters__actions {
  display: flex;
  gap: $spacing-12;
  margin-top: $spacing-16;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-8;
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

.btn.is-active {
  box-shadow: inset 0 0 0 $border-width-1 $color-text-on-primary;
}

.input,
.textarea,
.filters select {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  background: $color-surface-0;
  color: $color-text-strong;
  font-size: $font-size-16;
}

.textarea {
  resize: vertical;
}

.batch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
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
  overflow-x: auto;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
}

table {
  width: 100%;
  border-collapse: collapse;
}

thead th {
  text-align: left;
  padding: $spacing-12 $spacing-16;
  background: $color-surface-50;
  font-weight: $font-weight-medium;
  color: $color-surface-500;
}

thead th.sortable {
  cursor: pointer;
}

tbody td {
  padding: $spacing-12 $spacing-16;
  border-top: $border-width-1 solid $color-surface-100;
  color: $color-text-strong;
  vertical-align: middle;
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

.link-btn {
  border: none;
  background: transparent;
  color: $color-primary-700;
  cursor: pointer;
  font-weight: $font-weight-medium;
}

.link-btn:hover {
  text-decoration: underline;
}

.sort-indicator[data-active='false'] {
  opacity: 0.4;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: $spacing-8;
  border-radius: $radius-8;
  background: $color-surface-100;
}

.status-tag[data-status='approved'] {
  background: $color-primary-50;
  color: $color-primary-700;
}

.status-tag[data-status='rejected'],
.btn--danger {
  color: $color-text-on-primary;
}

.empty {
  text-align: center;
  color: $color-surface-500;
  padding: $spacing-16;
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
  align-items: center;
  gap: $spacing-12;
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
  width: min(640px, 100%);
  background: $color-surface-0;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.modal__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.modal__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.modal__actions {
  display: flex;
  gap: $spacing-12;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-12;
}

.modal__hint {
  margin: 0;
  color: $color-surface-500;
}

.modal__list {
  margin: 0;
  padding-left: calc(#{$spacing-16} * 1.5);
  color: $color-text-strong;
}

@media (max-width: 64rem) {
  .filters__row {
    grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 6), 1fr));
  }
}
</style>
