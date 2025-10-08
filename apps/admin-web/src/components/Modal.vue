// =============================
// File: apps/admin-web/src/components/Modal.vue
// =============================
<template>
  <teleport to="body">
    <div v-if="modelValue" class="jg-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown.esc.prevent="close">
      <div class="jg-modal__backdrop" @click="close" />
      <div class="jg-modal__panel" ref="panel" tabindex="-1">
        <header class="jg-modal__header">
          <h3 class="jg-modal__title" :id="titleId"><slot name="title" /></h3>
          <button class="jg-modal__close" @click="close" aria-label="Close">
            ✕
          </button>
        </header>
        <section class="jg-modal__body"><slot /></section>
        <footer class="jg-modal__footer">
          <slot name="footer">
            <Button variant="secondary" @click="close">取消</Button>
            <Button variant="primary" @click="confirm">确定</Button>
          </slot>
        </footer>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import Button from './Button.vue'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void, (e:'confirm'): void }>()

const panel = ref<HTMLElement>()
const titleId = `dlg-${Math.random().toString(36).slice(2,8)}`

function close() { emit('update:modelValue', false) }
function confirm() { emit('confirm'); close() }

watch(() => props.modelValue, (v) => { if (v) queueMicrotask(() => panel.value?.focus()) })

onMounted(() => { if (props.modelValue) panel.value?.focus() })
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

.jg-modal {
  position: fixed; inset: 0; z-index: $z-dialog;
  .jg-modal__backdrop { position: absolute; inset: 0; background: $overlay-700; backdrop-filter: $backdrop-blur; }
  .jg-modal__panel {
    position: relative; margin: $spacing-40 auto; width: min(90vw, $dialog-max-w);
    background: $surface-0; color: $text-strong; border-radius: $radius-16; box-shadow: $shadow-xl; outline: none;
  }
  .jg-modal__header { display:flex; align-items:center; justify-content:space-between; padding: $spacing-20 $spacing-24; border-bottom: $border-1 solid $surface-200; }
  .jg-modal__title { font-size: $title-18-semibold-fs; line-height: $title-18-semibold-lh; font-weight: $title-18-semibold-wt; }
  .jg-modal__close { background: transparent; border: 0; color: $text-subtle; cursor: pointer; padding: $spacing-8; border-radius: $radius-8; }
  .jg-modal__close:focus-visible { outline: $outline-focus solid $primary-300; box-shadow: $focus-ring-primary; }
  .jg-modal__body { padding: $spacing-24; }
  .jg-modal__footer { display:flex; gap: $spacing-12; justify-content:flex-end; padding: $spacing-16 $spacing-24; border-top: $border-1 solid $surface-200; }
}
</style>


