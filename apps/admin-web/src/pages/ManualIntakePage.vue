<template>
  <section class="manual">
    <header class="manual__head">
      <div>
        <h1 class="manual__title">手动录单</h1>
        <p class="manual__subtitle">在 AI 不可用或识别失败时，可通过标准化表单人工录入订单信息。</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/intake/ai">转 AI 录单</RouterLink>
    </header>

    <article class="manual__notice">
      <strong>录入提示：</strong>
      <span>请确认已与客户取得授权，信息仅用于订单创建与风控校验。</span>
    </article>

    <form class="manual__form" @submit.prevent="submit">
      <div class="manual__grid">
        <fieldset class="card manual__card">
          <legend>基础信息</legend>
          <div class="form__grid">
            <label class="form__field" :data-error="errors.phone">
              <span>手机号<em>*</em></span>
              <input
                class="input"
                type="tel"
                placeholder="请输入手机号"
                v-model="form.phone"
                :disabled="submitting"
                @blur="validateField('phone')"
              />
              <span v-if="errors.phone" class="form__error">{{ errors.phone }}</span>
            </label>
            <label class="form__field" :data-error="errors.name">
              <span>姓名<em>*</em></span>
              <input
                class="input"
                type="text"
                placeholder="请输入姓名"
                v-model="form.name"
                :disabled="submitting"
                @blur="validateField('name')"
              />
              <span v-if="errors.name" class="form__error">{{ errors.name }}</span>
            </label>
            <label class="form__field form__field--combo" :data-error="errors.id_number">
              <span>证件号<em>*</em></span>
              <div class="form__combo">
                <select class="input" v-model="form.idType" :disabled="submitting" @change="validateField('id_number')">
                  <option v-for="option in idTypeOptions" :key="option.value" :value="option.value">
                    {{ option.label }}
                  </option>
                </select>
                <input
                  class="input"
                  type="text"
                  placeholder="请输入证件号码"
                  v-model="form.idNumber"
                  :disabled="submitting"
                  @blur="validateField('id_number')"
                />
              </div>
              <span v-if="errors.id_number" class="form__error">{{ errors.id_number }}</span>
            </label>
            <label class="form__field" :data-error="errors.store_id">
              <span>门店<em>*</em></span>
              <select class="input" v-model="form.storeId" :disabled="submitting" @change="validateField('store_id')">
                <option value="">请选择门店</option>
                <option v-for="store in storeOptions" :key="store.value" :value="store.value">
                  {{ store.label }}
                </option>
              </select>
              <span v-if="errors.store_id" class="form__error">{{ errors.store_id }}</span>
            </label>
            <label class="form__field" :data-error="errors.campaign_id">
              <span>活动<em>*</em></span>
              <select class="input" v-model="form.campaignId" :disabled="submitting" @change="validateField('campaign_id')">
                <option value="">请选择活动</option>
                <option v-for="campaign in campaignOptions" :key="campaign.value" :value="campaign.value">
                  {{ campaign.label }}
                </option>
              </select>
              <span v-if="errors.campaign_id" class="form__error">{{ errors.campaign_id }}</span>
            </label>
            <label class="form__field" :data-error="errors.amount">
              <span>金额 (¥)<em>*</em></span>
              <input
                class="input"
                type="number"
                step="0.01"
                placeholder="请输入金额"
                v-model="form.amount"
                :disabled="submitting"
                @blur="validateField('amount')"
              />
              <span v-if="errors.amount" class="form__error">{{ errors.amount }}</span>
            </label>
          </div>
        </fieldset>

        <section class="card manual__card">
          <h2>附加信息</h2>
          <div class="form__grid form__grid--single">
            <label class="form__field">
              <span>渠道</span>
              <select class="input" v-model="form.channel" :disabled="submitting">
                <option v-for="option in channelOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>
            <label class="form__field">
              <span>推广人</span>
              <input
                class="input"
                type="text"
                placeholder="可选填推广人 ID"
                v-model="form.promoterId"
                :disabled="submitting"
              />
            </label>
            <label class="form__field form__field--textarea">
              <span>备注</span>
              <textarea
                class="textarea"
                rows="4"
                placeholder="记录补充说明，不超过 200 字"
                v-model="form.note"
                :disabled="submitting"
              />
            </label>
          </div>

          <div class="attachments">
            <header>
              <h3>补充材料</h3>
              <p>支持 JPG/PNG/PDF，单个 ≤ 5MB，最多 3 个。</p>
            </header>
            <div class="attachments__uploader" :data-disabled="attachmentsDisabled">
              <input
                ref="attachmentsInput"
                type="file"
                class="attachments__input"
                accept=".jpg,.jpeg,.png,.pdf"
                multiple
                :disabled="attachmentsDisabled"
                @change="onAttachmentsSelected"
              />
              <span>拖拽或点击上传补充材料</span>
            </div>
            <ul v-if="attachments.length" class="attachments__list">
              <li v-for="item in attachments" :key="item.id" class="attachments__item" :data-status="item.status">
                <span class="attachments__name">{{ item.name }}</span>
                <span class="attachments__size">{{ prettySize(item.size) }}</span>
                <span class="attachments__status">
                  <template v-if="item.status === 'done'">已上传</template>
                  <template v-else-if="item.status === 'uploading'">上传中...</template>
                  <template v-else-if="item.status === 'error'">{{ item.error || '失败' }}</template>
                </span>
                <button
                  type="button"
                  class="link-btn"
                  :disabled="item.status === 'uploading' && attachmentsUploading"
                  @click="removeAttachment(item.id)"
                >
                  删除
                </button>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <label class="manual__confirm">
        <input type="checkbox" v-model="confirmChecked" :disabled="submitting" />
        <span>我已阅读并遵守数据合规提示，确保信息来源合法真实。</span>
      </label>

      <footer class="manual__actions">
        <button type="button" class="btn btn--ghost" :disabled="submitting" @click="resetForm">重置</button>
        <button type="submit" class="btn" :disabled="submitting">
          {{ submitting ? '提交中...' : '提交订单' }}
        </button>
      </footer>
    </form>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { OrdersService, UploadsService } from '@/sdk';
