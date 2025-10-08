// 目录建议：apps/admin-web/src/components/
// 本文件块包含多个文件的内容。请将对应片段分别落盘到目标路径。

// =============================
// File: apps/admin-web/src/components/Button.vue
// =============================
<template>
  <button
    :class="[
      'jg-btn',
      `jg-btn--${variant}`,
      `jg-btn--${size}`,
      { 'is-loading': loading, 'is-block': block, 'is-disabled': disabled }
    ]"
    :disabled="disabled || loading"
    :aria-busy="loading ? 'true' : 'false'"
    :aria-disabled="(disabled || loading) ? 'true' : 'false'"
    @click="onClick"
  >
    <span class="jg-btn__spinner" v-if="loading">
      <Spinner :size="size === 'lg' ? 20 : size === 'md' ? 16 : 14" />
    </span>
    <span class="jg-btn__icon" v-if="$slots.icon && !loading">
      <slot name="icon" />
    </span>
    <span class="jg-btn__label">
      <slot />
    </span>
  </button>
</template>

<script setup lang="ts">
import Spinner from './Spinner.vue'

interface Props {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'lg' | 'md' | 'sm'
  loading?: boolean
  disabled?: boolean
  block?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  loading: false,
  disabled: false,
  block: false,
})

const emit = defineEmits<{ (e: 'click', ev: MouseEvent): void }>()

function onClick(ev: MouseEvent) {
  if (props.disabled || props.loading) return
  emit('click', ev)
}
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *; // 只能使用 tokens（变量名以项目为准）

.jg-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: $spacing-8;
  border-radius: $radius-12;
  border: $border-1 solid transparent;
  font-size: $text-14-regular-fs;
  line-height: $text-14-regular-lh;
  font-weight: $text-14-regular-wt;
  padding: 0 $spacing-16;
  height: $control-md-h; // 例如 40，根据 tokens 定义
  color: $text-on-primary;
  background-color: $primary-600;
  transition: $transition-fast;
  cursor: pointer;
  user-select: none;

  &.jg-btn--lg {
    height: $control-lg-h; // 例如 48
    font-size: $text-16-semibold-fs;
    line-height: $text-16-semibold-lh;
    font-weight: $text-16-semibold-wt;
    padding: 0 $spacing-24;
    border-radius: $radius-16;
  }
  &.jg-btn--sm {
    height: $control-sm-h; // 例如 32
    font-size: $text-12-regular-fs;
    line-height: $text-12-regular-lh;
    font-weight: $text-12-regular-wt;
    padding: 0 $spacing-12;
    border-radius: $radius-8;
  }

  &.jg-btn--primary {
    background-color: $primary-600;
    color: $surface-on-primary;
    &:hover { background-color: $primary-700; }
    &:active { background-color: $primary-800; }
    &:focus-visible { outline: $outline-focus solid $primary-300; box-shadow: $focus-ring-primary; }
  }
  &.jg-btn--secondary {
    background-color: $surface-100;
    color: $text-strong;
    border-color: $surface-300;
    &:hover { background-color: $surface-200; }
    &:active { background-color: $surface-300; }
    &:focus-visible { outline: $outline-focus solid $primary-300; box-shadow: $focus-ring-primary; }
  }
  &.jg-btn--danger {
    background-color: $danger-600;
    color: $surface-on-danger;
    &:hover { background-color: $danger-700; }
    &:active { background-color: $danger-800; }
    &:focus-visible { outline: $outline-focus solid $danger-300; box-shadow: $focus-ring-danger; }
  }
  &.jg-btn--ghost {
    background-color: transparent;
    color: $primary-700;
    border-color: $primary-200;
    &:hover { background-color: $primary-50; }
    &:active { background-color: $primary-100; }
    &:focus-visible { outline: $outline-focus solid $primary-300; box-shadow: $focus-ring-primary; }
  }

  &.is-disabled,
  &:disabled {
    opacity: $disabled-opacity;
    cursor: not-allowed;
  }
  &.is-loading {
    pointer-events: none;
  }
  &.is-block { width: 100%; }

  .jg-btn__spinner { display: inline-flex; }
  .jg-btn__icon { display: inline-flex; }
}
</style>


