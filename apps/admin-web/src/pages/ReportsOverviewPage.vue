<template>
  <section class="reports-overview">
    <header class="reports-overview__header">
      <div>
        <h1 class="reports-overview__title">报表总览</h1>
        <p class="reports-overview__subtitle">经营与合规关键指标的一站式入口，可下钻与导出。</p>
      </div>
      <div class="reports-overview__actions">
        <Button size="sm" variant="ghost" :disabled="isBusy" @click="refreshAll">刷新</Button>
        <Button size="sm" :loading="status.exporting" @click="exportOverview">导出当前视图</Button>
      </div>
    </header>

    <form class="reports-overview__filters" @submit.prevent="applyFilters">
      <fieldset class="filters__group">
        <legend class="sr-only">筛选条件</legend>
        <div class="filters__grid">
          <label class="filters__field">
            <span>开始日期</span>
            <input type="date" v-model="filters.start" :disabled="isBusy" />
          </label>
          <label class="filters__field">
            <span>结束日期</span>
            <input type="date" v-model="filters.end" :disabled="isBusy" />
          </label>
          <label class="filters__field">
            <span>粒度</span>
            <select v-model="filters.granularity" :disabled="isBusy">
              <option v-for="option in granularityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="filters__field">
            <span>公司</span>
            <input type="text" v-model.trim="filters.companyId" placeholder="公司 ID / 别名" :disabled="isBusy" />
          </label>
          <label class="filters__field">
            <span>城市</span>
            <input type="text" v-model.trim="filters.city" placeholder="城市代码" :disabled="isBusy" />
          </label>
          <label class="filters__field filters__field--stretch">
            <span>渠道</span>
            <select v-model="filters.channel" multiple :disabled="isBusy">
              <option v-for="option in channelOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <small>可多选；为空时表示全部渠道。</small>
          </label>
          <label class="filters__field">
            <span>维度</span>
            <select v-model="filters.dimension" :disabled="isBusy">
              <option v-for="option in dimensionOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
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
              :disabled="isBusy"
              @click="applyQuickRange(item.value)"
            >
              {{ item.label }}
            </button>
          </div>
          <div class="filters__buttons">
            <Button size="sm" type="submit" :loading="isBusy">应用</Button>
            <Button size="sm" variant="ghost" type="button" @click="resetFilters" :disabled="isBusy">重置</Button>
          </div>
        </div>
      </fieldset>
    </form>

    <section class="reports-overview__kpis" :class="{ 'is-loading': status.overview }">
      <div class="kpi-group">
        <header class="kpi-group__head">
          <h2>经营指标</h2>
        </header>
        <div class="kpi-group__grid">
          <article
            v-for="card in businessKpis"
            :key="card.key"
            class="kpi-card"
            role="button"
            tabindex="0"
            @click="drillTo(card.drill_link)"
            @keydown.enter.prevent="drillTo(card.drill_link)"
            @keydown.space.prevent="drillTo(card.drill_link)"
          >
            <header class="kpi-card__header">
              <span class="kpi-card__label">{{ card.label }}</span>
              <span class="kpi-card__trend" :data-trend="card.trend">
                <span v-if="card.trend === 'up'">▲</span>
                <span v-else-if="card.trend === 'down'">▼</span>
                <span v-else>■</span>
              </span>
            </header>
            <div class="kpi-card__value">
              <strong>{{ card.displayValue }}</strong>
              <span>{{ card.unit }}</span>
            </div>
            <p v-if="card.deltaText" class="kpi-card__delta">{{ card.deltaText }}</p>
          </article>
        </div>
      </div>

      <div class="kpi-group">
        <header class="kpi-group__head">
          <h2>合规指标</h2>
        </header>
        <div class="kpi-group__grid">
          <article
            v-for="card in complianceKpis"
            :key="card.key"
            class="kpi-card"
            role="button"
            tabindex="0"
            @click="drillTo(card.drill_link)"
            @keydown.enter.prevent="drillTo(card.drill_link)"
            @keydown.space.prevent="drillTo(card.drill_link)"
          >
            <header class="kpi-card__header">
              <span class="kpi-card__label">{{ card.label }}</span>
              <span class="kpi-card__trend" :data-trend="card.trend">
                <span v-if="card.trend === 'up'">▲</span>
                <span v-else-if="card.trend === 'down'">▼</span>
                <span v-else>■</span>
              </span>
            </header>
            <div class="kpi-card__value">
              <strong>{{ card.displayValue }}</strong>
              <span>{{ card.unit }}</span>
            </div>
            <p v-if="card.deltaText" class="kpi-card__delta">{{ card.deltaText }}</p>
          </article>
        </div>
      </div>
      <p v-if="!businessKpis.length && !complianceKpis.length && !status.overview" class="empty-placeholder">
        暂无指标数据，请调整筛选条件。
      </p>
    </section>

    <section class="reports-overview__analytics">
      <article class="analytics-card">
        <header class="analytics-card__head">
          <div>
            <h2>趋势对比</h2>
            <p>按选择的指标显示时间序列，含昨日与上周基准。</p>
          </div>
          <div class="metric-switch">
            <button
              v-for="option in trendMetricOptions"
              :key="option.value"
              type="button"
              class="metric-switch__btn"
              :class="{ 'is-active': selectedTrendMetric === option.value }"
              @click="selectTrendMetric(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </header>
        <div v-if="trendPoints.length" class="trend-chart" role="img" aria-label="指标趋势图">
          <ul class="trend-chart__list">
            <li v-for="point in trendPoints" :key="point.ts" class="trend-chart__item">
              <div class="trend-chart__bars">
                <span class="trend-chart__value" :style="{ height: valueHeight(point.value) }"></span>
                <span
                  v-if="point.baseline_yesterday !== undefined"
                  class="trend-chart__marker trend-chart__marker--yesterday"
                  :style="{ bottom: valueHeight(point.baseline_yesterday) }"
                  title="昨日同期"
                ></span>
                <span
                  v-if="point.baseline_lastweek !== undefined"
                  class="trend-chart__marker trend-chart__marker--lastweek"
                  :style="{ bottom: valueHeight(point.baseline_lastweek) }"
                  title="上周同期"
                ></span>
              </div>
              <time class="trend-chart__time">{{ formatTick(point.ts) }}</time>
            </li>
          </ul>
        </div>
        <p v-else class="empty-placeholder">暂无趋势数据</p>
      </article>

      <article class="analytics-card">
        <header class="analytics-card__head">
          <div>
            <h2>{{ currentDimensionLabel }}维度对比</h2>
            <p>查看按 {{ currentDimensionLabel }} 聚合的 Top 表现。</p>
          </div>
          <div class="metric-switch">
            <button
              v-for="option in compareMetricOptions"
              :key="option.value"
              type="button"
              class="metric-switch__btn"
              :class="{ 'is-active': selectedCompareMetric === option.value }"
              @click="selectCompareMetric(option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </header>
        <div v-if="compareItems.length" class="compare-chart" role="img" :aria-label="`${currentDimensionLabel}对比`">
          <ol class="compare-chart__list">
            <li v-for="item in compareItems" :key="item.id" class="compare-chart__item">
              <div class="compare-chart__info">
                <span class="compare-chart__name">{{ item.name }}</span>
                <span class="compare-chart__value">{{ formatMetric(item.metric, selectedCompareMetric) }}</span>
              </div>
              <div class="compare-chart__bar-wrapper">
                <span class="compare-chart__bar" :style="{ width: compareWidth(item.metric) }"></span>
              </div>
            </li>
          </ol>
        </div>
        <p v-else class="empty-placeholder">暂无对比数据</p>
      </article>
    </section>

    <section class="reports-overview__reports" v-if="reportCards.length">
      <header class="section-header">
        <h2>常用报表入口</h2>
        <p>快速跳转或下载固定模板报表。</p>
      </header>
      <div class="report-card-grid">
        <article v-for="card in reportCards" :key="card.report_key" class="report-card">
          <header>
            <h3>{{ card.title }}</h3>
            <p>{{ card.desc }}</p>
          </header>
          <footer>
            <Button size="sm" variant="ghost" @click="navigate(card.route)">
              前往查看
            </Button>
          </footer>
        </article>
      </div>
    </section>

    <section class="reports-overview__table">
      <header class="section-header">
        <div>
          <h2>{{ currentDimensionLabel }}明细</h2>
          <p>与当前筛选同步的聚合数据，可点击行下钻。</p>
        </div>
        <Button size="sm" variant="ghost" :disabled="status.table" @click="exportOverview">导出表格</Button>
      </header>
      <Table
        :columns="tableColumns"
        :rows="tableRows"
        :loading="status.table"
        :row-key="(row) => row.id"
        @rowClick="drillTableRow"
      >
        <template #cell:name="{ row }">
          <div class="table-name">
            <strong>{{ row.name }}</strong>
            <span class="table-name__id">{{ row.id }}</span>
          </div>
        </template>
        <template #cell:orders="{ row }">
          {{ formatNumber(row.orders) }}
        </template>
        <template #cell:gmv="{ row }">
          {{ formatCurrency(row.gmv) }}
        </template>
        <template #cell:settlement="{ row }">
          {{ formatCurrency(row.settlement) }}
        </template>
        <template #cell:withdraw="{ row }">
          {{ formatCurrency(row.withdraw) }}
        </template>
        <template #cell:approval_rate="{ row }">
          {{ formatPercent(row.approval_rate) }}
        </template>
        <template #empty>
          {{ status.table ? '加载中…' : '暂无明细数据' }}
        </template>
        <template #pagination>
          <Pagination
            v-if="pageCount > 1"
            :page="table.page"
            :pages="pageCount"
            :page-size="table.pageSize"
            @update:page="changePage"
            @update:pageSize="changePageSize"
          />
        </template>
      </Table>
    </section>

    <p v-if="errorMessage" class="feedback feedback--error" role="alert">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import Pagination from '@/components/Pagination.vue';
