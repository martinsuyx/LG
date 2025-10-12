<template>
  <section class="exports-center">
    <header class="exports-center__header">
      <div>
        <h1 class="exports-center__title">导出中心</h1>
        <p class="exports-center__subtitle">管理异步导出任务，追踪进度并下载结果。</p>
      </div>
      <div class="exports-center__actions">
        <Button size="sm" variant="ghost" :disabled="loading.list" @click="loadJobs">刷新</Button>
        <Button size="sm" variant="secondary" :loading="loading.deleteExpired" @click="deleteExpiredJobs">
          删除已过期
        </Button>
      </div>
    </header>

    <section class="exports-center__stats">
      <article class="stats-card">
        <span class="stats-card__label">今日发起</span>
        <strong class="stats-card__value">{{ summary.today }}</strong>
      </article>
      <article class="stats-card">
        <span class="stats-card__label">已完成</span>
        <strong class="stats-card__value">{{ summary.ready }}</strong>
      </article>
      <article class="stats-card">
        <span class="stats-card__label">失败</span>
        <strong class="stats-card__value">{{ summary.failed }}</strong>
      </article>
      <article class="stats-card">
        <span class="stats-card__label">平均耗时</span>
        <strong class="stats-card__value">{{ summary.avgDuration }}</strong>
      </article>
    </section>

    <form class="exports-center__filters" @submit.prevent="applyFilters">
      <fieldset class="filters__group">
        <legend class="sr-only">筛选导出任务</legend>
        <div class="filters__grid">
          <label class="filters__field">
            <span>开始日期</span>
            <input type="date" v-model="filters.start" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>结束日期</span>
            <input type="date" v-model="filters.end" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>状态</span>
            <select v-model="filters.status" :disabled="loading.list">
              <option value="">全部</option>
              <option v-for="option in statusOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="filters__field">
            <span>类型</span>
            <select v-model="filters.type" :disabled="loading.list">
              <option value="">全部</option>
              <option v-for="option in typeOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <label class="filters__field">
            <span>发起人</span>
            <input type="text" v-model.trim="filters.createdBy" placeholder="用户 ID" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>来源</span>
            <input type="text" v-model.trim="filters.source" placeholder="/orders" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>文件类型</span>
            <select v-model="filters.fileType" :disabled="loading.list">
              <option value="">全部</option>
              <option value="csv">CSV</option>
              <option value="xlsx">XLSX</option>
              <option value="json">JSON</option>
              <option value="parquet">Parquet</option>
            </select>
          </label>
          <label class="filters__field">
            <span>最小大小(MB)</span>
            <input type="number" min="0" v-model.number="filters.minSize" :disabled="loading.list" />
          </label>
          <label class="filters__field">
            <span>最大大小(MB)</span>
            <input type="number" min="0" v-model.number="filters.maxSize" :disabled="loading.list" />
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

    <section class="exports-center__content">
      <Table
        :columns="columns"
        :rows="jobs"
        :loading="loading.list"
        :row-key="(row) => row.job_id"
        default-sort-key="created_at"
        default-sort-order="desc"
      >
        <template #cell:status="{ row }">
          <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
        </template>
        <template #cell:progress="{ row }">
          <div class="progress">
            <div class="progress__bar" :style="{ width: `${row.progress}%` }" />
            <span>{{ row.progress }}%</span>
          </div>
        </template>
        <template #cell:file="{ row }">
          <div class="file-cell">
            <strong>{{ row.file_name || '—' }}</strong>
            <span v-if="row.file_size" class="file-cell__meta">{{ formatSize(row.file_size) }}</span>
            <span v-if="row.expires_at" class="file-cell__meta">过期：{{ formatDateTime(row.expires_at) }}</span>
          </div>
        </template>
        <template #cell:created_at="{ row }">{{ formatDateTime(row.created_at) }}</template>
        <template #cell:finished_at="{ row }">{{ row.finished_at ? formatDateTime(row.finished_at) : '—' }}</template>
        <template #cell:actions="{ row }">
          <div class="row-actions">
            <button type="button" class="link-btn" @click="openDetail(row)">详情</button>
            <button
              type="button"
              class="link-btn"
              :disabled="!canDownload(row)"
              @click="downloadJob(row)"
              :title="downloadTooltip(row)"
            >
              下载
            </button>
            <button type="button" class="link-btn" :disabled="!canRetry(row)" @click="retryJob(row)">重试</button>
            <button type="button" class="link-btn" :disabled="!canCancel(row)" @click="cancelJob(row)">取消</button>
          </div>
        </template>
        <template #empty>
          {{ loading.list ? '加载任务中…' : '暂无导出任务，尝试调整筛选条件。' }}
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

    <aside class="job-drawer" v-if="drawer.open">
      <header class="job-drawer__header">
        <div>
          <h2>任务 {{ activeJob?.job_id }}</h2>
          <p>{{ statusLabel(activeJob?.status || 'queued') }} · {{ formatDateTime(activeJob?.created_at || '') }}</p>
        </div>
        <button class="job-drawer__close" type="button" aria-label="关闭详情" @click="closeDrawer">×</button>
      </header>
      <div class="job-drawer__body" v-if="loading.detail">
        <p class="job-drawer__placeholder">详情加载中…</p>
      </div>
      <div class="job-drawer__body" v-else-if="activeJob">
        <section class="drawer-section">
          <h3>任务信息</h3>
          <dl class="drawer-grid">
            <div>
              <dt>类型</dt>
              <dd>{{ typeLabel(activeJob.type) }}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd><span class="status-chip" :data-status="activeJob.status">{{ statusLabel(activeJob.status) }}</span></dd>
            </div>
            <div>
              <dt>进度</dt>
              <dd>{{ activeJob.progress }}%</dd>
            </div>
            <div>
              <dt>发起人</dt>
              <dd>{{ activeJob.created_by }}</dd>
            </div>
            <div>
              <dt>来源</dt>
              <dd>{{ activeJob.source || '—' }}</dd>
            </div>
            <div>
              <dt>完成时间</dt>
              <dd>{{ activeJob.finished_at ? formatDateTime(activeJob.finished_at) : '—' }}</dd>
            </div>
            <div>
              <dt>文件</dt>
              <dd>{{ activeJob.file_name || '—' }}</dd>
            </div>
            <div>
              <dt>大小</dt>
              <dd>{{ activeJob.file_size ? formatSize(activeJob.file_size) : '—' }}</dd>
            </div>
          </dl>
          <div class="drawer-buttons">
            <Button size="sm" variant="primary" :disabled="!canDownload(activeJob)" @click="downloadJob(activeJob)">
              下载文件
            </Button>
            <Button size="sm" variant="secondary" :disabled="!activeJob.download_url" @click="copyLink(activeJob)">
              复制下载链接
            </Button>
            <Button size="sm" variant="secondary" :disabled="!activeJob.download_url" @click="copyCurl(activeJob)">
              复制 cURL
            </Button>
          </div>
        </section>

        <section class="drawer-section">
          <h3>筛选参数</h3>
          <pre class="drawer-pre">{{ formatParams(activeJob.params) }}</pre>
        </section>

        <section class="drawer-section" v-if="activeJob.logs_tail">
          <h3>日志</h3>
          <pre class="drawer-pre logs">{{ activeJob.logs_tail }}</pre>
        </section>

        <section class="drawer-section" v-if="activeJob.error">
          <h3>错误信息</h3>
          <p class="drawer-error">
            {{ activeJob.error.code || 'FAILED' }} · {{ activeJob.error.message || '无详细信息' }}
          </p>
        </section>

        <section class="drawer-section" v-if="activeJob.downloads?.length">
          <h3>下载记录</h3>
          <ul class="downloads">
            <li v-for="item in activeJob.downloads" :key="item.time">
              <span>{{ formatDateTime(item.time) }}</span>
              <span>{{ item.actor }}</span>
              <span>{{ item.channel || '-' }}</span>
              <span>{{ item.ip || '-' }}</span>
            </li>
          </ul>
        </section>
      </div>
      <div class="job-drawer__body" v-else>
        <p class="job-drawer__placeholder">未找到任务详情。</p>
      </div>
    </aside>

    <p v-if="feedback.message" :class="['feedback', feedback.error ? 'feedback--error' : '']" role="alert">
      {{ feedback.message }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import Pagination from '@/components/Pagination.vue';
import Table from '@/components/Table.vue';
import {
  ExportJobsService,
  type ExportFilters,
  type ExportJob,
  type ExportJobStatus,
  type ExportJobType,
  type ExportListResponse
} from '@/sdk/exports';

const now = new Date();
const defaultEnd = formatDate(now);
const defaultStart = formatDate(addDays(now, -6));

const filters = reactive({
  start: defaultStart,
  end: defaultEnd,
  status: '' as ExportJobStatus | '',
  type: '' as ExportJobType | '',
  createdBy: '',
  source: '',
  fileType: '',
  minSize: undefined as number | undefined,
  maxSize: undefined as number | undefined,
  page: 1,
  pageSize: 20
});

const loading = reactive({
  list: false,
  detail: false,
  retry: false,
  cancel: false,
  deleteExpired: false
});

const jobs = ref<ExportJob[]>([]);
const total = ref(0);
const drawer = reactive({ open: false, jobId: '' });
const activeJob = ref<ExportJob | null>(null);
const feedback = reactive<{ message: string; error: boolean }>({ message: '', error: false });

const quickRanges = [
  { value: 'today' as const, label: '今日' },
  { value: '7d' as const, label: '近 7 天' },
  { value: '30d' as const, label: '近 30 天' }
];
const quickRange = ref<'today' | '7d' | '30d'>('7d');

const statusOptions = [
  { value: 'queued', label: '排队中' },
  { value: 'processing', label: '进行中' },
  { value: 'ready', label: '已完成' },
  { value: 'failed', label: '失败' },
  { value: 'canceled', label: '已取消' },
  { value: 'expired', label: '已过期' }
];

const typeOptions = [
  { value: 'orders', label: '订单明细' },
  { value: 'wallet_ledger', label: '钱包流水' },
  { value: 'wallet_summary', label: '钱包汇总' },
  { value: 'withdraws', label: '提现' },
  { value: 'campaigns', label: '营销活动' },
  { value: 'tasks', label: '任务列表' },
  { value: 'teams', label: '团队' },
  { value: 'members', label: '成员' },
  { value: 'users', label: '用户' },
  { value: 'roles', label: '角色' },
  { value: 'risk_hits', label: '风控命中' },
  { value: 'risk_tickets', label: '风控工单' },
  { value: 'risk_lists', label: '名单导出' },
  { value: 'risk_rules', label: '规则配置' },
  { value: 'kyc_cases', label: 'KYC 案件' },
  { value: 'reports_custom', label: '自定义报表' }
];

const columns = [
  { key: 'job_id', title: '任务号', width: '10rem' },
  { key: 'type', title: '类型', width: '8rem' },
  { key: 'status', title: '状态', width: '7rem' },
  { key: 'progress', title: '进度', width: '8rem' },
  { key: 'file', title: '文件信息', width: '16rem' },
  { key: 'created_by', title: '发起人', width: '8rem' },
  { key: 'created_at', title: '创建时间', width: '12rem' },
  { key: 'finished_at', title: '完成时间', width: '12rem' },
  { key: 'source', title: '来源', width: '10rem' },
  { key: 'actions', title: '操作', width: '12rem' }
];

const fallbackList: ExportListResponse = {
  total: 5,
  page: 1,
  page_size: 20,
  items: [
    {
      job_id: 'E20251003001',
      type: 'orders',
      status: 'processing',
      progress: 65,
      file_name: null,
      file_type: 'csv',
      file_size: null,
      download_url: null,
      expires_at: null,
      params: { start: '2025-09-01', end: '2025-09-30', status: 'approved' },
      created_by: 'U1001',
      created_at: '2025-10-03T10:00:00+08:00',
      finished_at: null,
      source: '/orders',
      retry_of: null,
      error: null
    },
    {
      job_id: 'E20251003002',
      type: 'wallet_ledger',
      status: 'ready',
      progress: 100,
      file_name: 'wallet_ledger_202509.csv',
      file_type: 'csv',
      file_size: 10_485_760,
      download_url: 'https://mock/exports/E20251003002?sig=ready',
      expires_at: '2025-10-04T10:00:00+08:00',
      params: { start: '2025-09-01', end: '2025-09-30', dimension: 'store' },
      created_by: 'U2001',
      created_at: '2025-10-03T09:30:00+08:00',
      finished_at: '2025-10-03T09:45:12+08:00',
      source: '/wallet/ledger',
      retry_of: null,
      error: null
    },
    {
      job_id: 'E20251003003',
      type: 'risk_hits',
      status: 'failed',
      progress: 80,
      file_name: null,
      file_type: 'csv',
      file_size: null,
      download_url: null,
      expires_at: null,
      params: { start: '2025-09-28', end: '2025-10-03' },
      created_by: 'U3001',
      created_at: '2025-10-03T08:00:00+08:00',
      finished_at: '2025-10-03T08:20:00+08:00',
      source: '/risk/hits',
      retry_of: null,
      error: { code: 'EXPORT_TIMEOUT', message: 'Job exceeded 20m limit' }
    },
    {
      job_id: 'E20251003004',
      type: 'reports_custom',
      status: 'queued',
      progress: 5,
      file_name: null,
      file_type: 'xlsx',
      file_size: null,
      download_url: null,
      expires_at: null,
      params: { preset: 'channel_weekly', period: '2025-W39' },
      created_by: 'U1002',
      created_at: '2025-10-03T10:30:00+08:00',
      finished_at: null,
      source: '/reports/overview',
      retry_of: null,
      error: null
    },
    {
      job_id: 'E20251002011',
      type: 'withdraws',
      status: 'expired',
      progress: 100,
      file_name: 'withdraws_20250925.csv',
      file_type: 'csv',
      file_size: 5_242_880,
      download_url: null,
      expires_at: '2025-10-02T22:00:00+08:00',
      params: { start: '2025-09-25', end: '2025-09-25' },
      created_by: 'U2002',
      created_at: '2025-10-02T20:15:00+08:00',
      finished_at: '2025-10-02T20:35:00+08:00',
      source: '/withdraws',
      retry_of: null,
      error: null
    }
  ]
};

const fallbackReady = {
  job_id: 'E20251003002',
  type: 'wallet_ledger' as const,
  status: 'ready' as ExportJobStatus,
  progress: 100,
  file_name: 'wallet_ledger_202509.csv',
  file_type: 'csv',
  file_size: 10_485_760,
  download_url: 'https://mock/exports/E20251003002?sig=ready',
  expires_at: '2025-10-04T10:00:00+08:00',
  params: { start: '2025-09-01', end: '2025-09-30', dimension: 'store' },
  created_by: 'U2001',
  created_at: '2025-10-03T09:30:00+08:00',
  finished_at: '2025-10-03T09:45:12+08:00',
  source: '/wallet/ledger',
  retry_of: null,
  error: null,
  logs_tail: '2025-10-03 09:30:01 queued\n2025-10-03 09:30:05 pulling data...\n2025-10-03 09:36:12 writing csv chunk 5/5\n2025-10-03 09:37:01 uploading to storage\n2025-10-03 09:45:12 job completed.',
  downloads: [
    { time: '2025-10-03T09:50:00+08:00', actor: 'U2001', channel: 'web', ip: '10.10.1.8' }
  ]
} satisfies ExportJob;

const fallbackFailed = {
  job_id: 'E20251003003',
  type: 'risk_hits' as const,
  status: 'failed' as ExportJobStatus,
  progress: 80,
  file_name: null,
  file_type: 'csv',
  file_size: null,
  download_url: null,
  expires_at: null,
  params: { start: '2025-09-28', end: '2025-10-03' },
  created_by: 'U3001',
  created_at: '2025-10-03T08:00:00+08:00',
  finished_at: '2025-10-03T08:20:00+08:00',
  source: '/risk/hits',
  retry_of: null,
  error: { code: 'EXPORT_TIMEOUT', message: 'Job exceeded 20m limit' },
  logs_tail: '2025-10-03 08:00:00 queued\n2025-10-03 08:02:12 processing rules hit data…\n2025-10-03 08:16:40 uploading chunk 7/10\n2025-10-03 08:20:00 timeout reached, aborting job\n2025-10-03 08:20:01 job marked as failed',
  downloads: []
} satisfies ExportJob;

const pollingId = ref<number | null>(null);

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.pageSize)));
const summary = computed(() => summarize(jobs.value));

