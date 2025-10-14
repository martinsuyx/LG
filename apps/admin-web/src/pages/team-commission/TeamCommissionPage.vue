<template>
  <section class="team-commission">
    <header class="team-commission__header">
      <div>
        <h1 class="team-commission__title">团队佣金配置</h1>
        <p class="team-commission__subtitle">
          为团队成员配置活动套餐佣金，支持批量调整、导入导出与规则复制。
        </p>
      </div>
      <div class="team-commission__meta">
        <span class="meta__item">团队：{{ teamId }}</span>
        <span class="meta__item">配置完成度：{{ completionRateText }}</span>
      </div>
    </header>

    <form class="filters" @submit.prevent="reload">
      <label>
        <span>活动</span>
        <select v-model="filters.campaign_id" :disabled="loading.list">
          <option v-for="item in campaignOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>套餐</span>
        <select v-model="filters.plan_id" :disabled="loading.list">
          <option v-for="item in planOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label class="filters__search">
        <span>搜索成员</span>
        <input type="search" v-model.trim="filters.q" placeholder="姓名 / ID / 手机号" :disabled="loading.list" />
      </label>
      <Button size="sm" type="submit" :loading="loading.list">应用筛选</Button>
      <Button size="sm" variant="ghost" type="button" :disabled="loading.list" @click="resetFilters">重置</Button>
    </form>

    <section class="package-card">
      <div>
        <h2>{{ currentPlan?.name || '套餐' }}</h2>
        <p class="package-card__desc">默认佣金：{{ formatCommission(currentPlan?.default_commission) }}</p>
      </div>
      <dl class="package-card__caps">
        <div>
          <dt>上限</dt>
          <dd>{{ capsSummary }}</dd>
        </div>
        <div>
          <dt>覆盖策略</dt>
          <dd>{{ caps?.allow_override ? '允许覆盖' : '仅查看默认' }}</dd>
        </div>
      </dl>
    </section>

    <section class="toolbar">
      <div class="toolbar__actions">
        <Button size="sm" variant="secondary" :disabled="!canEditPlan || !selectedIds.length" @click="openBatchModal">批量设置</Button>
        <Button size="sm" variant="secondary" :disabled="!canEditPlan" @click="openImportModal">导入 Excel</Button>
        <Button size="sm" variant="ghost" :disabled="loading.list" @click="exportCurrent">导出当前配置</Button>
        <Button size="sm" variant="secondary" :disabled="!canEditPlan" @click="openCopyModal">复制规则</Button>
      </div>
      <div class="toolbar__info">
        <span>已选 {{ selectedIds.length }} 人</span>
      </div>
    </section>

    <p v-if="!canEditPlan" class="read-only-tip" role="note">当前角色暂无覆盖权限，列表仅供查看。</p>

    <section class="commission-table" role="region" aria-label="团队佣金列表">
      <table>
        <thead>
          <tr>
            <th class="col-select">
              <input
                type="checkbox"
                :checked="isPageSelected"
                :indeterminate="hasPartialPageSelection"
                @change="togglePageSelection"
                :disabled="loading.list || !canEditPlan || !pageSelectableIds.length"
              />
            </th>
            <th>成员</th>
            <th>职位</th>
            <th>当前佣金</th>
            <th>默认佣金</th>
            <th>上限</th>
            <th>覆盖来源</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody v-if="loading.list">
          <tr v-for="index in 6" :key="`loading-${index}`">
            <td :colspan="8" class="table-loading">加载中…</td>
          </tr>
        </tbody>
        <tbody v-else-if="rows.length">
          <tr v-for="row in rows" :key="row.member_id" :class="{ 'is-diff': row.isDiff }">
            <td class="col-select">
              <input
                type="checkbox"
                :value="row.member_id"
                :checked="selectedIds.includes(row.member_id)"
                :disabled="!isRowEditable(row)"
                @change="(event) => toggleSelection(event, row)"
              />
            </td>
            <td>
              <div class="member-cell">
                <strong>{{ row.member_name }}</strong>
                <span class="member-cell__id">{{ row.member_id }}</span>
              </div>
            </td>
            <td>{{ roleLabel(row.role) }}</td>
            <td :class="{ 'cell-diff': row.isDiff }">
              <span class="commission-value">{{ formatCommission(row.commission_effective) }}</span>
            </td>
            <td>{{ formatCommission(row.commission_default) }}</td>
            <td>{{ formatCaps(row.caps) }}</td>
            <td>{{ overrideLabel(row.override_source) }}</td>
            <td class="actions">
              <Button size="sm" variant="ghost" :disabled="!isRowEditable(row)" @click="openEditDrawer(row)">设置</Button>
              <Button
                size="sm"
                variant="ghost"
                :disabled="!isRowEditable(row) || !hasOverride(row)"
                @click="clearOverride(row)"
              >
                清除
              </Button>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="8" class="table-empty">暂无成员数据</td>
          </tr>
        </tbody>
      </table>
      <Pagination
        v-if="pageCount > 1"
        :page="filters.page"
        :pages="pageCount"
        :page-size="filters.page_size"
        @update:page="changePage"
        @update:pageSize="changePageSize"
      />
    </section>

    <aside class="drawer" v-if="drawer.visible" aria-label="佣金编辑">
      <header class="drawer__header">
        <div>
          <h2>设置佣金 · {{ drawer.member?.member_name }}</h2>
          <p>ID：{{ drawer.member?.member_id }}</p>
        </div>
        <button class="drawer__close" type="button" aria-label="关闭" @click="closeDrawer">×</button>
      </header>
      <div class="drawer__body" v-if="drawer.member">
        <div class="drawer__summary">
          <p><strong>默认佣金：</strong>{{ formatCommission(drawer.member.commission_default) }}</p>
          <p><strong>当前有效：</strong>{{ formatCommission(drawer.member.commission_effective) }}</p>
        </div>
        <CommissionField
          v-model="drawer.value"
          :max-percent="drawerCaps?.max ?? null"
          :min-percent="drawerCaps?.min ?? null"
          :allow-tier="true"
          :disabled="!isRowEditable(drawer.member)"
        />
      </div>
      <footer class="drawer__footer">
        <Button size="sm" variant="secondary" @click="closeDrawer">取消</Button>
        <Button
          size="sm"
          variant="primary"
          :loading="loading.override"
          :disabled="!drawer.value || !isRowEditable(drawer.member)"
          @click="saveDrawer"
        >
          保存
        </Button>
      </footer>
    </aside>

    <Modal v-model="batchModal.visible" @confirm="applyBatch">
      <template #title>批量设置佣金</template>
      <p class="modal-tip">已选择 {{ selectedIds.length }} 人，将统一使用以下佣金值：</p>
      <CommissionField
        v-model="batchModal.value"
        :max-percent="batchCaps?.max ?? null"
        :min-percent="batchCaps?.min ?? null"
        :disabled="!canEditPlan"
      />
      <template #footer>
        <Button variant="secondary" @click="batchModal.visible = false">取消</Button>
        <Button
          variant="primary"
          :loading="loading.batch"
          :disabled="!batchModal.value || !canEditPlan"
          @click="applyBatch"
        >
          应用
        </Button>
      </template>
    </Modal>

    <Modal v-model="importModal.visible" @confirm="submitImport">
      <template #title>导入 Excel</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>上传凭证或任务 ID</span>
          <input type="text" v-model.trim="importModal.token" placeholder="示例：upload-token-123" />
        </label>
        <label>
          <span>仅预检</span>
          <input type="checkbox" v-model="importModal.dryRun" />
        </label>
        <p class="modal-tip">模板下载请联系运营，Mock 阶段仅需填写 token。</p>
        <div v-if="importTask" class="import-status">
          <strong>任务 {{ importTask.task_id }}</strong>
          <p>状态：{{ importTask.status }}</p>
          <p v-if="importTask.message">{{ importTask.message }}</p>
          <p v-if="importTask.result_url"><a :href="importTask.result_url" target="_blank">下载结果</a></p>
        </div>
      </form>
      <template #footer>
        <Button variant="secondary" @click="importModal.visible = false">关闭</Button>
        <Button
          variant="primary"
          :loading="loading.import"
          :disabled="!importModal.token || !canEditPlan"
          @click="submitImport"
        >
          提交导入
        </Button>
      </template>
    </Modal>

    <Modal v-model="copyModal.visible" @confirm="applyCopy">
      <template #title>复制规则</template>
      <form class="modal-form" @submit.prevent>
        <label>
          <span>来源类型</span>
          <select v-model="copyModal.source.type">
            <option value="campaign">历史活动</option>
            <option value="team">其他团队</option>
            <option value="template">模板库</option>
          </select>
        </label>
        <label>
          <span>来源 ID</span>
          <input type="text" v-model.trim="copyModal.source.id" placeholder="例如 C202509" />
        </label>
        <Button
          variant="secondary"
          size="sm"
          :loading="loading.copyPreview"
          :disabled="!canEditPlan || !copyModal.source.id"
          @click="previewCopy"
        >
          预览差异
        </Button>
        <div v-if="copyModal.diffs.length" class="copy-preview" role="region" aria-label="复制差异预览">
          <p>将更新 {{ copyModal.diffs.length }} 人：</p>
          <ul>
            <li v-for="diff in copyModal.diffs" :key="diff.member_id">
              <strong>{{ diff.member_id }}</strong>
              <span>→ {{ formatCommission(diff.after) }}</span>
            </li>
          </ul>
        </div>
      </form>
      <template #footer>
        <Button variant="secondary" @click="copyModal.visible = false">取消</Button>
        <Button
          variant="primary"
          :loading="loading.copyApply"
          :disabled="!copyModal.diffs.length || !canEditPlan"
          @click="applyCopy"
        >
          应用规则
        </Button>
      </template>
    </Modal>

    <p v-if="feedback.message" :class="['feedback', feedback.error ? 'feedback--error' : '']" role="alert">{{ feedback.message }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';
import Pagination from '@/components/Pagination.vue';
import CommissionField, { type CommissionValue } from '@/components/CommissionField.vue';
import { TeamsService } from '@/sdk/teams';
import {
  CommissionService,
  type CommissionBatchOverrideRequest,
  type CommissionCopyResponse,
  type CommissionImportStatus,
  type CommissionOption,
  type TeamCommissionItem
} from '@/sdk/commission';

type SelectOption = { value: string; label: string };
type CommissionCaps = { max?: number | null; min?: number | null; allow_override?: boolean | null; summary?: string | null };

const route = useRoute();
const router = useRouter();

const teamId = computed(() => {
  const value = String(route.params.teamId || '').trim();
  return value.startsWith(':') ? '' : value;
});

const defaultCampaignOptions: SelectOption[] = [
  { value: 'C1', label: '九月新客拉新' },
  { value: 'C2', label: '十月复购激励' }
];

const defaultPlanOptions: SelectOption[] = [
  { value: 'P1', label: '尊享套餐' },
  { value: 'P2', label: '基础套餐' }
];

const campaignOptions = ref<SelectOption[]>([...defaultCampaignOptions]);
const planOptions = ref<SelectOption[]>([...defaultPlanOptions]);

const filters = reactive({
  campaign_id: (route.query.campaign_id as string) || campaignOptions.value[0]?.value || defaultCampaignOptions[0]?.value || '',
  plan_id: (route.query.plan_id as string) || planOptions.value[0]?.value || defaultPlanOptions[0]?.value || '',
  q: (route.query.q as string) || '',
  page: Number(route.query.page) || 1,
  page_size: Number(route.query.page_size) || 50
});

const rows = ref<Array<TeamCommissionItem & { isDiff: boolean }>>([]);
const total = ref(0);
const caps = ref<CommissionCaps | null>(null);
const currentPlan = ref<{ id: string; name: string; default_commission?: CommissionValue } | null>(null);
const completionRate = ref(0);

const selectedIds = ref<string[]>([]);
const drawer = reactive<{ visible: boolean; member: TeamCommissionItem | null; value: CommissionValue | null }>({
  visible: false,
  member: null,
  value: null
});
const batchModal = reactive<{ visible: boolean; value: CommissionValue | null }>({ visible: false, value: null });
const importModal = reactive<{ visible: boolean; token: string; dryRun: boolean }>({
  visible: false,
  token: '',
  dryRun: false
});
const copyModal = reactive<{ visible: boolean; source: { type: 'campaign' | 'team' | 'template'; id: string }; diffs: CommissionCopyResponse['diffs'] }>({
  visible: false,
  source: { type: 'campaign', id: filters.campaign_id || defaultCampaignOptions[0]?.value || '' },
  diffs: []
});
const importTask = ref<CommissionImportStatus | null>(null);

const loading = reactive({
  list: false,
  override: false,
  batch: false,
  import: false,
  copyPreview: false,
  copyApply: false
});

const feedback = reactive<{ message: string; error: boolean }>({ message: '', error: false });

const userRoles = ref<string[]>(['admin']);
const canEdit = computed(() => ['admin', 'org_admin', 'team_lead'].some((role) => userRoles.value.includes(role)));
const allowPlanOverride = computed(() => {
  const allow = caps.value?.allow_override;
  if (allow === false) {
    return userRoles.value.includes('admin');
  }
  return true;
});
const canEditPlan = computed(() => canEdit.value && allowPlanOverride.value);

const capsSummary = computed(() => {
  const planCaps = caps.value;
  if (!planCaps) return '—';
  if (planCaps.summary) return planCaps.summary;
  const parts: string[] = [];
  if (planCaps.min != null) parts.push(`≥${planCaps.min}%`);
  if (planCaps.max != null) parts.push(`≤${planCaps.max}%`);
  return parts.length ? parts.join('，') : '无限制';
});

const completionRateText = computed(() => `${Math.round(completionRate.value * 100)}%`);
const pageCount = computed(() => Math.max(1, Math.ceil(total.value / filters.page_size)));
const selectedRows = computed(() => rows.value.filter((row) => selectedIds.value.includes(row.member_id)));
const drawerCaps = computed<CommissionCaps | null>(() => getEffectiveCaps(drawer.member));
const batchCaps = computed<CommissionCaps | null>(() => {
  if (!selectedRows.value.length) return caps.value;
  let min: number | null = null;
  let max: number | null = null;
  selectedRows.value.forEach((row) => {
    const local = getEffectiveCaps(row);
    if (!local) return;
    if (local.min != null) min = min == null ? local.min : Math.max(min, local.min);
    if (local.max != null) max = max == null ? local.max : Math.min(max, local.max);
  });
  if (min == null) min = caps.value?.min ?? null;
  if (max == null) max = caps.value?.max ?? null;
  return {
    min,
    max,
    allow_override: caps.value?.allow_override ?? true,
    summary: caps.value?.summary ?? null
  };
});
const pageSelectableIds = computed(() => rows.value.filter((row) => isRowEditable(row)).map((row) => row.member_id));
const isPageSelected = computed(() => pageSelectableIds.value.length > 0 && pageSelectableIds.value.every((id) => selectedIds.value.includes(id)));
const hasPartialPageSelection = computed(() => {
  const ids = pageSelectableIds.value;
  if (!ids.length) return false;
  const count = ids.filter((id) => selectedIds.value.includes(id)).length;
  return count > 0 && count < ids.length;
});

let ensuringTeamContext: Promise<void> | null = null;
const pollTimers = new Set<number>();
let feedbackTimer: number | null = null;

watch(
  () => teamId.value,
  (value) => {
    if (!value) {
      void ensureTeamContext();
      return;
    }
    loadCommissions();
  },
  { immediate: true }
);

watch(
  () => ({ ...filters }),
  (next) => {
    router.replace({
      params: route.params,
      query: {
        campaign_id: next.campaign_id || undefined,
        plan_id: next.plan_id || undefined,
        q: next.q || undefined,
        page: next.page > 1 ? String(next.page) : undefined,
        page_size: next.page_size !== 50 ? String(next.page_size) : undefined
      }
    });
  },
  { deep: true }
);

watch(
  () => [filters.campaign_id, filters.plan_id, filters.page_size],
  () => {
    filters.page = 1;
    if (teamId.value) {
      loadCommissions();
    }
  }
);

watch(
  () => filters.page,
  () => {
    if (teamId.value) {
      loadCommissions();
    }
  }
);

watch(
  () => filters.campaign_id,
  (next) => {
    if (!copyModal.visible) {
      copyModal.source.id = next;
    }
  }
);

onBeforeUnmount(() => {
  clearFeedback();
  if (typeof window !== 'undefined') {
    pollTimers.forEach((timer) => window.clearTimeout(timer));
  }
  pollTimers.clear();
});

async function ensureTeamContext(): Promise<void> {
  if (teamId.value) return;
  if (ensuringTeamContext) return ensuringTeamContext;
  ensuringTeamContext = (async () => {
    try {
      const { teams } = await TeamsService.listTeams();
      const fallback = teams?.[0];
      if (fallback?.team_id) {
        ensureFilterChoices();
        await router.replace({
          name: 'team-commission',
          params: { teamId: fallback.team_id },
          query: {
            ...route.query,
            campaign_id: filters.campaign_id || undefined,
            plan_id: filters.plan_id || undefined,
            q: filters.q || undefined,
            page: filters.page > 1 ? String(filters.page) : undefined,
            page_size: filters.page_size !== 50 ? String(filters.page_size) : undefined
          }
        });
      } else {
        showError('暂无团队数据，请先创建团队');
        await router.replace({ path: '/org/teams' });
      }
    } catch (error) {
      showError((error as Error).message || '加载团队失败');
      await router.replace({ path: '/org/teams' });
    } finally {
      ensuringTeamContext = null;
    }
  })();
  return ensuringTeamContext;
}

function ensureFilterChoices() {
  if (!campaignOptions.value.length) {
    campaignOptions.value = [...defaultCampaignOptions];
  }
  if (!planOptions.value.length) {
    planOptions.value = [...defaultPlanOptions];
  }
  if (!campaignOptions.value.some((option) => option.value === filters.campaign_id)) {
    const fallback = campaignOptions.value[0] || defaultCampaignOptions[0];
    filters.campaign_id = fallback ? fallback.value : '';
  }
  if (!planOptions.value.some((option) => option.value === filters.plan_id)) {
    const fallback = planOptions.value[0] || defaultPlanOptions[0];
    filters.plan_id = fallback ? fallback.value : '';
  }
}

function reload() {
  ensureFilterChoices();
  filters.page = 1;
  loadCommissions();
}

function resetFilters() {
  ensureFilterChoices();
  filters.campaign_id = campaignOptions.value[0]?.value || defaultCampaignOptions[0]?.value || '';
  filters.plan_id = planOptions.value[0]?.value || defaultPlanOptions[0]?.value || '';
  filters.q = '';
  filters.page = 1;
  filters.page_size = 50;
  loadCommissions();
}

async function loadCommissions() {
  if (!teamId.value) return;
  loading.list = true;
  try {
    const params = {
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      page: filters.page,
      page_size: filters.page_size,
      q: filters.q
    };
    const data = await CommissionService.listTeamCommissions(teamId.value, params);
    mergeSelectOptions(campaignOptions, data.campaign_options, data.campaign);
    mergeSelectOptions(planOptions, data.plan_options, data.plan);
    ensureFilterChoices();
    const items = Array.isArray(data.items) ? data.items : [];
    rows.value = items.map((item) => {
      const rowCaps = item.caps ?? data.rule_caps ?? null;
      return {
        ...item,
        caps: rowCaps || undefined,
        isDiff: !isSameCommission(item.commission_default, item.commission_effective)
      };
    });
    total.value = data.total ?? rows.value.length;
    completionRate.value =
      typeof data.completion_rate === 'number'
        ? data.completion_rate
        : rows.value.length
          ? rows.value.filter((row) => hasOverride(row)).length / rows.value.length
          : 0;
    caps.value = data.rule_caps ? { ...data.rule_caps } : null;
    currentPlan.value = data.plan ? { ...data.plan } : null;
    selectedIds.value = selectedIds.value.filter((id) => {
      const row = rows.value.find((item) => item.member_id === id);
      return row ? isRowEditable(row) : false;
    });
    clearFeedback();
  } catch (error) {
    showError((error as Error).message || '加载佣金数据失败');
    rows.value = [];
    total.value = 0;
  } finally {
    loading.list = false;
  }
}

function changePage(page: number) {
  filters.page = page;
}

function changePageSize(size: number) {
  filters.page_size = size;
  filters.page = 1;
}

function toggleSelection(event: Event, row: TeamCommissionItem) {
  if (!isRowEditable(row)) return;
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    if (!selectedIds.value.includes(row.member_id)) {
      selectedIds.value = [...selectedIds.value, row.member_id];
    }
  } else {
    selectedIds.value = selectedIds.value.filter((value) => value !== row.member_id);
  }
}

