// =============================
// File: apps/admin-web/src/components/Pagination.vue
// =============================
<template>
  <nav class="jg-pager" role="navigation" aria-label="Pagination">
    <button class="jg-pager__btn" :disabled="page<=1" @click="$emit('update:page', page-1)">上一页</button>
    <span class="jg-pager__info">第 {{ page }} / {{ pages }} 页</span>
    <button class="jg-pager__btn" :disabled="page>=pages" @click="$emit('update:page', page+1)">下一页</button>
    <select class="jg-pager__size" :value="pageSize" @change="$emit('update:pageSize', Number(($event.target as HTMLSelectElement).value))">
      <option v-for="s in sizes" :key="s" :value="s">每页 {{ s }}</option>
    </select>
  </nav>
</template>

<script setup lang="ts">
const props = withDefaults(
  defineProps<{ page: number; pages: number; pageSize: number; sizes?: number[] }>(),
  { sizes: () => [20, 50, 100, 200] }
);
</script>

<style scoped lang="scss">
@use '@/styles/variables.scss' as *;

$control-height: calc(#{$spacing-16} * 2.25);

.jg-pager {
  display: flex;
  align-items: center;
  gap: $spacing-12;
  padding: $spacing-12;
}

.jg-pager__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: $control-height;
  padding: 0 $spacing-12;
  border-radius: $radius-8;
  border: $border-width-1 solid $color-surface-200;
  background: $color-surface-100;
  color: $color-text-strong;
  font: inherit;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.jg-pager__btn:hover:not(:disabled) {
  background: $color-surface-200;
}

.jg-pager__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.jg-pager__info {
  color: $color-surface-500;
  font-size: $font-size-12;
}

.jg-pager__size {
  height: $control-height;
  border: $border-width-1 solid $color-surface-200;
  border-radius: $radius-8;
  background: $color-surface-0;
  color: $color-text-strong;
  padding: 0 $spacing-12;
  font: inherit;
}
</style>