const userRoles = ['admin'];

onMounted(() => {
  loadJobs();
  startPolling();
});

onBeforeUnmount(() => {
  stopPolling();
});

function applyFilters() {
  filters.page = 1;
  loadJobs();
}

function resetFilters() {
  filters.start = defaultStart;
  filters.end = defaultEnd;
  filters.status = '';
  filters.type = '';
  filters.createdBy = '';
  filters.source = '';
  filters.fileType = '';
  filters.minSize = undefined;
  filters.maxSize = undefined;
  filters.page = 1;
  filters.pageSize = 20;
  quickRange.value = '7d';
  loadJobs();
}

function applyQuickRange(range: typeof quickRange.value) {
  quickRange.value = range;
  if (range === 'today') {
    filters.start = formatDate(now);
    filters.end = formatDate(now);
  } else if (range === '7d') {
    filters.start = formatDate(addDays(now, -6));
    filters.end = formatDate(now);
  } else {
    filters.start = formatDate(addDays(now, -29));
    filters.end = formatDate(now);
  }
  filters.page = 1;
  loadJobs();
}

function changePage(page: number) {
  filters.page = page;
  loadJobs(false);
}

function changePageSize(size: number) {
  filters.pageSize = size;
  filters.page = 1;
  loadJobs(false);
}