function togglePageSelection(event: Event) {
  const checked = (event.target as HTMLInputElement).checked;
  if (checked) {
    selectedIds.value = Array.from(new Set([...selectedIds.value, ...pageSelectableIds.value]));
  } else {
    selectedIds.value = selectedIds.value.filter((id) => !pageSelectableIds.value.includes(id));
  }
}

function openEditDrawer(row: TeamCommissionItem) {
  if (!isRowEditable(row)) {
    showError('当前成员不可编辑');
    return;
  }
  drawer.visible = true;
  drawer.member = row;
  const base = row.commission_override ?? row.commission_effective ?? row.commission_default;
  drawer.value = cloneCommission(base);
}

function closeDrawer() {
  drawer.visible = false;
  drawer.member = null;
  drawer.value = null;
}

async function saveDrawer() {
  if (!drawer.member || !drawer.value) return;
  if (!isRowEditable(drawer.member)) {
    showError('当前成员不可编辑');
    return;
  }
  if (!validateCommissionValue(drawer.value, getEffectiveCaps(drawer.member), `成员 ${drawer.member.member_name}`)) {
    return;
  }
  loading.override = true;
  try {
    await CommissionService.saveOverride({
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      entity_type: 'promoter',
      entity_id: drawer.member.member_id,
      commission: drawer.value
    });
    closeDrawer();
    loadCommissions();
    showFeedback('已保存覆盖佣金');
  } catch (error) {
    showError((error as Error).message || '保存覆盖失败');
  } finally {
    loading.override = false;
  }
}

