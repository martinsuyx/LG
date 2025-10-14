<template>
  <section class="matching">
    <header class="matching__head">
      <div>
        <h1>订单匹配与有效性确认</h1>
        <p>通过模板识别与多字段对照完成报表订单匹配、消歧与有效性复核，支持多文件导入与差异导出。</p>
      </div>
      <div class="matching__meta">
        <dl>
          <div>
            <dt>模板</dt>
            <dd>{{ templateDisplay }}</dd>
          </div>
          <div>
            <dt>规则版本</dt>
            <dd>{{ metadata?.matching_rule_version || '-' }}</dd>
          </div>
        </dl>
        <Button size="sm" variant="ghost" :loading="loading.export" @click="exportCurrent">导出当前筛选</Button>
        <Button size="sm" variant="primary" @click="showUploadModal = true">上传报表</Button>
      </div>
    </header>

    <form class="matching__filters" @submit.prevent="applyFilters">
      <label>
        <span>活动</span>
        <select v-model="filters.campaign_id" :disabled="loading.list">
          <option v-for="option in campaignOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
        </select>
      </label>
      <label>
        <span>开始日期</span>
        <input type="date" v-model="filters.start" :disabled="loading.list" />
      </label>
      <label>
        <span>结束日期</span>
        <input type="date" v-model="filters.end" :disabled="loading.list" />
      </label>
      <label class="field--search">
        <span>搜索</span>
        <input type="search" v-model.trim="filters.q" :placeholder="searchPlaceholder" :disabled="loading.list" />
      </label>
      <Button type="submit" size="sm" :loading="loading.list">应用筛选</Button>
      <Button type="button" size="sm" variant="ghost" :disabled="loading.list" @click="resetFilters">重置</Button>
    </form>

    <section class="matching__chips">
      <div class="chip-group">
        <span>匹配状态：</span>
        <button
          v-for="option in statusOptions"
          :key="option.value"
          type="button"
          :class="['chip', { 'is-active': filters.status === option.value }]"
          @click="setStatus(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="chip-group">
        <span>增量：</span>
        <button
          v-for="option in deltaOptions"
          :key="option.value"
          type="button"
          :class="['chip', { 'is-active': filters.delta === option.value }]"
          @click="setDelta(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
      <div class="chip-group">
        <span>匹配方式：</span>
        <button
          v-for="option in modeOptions"
          :key="option.value"
          type="button"
          :class="['chip', { 'is-active': filters.mode === option.value }]"
          @click="setMode(option.value)"
        >
          {{ option.label }}
        </button>
      </div>
    </section>

    <section v-if="summary" class="matching__summary">
      <article class="summary-card">
        <header>匹配概览</header>
        <ul>
          <li><strong>{{ summary.report_orders }}</strong><span>报表订单数</span></li>
          <li><strong>{{ summary.matched }}</strong><span>已匹配</span></li>
          <li><strong>{{ summary.unmatched }}</strong><span>未匹配</span></li>
          <li><strong>{{ summary.ambiguous }}</strong><span>待消歧</span></li>
        </ul>
      </article>
      <article class="summary-card">
        <header>质量指标</header>
        <ul>
          <li>
            <strong>{{ formatRate(summary.match_rate) }}</strong>
            <span>匹配成功率</span>
          </li>
          <li>
            <strong>{{ formatRate(summary.valid_rate) }}</strong>
            <span>有效订单率</span>
          </li>
          <li>
            <strong>{{ summary.duplicate }}</strong>
            <span>疑似重复</span>
          </li>
          <li>
            <strong>{{ summary.risky }}</strong>
            <span>高风险</span>
          </li>
        </ul>
      </article>
      <article class="summary-card">
        <header>增量变化</header>
        <ul>
          <li><strong>{{ summary.delta?.added ?? 0 }}</strong><span>新增</span></li>
          <li><strong>{{ summary.delta?.updated ?? 0 }}</strong><span>更新</span></li>
          <li><strong>{{ summary.delta?.unchanged ?? 0 }}</strong><span>无变化</span></li>
        </ul>
      </article>
    </section>

    <div v-if="selectedIds.length" class="matching__batch">
      <span>已选 {{ selectedIds.length }} 条</span>
      <div class="matching__batch-actions">
        <Button size="sm" :loading="loading.batch" @click="batchSetValid(true)">批量设为有效</Button>
        <Button size="sm" variant="secondary" :loading="loading.batch" @click="batchSetValid(false)">批量设为无效</Button>
        <Button size="sm" variant="ghost" :disabled="loading.batch" @click="clearSelection">清空选择</Button>
      </div>
    </div>

    <section class="matching__table">
      <table>
        <thead>
          <tr>
            <th class="col-select">
              <input type="checkbox" :checked="allSelectedOnPage" :disabled="!paginatedRows.length" @change="toggleSelectPage" />
            </th>
            <th>报表订单号</th>
            <th>产品键 / 手机</th>
            <th>推广 ID</th>
            <th>匹配方式</th>
            <th>匹配状态</th>
            <th>候选</th>
            <th>有效性</th>
            <th>风险</th>
            <th>模板版本</th>
            <th>增量</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody v-if="loading.list">
          <tr v-for="index in 6" :key="index">
            <td :colspan="12" class="loading">
              <div class="skeleton"></div>
            </td>
          </tr>
        </tbody>
        <tbody v-else-if="paginatedRows.length">
          <tr v-for="row in paginatedRows" :key="row.report_row_id">
            <td class="col-select">
              <input type="checkbox" :checked="selection.has(row.report_row_id)" @change="toggleSelection(row.report_row_id, $event)" />
            </td>
            <td>
              <div class="cell-order">
                <strong>{{ row.order_no || '—' }}</strong>
                <small>ID: {{ row.report_row_id }}</small>
              </div>
            </td>
            <td>
              <div class="cell-stack">
                <span>{{ row.product_key || '-' }}</span>
                <small>{{ row.phone || '-' }}</small>
              </div>
            </td>
            <td>{{ row.promoter_unique_id || '-' }}</td>
            <td><span class="tag">{{ modeLabel(row.match_mode) }}</span></td>
            <td><span :class="['status', `status--${row.match_status}`]">{{ statusLabel(row.match_status) }}</span></td>
            <td>
              <div class="cell-stack">
                <span>{{ row.candidate_count ?? 0 }} 个</span>
                <small v-if="row.candidate_top_score != null">最高 {{ formatScore(row.candidate_top_score) }}</small>
              </div>
            </td>
            <td>
              <span :class="['tag', row.valid ? 'tag--success' : 'tag--muted']">{{ row.valid ? '有效' : '未生效' }}</span>
            </td>
            <td>
              <RiskBadges :flags="row.risk_flags" />
            </td>
            <td>
              <div class="cell-stack">
                <span>{{ row.template_version || '-' }}</span>
                <small>{{ row.template_id || '-' }}</small>
              </div>
            </td>
            <td><span :class="['delta', row.delta ? `delta--${row.delta}` : '']">{{ deltaLabel(row.delta) }}</span></td>
            <td class="col-actions">
              <div class="actions">
                <button type="button" class="link-btn" @click="openDetail(row)">详情</button>
                <button
                  v-if="row.match_status === 'ambiguous'"
                  type="button"
                  class="link-btn"
                  @click="openDisambiguation(row)"
                >
                  消歧
                </button>
                <button v-else-if="row.match_status === 'unmatched'" type="button" class="link-btn" disabled>绑定线索</button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td colspan="12" class="empty">暂无符合条件的数据。</td>
          </tr>
        </tbody>
      </table>
    </section>

    <footer class="matching__pager">
      <div class="pager-left">
        <span>共 {{ filteredRows.length }} 条 / 第 {{ filters.page }} / {{ pageCount }} 页</span>
      </div>
      <div class="pager-right">
        <Button size="sm" variant="ghost" :disabled="filters.page <= 1" @click="changePage(filters.page - 1)">上一页</Button>
        <Button size="sm" variant="ghost" :disabled="filters.page >= pageCount" @click="changePage(filters.page + 1)">下一页</Button>
        <label class="pager-size">
          <span>每页</span>
          <select :value="filters.page_size" @change="changePageSize($event)">
            <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
          </select>
        </label>
      </div>
    </footer>

    <p v-if="feedback.message" :class="['matching__feedback', feedback.error ? 'matching__feedback--error' : '']">{{ feedback.message }}</p>

    <MatchingUploadModal :model-value="showUploadModal" :loading="loading.import" @update:modelValue="showUploadModal = $event" @submit="handleUpload" />

    <MatchingDetailDrawer
      :visible="detailState.visible"
      :loading="loading.detail"
      :row="detailState.row"
      :detail="detailState.detail"
      @close="closeDetail"
      @set-valid="handleSetValid"
      @toggle-risk="toggleRisk"
    />

    <MatchingDisambiguationDialog
      :model-value="disambiguation.visible"
      :loading="loading.disambiguation"
      :row="disambiguation.row"
      :candidates="disambiguation.candidates"
      @update:modelValue="disambiguation.visible = $event"
      @resolve="confirmCandidate"
    />
  </section>