async function loadJobs(showFeedback = true) {
  loading.list = true;
  try {
    const response = await ExportJobsService.list(buildFilterPayload());
    const list = response && Array.isArray(response.items) && response.items.length ? response : fallbackList;
    jobs.value = list.items;
    total.value = typeof list.total === 'number' ? list.total : list.items.length;
    if (showFeedback) setFeedback('导出任务已刷新。', false);
  } catch (error) {
    jobs.value = fallbackList.items;
    total.value = fallbackList.total;
    setFeedback((error as Error).message || '加载导出任务失败，已展示示例数据。', true);
  } finally {
    loading.list = false;
  }
}

async function loadDetail(jobId: string) {
  loading.detail = true;
  try {
    const detail = await ExportJobsService.get(jobId);
    activeJob.value = detail ?? fallbackForJob(jobId);
  } catch (error) {
    activeJob.value = fallbackForJob(jobId);
    setFeedback((error as Error).message || '获取任务详情失败，展示示例数据。', true);
  } finally {
    loading.detail = false;
  }
}

function fallbackForJob(jobId: string): ExportJob {
  if (jobId === 'E20251003003') return fallbackFailed;
  if (jobId === 'E20251003002') return fallbackReady;
  const fromList = fallbackList.items.find((item) => item.job_id === jobId);
  return { ...(fromList || fallbackList.items[0]) };
}

