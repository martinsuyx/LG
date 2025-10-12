<template>
  <section class="kyc-console">
    <header class="kyc-console__header">
      <div>
        <h1 class="kyc-console__title">KYC 审核 Console</h1>
        <p class="kyc-console__subtitle">集中查看实名材料、OCR 差异与风险等级，实现一键通过、拒绝或补充。</p>
      </div>
      <div class="kyc-console__actions">
        <Button size="sm" variant="ghost" :disabled="listLoading" @click="exportCases">导出当前列表</Button>
        <Button size="sm" variant="secondary" :disabled="listLoading" @click="loadCases">刷新</Button>
      </div>
    </header>

    <section class="kyc-console__summary" v-if="cases.length">
      <article class="summary-card">
        <h3>待审核</h3>
        <strong>{{ summaryStats.pending }}</strong>
      </article>
      <article class="summary-card">
        <h3>待补资料</h3>
        <strong>{{ summaryStats.needMore }}</strong>
      </article>
      <article class="summary-card">
        <h3>已通过</h3>
        <strong>{{ summaryStats.approved }}</strong>
      </article>
      <article class="summary-card summary-card--critical">
        <h3>回调异常</h3>
        <strong>{{ summaryStats.callbackError }}</strong>
      </article>
      <article class="summary-card">
        <h3>今日处理</h3>
        <strong>{{ summaryStats.processedToday }}</strong>
      </article>
      <article class="summary-card">
        <h3>通过率</h3>
        <strong>{{ summaryStats.approvalRate }}</strong>
      </article>
    </section>

    <form class="kyc-console__filters" @submit.prevent="applyFilters">
      <label>
        <span>开始日期</span>
        <input type="date" v-model="filters.start_date" :disabled="listLoading" />
      </label>
      <label>
        <span>结束日期</span>
        <input type="date" v-model="filters.end_date" :disabled="listLoading" />
      </label>
      <label>
        <span>状态</span>
        <select v-model="filters.status" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in statusOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>风险等级</span>
        <select v-model="filters.risk_level" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in riskLevelOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>渠道</span>
        <select v-model="filters.channel" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in channelOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>来源</span>
        <select v-model="filters.source" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in sourceOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <label>
        <span>证件类型</span>
        <select v-model="filters.id_type" :disabled="listLoading">
          <option value="">全部</option>
          <option v-for="item in idTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
        </select>
      </label>
      <div class="filters__actions">
        <Button size="sm" type="submit" :loading="listLoading">应用</Button>
        <Button size="sm" type="button" variant="ghost" :disabled="listLoading" @click="resetFilters">重置</Button>
      </div>
    </form>

    <div class="kyc-console__layout">
      <section class="kyc-console__table" role="region" aria-label="KYC 案件列表">
        <Table
          :columns="columns"
          :rows="cases"
          :loading="listLoading"
          :row-key="(row) => row.case_id"
          default-sort-key="created_at"
          default-sort-order="desc"
          @rowClick="openCase"
        >
          <template #cell:created_at="{ row }">
            {{ formatDateTime(row.created_at) }}
          </template>
          <template #cell:risk_level="{ row }">
            <span class="risk-chip" :data-level="row.risk_level">{{ riskLevelLabel(row.risk_level) }}</span>
          </template>
          <template #cell:status="{ row }">
            <span class="status-chip" :data-status="row.status">{{ statusLabel(row.status) }}</span>
          </template>
          <template #cell:channel="{ row }">
            {{ channelLabel(row.channel) }}
          </template>
          <template #cell:source="{ row }">
            {{ sourceLabel(row.source) }}
          </template>
          <template #cell:id_type="{ row }">
            {{ idTypeLabel(row.id_type) }}
          </template>
          <template #cell:assignee_id="{ row }">
            {{ row.assignee_id || '未指派' }}
          </template>
          <template #empty>
            {{ listLoading ? '加载中…' : '暂无案件' }}
          </template>
          <template #pagination>
            <Pagination
              v-if="pageCount > 1"
              :page="filters.page"
              :pages="pageCount"
              :page-size="filters.page_size"
              @update:page="changePage"
              @update:pageSize="changePageSize"
            />
          </template>
        </Table>
      </section>

      <aside class="kyc-console__drawer" v-if="drawerVisible" aria-label="KYC 案件详情">
        <header class="drawer__header">
          <div>
            <h2>{{ activeCase?.case_id }}</h2>
            <p>{{ formatDateTime(activeCase?.created_at || '') }} · {{ statusLabel(activeCase?.status || 'pending') }}</p>
          </div>
          <button class="drawer__close" type="button" aria-label="关闭" @click="closeDrawer">×</button>
        </header>

        <div class="drawer__body" v-if="detailLoading">
          <p class="drawer__placeholder">详情加载中…</p>
        </div>
        <div class="drawer__body" v-else-if="activeDetail">
          <section class="drawer-section">
            <h3>基础信息</h3>
            <dl class="drawer-grid">
              <div>
                <dt>风险等级</dt>
                <dd><span class="risk-chip" :data-level="activeCase?.risk_level || 'low'">{{ riskLevelLabel(activeCase?.risk_level || 'low') }}</span></dd>
              </div>
              <div>
                <dt>渠道</dt>
                <dd>{{ channelLabel(activeCase?.channel || '') }}</dd>
              </div>
              <div>
                <dt>来源</dt>
                <dd>{{ sourceLabel(activeCase?.source || 'manual') }}</dd>
              </div>
              <div>
                <dt>证件类型</dt>
                <dd>{{ idTypeLabel(activeCase?.id_type || '') }}</dd>
              </div>
              <div>
                <dt>订单号</dt>
                <dd>{{ activeCase?.order_id || '—' }}</dd>
              </div>
              <div>
                <dt>用户 ID</dt>
                <dd>{{ activeCase?.user_id || '—' }}</dd>
              </div>
              <div>
                <dt>指派人</dt>
                <dd>{{ activeDetail.assignee_id || '未指派' }}</dd>
              </div>
              <div>
                <dt>双人复核</dt>
                <dd>{{ activeDetail.double_review ? '要求' : '否' }}</dd>
              </div>
            </dl>
          </section>

          <section class="drawer-section">
            <h3>材料预览</h3>
            <div v-if="hasMaterials" class="materials">
              <figure v-if="activeDetail.materials?.id_front_url">
                <img :src="activeDetail.materials.id_front_url" alt="证件正面" loading="lazy" />
                <figcaption>证件正面</figcaption>
              </figure>
              <figure v-if="activeDetail.materials?.id_back_url">
                <img :src="activeDetail.materials.id_back_url" alt="证件背面" loading="lazy" />
                <figcaption>证件背面</figcaption>
              </figure>
              <figure v-if="activeDetail.materials?.selfie_url">
                <img :src="activeDetail.materials.selfie_url" alt="自拍/活体照" loading="lazy" />
                <figcaption>自拍/活体照</figcaption>
              </figure>
              <figure v-for="(url, index) in activeDetail.materials?.extra_images || []" :key="`${activeCase?.case_id}-extra-${index}`">
                <img :src="url" :alt="`补充材料 ${index + 1}`" loading="lazy" />
                <figcaption>补充材料 {{ index + 1 }}</figcaption>
              </figure>
            </div>
            <p v-else class="drawer__placeholder">暂无材料图片</p>
            <ul class="material-metrics" v-if="materialsMetrics.length">
              <li v-for="metric in materialsMetrics" :key="metric.label">
                <span>{{ metric.label }}</span>
                <strong>{{ metric.value }}</strong>
              </li>
            </ul>
          </section>

          <section class="drawer-section">
            <h3>OCR 结果</h3>
            <dl class="drawer-grid">
              <div v-for="(value, key) in ocrDisplay" :key="`ocr-${key}`">
                <dt>{{ ocrLabel(key) }}</dt>
                <dd>{{ value || '—' }}</dd>
              </div>
            </dl>
          </section>

          <section class="drawer-section">
            <h3>差异高亮</h3>
            <table class="diff-table">
              <thead>
                <tr>
                  <th>字段</th>
                  <th>OCR</th>
                  <th>表单</th>
                  <th>置信度</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="diff in diffsToDisplay" :key="`${activeCase?.case_id}-${diff.key}`" :data-mismatch="diff.mismatch">
                  <td>{{ diffLabel(diff.key) }}</td>
                  <td>{{ diff.ocr_value || '—' }}</td>
                  <td>{{ diff.form_value || '—' }}</td>
                  <td>{{ formatConfidence(diff.confidence) }}</td>
                </tr>
                <tr v-if="!diffsToDisplay.length">
                  <td colspan="4" class="placeholder">暂无差异</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section class="drawer-section" v-if="activeDetail.actions?.length">
            <h3>处理记录</h3>
            <ul class="timeline">
              <li v-for="action in activeDetail.actions" :key="`${activeCase?.case_id}-${action.time}`">
                <span class="timeline__time">{{ formatDateTime(action.time) }}</span>
                <div class="timeline__body">
                  <strong>{{ action.actor }}</strong>
                  <span class="timeline__action">{{ actionLabel(action.action) }}</span>
                  <span v-if="action.note" class="timeline__note">{{ action.note }}</span>
                </div>
              </li>
            </ul>
          </section>

          <div class="drawer-actions">
            <Button size="sm" variant="secondary" @click="openActionModal('approve')" :disabled="!activeCaseId || actionLoading">
              通过
            </Button>
            <Button size="sm" variant="danger" @click="openActionModal('reject')" :disabled="!activeCaseId || actionLoading">
              拒绝
            </Button>
            <Button size="sm" variant="secondary" @click="openActionModal('request_more')" :disabled="!activeCaseId || actionLoading">
              补充材料
            </Button>
            <Button size="sm" variant="ghost" @click="syncCallback" :loading="callbackSyncing" :disabled="!activeCaseId || callbackSyncing">
              同步三方回调
            </Button>
          </div>
        </div>
        <div class="drawer__body" v-else>
          <p class="drawer__placeholder">请选择一个案件查看详情。</p>
        </div>
      </aside>
    </div>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>

    <Modal v-model="actionModalVisible" @confirm="submitAction">
      <template #title>{{ modalTitle }}</template>
      <form class="modal-form" @submit.prevent>
        <label v-if="actionType === 'request_more'">
          <span>需要补充的字段（逗号分隔）</span>
          <input type="text" v-model.trim="actionFields" placeholder="如 身份证正面, 住所证明" />
        </label>
        <label v-if="actionType !== null">
          <span>备注{{ actionType === 'approve' ? '（可选）' : '（至少 5 字）' }}</span>
          <textarea v-model.trim="actionNote" rows="3" placeholder="填写处理说明" />
        </label>
      </form>
      <template #footer>
        <Button variant="secondary" @click="closeActionModal" :disabled="actionLoading">取消</Button>
        <Button
          variant="primary"
          :loading="actionLoading"
          @click="submitAction"
          :disabled="!canSubmitAction"
        >
          确认
        </Button>
      </template>
    </Modal>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import Button from '@/components/Button.vue';