import Table from '@/components/Table.vue';
import {
  ReportsService,
  type ReportCard,
  type ReportsCompareItem,
  type ReportsCompareResponse,
  type ReportsFilters,
  type ReportsGranularity,
  type ReportsKpi,
  type ReportsMetric,
  type ReportsOverviewResponse,
  type ReportsSeriesPoint,
  type ReportsSeriesResponse,
  type ReportsTableResponse,
  type ReportsDimension
} from '@/sdk/reports';

type TrendOption = { value: ReportsMetric; label: string };
type DimensionOption = { value: ReportsDimension; label: string };

const router = useRouter();

const today = new Date();
const defaultEnd = formatDate(today);
const defaultStart = formatDate(addDays(today, -6));

const filters = reactive({
  start: defaultStart,
  end: defaultEnd,
  granularity: 'd' as ReportsGranularity,
  companyId: '',
  city: '',
  channel: [] as string[],
  dimension: 'campaign' as ReportsDimension
});

const quickRange = ref<'today' | '7d' | '30d'>('7d');
const selectedTrendMetric = ref<ReportsMetric>('settlement');
const selectedCompareMetric = ref<ReportsMetric>('settlement');

const status = reactive({
  overview: false,
  series: false,
  compare: false,
  table: false,
  exporting: false
});

