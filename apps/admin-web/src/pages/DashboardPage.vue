<template>
  <section class="dashboard">
    <header class="dashboard__hero">
      <div>
        <h1 class="dashboard__title">{{ t('dashboard.title') }}</h1>
        <p class="dashboard__subtitle">{{ t('dashboard.subtitle') }}</p>
      </div>
      <div class="dashboard__hero-actions">
        <button
          type="button"
          class="dashboard__action"
          @click="refresh"
          :disabled="isLoading"
        >
          {{ t('dashboard.actions.refresh') }}
        </button>
        <button type="button" class="dashboard__action dashboard__action--ghost">
          {{ t('dashboard.actions.export') }}
        </button>
      </div>
    </header>

    <section class="dashboard__alerts" v-if="alerts.length">
      <header class="dashboard__section-head">
        <h2 class="dashboard__section-title">{{ t('dashboard.alertsTitle') }}</h2>
      </header>
      <ul class="dashboard__alert-list">
        <li
          v-for="alert in alerts"
          :key="alert.title"
          class="dashboard__alert-card"
          :data-level="alert.level"
        >
          <div class="dashboard__alert-content">
            <span class="dashboard__alert-title">{{ alert.title }}</span>
            <p v-if="alert.description" class="dashboard__alert-desc">{{ alert.description }}</p>
          </div>
          <a
            v-if="alert.action_link"
            class="dashboard__alert-link"
            :href="alert.action_link"
          >
            {{ t('dashboard.alertsAction') }}
          </a>
        </li>
      </ul>
    </section>

    <form class="dashboard__filters" @submit.prevent>
      <fieldset class="dashboard__filters-group">
        <legend>{{ t('dashboard.filters.groupTitle') }}</legend>
        <div class="dashboard__filters-grid">
          <label class="dashboard__field">
            <span class="dashboard__field-label">{{ t('dashboard.filters.date') }}</span>
            <div class="dashboard__date-range">
              <input
                class="dashboard__input"
                type="date"
                v-model="filters.start"
                @change="markCustomRange"
              />
              <span class="dashboard__date-separator">—</span>
              <input
                class="dashboard__input"
                type="date"
                v-model="filters.end"
                @change="markCustomRange"
              />
            </div>
          </label>

          <label class="dashboard__field">
            <span class="dashboard__field-label">{{ t('dashboard.filters.granularity') }}</span>
            <select class="dashboard__input" v-model="filters.granularity">
              <option
                v-for="option in granularityOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ t(option.label) }}
              </option>
            </select>
          </label>

          <label class="dashboard__field">
            <span class="dashboard__field-label">{{ t('dashboard.filters.company') }}</span>
            <input
              class="dashboard__input"
              type="text"
              v-model="filters.companyId"
              placeholder="ID / 别名"
            />
          </label>

          <label class="dashboard__field">
            <span class="dashboard__field-label">{{ t('dashboard.filters.city') }}</span>
            <input
              class="dashboard__input"
              type="text"
              v-model="filters.city"
              placeholder="City Code"
            />
          </label>

          <label class="dashboard__field">
            <span class="dashboard__field-label">
              {{ t('dashboard.filters.channel') }}
            </span>
            <select class="dashboard__input" multiple v-model="filters.channel">
              <option
                v-for="option in channelOptions"
                :key="option.value"
                :value="option.value"
              >
                {{ option.label }}
              </option>
            </select>
            <span class="dashboard__field-hint">{{ t('dashboard.filters.channelHint') }}</span>
          </label>
        </div>

        <div class="dashboard__quick">
          <span class="dashboard__field-label">{{ t('dashboard.filters.quick') }}</span>
          <div class="dashboard__quick-buttons">
            <button
              v-for="item in quickRangeOptions"
              :key="item.value"
              type="button"
              class="dashboard__quick-btn"
              :class="{ 'is-active': quickRange === item.value }"
              @click="applyQuickRange(item.value)"
            >
              {{ t(item.label) }}
            </button>
            <button
              type="button"
              class="dashboard__quick-btn dashboard__quick-btn--ghost"
              @click="resetFilters"
            >
              {{ t('dashboard.filters.reset') }}
            </button>
          </div>
        </div>
      </fieldset>
    </form>

    <section class="dashboard__kpis" :class="{ 'is-loading': isLoading }">
      <article
        v-for="card in kpiCards"
        :key="card.key"
        class="dashboard__kpi-card"
        @click="drillTo(card.drill_link)"
        role="button"
        tabindex="0"
        @keydown.enter.prevent="drillTo(card.drill_link)"
        @keydown.space.prevent="drillTo(card.drill_link)"
      >
        <header class="dashboard__kpi-header">
          <span class="dashboard__kpi-label">{{ card.label }}</span>
          <span class="dashboard__kpi-trend" :data-trend="card.trend">
            <span v-if="card.trend === 'up'">▲</span>
            <span v-else-if="card.trend === 'down'">▼</span>
            <span v-else>■</span>
          </span>
        </header>
        <div class="dashboard__kpi-value">
          <span class="dashboard__kpi-number">{{ card.formattedValue }}</span>
          <span class="dashboard__kpi-unit">{{ card.unit }}</span>
        </div>
        <p v-if="card.formattedDelta" class="dashboard__kpi-delta">
          {{ card.formattedDelta }}
        </p>
      </article>
      <p v-if="!kpiCards.length && !isLoading" class="dashboard__empty">
        {{ t('dashboard.empty') }}
      </p>
    </section>

    <section class="dashboard__charts" :class="{ 'is-loading': isLoading }">
      <article class="dashboard__chart-card">
        <header class="dashboard__section-head">
          <div>
            <h2 class="dashboard__section-title">{{ t('dashboard.chart.title') }}</h2>
            <p class="dashboard__section-subtitle">
              {{ t('dashboard.chart.metricLabel') }}
            </p>
          </div>
          <div class="dashboard__metric-switch">
            <button
              v-for="metric in metricOptions"
              :key="metric.value"
              type="button"
              class="dashboard__quick-btn"
              :class="{ 'is-active': selectedMetric === metric.value }"
              @click="selectMetric(metric.value)"
            >
              {{ metric.label }}
            </button>
          </div>
        </header>
        <div v-if="chartPoints.length" class="trend-chart" role="img">
          <ul class="trend-chart__list">
            <li v-for="point in chartPoints" :key="point.ts" class="trend-chart__item">
              <div class="trend-chart__bars">
                <span
                  class="trend-chart__value"
                  :style="{ height: valueHeight(point.value) }"
                ></span>
                <span
                  v-if="point.baseline_yesterday !== undefined"
                  class="trend-chart__marker trend-chart__marker--yesterday"
                  :style="{ bottom: valueHeight(point.baseline_yesterday) }"
                  :title="t('dashboard.chart.baselineYesterday')"
                ></span>
                <span
                  v-if="point.baseline_lastweek !== undefined"
                  class="trend-chart__marker trend-chart__marker--lastweek"
                  :style="{ bottom: valueHeight(point.baseline_lastweek) }"
                  :title="t('dashboard.chart.baselineLastWeek')"
                ></span>
              </div>
              <time class="trend-chart__time">{{ formatTick(point.ts) }}</time>
            </li>
          </ul>
        </div>
        <p v-else class="dashboard__empty">{{ t('dashboard.empty') }}</p>
      </article>

      <article class="dashboard__chart-card" v-if="compareMetrics.length">
        <header class="dashboard__section-head">
          <h2 class="dashboard__section-title">{{ t('dashboard.compare.title') }}</h2>
        </header>
        <table class="dashboard__compare-table">
          <thead>
            <tr>
              <th scope="col">{{ t('dashboard.compare.metric') }}</th>
              <th scope="col">{{ t('dashboard.compare.current') }}</th>
              <th scope="col">{{ t('dashboard.compare.previous') }}</th>
              <th scope="col">{{ t('dashboard.compare.change') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="metric in compareMetrics" :key="metric.key">
              <th scope="row">{{ metric.label }}</th>
              <td>{{ formatCompare(metric.current, metric.key) }}</td>
              <td>{{ formatCompare(metric.previous, metric.key) }}</td>
              <td>
                <span class="dashboard__badge" :data-positive="metric.change >= 0">
                  {{ formatDeltaValue(metric) }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </article>
    </section>

    <p v-if="errorMessage" class="dashboard__error" role="alert">
      {{ errorMessage }}
    </p>
    <p v-else-if="isLoading" class="dashboard__loading" aria-live="polite">
      {{ t('dashboard.loading') }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import {
  DashboardService,
  type DashboardAlert,
  type DashboardCompareMetric,
  type DashboardKpi,
  type DashboardSeriesPoint
} from '@/sdk';

type MetricKey = 'orders' | 'gmv' | 'approval_rate';
type QuickRangeKey = 'today' | '7d' | '30d' | 'custom';

const { t } = useI18n();
const router = useRouter();

const quickRange = ref<QuickRangeKey>('today');
const selectedMetric = ref<MetricKey>('orders');

const filters = reactive({
  start: formatDate(new Date()),
  end: formatDate(new Date()),
  granularity: 'd' as 'd' | 'w' | 'm',
  companyId: '',
  city: '',
  channel: [] as Array<'wechat' | 'h5' | 'scan' | 'api'>,
  tz: 'Asia/Shanghai'
});

const isLoading = ref(false);
const errorMessage = ref('');
const overview = ref<{ kpis: DashboardKpi[]; alerts?: DashboardAlert[] } | null>(null);
const series = ref<DashboardSeriesPoint[]>([]);
const compare = ref<DashboardCompareMetric[]>([]);

const granularityOptions = [
  { value: 'd' as const, label: 'dashboard.granularity.d' },
  { value: 'w' as const, label: 'dashboard.granularity.w' },
  { value: 'm' as const, label: 'dashboard.granularity.m' }
];

const quickRangeOptions = [
  { value: 'today' as const, label: 'dashboard.filters.quickToday' },
  { value: '7d' as const, label: 'dashboard.filters.quick7d' },
  { value: '30d' as const, label: 'dashboard.filters.quick30d' }
];

const metricOptions = computed(() => [
  { value: 'orders' as MetricKey, label: t('dashboard.kpi.orders_today') },
  { value: 'gmv' as MetricKey, label: t('dashboard.kpi.settlement_today') },
  { value: 'approval_rate' as MetricKey, label: t('dashboard.kpi.approval_rate') }
]);

const channelOptions = computed(() => [
  { value: 'wechat' as const, label: t('dashboard.channel.wechat') },
  { value: 'h5' as const, label: t('dashboard.channel.h5') },
  { value: 'scan' as const, label: t('dashboard.channel.scan') },
  { value: 'api' as const, label: t('dashboard.channel.api') }
]);

const alerts = computed(() => overview.value?.alerts ?? []);

const kpiCards = computed(() =>
  (overview.value?.kpis ?? []).map((kpi) => ({
    ...kpi,
    label: kpi.label || t(`dashboard.kpi.${kpi.key}`),
    formattedValue: formatValue(kpi),
    formattedDelta: formatKpiDelta(kpi),
    trend: kpi.trend ?? 'flat'
  }))
);

const chartPoints = computed(() => series.value);

const compareMetrics = computed(() => compare.value);

const maxValue = computed(() => {
  if (!chartPoints.value.length) return 1;
  let peak = 1;
  chartPoints.value.forEach((point) => {
    peak = Math.max(
      peak,
      point.value ?? 0,
      point.baseline_yesterday ?? 0,
      point.baseline_lastweek ?? 0
    );
  });
  return peak || 1;
});

const dateRangeValid = computed(() => {
  if (!filters.start || !filters.end) return true;
  return filters.start <= filters.end;
});

let loadTimer: number | undefined;

watch(
  () => [
    filters.start,
    filters.end,
    filters.granularity,
    filters.companyId,
    filters.city,
    filters.channel.join(','),
    filters.tz
  ],
  () => {
    if (dateRangeValid.value) {
      scheduleLoad();
    }
  }
);

watch(selectedMetric, () => {
  if (dateRangeValid.value) {
    scheduleLoad();
  }
});

onMounted(() => {
  scheduleLoad(true);
});

function scheduleLoad(immediate = false) {
  if (loadTimer) {
    window.clearTimeout(loadTimer);
  }
  if (immediate) {
    void loadData();
  } else {
    loadTimer = window.setTimeout(() => {
      void loadData();
    }, 150);
  }
}

async function loadData() {
  if (!dateRangeValid.value) {
    errorMessage.value = t('dashboard.errors.range');
    return;
  }

  isLoading.value = true;
  errorMessage.value = '';
  try {
    const [overviewResp, seriesResp, compareResp] = await Promise.all([
      DashboardService.getDashboardOverview(
        filters.start || undefined,
        filters.end || undefined,
        filters.granularity,
        optional(filters.companyId),
        optional(filters.city),
        filters.channel.length ? filters.channel : undefined,
        filters.tz
      ),
      DashboardService.getDashboardSeries(
        selectedMetric.value,
        filters.start || undefined,
        filters.end || undefined,
        filters.granularity,
        optional(filters.companyId),
        optional(filters.city),
        filters.channel.length ? filters.channel : undefined,
        filters.tz
      ),
      DashboardService.getDashboardCompare(
        filters.start || undefined,
        filters.end || undefined,
        filters.granularity,
        optional(filters.companyId),
        optional(filters.city),
        filters.channel.length ? filters.channel : undefined,
        filters.tz
      )
    ]);
    overview.value = overviewResp;
    series.value = seriesResp.points;
    compare.value = compareResp.metrics;
  } catch (error) {
    console.error(error);
    errorMessage.value = t('dashboard.errors.load');
  } finally {
    isLoading.value = false;
  }
}

function refresh() {
  scheduleLoad(true);
}

function optional(value: string) {
  return value ? value : undefined;
}

function applyQuickRange(range: QuickRangeKey) {
  quickRange.value = range;
  const end = new Date();
  let start = new Date();
  if (range === '7d') {
    start = addDays(end, -6);
  } else if (range === '30d') {
    start = addDays(end, -29);
  }
  filters.start = formatDate(start);
  filters.end = formatDate(end);
}

function resetFilters() {
  filters.granularity = 'd';
  filters.companyId = '';
  filters.city = '';
  filters.channel = [];
  applyQuickRange('today');
}

function markCustomRange() {
  quickRange.value = 'custom';
}

function selectMetric(metric: MetricKey) {
  selectedMetric.value = metric;
}

function drillTo(link: string) {
  if (!link) return;
  if (link.startsWith('http')) {
    window.open(link, '_blank');
  } else {
    router.push(link);
  }
}

function valueHeight(value?: number) {
  if (!value || maxValue.value === 0) return '0%';
  const ratio = Math.max(value / maxValue.value, 0);
  return `${Math.round(ratio * 100)}%`;
}

function formatTick(ts: string) {
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) return ts;
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatCompare(value: number, key: string) {
  if (key === 'gmv') {
    return `${moneyFormatter.format(value)} 元`;
  }
  if (key === 'approval_rate') {
    return `${percentFormatter.format(value * 100)}%`;
  }
  return `${integerFormatter.format(value)} 笔`;
}

function formatDeltaValue(metric: DashboardCompareMetric) {
  const sign = metric.change > 0 ? '+' : metric.change < 0 ? '-' : '';
  const changeMagnitude =
    metric.key === 'gmv'
      ? `${moneyFormatter.format(Math.abs(metric.change))} 元`
      : metric.key === 'approval_rate'
        ? `${percentFormatter.format(Math.abs(metric.change) * 100)}%`
        : `${integerFormatter.format(Math.abs(metric.change))} 笔`;
  const changeText = `${sign}${changeMagnitude}`;
  const rateText = `${percentFormatter.format(metric.change_rate * 100)}%`;
  return `${changeText} (${rateText})`;
}

const moneyFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const percentFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const integerFormatter = new Intl.NumberFormat('zh-CN', {
  maximumFractionDigits: 0
});

function formatValue(kpi: DashboardKpi) {
  if (kpi.unit === '%') {
    return percentFormatter.format(kpi.value);
  }
  if (kpi.unit === '元') {
    return moneyFormatter.format(kpi.value);
  }
  return integerFormatter.format(kpi.value);
}

function formatKpiDelta(kpi: DashboardKpi) {
  if (typeof kpi.delta === 'number') {
    const sign = kpi.delta > 0 ? '+' : kpi.delta < 0 ? '-' : '';
    const magnitude =
      kpi.unit === '元'
        ? moneyFormatter.format(Math.abs(kpi.delta))
        : integerFormatter.format(Math.abs(kpi.delta));
    return `${sign}${magnitude} ${kpi.unit}`;
  }
  if (typeof kpi.delta_rate === 'number') {
    const sign = kpi.delta_rate > 0 ? '+' : '';
    return `${sign}${percentFormatter.format(kpi.delta_rate * 100)}%`;
  }
  return null;
}

function addDays(date: Date, offset: number) {
  const result = new Date(date);
  result.setDate(result.getDate() + offset);
  return result;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.dashboard {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.dashboard__hero {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-24;
}

.dashboard__title {
  margin: 0;
  font-weight: $font-weight-semibold;
  font-size: calc(#{$font-size-16} * 1.5);
  line-height: calc(#{$font-line-height-16} * 1.2);
}

.dashboard__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-16;
  line-height: $font-line-height-16;
}

.dashboard__hero-actions {
  display: flex;
  gap: $spacing-12;
}

.dashboard__action {
  padding: $spacing-8 $spacing-16;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-primary-700;
  background: $color-primary-700;
  color: $color-text-on-primary;
  cursor: pointer;
  font-weight: $font-weight-medium;
}

.dashboard__action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dashboard__action--ghost {
  background: transparent;
  color: $color-primary-700;
}

.dashboard__alerts {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.dashboard__alert-list {
  list-style: none;
  display: grid;
  gap: $spacing-12;
  margin: 0;
  padding: 0;
}

.dashboard__alert-card {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
  padding: $spacing-12;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
}

.dashboard__alert-card[data-level='warn'] {
  border-color: $color-primary-300;
  background: $color-primary-50;
}

.dashboard__alert-card[data-level='error'] {
  border-color: $color-surface-300;
}

.dashboard__alert-content {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.dashboard__alert-title {
  font-weight: $font-weight-semibold;
}

.dashboard__alert-desc {
  margin: 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.dashboard__alert-link {
  align-self: center;
  color: $color-primary-700;
  text-decoration: none;
  font-weight: $font-weight-medium;
}

.dashboard__filters {
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  padding: $spacing-16;
}

.dashboard__filters-group {
  margin: 0;
  border: 0;
  padding: 0;
}

.dashboard__filters-group > legend {
  font-weight: $font-weight-semibold;
  margin-bottom: $spacing-12;
}

.dashboard__filters-grid {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 8), 1fr));
}

.dashboard__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.dashboard__field-label {
  font-weight: $font-weight-medium;
  color: $color-surface-500;
}

.dashboard__input {
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-8 $spacing-12;
  background: $color-surface-0;
  color: $color-text-strong;
}

.dashboard__input:focus {
  outline: $border-width-1 solid $color-primary-700;
}

.dashboard__date-range {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: $spacing-8;
}

.dashboard__date-separator {
  color: $color-surface-500;
}

.dashboard__field-hint {
  font-size: $font-size-12;
  color: $color-surface-500;
}

.dashboard__quick {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-12;
  margin-top: $spacing-16;
  flex-wrap: wrap;
}

.dashboard__quick-buttons {
  display: flex;
  gap: $spacing-8;
  flex-wrap: wrap;
}

.dashboard__quick-btn {
  padding: $spacing-8 $spacing-12;
  border-radius: $radius-8;
  border: $border-width-1 solid transparent;
  background: $color-surface-100;
  color: $color-text-strong;
  cursor: pointer;
}

.dashboard__quick-btn.is-active {
  border-color: $color-primary-700;
  background: $color-primary-50;
  color: $color-primary-700;
}

.dashboard__quick-btn--ghost {
  border-color: $color-surface-200;
  background: transparent;
}

.dashboard__kpis {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 12), 1fr));
  position: relative;
}

.dashboard__kpis.is-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba($color-surface-0, 0.6);
  border-radius: $radius-8;
}

.dashboard__kpi-card {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  padding: $spacing-16;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  cursor: pointer;
}

.dashboard__kpi-card:focus {
  outline: $border-width-1 solid $color-primary-700;
}

.dashboard__kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dashboard__kpi-label {
  font-weight: $font-weight-medium;
  color: $color-surface-500;
}

.dashboard__kpi-trend {
  color: $color-primary-700;
}

.dashboard__kpi-trend[data-trend='down'] {
  color: $color-surface-500;
}

.dashboard__kpi-trend[data-trend='flat'] {
  color: $color-surface-300;
}

.dashboard__kpi-value {
  display: flex;
  align-items: baseline;
  gap: $spacing-8;
}

.dashboard__kpi-number {
  font-size: calc(#{$font-size-16} * 1.75);
  font-weight: $font-weight-semibold;
}

.dashboard__kpi-unit {
  color: $color-surface-500;
}

.dashboard__kpi-delta {
  margin: 0;
  color: $color-surface-500;
  font-size: $font-size-12;
}

.dashboard__empty {
  margin: 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.dashboard__charts {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 16), 1fr));
  position: relative;
}

.dashboard__charts.is-loading::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba($color-surface-0, 0.6);
}

.dashboard__chart-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  padding: $spacing-16;
}

