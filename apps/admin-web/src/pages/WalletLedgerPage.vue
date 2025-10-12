<template>
  <section class="ledger">
    <header class="ledger__head">
      <div>
        <h1 class="ledger__title">钱包流水</h1>
        <p class="ledger__subtitle">按维度查看资金流动，支持筛选、导出和详情查看。</p>
      </div>
      <div class="ledger__actions">
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
          <label class="filters__field">
            <span>交易类型</span>
            <select class="input" multiple v-model="filters.txType">
              <option v-for="option in txTypeOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
          <label class="filters__field">
            <span>状态</span>
            <select class="input" multiple v-model="filters.txStatus">
              <option v-for="option in txStatusOptions" :key="option" :value="option">{{ option }}</option>
            </select>
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
        <span class="stat-card__label">入账总额</span>
        <strong class="stat-card__value">{{ formatCurrency(stats?.in_total) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">出账总额</span>
        <strong class="stat-card__value">{{ formatCurrency(stats?.out_total) }}</strong>
      </article>
      <article class="stat-card">
        <span class="stat-card__label">净额</span>
        <strong class="stat-card__value" :data-positive="(stats?.net ?? 0) >= 0">{{ formatCurrency(stats?.net) }}</strong>
      </article>
    </section>

    <div class="table-card">
      <table>
        <thead>
          <tr>
            <th>流水号</th>
            <th class="sortable" @click="toggleSort('created_at')">
              时间
              <span class="sort-ind" :data-active="sortKey === 'created_at'">{{ sortKey === 'created_at' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
            </th>
            <th>主体</th>
            <th>类型</th>
            <th>关联订单</th>
            <th class="sortable" @click="toggleSort('amount')">
              金额
              <span class="sort-ind" :data-active="sortKey === 'amount'">{{ sortKey === 'amount' ? (sortOrder === 'asc' ? '↑' : '↓') : '' }}</span>
            </th>
            <th>交易后余额</th>
            <th>状态</th>
            <th>备注</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="index in 5" :key="`loading-${index}`">
            <td :colspan="9"><div class="skeleton"></div></td>
          </tr>
        </tbody>
        <tbody v-else-if="sortedRows.length">
          <tr v-for="row in sortedRows" :key="row.tx_id">
            <td>
              <button type="button" class="link-btn" @click="openDetail(row)">{{ row.tx_id }}</button>
            </td>
            <td>{{ formatDateTime(row.created_at) }}</td>
            <td>{{ row.entity_name }}</td>
            <td>{{ row.tx_type }}</td>
            <td>
              <button v-if="row.order_id" type="button" class="link-btn" @click="goOrder(row.order_id)">{{ row.order_id }}</button>
              <span v-else>-</span>
            </td>
            <td :class="{ 'is-negative': row.amount < 0 }">{{ formatCurrency(row.amount) }}</td>
            <td>{{ formatCurrency(row.balance_after) }}</td>
            <td>{{ row.status }}</td>
            <td>{{ row.note || '-' }}</td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="9" class="placeholder">暂无流水记录。</td>
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

    <div v-if="detail" class="modal" @click.self="closeDetail">
      <div class="modal__body">
        <header>
          <h2>流水详情 {{ detail.tx_id }}</h2>
        </header>
        <section class="modal__content">
          <dl>
            <div><dt>时间</dt><dd>{{ formatDateTime(detail.created_at) }}</dd></div>
            <div><dt>主体</dt><dd>{{ detail.entity_name }}</dd></div>
            <div><dt>类型</dt><dd>{{ detail.tx_type }}</dd></div>
            <div><dt>金额</dt><dd>{{ formatCurrency(detail.amount) }}</dd></div>
            <div><dt>交易后余额</dt><dd>{{ formatCurrency(detail.balance_after) }}</dd></div>
            <div><dt>状态</dt><dd>{{ detail.status }}</dd></div>
            <div><dt>备注</dt><dd>{{ detail.note || '-' }}</dd></div>
          </dl>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn" @click="closeDetail">关闭</button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ExportsService, WalletService, type WalletLedgerItem, type WalletLedgerResponse, type WalletLedgerStatsResponse } from '@/sdk';

type Dimension = 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual';

const route = useRoute();
const router = useRouter();

const today = new Date();
const defaultEnd = today.toISOString().slice(0, 10);
const startSeed = new Date(today);
startSeed.setDate(startSeed.getDate() - 6);
const defaultStart = startSeed.toISOString().slice(0, 10);

const filters = reactive({
  start: defaultStart,
  end: defaultEnd,
  dimension: 'platform' as Dimension,
  entityId: '',
  txType: [] as Array<'order_settlement' | 'freeze' | 'unfreeze' | 'withdraw' | 'adjustment'>,
  txStatus: [] as Array<'success' | 'pending' | 'failed'>,
  page: 1,
  pageSize: 20 as 20 | 50 | 100 | 200
});

const dimensionOptions = [
  { value: 'platform', label: '平台' },
  { value: 'company', label: '公司' },
  { value: 'team', label: '团队' },
  { value: 'store', label: '门店' },
  { value: 'promoter', label: '推广人' },
  { value: 'individual', label: '个人' }
] as const;

const txTypeOptions: Array<'order_settlement' | 'freeze' | 'unfreeze' | 'withdraw' | 'adjustment'> = ['order_settlement', 'freeze', 'unfreeze', 'withdraw', 'adjustment'];
const txStatusOptions: Array<'success' | 'pending' | 'failed'> = ['success', 'pending', 'failed'];
const pageSizes: Array<20 | 50 | 100 | 200> = [20, 50, 100, 200];

const stats = ref<WalletLedgerStatsResponse | null>(null);
const rows = ref<WalletLedgerItem[]>([]);
const total = ref(0);
const loading = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');
const sortKey = ref<'created_at' | 'amount'>('created_at');
const sortOrder = ref<'asc' | 'desc'>('desc');
const detail = ref<WalletLedgerItem | null>(null);

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

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
});

const sortedRows = computed(() => {
  const clone = [...rows.value];
  return clone.sort((a, b) => {
    let left = 0;
    let right = 0;
    if (sortKey.value === 'amount') {
      left = a.amount ?? 0;
      right = b.amount ?? 0;
    } else {
      left = new Date(a.created_at ?? '').getTime();
      right = new Date(b.created_at ?? '').getTime();
    }
    const diff = left - right;
    return sortOrder.value === 'asc' ? diff : -diff;
  });
});

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)));

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return currencyFormatter.format(value);
}

