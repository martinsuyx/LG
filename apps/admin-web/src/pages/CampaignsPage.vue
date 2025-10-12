<template>
  <section class="campaigns">
    <header class="campaigns__head">
      <div>
        <h1 class="campaigns__title">活动管理</h1>
        <p class="campaigns__subtitle">配置套餐、适用范围与计佣规则，支持草稿、发布、复制与导出。</p>
      </div>
      <div class="campaigns__actions">
        <button type="button" class="btn btn--ghost" @click="handleExport" :disabled="loading || exporting">
          {{ exporting ? '导出中…' : '导出到导出中心' }}
        </button>
        <button type="button" class="btn" @click="openCreateDrawer" :disabled="loading">新建活动</button>
      </div>
    </header>

    <form class="campaigns__filters" @submit.prevent="applyFilters">
      <div class="filters__row">
        <label class="filters__field">
          <span>状态</span>
          <select class="input" v-model="filters.status">
            <option value="">全部</option>
            <option v-for="option in statusFilterOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__field">
          <span>城市</span>
          <select class="input" v-model="filters.city">
            <option value="">全部</option>
            <option v-for="option in cityOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__field">
          <span>渠道</span>
          <select class="input" v-model="filters.channel">
            <option value="">全部</option>
            <option v-for="option in channelOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
          </select>
        </label>
        <label class="filters__field filters__field--keyword">
          <span>关键词</span>
          <input class="input" type="text" v-model.trim="filters.keyword" placeholder="名称 / 活动码" />
        </label>
        <label class="filters__field">
          <span>排序字段</span>
          <select class="input" v-model="filters.sort_key">
            <option value="start_time">开始时间</option>
            <option value="end_time">结束时间</option>
            <option value="name">名称</option>
          </select>
        </label>
        <label class="filters__field">
          <span>排序方向</span>
          <select class="input" v-model="filters.sort_order">
            <option value="desc">降序</option>
            <option value="asc">升序</option>
          </select>
        </label>
      </div>
      <div class="filters__actions">
        <button type="submit" class="btn" :disabled="loading">应用筛选</button>
        <button type="button" class="btn btn--ghost" @click="resetFilters" :disabled="loading">重置</button>
      </div>
    </form>

    <div class="campaigns__table">
      <table>
        <thead>
          <tr>
            <th>活动名称</th>
            <th>活动码</th>
            <th>状态</th>
            <th>有效期</th>
            <th>适用范围</th>
            <th>渠道</th>
            <th>提交 / 审核 / 结清</th>
            <th class="col-actions">操作</th>
          </tr>
        </thead>
        <tbody v-if="loading">
          <tr v-for="index in 4" :key="`loading-${index}`">
            <td :colspan="8" class="table-skeleton"></td>
          </tr>
        </tbody>
        <tbody v-else-if="campaigns.length">
          <tr v-for="item in campaigns" :key="item.campaign_id">
            <td>
              <button type="button" class="link-btn" @click="openViewDrawer(item)">{{ item.name }}</button>
            </td>
            <td>{{ item.code }}</td>
            <td>
              <span class="status-tag" :data-status="item.status">{{ statusLabel(item.status) }}</span>
            </td>
            <td>{{ formatDateRange(item.start_time, item.end_time) }}</td>
            <td>{{ formatScopeSummary(item.scope) }}</td>
            <td>{{ formatChannels(item.channels) }}</td>
            <td>
              <span class="metric">{{ item.metrics?.submitted ?? 0 }}</span>
              /
              <span class="metric">{{ item.metrics?.approved ?? 0 }}</span>
              /
              <span class="metric">{{ item.metrics?.settled ?? 0 }}</span>
            </td>
            <td class="col-actions">
              <div class="row-actions">
                <button type="button" class="link-btn" @click="openEditDrawer(item)" :disabled="!canEditStatus(item.status)">
                  编辑
                </button>
                <button
                  type="button"
                  class="link-btn"
                  @click="handlePublish(item)"
                  :disabled="!canPublishStatus(item.status) || actionLoading"
                >
                  发布
                </button>
                <button
                  type="button"
                  class="link-btn"
                  @click="prepareOffline(item)"
                  :disabled="item.status !== 'published' || actionLoading"
                >
                  下架
                </button>
                <button type="button" class="link-btn" @click="handleClone(item)" :disabled="actionLoading">复制</button>
              </div>
            </td>
          </tr>
        </tbody>
        <tbody v-else>
          <tr>
            <td :colspan="8" class="empty">暂无符合条件的活动</td>
          </tr>
        </tbody>
      </table>
    </div>

    <footer class="campaigns__pager" v-if="pageCount > 1">
      <button type="button" class="btn btn--ghost" :disabled="filters.page <= 1 || loading" @click="changePage(filters.page - 1)">上一页</button>
      <span>第 {{ filters.page }} / {{ pageCount }} 页</span>
      <button type="button" class="btn btn--ghost" :disabled="filters.page >= pageCount || loading" @click="changePage(filters.page + 1)">下一页</button>
      <label class="pager__size">
        <span>每页</span>
        <select class="input" :value="filters.page_size" @change="changePageSize($event)">
          <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <span>共 {{ total }} 条</span>
    </footer>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>

    <div v-if="drawerVisible" class="campaigns-drawer">
      <div class="campaigns-drawer__backdrop" @click="closeDrawer" />
      <aside class="campaigns-drawer__panel" role="dialog" aria-modal="true">
        <header class="campaigns-drawer__header">
          <div class="drawer-title">
            <h2>{{ drawerTitle }}</h2>
            <span class="status-tag" :data-status="currentStatus">{{ statusLabel(currentStatus) }}</span>
          </div>
          <div class="drawer-actions">
            <button v-if="drawerMode === 'view' && canEditStatus(currentStatus)" type="button" class="btn btn--ghost" @click="switchToEdit">
              编辑草稿
            </button>
            <button
              v-if="drawerMode !== 'create' && canPublishStatus(currentStatus)"
              type="button"
              class="btn"
              @click="publishFromDrawer"
              :disabled="drawerSaving || actionLoading"
            >
              {{ actionLoading ? '发布中…' : '发布' }}
            </button>
            <button
              v-if="drawerMode !== 'create' && currentStatus === 'published'"
              type="button"
              class="btn btn--ghost"
              @click="prepareOfflineFromDrawer"
              :disabled="actionLoading"
            >
              下架
            </button>
            <button
              v-if="drawerMode !== 'create'"
              type="button"
              class="btn btn--ghost"
              @click="cloneFromDrawer"
              :disabled="actionLoading"
            >
              复制
            </button>
            <button type="button" class="btn btn--ghost" @click="closeDrawer">关闭</button>
          </div>
        </header>

        <nav class="campaigns-drawer__steps">
          <button
            v-for="(step, index) in steps"
            :key="step.key"
            type="button"
            class="drawer-step"
            :data-active="index === activeStep"
            :disabled="!canJumpTo(index)"
            @click="jumpTo(index)"
          >
            <span class="drawer-step__index">{{ index + 1 }}</span>
            <span>{{ step.label }}</span>
          </button>
        </nav>

        <section class="campaigns-drawer__body">
          <div v-if="currentStep.key === 'basic'" class="step-block">
            <div class="form-grid">
              <label class="form-field" :data-error="basicErrors.name">
                <span>活动名称<em>*</em></span>
                <input class="input" type="text" v-model.trim="form.name" :disabled="isReadOnly" placeholder="2-40 字" />
                <span v-if="basicErrors.name" class="form-error">{{ basicErrors.name }}</span>
              </label>
              <label class="form-field" :data-error="basicErrors.code">
                <span>活动码<em>*</em></span>
                <input class="input" type="text" v-model="form.code" :disabled="isReadOnly" placeholder="大写字母数字" />
                <span v-if="basicErrors.code" class="form-error">{{ basicErrors.code }}</span>
              </label>
              <label class="form-field full" :data-error="basicErrors.desc">
                <span>活动描述</span>
                <textarea class="textarea" rows="3" v-model.trim="form.desc" :disabled="isReadOnly" placeholder="不超过 200 字" />
              </label>
              <label class="form-field" :data-error="basicErrors.start_time">
                <span>开始时间<em>*</em></span>
                <input class="input" type="datetime-local" v-model="form.start_time" :disabled="isReadOnly" />
                <span v-if="basicErrors.start_time" class="form-error">{{ basicErrors.start_time }}</span>
              </label>
              <label class="form-field" :data-error="basicErrors.end_time">
                <span>结束时间<em>*</em></span>
                <input class="input" type="datetime-local" v-model="form.end_time" :disabled="isReadOnly" />
                <span v-if="basicErrors.end_time" class="form-error">{{ basicErrors.end_time }}</span>
              </label>
              <fieldset class="form-field full" :data-error="basicErrors.channels">
                <legend>适用渠道<em>*</em></legend>
                <div class="checkbox-group">
                  <label v-for="option in channelOptions" :key="option.value">
                    <input type="checkbox" :value="option.value" v-model="form.channels" :disabled="isReadOnly" />
                    {{ option.label }}
                  </label>
                </div>
                <span v-if="basicErrors.channels" class="form-error">{{ basicErrors.channels }}</span>
              </fieldset>
              <fieldset class="form-field full">
                <legend>可见角色</legend>
                <div class="checkbox-group">
                  <label v-for="option in roleOptions" :key="option.value">
                    <input type="checkbox" :value="option.value" v-model="form.visible_to_roles" :disabled="isReadOnly" />
                    {{ option.label }}
                  </label>
                </div>
              </fieldset>
              <label class="form-field form-field--switch">
                <input type="checkbox" v-model="form.require_invite" :disabled="isReadOnly" />
                <span>需要邀请码才能参与</span>
              </label>
            </div>
          </div>

          <div v-else-if="currentStep.key === 'plans'" class="step-block">
            <div class="plans-head">
              <h3>套餐配置</h3>
              <button type="button" class="btn btn--ghost" @click="addPlan" :disabled="isReadOnly">新增套餐</button>
            </div>
            <p v-if="planErrors.__all" class="form-error">{{ planErrors.__all }}</p>
            <div v-if="!form.plans.length" class="empty">暂无套餐，请点击「新增套餐」。</div>
            <section v-for="(plan, index) in form.plans" :key="index" class="plan-card" :data-error="planErrors[index]">
              <header class="plan-card__top">
                <h4>套餐 {{ index + 1 }}</h4>
                <button type="button" class="link-btn" @click="removePlan(index)" :disabled="isReadOnly">删除</button>
              </header>
              <div class="form-grid">
                <label class="form-field">
                  <span>套餐名称<em>*</em></span>
                  <input class="input" type="text" v-model.trim="plan.name" :disabled="isReadOnly" placeholder="如 59 元档" />
                </label>
                <label class="form-field">
                  <span>价格 (¥)<em>*</em></span>
                  <input class="input" type="number" min="0" step="0.01" v-model.number="plan.price" :disabled="isReadOnly" />
                </label>
                <label class="form-field">
                  <span>计佣类型<em>*</em></span>
                  <select class="input" :value="plan.commission_scheme.type" @change="onCommissionTypeChange(index, $event)" :disabled="isReadOnly">
                    <option value="fixed">固定金额</option>
                    <option value="percent">百分比</option>
                    <option value="tier">梯度</option>
                  </select>
                </label>
                <label v-if="isFixedScheme(plan.commission_scheme)" class="form-field">
                  <span>佣金 (¥)<em>*</em></span>
                  <input class="input" type="number" min="0" step="0.01" v-model.number="plan.commission_scheme.value" :disabled="isReadOnly" />
                </label>
                <label v-else-if="isPercentScheme(plan.commission_scheme)" class="form-field">
                  <span>佣金 (%)<em>*</em></span>
                  <input class="input" type="number" min="0" max="100" step="0.1" v-model.number="plan.commission_scheme.value" :disabled="isReadOnly" />
                </label>
              </div>
              <div v-if="isTierScheme(plan.commission_scheme)" class="tiers">
                <div v-for="(tier, tierIndex) in plan.commission_scheme.tiers" :key="tierIndex" class="tier-row">
                  <label class="form-field">
                    <span>阈值</span>
                    <input class="input" type="number" min="0" step="1" v-model.number="tier.threshold" :disabled="isReadOnly" />
                  </label>
                  <label class="form-field">
                    <span>佣金</span>
                    <input class="input" type="number" min="0" step="0.1" v-model.number="tier.value" :disabled="isReadOnly" />
                  </label>
                  <button type="button" class="link-btn" @click="removeTier(index, tierIndex)" :disabled="isReadOnly">移除</button>
                </div>
                <button type="button" class="btn btn--ghost" @click="addTier(index)" :disabled="isReadOnly">新增梯度</button>
              </div>
              <label class="form-field">
                <span>限制条件</span>
                <input class="input" type="text" :value="serializeConstraints(plan.constraints)" @input="updateConstraints(index, $event)" :disabled="isReadOnly" placeholder="示例：新用户专享" />
              </label>
              <p v-if="planErrors[index]" class="form-error">{{ planErrors[index] }}</p>
            </section>
          </div>

          <div v-else-if="currentStep.key === 'scope'" class="step-block">
            <fieldset class="form-field full" :data-error="scopeError">
              <legend>适用公司</legend>
              <div class="checkbox-group">
                <label v-for="option in companyOptions" :key="option">
                  <input type="checkbox" :value="option" v-model="form.scope.companies" :disabled="isReadOnly" />
                  {{ option }}
                </label>
              </div>
            </fieldset>
            <fieldset class="form-field full" :data-error="scopeError">
              <legend>适用城市</legend>
              <div class="checkbox-group">
                <label v-for="option in cityOptions" :key="option.value">
                  <input type="checkbox" :value="option.value" v-model="form.scope.cities" :disabled="isReadOnly" />
                  {{ option.label }}
                </label>
              </div>
            </fieldset>
            <fieldset class="form-field full" :data-error="scopeError">
              <legend>适用门店</legend>
              <div class="checkbox-group checkbox-group--columns">
                <label v-for="option in storeOptions" :key="option.value">
                  <input type="checkbox" :value="option.value" v-model="form.scope.stores" :disabled="isReadOnly" />
                  {{ option.label }}
                </label>
              </div>
            </fieldset>
            <span v-if="scopeError" class="form-error">{{ scopeError }}</span>
          </div>

          <div v-else-if="currentStep.key === 'rules'" class="step-block">
            <div class="form-grid">
              <label class="form-field" :data-error="rulesError">
                <span>表单 DSL ID<em>*</em></span>
                <input class="input" type="text" v-model.trim="form.form_dsl_id" :disabled="isReadOnly" placeholder="如 F123" />
              </label>
              <label class="form-field">
                <span>风控策略 ID</span>
                <input class="input" type="text" v-model.trim="form.risk_policy_id" :disabled="isReadOnly" placeholder="如 R001" />
              </label>
            </div>
            <span v-if="rulesError" class="form-error">{{ rulesError }}</span>
          </div>

          <div v-else class="step-block">
            <article class="preview">
              <h3>基础信息</h3>
              <dl>
                <div><dt>活动名称</dt><dd>{{ form.name }}</dd></div>
                <div><dt>活动码</dt><dd>{{ form.code }}</dd></div>
                <div><dt>有效期</dt><dd>{{ formatDateRange(form.start_time, form.end_time) }}</dd></div>
                <div><dt>渠道</dt><dd>{{ formatChannels(form.channels) }}</dd></div>
                <div><dt>描述</dt><dd>{{ form.desc || '-' }}</dd></div>
                <div><dt>可见角色</dt><dd>{{ formatRoles(form.visible_to_roles) }}</dd></div>
                <div><dt>需要邀请码</dt><dd>{{ form.require_invite ? '是' : '否' }}</dd></div>
              </dl>
              <h3>套餐</h3>
              <ul class="preview-list">
                <li v-for="(plan, index) in form.plans" :key="index">
                  <strong>{{ plan.name }}</strong>
                  <span>价格：¥{{ plan.price.toFixed(2) }}</span>
                  <span>计佣：{{ formatCommission(plan.commission_scheme) }}</span>
                </li>
              </ul>
              <h3>适用范围</h3>
              <dl>
                <div><dt>公司</dt><dd>{{ (form.scope.companies && form.scope.companies.length) ? form.scope.companies.join('、') : '-' }}</dd></div>
                <div><dt>城市</dt><dd>{{ (form.scope.cities && form.scope.cities.length) ? formatCities(form.scope.cities) : '-' }}</dd></div>
                <div><dt>门店</dt><dd>{{ (form.scope.stores && form.scope.stores.length) ? form.scope.stores.join('、') : '-' }}</dd></div>
              </dl>
              <h3>规则</h3>
              <dl>
                <div><dt>表单 DSL</dt><dd>{{ form.form_dsl_id || '-' }}</dd></div>
                <div><dt>风控策略</dt><dd>{{ form.risk_policy_id || '-' }}</dd></div>
              </dl>
            </article>
          </div>
        </section>

        <footer class="campaigns-drawer__footer">
          <button type="button" class="btn btn--ghost" @click="closeDrawer">取消</button>
          <button type="button" class="btn btn--ghost" @click="prevStep" :disabled="activeStep === 0">上一步</button>
          <button
            v-if="activeStep < steps.length - 1"
            type="button"
            class="btn"
            @click="nextStep"
            :disabled="isReadOnly"
          >
            下一步
          </button>
          <button
            v-else
            type="button"
            class="btn"
            @click="saveDraft"
            :disabled="drawerSaving || isReadOnly"
          >
            {{ drawerSaving ? '保存中…' : '保存草稿' }}
          </button>
        </footer>
      </aside>
    </div>

    <div v-if="offlineModalVisible" class="offline-modal">
      <div class="offline-modal__backdrop" @click="closeOfflineModal" />
      <div class="offline-modal__panel" role="dialog" aria-modal="true">
        <header>
          <h3>下架原因</h3>
        </header>
        <section>
          <p>请说明下架原因，以便留存审核记录。</p>
          <textarea class="textarea" rows="4" v-model.trim="offlineReason" placeholder="输入不少于 5 个字的原因" />
          <p v-if="offlineError" class="form-error">{{ offlineError }}</p>
        </section>
        <footer>
          <button type="button" class="btn btn--ghost" @click="closeOfflineModal">取消</button>
          <button type="button" class="btn" @click="confirmOffline" :disabled="actionLoading">
            {{ actionLoading ? '提交中…' : '确认下架' }}
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import {
  CampaignsService,
  type Campaign,
  type CampaignFilters,
  type CampaignPlan,
  type CampaignScope,
  type CampaignStatus,
  type CommissionScheme
} from '@/sdk/campaigns';

