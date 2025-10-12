<template>
  <section class="detail">
    <header class="detail__head">
      <div>
        <button type="button" class="link-btn" @click="goBack">返回列表</button>
        <h1 class="detail__title">订单 {{ order?.order_id || route.params.orderId }}</h1>
        <p class="detail__subtitle">查看订单材料、结算与流转日志，并执行复核操作。</p>
      </div>
      <div class="detail__actions" v-if="order">
        <span class="status-tag" :data-status="order.status">{{ statusLabel(order.status) }}</span>
        <button type="button" class="btn" @click="openReview('approve')" :disabled="loading">通过</button>
        <button type="button" class="btn btn--danger" @click="openReview('reject')" :disabled="loading">驳回</button>
      </div>
    </header>

    <div v-if="loading" class="placeholder">加载中...</div>
    <div v-else-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</div>
    <div v-else-if="order" class="detail__grid">
      <section class="card">
        <h2>基本信息</h2>
        <dl>
          <div>
            <dt>订单号</dt>
            <dd>{{ order.order_id }}</dd>
          </div>
          <div>
            <dt>下单时间</dt>
            <dd>{{ formatDateTime(order.created_at) }}</dd>
          </div>
          <div>
            <dt>状态</dt>
            <dd>{{ statusLabel(order.status) }}</dd>
          </div>
          <div>
            <dt>渠道</dt>
            <dd>{{ order.channel }}</dd>
          </div>
          <div>
            <dt>门店</dt>
            <dd>{{ order.store_id || '-' }}</dd>
          </div>
          <div>
            <dt>活动</dt>
            <dd>{{ order.campaign_id || '-' }}</dd>
          </div>
          <div>
            <dt>金额</dt>
            <dd>{{ formatCurrency(order.amount) }}</dd>
          </div>
          <div>
            <dt>冻结金额</dt>
            <dd>{{ order.frozen_amount !== undefined ? formatCurrency(order.frozen_amount) : '-' }}</dd>
          </div>
          <div>
            <dt>实际入账</dt>
            <dd>{{ order.settled_amount !== null && order.settled_amount !== undefined ? formatCurrency(order.settled_amount) : '-' }}</dd>
          </div>
        </dl>
      </section>

      <section class="card">
        <h2>用户信息</h2>
        <dl>
          <div>
            <dt>用户</dt>
            <dd>{{ order.user?.name || '-' }}</dd>
          </div>
          <div>
            <dt>手机号</dt>
            <dd>{{ order.user?.phone || '-' }}</dd>
          </div>
          <div>
            <dt>证件号</dt>
            <dd>{{ order.user?.id_number || '-' }}</dd>
          </div>
        </dl>
      </section>

      <section class="card">
        <h2>上传材料</h2>
        <div v-if="order.materials && order.materials.length" class="materials">
          <article v-for="material in order.materials" :key="material.url" class="material-card">
            <div class="material-card__meta">
              <span class="material-card__type">{{ material.type }}</span>
              <span>{{ formatDateTime(material.uploaded_at) }}</span>
            </div>
            <a class="link-btn" :href="material.url" target="_blank" rel="noreferrer">查看原图</a>
            <pre v-if="material.ocr" class="material-card__ocr">{{ pretty(material.ocr) }}</pre>
          </article>
        </div>
        <p v-else class="placeholder">暂无材料</p>
      </section>

      <section class="card">
        <h2>风控命中</h2>
        <div v-if="order.risk_hits && order.risk_hits.length" class="risk-list">
          <article v-for="hit in order.risk_hits" :key="hit.rule_id" class="risk-item">
            <strong>{{ hit.rule_name }}</strong>
            <span class="risk-item__level">{{ hit.level }}</span>
            <p>{{ hit.desc }}</p>
          </article>
        </div>
        <p v-else class="placeholder">未命中风控规则</p>
      </section>

      <section class="card card--wide">
        <h2>流转日志</h2>
        <ul v-if="order.audits && order.audits.length" class="audit">
          <li v-for="item in order.audits" :key="item.time">
            <span class="audit__time">{{ formatDateTime(item.time) }}</span>
            <span class="audit__actor">{{ item.actor }}</span>
            <span class="audit__action">{{ item.action }}</span>
            <span>{{ item.note || '-' }}</span>
          </li>
        </ul>
        <p v-else class="placeholder">暂无日志</p>
      </section>
    </div>

    <p v-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>

    <div v-if="showReviewModal" class="modal">
      <div class="modal__body">
        <header>
          <h2>{{ reviewAction === 'approve' ? '通过订单' : '驳回订单' }}</h2>
        </header>
        <section class="modal__content">
          <p>订单号：{{ order?.order_id }}</p>
          <label class="modal__field">
            <span>备注（至少 5 个字符）</span>
            <textarea class="textarea" v-model.trim="reviewNote" rows="4" placeholder="请输入备注" />
          </label>
        </section>
        <footer class="modal__footer">
          <button type="button" class="btn btn--ghost" @click="closeReviewModal">取消</button>
          <button type="button" class="btn" :class="{ 'btn--danger': reviewAction === 'reject' }" :disabled="reviewNote.length < 5 || loading" @click="submitReview">
            确认提交
          </button>
        </footer>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import {
  OrdersService,
  type OrderDetailResponse,
  type OrderReviewRequest
} from '@/sdk';

