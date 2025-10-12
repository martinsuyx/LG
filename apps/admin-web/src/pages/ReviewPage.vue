<template>
  <section class="review">
    <header class="review__head">
      <div>
        <h1 class="review__title">审核工作台</h1>
        <p class="review__subtitle">集中处理待审核订单，支持快捷复核与详情查看。</p>
      </div>
      <div class="review__stats" v-if="stats">
        <div class="stat-card">
          <span class="stat-card__label">待审核总数</span>
          <strong class="stat-card__value">{{ stats.pending_total }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">今日已处理</span>
          <strong class="stat-card__value">{{ stats.processed_today }}</strong>
        </div>
        <div class="stat-card">
          <span class="stat-card__label">平均耗时(秒)</span>
          <strong class="stat-card__value">{{ stats.avg_time_sec }}</strong>
        </div>
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
              <option v-for="option in channelOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <label class="filters__field">
            <span>门店编码</span>
            <input class="input" type="text" v-model.trim="filters.storeCode" placeholder="如 S001" />
          </label>
          <label class="filters__field">
            <span>活动 ID</span>
            <input class="input" type="text" v-model.trim="filters.campaignId" placeholder="如 C001" />
          </label>
          <label class="filters__field">
            <span>风控标签</span>
            <select class="input" multiple v-model="filters.riskTag">
              <option value="high">高风险</option>
              <option value="medium">中风险</option>
              <option value="low">低风险</option>
            </select>
          </label>
        </div>
        <div class="filters__actions">
          <button type="submit" class="btn" :disabled="loading">应用筛选</button>
          <button type="button" class="btn btn--ghost" @click="resetFilters" :disabled="loading">重置</button>
        </div>
      </fieldset>
    </form>

    <div class="review__layout">
      <section class="queue">
        <div v-if="selectedIds.length" class="queue__batch-bar">
          <span>已选 {{ selectedIds.length }} 条</span>
          <div class="queue__batch-actions">
            <button type="button" class="btn" @click="openBatchModal('approve')">批量通过</button>
            <button type="button" class="btn btn--danger" @click="openBatchModal('reject')">批量驳回</button>
            <button type="button" class="btn btn--ghost" @click="clearSelection">清空</button>
          </div>
        </div>

        <div class="table-card">
          <table>
            <thead>
              <tr>
                <th class="col-checkbox">
                  <input type="checkbox" :checked="allSelectedOnPage" @change="toggleSelectAll($event)" />
                </th>
                <th>时间</th>
                <th>订单号</th>
                <th>用户</th>
                <th>手机号</th>
                <th>门店</th>
                <th>活动</th>
                <th>金额</th>
                <th>风控</th>
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
              <tr v-for="item in orders" :key="item.order_id" :class="{ 'is-active': activeOrderId === item.order_id }">
                <td class="col-checkbox">
                  <input type="checkbox" :checked="selected.has(item.order_id)" @change="toggleSelection(item.order_id, $event)" />
                </td>
                <td>{{ formatDateTime(item.created_at) }}</td>
                <td>
                  <button type="button" class="link-btn" @click="openPreview(item)">{{ item.order_id }}</button>
                </td>
                <td>{{ item.user_name }}</td>
                <td>{{ item.phone }}</td>
                <td>{{ item.store_name }}</td>
                <td>{{ item.campaign_name }}</td>
                <td>{{ formatCurrency(item.amount) }}</td>
                <td>
                  <span v-if="item.risk_flag" class="risk-flag">命中</span>
                  <span v-else>-</span>
                </td>
                <td class="actions-col">
                  <div class="row-actions">
                    <button type="button" class="link-btn" @click="openReviewModal(item, 'approve')">通过</button>
                    <button type="button" class="link-btn" @click="openReviewModal(item, 'reject')">驳回</button>
                  </div>
                </td>
              </tr>
            </tbody>
            <tbody v-else>
              <tr>
                <td :colspan="10" class="placeholder">暂无待审核订单</td>
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
      </section>

      <aside class="preview">
        <div v-if="previewLoading" class="placeholder">加载详情...</div>
        <div v-else-if="previewError" class="feedback feedback--error">{{ previewError }}</div>
        <div v-else-if="preview" class="preview__card">
          <header class="preview__head">
            <h2>订单 {{ preview.order_id }}</h2>
            <span class="status-tag" :data-status="preview.status">{{ statusLabel(preview.status) }}</span>
          </header>
          <dl>
            <div>
              <dt>金额</dt>
              <dd>{{ formatCurrency(preview.amount) }}</dd>
            </div>
            <div>
              <dt>推广人</dt>
              <dd>{{ preview.user?.name || '-' }}</dd>
            </div>
            <div>
              <dt>手机号</dt>
              <dd>{{ preview.user?.phone || '-' }}</dd>
            </div>
            <div>
              <dt>风控命中</dt>
              <dd>{{ (preview.risk_hits?.length || 0) > 0 ? '是' : '否' }}</dd>
            </div>
          </dl>
          <h3>最新日志</h3>
          <ul class="preview__audits">
            <li v-for="audit in limitedAudits" :key="audit.time">
              <span>{{ formatDateTime(audit.time) }}</span>
              <span>{{ audit.actor }}</span>
              <span>{{ audit.action }}</span>
            </li>
          </ul>
          <button type="button" class="btn btn--ghost" @click="goDetail(preview.order_id)">查看详情页</button>
        </div>
        <p v-else class="placeholder">请选择列表中的订单以查看详情。</p>
      </aside>
    </div>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>

    <div v-if="showReviewModal" class="modal">
      <div class="modal__body">
        <header>
          <h2>{{ reviewAction === 'approve' ? '通过订单' : '驳回订单' }}</h2>
        </header>
        <section class="modal__content">
          <p>订单号：{{ reviewTarget?.order_id }}</p>
          <label class="modal__field">
            <span>备注（至少 5 个字符）</span>
            <textarea class="textarea" v-model.trim="reviewNote" rows="4" placeholder="请输入备注" />
          </label>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" @click="closeReviewModal">取消</button>
          <button type="button" class="btn" :class="{ 'btn--danger': reviewAction === 'reject' }" :disabled="reviewNote.length < 5 || loading" @click="submitReview">
            确认提交
          </button>
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
          <button type="button" class="btn" :class="{ 'btn--danger': batchAction === 'reject' }" :disabled="batchNote.length < 5 || loading" @click="submitBatchReview">
            确认提交
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  OrdersService,
  ReviewService,
  type OrderDetailResponse,
  type OrderReviewRequest,
  type OrderBatchReviewRequest,
  type ReviewOrderItem,
  type ReviewStatsResponse,
  type OrderStatus
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
  campaignId: '',
  riskTag: [] as string[],
  page: 1,
  pageSize: 20 as 20 | 50 | 100 | 200
});