import Pagination from '@/components/Pagination.vue';
import Table from '@/components/Table.vue';
import Modal from '@/components/Modal.vue';
import {
  KycService,
  type KycCaseDetail,
  type KycCaseListItem,
  type KycCaseListResponse,
  type KycDiff,
  type KycRiskLevel,
  type KycStatus
} from '@/sdk/risk';

const DEFAULT_END = '2025-10-03';
const DEFAULT_START = '2025-09-30';

const filters = reactive({
  start_date: DEFAULT_START,
  end_date: DEFAULT_END,
  status: '' as KycStatus | '',
  risk_level: '' as KycRiskLevel | '',
  channel: '',
  source: '' as 'auto' | 'manual' | '',
  id_type: '',
  page: 1,
  page_size: 20
});

const statusOptions = [
  { value: 'pending', label: '待审核' },
  { value: 'need_more', label: '待补资料' },
  { value: 'approved', label: '已通过' },
  { value: 'rejected', label: '已拒绝' },
  { value: 'callback_error', label: '回调异常' }
] satisfies Array<{ value: KycStatus; label: string }>;

const riskLevelOptions = [
  { value: 'low', label: '低' },
  { value: 'medium', label: '中' },
  { value: 'high', label: '高' },
  { value: 'critical', label: '极高' }
] satisfies Array<{ value: KycRiskLevel; label: string }>;