async function clearOverride(row: TeamCommissionItem) {
  if (!isRowEditable(row)) {
    showError('当前成员不可编辑');
    return;
  }
  if (!hasOverride(row)) {
    showError('当前成员暂无覆盖可清除');
    return;
  }
  try {
    await CommissionService.deleteOverride({
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      entity_type: 'promoter',
      entity_id: row.member_id
    });
    showFeedback('已清除覆盖');
    loadCommissions();
  } catch (error) {
    showError((error as Error).message || '清除失败');
  }
}

function openBatchModal() {
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  if (!selectedRows.value.length) {
    showError('请先勾选成员');
    return;
  }
  const seed =
    selectedRows.value[0]?.commission_override ??
    selectedRows.value[0]?.commission_effective ??
    selectedRows.value[0]?.commission_default ??
    currentPlan.value?.default_commission ??
    { type: 'percent', value: 0 };
  batchModal.value = cloneCommission(seed);
  batchModal.visible = true;
}

async function applyBatch() {
  if (!batchModal.value || !selectedRows.value.length) return;
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  for (const row of selectedRows.value) {
    if (!isRowEditable(row)) continue;
    if (!validateCommissionValue(batchModal.value, getEffectiveCaps(row), `成员 ${row.member_name}`)) {
      return;
    }
  }
  loading.batch = true;
  try {
    const payload: CommissionBatchOverrideRequest = {
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      entity_type: 'promoter',
      items: selectedRows.value.map((row) => ({ entity_id: row.member_id, commission: batchModal.value as CommissionValue }))
    };
    await CommissionService.batchOverride(payload);
    batchModal.visible = false;
    showFeedback('批量设置已提交');
    loadCommissions();
  } catch (error) {
    showError((error as Error).message || '批量设置失败');
  } finally {
    loading.batch = false;
  }
}