</template>

<script setup lang="ts">
import { computed, defineComponent, onBeforeUnmount, reactive, ref, watch } from 'vue';
import Button from '@/components/Button.vue';
import MatchingDisambiguationDialog from './MatchingDisambiguationDialog.vue';
import MatchingDetailDrawer from './MatchingDetailDrawer.vue';
import MatchingUploadModal from './MatchingUploadModal.vue';
import {
  MatchingService,
  type MatchingCandidate,
  type MatchingDetail,
  type MatchingFilters,
  type MatchingListResponse,
  type MatchingResultItem,
  type MatchingSummary
} from '@/sdk/matching';

const RiskBadges = defineComponent({
  name: 'RiskBadges',
  props: {
    flags: {
      type: Array as () => string[] | undefined,
      default: () => []
    }
  },
  setup(props) {
    return () =>
      props.flags && props.flags.length ? (
        <div class="risk-badges">
          {props.flags.map((flag) => (
            <span class="risk-badges__item" key={flag}>
              {flag}
            </span>
          ))}
        </div>
      ) : (
        <span class="risk-badges__empty">—</span>
      );
  }
});

const campaignOptions = [
  { value: 'CAMP_202510', label: '九月新客拉新' },
  { value: 'CAMP_202509', label: '八月激活冲刺' }
];