const channelOptions = [
  { value: 'wechat', label: '微信' },
  { value: 'h5', label: 'H5' },
  { value: 'app', label: 'APP' },
  { value: 'api', label: 'API' }
];

const sourceOptions = [
  { value: 'auto', label: '自动' },
  { value: 'manual', label: '人工' }
];

const idTypeOptions = [
  { value: 'cn_id', label: '大陆身份证' },
  { value: 'hkid', label: '港澳居民证' },
  { value: 'passport', label: '护照' },
  { value: 'other', label: '其他' }
];

const columns = [
  { key: 'created_at', title: '提交时间', width: '11rem', sortable: true },
  { key: 'case_id', title: '案件号', width: '10rem' },
  { key: 'status', title: '状态', width: '6rem' },
  { key: 'risk_level', title: '风险等级', width: '7rem' },
  { key: 'channel', title: '渠道', width: '6rem' },
  { key: 'source', title: '来源', width: '6rem' },
  { key: 'id_type', title: '证件类型', width: '8rem' },
  { key: 'order_id', title: '订单号', width: '9rem' },
  { key: 'user_id', title: '用户 ID', width: '8rem' },
  { key: 'assignee_id', title: '指派', width: '6rem' }
];

const cases = ref<KycCaseListItem[]>([]);
const total = ref(0);

const listLoading = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');
const drawerVisible = ref(false);
const activeCaseId = ref<string | null>(null);
const detailCache = reactive<Record<string, KycCaseDetail>>({});
const detailLoading = ref(false);

const actionModalVisible = ref(false);
const actionType = ref<'approve' | 'reject' | 'request_more' | null>(null);
const actionNote = ref('');
const actionFields = ref('');
const actionLoading = ref(false);
const callbackSyncing = ref(false);