const statusFilterOptions = [
  { value: 'draft', label: '草稿' },
  { value: 'published', label: '已发布' },
  { value: 'offline', label: '已下架' },
  { value: 'ended', label: '已结束' }
];

const statusLabelMap: Record<CampaignStatus, string> = {
  draft: '草稿',
  published: '已发布',
  offline: '已下架',
  ended: '已结束'
};

const cityOptions = [
  { value: 'GZ', label: '广州' },
  { value: 'SZ', label: '深圳' },
  { value: 'FS', label: '佛山' },
  { value: 'DG', label: '东莞' }
];

const channelOptions = [
  { value: 'wechat', label: '微信' },
  { value: 'h5', label: 'H5' },
  { value: 'scan', label: '扫码' },
  { value: 'api', label: 'API' }
];

const roleOptions = [
  { value: 'operator', label: '运营人员' },
  { value: 'promoter', label: '推广人员' },
  { value: 'store_owner', label: '门店负责人' }
];

const companyOptions = ['华南事业部', '华中事业部', '华北事业部'];

const storeOptions = [
  { value: 'S001', label: 'S001 天河路旗舰店' },
  { value: 'S002', label: 'S002 海珠江畔店' },
  { value: 'SZ101', label: 'SZ101 福田中心店' },
  { value: 'FS001', label: 'FS001 禅城一店' },
  { value: 'FS002', label: 'FS002 顺德乐从店' }
];