const statusOptions = [
  { value: 'all', label: '全部' },
  { value: 'matched', label: '已匹配' },
  { value: 'ambiguous', label: '待消歧' },
  { value: 'unmatched', label: '未匹配' },
  { value: 'risky', label: '高风险' },
  { value: 'duplicate', label: '疑似重复' }
];

const deltaOptions = [
  { value: 'all', label: '全部' },
  { value: 'added', label: '新增' },
  { value: 'updated', label: '更新' },
  { value: 'unchanged', label: '无变化' }
];

const modeOptions = [
  { value: 'all', label: '全部' },
  { value: 'auto_id', label: '自动匹配' },
  { value: 'manual_form', label: '人工匹配' }
];

const pageSizes = [10, 20, 50];

const today = new Date();
const defaultStart = new Date(today);
defaultStart.setDate(today.getDate() - 7);

const filters = reactive({
  campaign_id: campaignOptions[0]?.value || '',
  start: defaultStart.toISOString().slice(0, 10),
  end: today.toISOString().slice(0, 10),
  q: '',
  status: 'all',
  delta: 'all',
  mode: 'all',
  page: 1,
  page_size: 20
});

const loading = reactive({
  list: false,
  import: false,
  export: false,
  detail: false,
  disambiguation: false,
  batch: false
});