function formatDate(value?: string | null) {
  if (!value) return '-';
  try {
    return dateFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return '-';
  try {
    return dateTimeFormatter.format(new Date(value));
  } catch {
    return value;
  }
}

function friendlyError(message?: string, fallback = '加载钱包流水失败，请稍后再试。') {
  if (!message) return fallback;
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '无法连接到钱包流水接口，请确认 Mock 服务已启动或网络可用。';
  }
  return message;
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.dimension = 'platform';
  filters.entityId = '';
  filters.txType = [];
  filters.txStatus = [];
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
  if (next !== filters.page) {
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

function toggleSort(key: 'created_at' | 'amount') {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  } else {
    sortKey.value = key;
    sortOrder.value = key === 'created_at' ? 'desc' : 'asc';
  }
}

function openDetail(row: WalletLedgerItem) {
  detail.value = row;
}

function closeDetail() {
  detail.value = null;
}

function goOrder(orderId?: string | null) {
  if (!orderId) return;
  router.push(`/orders/${orderId}`);
}

async function exportView() {
  feedbackMessage.value = '';
  errorMessage.value = '';
  try {
    await ExportsService.exportWalletLedger();
    feedbackMessage.value = '已创建导出任务，请前往导出中心查看。';
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message, '导出失败，请稍后再试。');
  }
}

async function fetchStats() {
  stats.value = await WalletService.getWalletLedgerStats(filters.start || undefined, filters.end || undefined, filters.dimension, filters.entityId || undefined);
}

async function fetchList() {
  const response: WalletLedgerResponse = await WalletService.listWalletLedger(
    filters.start || undefined,
    filters.end || undefined,
    filters.dimension,
    filters.entityId || undefined,
    filters.txType.length ? filters.txType : undefined,
    filters.txStatus.length ? filters.txStatus : undefined,
    filters.page,
    filters.pageSize
  );
  rows.value = response.items ?? [];
  total.value = response.total ?? 0;
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
  const { dimension, entity_id, start, end } = route.query;
  if (typeof dimension === 'string' && dimensionOptions.some((opt) => opt.value === dimension)) {
    filters.dimension = dimension as Dimension;
  }
  if (typeof entity_id === 'string') {
    filters.entityId = entity_id;
  }
  if (typeof start === 'string') {
    filters.start = start;
  }
  if (typeof end === 'string') {
    filters.end = end;
  }
  fetchAll();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.ledger {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.ledger__head {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
  align-items: flex-start;
}

.ledger__title {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
}

.ledger__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-16;
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

.stats {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 10), 1fr));
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

.stat-card__value[data-positive='false'] {
  color: $color-surface-300;
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

.table-card thead th.sortable {
  cursor: pointer;
}

.table-card tbody td {
  padding: $spacing-12 $spacing-16;
  border-top: $border-width-1 solid $color-surface-100;
}

.table-card tbody td.is-negative {
  color: $color-surface-300;
}

.sort-ind[data-active='false'] {
  opacity: 0.4;
}

.placeholder {
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

.modal__content dl {
  margin: 0;
  display: grid;
  gap: $spacing-12;
}

.modal__content dl div {
  display: flex;
  justify-content: space-between;
  gap: $spacing-12;
}

.modal__footer {
  display: flex;
  justify-content: flex-end;
}

.link-btn {
  border: none;
  background: transparent;
  color: $color-primary-700;
  cursor: pointer;
}

@media (max-width: 64rem) {
  .filters__row {
    grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 6), 1fr));
  }
}
</style>