const statusOptions = [
  { value: 'pending', label: '待提交' },
  { value: 'under_review', label: '待审核' }
] as const;

const channelOptions = ['wechat', 'h5', 'scan', 'api'];
const pageSizes: Array<20 | 50 | 100 | 200> = [20, 50, 100, 200];

const orders = ref<ReviewOrderItem[]>([]);
const total = ref(0);
const stats = ref<ReviewStatsResponse | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');

const selected = reactive(new Set<string>());
const selectedIds = computed(() => Array.from(selected));
const allSelectedOnPage = computed(() => orders.value.length > 0 && orders.value.every((item) => selected.has(item.order_id)));

const showReviewModal = ref(false);
const reviewTarget = ref<ReviewOrderItem | null>(null);
const reviewAction = ref<ReviewAction>('approve');
const reviewNote = ref('');

const showBatchModal = ref(false);
const batchAction = ref<ReviewAction>('approve');
const batchNote = ref('');

const activeOrderId = ref<string | null>(null);
const preview = ref<OrderDetailResponse | null>(null);
const previewLoading = ref(false);
const previewError = ref('');

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)));

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

const statusMap: Record<string, string> = {
  pending: '待提交',
  auto_reject: '自动拒绝',
  under_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  settled: '已结算'
};

function statusLabel(status?: string) {
  if (!status) return '-';
  return statusMap[status] || status;
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return currencyFormatter.format(value);
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

const limitedAudits = computed(() => preview.value?.audits?.slice(0, 3) ?? []);

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.status = [];
  filters.channel = '';
  filters.storeCode = '';
  filters.campaignId = '';
  filters.riskTag = [];
  filters.page = 1;
  filters.pageSize = 20;
  fetchQueue();
}