const steps = [
  { key: 'basic', label: '基础信息' },
  { key: 'plans', label: '套餐配置' },
  { key: 'scope', label: '适用范围' },
  { key: 'rules', label: '规则策略' },
  { key: 'preview', label: '预览' }
] as const;

const filters = reactive<CampaignFilters & { page: number; page_size: number }>(
  {
    status: '',
    city: '',
    channel: '',
    keyword: '',
    page: 1,
    page_size: 10,
    sort_key: 'start_time',
    sort_order: 'desc'
  }
);

const campaigns = ref<Campaign[]>([]);
const total = ref(0);
const loading = ref(false);
const actionLoading = ref(false);
const exporting = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');

const pageSizeOptions = [10, 20, 50];

const drawerVisible = ref(false);
const drawerMode = ref<'create' | 'edit' | 'view'>('create');
const drawerSaving = ref(false);
const activeStep = ref(0);
const visitedSteps = reactive<boolean[]>(steps.map((_, index) => index === 0));
const currentStatus = ref<CampaignStatus>('draft');
const currentCampaignId = ref<string | null>(null);

const form = reactive({
  name: '',
  code: '',
  desc: '',
  start_time: '',
  end_time: '',
  channels: [] as string[],
  visible_to_roles: [] as string[],
  require_invite: false,
  plans: [] as CampaignPlan[],
  scope: {
    companies: [] as string[],
    cities: [] as string[],
    stores: [] as string[]
  },
  form_dsl_id: '',
  risk_policy_id: ''
});