const overviewData = ref<ReportsOverviewResponse | null>(null);
const seriesData = ref<ReportsSeriesPoint[]>([]);
const compareData = ref<ReportsCompareItem[]>([]);
const reportEntries = ref<ReportCard[]>([]);
const tableData = ref<ReportsTableResponse | null>(null);

const feedbackMessage = ref('');
const errorMessage = ref('');

const table = reactive({
  page: 1,
  pageSize: 20,
  total: 0
});

const granularityOptions: Array<{ value: ReportsGranularity; label: string }> = [
  { value: 'd', label: '按日' },
  { value: 'w', label: '按周' },
  { value: 'm', label: '按月' }
];

const channelOptions = [
  { value: 'wechat', label: '微信' },
  { value: 'h5', label: 'H5' },
  { value: 'app', label: 'APP' },
  { value: 'api', label: 'API' }
];

const dimensionOptions: DimensionOption[] = [
  { value: 'campaign', label: '活动' },
  { value: 'store', label: '门店' },
  { value: 'promoter', label: '推广人' }
];

const quickRanges = [
  { value: 'today' as const, label: '今日' },
  { value: '7d' as const, label: '近 7 天' },
  { value: '30d' as const, label: '近 30 天' }
];

const trendMetricOptions: TrendOption[] = [
  { value: 'orders', label: '订单数' },
  { value: 'gmv', label: 'GMV' },
  { value: 'settlement', label: '结算金额' },
  { value: 'withdraw', label: '提现金额' }
];

