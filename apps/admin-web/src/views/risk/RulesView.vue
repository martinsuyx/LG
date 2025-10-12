<template>
  <section class="rules-view">
    <header class="rules-view__toolbar">
      <div class="filters" role="search">
        <label>
          <span>状态</span>
          <select v-model="filters.status" :disabled="loading">
            <option value="">全部</option>
            <option v-for="option in statusOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>等级</span>
          <select v-model="filters.level" :disabled="loading">
            <option value="">全部</option>
            <option v-for="option in levelOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__keyword">
          <span>关键词</span>
          <input type="search" v-model.trim="filters.keyword" placeholder="编码 / 名称" :disabled="loading" />
        </label>
        <Button size="sm" :disabled="loading" @click="applyFilters">筛选</Button>
        <Button size="sm" variant="ghost" :disabled="loading" @click="resetFilters">重置</Button>
      </div>
      <div class="actions">
        <Button size="sm" variant="secondary" @click="createDraft">新建规则</Button>
        <Button size="sm" variant="ghost" @click="refreshRules">刷新</Button>
      </div>
    </header>

    <div class="layout">
      <section class="table-card">
        <Table
          :columns="columns"
          :rows="filteredRules"
          :loading="loading"
          :row-key="(row) => row.rule_id"
          default-sort-key="updated_at"
          default-sort-order="desc"
          @rowClick="selectRule"
        >
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell:level="{ row }">
            <span class="level-chip" :data-level="row.level">{{ levelLabel(row.level) }}</span>
          </template>
          <template #cell:updated_at="{ row }">{{ formatDateTime(row.updated_at) }}</template>
          <template #empty>{{ loading ? '加载中…' : '暂无规则' }}</template>
        </Table>
      </section>

      <aside class="editor" v-if="activeRule && editForm">
        <header class="editor__header">
          <div>
            <h2>{{ editForm.name || '新建规则' }}</h2>
            <p>{{ editForm.code }} · 版本 {{ editForm.version }}</p>
          </div>
          <button type="button" class="editor__close" aria-label="关闭" @click="selectedRuleId = null">×</button>
        </header>
        <div class="editor__body">
          <section class="editor-group">
            <h3>基本信息</h3>
            <div class="editor-grid">
              <label>
                <span>规则编码</span>
                <input v-model.trim="editForm.code" placeholder="唯一编码" />
              </label>
              <label>
                <span>规则名称</span>
                <input v-model.trim="editForm.name" placeholder="规则名称" />
              </label>
              <label>
                <span>等级</span>
                <select v-model="editForm.level">
                  <option v-for="option in levelOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                </select>
              </label>
              <label>
                <span>权重</span>
                <input type="number" v-model.number="editForm.weight" step="0.1" />
              </label>
              <label>
                <span>阈值</span>
                <input type="number" v-model.number="editForm.threshold" />
              </label>
            </div>
          </section>

          <section class="editor-group">
            <h3>规则逻辑</h3>
            <textarea v-model="editForm.expr" rows="6" class="dsl-input" placeholder="编写 DSL 或逻辑描述"></textarea>
          </section>

          <section class="editor-group">
            <h3>仿真测试</h3>
            <div class="simulate-form">
              <label>
                <span>样本集</span>
                <select v-model="simulateForm.dataset">
                  <option value="last_7d">近 7 天</option>
                  <option value="last_30d">近 30 天</option>
                  <option value="custom">自定义</option>
                </select>
              </label>
              <Button size="sm" :loading="simulateLoading" @click="runSimulation">仿真</Button>
            </div>
            <div v-if="simulateResult" class="simulate-result">
              <p>Precision: {{ simulateResult.metrics?.precision ?? '-' }}</p>
              <p>Recall: {{ simulateResult.metrics?.recall ?? '-' }}</p>
              <p>Coverage: {{ simulateResult.metrics?.coverage ?? '-' }}</p>
            </div>
          </section>

          <section class="editor-group">
            <h3>灰度发布</h3>
            <div class="publish-form">
              <label>
                <span>灰度比例 (%)</span>
                <input type="number" v-model.number="publishForm.percent" min="0" max="100" />
              </label>
              <Button size="sm" :loading="publishLoading" @click="publishRule">发布</Button>
            </div>
            <p v-if="publishResult" class="hint">已发布：部署 {{ publishResult.deployment_id }}，灰度 {{ publishResult.percent ?? 0 }}%</p>
          </section>

          <section class="editor-group">
            <h3>历史回放</h3>
            <div class="replay-form">
              <label>
                <span>时间窗口</span>
                <input type="text" v-model.trim="replayForm.range" placeholder="例如 2025-09-20~2025-09-30" />
              </label>
              <Button size="sm" :loading="replayLoading" @click="runReplay">发起回放</Button>
            </div>
            <p v-if="replayResult" class="hint">回放 {{ replayResult.replay_id }} 成功，命中增量：{{ replayResult.delta_metrics?.hit_count ?? 0 }}</p>
          </section>
        </div>

        <footer class="editor__footer">
          <Button size="sm" variant="primary" :loading="saveLoading" @click="saveRule">保存草稿</Button>
        </footer>
      </aside>
    </div>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import Table from '@/components/Table.vue';