import { mergeFieldErrors, validateAmount, validateIdNumber, validateName, validatePhone } from '@/utils/validators';

type AttachmentStatus = 'pending' | 'uploading' | 'done' | 'error';

type AttachmentItem = {
  id: string;
  name: string;
  size: number;
  status: AttachmentStatus;
  remoteId?: string;
  error?: string;
  file?: File;
};

const router = useRouter();

const form = reactive({
  phone: '',
  name: '',
  idType: 'cn_id',
  idNumber: '',
  storeId: '',
  campaignId: '',
  amount: '',
  channel: 'offline',
  promoterId: '',
  note: ''
});

const errors = reactive<Record<string, string>>({
  phone: '',
  name: '',
  id_number: '',
  store_id: '',
  campaign_id: '',
  amount: ''
});

const idTypeOptions = [
  { value: 'cn_id', label: '大陆身份证' },
  { value: 'passport', label: '护照' },
  { value: 'hmt', label: '港澳台通行证' }
];

const storeOptions = [
  { value: 'S001', label: '天河路旗舰店' },
  { value: 'S002', label: '海珠江畔店' },
  { value: 'S003', label: '越秀公园店' }
];

const campaignOptions = [
  { value: 'CAMP-01', label: '新客拉新 10 月' },
  { value: 'CAMP-02', label: '会员返场节' },
  { value: 'CAMP-03', label: '门店周年庆' }
];

const channelOptions = [
  { value: 'offline', label: '线下录单' },
  { value: 'wechat', label: '微信' },
  { value: 'h5', label: 'H5 微站' },
  { value: 'scan', label: '扫码' },
  { value: 'api', label: 'API 接口' }
];

const confirmChecked = ref(false);
const submitting = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

const attachments = ref<AttachmentItem[]>([]);
const attachmentsUploading = ref(false);
const attachmentsInput = ref<HTMLInputElement | null>(null);

const maxAttachmentCount = 3;
const maxAttachmentSize = 5 * 1024 * 1024;
const attachmentTypes = ['image/png', 'image/jpeg', 'application/pdf'];

const attachmentsDisabled = computed(
  () => attachments.value.length >= maxAttachmentCount || attachmentsUploading.value
);

function extractError(err: unknown) {
  if (err && typeof err === 'object') {
    const maybeError = err as { message?: string; body?: { message?: string } };
    if (maybeError.body?.message) return maybeError.body.message;
    if (maybeError.message) return maybeError.message;
  }
  return '操作失败，请稍后再试';
}

function prettySize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function trimForm() {
  form.phone = form.phone.trim();
  form.name = form.name.trim();
  form.idNumber = form.idNumber.trim();
  form.storeId = form.storeId.trim();
  form.campaignId = form.campaignId.trim();
  form.amount = form.amount.trim();
  form.promoterId = form.promoterId.trim();
  form.note = form.note.trim();
}

function validateField(key: keyof typeof errors | 'id_number') {
  trimForm();
  switch (key) {
    case 'phone':
      errors.phone = validatePhone(form.phone) || '';
      break;
    case 'name':
      errors.name = validateName(form.name) || '';
      break;
    case 'id_number':
      errors.id_number = validateIdNumber(form.idNumber) || '';
      break;
    case 'store_id':
      errors.store_id = form.storeId ? '' : '请选择门店';
      break;
    case 'campaign_id':
      errors.campaign_id = form.campaignId ? '' : '请选择活动';
      break;
    case 'amount':
      errors.amount = validateAmount(form.amount) || '';
      break;
    default:
      break;
  }
}