function openImportModal() {
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  importModal.visible = true;
  importModal.token = '';
  importModal.dryRun = false;
  importTask.value = null;
}

async function submitImport() {
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  if (!importModal.token) {
    showError('请填写上传凭证');
    return;
  }
  loading.import = true;
  try {
    const response = await CommissionService.uploadImport({
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      team_id: teamId.value,
      token: importModal.token,
      dry_run: importModal.dryRun
    });
    importTask.value = { task_id: response.task_id, status: 'uploaded' };
    pollImportTask(response.task_id);
    showFeedback('导入任务已提交');
  } catch (error) {
    showError((error as Error).message || '导入失败');
  } finally {
    loading.import = false;
  }
}

async function pollImportTask(taskId: string) {
  try {
    const status = await CommissionService.getImportStatus(taskId);
    importTask.value = status;
    if (status.status && ['uploaded', 'validating', 'accepted', 'processing'].includes(status.status)) {
      if (typeof window !== 'undefined') {
        const timer = window.setTimeout(() => {
          pollTimers.delete(timer);
          void pollImportTask(taskId);
        }, 1500);
        pollTimers.add(timer);
      }
    } else if (status.status === 'succeeded') {
      loadCommissions();
    }
  } catch (error) {
    showError((error as Error).message || '获取导入进度失败');
  }
}

