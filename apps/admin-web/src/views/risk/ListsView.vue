<template>
  <section class="lists-view">
    <header class="lists-view__toolbar">
      <div class="filters" role="search">
        <label>
          <span>名单类型</span>
          <select v-model="filters.type" :disabled="loading">
            <option value="">全部</option>
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>主体类型</span>
          <select v-model="filters.entity_type" :disabled="loading">
            <option value="">全部</option>
            <option v-for="option in entityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__keyword">
          <span>关键词</span>
          <input type="search" v-model.trim="filters.keyword" :disabled="loading" placeholder="主体值 / 备注" />
        </label>
        <Button size="sm" :disabled="loading" @click="applyFilters">筛选</Button>
        <Button size="sm" variant="ghost" :disabled="loading" @click="resetFilters">重置</Button>
      </div>
      <div class="actions">
        <Button size="sm" variant="secondary" @click="openCreateModal">新建条目</Button>
        <Button size="sm" variant="secondary" @click="openImportModal">批量导入</Button>
        <Button size="sm" variant="ghost" @click="previewDedup">去重预览</Button>
      </div>
    </header>

    <div class="layout">
      <section class="table-card">
        <Table
          :columns="columns"
          :rows="filteredLists"
          :loading="loading"
          :row-key="(row) => row.list_id"
          default-sort-key="created_at"
          default-sort-order="desc"
          @rowClick="selectList"
        >
          <template #cell:type="{ row }">
            <span class="type-chip" :data-type="row.type">{{ typeLabel(row.type) }}</span>
          </template>
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell:hit_count="{ row }">{{ row.hit_count ?? 0 }}</template>
          <template #cell:expire_at="{ row }">{{ formatDate(row.expire_at) }}</template>
          <template #empty>{{ loading ? '加载中…' : '暂无名单' }}</template>
        </Table>
      </section>

      <aside class="drawer" v-if="activeDetail">
        <header class="drawer__header">
          <div>
            <h2>{{ activeDetail.entity_value }}</h2>
            <p>{{ typeLabel(activeDetail.type) }} · {{ entityLabel(activeDetail.entity_type) }}</p>
          </div>
          <button type="button" class="drawer__close" aria-label="关闭" @click="selectedListId = null">×</button>
        </header>
        <div class="drawer__body">
          <dl class="drawer-grid">
            <div>
              <dt>状态</dt>
              <dd><span class="status-chip" :data-status="activeDetail.status">{{ statusLabel(activeDetail.status) }}</span></dd>
            </div>
            <div>
              <dt>来源</dt>
              <dd>{{ sourceLabel(activeDetail.source) }}</dd>
            </div>
            <div>
              <dt>命中次数</dt>
              <dd>{{ activeDetail.hit_count ?? 0 }}</dd>
            </div>
            <div>
              <dt>有效期</dt>
              <dd>{{ formatDate(activeDetail.expire_at) }}</dd>
            </div>
            <div>
              <dt>创建时间</dt>
              <dd>{{ formatDateTime(activeDetail.created_at) }}</dd>
            </div>
            <div>
              <dt>更新时间</dt>
              <dd>{{ formatDateTime(activeDetail.updated_at) }}</dd>
            </div>
          </dl>
          <section v-if="activeDetail.note" class="drawer-section">
            <h3>备注</h3>
            <p>{{ activeDetail.note }}</p>
          </section>
          <section v-if="activeDetail.history?.length" class="drawer-section">
            <h3>历史记录</h3>
            <ul class="history">
              <li v-for="entry in activeDetail.history" :key="entry.time">
                <span class="history__time">{{ formatDateTime(entry.time) }}</span>
                <span class="history__actor">{{ entry.actor }}</span>
                <span>{{ entry.action }}</span>
                <span v-if="entry.note" class="history__note">{{ entry.note }}</span>
              </li>
            </ul>
          </section>
        </div>
      </aside>
    </div>

    <Modal v-model="createModalVisible" @confirm="submitCreate">
      <template #title>新建名单条目</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>名单类型</span>
          <select v-model="createForm.type">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>主体类型</span>
          <select v-model="createForm.entity_type">
            <option v-for="option in entityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label>
          <span>主体值</span>
          <input v-model.trim="createForm.entity_value" placeholder="如 13800000000" />
        </label>
        <label>
          <span>备注</span>
          <textarea rows="3" v-model.trim="createForm.note" placeholder="可选" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="createModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitCreate">保存</Button>
      </template>
    </Modal>

    <Modal v-model="importModalVisible" @confirm="submitImport">
      <template #title>批量导入名单</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>文件名称</span>
          <input type="text" v-model.trim="importForm.file_name" placeholder="blacklist.csv" />
        </label>
        <label>
          <span>名单类型</span>
          <select v-model="importForm.type">
            <option v-for="option in typeOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="importModalVisible = false" :disabled="actionLoading">取消</Button>
        <Button variant="primary" :loading="actionLoading" @click="submitImport">上传</Button>
      </template>
    </Modal>

    <Modal v-model="dedupModalVisible" @confirm="() => (dedupModalVisible = false)">
      <template #title>去重预览</template>
      <section class="dedup-body" v-if="dedupPreview">
        <h4>重复 {{ dedupPreview.duplicates.length }} 项</h4>
        <ul>
          <li v-for="dup in dedupPreview.duplicates" :key="dup.entity_value">
            {{ dup.entity_value }} · 已存在（{{ typeLabel(dup.type) }}）
          </li>
        </ul>
        <h4>冲突 {{ dedupPreview.conflicts.length }} 项</h4>
        <ul>
          <li v-for="conflict in dedupPreview.conflicts" :key="conflict.entity_value">
            {{ conflict.entity_value }} · 已在 {{ typeLabel(conflict.existing_type) }}，导入为 {{ typeLabel(conflict.new_type) }}
          </li>
        </ul>
      </section>
      <template #footer>
        <Button variant="primary" @click="dedupModalVisible = false">关闭</Button>
      </template>
    </Modal>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import Table from '@/components/Table.vue';