function placeholderImage(label: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="#F3F4F6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#6B7280" font-family="Arial,Helvetica,sans-serif" font-size="20">${label}</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const fallbackCases: KycCaseListItem[] = [
  {
    case_id: 'KYC20251003001',
    created_at: '2025-10-03T09:30:00+08:00',
    status: 'pending',
    risk_level: 'high',
    channel: 'wechat',
    source: 'auto',
    id_type: 'cn_id',
    order_id: 'O20251002001',
    user_id: 'U138000',
    assignee_id: null
  },
  {
    case_id: 'KYC20251002008',
    created_at: '2025-10-02T14:12:00+08:00',
    status: 'need_more',
    risk_level: 'medium',
    channel: 'h5',
    source: 'manual',
    id_type: 'passport',
    order_id: 'O20251001088',
    user_id: 'U556677',
    assignee_id: 'U2005'
  },
  {
    case_id: 'KYC20250930015',
    created_at: '2025-09-30T11:05:00+08:00',
    status: 'callback_error',
    risk_level: 'critical',
    channel: 'api',
    source: 'auto',
    id_type: 'cn_id',
    order_id: 'O20250928022',
    user_id: 'U998800',
    assignee_id: 'U2002'
  }
];

const fallbackDetails: Record<string, KycCaseDetail> = {
  KYC20251003001: {
    case_id: 'KYC20251003001',
    created_at: '2025-10-03T09:30:00+08:00',
    status: 'pending',
    risk_level: 'high',
    channel: 'wechat',
    source: 'auto',
    id_type: 'cn_id',
    order_id: 'O20251002001',
    user_id: 'U138000',
    assignee_id: null,
    double_review: true,
    materials: {
      id_front_url: placeholderImage('证件正面'),
      id_back_url: placeholderImage('证件背面'),
      selfie_url: placeholderImage('自拍'),
      liveness_score: 0.92,
      psl_similarity: 0.88
    },
    ocr: {
      name: '张三',
      id_number: '4401********1234',
      birth_date: '1995-06-18',
      gender: 'M',
      address: '广东省广州市天河区体育西路 1 号',
      valid_from: '2021-01-01',
      valid_to: '2031-01-01',
      confidence: 0.94
    },
    form: {
      name: '张三',
      id_number: '4401********1234',
      birth_date: '1995-06-18',
      gender: 'M',
      address: '广东省广州市天河区体育西路 1 号'
    },
    diffs: [
      { key: 'name', ocr_value: '张三', form_value: '张三', confidence: 0.94, mismatch: false },
      { key: 'id_number', ocr_value: '4401********1234', form_value: '4401********1234', confidence: 0.92, mismatch: false },
      { key: 'address', ocr_value: '广东省广州市天河区体育西路一号', form_value: '广东省广州市天河区体育西路 1 号', confidence: 0.76, mismatch: true }
    ],
    actions: [{ time: '2025-10-03T09:31:00+08:00', actor: '系统', action: 'auto_review', note: '触发人工复核' }]
  },
  KYC20251002008: {
    case_id: 'KYC20251002008',
    created_at: '2025-10-02T14:12:00+08:00',
    status: 'need_more',
    risk_level: 'medium',
    channel: 'h5',
    source: 'manual',
    id_type: 'passport',
    order_id: 'O20251001088',
    user_id: 'U556677',
    assignee_id: 'U2005',
    double_review: false,
    materials: {
      id_front_url: placeholderImage('证件正面'),
      selfie_url: placeholderImage('自拍'),
      extra_images: [placeholderImage('补充材料')]
    },
    ocr: {
      name: 'LEE KA',
      id_number: 'P12345678',
      birth_date: '1992-03-08',
      gender: 'F',
      valid_from: '2020-06-01',
      valid_to: '2030-05-31'
    },
    form: {
      name: 'LEE KA',
      id_number: 'P12345678',
      birth_date: '1992-03-08',
      gender: 'F',
      address: '香港九龙弥敦道 99 号'
    },
    diffs: [
      { key: 'address', ocr_value: '——', form_value: '香港九龙弥敦道 99 号', confidence: 0.4, mismatch: true }
    ],
    actions: [
      { time: '2025-10-02T14:20:00+08:00', actor: '李秀', action: 'request_more', note: '请补充住址证明' }
    ]
  },
  KYC20250930015: {
    case_id: 'KYC20250930015',
    created_at: '2025-09-30T11:05:00+08:00',
    status: 'callback_error',
    risk_level: 'critical',
    channel: 'api',
    source: 'auto',
    id_type: 'cn_id',
    order_id: 'O20250928022',
    user_id: 'U998800',
    assignee_id: 'U2002',
    double_review: true,
    materials: {
      id_front_url: placeholderImage('证件正面'),
      selfie_url: placeholderImage('自拍')
    },
    ocr: {
      name: '李四',
      id_number: '3301********5678',
      birth_date: '1988-11-20',
      gender: 'M',
      address: '浙江省杭州市西湖区灵隐路 18 号',
      valid_from: '2022-05-01',
      valid_to: '2032-04-30'
    },
    form: {
      name: '李四',
      id_number: '3301********5678',
      birth_date: '1988-11-20',
      gender: 'M',
      address: '浙江省杭州市西湖区灵隐路 18 号'
    },
    diffs: [{ key: 'liveness_score', ocr_value: '0.62', form_value: '0.90', confidence: 0.62, mismatch: true }],
    actions: [
      { time: '2025-09-30T11:07:00+08:00', actor: '三方供应商', action: 'callback_error', note: '签名校验失败' },
      { time: '2025-09-30T11:09:00+08:00', actor: '系统', action: 'auto_retry', note: '等待重放' }
    ]
  }
};

const summaryStats = computed(() => {
  const result = {
    pending: 0,
    needMore: 0,
    approved: 0,
    callbackError: 0,
    processedToday: 0,
    approvalRate: '0%'
  };
  const today = new Date().toISOString().slice(0, 10);
  let reviewedCount = 0;
  let approvedCount = 0;
  cases.value.forEach((item) => {
    if (item.status === 'pending') result.pending += 1;
    if (item.status === 'need_more') result.needMore += 1;
    if (item.status === 'approved') {
      result.approved += 1;
      approvedCount += 1;
    }
    if (item.status === 'callback_error') result.callbackError += 1;
    if (item.status !== 'pending') reviewedCount += 1;
    if (item.created_at.startsWith(today)) result.processedToday += 1;
  });
  if (reviewedCount > 0) {
    const rate = Math.round((approvedCount / reviewedCount) * 100);
    result.approvalRate = `${rate}%`;
  }
  return result;
});

const pageCount = computed(() => Math.max(1, Math.ceil(total.value / (filters.page_size || 10))));
const activeCase = computed(() => (activeCaseId.value ? cases.value.find((item) => item.case_id === activeCaseId.value) || null : null));
const activeDetail = computed(() => (activeCaseId.value ? detailCache[activeCaseId.value] : null));
const hasMaterials = computed(() => {
  const mats = activeDetail.value?.materials;
  if (!mats) return false;
  return Boolean(mats.id_front_url || mats.id_back_url || mats.selfie_url || (mats.extra_images?.length || 0) > 0);
});

const materialsMetrics = computed(() => {
  const mats = activeDetail.value?.materials;
  if (!mats) return [];
  const metrics: Array<{ label: string; value: string }> = [];
  if (typeof mats.liveness_score === 'number') {
    metrics.push({ label: '活体得分', value: (mats.liveness_score * 100).toFixed(0) + '%' });
  }
  if (typeof mats.psl_similarity === 'number') {
    metrics.push({ label: '证照相似度', value: (mats.psl_similarity * 100).toFixed(0) + '%' });
  }
  return metrics;
});

const diffsToDisplay = computed<KycDiff[]>(() => {
  if (!activeDetail.value?.diffs?.length) return [];
  return activeDetail.value.diffs;
});

const ocrDisplay = computed<Record<string, string | undefined>>(() => {
  const ocr = activeDetail.value?.ocr;
  if (!ocr) return {};
  return {
    name: ocr.name,
    id_number: ocr.id_number,
    birth_date: ocr.birth_date,
    gender: ocr.gender,
    address: ocr.address,
    issued_by: ocr.issued_by,
    valid_from: ocr.valid_from,
    valid_to: ocr.valid_to,
    confidence: ocr.confidence !== undefined ? `${Math.round((ocr.confidence || 0) * 100)}%` : undefined
  };
});

const modalTitle = computed(() => {
  if (!actionModalVisible.value || !actionType.value) return '';
  if (actionType.value === 'approve') return '确认通过案件';
  if (actionType.value === 'reject') return '拒绝案件';
  return '请求补充材料';
});

const canSubmitAction = computed(() => {
  if (!actionModalVisible.value || !actionType.value) return false;
  if (!activeCaseId.value) return false;
  if (actionType.value === 'approve') return !actionLoading.value;
  if (actionType.value === 'reject') {
    return actionNote.value.trim().length >= 5 && !actionLoading.value;
  }
  if (actionType.value === 'request_more') {
    return actionNote.value.trim().length >= 5 && actionFields.value.trim().length > 0 && !actionLoading.value;
  }
  return false;
});

watch(actionModalVisible, (visible) => {
  if (!visible) {
    actionType.value = null;
    actionNote.value = '';
    actionFields.value = '';
  }
});

onMounted(() => {
  loadCases();
});

async function loadCases() {
  listLoading.value = true;
  try {
    const response = await KycService.list({ ...filters });
    const payload = (response || {}) as Partial<KycCaseListResponse>;
    const items = Array.isArray(payload.items) ? (payload.items as KycCaseListItem[]) : [];
    if (!items.length) {
      cases.value = [...fallbackCases];
      total.value = fallbackCases.length;
    } else {
      cases.value = items;
      total.value = typeof payload.total === 'number' ? payload.total : items.length;
    }
  } catch (error) {
    cases.value = [...fallbackCases];
    total.value = fallbackCases.length;
    showError((error as Error).message || '加载 KYC 案件失败');
  } finally {
    listLoading.value = false;
    if (activeCaseId.value && !cases.value.some((item) => item.case_id === activeCaseId.value)) {
      closeDrawer();
    }
  }
}

function applyFilters() {
  filters.page = 1;
  loadCases();
}

function resetFilters() {
  filters.start_date = DEFAULT_START;
  filters.end_date = DEFAULT_END;
  filters.status = '';
  filters.risk_level = '';
  filters.channel = '';
  filters.source = '';
  filters.id_type = '';
  filters.page = 1;
  filters.page_size = 20;
  loadCases();
}

function changePage(page: number) {
  filters.page = page;
  loadCases();
}

function changePageSize(size: number) {
  filters.page_size = size;
  filters.page = 1;
  loadCases();
}

function openCase(row: KycCaseListItem) {
  activeCaseId.value = row.case_id;
  drawerVisible.value = true;
  ensureDetail(row.case_id);
}

function closeDrawer() {
  drawerVisible.value = false;
  activeCaseId.value = null;
}

async function ensureDetail(caseId: string) {
  if (detailCache[caseId]) return;
  detailLoading.value = true;
  try {
    const detail = await KycService.getDetail(caseId);
    if (detail) {
      detailCache[caseId] = detail;
    } else {
      detailCache[caseId] = fallbackDetails[caseId] || fallbackDetails[fallbackCases[0].case_id];
    }
  } catch (error) {
    showError((error as Error).message || '获取案件详情失败，将展示示例数据');
    detailCache[caseId] = fallbackDetails[caseId] || fallbackDetails[fallbackCases[0].case_id];
  } finally {
    detailLoading.value = false;
  }
}

function openActionModal(type: 'approve' | 'reject' | 'request_more') {
  if (!activeCaseId.value) return;
  actionType.value = type;
  actionModalVisible.value = true;
}

function closeActionModal() {
  actionModalVisible.value = false;
}

async function submitAction() {
  if (!actionType.value || !activeCaseId.value) return;
  if (!canSubmitAction.value) return;
  actionLoading.value = true;
  try {
    if (actionType.value === 'approve') {
      await KycService.approve(activeCaseId.value, actionNote.value ? { note: actionNote.value } : undefined);
      updateCaseStatus(activeCaseId.value, 'approved');
      showFeedback('案件已通过');
    } else if (actionType.value === 'reject') {
      await KycService.reject(activeCaseId.value, {
        note: actionNote.value,
        reason_code: 'manual_review'
      });
      updateCaseStatus(activeCaseId.value, 'rejected');
      showFeedback('案件已拒绝');
    } else {
      const fields = actionFields.value
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length);
      await KycService.requestMore(activeCaseId.value, {
        note: actionNote.value,
        required_fields: fields
      });
      updateCaseStatus(activeCaseId.value, 'need_more');
      showFeedback('已请求补充材料');
    }
    if (detailCache[activeCaseId.value]) {
      detailCache[activeCaseId.value] = {
        ...detailCache[activeCaseId.value],
        status: actionType.value === 'approve' ? 'approved' : actionType.value === 'reject' ? 'rejected' : 'need_more',
        actions: appendAction(detailCache[activeCaseId.value].actions, actionType.value, actionNote.value)
      };
    }
    actionModalVisible.value = false;
  } catch (error) {
    showError((error as Error).message || '执行操作失败');
  } finally {
    actionLoading.value = false;
  }
}