const basicErrors = reactive({
  name: '',
  code: '',
  desc: '',
  start_time: '',
  end_time: '',
  channels: ''
});

const planErrors = reactive<Record<number | '__all', string>>({});
const scopeError = ref('');
const rulesError = ref('');

const offlineModalVisible = ref(false);
const offlineReason = ref('');
const offlineError = ref('');

const drawerTitle = computed(() => {
  if (drawerMode.value === 'create') return '新建活动';
  if (drawerMode.value === 'edit') return '编辑活动';
  return '活动详情';
});

const pageCount = computed(() => {
  if (!filters.page_size) return 1;
  return Math.max(1, Math.ceil(total.value / filters.page_size));
});

const currentStep = computed(() => steps[activeStep.value]);
const isReadOnly = computed(() => drawerMode.value === 'view');

function statusLabel(status: CampaignStatus) {
  return statusLabelMap[status] || status;
}

function canEditStatus(status: CampaignStatus) {
  return status === 'draft' || status === 'offline';
}

function canPublishStatus(status: CampaignStatus) {
  return status === 'draft' || status === 'offline';
}

function resetForm() {
  form.name = '';
  form.code = '';
  form.desc = '';
  form.start_time = '';
  form.end_time = '';
  form.channels = [];
  form.visible_to_roles = [];
  form.require_invite = false;
  form.plans = [];
  form.scope.companies = [];
  form.scope.cities = [];
  form.scope.stores = [];
  form.form_dsl_id = '';
  form.risk_policy_id = '';
}

function fillForm(data: Campaign) {
  form.name = data.name || '';
  form.code = data.code || '';
  form.desc = data.desc || '';
  form.start_time = data.start_time ? data.start_time.slice(0, 16) : '';
  form.end_time = data.end_time ? data.end_time.slice(0, 16) : '';
  form.channels = [...(data.channels || [])];
  form.visible_to_roles = data.visible_to_roles ? [...data.visible_to_roles] : [];
  form.require_invite = Boolean(data.require_invite);
  form.plans = data.plans ? data.plans.map((plan) => ({
    plan_id: plan.plan_id,
    name: plan.name,
    price: plan.price,
    commission_scheme: JSON.parse(JSON.stringify(plan.commission_scheme)) as CommissionScheme,
    constraints: plan.constraints ? JSON.parse(JSON.stringify(plan.constraints)) : undefined
  })) : [];
  form.scope.companies = data.scope?.companies ? [...data.scope.companies] : [];
  form.scope.cities = data.scope?.cities ? [...data.scope.cities] : [];
  form.scope.stores = data.scope?.stores ? [...data.scope.stores] : [];
  form.form_dsl_id = data.form_dsl_id || '';
  form.risk_policy_id = data.risk_policy_id || '';
}