import {
  RiskListsService,
  type RiskListDetail,
  type RiskListEntityType,
  type RiskListItem,
  type RiskListType,
  type RiskListDedupPreview,
  type RiskListImportTask
} from '@/sdk/risk';

const fallbackLists: RiskListItem[] = [
  {
    list_id: 'L202510030001',
    type: 'blacklist',
    entity_type: 'phone',
    entity_value: '13800000000',
    status: 'active',
    source: 'import',
    hit_count: 42,
    expire_at: '2026-10-03T00:00:00+08:00',
    note: '高风险号码',
    created_at: '2025-10-03T08:00:00+08:00',
    updated_at: '2025-10-03T09:30:00+08:00'
  },
  {
    list_id: 'L202510030002',
    type: 'whitelist',
    entity_type: 'store',
    entity_value: 'STORE-001',
    status: 'active',
    source: 'manual',
    hit_count: 3,
    note: '合作门店'
  },
  {
    list_id: 'L202510020001',
    type: 'greylist',
    entity_type: 'device',
    entity_value: 'DEV-9A7',
    status: 'active',
    source: 'api',
    hit_count: 15,
    expire_at: '2025-12-31T00:00:00+08:00',
    note: '待观察设备'
  },
  {
    list_id: 'L202509300001',
    type: 'blacklist',
    entity_type: 'id_number',
    entity_value: '4401***********1234',
    status: 'archived',
    source: 'import',
    hit_count: 8,
    note: '人工审核归档'
  }
];

const fallbackDetails: Record<string, RiskListDetail> = {
  L202510030001: {
    ...fallbackLists[0],
    history: [
      { time: '2025-10-03T09:30:00+08:00', action: 'review', actor: '林杉', note: '确认有效' },
      { time: '2025-10-03T08:00:00+08:00', action: 'import', actor: '系统', note: '批量导入' }
    ]
  }
};

const typeOptions = [
  { value: 'blacklist' as RiskListType, label: '黑名单' },
  { value: 'whitelist' as RiskListType, label: '白名单' },
  { value: 'greylist' as RiskListType, label: '灰名单' }
];

const entityOptions = [
  { value: 'phone' as RiskListEntityType, label: '手机号' },
  { value: 'id_number' as RiskListEntityType, label: '证件号' },
  { value: 'device' as RiskListEntityType, label: '设备' },
  { value: 'ip' as RiskListEntityType, label: 'IP' },
  { value: 'store' as RiskListEntityType, label: '门店' },
  { value: 'user' as RiskListEntityType, label: '用户' }
];

