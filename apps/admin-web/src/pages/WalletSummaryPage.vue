<template>
  <section class="summary">
    <header class="summary__head">
      <div>
        <h1 class="summary__title">钱包摘要</h1>
        <p class="summary__subtitle">查看平台余额、冻结与可提现情况，并按维度分析资金分布。</p>
      </div>
      <div class="summary__actions">
        <button type="button" class="btn" @click="exportView" :disabled="loading">导出当前视图</button>
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
            <span>账户状态</span>
            <select class="input" multiple v-model="filters.status">
              <option v-for="option in statusOptions" :key="option" :value="option">{{ option }}</option>
            </select>
          </label>
        </div>
        <div class="filters__actions">
          <button type="submit" class="btn" :disabled="loading">应用筛选</button>
          <button type="button" class="btn btn--ghost" @click="resetFilters" :disabled="loading">重置</button>
        </div>
      </fieldset>
    </form>

    <section class="kpis">
      <article class="kpi-card" v-for="card in kpiCards" :key="card.key">
        <header>
          <span class="kpi-card__label">{{ card.label }}</span>
        </header>
        <strong class="kpi-card__value">{{ formatCurrency(card.value) }}</strong>
      </article>
    </section>

    <section class="charts">
      <article class="chart-card">
        <header class="chart-card__head">
          <h2>余额趋势</h2>
          <button type="button" class="btn btn--tiny" :class="{ 'is-active': seriesMetric === 'balance' }" @click="setSeriesMetric('balance')">
            余额
          </button>
          <button type="button" class="btn btn--tiny" :class="{ 'is-active': seriesMetric === 'in_out' }" @click="setSeriesMetric('in_out')">
            入出账
          </button>
        </header>
        <div v-if="seriesMetric === 'balance'" class="chart">
          <div v-for="point in balancePoints" :key="point.ts" class="chart__bar">
            <div class="chart__balance" :style="{ height: barHeight(point.balance, maxBalance) }"></div>
            <time>{{ point.ts }}</time>
          </div>
        </div>
        <div v-else class="chart">
          <div v-for="point in inOutPoints" :key="point.ts" class="chart__bar">
            <div class="chart__inflow" :style="{ height: barHeight(point.inflow || 0, maxInflowOutflow) }"></div>
            <div class="chart__outflow" :style="{ height: barHeight(point.outflow || 0, maxInflowOutflow) }"></div>
            <time>{{ point.ts }}</time>
          </div>
        </div>
      </article>

      <article class="chart-card table-card">
        <header class="chart-card__head">
          <h2>账户汇总（{{ dimensionLabel }}）</h2>
        </header>
        <table>
          <thead>
            <tr>
              <th>名称</th>
              <th>余额</th>
              <th>冻结</th>
              <th>可用</th>
              <th>可提现</th>
              <th>最后交易时间</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody v-if="loading">
            <tr v-for="index in 3" :key="`loading-${index}`">
              <td :colspan="8"><div class="skeleton"></div></td>
            </tr>
          </tbody>
          <tbody v-else-if="list.length">
            <tr v-for="item in list" :key="item.entity_id">
              <td>{{ item.entity_name }}</td>
              <td>{{ formatCurrency(item.balance) }}</td>
              <td>{{ formatCurrency(item.frozen) }}</td>
              <td>{{ formatCurrency(item.available) }}</td>
              <td>{{ formatCurrency(item.withdrawable) }}</td>
              <td>{{ formatDateTime(item.last_tx_time) }}</td>
              <td>{{ item.status }}</td>
              <td>
                <button type="button" class="link-btn" @click="drillLedger(item)">查看流水</button>
                <button type="button" class="link-btn" :disabled="item.withdrawable <= 0">去提现</button>
              </td>
            </tr>
          </tbody>
          <tbody v-else>
            <tr>
              <td :colspan="8" class="placeholder">暂无数据，请调整筛选条件。</td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { WalletService, ExportsService, type WalletSummaryListItem, type WalletSummaryOverview, type WalletSummarySeriesResponse } from '@/sdk';

type Dimension = 'platform' | 'company' | 'team' | 'store' | 'promoter' | 'individual';
type Metric = 'balance' | 'in_out';

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
  status: [] as Array<'normal' | 'frozen' | 'closed'>
});

const overview = ref<WalletSummaryOverview | null>(null);
const balanceSeries = ref<WalletSummarySeriesResponse | null>(null);
const inOutSeries = ref<WalletSummarySeriesResponse | null>(null);
const list = ref<WalletSummaryListItem[]>([]);

const loading = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');
const seriesMetric = ref<Metric>('balance');

const dimensionOptions = [
  { value: 'platform', label: '平台' },
  { value: 'company', label: '公司' },
  { value: 'team', label: '团队' },
  { value: 'store', label: '门店' },
  { value: 'promoter', label: '推广人' },
  { value: 'individual', label: '个人' }
] as const;

const statusOptions: Array<'normal' | 'frozen' | 'closed'> = ['normal', 'frozen', 'closed'];