const compareMetricOptions: TrendOption[] = [...trendMetricOptions];

const kpiMeta: Record<string, { label: string; unit: string; group: 'biz' | 'compliance'; formatter?: 'percent' | 'amount' | 'number' }> = {
  orders: { label: '订单数', unit: '笔', group: 'biz', formatter: 'number' },
  gmv: { label: 'GMV', unit: '元', group: 'biz', formatter: 'amount' },
  settlement: { label: '结算金额', unit: '元', group: 'biz', formatter: 'amount' },
  withdraw: { label: '提现金额', unit: '元', group: 'biz', formatter: 'amount' },
  avg_order_value: { label: '客单价', unit: '元', group: 'biz', formatter: 'amount' },
  approval_rate: { label: '通过率', unit: '%', group: 'biz', formatter: 'percent' },
  risk_hits: { label: '风控命中', unit: '笔', group: 'compliance', formatter: 'number' },
  ticket_close_rate: { label: '工单关闭率', unit: '%', group: 'compliance', formatter: 'percent' },
  kyc_pass_rate: { label: 'KYC 通过率', unit: '%', group: 'compliance', formatter: 'percent' }
};

const fallbackOverview: ReportsOverviewResponse = {
  kpis: [
    { key: 'orders', value: 1680, delta: 8.5, trend: 'up', unit: '笔', drill_link: '/orders?status=approved' },
    { key: 'gmv', value: 985430.65, delta: 5.2, trend: 'up', unit: '元', drill_link: '/reports/exports?type=gmv' },
    { key: 'settlement', value: 725840.48, delta: -2.8, trend: 'down', unit: '元', drill_link: '/wallet/summary' },
    { key: 'withdraw', value: 254360.1, delta: 3.1, trend: 'up', unit: '元', drill_link: '/withdraws' },
    { key: 'avg_order_value', value: 587.12, delta: -1.4, trend: 'down', unit: '元', drill_link: '/reports/detail/avg-order' },
    { key: 'approval_rate', value: 0.863, delta: 2.1, trend: 'up', unit: '%', drill_link: '/review' },
    { key: 'risk_hits', value: 324, delta: -6.2, trend: 'down', unit: '笔', drill_link: '/risk/hits' },
    { key: 'ticket_close_rate', value: 0.782, delta: 4.6, trend: 'up', unit: '%', drill_link: '/risk/tickets' },
    { key: 'kyc_pass_rate', value: 0.912, delta: 1.8, trend: 'up', unit: '%', drill_link: '/risk/kyc' }
  ],
  reports: [
    {
      report_key: 'sales_daily',
      title: '销售日报',
      desc: '按门店/渠道拆分的销售与结算明细。',
      route: '/exports?type=sales-daily'
    },
    {
      report_key: 'channel_weekly',
      title: '渠道周报',
      desc: '渠道转化、GMV、成本与 ROI 周度表现。',
      route: '/reports/channel-weekly'
    },
    {
      report_key: 'activity_monthly',
      title: '活动效果月报',
      desc: '活动曝光、下单与转化漏斗。',
      route: '/reports/activity-monthly'
    },
    {
      report_key: 'risk_weekly',
      title: '风控周报',
      desc: '命中、工单与处置效率，对比周度表现。',
      route: '/risk/hits'
    },
    {
      report_key: 'finance_reconcile',
      title: '财务对账报表',
      desc: '订单、提现、分账与平台佣金对账。',
      route: '/wallet/ledger'
    }
  ]
};