const columns = [
  { key: 'entity_value', title: '主体值' },
  { key: 'type', title: '名单类型', width: '6rem' },
  { key: 'entity_type', title: '主体类型', width: '6rem' },
  { key: 'status', title: '状态', width: '6rem' },
  { key: 'source', title: '来源', width: '6rem' },
  { key: 'hit_count', title: '命中次数', width: '6rem' },
  { key: 'expire_at', title: '有效期', width: '10rem' }
];

const lists = ref<RiskListItem[]>([]);
const filteredLists = ref<RiskListItem[]>([]);
const loading = ref(false);
const selectedListId = ref<string | null>(null);
const detailsCache = reactive<Record<string, RiskListDetail>>({});

const filters = reactive({ type: '' as RiskListType | '', entity_type: '' as RiskListEntityType | '', keyword: '' });

const createModalVisible = ref(false);
const importModalVisible = ref(false);
const dedupModalVisible = ref(false);
const actionLoading = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

const createForm = reactive({ type: 'blacklist' as RiskListType, entity_type: 'phone' as RiskListEntityType, entity_value: '', note: '' });
const importForm = reactive({ type: 'blacklist' as RiskListType, file_name: '' });
const importTask = ref<RiskListImportTask | null>(null);
const dedupPreview = ref<RiskListDedupPreview | null>(null);

onMounted(() => {
  loadLists();
});

async function loadLists() {
  loading.value = true;
  try {
    const response = await RiskListsService.list();
    const items = Array.isArray(response?.items) ? response.items : [];
    lists.value = items.length ? items : fallbackLists;
  } catch (err) {
    lists.value = fallbackLists;
    showError((err as Error).message || '加载名单失败');
  } finally {
    filteredLists.value = [...lists.value];
    loading.value = false;
  }
}

function applyFilters() {
  let items = [...lists.value];
  if (filters.type) items = items.filter((item) => item.type === filters.type);
  if (filters.entity_type) items = items.filter((item) => item.entity_type === filters.entity_type);
  if (filters.keyword) {
    const k = filters.keyword.toLowerCase();
    items = items.filter((item) => `${item.entity_value}${item.note ?? ''}`.toLowerCase().includes(k));
  }
  filteredLists.value = items;
}

function resetFilters() {
  filters.type = '';
  filters.entity_type = '';
  filters.keyword = '';
  applyFilters();
}

async function selectList(row: RiskListItem) {
  selectedListId.value = row.list_id;
  if (detailsCache[row.list_id]) return;
  try {
    const detail = await RiskListsService.getDetail(row.list_id);
    if (detail) {
      detailsCache[row.list_id] = detail;
    } else if (fallbackDetails[row.list_id]) {
      detailsCache[row.list_id] = fallbackDetails[row.list_id];
    }
  } catch (err) {
    if (fallbackDetails[row.list_id]) {
      detailsCache[row.list_id] = fallbackDetails[row.list_id];
    } else {
      showError((err as Error).message || '加载详情失败');
    }
  }
}

const activeDetail = computed(() => (selectedListId.value ? detailsCache[selectedListId.value] || fallbackDetails[selectedListId.value] || null : null));

function openCreateModal() {
  createForm.type = 'blacklist';
  createForm.entity_type = 'phone';
  createForm.entity_value = '';
  createForm.note = '';
  createModalVisible.value = true;
}

