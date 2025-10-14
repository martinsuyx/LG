<template>
  <Modal :model-value="modelValue" @update:modelValue="onVisibleChange" @confirm="handleConfirm">
    <template #title>上传报表</template>
    <div class="upload-modal">
      <section class="upload-modal__intro">
        <p>
          支持一次上传多个 Excel / CSV 文件，系统会自动识别模板并解析字段映射。若模板未命中，可在提交后补充配置。
        </p>
      </section>
      <label class="upload-modal__drop" :data-disabled="loading">
        <input
          ref="fileInput"
          class="upload-modal__input"
          type="file"
          accept=".xls,.xlsx,.csv"
          multiple
          :disabled="loading"
          @change="onFileChange"
        />
        <p class="upload-modal__hint">
          <strong>点击或拖拽文件到此处</strong>
          <span>支持扩展名：.xls / .xlsx / .csv，单文件建议小于 20 MB。</span>
        </p>
      </label>
      <ul v-if="items.length" class="upload-modal__list">
        <li v-for="item in items" :key="item.id" class="upload-modal__item" :data-status="item.status">
          <div class="upload-modal__item-meta">
            <strong>{{ item.file.name }}</strong>
            <span>{{ formatSize(item.file.size) }}</span>
          </div>
          <button type="button" class="upload-modal__remove" :disabled="loading" @click="removeItem(item.id)">移除</button>
        </li>
      </ul>
      <p v-else class="upload-modal__empty">尚未选择文件。</p>
      <p v-if="errorMessage" class="upload-modal__error">{{ errorMessage }}</p>
    </div>
    <template #footer>
      <Button variant="secondary" :disabled="loading" @click="close">取消</Button>
      <Button variant="primary" :loading="loading" :disabled="!items.length" @click="handleConfirm">提交解析</Button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Button from '@/components/Button.vue';
import Modal from '@/components/Modal.vue';

type UploadStatus = 'pending' | 'uploading' | 'done';
type UploadItem = { id: string; file: File; status: UploadStatus };

const props = defineProps<{
  modelValue: boolean;
  loading?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'submit', files: File[]): void;
}>();

const items = ref<UploadItem[]>([]);
const errorMessage = ref('');
const fileInput = ref<HTMLInputElement | null>(null);

watch(
  () => props.modelValue,
  (visible) => {
    if (!visible) {
      reset();
    }
  }
);

function onVisibleChange(value: boolean) {
  emit('update:modelValue', value);
}

function close() {
  emit('update:modelValue', false);
}

function reset() {
  items.value = [];
  errorMessage.value = '';
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function onFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  if (!target.files) return;
  appendFiles(Array.from(target.files));
  target.value = '';
}

function appendFiles(files: File[]) {
  errorMessage.value = '';
  if (!files.length) return;
  const prepared: UploadItem[] = files.map((file) => ({
    id: crypto.randomUUID(),
    file,
    status: 'pending'
  }));
  items.value = [...items.value, ...prepared];
}

function removeItem(id: string) {
  if (props.loading) return;
  items.value = items.value.filter((item) => item.id !== id);
}

function handleConfirm() {
  if (!items.value.length) {
    errorMessage.value = '请先选择需要上传的报表文件。';
    return;
  }
  errorMessage.value = '';
  emit(
    'submit',
    items.value.map((item) => item.file)
  );
}

function formatSize(size: number) {
  if (!Number.isFinite(size)) return '未知大小';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.upload-modal {
  display: flex;
  flex-direction: column;
  gap: $spacing-16;
  color: $text-muted;
  font-size: $text-14-regular-fs;
}

.upload-modal__intro {
  padding: 0 $spacing-8;
  color: $text-muted;
  font-size: $text-12-regular-fs;
  line-height: $text-12-regular-lh;
}

.upload-modal__drop {
  position: relative;
  border: $border-1 dashed $primary-200;
  border-radius: $radius-12;
  padding: $spacing-20;
  background: $primary-50;
  color: $text-strong;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: $spacing-8;
  text-align: center;
  transition: $transition-fast;

  &:hover {
    border-color: $primary-300;
    background: rgba($primary-100, 0.6);
  }

  &[data-disabled='true'] {
    opacity: $disabled-opacity;
    cursor: not-allowed;
  }
}

.upload-modal__input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.upload-modal__hint {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);
  font-size: $text-12-regular-fs;
  color: $text-muted;

  strong {
    color: $text-strong;
    font-size: $text-14-regular-fs;
  }
}

.upload-modal__list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: $border-1 solid $surface-200;
  border-radius: $radius-12;
  background: $surface-0;
  max-height: 14rem;
  overflow: auto;
}

.upload-modal__item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: $spacing-12 $spacing-16;
  border-bottom: $border-1 solid $surface-200;
  font-size: $text-12-regular-fs;
  color: $text-strong;

  &:last-child {
    border-bottom: none;
  }
}

.upload-modal__item-meta {
  display: flex;
  flex-direction: column;
  gap: calc(#{$spacing-8} / 2);

  strong {
    font-size: $text-14-regular-fs;
    color: $text-strong;
  }

  span {
    color: $text-muted;
  }
}

.upload-modal__remove {
  background: transparent;
  border: none;
  color: $primary-700;
  cursor: pointer;
  font-size: $text-12-regular-fs;
  padding: $spacing-8;
  border-radius: $radius-8;

  &:hover {
    background: $primary-50;
  }

  &:disabled {
    opacity: $disabled-opacity;
    cursor: not-allowed;
  }
}

.upload-modal__empty {
  text-align: center;
  font-size: $text-12-regular-fs;
  color: $text-muted;
  padding: $spacing-12;
}

.upload-modal__error {
  color: $danger-700;
  font-size: $text-12-regular-fs;
  text-align: left;
  padding: 0 $spacing-8;
}
</style>