const fallbackSeries: ReportsSeriesResponse = {
  metric: 'settlement',
  points: [
    { ts: '2025-09-25', value: 68230.12, baseline_yesterday: 70410.32, baseline_lastweek: 65500.98 },
    { ts: '2025-09-26', value: 71540.02, baseline_yesterday: 68230.12, baseline_lastweek: 64820.31 },
    { ts: '2025-09-27', value: 73525.55, baseline_yesterday: 71540.02, baseline_lastweek: 66014.28 },
    { ts: '2025-09-28', value: 70118.43, baseline_yesterday: 73525.55, baseline_lastweek: 67240.03 },
    { ts: '2025-09-29', value: 74890.88, baseline_yesterday: 70118.43, baseline_lastweek: 68110.52 },
    { ts: '2025-09-30', value: 78214.63, baseline_yesterday: 74890.88, baseline_lastweek: 69420.37 },
    { ts: '2025-10-01', value: 82540.97, baseline_yesterday: 78214.63, baseline_lastweek: 71204.66 }
  ]
};

const fallbackCompare: ReportsCompareResponse = {
  dimension: 'campaign',
  metric: 'settlement',
  items: [
    { id: 'CAMP-202509', name: '开学季大促', metric: 189230.45 },
    { id: 'CAMP-202508', name: '社群团购', metric: 146820.32 },
    { id: 'CAMP-202507', name: '门店引流礼卡', metric: 118540.27 },
    { id: 'CAMP-202506', name: '会员节', metric: 102310.11 },
    { id: 'CAMP-202505', name: '暑期早鸟', metric: 89660.58 }
  ]
};

const fallbackTable: ReportsTableResponse = {
  total: 3,
  page: 1,
  page_size: 20,
  items: [
    {
      id: 'S001',
      name: '广州天河一店',
      orders: 420,
      gmv: 228540.34,
      settlement: 182340.12,
      withdraw: 80210.77,
      approval_rate: 0.88
    },
    {
      id: 'S002',
      name: '深圳福田旗舰店',
      orders: 386,
      gmv: 205110.55,
      settlement: 169450.88,
      withdraw: 75640.22,
      approval_rate: 0.91
    },
    {
      id: 'S003',
      name: '上海陆家嘴中心店',
      orders: 362,
      gmv: 196530.21,
      settlement: 158460.43,
      withdraw: 70215.33,
      approval_rate: 0.87
    }
  ]
};

const businessKpis = computed(() => normalizeKpis('biz'));
const complianceKpis = computed(() => normalizeKpis('compliance'));

const trendPoints = computed(() => seriesData.value);

const compareItems = computed(() => compareData.value);

const maxTrend = computed(() => {
  if (!trendPoints.value.length) return 1;
  return Math.max(...trendPoints.value.map((item) => item.value || 0), 1);
});

const maxCompareValue = computed(() => {
  if (!compareItems.value.length) return 1;
  return Math.max(...compareItems.value.map((item) => item.metric || 0), 1);
});

const tableColumns = [
  { key: 'name', title: '名称', width: '16rem' },
  { key: 'orders', title: '订单数', width: '8rem' },
  { key: 'gmv', title: 'GMV', width: '9rem' },
  { key: 'settlement', title: '结算金额', width: '9rem' },
  { key: 'withdraw', title: '提现金额', width: '9rem' },
  { key: 'approval_rate', title: '通过率', width: '7rem' }
];

const tableRows = computed(() => tableData.value?.items ?? []);
const pageCount = computed(() => Math.max(1, Math.ceil((table.total || 0) / table.pageSize)));
const currentDimensionLabel = computed(() => dimensionOptions.find((opt) => opt.value === filters.dimension)?.label ?? '维度');
const isBusy = computed(() => status.overview || status.series || status.compare || status.table || status.exporting);

const reportCards = computed(() => reportEntries.value);

watch(selectedTrendMetric, () => {
  loadSeries();
});

watch(
  () => [filters.dimension, selectedCompareMetric.value],
  () => {
    table.page = 1;
    loadCompare();
    loadTable();
  }
);

onMounted(() => {
  loadAll();
});

function refreshAll() {
  loadAll();
}

function loadAll() {
  loadOverview();
  loadSeries();
  loadCompare();
  loadTable();
}