function openDetail(job: ExportJob) {
  drawer.open = true;
  drawer.jobId = job.job_id;
  activeJob.value = job;
  loadDetail(job.job_id);
}

function closeDrawer() {
  drawer.open = false;
  drawer.jobId = '';
  activeJob.value = null;
}

function canDownload(job: ExportJob | null) {
  if (!job || !job.download_url || job.status !== 'ready') return false;
  if (!job.file_type) return true;
  if (['wallet_ledger', 'wallet_summary', 'withdraws', 'orders'].includes(job.type)) {
    return userRoles.includes('admin') || userRoles.includes('finance');
  }
  return true;
}

function downloadTooltip(job: ExportJob) {
  if (canDownload(job)) return '下载文件';
  if (!job.download_url) return '文件尚未生成或已过期';
  return '权限不足，联系管理员开通';
}

function downloadJob(job: ExportJob | null) {
  if (!job || !canDownload(job) || !job.download_url) return;
  window.open(job.download_url, '_blank', 'noopener');
  setFeedback('已打开下载链接。', false);
}

async function retryJob(job: ExportJob) {
  if (!canRetry(job)) return;
  loading.retry = true;
  try {
    const response = await ExportJobsService.retry(job.job_id);
    setFeedback(`已重新排队任务，新的任务号：${response?.new_job_id || '未知'}`, false);
    loadJobs(false);
  } catch (error) {
    setFeedback((error as Error).message || '重试失败，请稍后重试。', true);
  } finally {
    loading.retry = false;
  }
}

