<template>
  <section class="intake">
    <header class="intake__head">
      <div>
        <h1 class="intake__title">AI 录单</h1>
        <p class="intake__subtitle">上传证件或资料照片，AI 将自动解析并预填关键字段，请核对后提交。</p>
      </div>
      <RouterLink class="btn btn--ghost" to="/intake/manual">转人工录单</RouterLink>
    </header>

    <div class="intake__grid">
      <section class="card intake__card">
        <header class="card__head">
          <h2>上传材料</h2>
          <p>支持 JPG/PNG，单张 ≤ 5MB，最多 5 张。</p>
        </header>

        <div class="uploader" :data-disabled="disableUpload">
          <input
            ref="fileInput"
            class="uploader__input"
            type="file"
            accept=".jpg,.jpeg,.png"
            multiple
            :disabled="disableUpload"
            @change="onFilesSelected"
          />
          <p class="uploader__hint">
            <strong>拖拽</strong>或<strong>点击</strong>上传身份证、合同等图片
          </p>
          <p class="uploader__sub">上传完成后将自动触发 AI 解析</p>
        </div>

        <ul class="uploader__list" v-if="uploadItems.length">
          <li v-for="item in uploadItems" :key="item.id" class="uploader__item" :data-status="item.status">
            <figure class="uploader__preview">
              <img v-if="item.preview" :src="item.preview" :alt="item.name" />
              <div v-else class="uploader__placeholder">{{ item.name.slice(0, 1).toUpperCase() }}</div>
            </figure>
            <div class="uploader__meta">
              <strong>{{ item.name }}</strong>
              <span>{{ prettySize(item.size) }}</span>
              <div v-if="item.status !== 'error'" class="progress">
                <div class="progress__bar" :style="{ width: `${item.progress}%` }"></div>
              </div>
              <p v-else class="progress progress--error">{{ item.error || '上传失败' }}</p>
            </div>
            <button
              type="button"
              class="link-btn uploader__remove"
              :disabled="uploading && item.status === 'uploading'"
              @click="removeFile(item.id)"
            >
              删除
            </button>
          </li>
        </ul>

        <div v-if="parseStatus !== 'idle'" class="parse-status" :data-status="parseStatus">
          <div class="progress">
            <div class="progress__bar" :style="{ width: `${parseProgress}%` }"></div>
          </div>
          <div class="parse-status__text">
            <span>{{ parseMessage }}</span>
            <button
              v-if="parseStatus === 'failed'"
              type="button"
              class="btn btn--ghost"
              :disabled="uploading || !hasRemoteFiles"
              @click="retryParsing"
            >
              重新解析
            </button>
          </div>
        </div>
      </section>

      <section class="card intake__card">
        <header class="card__head">
          <h2>解析结果</h2>
          <p>低置信度字段将标记为黄色，请完善后提交。</p>
        </header>

        <form class="form" @submit.prevent="submit">
          <div class="form__grid">
            <label
              v-for="meta in fieldMetas"
              :key="meta.key"
              class="form__field"
              :data-error="formErrors[meta.key]"
            >
              <span class="form__label">
                {{ meta.label }}
                <em v-if="meta.required">*</em>
                <small v-if="aiFieldMap[meta.key]" :data-low="isLowConfidence(meta.key)">
                  AI 置信度：{{ formatConfidence(aiFieldMap[meta.key].confidence) }}
                </small>
              </span>
              <input
                class="input"
                :class="{ 'is-low': isLowConfidence(meta.key) }"
                :type="meta.type"
                :placeholder="meta.placeholder"
                v-model="formValues[meta.key]"
                :disabled="submitting"
                @blur="validateSingle(meta.key)"
              />
              <span v-if="formErrors[meta.key]" class="form__error">{{ formErrors[meta.key] }}</span>
            </label>
          </div>

          <label class="form__confirm">
            <input type="checkbox" v-model="confirmChecked" :disabled="submitting" />
            <span>我已核对信息并确认无误</span>
          </label>

          <div class="form__actions">
            <button type="submit" class="btn" :disabled="!canSubmit">
              {{ submitting ? '提交中...' : '提交订单' }}
            </button>
          </div>
        </form>
      </section>
    </div>

    <p v-if="errorMessage" class="feedback feedback--error">{{ errorMessage }}</p>
    <p v-else-if="feedbackMessage" class="feedback">{{ feedbackMessage }}</p>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import {
  AiIntakeService,
  OrdersService,
  UploadsService,
  type AIIntakeField,
  type AIIntakeStatusResponse
} from '@/sdk';
import { mergeFieldErrors, validateAmount, validateIdNumber, validateName, validatePhone } from '@/utils/validators';