async function loadOverview() {
  status.overview = true;
  try {
    const response = await ReportsService.overview(baseFilters());
    const kpis = Array.isArray(response?.kpis) && response.kpis.length ? response.kpis : fallbackOverview.kpis;
    overviewData.value = { kpis, reports: response?.reports?.length ? response.reports : fallbackOverview.reports };
    reportEntries.value = overviewData.value.reports ?? [];
  } catch (error) {
    overviewData.value = fallbackOverview;
    reportEntries.value = fallbackOverview.reports ?? [];
    showError((error as Error).message || '加载概览数据失败');
  } finally {
    status.overview = false;
  }
}

async function loadSeries() {
  status.series = true;
  try {
    const response = await ReportsService.series(selectedTrendMetric.value, baseFilters());
    const points = Array.isArray(response?.points) && response.points.length ? response.points : fallbackSeries.points;
    seriesData.value = points;
  } catch (error) {
    seriesData.value = fallbackSeries.points;
    showError((error as Error).message || '加载趋势数据失败');
  } finally {
    status.series = false;
  }
}

async function loadCompare() {
  status.compare = true;
  try {
    const response = await ReportsService.compare(filters.dimension, selectedCompareMetric.value, baseFilters());
    compareData.value = Array.isArray(response?.items) && response.items.length ? response.items : fallbackCompare.items;
  } catch (error) {
    compareData.value = fallbackCompare.items;
    showError((error as Error).message || '加载对比数据失败');
  } finally {
    status.compare = false;
  }
}

async function loadTable() {
  status.table = true;
  try {
    const response = await ReportsService.table({
      ...baseFilters(),
      dimension: filters.dimension,
      metric: selectedCompareMetric.value,
      page: table.page,
      page_size: table.pageSize
    });
    tableData.value = response;
    table.total = typeof response?.total === 'number' ? response.total : fallbackTable.total;
  } catch (error) {
    tableData.value = fallbackTable;
    table.page = fallbackTable.page;
    table.pageSize = fallbackTable.page_size;
    table.total = fallbackTable.total;
    showError((error as Error).message || '加载明细表失败');
  } finally {
    status.table = false;
  }
}

async function exportOverview() {
  if (status.exporting) return;
  status.exporting = true;
  try {
    await ReportsService.exportOverview({
      ...baseFilters(),
      dimension: filters.dimension,
      metric: selectedCompareMetric.value
    });
    showFeedback('导出任务已创建，请前往导出中心查看。');
  } catch (error) {
    showError((error as Error).message || '导出失败，请稍后再试。');
  } finally {
    status.exporting = false;
  }
}

function normalizeKpis(group: 'biz' | 'compliance') {
  const kpis = overviewData.value?.kpis ?? [];
  return kpis
    .map((item) => {
      const meta = kpiMeta[item.key] || { label: item.label ?? item.key, unit: item.unit ?? '', group: 'biz', formatter: 'number' };
      if (meta.group !== group) return null;
      const formatter = meta.formatter ?? 'number';
      const displayValue = formatter === 'percent' ? formatPercent(item.value) : formatter === 'amount' ? formatCurrency(item.value) : formatNumber(item.value);
      const deltaText = typeof item.delta === 'number' ? `${item.delta >= 0 ? '+' : ''}${item.delta.toFixed(1)}%` : '';
      return {
        ...item,
        label: meta.label,
        unit: formatter === 'percent' ? '' : meta.unit,
        displayValue,
        deltaText,
        trend: item.trend ?? (item.delta === undefined ? 'flat' : item.delta >= 0 ? 'up' : 'down')
      };
    })
    .filter(Boolean) as Array<ReportsKpi & { displayValue: string; deltaText: string }>;
}

function selectTrendMetric(metric: ReportsMetric) {
  if (selectedTrendMetric.value === metric) return;
  selectedTrendMetric.value = metric;
}

function selectCompareMetric(metric: ReportsMetric) {
  if (selectedCompareMetric.value === metric) return;
  selectedCompareMetric.value = metric;
}

function applyFilters() {
  table.page = 1;
  loadAll();
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.granularity = 'd';
  filters.companyId = '';
  filters.city = '';
  filters.channel = [];
  filters.dimension = 'campaign';
  selectedTrendMetric.value = 'settlement';
  selectedCompareMetric.value = 'settlement';
  quickRange.value = '7d';
  table.page = 1;
  table.pageSize = 20;
  loadAll();
}