const summary = ref<MatchingSummary | null>(null);
const metadata = ref<MatchingListResponse['metadata'] | null>(null);
const baseRows = ref<MatchingResultItem[]>([]);
const selection = ref<Set<string>>(new Set());
const feedback = reactive({ message: '', error: false });
const showUploadModal = ref(false);
const pollTimer = ref<number | null>(null);

const detailState = reactive<{ visible: boolean; row: MatchingResultItem | null; detail: MatchingDetail | null }>({
  visible: false,
  row: null,
  detail: null
});

const disambiguation = reactive<{ visible: boolean; row: MatchingResultItem | null; candidates: MatchingCandidate[] }>({
  visible: false,
  row: null,
  candidates: []
});

const searchPlaceholder = '按订单号 / 手机号 / 推广 ID 搜索';

const filteredRows = computed(() => {
  let rows = [...baseRows.value];
  if (filters.status !== 'all') {
    rows = rows.filter((row) => row.match_status === filters.status);
  }
  if (filters.delta !== 'all') {
    rows = rows.filter((row) => row.delta === filters.delta);
  }
  if (filters.mode !== 'all') {
    rows = rows.filter((row) => row.match_mode === filters.mode);
  }
  if (filters.q) {
    const value = filters.q.toLowerCase();
    rows = rows.filter((row) => {
      return (
        row.order_no?.toLowerCase().includes(value) ||
        row.phone?.toLowerCase().includes(value) ||
        row.promoter_unique_id?.toLowerCase().includes(value) ||
        row.report_row_id.toLowerCase().includes(value)
      );
    });
  }
  return rows;
});

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / filters.page_size)));
const paginatedRows = computed(() => {
  const start = (filters.page - 1) * filters.page_size;
  return filteredRows.value.slice(start, start + filters.page_size);
});

const selectedIds = computed(() => Array.from(selection.value));
const allSelectedOnPage = computed(() => paginatedRows.value.length > 0 && paginatedRows.value.every((row) => selection.value.has(row.report_row_id)));

const templateDisplay = computed(() => {
  if (metadata.value?.template_id) {
    return `${metadata.value.template_id} @ ${metadata.value.template_version || '未知版本'}`;
  }
  return '暂无模板记录';
});

watch(
  () => [filters.status, filters.delta, filters.mode, filters.q],
  () => {
    filters.page = 1;
    trimSelection();
  }
);

watch(
  () => [filters.campaign_id, filters.start, filters.end],
  () => {
    filters.page = 1;
    void loadResults();
  }
);

watch(
  () => filters.page,
  (page) => {
    const max = pageCount.value;
    if (page > max) filters.page = max;
  }
);

onBeforeUnmount(() => {
  clearPoll();
});

void loadResults();

async function loadResults() {
  loading.list = true;
  try {
    const params: MatchingFilters = {
      campaign_id: filters.campaign_id,
      start: filters.start,
      end: filters.end,
      page: filters.page,
      page_size: filters.page_size
    };
    const response = await MatchingService.listResults(params);
    summary.value = response.summary ?? null;
    metadata.value = response.metadata ?? null;
    baseRows.value = response.items ?? [];
    trimSelection();
    clearFeedback();
  } catch (error) {
    showError((error as Error).message || '加载匹配结果失败');
    baseRows.value = [];
  } finally {
    loading.list = false;
  }
}

function applyFilters() {
  filters.page = 1;
  trimSelection();
}

function resetFilters() {
  filters.campaign_id = campaignOptions[0]?.value || '';
  filters.start = defaultStart.toISOString().slice(0, 10);
  filters.end = today.toISOString().slice(0, 10);
  filters.q = '';
  filters.status = 'all';
  filters.delta = 'all';
  filters.mode = 'all';
  filters.page = 1;
  filters.page_size = 20;
  trimSelection();
  void loadResults();
}