async function syncCallback() {
  if (!activeCaseId.value || callbackSyncing.value) return;
  callbackSyncing.value = true;
  try {
    await KycService.syncCallback(activeCaseId.value);
    showFeedback('已触发回调同步');
    if (detailCache[activeCaseId.value]) {
      detailCache[activeCaseId.value] = {
        ...detailCache[activeCaseId.value],
        actions: appendAction(detailCache[activeCaseId.value].actions, 'sync_callback', '手动同步回调')
      };
    }
  } catch (error) {
    showError((error as Error).message || '回调同步失败');
  } finally {
    callbackSyncing.value = false;
  }
}

async function exportCases() {
  try {
    await KycService.exportCases({ ...filters });
    showFeedback('导出任务已创建，请前往导出中心查看');
  } catch (error) {
    showError((error as Error).message || '导出失败');
  }
}

function updateCaseStatus(caseId: string, status: KycStatus) {
  cases.value = cases.value.map((item) => (item.case_id === caseId ? { ...item, status } : item));
}

function appendAction(list: KycCaseDetail['actions'], action: string, note?: string) {
  const next = Array.isArray(list) ? [...list] : [];
  next.unshift({
    time: new Date().toISOString(),
    actor: '当前用户',
    action,
    note
  });
  return next;
}