type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

type UploadItem = {
  id: string;
  name: string;
  size: number;
  preview: string;
  status: UploadStatus;
  progress: number;
  remoteId?: string;
  error?: string;
  file?: File;
};

const router = useRouter();

const maxFiles = 5;
const maxSizeBytes = 5 * 1024 * 1024;
const allowedTypes = ['image/png', 'image/jpeg'];
const pollInterval = 1500;

const uploadItems = ref<UploadItem[]>([]);
const uploading = ref(false);

const fileInput = ref<HTMLInputElement | null>(null);

const parseStatus = ref<'idle' | 'starting' | 'parsing' | 'parsed' | 'failed'>('idle');
const parseMessage = ref('');
const parseProgress = computed(() => {
  switch (parseStatus.value) {
    case 'starting':
      return 15;
    case 'parsing':
      return 65;
    case 'parsed':
      return 100;
    case 'failed':
      return 100;
    default:
      return 0;
  }
});

const pollTimer = ref<number | null>(null);
const jobId = ref('');
const aiFields = ref<AIIntakeField[]>([]);

const fieldMetas = [
  { key: 'name', label: '客户姓名', placeholder: '请输入姓名', required: true, type: 'text' },
  { key: 'phone', label: '手机号', placeholder: '请输入手机号', required: true, type: 'tel' },
  { key: 'id_number', label: '证件号', placeholder: '请输入证件号', required: true, type: 'text' },
  { key: 'store_id', label: '门店编码', placeholder: '请输入门店编码', required: true, type: 'text' },
  { key: 'campaign_id', label: '活动 ID', placeholder: '请输入活动 ID', required: true, type: 'text' },
  { key: 'amount', label: '订单金额 (¥)', placeholder: '请输入金额', required: true, type: 'number' }
] as const;

const formValues = reactive<Record<string, string>>(
  fieldMetas.reduce((acc, meta) => {
    acc[meta.key] = '';
    return acc;
  }, {} as Record<string, string>)
);

const formErrors = reactive<Record<string, string>>(
  fieldMetas.reduce((acc, meta) => {
    acc[meta.key] = '';
    return acc;
  }, {} as Record<string, string>)
);

const confirmChecked = ref(false);
const submitting = ref(false);
const feedbackMessage = ref('');
const errorMessage = ref('');

const remoteFileIds = computed(() =>
  uploadItems.value.filter((item) => item.remoteId && item.status === 'done').map((item) => item.remoteId!)
);
const hasRemoteFiles = computed(() => remoteFileIds.value.length > 0);

const aiFieldMap = computed(() =>
  aiFields.value.reduce<Record<string, AIIntakeField>>((acc, field) => {
    acc[field.key] = field;
    return acc;
  }, {})
);

const canSubmit = computed(() => parseStatus.value === 'parsed' && confirmChecked.value && !submitting.value);
const disableUpload = computed(() => uploading.value || uploadItems.value.length >= maxFiles);