type ReviewAction = 'approve' | 'reject';

const route = useRoute();
const router = useRouter();

const order = ref<OrderDetailResponse | null>(null);
const loading = ref(false);
const errorMessage = ref('');
const feedbackMessage = ref('');

const showReviewModal = ref(false);
const reviewAction = ref<ReviewAction>('approve');
const reviewNote = ref('');

const statusMap: Record<string, string> = {
  pending: '待提交',
  auto_reject: '自动拒绝',
  under_review: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  settled: '已结算'
};

const currencyFormatter = new Intl.NumberFormat('zh-CN', {
  style: 'currency',
  currency: 'CNY',
  minimumFractionDigits: 2
});

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit'
});

function statusLabel(status?: string) {
  if (!status) return '-';
  return statusMap[status] || status;
}

function formatCurrency(value?: number | null) {
  if (value === null || value === undefined) return '-';
  return currencyFormatter.format(value);
}

function formatDateTime(value?: string) {
  if (!value) return '-';
  try {
    return dateFormatter.format(new Date(value));
  } catch (error) {
    return value;
  }
}

function pretty(value: unknown) {
  return JSON.stringify(value, null, 2);
}

function goBack() {
  router.back();
}

function openReview(action: ReviewAction) {
  reviewAction.value = action;
  reviewNote.value = '';
  showReviewModal.value = true;
}

function closeReviewModal() {
  showReviewModal.value = false;
  reviewNote.value = '';
}

async function submitReview() {
  if (!order.value || reviewNote.value.length < 5) return;
  loading.value = true;
  errorMessage.value = '';
  try {
    const payload: OrderReviewRequest = {
      action: reviewAction.value,
      note: reviewNote.value,
      reviewer_id: 'demo-reviewer'
    };
    const response = await OrdersService.reviewOrder(order.value.order_id, payload);
    order.value = { ...order.value, status: response.new_status ?? order.value.status };
    feedbackMessage.value = `订单已${reviewAction.value === 'approve' ? '通过' : '驳回'}。`;
    closeReviewModal();
  } catch (error: any) {
    errorMessage.value = error?.message || '提交审核失败，请稍后再试。';
  } finally {
    loading.value = false;
  }
}

function friendlyError(message?: string) {
  if (!message) return '加载订单详情失败，请稍后再试。';
  if (message.includes('Failed to fetch') || message.includes('NetworkError')) {
    return '无法连接到订单详情接口，请确认 Mock 服务已启动或网络可用。';
  }
  return message;
}