function showFeedback(message: string) {
  feedbackMessage.value = message;
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

function formatDateTime(value: string | undefined) {
  if (!value) return '—';
  try {
    const date = new Date(value);
    return new Intl.DateTimeFormat('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return value;
  }
}

function formatConfidence(confidence?: number | null) {
  if (confidence === undefined || confidence === null || Number.isNaN(confidence)) return '—';
  return `${Math.round(confidence * 100)}%`;
}

function statusLabel(status: KycStatus) {
  const map: Record<KycStatus, string> = {
    pending: '待审核',
    need_more: '待补资料',
    approved: '已通过',
    rejected: '已拒绝',
    callback_error: '回调异常'
  };
  return map[status] || status;
}

function riskLevelLabel(level: KycRiskLevel) {
  const map: Record<KycRiskLevel, string> = {
    low: '低',
    medium: '中',
    high: '高',
    critical: '极高'
  };
  return map[level] || level;
}

function channelLabel(channel: string) {
  const map: Record<string, string> = {
    wechat: '微信',
    h5: 'H5',
    app: 'APP',
    api: 'API'
  };
  return map[channel] || channel || '—';
}

function sourceLabel(source: 'auto' | 'manual' | '') {
  if (source === 'auto') return '自动';
  if (source === 'manual') return '人工';
  return '—';
}

function idTypeLabel(idType: string) {
  const map: Record<string, string> = {
    cn_id: '大陆身份证',
    hkid: '港澳居民证',
    passport: '护照',
    other: '其他'
  };
  return map[idType] || idType || '—';
}

function ocrLabel(key: string) {
  const map: Record<string, string> = {
    name: '姓名',
    id_number: '证件号',
    birth_date: '出生日期',
    gender: '性别',
    address: '地址',
    issued_by: '签发机关',
    valid_from: '有效期自',
    valid_to: '有效期至',
    confidence: '整体置信度'
  };
  return map[key] || key;
}

function diffLabel(key: string) {
  const map: Record<string, string> = {
    name: '姓名',
    id_number: '证件号',
    birth_date: '出生日期',
    gender: '性别',
    address: '地址',
    liveness_score: '活体得分',
    psl_similarity: '相似度'
  };
  return map[key] || key;
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    auto_review: '自动分流',
    assign: '指派',
    approve: '通过',
    reject: '拒绝',
    request_more: '请求补充',
    sync_callback: '同步回调',
    auto_retry: '自动重试',
    callback_error: '回调异常'
  };
  return map[action] || action;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$card-radius: $radius-xl;
$panel-bg: $surface-0;
$success-bg: rgba($primary-100, 0.5);
$success-strong: $primary-700;
$warning-bg: rgba($color-warning-soft, 0.6);
$warning-strong: $color-warning-strong;
$danger-bg: rgba($danger-600, 0.16);
$danger-strong: $danger-700;
$danger-stronger: $danger-800;
$feedback-success-bg: rgba($primary-100, 0.5);
$feedback-error-bg: rgba($danger-600, 0.12);

.kyc-console {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
  color: $text-strong;
}

.kyc-console__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: $spacing-16;
}

.kyc-console__title {
  margin: 0 0 $spacing-8;
  font-size: $title-18-semibold-fs;
  line-height: $title-18-semibold-lh;
  font-weight: $title-18-semibold-wt;
}

.kyc-console__subtitle {
  margin: 0;
  color: $text-muted;
  font-size: $text-12-regular-fs;
}

.kyc-console__actions {
  display: flex;
  gap: $spacing-12;
}

.kyc-console__summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: $spacing-16;
}