function validateForm() {
  trimForm();
  const checks = {
    phone: validatePhone(form.phone),
    name: validateName(form.name),
    id_number: validateIdNumber(form.idNumber),
    store_id: form.storeId ? null : '请选择门店',
    campaign_id: form.campaignId ? null : '请选择活动',
    amount: validateAmount(form.amount)
  };
  const merged = mergeFieldErrors(checks);
  (Object.keys(errors) as Array<keyof typeof errors>).forEach((key) => {
    if (key === 'id_number') {
      errors.id_number = merged[key] || '';
    } else {
      errors[key] = merged[key] || '';
    }
  });
  return Object.keys(merged).length === 0;
}

function resetForm() {
  form.phone = '';
  form.name = '';
  form.idType = 'cn_id';
  form.idNumber = '';
  form.storeId = '';
  form.campaignId = '';
  form.amount = '';
  form.channel = 'offline';
  form.promoterId = '';
  form.note = '';
  confirmChecked.value = false;
  (Object.keys(errors) as Array<keyof typeof errors>).forEach((key) => {
    errors[key] = '';
  });
  feedbackMessage.value = '';
  errorMessage.value = '';
}

function resetAttachmentInput() {
  if (attachmentsInput.value) {
    attachmentsInput.value.value = '';
  }
}

async function onAttachmentsSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  resetAttachmentInput();
  if (!files.length) return;

  const available = maxAttachmentCount - attachments.value.length;
  if (available <= 0) return;

  const accepted: AttachmentItem[] = [];
  const rejected: string[] = [];

  files.slice(0, available).forEach((file) => {
    if (!attachmentTypes.includes(file.type)) {
      rejected.push(`${file.name} 格式不支持`);
      return;
    }
    if (file.size > maxAttachmentSize) {
      rejected.push(`${file.name} 超过 5MB 限制`);
      return;
    }
    accepted.push({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      name: file.name,
      size: file.size,
      status: 'pending',
      file
    });
  });

  if (rejected.length) {
    errorMessage.value = rejected.join('；');
  }

  if (!accepted.length) return;

  attachments.value = [...attachments.value, ...accepted];
  await uploadAttachments(accepted);
}

async function uploadAttachments(items: AttachmentItem[]) {
  attachmentsUploading.value = true;
  try {
    const response = await UploadsService.createUploadPolicy({
      files: items.map((item) => ({
        filename: item.name,
        content_type: item.file?.type || 'application/octet-stream',
        size: item.size
      }))
    });
    const policies = response.uploads || [];
    for (let index = 0; index < items.length; index += 1) {
      const item = items[index];
      const policy = policies[index];
      if (!policy) {
        item.status = 'error';
        item.error = '缺少上传凭证';
        continue;
      }
      item.status = 'uploading';
      try {
        const result = await fetch(policy.upload_url, {
          method: 'PUT',
          body: item.file,
          headers: policy.headers || {}
        });
        if (!result.ok) {
          throw new Error(`上传失败 (${result.status})`);
        }
        item.status = 'done';
        item.remoteId = policy.file_id;
        item.file = undefined;
      } catch (err) {
        item.status = 'error';
        item.error = extractError(err);
      }
    }
  } catch (err) {
    const message = extractError(err);
    errorMessage.value = message;
    items.forEach((item) => {
      item.status = 'error';
      item.error = message;
    });
  } finally {
    attachmentsUploading.value = false;
  }
}

function removeAttachment(id: string) {
  attachments.value = attachments.value.filter((item) => item.id !== id);
}