async function loadDetail() {
  const orderId = route.params.orderId as string;
  if (!orderId) {
    errorMessage.value = '缺少订单号。';
    return;
  }
  loading.value = true;
  errorMessage.value = '';
  try {
    order.value = await OrdersService.getOrderDetail(orderId);
  } catch (error: any) {
    errorMessage.value = friendlyError(error?.message);
  } finally {
    loading.value = false;
  }
}

onMounted(() => {
  loadDetail();
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.detail {
  display: flex;
  flex-direction: column;
  gap: $spacing-24;
}

.detail__head {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
  align-items: flex-start;
}

.link-btn {
  border: none;
  background: transparent;
  color: $color-primary-700;
  cursor: pointer;
  padding: 0;
}

.detail__title {
  margin: $spacing-8 0 0;
  font-size: calc(#{$font-size-16} * 1.25);
  font-weight: $font-weight-semibold;
}

.detail__subtitle {
  margin: $spacing-8 0 0;
  color: $color-surface-500;
  font-size: $font-size-16;
}

.detail__actions {
  display: flex;
  align-items: center;
  gap: $spacing-12;
}

.status-tag {
  display: inline-flex;
  align-items: center;
  padding: $spacing-8;
  border-radius: $radius-8;
  background: $color-surface-100;
  color: $color-text-strong;
}

.status-tag[data-status='approved'] {
  background: $color-primary-50;
  color: $color-primary-700;
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

.btn--ghost {
  background: transparent;
  color: $color-primary-700;
}

.btn--danger {
  border-color: $color-surface-500;
  background: $color-surface-300;
  color: $color-surface-0;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.detail__grid {
  display: grid;
  gap: $spacing-16;
  grid-template-columns: repeat(auto-fit, minmax(calc(#{$spacing-16} * 12), 1fr));
}

.card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-12;
}

.card h2 {
  margin: 0;
  font-size: $font-size-16;
  font-weight: $font-weight-semibold;
}

.card dl {
  margin: 0;
  display: grid;
  gap: $spacing-12;
}

.card dl div {
  display: flex;
  justify-content: space-between;
  gap: $spacing-12;
  color: $color-text-strong;
}

.card dl dt {
  color: $color-surface-500;
}

.materials {
  display: grid;
  gap: $spacing-12;
}

.material-card {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-12;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.material-card__meta {
  display: flex;
  justify-content: space-between;
  color: $color-surface-500;
}

.material-card__type {
  font-weight: $font-weight-medium;
}

.material-card__ocr {
  margin: 0;
  padding: $spacing-8;
  background: $color-surface-100;
  border-radius: $radius-8;
  font-size: $font-size-12;
  color: $color-surface-700;
}

.risk-list {
  display: grid;
  gap: $spacing-12;
}

.risk-item {
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-12;
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.risk-item__level {
  color: $color-primary-700;
}

.audit {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: $spacing-8;
}

.audit li {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: center;
  gap: $spacing-8;
  padding: $spacing-8 $spacing-12;
  border: $border-width-1 solid $color-surface-100;
  border-radius: $radius-8;
}

.audit__time {
  color: $color-surface-500;
}

.card--wide {
  grid-column: 1 / -1;
}

.placeholder {
  margin: 0;
  color: $color-surface-500;
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

.modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: grid;
  place-items: center;
  padding: $spacing-24;
  z-index: 1000;
}

.modal__body {
  width: min(480px, 100%);
  background: $color-surface-0;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  padding: $spacing-16;
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.modal__content {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
}

.modal__field {
  display: flex;
  flex-direction: column;
  gap: $spacing-8;
}

.textarea {
  width: 100%;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  padding: $spacing-8 $spacing-12;
  background: $color-surface-0;
  color: $color-text-strong;
}
</style>