function parseError(err: unknown) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && 'message' in err) return String((err as any).message);
  return '操作失败，请稍后再试';
}

async function fetchCampaigns() {
  loading.value = true;
  errorMessage.value = '';
  try {
    const response = await CampaignsService.listCampaigns({
      status: filters.status,
      city: filters.city,
      channel: filters.channel,
      keyword: filters.keyword,
      page: filters.page,
      page_size: filters.page_size,
      sort_key: filters.sort_key,
      sort_order: filters.sort_order
    });
    campaigns.value = response.items || [];
    total.value = response.total || 0;
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    loading.value = false;
  }
}

function applyFilters() {
  filters.page = 1;
  fetchCampaigns();
}

function resetFilters() {
  filters.status = '';
  filters.city = '';
  filters.channel = '';
  filters.keyword = '';
  filters.page = 1;
  filters.page_size = 10;
  filters.sort_key = 'start_time';
  filters.sort_order = 'desc';
  fetchCampaigns();
}

function changePage(page: number) {
  if (page < 1 || page > pageCount.value) return;
  filters.page = page;
  fetchCampaigns();
}

function changePageSize(event: Event) {
  const value = Number((event.target as HTMLSelectElement).value);
  filters.page_size = value || 10;
  filters.page = 1;
  fetchCampaigns();
}

function openCreateDrawer() {
  resetForm();
  basicErrors.name = '';
  basicErrors.code = '';
  basicErrors.desc = '';
  basicErrors.start_time = '';
  basicErrors.end_time = '';
  basicErrors.channels = '';
  Object.keys(planErrors).forEach((key) => delete planErrors[key as any]);
  scopeError.value = '';
  rulesError.value = '';
  drawerMode.value = 'create';
  drawerVisible.value = true;
  drawerSaving.value = false;
  actionLoading.value = false;
  currentCampaignId.value = null;
  currentStatus.value = 'draft';
  activeStep.value = 0;
  visitedSteps.fill(false);
  visitedSteps[0] = true;
}

async function openViewDrawer(item: Campaign) {
  await openDrawerWithData('view', item);
  activeStep.value = steps.length - 1;
  visitedSteps.fill(true);
}

async function openEditDrawer(item: Campaign) {
  await openDrawerWithData('edit', item);
}

async function openDrawerWithData(mode: 'view' | 'edit', item: Campaign) {
  drawerMode.value = mode;
  drawerVisible.value = true;
  drawerSaving.value = false;
  actionLoading.value = false;
  activeStep.value = 0;
  visitedSteps.fill(false);
  visitedSteps[0] = true;
  try {
    const detail = await CampaignsService.getCampaign(item.campaign_id);
    fillForm(detail);
    currentCampaignId.value = detail.campaign_id;
    currentStatus.value = detail.status;
  } catch (err) {
    errorMessage.value = parseError(err);
    drawerVisible.value = false;
  }
}

function closeDrawer() {
  drawerVisible.value = false;
}

function switchToEdit() {
  if (!canEditStatus(currentStatus.value)) return;
  drawerMode.value = 'edit';
  activeStep.value = 0;
  visitedSteps.fill(false);
  visitedSteps[0] = true;
}

function nextStep() {
  if (activeStep.value >= steps.length - 1) return;
  if (!validateStep(activeStep.value)) return;
  activeStep.value += 1;
  visitedSteps[activeStep.value] = true;
}

function prevStep() {
  if (activeStep.value === 0) return;
  activeStep.value -= 1;
}

function canJumpTo(index: number) {
  if (isReadOnly.value) return true;
  if (index <= activeStep.value) return true;
  for (let i = 0; i <= index - 1; i += 1) {
    if (!validateStep(i)) return false;
  }
  return true;
}

function jumpTo(index: number) {
  if (!canJumpTo(index)) return;
  activeStep.value = index;
  visitedSteps[activeStep.value] = true;
}

function validateStep(index: number) {
  const key = steps[index].key;
  if (key === 'basic') return validateBasic();
  if (key === 'plans') return validatePlans();
  if (key === 'scope') return validateScope();
  if (key === 'rules') return validateRules();
  return validateBasic() && validatePlans() && validateScope() && validateRules();
}

function validateBasic() {
  let valid = true;
  basicErrors.name = '';
  basicErrors.code = '';
  basicErrors.start_time = '';
  basicErrors.end_time = '';
  basicErrors.channels = '';

  if (!form.name || form.name.trim().length < 2 || form.name.trim().length > 40) {
    basicErrors.name = '请输入 2-40 字名称';
    valid = false;
  }

  const code = form.code?.trim();
  const codePattern = /^[A-Z0-9]{3,16}$/;
  if (!codePattern.test(code)) {
    basicErrors.code = '活动码需为 3-16 位大写字母或数字';
    valid = false;
  }

  if (!form.start_time) {
    basicErrors.start_time = '请选择开始时间';
    valid = false;
  }
  if (!form.end_time) {
    basicErrors.end_time = '请选择结束时间';
    valid = false;
  }
  if (form.start_time && form.end_time) {
    const start = new Date(form.start_time).getTime();
    const end = new Date(form.end_time).getTime();
    if (Number.isFinite(start) && Number.isFinite(end) && start >= end) {
      basicErrors.end_time = '结束时间需晚于开始时间';
      valid = false;
    }
  }
  if (!form.channels || form.channels.length === 0) {
    basicErrors.channels = '至少选择一个渠道';
    valid = false;
  }
  return valid;
}