function openCopyModal() {
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  copyModal.visible = true;
  copyModal.source = { type: 'campaign', id: filters.campaign_id };
  copyModal.diffs = [];
}

async function previewCopy() {
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  if (!copyModal.source.id) {
    showError('请填写来源 ID');
    return;
  }
  loading.copyPreview = true;
  try {
    const response = await CommissionService.copyFrom({
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      target_team_id: teamId.value,
      source: copyModal.source,
      preview: true
    });
    copyModal.diffs = response.diffs || [];
    if (!copyModal.diffs.length) {
      showFeedback('无差异可应用');
    }
  } catch (error) {
    showError((error as Error).message || '预览失败');
  } finally {
    loading.copyPreview = false;
  }
}

async function applyCopy() {
  if (!canEditPlan.value) {
    showError('当前套餐不允许覆盖');
    return;
  }
  if (!copyModal.source.id || !copyModal.diffs.length) {
    showError('请先预览差异');
    return;
  }
  loading.copyApply = true;
  try {
    await CommissionService.copyFrom({
      campaign_id: filters.campaign_id,
      plan_id: filters.plan_id,
      target_team_id: teamId.value,
      source: copyModal.source,
      preview: false
    });
    copyModal.visible = false;
    showFeedback('规则已复制应用');
    loadCommissions();
  } catch (error) {
    showError((error as Error).message || '复制失败');
  } finally {
    loading.copyApply = false;
  }
}