const kpiCards = computed(() => [
  { key: 'total_balance', label: '总余额', value: overview.value?.total_balance ?? 0 },
  { key: 'frozen', label: '冻结金额', value: overview.value?.frozen ?? 0 },
  { key: 'available', label: '可用余额', value: overview.value?.available ?? 0 },
  { key: 'withdrawable', label: '可提现金额', value: overview.value?.withdrawable ?? 0 },
  { key: 'in_7d', label: '近7日入账', value: overview.value?.in_7d ?? 0 },
  { key: 'out_7d', label: '近7日出账', value: overview.value?.out_7d ?? 0 }
]);

const balancePoints = computed(() => balanceSeries.value?.points ?? []);
const inOutPoints = computed(() => inOutSeries.value?.points ?? []);

const maxBalance = computed(() => Math.max(...balancePoints.value.map((p) => p.balance ?? 0), 1));
const maxInflowOutflow = computed(() => {
  const values = inOutPoints.value.flatMap((p) => [p.inflow ?? 0, p.outflow ?? 0]);
  return Math.max(...values, 1);
});

const dimensionLabel = computed(() => {
  const option = dimensionOptions.find((opt) => opt.value === filters.dimension);
  return option ? option.label : filters.dimension;
});

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit'
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

function barHeight(value: number | undefined, max: number) {
  if (!value || max <= 0) return '0%';
  return `${Math.round((value / max) * 100)}%`;
}

function setSeriesMetric(metric: Metric) {
  seriesMetric.value = metric;
  if (metric === 'balance' && !balanceSeries.value) {
    fetchSeries('balance');
  } else if (metric === 'in_out' && !inOutSeries.value) {
    fetchSeries('in_out');
  }
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.dimension = 'platform';
  filters.status = [];
  fetchAll();
}

function applyFilters() {
  fetchAll();
}

function friendlyError(message?: string, fallback = '加载钱包摘要失败，请稍后再试。') {
  if (!message) return fallback;
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '无法连接到钱包接口，请确认 Mock 服务已启动或网络可用。';
  }
  return message;
}

async function exportView() {
  feedbackMessage.value = '';
  errorMessage.value = '';
  try {
    await ExportsService.exportWalletSummary();
    feedbackMessage.value = '已创建导出任务，请前往导出中心查看。';
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message, '导出失败，请稍后再试。');
  }
}

function drillLedger(item: WalletSummaryListItem) {
  router.push({
    path: '/wallet/ledger',
    query: {
      dimension: filters.dimension,
      entity_id: item.entity_id,
      entity_name: item.entity_name
    }
  });
}

async function fetchOverview() {
  overview.value = await WalletService.getWalletSummaryOverview(
    filters.start || undefined,
    filters.end || undefined,
    filters.dimension,
    undefined,
    undefined,
    filters.status.length ? filters.status : undefined
  );
}

async function fetchSeries(metric: Metric) {
  const response = await WalletService.getWalletSummarySeries(
    filters.start || undefined,
    filters.end || undefined,
    filters.dimension,
    metric
  );
  if (metric === 'balance') balanceSeries.value = response;
  else inOutSeries.value = response;
}

async function fetchList() {
  const response = await WalletService.listWalletSummary(
    filters.start || undefined,
    filters.end || undefined,
    filters.dimension,
    1,
    20,
    filters.status.length ? filters.status : undefined
  );
  list.value = response.items ?? [];
}

async function fetchAll() {
  loading.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    await Promise.all([fetchOverview(), fetchSeries('balance'), fetchSeries('in_out'), fetchList()]);
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message);
  } finally {
    loading.value = false;
  }
}

watch(
  () => [filters.dimension, filters.status.join(',')],
  () => {
    fetchAll();
  }
);

onMounted(() => {
  fetchAll();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.summary {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.summary__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-16;
}

.summary__title {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
}

.summary__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.summary__actions {
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

.btn--tiny {
  padding: $spacing-8 $spacing-12;
  border-color: $color-surface-200;
  background: $color-surface-0;
  color: $color-surface-700;
}

.btn--tiny.is-active {
  border-color: $color-primary-700;
  color: $color-primary-700;
}

.kpis {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 9), 1fr));
}

.kpi-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.kpi-card__label {
  color: $color-surface-500;
}

.kpi-card__value {
  font-size: calc(#{$font-size-16} * 1.4);
  font-weight: $font-weight-semibold;
  color: $color-text-strong;
}

.charts {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 18), 1fr));
}

.chart-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.chart-card__head {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.chart {
  display: flex;
  gap: $spacing-16;
  align-items: flex-end;
  min-height: calc(#{$spacing-16} * 12);
}

.chart__bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-8;
}

.chart__balance,
.chart__inflow,
.chart__outflow {
  width: calc(#{$spacing-16} * 1.2);
  border-radius: $radius-8;
}

.chart__balance {
  background: $color-primary-300;
}

.chart__inflow {
  background: $color-primary-700;
}

.chart__outflow {
  background: $color-surface-300;
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

.link-btn {
  border: none;
  background: transparent;
  color: $color-primary-700;
  cursor: pointer;
  font-weight: $font-weight-medium;
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