function validatePlans() {
  Object.keys(planErrors).forEach((key) => delete planErrors[key as any]);
  if (!form.plans.length) {
    planErrors.__all = '至少新增一个套餐';
    return false;
  }
  let valid = true;
  form.plans.forEach((plan, index) => {
    let err = '';
    if (!plan.name.trim()) err = '请输入套餐名称';
    if (plan.price === undefined || plan.price === null || Number(plan.price) < 0) err = '价格需大于等于 0';
    if (isFixedScheme(plan.commission_scheme) || isPercentScheme(plan.commission_scheme)) {
      const value = Number(plan.commission_scheme.value);
      if (!Number.isFinite(value)) err = '请输入有效的佣金数值';
      if (isPercentScheme(plan.commission_scheme) && (value < 0 || value > 100)) {
        err = '百分比需在 0-100 之间';
      }
    } else if (isTierScheme(plan.commission_scheme)) {
      if (!plan.commission_scheme.tiers.length) {
        err = '请至少添加一个梯度';
      }
    }
    if (err) {
      planErrors[index] = err;
      valid = false;
    }
  });
  return valid;
}

function validateScope() {
  scopeError.value = '';
  const companies = form.scope.companies?.length || 0;
  const cities = form.scope.cities?.length || 0;
  const stores = form.scope.stores?.length || 0;
  if (!companies && !cities && !stores) {
    scopeError.value = '至少选择一个公司、城市或门店';
    return false;
  }
  return true;
}

function validateRules() {
  rulesError.value = '';
  if (!form.form_dsl_id.trim()) {
    rulesError.value = '请填写表单 DSL ID';
    return false;
  }
  return true;
}

function validateAll() {
  return steps.every((_, index) => validateStep(index));
}

function buildPayload(): Campaign {
  return {
    campaign_id: currentCampaignId.value || '',
    name: form.name.trim(),
    code: form.code.trim(),
    desc: form.desc?.trim() || '',
    status: currentStatus.value,
    start_time: form.start_time ? new Date(form.start_time).toISOString() : '',
    end_time: form.end_time ? new Date(form.end_time).toISOString() : '',
    channels: [...form.channels],
    plans: form.plans.map((plan, index) => ({
      plan_id: plan.plan_id || `TEMP-${index}-${Date.now()}`,
      name: plan.name.trim(),
      price: Number(plan.price),
      commission_scheme: JSON.parse(JSON.stringify(plan.commission_scheme)) as CommissionScheme,
      constraints: plan.constraints ? JSON.parse(JSON.stringify(plan.constraints)) : undefined
    })),
    scope: {
      companies: form.scope.companies ? [...form.scope.companies] : [],
      cities: form.scope.cities ? [...form.scope.cities] : [],
      stores: form.scope.stores ? [...form.scope.stores] : []
    },
    form_dsl_id: form.form_dsl_id.trim(),
    risk_policy_id: form.risk_policy_id?.trim() || '',
    visible_to_roles: form.visible_to_roles ? [...form.visible_to_roles] : [],
    require_invite: !!form.require_invite,
    metrics: currentCampaignId.value ? campaigns.value.find((it) => it.campaign_id === currentCampaignId.value)?.metrics : undefined
  };
}

async function saveDraft() {
  if (!validateAll()) return;
  drawerSaving.value = true;
  errorMessage.value = '';
  feedbackMessage.value = '';
  try {
    const payload = buildPayload();
    if (!currentCampaignId.value) {
      const response = await CampaignsService.createCampaign(payload);
      currentCampaignId.value = response.campaign_id;
      currentStatus.value = response.status || 'draft';
      feedbackMessage.value = '草稿创建成功';
    } else {
      await CampaignsService.updateCampaign(currentCampaignId.value, payload);
      feedbackMessage.value = '草稿已保存';
    }
    await fetchCampaigns();
    closeDrawer();
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    drawerSaving.value = false;
  }
}