function exportCurrent() {
  showFeedback('已触发导出任务（Mock）');
}

function mergeSelectOptions(target: typeof campaignOptions, incoming?: CommissionOption[] | null, current?: { id?: string; name?: string }) {
  const combined: SelectOption[] = [];
  if (current?.id) {
    combined.push(toSelectOption(current.id, current.name));
  }
  if (incoming?.length) {
    incoming.forEach((item) => {
      if (item && item.id) {
        combined.push(toSelectOption(item.id, item.name));
      }
    });
  }
  if (!combined.length) return;
  const seen = new Set<string>();
  const merged: SelectOption[] = [];
  [...combined, ...target.value].forEach((option) => {
    if (!option.value || seen.has(option.value)) return;
    seen.add(option.value);
    merged.push(option);
  });
  target.value = merged;
}

function toSelectOption(id: string, name?: string): SelectOption {
  return { value: id, label: typeof name === 'string' && name.trim() ? name : id };
}

function getEffectiveCaps(row?: TeamCommissionItem | null): CommissionCaps | null {
  return row?.caps ?? caps.value ?? null;
}

function isRowEditable(row: TeamCommissionItem | null): boolean {
  if (!canEdit.value) return false;
  if (!row) return canEditPlan.value;
  const allow = row.caps?.allow_override;
  if (allow === false) {
    return userRoles.value.includes('admin');
  }
  if (allow === true) return true;
  return canEditPlan.value;
}