function applyFilters() {
  filters.page = 1;
  fetchQueue();
}

function changePage(page: number) {
  const next = Math.min(Math.max(page, 1), pageCount.value);
  if (filters.page !== next) {
    filters.page = next;
    fetchQueue();
  }
}

function changePageSize(event: Event) {
  const target = event.target as HTMLSelectElement;
  const size = Number(target.value) as 20 | 50 | 100 | 200;
  if (filters.pageSize !== size) {
    filters.pageSize = size;
    filters.page = 1;
    fetchQueue();
  }
}

function toggleSelection(orderId: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) selected.add(orderId);
  else selected.delete(orderId);
}

function toggleSelectAll(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) orders.value.forEach((item) => selected.add(item.order_id));
  else orders.value.forEach((item) => selected.delete(item.order_id));
}

function clearSelection() {
  selected.clear();
}

function openPreview(item: ReviewOrderItem) {
  activeOrderId.value = item.order_id;
  loadPreview(item.order_id);
}

function goDetail(orderId: string) {
  router.push({ path: `/orders/${orderId}` });
}

function openReviewModal(item: ReviewOrderItem, action: ReviewAction) {
  reviewTarget.value = item;
  reviewAction.value = action;
  reviewNote.value = '';
  showReviewModal.value = true;
}

function closeReviewModal() {
  showReviewModal.value = false;
  reviewNote.value = '';
  reviewTarget.value = null;
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
  if (!reviewTarget.value || reviewNote.value.length < 5) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const payload: OrderReviewRequest = {
      action: reviewAction.value,
      note: reviewNote.value,
      reviewer_id: 'demo-reviewer'
    };
    const response = await OrdersService.reviewOrder(reviewTarget.value.order_id, payload);
    const updatedStatus = response.new_status ?? mapActionToStatus(reviewAction.value);
    orders.value = orders.value.filter((item) => item.order_id !== reviewTarget.value?.order_id);
    selected.delete(reviewTarget.value.order_id);
    feedbackMessage.value = `订单 ${reviewTarget.value.order_id} 已${reviewAction.value === 'approve' ? '通过' : '驳回'}。`;
    if (activeOrderId.value === reviewTarget.value.order_id) {
      preview.value = preview.value ? { ...preview.value, status: updatedStatus } : preview.value;
    }
    closeReviewModal();
  } catch (error: any) {
    errorMessage.value = error?.message || '提交审核失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

async function submitBatchReview() {
  if (batchNote.value.length < 5 || selectedIds.value.length === 0) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const payload: OrderBatchReviewRequest = {
      ids: selectedIds.value,
      action: batchAction.value,
      note: batchNote.value
    };
    const response = await OrdersService.batchReviewOrders(payload);
    const processed = new Set(response.processed_ids ?? payload.ids);
    orders.value = orders.value.filter((item) => !processed.has(item.order_id));
    payload.ids.forEach((id) => selected.delete(id));
    feedbackMessage.value = `批量${batchAction.value === 'approve' ? '通过' : '驳回'} ${processed.size} 条订单成功。`;
    closeBatchModal();
  } catch (error: any) {
    errorMessage.value = error?.message || '批量审核失败，请稍后重试。';
  } finally {
    loading.value = false;
  }
}

async function fetchStats() {
  try {
    stats.value = await ReviewService.getReviewStats(filters.start || undefined, filters.end || undefined);
  } catch (error) {
    // 静默，统计卡失败不阻断流程
  }
}