function setStatus(value: string) {
  filters.status = value;
}

function setDelta(value: string) {
  filters.delta = value;
}

function setMode(value: string) {
  filters.mode = value;
}

function toggleSelection(id: string, event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    selection.value.add(id);
  } else {
    selection.value.delete(id);
  }
}

function toggleSelectPage(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    paginatedRows.value.forEach((row) => selection.value.add(row.report_row_id));
  } else {
    paginatedRows.value.forEach((row) => selection.value.delete(row.report_row_id));
  }
}

function clearSelection() {
  selection.value.clear();
}

function trimSelection() {
  const ids = new Set(filteredRows.value.map((row) => row.report_row_id));
  selection.value.forEach((id) => {
    if (!ids.has(id)) selection.value.delete(id);
  });
}

function changePage(page: number) {
  filters.page = Math.max(1, Math.min(pageCount.value, page));
}

function changePageSize(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  filters.page_size = value;
  filters.page = 1;
}

function formatRate(value: number | undefined | null) {
  if (typeof value !== 'number') return '--';
  return `${(value * 100).toFixed(1)}%`;
}

function statusLabel(status: string) {
  const map: Record<string, string> = {
    matched: '已匹配',
    unmatched: '未匹配',
    ambiguous: '待消歧',
    invalid: '无效',
    risky: '风险',
    duplicate: '重复',
    cross_period: '跨期'
  };
  return map[status] || status;
}

function modeLabel(mode: string) {
  const map: Record<string, string> = {
    auto_id: '自动匹配',
    manual_form: '人工匹配'
  };
  return map[mode] || mode;
}

function deltaLabel(delta: string | null | undefined) {
  if (!delta || delta === 'unchanged') return '—';
  const map: Record<string, string> = {
    added: '新增',
    updated: '更新'
  };
  return map[delta] || delta;
}

function formatScore(score: number | null | undefined) {
  if (typeof score !== 'number') return '-';
  return `${(score * 100).toFixed(0)}分`;
}

async function batchSetValid(valid: boolean) {
  if (!selectedIds.value.length) return;
  loading.batch = true;
  try {
    await Promise.all(selectedIds.value.map((id) => MatchingService.setValid(id, valid)));
    baseRows.value = baseRows.value.map((row) =>
      selectedIds.value.includes(row.report_row_id)
        ? {
            ...row,
            valid,
            match_status: valid ? row.match_status : row.match_status === 'matched' && !valid ? 'invalid' : row.match_status
          }
        : row
    );
    showFeedback(`已批量设置 ${selectedIds.value.length} 条为${valid ? '有效' : '无效'}`);
    if (!valid) {
      baseRows.value = baseRows.value.map((row) => {
        if (selectedIds.value.includes(row.report_row_id)) {
          return { ...row, valid: false };
        }
        return row;
      });
    }
  } catch (error) {
    showError((error as Error).message || '批量设置失败');
  } finally {
    loading.batch = false;
    clearSelection();
  }
}

function openDetail(row: MatchingResultItem) {
  detailState.visible = true;
  detailState.row = row;
  detailState.detail = null;
  void loadDetail(row.report_row_id);
}

async function loadDetail(id: string) {
  loading.detail = true;
  try {
    detailState.detail = await MatchingService.getResultDetail(id);
  } catch (error) {
    showError((error as Error).message || '加载详情失败');
  } finally {
    loading.detail = false;
  }
}

function closeDetail() {
  detailState.visible = false;
  detailState.row = null;
  detailState.detail = null;
}

async function handleSetValid(valid: boolean) {
  if (!detailState.row) return;
  loading.detail = true;
  try {
    await MatchingService.setValid(detailState.row.report_row_id, valid);
    updateRow(detailState.row.report_row_id, { valid, match_status: valid ? 'matched' : detailState.row.match_status });
    detailState.row = baseRows.value.find((row) => row.report_row_id === detailState.row?.report_row_id) || detailState.row;
    showFeedback(`已设为${valid ? '有效' : '无效'}`);
  } catch (error) {
    showError((error as Error).message || '更新有效性失败');
  } finally {
    loading.detail = false;
  }
}