import {
  RiskRulesService,
  type RiskRuleDetail,
  type RiskRuleListItem,
  type RiskRulePublishResponse,
  type RiskRuleReplayResponse,
  type RiskRuleSimulationResponse
} from '@/sdk/risk';

const fallbackRules: RiskRuleListItem[] = [
  {
    rule_id: 'R2025100301',
    code: 'GEOFENCE_OUT',
    name: '越界地理围栏',
    level: 'high',
    status: 'published',
    version: 12,
    weight: 1.2,
    threshold: 80,
    package: 'geo',
    hit_7d: 128,
    updated_by: '林杉',
    updated_at: '2025-10-03T09:20:00+08:00'
  },
  {
    rule_id: 'R2025100201',
    code: 'FREQ_APPLY',
    name: '短期高频提交',
    level: 'medium',
    status: 'draft',
    version: 3,
    weight: 1,
    threshold: 65,
    package: 'behavior',
    hit_7d: 76,
    updated_by: '朱敏',
    updated_at: '2025-10-02T18:00:00+08:00'
  }
];

const fallbackDetails: Record<string, RiskRuleDetail> = {
  R2025100301: {
    ...fallbackRules[0],
    expr: 'distance_to_store_km > 10 AND device_recent_orders_24h > 3',
    datasource_map: {
      distance_to_store_km: 'geo.distance',
      device_recent_orders_24h: 'device.orders_24h'
    },
    changelog: '调整阈值至 80，新增距门店条件',
    simulations: [
      { simulation_id: 'SIM-20251003-01', dataset: 'last_7d', metrics: { precision: 0.86, recall: 0.72, coverage: 0.35, hit_count: 128 }, created_at: '2025-10-03T09:05:00+08:00' }
    ],
    versions: [
      { version: 12, updated_at: '2025-10-03T09:20:00+08:00', comment: '灰度 20% 发布' },
      { version: 11, updated_at: '2025-09-28T18:00:00+08:00', comment: '修复距离计算' }
    ]
  }
};

const columns = [
  { key: 'code', title: '编码', width: '8rem' },
  { key: 'name', title: '名称' },
  { key: 'level', title: '等级', width: '6rem' },
  { key: 'status', title: '状态', width: '7rem' },
  { key: 'version', title: '版本', width: '6rem' },
  { key: 'hit_7d', title: '近 7 日命中', width: '7rem' },
  { key: 'updated_at', title: '更新时间', width: '10rem' }
];

const statusOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'offline', label: '已下线' },
  { value: 'deprecated', label: '已废弃' }
];

const levelOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '致命' }
];

const rules = ref<RiskRuleListItem[]>([]);
const filteredRules = ref<RiskRuleListItem[]>([]);
const loading = ref(false);
const selectedRuleId = ref<string | null>(null);
const detailCache = reactive<Record<string, RiskRuleDetail>>({});

const filters = reactive({ status: '', level: '', keyword: '' });

const editForm = reactive<RiskRuleDetail>({} as RiskRuleDetail);
const simulateForm = reactive({ dataset: 'last_7d' });
const simulateResult = ref<RiskRuleSimulationResponse | null>(null);
const simulateLoading = ref(false);