function applyQuickRange(range: typeof quickRange.value) {
  quickRange.value = range;
  if (range === 'today') {
    filters.start = formatDate(today);
    filters.end = formatDate(today);
  } else if (range === '7d') {
    filters.start = formatDate(addDays(today, -6));
    filters.end = formatDate(today);
  } else {
    filters.start = formatDate(addDays(today, -29));
    filters.end = formatDate(today);
  }
  table.page = 1;
  loadAll();
}

function baseFilters(): ReportsFilters {
  return {
    start: filters.start,
    end: filters.end,
    granularity: filters.granularity,
    company_id: filters.companyId || undefined,
    city: filters.city || undefined,
    channel: filters.channel.length ? filters.channel : undefined
  };
}

function changePage(page: number) {
  table.page = page;
  loadTable();
}

function changePageSize(size: number) {
  table.pageSize = size;
  table.page = 1;
  loadTable();
}

function valueHeight(value?: number) {
  if (!value || !Number.isFinite(value)) return '0%';
  return `${Math.min(100, Math.max(2, (value / maxTrend.value) * 100))}%`;
}

function compareWidth(value?: number) {
  if (!value || !Number.isFinite(value)) return '0%';
  return `${Math.min(100, Math.max(4, (value / maxCompareValue.value) * 100))}%`;
}

function drillTo(link?: string) {
  if (!link) return;
  if (link.startsWith('http')) {
    window.open(link, '_blank', 'noopener');
    return;
  }
  router.push(link);
}

function drillTableRow(row: { id: string; name: string }) {
  const params = new URLSearchParams({
    dimension: filters.dimension,
    id: row.id,
    start: filters.start,
    end: filters.end
  });
  router.push(`/reports/detail?${params.toString()}`);
}

function navigate(path?: string) {
  if (!path) return;
  drillTo(path);
}

function showFeedback(message: string) {
  feedbackMessage.value = message;
  errorMessage.value = '';
  window.setTimeout(() => {
    if (feedbackMessage.value === message) feedbackMessage.value = '';
  }, 3000);
}

function showError(message: string) {
  errorMessage.value = message;
  window.setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = '';
  }, 4000);
}

function formatTick(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getMonth() + 1}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatNumber(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 0 }).format(value);
}

function formatCurrency(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return new Intl.NumberFormat('zh-CN', {
    style: 'currency',
    currency: 'CNY',
    maximumFractionDigits: 2
  }).format(value);
}