.summary-card {
  background: $panel-bg;
  border: $border-width-1 solid $surface-200;
  border-radius: $card-radius;
  padding: $spacing-16;
  box-shadow: 0 12px 30px rgba($color-surface-700, 0.06);

  h3 {
    margin: 0;
    font-size: $text-12-medium-fs;
    color: $text-muted;
  }

  strong {
    display: block;
    margin-top: $spacing-8;
    font-size: $text-16-semibold-fs;
  }
}

.summary-card--critical {
  border-color: rgba($color-danger-600, 0.35);
  strong {
    color: $color-danger-600;
  }
}

.kyc-console__filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: $spacing-12;
  align-items: flex-end;

  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  input,
  select {
    height: $control-height;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: 0 $spacing-12;
    font: inherit;
    color: $text-strong;
  }
}

.filters__actions {
  display: flex;
  gap: $spacing-12;
}

.kyc-console__layout {
  display: grid;
  grid-template-columns: minmax(40rem, 1fr) minmax(24rem, 28rem);
  gap: $spacing-24;
}

.kyc-console__table {
  background: $panel-bg;
  border: $border-width-1 solid $surface-200;
  border-radius: $card-radius;
  box-shadow: 0 14px 36px rgba($color-surface-700, 0.06);
  padding: $spacing-12;
}