const publishForm = reactive({ percent: 20 });
const publishResult = ref<RiskRulePublishResponse | null>(null);
const publishLoading = ref(false);

const replayForm = reactive({ range: '2025-09-20~2025-09-30' });
const replayResult = ref<RiskRuleReplayResponse | null>(null);
const replayLoading = ref(false);

const saveLoading = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

onMounted(() => {
  refreshRules();
});

async function refreshRules() {
  loading.value = true;
  try {
    const response = await RiskRulesService.list();
    const items = Array.isArray(response?.items) ? response.items : [];
    rules.value = items.length ? items : fallbackRules;
  } catch (err) {
    rules.value = fallbackRules;
    showError((err as Error).message || '加载规则失败');
  } finally {
    filteredRules.value = [...rules.value];
    loading.value = false;
  }
}

function applyFilters() {
  let items = [...rules.value];
  if (filters.status) items = items.filter((item) => item.status === filters.status);
  if (filters.level) items = items.filter((item) => item.level === filters.level);
  if (filters.keyword) {
    const k = filters.keyword.toLowerCase();
    items = items.filter((item) => `${item.code}${item.name}`.toLowerCase().includes(k));
  }
  filteredRules.value = items;
}

function resetFilters() {
  filters.status = '';
  filters.level = '';
  filters.keyword = '';
  applyFilters();
}

async function selectRule(row: RiskRuleListItem) {
  selectedRuleId.value = row.rule_id;
  if (!detailCache[row.rule_id]) {
    try {
      const detail = await RiskRulesService.getDetail(row.rule_id);
      detailCache[row.rule_id] = detail || fallbackDetails[row.rule_id] || row as RiskRuleDetail;
    } catch (err) {
      if (fallbackDetails[row.rule_id]) {
        detailCache[row.rule_id] = fallbackDetails[row.rule_id];
      } else {
        detailCache[row.rule_id] = row as RiskRuleDetail;
        showError((err as Error).message || '加载规则详情失败');
      }
    }
  }
  const detail = detailCache[row.rule_id] || fallbackDetails[row.rule_id] || (row as RiskRuleDetail);
  Object.assign(editForm, JSON.parse(JSON.stringify(detail)));
  simulateResult.value = null;
  publishResult.value = null;
  replayResult.value = null;
}

const activeRule = computed(() => (selectedRuleId.value ? detailCache[selectedRuleId.value] || fallbackDetails[selectedRuleId.value] || null : null));

function createDraft() {
  const draft: RiskRuleDetail = {
    rule_id: `LOCAL-${Date.now()}`,
    code: '',
    name: '',
    level: 'medium',
    status: 'draft',
    version: 1,
    weight: 1,
    threshold: 60
  };
  detailCache[draft.rule_id] = draft;
  rules.value = [draft, ...rules.value];
  filteredRules.value = [draft, ...filteredRules.value];
  selectedRuleId.value = draft.rule_id;
  Object.assign(editForm, JSON.parse(JSON.stringify(draft)));
}

async function saveRule() {
  if (!selectedRuleId.value) return;
  if (!editForm.code || !editForm.name) {
    showError('请填写规则编码和名称');
    return;
  }
  saveLoading.value = true;
  try {
    const result = await RiskRulesService.save(selectedRuleId.value.startsWith('LOCAL') ? null : selectedRuleId.value, {
      code: editForm.code,
      name: editForm.name,
      level: editForm.level,
      weight: editForm.weight,
      threshold: editForm.threshold,
      expr: editForm.expr
    });
    detailCache[selectedRuleId.value] = result;
    const index = rules.value.findIndex((item) => item.rule_id === selectedRuleId.value);
    if (index >= 0) rules.value.splice(index, 1, result);
    filteredRules.value = [...rules.value];
    showFeedback('已保存草稿');
  } catch (err) {
    showError((err as Error).message || '保存失败');
  } finally {
    saveLoading.value = false;
  }
}

async function runSimulation() {
  if (!selectedRuleId.value) return;
  simulateLoading.value = true;
  try {
    const result = await RiskRulesService.simulate(selectedRuleId.value, { dataset: simulateForm.dataset });
    simulateResult.value = result;
    showFeedback('仿真完成');
  } catch (err) {
    showError((err as Error).message || '仿真失败');
  } finally {
    simulateLoading.value = false;
  }
}