async function submit() {
  errorMessage.value = '';
  feedbackMessage.value = '';

  if (!validateForm()) {
    errorMessage.value = '请完善必填项后再提交';
    return;
  }

  if (!confirmChecked.value) {
    errorMessage.value = '请勾选合规确认后再提交';
    return;
  }

  if (form.note && form.note.length > 200) {
    errorMessage.value = '备注最多 200 字';
    return;
  }

  if (attachments.value.some((item) => item.status === 'uploading')) {
    errorMessage.value = '附件上传中，请稍后再试';
    return;
  }

  submitting.value = true;
  try {
    const attachmentIds = attachments.value.filter((item) => item.remoteId).map((item) => item.remoteId!) || [];
    const fields: Record<string, string> = {
      phone: form.phone,
      name: form.name,
      id_type: form.idType,
      id_number: form.idNumber,
      store_id: form.storeId,
      campaign_id: form.campaignId,
      amount: form.amount,
      channel: form.channel
    };
    if (form.promoterId) fields.promoter_id = form.promoterId;
    if (form.note) fields.note = form.note;
    if (attachmentIds.length) fields.attachments = JSON.stringify(attachmentIds);

    const response = await OrdersService.submitOrder({
      fields,
      confirm_flag: true
    });

    feedbackMessage.value = '订单创建成功，正在跳转详情...';
    window.setTimeout(() => {
      router.push(`/orders/${response.order_id}`);
    }, 600);
  } catch (err) {
    errorMessage.value = extractError(err);
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$color-text-muted: rgba($color-text-strong, 0.72);
$radius-lg: 0.75rem;
$shadow-card: 0 16px 32px rgba($color-text-strong, 0.06);
$color-error: #dc2626;
$color-warning-soft: #fef3c7;
$color-warning-strong: #b45309;

.manual {
  display: grid;
  gap: $spacing-24;
}

.manual__head {
  display: flex;
  justify-content: space-between;
  gap: $spacing-16;
}

.manual__title {
  margin: 0 0 $spacing-8;
  font-size: 1.75rem;
}

.manual__subtitle {
  margin: 0;
  color: $color-text-muted;
}

.manual__notice {
  padding: $spacing-16;
  border-radius: $radius-lg;
  background: $color-warning-soft;
  color: $color-warning-strong;
  display: flex;
  gap: $spacing-12;
  font-size: 0.95rem;
}

.manual__form {
  display: grid;
  gap: $spacing-24;
}

.manual__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: $spacing-24;
}

.manual__card {
  background: $color-surface-0;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-lg;
  padding: $spacing-24;
  box-shadow: $shadow-card;
  display: grid;
  gap: $spacing-16;
}

.manual__card > legend {
  font-size: 1.125rem;
  font-weight: 600;
}

.manual__card > h2 {
  margin: 0;
  font-size: 1.125rem;
}

.form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-16;
}

.form__grid--single {
  grid-template-columns: 1fr;
}

.form__field {
  display: grid;
  gap: 0.5rem;
  font-size: 0.95rem;
}

.form__field span {
  font-weight: 500;
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}

.form__field em {
  color: $color-error;
  font-style: normal;
}

.form__combo {
  display: grid;
  grid-template-columns: 10rem 1fr;
  gap: $spacing-8;
}

.form__field--combo select {
  min-width: 0;
}

.form__field--textarea textarea {
  resize: vertical;
}

.input,
.textarea {
  width: 100%;
  padding: $spacing-10 $spacing-12;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  font: inherit;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus,
.textarea:focus,
select:focus {
  border-color: $color-primary-300;
  box-shadow: 0 0 0 2px rgba($color-primary-300, 0.2);
  outline: none;
}

.form__error {
  color: $color-error;
  font-size: 0.8rem;
}

.attachments {
  display: grid;
  gap: $spacing-12;
}

.attachments header {
  display: grid;
  gap: 0.5rem;
}

.attachments header h3 {
  margin: 0;
  font-size: 1rem;
}

.attachments header p {
  margin: 0;
  font-size: 0.85rem;
  color: $color-text-muted;
}

.attachments__uploader {
  position: relative;
  border: 2px dashed $color-surface-200;
  border-radius: $radius-lg;
  padding: $spacing-16;
  text-align: center;
  color: $color-text-muted;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.attachments__uploader:hover {
  border-color: $color-primary-300;
  color: $color-primary-700;
}

.attachments__uploader[data-disabled='true'] {
  opacity: 0.6;
  cursor: not-allowed;
}

.attachments__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.attachments__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: grid;
  gap: $spacing-8;
}

.attachments__item {
  display: grid;
  grid-template-columns: 1fr auto auto auto;
  gap: $spacing-12;
  align-items: center;
  padding: $spacing-10 $spacing-12;
  border: $border-width-1 solid $color-surface-200;
  border-radius: 0.625rem;
  background: $color-surface-50;
  font-size: 0.9rem;
}

.attachments__status {
  justify-self: end;
  color: $color-text-muted;
}

.attachments__item[data-status='error'] .attachments__status {
  color: $color-error;
}

.manual__confirm {
  display: flex;
  align-items: center;
  gap: $spacing-10;
}

.manual__actions {
  display: flex;
  justify-content: flex-end;
  gap: $spacing-12;
}

.feedback {
  margin: 0;
  padding: $spacing-12 $spacing-16;
  border-radius: $radius-8;
  background: rgba($color-primary-50, 0.85);
  color: $color-primary-700;
}

.feedback--error {
  background: rgba($color-error, 0.12);
  color: $color-error;
}

@media (max-width: 75rem) {
  .manual__grid {
    grid-template-columns: 1fr;
  }

  .form__grid {
    grid-template-columns: 1fr;
  }

  .form__combo {
    grid-template-columns: 1fr;
  }
}
</style>