function hasOverride(row: TeamCommissionItem | null): boolean {
  if (!row) return false;
  if (row.commission_override) return true;
  const source = row.override_source;
  return Boolean(source && source !== 'default');
}

function validateCommissionValue(value: CommissionValue | null, limit: CommissionCaps | null, context: string): boolean {
  if (!value) {
    showError(`${context}的佣金值无效`);
    return false;
  }
  if (!limit) return true;
  if (value.type === 'percent') {
    if (limit.max != null && value.value > limit.max) {
      showError(`${context}佣金不得超过 ${limit.max}%`);
      return false;
    }
    if (limit.min != null && value.value < limit.min) {
      showError(`${context}佣金不得低于 ${limit.min}%`);
      return false;
    }
  }
  return true;
}

function formatCommission(value?: CommissionValue | null) {
  if (!value) return '—';
  if (value.type === 'percent') return `${value.value}%`;
  if (value.type === 'fixed') return `${value.value}${value.currency || '¥'}`;
  if (value.type === 'tier') return `${value.tiers.length} 阶梯`;
  return '—';
}

function roleLabel(role: string) {
  const map: Record<string, string> = {
    promoter: '推广员',
    store_owner: '门店负责人',
    staff: '运营人员',
    lead: '负责人',
    viewer: '访客'
  };
  return map[role] || role;
}

function overrideLabel(source?: string | null) {
  if (!source || source === 'default') return '默认';
  const map: Record<string, string> = {
    promoter: '成员覆盖',
    team: '团队覆盖',
    store: '门店覆盖',
    city: '城市覆盖',
    company: '公司覆盖'
  };
  return map[source] || source;
}

function formatCaps(value?: CommissionCaps | null) {
  const target = value ?? caps.value;
  if (!target) return '—';
  if (target.summary) return target.summary;
  const pieces: string[] = [];
  if (target.min != null) pieces.push(`≥${target.min}%`);
  if (target.max != null) pieces.push(`≤${target.max}%`);
  return pieces.length ? pieces.join('，') : '无限制';
}

function isSameCommission(a?: CommissionValue | null, b?: CommissionValue | null) {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function cloneCommission(value?: CommissionValue | null): CommissionValue {
  if (!value) return { type: 'percent', value: 0 };
  return JSON.parse(JSON.stringify(value));
}

function setFeedback(message: string, error: boolean, duration: number) {
  feedback.message = message;
  feedback.error = error;
  if (typeof window === 'undefined') return;
  if (feedbackTimer != null) {
    window.clearTimeout(feedbackTimer);
  }
  feedbackTimer = window.setTimeout(() => {
    if (feedback.message === message) {
      feedback.message = '';
      feedback.error = false;
    }
    feedbackTimer = null;
  }, duration);
}

function showFeedback(message: string) {
  setFeedback(message, false, 3000);
}

function showError(message: string) {
  setFeedback(message, true, 5000);
}

function clearFeedback() {
  feedback.message = '';
  feedback.error = false;
  if (typeof window !== 'undefined' && feedbackTimer != null) {
    window.clearTimeout(feedbackTimer);
  }
  feedbackTimer = null;
}
</script>


<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.team-commission {
  display: flex;
  flex-direction: column;
  gap: $spacing-20;
  color: $text-strong;
}

.team-commission__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.team-commission__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
}