async function toggleRisk(add: boolean) {
  if (!detailState.row) return;
  loading.detail = true;
  try {
    const flag = 'manual_review';
    const response = await MatchingService.updateRiskFlag(detailState.row.report_row_id, {
      flag,
      action: add ? 'add' : 'remove'
    });
    updateRow(detailState.row.report_row_id, { risk_flags: response.risk_flags });
    detailState.row = baseRows.value.find((row) => row.report_row_id === detailState.row?.report_row_id) || detailState.row;
    showFeedback(add ? '已标记风险' : '已取消风险标记');
  } catch (error) {
    showError((error as Error).message || '更新风险标记失败');
  } finally {
    loading.detail = false;
  }
}

function openDisambiguation(row: MatchingResultItem) {
  disambiguation.visible = true;
  disambiguation.row = row;
  disambiguation.candidates = [];
  loading.disambiguation = true;
  MatchingService.getResultDetail(row.report_row_id)
    .then((detail) => {
      disambiguation.candidates = detail.candidates || [];
      detailState.detail = detail;
    })
    .catch((error) => {
      showError((error as Error).message || '加载候选失败');
    })
    .finally(() => {
      loading.disambiguation = false;
    });
}

async function confirmCandidate(candidate: MatchingCandidate) {
  if (!disambiguation.row) return;
  loading.disambiguation = true;
  try {
    await MatchingService.resolveCandidate(disambiguation.row.report_row_id, {
      order_id: candidate.order_id,
      score: candidate.score
    });
    updateRow(disambiguation.row.report_row_id, {
      match_status: 'matched',
      matched_order_id: candidate.order_id,
      valid: true,
      candidate_count: 1,
      candidate_top_score: candidate.score ?? 1
    });
    disambiguation.visible = false;
    showFeedback('候选已确认并匹配成功');
  } catch (error) {
    showError((error as Error).message || '消歧失败，请稍后再试');
  } finally {
    loading.disambiguation = false;
  }
}

function updateRow(id: string, patch: Partial<MatchingResultItem>) {
  baseRows.value = baseRows.value.map((row) => (row.report_row_id === id ? { ...row, ...patch } : row));
}

async function exportCurrent() {
  loading.export = true;
  try {
    await MatchingService.exportResults({
      campaign_id: filters.campaign_id,
      start: filters.start,
      end: filters.end,
      status: filters.status === 'all' ? '' : filters.status,
      delta: filters.delta === 'all' ? '' : filters.delta,
      mode: filters.mode === 'all' ? '' : filters.mode,
      q: filters.q
    });
    showFeedback('已触发导出任务，可前往导出中心查看。');
  } catch (error) {
    showError((error as Error).message || '导出失败');
  } finally {
    loading.export = false;
  }
}

async function handleUpload(files: File[]) {
  if (!files.length) {
    showError('请至少选择一个报表文件');
    return;
  }
  loading.import = true;
  try {
    const form = new FormData();
    files.forEach((file) => form.append('files', file));
    const response = await MatchingService.importReports(form);
    showUploadModal.value = false;
    showFeedback('导入任务已提交，正在识别模板…');
    pollImport(response.task_id);
  } catch (error) {
    showError((error as Error).message || '导入失败，请稍后重试');
  } finally {
    loading.import = false;
  }
}

function pollImport(taskId: string) {
  clearPoll();
  const run = async () => {
    try {
      const status = await MatchingService.getImportStatus(taskId);
      metadata.value = {
        template_id: status.template_id,
        template_version: status.template_version,
        matching_rule_version: status.matching_rule_version
      };
      if (status.status === 'matched' || status.status === 'warning') {
        showFeedback(status.messages?.[0] || '解析完成');
        await loadResults();
        clearPoll();
        return;
      }
    } catch (error) {
      showError((error as Error).message || '获取导入状态失败');
      clearPoll();
      return;
    }
    pollTimer.value = window.setTimeout(run, 1500);
  };
  run();
}