async function cancelJob(job: ExportJob) {
  if (!canCancel(job)) return;
  if (!window.confirm(`确认取消任务 ${job.job_id} 吗？`)) return;
  loading.cancel = true;
  try {
    await ExportJobsService.cancel(job.job_id);
    setFeedback('任务已取消。', false);
    loadJobs(false);
    if (drawer.open && drawer.jobId === job.job_id) {
      loadDetail(job.job_id);
    }
  } catch (error) {
    setFeedback((error as Error).message || '取消任务失败。', true);
  } finally {
    loading.cancel = false;
  }
}

async function deleteExpiredJobs() {
  if (!window.confirm('确认删除所有已过期的导出任务记录？')) return;
  loading.deleteExpired = true;
  try {
    const response = await ExportJobsService.deleteExpired();
    const count = typeof response?.deleted === 'number' ? response.deleted : 0;
    setFeedback(`已删除 ${count} 条过期任务。`, false);
    loadJobs(false);
  } catch (error) {
    setFeedback((error as Error).message || '删除过期任务失败。', true);
  } finally {
    loading.deleteExpired = false;
  }
}

function canRetry(job: ExportJob) {
  return ['failed', 'expired', 'canceled', 'ready'].includes(job.status);
}

function canCancel(job: ExportJob) {
  return ['queued', 'processing'].includes(job.status);
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

function startPolling() {
  stopPolling();
  pollingId.value = window.setInterval(() => {
    const hasActive = jobs.value.some((job) => job.status === 'queued' || job.status === 'processing');
    if (hasActive) loadJobs(false);
  }, 5000);
}

function stopPolling() {
  if (pollingId.value) {
    window.clearInterval(pollingId.value);
    pollingId.value = null;
  }
}

function buildFilterPayload(): ExportFilters {
  return {
    start: filters.start,
    end: filters.end,
    status: filters.status || undefined,
    type: filters.type || undefined,
    created_by: filters.createdBy || undefined,
    source: filters.source || undefined,
    file_type: filters.fileType || undefined,
    min_size: filters.minSize ? filters.minSize * 1024 * 1024 : undefined,
    max_size: filters.maxSize ? filters.maxSize * 1024 * 1024 : undefined,
    page: filters.page,
    page_size: filters.pageSize
  };
}

function summarize(list: ExportJob[]) {
  const todayStr = formatDate(now);
  let today = 0;
  let ready = 0;
  let failed = 0;
  let durationSum = 0;
  let durationCount = 0;
  list.forEach((item) => {
    if (item.created_at && item.created_at.startsWith(todayStr)) today += 1;
    if (item.status === 'ready') ready += 1;
    if (item.status === 'failed') failed += 1;
    if (item.created_at && item.finished_at) {
      const duration = differenceInMinutes(item.created_at, item.finished_at);
      if (duration >= 0) {
        durationSum += duration;
        durationCount += 1;
      }
    }
  });
  const avg = durationCount ? `${Math.round((durationSum / durationCount) * 10) / 10} 分钟` : '—';
  return { today, ready, failed, avgDuration: avg };
}

function statusLabel(status: ExportJobStatus) {
  const map: Record<ExportJobStatus, string> = {
    queued: '排队中',
    processing: '进行中',
    ready: '已完成',
    failed: '失败',
    canceled: '已取消',
    expired: '已过期'
  };
  return map[status] || status;
}

function typeLabel(type: ExportJobType) {
  const map = typeOptions.reduce<Record<string, string>>((acc, item) => {
    acc[item.value] = item.label;
    return acc;
  }, {});
  return map[type] || type;
}

function formatDateTime(value: string) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatSize(bytes: number) {
  if (!bytes || Number.isNaN(bytes)) return '—';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) {
    return `${(mb / 1024).toFixed(1)} GB`;
  }
  return `${mb.toFixed(1)} MB`;
}