.kyc-console__drawer {
  background: $panel-bg;
  border: $border-width-1 solid $surface-200;
  border-radius: $card-radius;
  box-shadow: 0 18px 48px rgba($color-surface-700, 0.1);
  display: flex;
  flex-direction: column;
  max-height: 42rem;
}

.drawer__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: $spacing-16 $spacing-20;
  border-bottom: $border-width-1 solid $surface-200;

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
  gap: $spacing-16;
}

.drawer__placeholder {
  margin: 0;
  color: $text-muted;
  text-align: center;
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

.materials {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: $spacing-12;

  figure {
    margin: 0;
    display: flex;
    flex-direction: column;
    gap: $spacing-8;
    background: $surface-50;
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-12;

    img {
      width: 100%;
      aspect-ratio: 4 / 3;
      object-fit: cover;
      border-radius: $radius-8;
    }

    figcaption {
      text-align: center;
      font-size: $text-12-regular-fs;
      color: $text-muted;
    }
  }
}

.material-metrics {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  gap: $spacing-16;
  font-size: $text-12-medium-fs;
  color: $text-muted;

  li {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);

    strong {
      font-size: $text-16-semibold-fs;
      color: $text-strong;
    }
  }
}

.diff-table {
  width: 100%;
  border-collapse: collapse;
  border: $border-width-1 solid $surface-200;
  border-radius: $radius-lg;
  overflow: hidden;

  th,
  td {
    padding: $spacing-10 $spacing-12;
    font-size: $text-12-regular-fs;
  }

  thead th {
    background: $surface-50;
    color: $text-muted;
    text-align: left;
  }

  tbody tr:nth-child(even) {
    background: $surface-25;
  }

  tbody tr[data-mismatch='true'] {
    background: $danger-bg;
    td {
      color: $danger-strong;
      font-weight: $text-12-medium-wt;
    }
  }

  .placeholder {
    text-align: center;
    color: $text-muted;
  }
}

.timeline {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;

  li {
    display: flex;
    gap: $spacing-12;
    align-items: flex-start;
  }
}

.timeline__time {
  font-size: $text-12-regular-fs;
  color: $text-muted;
  min-width: 8.5rem;
}

.timeline__body {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  strong {
    font-size: $text-12-medium-fs;
  }
}

.timeline__action {
  font-size: $text-12-regular-fs;
  color: $text-muted;
}

.timeline__note {
  font-size: $text-12-regular-fs;
  color: $warning-strong;
}

.drawer-actions {
  display: flex;
  gap: $spacing-12;
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-lg;
  font-size: $text-12-regular-fs;
  background: $feedback-success-bg;
  color: $success-strong;

  &.feedback--error {
    background: $feedback-error-bg;
    color: $danger-strong;
  }
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: $spacing-12;

  label {
    display: flex;
    flex-direction: column;
    gap: calc(#{$spacing-8} / 2);
    font-size: $text-12-regular-fs;
    color: $text-muted;
  }

  input,
  textarea {
    border: $border-width-1 solid $surface-200;
    border-radius: $radius-lg;
    padding: $spacing-8 $spacing-12;
    font: inherit;
    color: $text-strong;
  }

  textarea {
    resize: vertical;
  }
}

.risk-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 3.5rem;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  line-height: $text-12-medium-lh;
  color: $text-strong;
  background: $surface-100;

  &[data-level='high'],
  &[data-level='critical'] {
    background: $danger-bg;
    color: $danger-strong;
  }

  &[data-level='medium'] {
    background: $warning-bg;
    color: $warning-strong;
  }

  &[data-level='low'] {
    background: $success-bg;
    color: $success-strong;
  }
}

.status-chip {
  display: inline-flex;
  padding: 0 $spacing-8;
  border-radius: $radius-lg;
  font-size: $text-12-medium-fs;
  line-height: $text-12-medium-lh;
  background: $surface-100;
  color: $text-muted;

  &[data-status='pending'] {
    background: rgba($color-primary-100, 0.4);
    color: $color-primary-700;
  }

  &[data-status='need_more'] {
    background: $warning-bg;
    color: $warning-strong;
  }

  &[data-status='approved'] {
    background: $success-bg;
    color: $success-strong;
  }

  &[data-status='rejected'] {
    background: $danger-bg;
    color: $danger-strong;
  }

  &[data-status='callback_error'] {
    background: rgba($danger-600, 0.22);
    color: $danger-stronger;
  }
}

@media (max-width: 80rem) {
  .kyc-console__layout {
    grid-template-columns: 1fr;
  }

  .kyc-console__drawer {
    max-height: none;
  }
}
</style>