function clearPoll() {
  if (pollTimer.value != null) {
    window.clearTimeout(pollTimer.value);
    pollTimer.value = null;
  }
}

function showFeedback(message: string) {
  feedback.message = message;
  feedback.error = false;
  window.setTimeout(() => {
    if (feedback.message === message) feedback.message = '';
  }, 3000);
}

function showError(message: string) {
  feedback.message = message;
  feedback.error = true;
  window.setTimeout(() => {
    if (feedback.message === message) feedback.message = '';
  }, 5000);
}

function clearFeedback() {
  feedback.message = '';
  feedback.error = false;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.matching {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
  color: $text-strong;
}

.matching__head {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
  align-items: flex-start;

  h1 {
    margin: 0 0 $spacing-8;
    font-size: $title-18-semibold-fs;
    line-height: $title-18-semibold-lh;
    font-weight: $title-18-semibold-wt;
  }

  p {
    margin: 0;
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
}

.matching__meta {
  display: flex;
  align-items: center;
  gap: $spacing-12;

  dl {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, auto));
    gap: calc(#{$spacing-8} / 2) $spacing-16;
    font-size: $text-12-regular-fs;
    color: $text-muted;
    margin: 0;
  }

  dt {
    font-weight: $text-12-medium-wt;
    color: $text-subtle;
  }

  dd {
    margin: 0;
    color: $text-strong;
  }
}

.matching__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, max-content));
  gap: $spacing-12;
  align-items: end;

  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  input,
  select {
    border: $border-1 solid $surface-200;
    border-radius: $radius-12;
    padding: $spacing-8 $spacing-12;
    font: inherit;
  }
}

.field--search {
  min-width: 18rem;
}

.matching__chips {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.chip-group {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  flex-wrap: wrap;
}

.chip {
  border: $border-1 solid $surface-200;
  border-radius: $radius-12;
  padding: calc(#{$spacing-8} / 2) $spacing-12;
  background: $surface-0;
  cursor: pointer;
  font-size: $text-12-regular-fs;
  color: $text-muted;
  transition: $transition-fast;

  &:hover {
    border-color: $primary-200;
    color: $primary-700;
  }

  &.is-active {
    background: $primary-50;
    border-color: $primary-300;
    color: $primary-700;
  }
}

.matching__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  gap: $spacing-16;
}

.summary-card {
  border: $border-1 solid $surface-200;
  border-radius: $radius-16;
  padding: $spacing-16;
  background: $surface-0;
  box-shadow: $shadow-card;

  header {
    font-size: $text-14-regular-fs;
    color: $text-muted;
    margin-bottom: $spacing-12;
  }

  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: $spacing-12;
  }

  li {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;

    strong {
      font-size: $text-16-semibold-fs;
      line-height: $text-16-semibold-lh;
      font-weight: $text-16-semibold-wt;
      color: $text-strong;
    }

    span {
      color: $text-muted;
    }
  }
}