async function publishRule() {
  if (!selectedRuleId.value) return;
  publishLoading.value = true;
  try {
    const result = await RiskRulesService.publish(selectedRuleId.value, { mode: 'gray', percent: publishForm.percent });
    publishResult.value = result;
    showFeedback('发布任务已创建');
  } catch (err) {
    showError((err as Error).message || '发布失败');
  } finally {
    publishLoading.value = false;
  }
}

async function runReplay() {
  if (!selectedRuleId.value) return;
  replayLoading.value = true;
  try {
    const result = await RiskRulesService.replay(selectedRuleId.value, { range: replayForm.range });
    replayResult.value = result;
    showFeedback('回放任务已创建');
  } catch (err) {
    showError((err as Error).message || '回放失败');
  } finally {
    replayLoading.value = false;
  }
}

function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', published: '已发布', offline: '已下线', deprecated: '已废弃' };
  return map[status] || status;
}

function levelLabel(level: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '致命' };
  return map[level] || level;
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
  }, 3000);
}

function showError(message: string) {
  errorMessage.value = message;
  window.setTimeout(() => {
    if (errorMessage.value === message) errorMessage.value = '';
  }, 4000);
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.rules-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.rules-view__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: $spacing-16;
}

.filters {
  display: flex;
  align-items: flex-end;
  gap: $spacing-12;
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

.filters__keyword { min-width: 14rem; }
.actions { display: flex; gap: $spacing-8; }

.layout {
  display: grid;
  grid-template-columns: minmax(34rem, 1fr) minmax(26rem, 32rem);
  gap: $spacing-24;
}

.table-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-12;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.06);
}

.editor {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 44rem;
}

.editor__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-16 $spacing-20;
  border-bottom: $border-width-1 solid $surface-200;
  h2 { margin: 0; font-size: $text-16-semibold-fs; }
  p { margin: 0; color: $text-muted; font-size: $text-12-regular-fs; }
}

.editor__close {
  background: transparent;
  border: none;
  font-size: $text-16-semibold-fs;
  cursor: pointer;
  color: $text-muted;
}

.editor__body {
  padding: $spacing-16 $spacing-20;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.editor-group {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  h3 { margin: 0; font-size: $text-12-medium-fs; color: $text-muted; }
}

.editor-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
  input,
  select {
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-8 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.dsl-input {
  width: 100%;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  padding: $spacing-8 $spacing-12;
  font-family: 'JetBrains Mono', monospace;
  min-height: 10rem;
}

.simulate-form,
.publish-form,
.replay-form {
  display: flex;
  align-items: center;
  gap: $spacing-12;
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
  select,
  input {
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-8 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.simulate-result,
.hint {
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.editor__footer {
  padding: $spacing-16 $spacing-20;
  border-top: $border-width-1 solid $surface-200;
  display: flex;
  justify-content: flex-end;
}

.status-chip,
.level-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  font-weight: $text-12-medium-wt;
}

.status-chip[data-status='published'] { background: rgba($color-primary-700, 0.12); color: $color-primary-700; }
.status-chip[data-status='draft'] { background: $surface-100; color: $text-muted; }
.status-chip[data-status='offline'] { background: rgba($color-surface-500, 0.18); color: $color-surface-500; }
.status-chip[data-status='deprecated'] { background: rgba($color-danger-300, 0.3); color: $color-danger-600; }

.level-chip[data-level='low'] { background: $surface-100; color: $text-muted; }
.level-chip[data-level='medium'] { background: rgba($color-primary-200, 0.35); color: $color-primary-700; }
.level-chip[data-level='high'] { background: rgba($color-warning-strong, 0.18); color: $color-warning-strong; }
.level-chip[data-level='critical'] { background: rgba($color-danger-600, 0.18); color: $color-danger-600; }

.feedback { font-size: $text-12-regular-fs; color: $color-primary-700; }
.feedback--error { color: $color-danger-600; }

.actions { display: flex; gap: $spacing-8; }

@media (max-width: 80rem) {
  .layout {
    grid-template-columns: 1fr;
  }
  .editor { max-height: none; }
}
</style>