function friendlyError(message?: string, fallback = '加载待审核订单失败，请稍后重试。') {
  if (!message) return fallback;
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '无法连接到审核接口，请确认 Mock 服务已启动或网络可用。';
  }
  return message;
}

async function fetchQueue() {
  loading.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    const statusPayload = filters.status.length ? filters.status : undefined;
    const channelPayload = filters.channel ? [filters.channel] : undefined;
    const riskPayload = filters.riskTag.length ? filters.riskTag : undefined;
    const response = await ReviewService.listReviewOrders(
      filters.start || undefined,
      filters.end || undefined,
      statusPayload,
      channelPayload,
      filters.storeCode || undefined,
      filters.campaignId || undefined,
      riskPayload,
      filters.page,
      filters.pageSize
    );
    orders.value = response.items ?? [];
    total.value = response.total ?? 0;
    const currentIds = new Set(orders.value.map((item) => item.order_id));
    Array.from(selected).forEach((id) => {
      if (!currentIds.has(id)) selected.delete(id);
    });
    if (orders.value.length && !activeOrderId.value) {
      openPreview(orders.value[0]);
    }
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message);
    orders.value = [];
    total.value = 0;
  } finally {
    loading.value = false;
  }
}

async function loadPreview(orderId: string) {
  previewLoading.value = true;
  previewError.value = '';
  try {
    preview.value = await OrdersService.getOrderDetail(orderId);
  } catch (error: any) {
    previewError.value = friendlyError(error?.message, '加载订单详情失败。');
  } finally {
    previewLoading.value = false;
  }
}

onMounted(() => {
  fetchStats();
  fetchQueue();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.review {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.review__head {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
  align-items: center;
}

.review__title {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
}

.review__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.review__stats {
  display: flex;
  gap: $spacing-12;
}

.stat-card {
  min-width: calc(#{$spacing-16} * 6);
  padding: $spacing-12;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  text-align: right;
}

.stat-card__label {
  color: $color-surface-500;
  font-size: $font-size-12;
}

.stat-card__value {
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
  color: $color-text-strong;
}

.filters {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
}

.filters__group {
  border: none;
  margin: 0;
  padding: 0;
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

.review__layout {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
}

.queue__batch-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-16;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-8;
  background: $color-primary-50;
  color: $color-primary-700;
  margin-bottom: $spacing-12;
}

.queue__batch-actions {
  display: flex;
  gap: $spacing-12;
}

.table-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  overflow-x: auto;
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
  color: $color-surface-500;
  font-weight: $font-weight-medium;
}

tbody td {
  padding: $spacing-12 $spacing-16;
  border-top: $border-width-1 solid $color-surface-100;
  color: $color-text-strong;
}

tbody tr.is-active {
  background: $color-primary-50;
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

.risk-flag {
  display: inline-flex;
  padding: $spacing-8;
  border-radius: $radius-8;
  background: $color-primary-50;
  color: $color-primary-700;
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
  margin-top: $spacing-12;
  color: $color-surface-500;
}

.pager__size {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
}

.preview {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.preview__card {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.preview__head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.preview__card dl {
  margin: 0;
  display: grid;
  gap: $spacing-8;
}

.preview__card dl div {
  display: flex;
  justify-content: space-between;
  gap: $spacing-12;
}

.preview__audits {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: $spacing-8;
}

.preview__audits li {
  display: flex;
  justify-content: space-between;
  gap: $spacing-12;
  padding: $spacing-8 $spacing-12;
  border: $border-width-1 solid $color-surface-100;
  border-radius: $radius-8;
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

.btn--ghost {
  background: transparent;
  color: $color-primary-700;
}

.btn--danger {
  border-color: $color-surface-500;
  background: $color-surface-300;
  color: $color-surface-0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
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

.placeholder {
  margin: 0;
  color: $color-surface-500;
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
  width: min(520px, 100%);
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

.modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-12;
}

@media (max-width: 64rem) {
  .review__layout {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