.dashboard__section-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.dashboard__section-title {
  margin: 0;
  font-size: $font-size-16;
  font-weight: $font-weight-semibold;
}

.dashboard__section-subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-12;
}

.dashboard__metric-switch {
  display: flex;
  gap: $spacing-8;
  flex-wrap: wrap;
}

.trend-chart {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  height: calc(#{$spacing-24} * 6);
}

.trend-chart__list {
  display: grid;
  grid-auto-flow: column;
  gap: $spacing-12;
  align-items: end;
  list-style: none;
  margin: 0;
  padding: 0;
}

.trend-chart__item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-8;
}

.trend-chart__bars {
  position: relative;
  display: flex;
  align-items: flex-end;
  width: calc(#{$spacing-16} * 1.25);
  height: 100%;
}

.trend-chart__value {
  width: 100%;
  border-radius: $radius-8;
  background: $color-primary-300;
}

.trend-chart__marker {
  position: absolute;
  left: 0;
  right: 0;
  height: $border-width-1;
  background: $color-surface-500;
  opacity: 0.6;
}

.trend-chart__marker--yesterday {
  background: $color-primary-700;
}

.trend-chart__marker--lastweek {
  background: $color-surface-300;
}

.trend-chart__time {
  font-size: $font-size-12;
  color: $color-surface-500;
}

.dashboard__compare-table {
  width: 100%;
  border-collapse: collapse;
}

.dashboard__compare-table th,
.dashboard__compare-table td {
  text-align: left;
  padding: $spacing-8;
}

.dashboard__compare-table thead {
  background: $color-surface-100;
}

.dashboard__badge {
  display: inline-flex;
  align-items: center;
  padding: $spacing-8 $spacing-12;
  border-radius: $radius-8;
  background: $color-primary-50;
  color: $color-primary-700;
}

.dashboard__badge[data-positive='false'] {
  color: $color-surface-500;
  background: $color-surface-100;
}

.dashboard__error {
  margin: 0;
  padding: $spacing-12;
  border-radius: $radius-8;
  background: $color-surface-300;
  color: $color-surface-700;
}

.dashboard__loading {
  margin: 0;
  color: $color-surface-500;
}

@media (max-width: 60rem) {
  .dashboard__hero {
    flex-direction: column;
  }
}
</style>