.matching__batch {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: $border-1 solid $surface-200;
  border-radius: $radius-12;
  padding: $spacing-12 $spacing-16;
  background: $surface-50;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.matching__batch-actions {
  display: flex;
  gap: $spacing-12;
}

.matching__table {
  border: $border-1 solid $surface-200;
  border-radius: $radius-16;
  overflow: hidden;
  background: $surface-0;
  box-shadow: $shadow-card;

  table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
  }

  thead th {
    background: $surface-50;
    color: $text-subtle;
    text-align: left;
    font-size: $text-12-medium-fs;
    line-height: $text-12-medium-lh;
    font-weight: $text-12-medium-wt;
    padding: $spacing-12 $spacing-16;
  }

  tbody td {
    padding: $spacing-12 $spacing-16;
    border-top: $border-1 solid $surface-100;
    font-size: $text-12-regular-fs;
    color: $text-strong;
    vertical-align: top;
  }

  tbody tr:hover {
    background: $surface-25;
  }

  .loading .skeleton {
    height: 1.5rem;
    background: $skeleton-bg;
    border-radius: $radius-8;
  }

  .empty {
    text-align: center;
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.col-select {
  width: 3rem;
}

.cell-order {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  small {
    color: $text-muted;
  }
}

.cell-stack {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  small {
    color: $text-muted;
    font-size: $text-12-regular-fs;
  }
}

.tag {
  display: inline-flex;
  align-items: center;
  padding: calc(#{$spacing-8} / 4) $spacing-8;
  border-radius: $radius-8;
  background: $surface-100;
  color: $text-muted;
  font-size: $text-12-regular-fs;

  &.tag--success {
    background: rgba($primary-100, 0.6);
    color: $primary-700;
  }

  &.tag--muted {
    color: $text-muted;
  }
}

.status {
  display: inline-flex;
  align-items: center;
  padding: calc(#{$spacing-8} / 4) $spacing-8;
  border-radius: $radius-8;
  font-size: $text-12-regular-fs;
  background: $surface-100;
  color: $text-muted;
}

.status--matched {
  background: rgba($primary-100, 0.6);
  color: $primary-700;
}

.status--ambiguous {
  background: rgba($color-warning-soft, 0.6);
  color: $color-warning-strong;
}

.status--unmatched,
.status--invalid {
  background: rgba($danger-300, 0.3);
  color: $danger-700;
}

.status--risky,
.status--duplicate,
.status--cross_period {
  background: rgba($color-warning-soft, 0.5);
  color: $color-warning-strong;
}

.delta {
  display: inline-flex;
  align-items: center;
  padding: calc(#{$spacing-8} / 4) $spacing-8;
  border-radius: $radius-8;
  font-size: $text-12-regular-fs;
  color: $text-muted;
  background: $surface-100;
}

.delta--added {
  background: rgba($primary-100, 0.6);
  color: $primary-700;
}

.delta--updated {
  background: rgba($color-warning-soft, 0.6);
  color: $color-warning-strong;
}

.col-actions {
  width: 7rem;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
}

.link-btn {
  border: none;
  background: transparent;
  color: $primary-700;
  cursor: pointer;
  font-size: $text-12-regular-fs;
  text-align: left;

  &:disabled {
    opacity: $disabled-opacity;
    cursor: not-allowed;
  }
}

.matching__pager {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-12 $spacing-16;
  border: $border-1 solid $surface-200;
  border-radius: $radius-12;
  background: $surface-0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.pager-right {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.pager-size {
  display: inline-flex;
  align-items: center;
  gap: calc(#{$spacing-8} / 2);

  select {
    border: $border-1 solid $surface-200;
    border-radius: $radius-8;
    padding: calc(#{$spacing-8} / 2) $spacing-8;
    font: inherit;
  }
}

.matching__feedback {
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-12;
  background: rgba($primary-100, 0.6);
  color: $primary-700;
  font-size: $text-12-regular-fs;
}

.matching__feedback--error {
  background: rgba($danger-300, 0.3);
  color: $danger-700;
}

.risk-badges {
  display: flex;
  align-items: center;
  gap: calc(#{$spacing-8} / 2);
  flex-wrap: wrap;
}

.risk-badges__item {
  padding: calc(#{$spacing-8} / 4) $spacing-8;
  border-radius: $radius-8;
  font-size: $text-12-regular-fs;
  background: rgba($color-warning-soft, 0.5);
  color: $color-warning-strong;
}

.risk-badges__empty {
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

@media (max-width: 64rem) {
  .matching__head {
    flex-direction: column;
    align-items: flex-start;
  }

  .matching__meta {
    flex-wrap: wrap;
  }
}
</style>