.team-commission__subtitle {
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.team-commission__meta {
  display: flex;
  gap: $spacing-12;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, max-content));
  gap: $spacing-12;
  align-items: end;
  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
    select,
    input {
      border: $border-width-1 solid $surface-200;
      border-radius: $radius-lg;
      padding: $spacing-8 $spacing-12;
      font: inherit;
      color: $text-strong;
    }
  }
}

.filters__search {
  min-width: 18rem;
}

.package-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-12;
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-16 $spacing-20;
  box-shadow: 0 16px 36px rgba($color-surface-700, 0.08);
}

.package-card__desc {
  margin: calc(#{$spacing-8} / 2) 0 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.package-card__caps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: $spacing-12;
  margin: 0;
  padding: 0;
  dt {
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }
  dd {
    margin: 0;
    font-size: $text-14-regular-fs;
  }
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: $spacing-12;
}

.toolbar__actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.toolbar__info {
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.read-only-tip {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  background: rgba($color-warning-soft, 0.2);
  color: $color-warning-700;
  font-size: $text-12-regular-fs;
}

.commission-table {
  background: $surface-0;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-xl;
  padding: $spacing-16;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  overflow-x: auto;
}

.commission-table table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
}

.commission-table th,
.commission-table td {
  padding: $spacing-12;
  border-bottom: $border-width-1 solid $surface-200;
  text-align: left;
  font-size: $text-12-regular-fs;
}

.commission-table tbody tr:last-child td {
  border-bottom: none;
}

.col-select {
  width: 2.5rem;
}

.member-cell {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 4);
}

.member-cell__id {
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.commission-value {
  font-weight: $text-12-medium-wt;
}

.commission-table tr.is-diff {
  background: rgba($color-warning-soft, 0.18);
}

.cell-diff {
  background: rgba($color-warning-soft, 0.28);
}

.cell-diff .commission-value {
  color: $color-warning-700;
}

.table-loading,
.table-empty {
  text-align: center;
  color: $text-muted;
}

.actions {
  display: flex;
  gap: $spacing-8;
}

.drawer {
  position: fixed;
  right: 0;
  top: 0;
  bottom: 0;
  width: min(32rem, 90vw);
  background: $surface-0;
  border-left: $border-width-1 solid $surface-200;
  box-shadow: -14px 0 36px rgba($color-surface-700, 0.2);
  display: flex;
  flex-direction: column;
  z-index: $z-dialog;
}

.drawer__header {
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

.drawer__close {
  background: transparent;
  border: none;
  font-size: $text-16-semibold-fs;
  color: $text-muted;
  cursor: pointer;
}

.drawer__body {
  flex: 1;
  overflow-y: auto;
  padding: $spacing-20;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.drawer__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  p {
    margin: 0;
    font-size: $text-12-regular-fs;
  }
}

.drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-12;
  padding: $spacing-16 $spacing-20;
  border-top: $border-width-1 solid $surface-200;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
  label {
    display: flex;
    align-items: center;
    gap: $spacing-8;
    font-size: $text-12-regular-fs;
    color: $text-muted;
    input,
    select {
      flex: 1;
      border: $border-width-1 solid $surface-200;
      border-radius: $radius-lg;
      padding: $spacing-8 $spacing-12;
      font: inherit;
    }
  }
}

.modal-form input[type='checkbox'] {
  flex: initial;
}

.modal-tip {
  margin: 0;
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.import-status {
  margin-top: $spacing-12;
  font-size: $text-12-regular-fs;
  color: $text-muted;
  strong {
    display: block;
    margin-bottom: calc(#{$spacing-8} / 2);
  }
}

.copy-preview {
  max-height: 12rem;
  overflow: auto;
  padding: $spacing-12;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  background: $surface-50;
  font-size: $text-12-regular-fs;
  ul {
    margin: $spacing-8 0 0;
    padding-left: $spacing-16;
  }
  li {
    margin-bottom: calc(#{$spacing-8} / 2);
  }
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  background: rgba($primary-100, 0.6);
  color: $primary-700;
  font-size: $text-12-regular-fs;
}

.feedback--error {
  background: rgba($danger-600, 0.12);
  color: $danger-700;
}

@media (max-width: 64rem) {
  .team-commission__header {
    flex-direction: column;
    align-items: flex-start;
  }

  .toolbar {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