function prettySize(size: number) {
  if (size >= 1024 * 1024) return `${(size / 1024 / 1024).toFixed(1)} MB`;
  if (size >= 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${size} B`;
}

function formatConfidence(confidence: number) {
  return `${Math.round(confidence * 100)}%`;
}

function isLowConfidence(key: string) {
  const field = aiFieldMap.value[key];
  return field ? field.confidence < 0.9 : false;
}

function extractError(err: unknown) {
  if (err && typeof err === 'object') {
    const maybeError = err as { message?: string; body?: { message?: string } };
    if (maybeError.body?.message) return maybeError.body.message;
    if (maybeError.message) return maybeError.message;
  }
  return '操作失败，请稍后再试';
}

function resetFileInput() {
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function revokePreview(item: UploadItem) {
  if (item.preview) {
    URL.revokeObjectURL(item.preview);
  }
}

function clearPolling() {
  if (pollTimer.value !== null) {
    window.clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
}

function resetParsingState() {
  clearPolling();
  parseStatus.value = 'idle';
  parseMessage.value = '';
  jobId.value = '';
  aiFields.value = [];
  feedbackMessage.value = '';
}

function normalizeFormValues() {
  fieldMetas.forEach((meta) => {
    formValues[meta.key] = formValues[meta.key].trim();
  });
}

function validateSingle(key: string) {
  normalizeFormValues();
  const value = formValues[key];
  let result: string | null = null;
  switch (key) {
    case 'name':
      result = validateName(value);
      break;
    case 'phone':
      result = validatePhone(value);
      break;
    case 'id_number':
      result = validateIdNumber(value);
      break;
    case 'store_id':
      result = value ? null : '请输入门店编码';
      break;
    case 'campaign_id':
      result = value ? null : '请输入活动 ID';
      break;
    case 'amount':
      result = validateAmount(value);
      break;
    default:
      result = null;
  }
  formErrors[key] = result || '';
}

function validateForm() {
  normalizeFormValues();
  const checks = {
    name: validateName(formValues.name),
    phone: validatePhone(formValues.phone),
    id_number: validateIdNumber(formValues.id_number),
    store_id: formValues.store_id ? null : '请输入门店编码',
    campaign_id: formValues.campaign_id ? null : '请输入活动 ID',
    amount: validateAmount(formValues.amount)
  };
  const errors = mergeFieldErrors(checks);
  fieldMetas.forEach((meta) => {
    formErrors[meta.key] = errors[meta.key] || '';
  });
  return Object.keys(errors).length === 0;
}

async function onFilesSelected(event: Event) {
  const target = event.target as HTMLInputElement;
  const files = target.files ? Array.from(target.files) : [];
  resetFileInput();
  if (!files.length) return;

  errorMessage.value = '';
  feedbackMessage.value = '';

  const availableSlots = maxFiles - uploadItems.value.length;
  if (availableSlots <= 0) return;

  const accepted: UploadItem[] = [];
  const rejectedMessages: string[] = [];

  files.slice(0, availableSlots).forEach((file) => {
    if (!allowedTypes.includes(file.type)) {
      rejectedMessages.push(`${file.name} 格式不支持`);
      return;
    }
    if (file.size > maxSizeBytes) {
      rejectedMessages.push(`${file.name} 超过 5MB 限制`);
      return;
    }
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    accepted.push({
      id,
      name: file.name,
      size: file.size,
      preview: URL.createObjectURL(file),
      status: 'pending',
      progress: 0,
      file
    });
  });

  if (rejectedMessages.length) {
    errorMessage.value = rejectedMessages.join('；');
  }

  if (!accepted.length) return;

  uploadItems.value = [...uploadItems.value, ...accepted];
  await uploadNewFiles(accepted);
}

async function uploadNewFiles(items: UploadItem[]) {
  uploading.value = true;
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
      item.progress = 20;
      try {
        const uploadResponse = await fetch(policy.upload_url, {
          method: 'PUT',
          body: item.file,
          headers: policy.headers || {}
        });
        if (!uploadResponse.ok) {
          throw new Error(`上传失败 (${uploadResponse.status})`);
        }
        item.progress = 100;
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
    uploading.value = false;
  }

  if (hasRemoteFiles.value) {
    await startParsing();
  }
}

async function startParsing() {
  if (!hasRemoteFiles.value) return;
  parseStatus.value = 'starting';
  parseMessage.value = '正在提交解析任务...';
  feedbackMessage.value = '';
  errorMessage.value = '';
  clearPolling();

  try {
    const response = await AiIntakeService.startAiIntake({
      images: remoteFileIds.value
    });
    jobId.value = response.job_id;
    parseStatus.value = 'parsing';
    parseMessage.value = 'AI 正在解析字段...';
    await fetchStatus();
    pollTimer.value = window.setInterval(fetchStatus, pollInterval);
  } catch (err) {
    parseStatus.value = 'failed';
    parseMessage.value = '解析任务提交失败，请重试';
    errorMessage.value = extractError(err);
  }
}

async function fetchStatus() {
  if (!jobId.value) return;
  try {
    const status = await AiIntakeService.getAiIntakeStatus(jobId.value);
    handleStatus(status);
  } catch (err) {
    clearPolling();
    parseStatus.value = 'failed';
    parseMessage.value = '解析状态获取失败，请重试';
    errorMessage.value = extractError(err);
  }
}

function handleStatus(status: AIIntakeStatusResponse) {
  switch (status.status) {
    case 'uploaded':
    case 'parsing':
      parseStatus.value = 'parsing';
      parseMessage.value = 'AI 正在解析字段...';
      break;
    case 'parsed':
      parseStatus.value = 'parsed';
      parseMessage.value = '解析完成，请核对结果';
      feedbackMessage.value = '解析完成，表单已自动填充关键字段。';
      aiFields.value = status.fields || [];
      aiFields.value.forEach((field) => {
        if (field.key in formValues) {
          formValues[field.key] = field.value ?? '';
        }
      });
      fieldMetas.forEach((meta) => {
        formErrors[meta.key] = '';
      });
      clearPolling();
      break;
    case 'failed':
      parseStatus.value = 'failed';
      parseMessage.value = '解析失败，可重试或转人工录单';
      errorMessage.value = status.errors?.join('；') || 'AI 解析失败，请检查资料质量';
      clearPolling();
      break;
    default:
      parseStatus.value = 'failed';
      parseMessage.value = '解析状态异常，请重试';
      errorMessage.value = '未知解析状态';
      clearPolling();
  }
}

function retryParsing() {
  if (uploading.value) return;
  startParsing();
}

function removeFile(id: string) {
  const item = uploadItems.value.find((upload) => upload.id === id);
  if (!item) return;
  if (uploading.value && item.status === 'uploading') return;

  revokePreview(item);
  uploadItems.value = uploadItems.value.filter((upload) => upload.id !== id);

  if (!hasRemoteFiles.value) {
    resetParsingState();
  }
}

async function submit() {
  errorMessage.value = '';
  feedbackMessage.value = '';

  if (!validateForm()) {
    errorMessage.value = '请检查必填字段后再提交';
    return;
  }

  if (!confirmChecked.value) {
    errorMessage.value = '请勾选确认已核对信息';
    return;
  }

  if (!jobId.value) {
    errorMessage.value = '解析任务尚未完成，请稍后重试';
    return;
  }

  submitting.value = true;
  try {
    const payload = fieldMetas.reduce<Record<string, string>>((acc, meta) => {
      acc[meta.key] = formValues[meta.key];
      return acc;
    }, {});
    const response = await OrdersService.submitOrder({
      job_id: jobId.value,
      fields: payload,
      confirm_flag: true
    });
    feedbackMessage.value = '提交成功，正在跳转订单详情...';
    window.setTimeout(() => {
      router.push(`/orders/${response.order_id}`);
    }, 600);
  } catch (err) {
    errorMessage.value = extractError(err);
  } finally {
    submitting.value = false;
  }
}

onBeforeUnmount(() => {
  clearPolling();
  uploadItems.value.forEach(revokePreview);
});
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$color-text-muted: rgba($color-text-strong, 0.72);
$radius-lg: 0.75rem;
$shadow-card: 0 16px 32px rgba($color-text-strong, 0.06);
$color-error: #dc2626;
$color-warning-soft: #fef3c7;
$color-warning-strong: #b45309;

.intake {
  display: grid;
  gap: $spacing-24;
}

.intake__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: $spacing-16;
}

.intake__title {
  margin: 0 0 $spacing-8;
  font-size: 1.75rem;
}

.intake__subtitle {
  margin: 0;
  color: $color-text-muted;
}

.intake__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-24;
}

.intake__card {
  display: grid;
  gap: $spacing-16;
  padding: $spacing-24;
  background: $color-surface-0;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-lg;
  box-shadow: $shadow-card;
}

.card__head > h2 {
  margin: 0 0 0.25rem;
  font-size: 1.125rem;
}

.card__head > p {
  margin: 0;
  color: $color-text-muted;
  font-size: 0.875rem;
}

.uploader {
  position: relative;
  border: 2px dashed $color-surface-200;
  border-radius: $radius-lg;
  padding: $spacing-24;
  text-align: center;
  color: $color-text-muted;
  transition: border-color 0.2s ease, color 0.2s ease;
}

.uploader:hover {
  border-color: $color-primary-300;
  color: $color-primary-700;
}

.uploader[data-disabled='true'] {
  opacity: 0.6;
  cursor: not-allowed;
}

.uploader__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.uploader__hint {
  margin: 0;
  font-weight: 500;
}

.uploader__sub {
  margin: 0.5rem 0 0;
  font-size: 0.875rem;
}

.uploader__list {
  display: grid;
  gap: $spacing-12;
  margin: 0;
  padding: 0;
  list-style: none;
}

.uploader__item {
  display: flex;
  gap: $spacing-12;
  align-items: center;
  padding: $spacing-12;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-lg;
  background: $color-surface-50;
}

.uploader__preview {
  width: 64px;
  height: 64px;
  border-radius: $radius-8;
  overflow: hidden;
  background: $color-surface-0;
  display: grid;
  place-items: center;
  font-weight: 600;
  color: $color-primary-700;
}

.uploader__preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.uploader__meta {
  flex: 1;
  display: grid;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.uploader__meta strong {
  font-size: 1rem;
}

.uploader__remove {
  flex-shrink: 0;
}

.progress {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 999px;
  background: $color-surface-100;
  overflow: hidden;
}

.progress__bar {
  position: absolute;
  inset: 0;
  width: 0;
  background: $color-primary-700;
  transition: width 0.3s ease;
}

.progress--error {
  color: $color-error;
  font-size: 0.875rem;
  margin: 0;
}

.parse-status {
  display: grid;
  gap: $spacing-8;
}

.parse-status__text {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: $spacing-8;
  font-size: 0.95rem;
}

.parse-status[data-status='failed'] .parse-status__text span {
  color: $color-error;
}

.form {
  display: grid;
  gap: $spacing-16;
}

.form__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: $spacing-16;
}

.form__field {
  display: grid;
  gap: 0.5rem;
}

.form__label {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  font-weight: 500;
}

.form__label em {
  color: $color-error;
  font-style: normal;
}

.form__label small {
  font-weight: 400;
  color: $color-text-muted;
  font-size: 0.75rem;
}

.form__label small[data-low='true'] {
  color: $color-warning-strong;
}

.input {
  width: 100%;
  padding: $spacing-10 $spacing-12;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.input:focus {
  border-color: $color-primary-300;
  box-shadow: 0 0 0 2px rgba($color-primary-300, 0.2);
  outline: none;
}

.input.is-low {
  background: $color-warning-soft;
  border-color: $color-warning-strong;
}

.form__error {
  color: $color-error;
  font-size: 0.8rem;
}

.form__confirm {
  display: flex;
  align-items: center;
  gap: $spacing-8;
  font-size: 0.95rem;
}

.form__actions {
  display: flex;
  gap: $spacing-8;
  justify-content: flex-end;
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
  .intake__grid {
    grid-template-columns: 1fr;
  }

  .form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