async function handlePublish(item: Campaign) {
  if (!canPublishStatus(item.status)) return;
  actionLoading.value = true;
  errorMessage.value = '';
  try {
    await CampaignsService.publishCampaign(item.campaign_id);
    feedbackMessage.value = '活动已发布';
    await fetchCampaigns();
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

async function publishFromDrawer() {
  if (!currentCampaignId.value) return;
  if (!validateAll()) return;
  actionLoading.value = true;
  errorMessage.value = '';
  try {
    const payload = buildPayload();
    if (drawerMode.value !== 'view') {
      await CampaignsService.updateCampaign(currentCampaignId.value, payload);
    }
    await CampaignsService.publishCampaign(currentCampaignId.value);
    currentStatus.value = 'published';
    feedbackMessage.value = '活动已发布';
    await fetchCampaigns();
    drawerMode.value = 'view';
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

function prepareOffline(item: Campaign) {
  currentCampaignId.value = item.campaign_id;
  offlineReason.value = '';
  offlineError.value = '';
  offlineModalVisible.value = true;
}

function prepareOfflineFromDrawer() {
  if (!currentCampaignId.value) return;
  offlineReason.value = '';
  offlineError.value = '';
  offlineModalVisible.value = true;
}

function closeOfflineModal() {
  offlineModalVisible.value = false;
}

async function confirmOffline() {
  if (!currentCampaignId.value) return;
  if (!offlineReason.value || offlineReason.value.trim().length < 5) {
    offlineError.value = '请输入不少于 5 个字的下架原因';
    return;
  }
  offlineError.value = '';
  actionLoading.value = true;
  try {
    await CampaignsService.offlineCampaign(currentCampaignId.value, offlineReason.value.trim());
    feedbackMessage.value = '活动已下架';
    currentStatus.value = 'offline';
    await fetchCampaigns();
    offlineModalVisible.value = false;
    if (drawerMode.value !== 'create') {
      drawerMode.value = 'view';
    }
  } catch (err) {
    offlineError.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

async function handleClone(item: Campaign) {
  actionLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await CampaignsService.cloneCampaign(item.campaign_id);
    feedbackMessage.value = '复制成功，已生成草稿';
    await fetchCampaigns();
    const detail = await CampaignsService.getCampaign(response.campaign_id);
    fillForm(detail);
    currentCampaignId.value = detail.campaign_id;
    currentStatus.value = 'draft';
    drawerMode.value = 'edit';
    drawerVisible.value = true;
    activeStep.value = 0;
    visitedSteps.fill(false);
    visitedSteps[0] = true;
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    actionLoading.value = false;
  }
}

async function cloneFromDrawer() {
  if (!currentCampaignId.value) return;
  await handleClone({ ...buildPayload(), campaign_id: currentCampaignId.value, status: currentStatus.value, plans: form.plans });
}

async function handleExport() {
  exporting.value = true;
  feedbackMessage.value = '';
  errorMessage.value = '';
  try {
    await CampaignsService.exportCampaigns({
      status: filters.status,
      city: filters.city,
      channel: filters.channel,
      keyword: filters.keyword,
      sort_key: filters.sort_key,
      sort_order: filters.sort_order
    });
    feedbackMessage.value = '导出任务已提交至导出中心';
  } catch (err) {
    errorMessage.value = parseError(err);
  } finally {
    exporting.value = false;
  }
}

function addPlan() {
  if (isReadOnly.value) return;
  form.plans.push({
    name: '',
    price: 0,
    commission_scheme: { type: 'fixed', value: 0 }
  });
}

function removePlan(index: number) {
  if (isReadOnly.value) return;
  form.plans.splice(index, 1);
}

function onCommissionTypeChange(index: number, event: Event) {
  if (isReadOnly.value) return;
  const value = (event.target as HTMLSelectElement).value as 'fixed' | 'percent' | 'tier';
  if (value === 'fixed') {
    form.plans[index].commission_scheme = { type: 'fixed', value: 0 };
  } else if (value === 'percent') {
    form.plans[index].commission_scheme = { type: 'percent', value: 0 };
  } else {
    form.plans[index].commission_scheme = { type: 'tier', tiers: [{ threshold: 0, value: 0 }] };
  }
}

function isFixedScheme(scheme: CommissionScheme): scheme is { type: 'fixed'; value: number } {
  return scheme.type === 'fixed';
}

function isPercentScheme(scheme: CommissionScheme): scheme is { type: 'percent'; value: number } {
  return scheme.type === 'percent';
}

function isTierScheme(scheme: CommissionScheme): scheme is { type: 'tier'; tiers: Array<{ threshold: number; value: number }> } {
  return scheme.type === 'tier';
}

function addTier(planIndex: number) {
  if (isReadOnly.value) return;
  const scheme = form.plans[planIndex].commission_scheme;
  if (isTierScheme(scheme)) {
    scheme.tiers.push({ threshold: 0, value: 0 });
  }
}

function removeTier(planIndex: number, tierIndex: number) {
  if (isReadOnly.value) return;
  const scheme = form.plans[planIndex].commission_scheme;
  if (isTierScheme(scheme)) {
    scheme.tiers.splice(tierIndex, 1);
  }
}

function serializeConstraints(constraints: Record<string, unknown> | null | undefined) {
  if (!constraints) return '';
  try {
    return Object.entries(constraints)
      .map(([key, value]) => `${key}:${value}`)
      .join('; ');
  } catch (err) {
    return '';
  }
}

function updateConstraints(index: number, event: Event) {
  if (isReadOnly.value) return;
  const value = (event.target as HTMLInputElement).value;
  if (!value) {
    form.plans[index].constraints = undefined;
    return;
  }
  const obj: Record<string, unknown> = {};
  value.split(/;|；/).forEach((pair) => {
    const [key, val] = pair.split(/:|：/);
    if (key && val) obj[key.trim()] = val.trim();
  });
  form.plans[index].constraints = obj;
}

function formatCommission(scheme: CommissionScheme) {
  if (isFixedScheme(scheme)) return `固定 ¥${Number(scheme.value).toFixed(2)}`;
  if (isPercentScheme(scheme)) return `比例 ${Number(scheme.value).toFixed(1)}%`;
  if (isTierScheme(scheme)) {
    return scheme.tiers
      .map((tier) => `≥${tier.threshold} 单 ¥${tier.value}`)
      .join('；');
  }
  return '-';
}

function formatChannels(channels: string[]) {
  if (!channels || !channels.length) return '-';
  const labelMap: Record<string, string> = channelOptions.reduce((acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  }, {} as Record<string, string>);
  return channels.map((ch) => labelMap[ch] || ch).join('、');
}

function formatRoles(roles: string[]) {
  if (!roles || !roles.length) return '-';
  const labelMap: Record<string, string> = roleOptions.reduce((acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  }, {} as Record<string, string>);
  return roles.map((role) => labelMap[role] || role).join('、');
}

function formatScopeSummary(scope: CampaignScope) {
  const parts: string[] = [];
  if (scope.companies && scope.companies.length) parts.push(`公司 ${scope.companies.length}`);
  if (scope.cities && scope.cities.length) parts.push(`城市 ${scope.cities.length}`);
  if (scope.stores && scope.stores.length) parts.push(`门店 ${scope.stores.length}`);
  return parts.length ? parts.join(' · ') : '-';
}

function formatCities(values: string[]) {
  const labelMap: Record<string, string> = cityOptions.reduce((acc, cur) => {
    acc[cur.value] = cur.label;
    return acc;
  }, {} as Record<string, string>);
  return values.map((value) => labelMap[value] || value).join('、');
}

function formatDateRange(start: string, end: string) {
  if (!start || !end) return '-';
  const startText = new Date(start).toLocaleString('zh-CN', { hour12: false });
  const endText = new Date(end).toLocaleString('zh-CN', { hour12: false });
  return `${startText} ~ ${endText}`;
}

watch(
  () => form.code,
  (value) => {
    if (typeof value !== 'string') return;
    const uppercase = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (uppercase !== value) {
      form.code = uppercase;
    }
  }
);

fetchCampaigns();
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.campaigns {
  display: grid;
  gap: $spacing-24;
  color: $color-text-strong;
}

.campaigns__head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.campaigns__title {
  margin: 0 0 $spacing-8;
  font-size: calc(#{$font-size-16} * 1.25);
}

.campaigns__subtitle {
  margin: 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.campaigns__actions {
  display: flex;
  gap: $spacing-12;
}

.campaigns__filters {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-16;
  background: $color-surface-0;
  display: grid;
  gap: $spacing-16;
}

.filters__row {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 10), 1fr));
}

.filters__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.filters__field--keyword {
  grid-column: span 2;
}

.filters__actions {
  display: flex;
  gap: $spacing-12;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-8;
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

.campaigns__table {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  overflow-x: auto;
  background: $color-surface-0;
}

.campaigns__table table {
  width: 100%;
  border-collapse: collapse;
}

.campaigns__table th,
.campaigns__table td {
  padding: $spacing-12 $spacing-16;
  text-align: left;
  border-bottom: $border-width-1 solid $color-surface-100;
  font-size: $font-size-16;
}

.campaigns__table th {
  color: $color-surface-500;
  background: $color-surface-50;
}

.col-actions {
  width: calc(#{$spacing-16} * 10);
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-8;
}

.link-btn {
  background: transparent;
  border: none;
  color: $color-primary-700;
  cursor: pointer;
  font-weight: $font-weight-medium;
  padding: 0;
}

.link-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.table-skeleton {
  height: calc(#{$spacing-16} * 2);
  background: $color-surface-100;
  border-radius: $radius-8;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: 0 $spacing-10;
  height: calc(#{$spacing-16} * 1.5);
  border-radius: $radius-8;
  background: $color-surface-100;
  font-size: $font-size-16;
}

.status-tag[data-status='published'] {
  background: $color-primary-50;
  color: $color-primary-700;
}

.status-tag[data-status='offline'],
.status-tag[data-status='ended'] {
  background: $color-surface-200;
}

.metric {
  font-weight: $font-weight-medium;
}

.empty {
  text-align: center;
  color: $color-surface-500;
  padding: $spacing-16;
}

.campaigns__pager {
  display: flex;
  align-items: center;
  gap: $spacing-12;
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
  background: rgba($color-surface-500, 0.15);
  color: $color-surface-700;
}

.campaigns-drawer {
  position: fixed;
  inset: 0;
  display: grid;
  grid-template-columns: 1fr auto;
  z-index: 10;
}

.campaigns-drawer__backdrop {
  background: rgba($color-surface-700, 0.45);
}

.campaigns-drawer__panel {
  width: min(38rem, 90vw);
  background: $color-surface-0;
  border-left: $border-width-1 solid $color-surface-200;
  display: grid;
  grid-template-rows: auto auto 1fr auto;
}

.campaigns-drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-16;
  border-bottom: $border-width-1 solid $color-surface-200;
  gap: $spacing-12;
}

.drawer-title {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.drawer-title h2 {
  margin: 0;
  font-size: calc(#{$font-size-16} * 1.1);
}

.drawer-actions {
  display: flex;
  gap: $spacing-8;
  flex-wrap: wrap;
}

.campaigns-drawer__steps {
  display: flex;
  gap: $spacing-8;
  padding: $spacing-12 $spacing-16;
  border-bottom: $border-width-1 solid $color-surface-200;
  overflow-x: auto;
}

.drawer-step {
  display: inline-flex;
  align-items: center;
  gap: $spacing-8;
  padding: $spacing-8 $spacing-12;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-0;
  cursor: pointer;
}

.drawer-step[data-active='true'] {
  border-color: $color-primary-700;
  color: $color-primary-700;
}

.drawer-step:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.drawer-step__index {
  font-weight: $font-weight-medium;
}

.campaigns-drawer__body {
  padding: $spacing-16;
  overflow-y: auto;
  display: grid;
  gap: $spacing-16;
}

.step-block {
  display: grid;
  gap: $spacing-16;
}

.form-grid {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 10), 1fr));
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
  font-size: $font-size-16;
}

.form-field.full {
  grid-column: 1 / -1;
}

.form-field--switch {
  flex-direction: row;
  align-items: center;
}

.form-field em {
  color: $color-primary-700;
  font-style: normal;
  margin-left: calc(#{$spacing-8} / 2);
}

.input,
.textarea,
select {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  font: inherit;
  background: $color-surface-0;
  color: $color-text-strong;
}

.textarea {
  resize: vertical;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-12;
}

.checkbox-group--columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 9), 1fr));
  gap: $spacing-8;
}

fieldset.form-field {
  border: none;
  padding: 0;
  margin: 0;
}

fieldset.form-field > legend {
  font-weight: $font-weight-medium;
}

.form-error {
  color: $color-primary-700;
  font-size: $font-size-12;
}

.plans-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.plan-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-16;
  display: grid;
  gap: $spacing-16;
}

.plan-card__top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.tiers {
  display: grid;
  gap: $spacing-12;
}

.tier-row {
  display: flex;
  gap: $spacing-12;
  flex-wrap: wrap;
}

.preview {
  display: grid;
  gap: $spacing-16;
}

.preview h3 {
  margin: 0;
}

.preview dl {
  margin: 0;
  display: grid;
  gap: $spacing-8;
}

.preview dl > div {
  display: flex;
  gap: $spacing-8;
}

.preview dt {
  width: calc(#{$spacing-16} * 5);
  color: $color-surface-500;
}

.preview-list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: $spacing-8;
}

.preview-list li {
  padding: $spacing-12;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  display: flex;
  gap: $spacing-12;
  flex-wrap: wrap;
}

.campaigns-drawer__footer {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-12;
  padding: $spacing-16;
  border-top: $border-width-1 solid $color-surface-200;
}

.offline-modal {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
}

.offline-modal__backdrop {
  grid-column: 1 / -1;
  grid-row: 1 / -1;
  background: rgba($color-surface-700, 0.45);
}

.offline-modal__panel {
  grid-column: 2;
  grid-row: 1;
  align-self: center;
  background: $color-surface-0;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16;
  display: grid;
  gap: $spacing-16;
  width: min(28rem, 90vw);
}

.offline-modal__panel header {
  margin: 0;
}

.offline-modal__panel footer {
  display: flex;
  gap: $spacing-12;
  justify-content: flex-end;
}

@media (max-width: 64rem) {
  .campaigns__actions {
    flex-direction: column;
  }
  .campaigns-drawer__panel {
    width: min(100vw, 32rem);
  }
}
</style>