async function submitCreate() {
  if (!createForm.entity_value.trim()) {
    showError('请填写主体值');
    return;
  }
  actionLoading.value = true;
  try {
    const payload = { ...createForm };
    await RiskListsService.create(payload);
    const newItem: RiskListItem = {
      list_id: `LOCAL-${Date.now()}`,
      type: createForm.type,
      entity_type: createForm.entity_type,
      entity_value: createForm.entity_value.trim(),
      status: 'active',
      source: 'manual',
      note: createForm.note,
      hit_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    lists.value.unshift(newItem);
    filteredLists.value.unshift(newItem);
    detailsCache[newItem.list_id] = { ...newItem };
    showFeedback('已创建名单条目');
    createModalVisible.value = false;
  } catch (err) {
    showError((err as Error).message || '创建失败');
  } finally {
    actionLoading.value = false;
  }
}

function openImportModal() {
  importForm.file_name = '';
  importForm.type = 'blacklist';
  importModalVisible.value = true;
  importTask.value = null;
}

async function submitImport() {
  if (!importForm.file_name.trim()) {
    showError('请填写文件名称');
    return;
  }
  actionLoading.value = true;
  try {
    const task = await RiskListsService.import({ file_name: importForm.file_name.trim(), type: importForm.type });
    importTask.value = task;
    showFeedback('导入任务已提交');
    setTimeout(async () => {
      const result = await RiskListsService.getImportTask(task.task_id);
      importTask.value = result;
      showFeedback('导入完成');
    }, 1200);
    importModalVisible.value = false;
  } catch (err) {
    showError((err as Error).message || '导入失败');
  } finally {
    actionLoading.value = false;
  }
}

async function previewDedup() {
  actionLoading.value = true;
  try {
    const preview = await RiskListsService.previewDedup({ sample: 5 });
    dedupPreview.value = preview;
    dedupModalVisible.value = true;
  } catch (err) {
    showError((err as Error).message || '去重预览失败');
  } finally {
    actionLoading.value = false;
  }
}

function formatDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

function typeLabel(type: RiskListType) {
  return ({ blacklist: '黑名单', whitelist: '白名单', greylist: '灰名单' } as Record<RiskListType, string>)[type];
}

function entityLabel(entity: RiskListEntityType) {
  const map: Record<RiskListEntityType, string> = {
    phone: '手机号',
    id_number: '证件号',
    device: '设备',
    ip: 'IP',
    store: '门店',
    user: '用户'
  };
  return map[entity];
}

function statusLabel(status: 'active' | 'archived') {
  return status === 'active' ? '启用' : '已归档';
}

function sourceLabel(source: string) {
  return ({ manual: '人工', import: '导入', api: 'API' } as Record<string, string>)[source] || source;
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

.lists-view {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
}

.lists-view__toolbar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  gap: $spacing-16;
  flex-wrap: wrap;
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
  grid-template-columns: minmax(36rem, 1fr) minmax(22rem, 26rem);
  gap: $spacing-24;
}

.table-card {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-12;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.06);
}

.drawer {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 40rem;
}

.drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-16 $spacing-20;
  border-bottom: $border-width-1 solid $surface-200;
  h2 { margin: 0; font-size: $text-16-semibold-fs; }
  p { margin: 0; color: $text-muted; font-size: $text-12-regular-fs; }
}

.drawer__close {
  background: transparent;
  border: none;
  font-size: $text-16-semibold-fs;
  cursor: pointer;
  color: $text-muted;
}

.drawer__body {
  padding: $spacing-16 $spacing-20;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.drawer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  dt { font-size: $text-12-regular-fs; color: $text-muted; }
  dd { margin: 0; font-size: $text-14-regular-fs; }
}

.drawer-section {
  h3 { margin: 0 0 $spacing-8; font-size: $text-12-medium-fs; color: $text-muted; }
  p { margin: 0; font-size: $text-14-regular-fs; }
}

.history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $text-12-regular-fs;
}

.history__time { color: $text-muted; margin-right: $spacing-8; }
.history__note { color: $text-muted; margin-left: $spacing-8; }

.type-chip,
.status-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  font-weight: $text-12-medium-wt;
}

.type-chip[data-type='blacklist'] { background: rgba($color-danger-600, 0.18); color: $color-danger-600; }
.type-chip[data-type='whitelist'] { background: rgba($color-primary-200, 0.35); color: $color-primary-700; }
.type-chip[data-type='greylist'] { background: rgba($color-warning-strong, 0.18); color: $color-warning-strong; }

.status-chip[data-status='active'] { background: rgba($color-primary-700, 0.12); color: $color-primary-700; }
.status-chip[data-status='archived'] { background: rgba($color-surface-500, 0.18); color: $color-surface-500; }

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  select,
  input,
  textarea {
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-8 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.dedup-body {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  h4 { margin: 0; font-size: $text-12-medium-fs; color: $text-muted; }
  ul { margin: 0; padding-left: $spacing-16; }
}

.feedback { font-size: $text-12-regular-fs; color: $color-primary-700; }
.feedback--error { color: $color-danger-600; }

@media (max-width: 80rem) {
  .layout {
    grid-template-columns: 1fr;
  }
  .drawer { max-height: none; }
}
</style>