function formatParams(params?: Record<string, unknown>) {
  if (!params) return '{}';
  return JSON.stringify(params, null, 2);
}

function copyLink(job: ExportJob) {
  if (!job.download_url) return;
  navigator.clipboard?.writeText(job.download_url).then(
    () => setFeedback('下载链接已复制。', false),
    () => setFeedback('复制失败，请手动复制。', true)
  );
}

function copyCurl(job: ExportJob) {
  if (!job.download_url) return;
  const curl = `curl -H "Authorization: Bearer mocktoken" "${job.download_url}" -o "${job.file_name || job.job_id}.csv"`;
  navigator.clipboard?.writeText(curl).then(
    () => setFeedback('cURL 命令已复制。', false),
    () => setFeedback('复制失败，请手动复制。', true)
  );
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

function differenceInMinutes(startIso: string, endIso: string) {
  const start = new Date(startIso).getTime();
  const end = new Date(endIso).getTime();
  if (Number.isNaN(start) || Number.isNaN(end) || end < start) return -1;
  return (end - start) / 60000;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.exports-center {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $text-strong;
}

.exports-center__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.exports-center__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.exports-center__subtitle {
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.exports-center__actions {
  display: flex;
  gap: $spacing-12;
}

.exports-center__stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
}

.stats-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-16;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.08);
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

.exports-center__filters {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-20 $spacing-24;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
}

.filters__group {
  border: 0;
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

.exports-center__content {
  position: relative;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  line-height: $text-12-medium-lh;
  background: $surface-100;
  color: $text-muted;

  &[data-status='queued'],
  &[data-status='processing'] {
    background: rgba($primary-100, 0.6);
    color: $primary-700;
  }

  &[data-status='ready'] {
    background: rgba($color-surface-200, 0.6);
    color: $color-surface-700;
  }

  &[data-status='failed'] {
    background: rgba($danger-600, 0.18);
    color: $danger-700;
  }

  &[data-status='canceled'],
  &[data-status='expired'] {
    background: rgba($text-muted, 0.12);
    color: $text-muted;
  }
}

.progress {
  display: flex;
  align-items: center;
  gap: $spacing-8;

  &__bar {
    width: 6rem;
    height: 0.5rem;
    background: $primary-200;
    border-radius: $radius-lg;
  }

  span {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.file-cell {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  strong {
    font-size: $text-12-medium-fs;
  }

  &__meta {
    font-size: $text-12-regular-fs;
    color: $text-muted;
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

.job-drawer {
  position: fixed;
  top: 0;
  right: 0;
  height: 100vh;
  width: min(32rem, 90vw);
  background: $surface-0;
  border-left: $border-width-1 solid $surface-200;
  box-shadow: -12px 0 32px rgba($color-surface-700, 0.16);
  display: flex;
  flex-direction: column;
  z-index: $z-dialog;
}

.job-drawer__header {
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

.job-drawer__close {
  border: none;
  background: transparent;
  font-size: $text-16-semibold-fs;
  cursor: pointer;
  color: $text-muted;
}

.job-drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-20;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.job-drawer__placeholder {
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
  max-height: 12rem;
  overflow: auto;

  &.logs {
    max-height: 16rem;
    white-space: pre-wrap;
  }
}

.drawer-error {
  margin: 0;
  padding: $spacing-12;
  border-radius: $radius-lg;
  background: rgba($danger-600, 0.12);
  color: $danger-700;
  font-size: $text-12-regular-fs;
}

.downloads {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;

  li {
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: $spacing-8;
    font-size: $text-12-regular-fs;
    color: $text-muted;
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
  .exports-center__stats {
    grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  }

  .downloads li {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