function formatPercent(value?: number | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${(value * 100).toFixed(1)}%`;
}

function formatMetric(value: number, metric: ReportsMetric) {
  if (metric === 'orders') return formatNumber(value);
  if (metric === 'gmv' || metric === 'settlement' || metric === 'withdraw') return formatCurrency(value);
  return formatNumber(value);
}

function addDays(date: Date, diff: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + diff);
  return next;
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

.reports-overview {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $text-strong;
}

.reports-overview__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.reports-overview__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.reports-overview__subtitle {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.reports-overview__actions {
  display: flex;
  gap: $spacing-12;
}

.reports-overview__filters {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20 $spacing-24;
  box-shadow: 0 14px 34px rgba($color-surface-700, 0.08);
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

  small {
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }

  &--stretch select {
    min-height: calc(#{$control-height} * 1.4);
  }
}

.filters__actions {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
  align-items: center;
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
  transition: $transition-fast;

  &.is-active {
    background: $primary-100;
    color: $primary-700;
    font-weight: $text-12-medium-wt;
  }
}

.reports-overview__kpis {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(20rem, 1fr));
  gap: $spacing-16;
  position: relative;

  &.is-loading::after {
    content: '加载中…';
    position: absolute;
    inset: 0;
    background: rgba($surface-0, 0.6);
    display: grid;
    place-items: center;
    font-size: $text-12-medium-fs;
    color: $text-muted;
    border-radius: $radius-xl;
  }
}

.kpi-group {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20;
  box-shadow: 0 16px 40px rgba($color-surface-700, 0.08);
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.kpi-group__head {
  margin: 0;

  h2 {
    margin: 0;
    font-size: $text-12-medium-fs;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: $text-muted;
  }
}

.kpi-group__grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
}

.kpi-card {
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  padding: $spacing-16;
  background: $surface-50;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  cursor: pointer;
  transition: $transition-fast;

  &:hover {
    border-color: $primary-200;
    box-shadow: 0 10px 28px rgba($color-surface-700, 0.08);
  }
}

.kpi-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-12;
}

.kpi-card__label {
  font-size: $text-12-medium-fs;
  color: $text-muted;
}

.kpi-card__trend {
  font-size: $text-12-medium-fs;
  &[data-trend='up'] {
    color: $primary-700;
  }
  &[data-trend='down'] {
    color: $danger-600;
  }
  &[data-trend='flat'] {
    color: $text-muted;
  }
}

.kpi-card__value {
  display: flex;
  align-items: baseline;
  gap: $spacing-8;

  strong {
    font-size: $text-16-semibold-fs;
    line-height: $text-16-semibold-lh;
    font-weight: $text-16-semibold-wt;
  }

  span {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.kpi-card__delta {
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.reports-overview__analytics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(28rem, 1fr));
  gap: $spacing-16;
}

.analytics-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.analytics-card__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-12;

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

.metric-switch {
  display: inline-flex;
  gap: $spacing-8;
}

.metric-switch__btn {
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

.trend-chart {
  display: flex;
  flex-direction: column;
}

.trend-chart__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(2.5rem, 1fr));
  gap: $spacing-12;
  align-items: end;
}

.trend-chart__item {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  align-items: center;
}

.trend-chart__bars {
  position: relative;
  width: 100%;
  min-height: 6rem;
  background: $surface-100;
  border-radius: $radius-lg;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: $spacing-8;
}

.trend-chart__value {
  display: block;
  width: 40%;
  background: $primary-200;
  border-radius: $radius-lg;
}

.trend-chart__marker {
  position: absolute;
  left: 12%;
  width: 76%;
  height: 2px;
  border-radius: $radius-lg;
  background: $text-muted;
}

.trend-chart__marker--yesterday {
  background: rgba($primary-700, 0.6);
}

.trend-chart__marker--lastweek {
  background: rgba($danger-600, 0.6);
}

.trend-chart__time {
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.compare-chart__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.compare-chart__item {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
}

.compare-chart__info {
  display: flex;
  justify-content: space-between;
  font-size: $text-12-medium-fs;
  color: $text-muted;
}

.compare-chart__name {
  font-weight: $text-12-medium-wt;
  color: $text-strong;
}

.compare-chart__bar-wrapper {
  background: $surface-100;
  border-radius: $radius-lg;
  overflow: hidden;
  height: 0.75rem;
}

.compare-chart__bar {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, $primary-300, $primary-700);
}

.reports-overview__reports {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-12;
  margin-bottom: $spacing-16;

  h2 {
    margin: 0;
    font-size: $text-16-semibold-fs;
  }

  p {
    margin: 0;
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.report-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: $spacing-12;
}

.report-card {
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  padding: $spacing-16;
  background: $surface-50;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;

  h3 {
    margin: 0 0 $spacing-8;
    font-size: $text-14-regular-fs;
    font-weight: $text-16-semibold-wt;
  }

  p {
    margin: 0;
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }

  footer {
    display: flex;
    justify-content: flex-end;
  }
}

.reports-overview__table {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20;
  box-shadow: 0 20px 56px rgba($color-surface-700, 0.12);
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.table-name {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 4);
}

.table-name__id {
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  font-size: $text-12-regular-fs;
  background: rgba($primary-100, 0.6);
  color: $primary-700;

  &.feedback--error {
    background: rgba($danger-600, 0.12);
    color: $danger-700;
  }
}

.empty-placeholder {
  margin: 0;
  text-align: center;
  font-size: $text-12-regular-fs;
  color: $text-muted;
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

@media (max-width: 80rem) {
  .reports-overview__analytics {
    grid-template-columns: 1fr;
  }

  .reports-overview__kpis {
    grid-template-columns: 1fr;
  }
}
</style>
